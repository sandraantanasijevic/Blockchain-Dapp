import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import abi from "./abi/VotingCommitReveal.json";

const CONTRACT_ADDRESS = import.meta.env.VITE_VOTING_ADDRESS;
const SEPOLIA_CHAIN_ID_DEC = 11155111;

export default function App() {
  const [account, setAccount] = useState(null);
  const [phase, setPhase] = useState(null);
  const [owner, setOwner] = useState(null);
  const [tally, setTally] = useState([]);
  const [voterAddr, setVoterAddr] = useState("");
  const [option, setOption] = useState(0);
  const [status, setStatus] = useState("");

  const storageKey = useMemo(
    () => (account ? `salt:${account}:${CONTRACT_ADDRESS}` : null),
    [account]
  );

  async function providerRO() {
    if (!window.ethereum) throw new Error("MetaMask nije pronađen");
    return new ethers.BrowserProvider(window.ethereum);
  }
  async function signerRW() {
    const p = await providerRO();
    return await p.getSigner();
  }
  async function contractRO() {
    const p = await providerRO();
    return new ethers.Contract(CONTRACT_ADDRESS, abi, p);
  }
  async function contractRW() {
    const s = await signerRW();
    return new ethers.Contract(CONTRACT_ADDRESS, abi, s);
  }

  async function ensureSepolia() {
    const p = await providerRO();
    const net = await p.getNetwork();
    if (Number(net.chainId) !== SEPOLIA_CHAIN_ID_DEC) {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xAA36A7" }], // sepolia
      });
    }
  }

  async function connect() {
    const p = await providerRO();
    const [acc] = await p.send("eth_requestAccounts", []);
    setAccount(acc);
    await ensureSepolia();
    await refresh();
  }

  async function refresh() {
    try {
      const c = await contractRO();
      const ph = await c.phase();
      setPhase(Number(ph));
      setOwner(await c.owner());
      const t = await c.getTally();
      setTally(t.map(n => Number(n)));
    } catch (e) {
      setStatus(e.message || String(e));
    }
  }

  // admin
  async function registerVoter() {
    try {
      const c = await contractRW();
      const tx = await c.registerVoter(voterAddr);
      setStatus("Registrujem birača...");
      await tx.wait();
      setStatus("Birač registrovan ✅");
    } catch (e) {
      setStatus(e.shortMessage || e.message || String(e));
    }
  }
  async function advancePhase(next) {
    try {
      const c = await contractRW();
      const tx = await c.advancePhaseManually(next);
      setStatus("Menjam fazu...");
      await tx.wait();
      setStatus("Faza promenjena ✅");
      await refresh();
    } catch (e) {
      setStatus(e.shortMessage || e.message || String(e));
    }
  }
  async function publishResults() {
    try {
      const c = await contractRW();
      const tx = await c.publishResults();
      setStatus("Objavljujem rezultate...");
      await tx.wait();
      setStatus("Rezultati objavljeni ✅");
      await refresh();
    } catch (e) {
      setStatus(e.shortMessage || e.message || String(e));
    }
  }

  //commit
  async function doCommit() {
    try {
      if (phase !== 1) return setStatus("Nije commit faza");
      const rand = ethers.hexlify(ethers.randomBytes(32));
      if (storageKey) localStorage.setItem(storageKey, rand);
      const commitment = ethers.keccak256(
        ethers.solidityPacked(["uint8", "bytes32"], [Number(option), rand])
      );
      const c = await contractRW();
      const tx = await c.commitVote(commitment);
      setStatus("Šaljem commit...");
      await tx.wait();
      setStatus("Commit potvrđen ✅");
    } catch (e) {
      setStatus(e.shortMessage || e.message || String(e));
    }
  }

  //reveal
  async function doReveal() {
    try {
      if (phase !== 2) return setStatus("Nije reveal faza");
      if (!storageKey) return setStatus("Nema account-a");
      const saved = localStorage.getItem(storageKey);
      if (!saved) return setStatus("Nema sačuvanog salt-a u ovom browseru");
      const c = await contractRW();
      const tx = await c.revealVote(Number(option), saved);
      setStatus("Šaljem reveal...");
      await tx.wait();
      localStorage.removeItem(storageKey);
      setStatus("Reveal potvrđen ✅");
      await refresh();
    } catch (e) {
      setStatus(e.shortMessage || e.message || String(e));
    }
  }

  useEffect(() => {
    if (!window.ethereum) return;
    const onAcc = (accs) => { setAccount(accs[0] || null); refresh(); };
    const onChain = () => { refresh(); };
    window.ethereum.on?.("accountsChanged", onAcc);
    window.ethereum.on?.("chainChanged", onChain);
    return () => {
      window.ethereum?.removeListener?.("accountsChanged", onAcc);
      window.ethereum?.removeListener?.("chainChanged", onChain);
    };
  }, []);

  const isOwner = owner && account && owner.toLowerCase() === account.toLowerCase();
  const phaseLabel = ["Registracija", "Commit", "Reveal", "Završeno"][phase ?? 0];

  return (
    <div style={{maxWidth: 820, margin: "40px auto", padding: 20, fontFamily: "system-ui"}}>
      <h1 style={{fontSize: 40, marginBottom: 10}}>🗳️ Blockchain Glasanje (Commit-Reveal)</h1>

      {!account ? (
        <button onClick={connect}>🔗 Poveži MetaMask</button>
      ) : (
        <div style={{marginBottom: 10}}>
          <b>Povezan nalog:</b> <code>{account}</code>
        </div>
      )}

      <div style={{marginBottom: 20}}>
        <div><b>Vlasnik ugovora:</b> <code>{owner || "..."}</code></div>
        <div><b>Trenutna faza:</b> {phaseLabel} ({phase ?? "..."})</div>
      </div>

      {isOwner && (
        <div style={{border:"1px solid #eee", borderRadius:12, padding:16, marginBottom:20}}>
          <h3>👑 Admin</h3>
          <div style={{display:"flex", gap:8, marginBottom:10}}>
            <input style={{flex:1}} placeholder="Adresa glasača"
              value={voterAddr} onChange={e=>setVoterAddr(e.target.value)} />
            <button onClick={registerVoter}>✅ Registruj</button>
          </div>
          <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
            <button onClick={()=>advancePhase(1)}>→ Commit</button>
            <button onClick={()=>advancePhase(2)}>→ Reveal</button>
            <button onClick={()=>advancePhase(3)}>→ Završeno</button>
            <button onClick={publishResults}>📢 Objavi rezultate</button>
            <button onClick={refresh}>🔄 Refresh</button>
          </div>
        </div>
      )}

      <div style={{border:"1px solid #eee", borderRadius:12, padding:16, marginBottom:20}}>
        <h3>🗳️ Glasanje</h3>
        <div>Izbor (0..N-1):</div>
        <input type="number" value={option} onChange={e=>setOption(Number(e.target.value))}
               style={{width:120, marginRight:8}} />
        <button disabled={phase!==1} onClick={doCommit}>Commit</button>
        <button disabled={phase!==2} onClick={doReveal} style={{marginLeft:8}}>Reveal</button>
        <div style={{fontSize:12, color:"#666", marginTop:6}}>
          Salt se automatski čuva u localStorage i koristi u reveal fazi.
        </div>
      </div>

      <div style={{border:"1px solid #eee", borderRadius:12, padding:16}}>
        <h3>📊 Rezultati</h3>
        {tally.length ? (
          <ul>
            {tally.map((n,i)=>(<li key={i}>Opcija {i}: <b>{n}</b></li>))}
          </ul>
        ) : (<div>Nema glasova još.</div>)}
      </div>

      {status && (
        <div style={{marginTop:16, padding:10, background:"#fff7d6", border:"1px solid #ffec9e", borderRadius:10}}>
          {status}
        </div>
      )}
    </div>
  );
}

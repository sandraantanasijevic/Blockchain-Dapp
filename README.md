# Blockchain Glasanje (Commit–Reveal)

**Decentralizovani sistem za bezbedno elektronsko glasanje zasnovan na blockchain tehnologiji.**  
Implementirano, koristeći **Ethereum Sepolia testnu mrežu**, **Hardhat**, **Solidity**, **React (Vite)** i **MetaMask**.


Ovaj projekat predstavlja sistem za glasanje koji obezbeđuje tajnost glasova do završetka procesa.  
Koristi **Commit–Reveal** mehanizam:
- U fazi *Commit*, glasač čuva hash svog glasa (kombinacija opcije i tajnog “salt”-a).
- U fazi *Reveal*, glasač otkriva stvaran glas i salt, čime se potvrđuje autentičnost njegovog commita.
- Glasanje se završava fazom *Završeno*, kada se objavljuju rezultati.

Na ovaj način postiže se:
 Tajnost glasova do kraja glasanja  
 Integritet podataka (nema mogućnosti promene)  
 Transparentnost (svi mogu verifikovati rezultate)


## Tehnologije

| Sloj | Tehnologije |
|------|--------------|
| Blockchain | Solidity, Hardhat, Ethers.js |
| Mreža | Ethereum Sepolia testnet |
| Frontend | React + Vite |
| Web3 integracija | MetaMask |
| Backend skripte | Node.js |
| Testiranje | Hardhat test runner |


## Struktura projekta
```
Blockchain-Dapp/
│
├── contracts/
│ └── VotingCommitReveal.sol
│
├── scripts/
│ └── deploy.js
│
├── test/
│ └── voting.js
│
├── frontend/
│ ├── src/
│ │ ├── App.jsx
│ │ └── abi/VotingCommitReveal.json
│ ├── .env
│ ├── index.html
│ └── package.json
│
├── hardhat.config.js
├── package.json
└── README.md
```
## Instalacija i pokretanje

### Backend (Hardhat)

Instaliraj zavisnosti:
```bash
npm install
Kreiraj .env fajl u root direktorijumu:

SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/<tvoj_api_key>
PRIVATE_KEY=0x<tvoj_privatni_kljuc_sa_MetaMask_naloga>
ETHERSCAN_API_KEY=<opciono>
Zatim pokreni deploy:

bash
npx hardhat run scripts/deploy.js --network sepolia
Zapamti adresu ugovora.

VotingCommitReveal deployed to: 0xABCDEF...
Frontend (React + Vite)
Pređi u frontend folder i instaliraj zavisnosti:

bash
cd frontend
npm install
U fajlu frontend/.env upiši:

VITE_VOTING_ADDRESS=0xABCDEF...    # adresa iz deploy-a
VITE_SEPOLIA_RPC=https://sepolia.infura.io/v3/<tvoj_api_key>
Pokreni aplikaciju:

bash
npm run dev
Aplikacija će biti dostupna na:
http://localhost:5173
 Uputstvo za glasanje
 Account 1 – Administrator(Sandra)
Poveži MetaMask (Account 1)

U polje “Adresa glasača” unesi adresu Account 2

Klikni Registruj

Klikni → Commit da pređeš u fazu glasanja

 Account 2 – Glasač
Poveži MetaMask (Account 2)

Unesi opciju (0, 1 ili 2)

Klikni Commit (glas se čuva kao hash)

Sačekaj prelazak u fazu Reveal

Klikni Reveal – otkrivaš stvaran glas i salt

 Faze
Faza	Opis
0 – Registracija	Admin registruje glasače
1 – Commit	Glasači čuvaju hash svog glasa
2 – Reveal	Glasači otkrivaju stvarne glasove
3 – Završeno	Rezultati se objavljuju javno

 Objavljivanje rezultata
Kada svi glasači završe reveal:

Admin klikne → Završeno
Klikne Objavi rezultate
Rezultati se prikazuju u sekciji “Rezultati”

Sigurnosni mehanizmi
Nema mogućnosti duplog glasa (jedan commit po glasaču)

Tajnost glasa obezbeđena do faze Reveal

Svi podaci se čuvaju na blockchainu (nepromenljivo)

Transparentnost – svako može proveriti glasove i rezultate

Kratko objašnjenje commit–reveal šeme
Commit:
Glasač izračunava hash:
keccak256(abi.encodePacked(option, salt, voter))
Taj hash se čuva u blockchainu bez otkrivanja stvarnog izbora.

Reveal:
Kasnije otkriva option i salt, a ugovor proverava da li se hash poklapa.
Ako da — glas se računa.

Testiranje
Pokreni testove ugovora:
npx hardhat test

English summary
Blockchain Voting DApp built on Ethereum Sepolia using Solidity, Hardhat, and React.
Implements a commit–reveal voting scheme ensuring ballot secrecy until reveal phase.
Includes voter registration, vote commitment, reveal verification, and result publishing.
Frontend connects via MetaMask and displays live contract state.


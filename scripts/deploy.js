
const hre = require("hardhat");

async function main() {
  const now = Math.floor(Date.now() / 1000);


  const registerDeadline = now + 60*60;
  const commitDeadline   = now + 2*60 * 60;
  const revealDeadline   = now + 3*60 * 60;

  const numOptions = 3; // broj kandidata

  const Voting = await hre.ethers.getContractFactory("VotingCommitReveal");
  const voting = await Voting.deploy(
    numOptions,
    registerDeadline,
    commitDeadline,
    revealDeadline
  );

  await voting.waitForDeployment();
  const address = await voting.getAddress();

  console.log("VotingCommitReveal deployed to:", address);
  console.log("Params:", {
    numOptions,
    registerDeadline,
    commitDeadline,
    revealDeadline,
  });
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });

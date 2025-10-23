const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VotingCommitReveal", function () {
  let owner, alice, bob, voting;

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();
    const now = Math.floor(Date.now() / 1000);

    const Voting = await ethers.getContractFactory("VotingCommitReveal");
    voting = await Voting.deploy(
      3,              // numOptions
      now + 60,       // registerDeadline
      now + 120,      // commitDeadline
      now + 180       // revealDeadline
    );
    await voting.waitForDeployment();
  });

  it("should let owner register a voter", async function () {
    await expect(voting.registerVoter(alice.address))
      .to.emit(voting, "VoterRegistered").withArgs(alice.address);

    const ok = await voting.isRegistered(alice.address);
    expect(ok).to.equal(true);
  });

  it("blocks double commit and double reveal", async function () {
    await voting.registerVoter(alice.address);

    await voting.advancePhaseManually(1);

    const salt = ethers.hexlify(ethers.randomBytes(32));
    const commit = ethers.keccak256(
      ethers.solidityPacked(["uint8", "bytes32"], [0, salt])
    );

    await expect(voting.connect(alice).commitVote(commit))
      .to.emit(voting, "VoteCommitted").withArgs(alice.address);

    // drugi commit iste adrese mora da pukne
    await expect(voting.connect(alice).commitVote(commit))
      .to.be.revertedWith("already committed");

    // Prebaci na Reveal
    await voting.advancePhaseManually(2);

    await expect(voting.connect(alice).revealVote(0, salt))
      .to.emit(voting, "VoteRevealed").withArgs(alice.address, 0);

    // drugi reveal mora da pukne
    await expect(voting.connect(alice).revealVote(0, salt))
      .to.be.revertedWith("already revealed");
  });

  it("tallies votes correctly after reveal", async function () {
    await voting.registerVoter(alice.address);
    await voting.registerVoter(bob.address);

    await voting.advancePhaseManually(1); //Commit

    const saltA = ethers.hexlify(ethers.randomBytes(32));
    const saltB = ethers.hexlify(ethers.randomBytes(32));

    const cA = ethers.keccak256(ethers.solidityPacked(["uint8", "bytes32"], [0, saltA]));
    const cB = ethers.keccak256(ethers.solidityPacked(["uint8", "bytes32"], [1, saltB]));

    await voting.connect(alice).commitVote(cA);
    await voting.connect(bob).commitVote(cB);

    await voting.advancePhaseManually(2); //Reveal

    await voting.connect(alice).revealVote(0, saltA);
    await voting.connect(bob).revealVote(1, saltB);

    await voting.advancePhaseManually(3); //Finished
    await expect(voting.publishResults()).to.emit(voting, "ResultsPublished");

    const tally = await voting.getTally();
    expect(Number(tally[0])).to.equal(1);
    expect(Number(tally[1])).to.equal(1);
  });
});

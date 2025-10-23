// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VotingCommitReveal {
    enum Phase { Register, Commit, Reveal, Finished }

    address public owner;
    Phase public phase;

    uint256 public numOptions;
    uint256 public registerDeadline;
    uint256 public commitDeadline;
    uint256 public revealDeadline;

    mapping(address => bool) public isRegistered;
    mapping(address => bytes32) public commitments;
    mapping(address => bool) public revealed;
    uint256[] public tally;

    event VoterRegistered(address indexed voter);
    event VoteCommitted(address indexed voter);
    event VoteRevealed(address indexed voter, uint8 option);
    event ResultsPublished(uint256[] results);

    modifier onlyOwner() { require(msg.sender == owner, "not owner"); _; }
    modifier inPhase(Phase p) { require(phase == p, "wrong phase"); _; }

    constructor(
        uint256 _numOptions,
        uint256 _registerDeadline,
        uint256 _commitDeadline,
        uint256 _revealDeadline
    ) {
        require(_numOptions >= 2, "min 2 options");
        require(_registerDeadline < _commitDeadline && _commitDeadline < _revealDeadline, "bad deadlines");

        owner = msg.sender;
        numOptions = _numOptions;
        tally = new uint256[](_numOptions);

        registerDeadline = _registerDeadline;
        commitDeadline = _commitDeadline;
        revealDeadline = _revealDeadline;

        phase = Phase.Register;
    }

    function _maybeAutoAdvance() internal {
        if (phase == Phase.Register && block.timestamp >= registerDeadline) {
            phase = Phase.Commit;
        }
        if (phase == Phase.Commit && block.timestamp >= commitDeadline) {
            phase = Phase.Reveal;
        }
        if (phase == Phase.Reveal && block.timestamp >= revealDeadline) {
            phase = Phase.Finished;
        }
    }

    function advancePhaseManually(Phase next) external onlyOwner {
        require(uint8(next) == uint8(phase) + 1, "must go in order");
        phase = next;
    }

    function registerVoter(address voter) external onlyOwner inPhase(Phase.Register) {
        require(!isRegistered[voter], "already registered");
        isRegistered[voter] = true;
        emit VoterRegistered(voter);
        _maybeAutoAdvance();
    }

    function commitVote(bytes32 commitment) external inPhase(Phase.Commit) {
        _maybeAutoAdvance();
        require(isRegistered[msg.sender], "not registered");
        require(commitments[msg.sender] == bytes32(0), "already committed");
        commitments[msg.sender] = commitment;
        emit VoteCommitted(msg.sender);
        _maybeAutoAdvance();
    }

    function revealVote(uint8 option, bytes32 salt) external inPhase(Phase.Reveal) {
        _maybeAutoAdvance();
        require(isRegistered[msg.sender], "not registered");
        require(!revealed[msg.sender], "already revealed");
        require(option < numOptions, "bad option");

        bytes32 expected = keccak256(abi.encodePacked(option, salt));
        require(commitments[msg.sender] == expected, "commit mismatch");

        revealed[msg.sender] = true;
        tally[option] += 1;

        emit VoteRevealed(msg.sender, option);
        _maybeAutoAdvance();
    }

    function publishResults() external onlyOwner inPhase(Phase.Finished) {
        emit ResultsPublished(tally);
    }

    function getTally() external view returns (uint256[] memory) {
        return tally;
    }
}

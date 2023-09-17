// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
import "hardhat/console.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";

// error NOT_Enough_FEE;
error Raffle__NOT_Enough_FEE();
error Raffle__TransferFailed();

contract Raffle is VRFConsumerBaseV2 {
    // State Variables
    address payable public owner;
    uint private immutable i_entranceFee; // i for immutable hint
    address payable[] private s_participations; // pay to winner so payable , s for storage hint
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint64 private immutable i_subscriptionId = 5309; // pick from https://vrf.chain.link/sepolia/new
    bytes32 private immutable i_keyHash; // used to set max gaslimit
    //"0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625"; // https://docs.chain.link/vrf/v2/subscription/supported-networks
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant NUM_WORDS = 1; // how many random number we want

    // Lottery Variables
    address private s_recentWinner;

    // Events
    event RaffleEntered(address indexed participation);
    event RequestedWinner(uint256 indexed requestId);
    event WinnerAnnounced(address indexed winner);

    constructor(
        address vrfCoordinatorV2,
        uint entranceFee,
        bytes32 gasLine,
        uint32 callbackGasLimit
    ) payable VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_entranceFee = entranceFee;
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_keyHash = gasLine;
        i_callbackGasLimit = callbackGasLimit;
    }

    function enterRaffle() public payable {
        // require(msg.value >= i_entranceFee,"Not Enough Fee"); // not gas efficiant as revert
        if (msg.value < i_entranceFee) {
            revert Raffle__NOT_Enough_FEE();
        }
        s_participations.push(payable(msg.sender)); // typecasting address to be payable
        emit RaffleEntered(msg.sender);
    }

    function requestRandomWinner() public {
        // need to get random number as an index of winner
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_keyHash, // keyHash / gasLane
            i_subscriptionId, // my_id
            REQUEST_CONFIRMATIONS, // how many confirmation blocks for chainlink node should wait before responding
            i_callbackGasLimit,
            NUM_WORDS
        );
        emit RequestedWinner(requestId);
    }

    function fulfillRandomWords(
        uint256 /*requestId*/, // could comment requestId and take only uint256 since no need to store it in a variable
        uint256[] memory randomWords
    ) internal override {
        /* as Random Number returnd is massive number
         and we have an array with size x then we need that number be mod% to the array size
          so that we can pick with it an index of the winner */

        uint256 WinnerIndex = randomWords[0] % s_participations.length;
        address payable winnerAddress = s_participations[WinnerIndex];
        s_recentWinner = winnerAddress;
        (bool success, ) = winnerAddress.call{value: address(this).balance}(""); // making transaction to winner , available to payable address
        if (!success) {
            revert Raffle__TransferFailed(); // instead of require
        }
        emit WinnerAnnounced(winnerAddress);
    }

    // view / pure functions (getters)
    function getEnteranceFee() public view returns (uint) {
        return i_entranceFee;
    }

    function getParticipation(uint index) public view returns (address) {
        return s_participations[index];
    }

    function getRecentWinner() public view returns (address) {
        return s_recentWinner;
    }
}

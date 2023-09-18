// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "hardhat/console.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AutomationCompatibleInterface.sol";

// error NOT_Enough_FEE;
error Raffle__NOT_Enough_FEE();
error Raffle__TransferFailed();
error Raffle__NotOpen();
error Raffle__NotReady(uint256 Balance, uint256 participations, uint256 state);

/**@title A sample Raffle Contract
 * @author Abdalrhman Mostafa & Patrick Collins
 * @notice This contract is for creating a sample raffle contract
 * @dev This implements the Chainlink VRF Version 2
 */

contract Raffle is VRFConsumerBaseV2, AutomationCompatibleInterface {
    // Types declartion
    enum State {
        Open, // uint256 0 -> open
        Calculating
    }

    // State Variables
    address payable public immutable i_owner;
    uint private immutable i_entranceFee; // i for immutable hint
    address payable[] private s_participations; // pay to winner so payable , s for storage hint
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint64 private immutable i_subscriptionId; // = 5309; // pick from https://vrf.chain.link/sepolia/new
    bytes32 private immutable i_keyHash; // used to set max gaslimit
    //"0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625"; // https://docs.chain.link/vrf/v2/subscription/supported-networks
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant NUM_WORDS = 1; // how many random number we want
    // keepers https://automation.chain.link/new-custom-logic

    // Lottery Variables
    address private s_recentWinner;
    State private s_state;
    uint256 private s_prevBlockTimeStamp;
    uint256 private immutable i_interval;

    // Events
    event RaffleEntered(address indexed participation);
    event RequestedWinner(uint256 indexed requestId);
    event WinnerAnnounced(address indexed winner);

    constructor(
        address vrfCoordinatorV2,
        uint entranceFee,
        bytes32 gasLine,
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        uint256 interval // time we want the contract to choose a winner after
    ) payable VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_entranceFee = entranceFee;
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_keyHash = gasLine;
        i_callbackGasLimit = callbackGasLimit;
        s_state = State.Open; // same as State(0)
        s_prevBlockTimeStamp = block.timestamp;
        i_interval = interval;
        i_owner = payable(msg.sender); // to give the owner a precentage of the balance
        i_subscriptionId = subscriptionId;
    }

    function enterRaffle() public payable {
        // require(msg.value >= i_entranceFee,"Not Enough Fee"); // not gas efficiant as revert
        if (msg.value < i_entranceFee) {
            revert Raffle__NOT_Enough_FEE();
        }
        if (s_state != State.Open) {
            revert Raffle__NotOpen();
        }
        s_participations.push(payable(msg.sender)); // typecasting address to be payable
        emit RaffleEntered(msg.sender);
    }

    function requestRandomWinner() private {
        // need to get random number as an index of winner
        s_state = State.Calculating;
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
        s_state = State.Open;
        s_participations = new address payable[](0); // reseting array to get new participations
        s_prevBlockTimeStamp = block.timestamp; // reseting the timestamp - update s_prevBlockTimeStamp to current when finished
        (bool success, ) = winnerAddress.call{
            value: (address(this).balance * 3) / 4
        }(""); // making transaction to winner , available to payable address
        (bool s, ) = i_owner.call{value: address(this).balance / 4}(""); // could use i_owner.transfer(address(this).balance / 4);
        if (!success || !s) {
            revert Raffle__TransferFailed(); // instead of require
        }
        emit WinnerAnnounced(winnerAddress);
    }

    /**
     * @notice chainlink keeper to automaticlly trigger action and run functons depends on events or time
     *  (keeper network automaticcly run our functions based on custome logic / time) ,
     * checkupkeep method run offchain , doesn't estimate gas from the blockchain ,
     *  when returns it will perform upkeep on chain (generating data is off chain)
     * argument datatype bytes means we could call even another functions
     * @dev This is the function that the Chainlink Keeper nodes call
     * they look for `upkeepNeeded` to return True.
     * the following should be true for this to return true:
     * 1. The time interval has passed between raffle runs.
     * 2. The lottery is open.
     * 3. The contract has ETH.
     * 4. Implicity, your subscription is funded with LINK.
     */

    function checkUpkeep(
        bytes memory /*checkData*/ // external can't be called from another functions so we will update it to public , calldata doesn't work with strings // could be view case it doesn't modify any state
    )
        public
        override
        returns (bool upkeepNeeded, bytes memory /*performData*/)
    {
        bool isOpen = (s_state == State.Open);
        // block.timestamp - returns the current time stamp of the blockchain when called
        bool timePassed = (block.timestamp - s_prevBlockTimeStamp) > i_interval;
        bool hasParticipation = s_participations.length > 0;
        bool hasBalance = address(this).balance > 0; // the contract funded by participations

        upkeepNeeded = isOpen && timePassed && hasBalance && hasParticipation;
        // return upkeepNeeded;
    }

    function performUpkeep(bytes calldata /*performData*/) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");
        if (!upkeepNeeded) {
            revert Raffle__NotReady(
                address(this).balance,
                s_participations.length,
                uint256(s_state)
            );
        }
        requestRandomWinner(); // once checkup true then request a random winner
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

    function getState() public view returns (State) {
        return s_state;
    }

    function getPrevTimeStamp() public view returns (uint) {
        return s_prevBlockTimeStamp;
    }

    function getInterval() public view returns (uint256) {
        return i_interval;
    }

    function getNumberOfPlayers() public view returns (uint256) {
        return s_participations.length;
    }

    function getNumWords() public pure returns (uint256) {
        return NUM_WORDS; //pure because it is in the bytecode of contract and not a storage variable (const)
    }

    function getRequestConfirmations() public pure returns (uint256) {
        return REQUEST_CONFIRMATIONS;
    }
}

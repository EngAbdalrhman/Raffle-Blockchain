// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
import "hardhat/console.sol";

// error NOT_Enough_FEE;
error Raffle__NOT_Enough_FEE();

contract Raffle {
    uint public unlockTime;
    address payable public owner;
    uint private immutable i_entranceFee;
    address payable[] private participations;

    event Withdrawal(uint amount, uint when);

    constructor(uint _unlockTime, uint entranceFee) payable {
        i_entranceFee = entranceFee;
        require(
            block.timestamp < _unlockTime,
            "Unlock time should be in the future"
        );

        unlockTime = _unlockTime;
        owner = payable(msg.sender);
    }

    function enterRaffle() public payable {
        // require(msg.value >= i_entranceFee,"Not Enough Fee"); // not gas efficiant as revert
        if (msg.value < i_entranceFee) {
            revert Raffle__NOT_Enough_FEE();
        }
    }

    function pickWinner() public {
        //
    }

    function getEnteranceFee() public view returns (uint) {
        return i_entranceFee;
    }

    function withdraw() public {
        // Uncomment this line, and the import of "hardhat/console.sol", to print a log in your terminal
        // console.log("Unlock time is %o and block timestamp is %o", unlockTime, block.timestamp);

        require(block.timestamp >= unlockTime, "You can't withdraw yet");
        require(msg.sender == owner, "You aren't the owner");

        emit Withdrawal(address(this).balance, block.timestamp);

        owner.transfer(address(this).balance);
    }
}

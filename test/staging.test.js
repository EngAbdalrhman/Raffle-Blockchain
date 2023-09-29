const { assert, expect } = require("chai");
const { network, deployments, ethers } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");

developmentChains.includes(network.name)
  ? describe.skip // ternery operator
  : describe("Raffle Unit Tests", function () {
      let raffleContract, raffleEntranceFee, interval; //, player , deployer of getNamedAccounts is in getSigners

      beforeEach(async () => {
        accounts = await ethers.getSigners(); // could also do with getNamedAccounts (deployer = (await getNamedAccounts()).deployer)
        //console.log(accounts);
        //   deployer = accounts[0]
        // player = accounts[1];
        raffleContract = await ethers.getContract("Raffle"); // Returns a new connection to the Raffle contract
        // console.log(raffleContract);
        // raffle = raffleContract.connect(player); // Returns a new instance of the Raffle contract connected to player
        raffleEntranceFee = await raffleContract.getEnteranceFee();
        interval = await raffleContract.getInterval();
      });
      describe("fullfill random words", function () {
        // descripe doesn't need to be async
        it("works with live chainlink vrf and automation", async function () {
          const startingTimeStamp = await raffleContract.getPrevTimeStamp();
          // setup a listerner to listen for enterraffle even incase it executed on bc fast
          await new Promise(async (resolve, reject) => {
            //console.log();
            raffleContract.once("WinnerAnnounced", async () => {
              console.log("Winner Picked!");
              // resolve();
              try {
                // assert here
                const recentWinner = await raffleContract.getRecentWinner();
                const raffleState = await raffleContract.getState();
                //const winnerEndBalance = await accounts[0].getBalance();
                const winnerEndBalance = await ethers.provider.getBalance(
                  accounts[0].address
                );
                const endingTimeStamp = await raffleContract.getPrevTimeStamp();
                // once choosing a winner the enterance array reset
                await expect(raffleContract.getParticipation(0)).to.be.reverted; // could use equality with 0 of number of participations
                assert.equal(recentWinner.toString(), accounts[0].address);
                assert.equal(raffleState, 0);
                /*assert.equal(
                  winnerEndBalance.toString(),
                  (winnerStartBalance + raffleEntranceFee).toString() //  winnerStartBalance.add(raffleEntranceFee).toString()
                );*/
                assert(endingTimeStamp > startingTimeStamp);
                resolve();
              } catch (error) {
                console.log(error);
                reject(error);
              }
            });
            // enter raffle
            await raffleContract.enterRaffle({ value: raffleEntranceFee });
            //const winnerStartBalance = await accounts[0].getBalance();
            const winnerStartBalance = await ethers.provider.getBalance(
              accounts[0].address
            );
            console.log("entered" + ", start balance = " + winnerStartBalance);
            // this code won't complete untill our listener has finished listining and we could set timeout
          });
        });
        //console.log();
      });
    });

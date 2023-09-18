const { network, ethers } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

const VRF_Fund = ethers.utils.parseEther("2");

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  const raffleEntranceFee = networkConfig[chainId]["raffleEntranceFee"]; // set enterance fee and passed to constractor / args of contract
  const gasLane = networkConfig[chainId]["gasLane"];
  const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"];
  const keepersUpdateInterval = networkConfig[chainId]["keepersUpdateInterval"];
  let vrfCoordinatorV2Address, subscriptionId;
  if (developmentChains.includes(network.name)) {
    // if a local network run
    const vrfCoordinatorV2Mock = await ethers.getContract(
      "VRFCoordinatorV2Mock"
    );
    vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;
    // get subscription id for localhost to automate the process
    const transactionResponse = await vrfCoordinatorV2Mock.createSubscription();
    const transactionRecipt = await transactionResponse.wait(1);
    subscriptionId = transactionRecipt.events[0].args.subId;
    // funding with link , usually do on a real network
    // Our mock makes it so we don't actually have to worry about sending fund
    await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, VRF_Fund);
  } else {
    vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"]; // get get (json)
    subscriptionId = networkConfig[chainId]["subscriptionId"];
  }

  const raffle = deploy("Raffle", {
    from: deployer,
    args: [
      vrfCoordinatorV2Address,
      raffleEntranceFee,
      gasLane,
      subscriptionId,
      callbackGasLimit,
      keepersUpdateInterval,
    ],
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  // Verify the deployment
  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    log("Verifying...");
    await verify(raffle.address, arguments);
  }
};

module.exports.tags = ["all", "raffle"];

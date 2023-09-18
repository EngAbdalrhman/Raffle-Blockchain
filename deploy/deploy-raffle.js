const { network, ethers } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../helper-hardhat-config");

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  const raffleEntranceFee = networkConfig[chainId]["raffleEntranceFee"]; // set enterance fee and passed to constractor / args of contract
  const gasLane = networkConfig[chainId]["gasLane"];
  let vrfCoordinatorV2Address;
  if (developmentChains.includes(network.name)) {
    // if a local network run
    const vrfCoordinatorV2Mock = await ethers.getContract(
      "VRFCoordinatorV2Mock"
    );
    vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;
  } else {
    vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"]; // get get (json)
  }

  const raffle = deploy("Raffle", {
    from: deployer,
    args: [vrfCoordinatorV2Address, raffleEntranceFee, gasLane],
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });
};

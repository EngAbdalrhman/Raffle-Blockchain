"use strict";

import { ethers } from "./ethers-5.6.esm.min.js";
import { abi, contractAddress } from "./constant.js";

const connectButton = document.querySelector(".btn_connect");
const EnterButton = document.querySelector(".btn_enter");
const RecentWinner = document.querySelector(".btn_recent_winner");
const enteranceFeeButton = document.querySelector(".btn_fee");
const addressButton = document.querySelector(".btn_address");
const ParticipationButton = document.querySelector(".btn_player");
const stateButton = document.querySelector(".btn_state");
const TimeStampButton = document.querySelector(".btn_prev_time");
const IntervalButton = document.querySelector(".btn_interval");
const PlayersButton = document.querySelector(".btn_no_players");
const RequestButton = document.querySelector(".btn_req");

connectButton.onclick = connect;
EnterButton.onclick = enterRaffle;
enteranceFeeButton.onclick = getEnteranceFee;
addressButton.onclick = checkAddress;
RecentWinner.onclick = getRecentWinner;
ParticipationButton.onclick = getParticipation;
stateButton.onclick = getState;
TimeStampButton.onclick = getPrevTimeStamp;
IntervalButton.onclick = getInterval;
PlayersButton.onclick = getNumberOfPlayers;
RequestButton.onclick = requestWinner;
async function connect() {
  if (typeof window.ethereum !== "undefined") {
    try {
      await ethereum.request({ method: "eth_requestAccounts" });
    } catch (error) {
      console.log(error);
    }
    connectButton.innerHTML = "Connected";
    const accounts = await ethereum.request({ method: "eth_accounts" });
    console.log(accounts);
  } else {
    // connectButton.innerHTML = "Please install MetaMask"
    alert("Please install MetaMask");
  }
}

async function checkAddress() {
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    // console.log("my address :" + (await signer.getAddress()));

    try {
      document.querySelector(".r").textContent = await signer.getAddress();
    } catch (error) {
      console.log(error);
    }
  } else {
    // transferTokensButton.innerHTML = "Please install MetaMask"
    alert("Please install MetaMask");
  }
}

async function enterRaffle() {
  console.log(`entering...`);
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);
    let amount = parseInt(document.querySelector(".Amount").value).toString();
    //amount = ethers.utils.parseEther(amount);
    try {
      const enter = await contract.enterRaffle({ value: amount }); // amount passed with value - "100000000000000000"
      console.log("transfer = " + enter);
    } catch (error) {
      console.log(error);
    }
  } else {
    // transferTokens.innerHTML = "Please install MetaMask"
    alert("Please install MetaMask");
  }
}

async function getEnteranceFee() {
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);
    try {
      const fee = await contract.getEnteranceFee();
      document.querySelector(".r").textContent = fee;
    } catch (error) {
      console.log(error);
    }
  } else {
    // balanceButton.innerHTML = "Please install MetaMask";
    alert("Please install MetaMask");
  }
}

async function getParticipation() {
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);
    let index = parseInt(document.querySelector(".player").value);
    if (index == null) {
      index = 0;
    }
    console.log(index);

    try {
      const player = await contract.getParticipation(index); // input index
      console.log(player);
      document.querySelector(".r").textContent = player;
    } catch (error) {
      console.log(error);
    }
  } else {
    // balanceButton.innerHTML = "Please install MetaMask";
    alert("Please install MetaMask");
  }
}

async function getRecentWinner() {
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);
    try {
      const winner = await contract.getRecentWinner();
      document.querySelector(".r").textContent = winner;
    } catch (error) {
      console.log(error);
    }
  } else {
    // balanceButton.innerHTML = "Please install MetaMask";
    alert("Please install MetaMask");
  }
}
async function getState() {
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);
    try {
      const s = await contract.getState();
      let state;
      if (s === 0) {
        state = "Open";
      } else if (s === 1) {
        state = "Calculating";
      }
      document.querySelector(".r").textContent = state;
    } catch (error) {
      console.log(error);
    }
  } else {
    // balanceButton.innerHTML = "Please install MetaMask";
    alert("Please install MetaMask");
  }
}

async function getPrevTimeStamp() {
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);
    try {
      const pts = await contract.getPrevTimeStamp();
      // let date = pts.toDate();
      let ts = convertTimestamp(pts);
      document.querySelector(".r").textContent = ts;
    } catch (error) {
      console.log(error);
    }
  } else {
    // balanceButton.innerHTML = "Please install MetaMask";
    alert("Please install MetaMask");
  }
}

async function getInterval() {
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);
    try {
      const interval = await contract.getInterval();
      document.querySelector(".r").textContent = interval;
    } catch (error) {
      console.log(error);
    }
  } else {
    // balanceButton.innerHTML = "Please install MetaMask";
    alert("Please install MetaMask");
  }
}

async function getNumberOfPlayers() {
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);
    try {
      const nop = await contract.getNumberOfPlayers();
      document.querySelector(".r").textContent = nop;
    } catch (error) {
      console.log(error);
    }
  } else {
    // balanceButton.innerHTML = "Please install MetaMask";
    alert("Please install MetaMask");
  }
}

async function requestWinner() {
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);
    try {
      await contract.performUpkeep([]); // { value: "50000000000000000" }
    } catch (error) {
      console.log(error);
    }
  } else {
    // balanceButton.innerHTML = "Please install MetaMask";
    alert("Please install MetaMask");
  }
}

function convertTimestamp(timestamp) {
  var d = new Date(timestamp * 1000), // Convert the passed timestamp to milliseconds
    yyyy = d.getFullYear(),
    mm = ("0" + (d.getMonth() + 1)).slice(-2), // Months are zero based. Add leading 0.
    dd = ("0" + d.getDate()).slice(-2), // Add leading 0.
    hh = d.getHours(),
    h = hh,
    min = ("0" + d.getMinutes()).slice(-2), // Add leading 0.
    ampm = "AM",
    time;

  if (hh > 12) {
    h = hh - 12;
    ampm = "PM";
  } else if (hh === 12) {
    h = 12;
    ampm = "PM";
  } else if (hh == 0) {
    h = 12;
  }

  // ie: 2014-03-24, 3:00 PM
  time = yyyy + "-" + mm + "-" + dd + ", " + h + ":" + min + " " + ampm;
  return time;
}

/*
function listenForTransactionMine(transactionResponse, provider) {
  console.log(`Mining ${transactionResponse.hash}`);
  return new Promise((resolve, reject) => {
    try {
      provider.once(transactionResponse.hash, (transactionReceipt) => {
        console.log(
          `Completed with ${transactionReceipt.confirmations} confirmations. `
        );
        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
}
*/

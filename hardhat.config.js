require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("dotenv").config();

// Conditionally require hardhat-gas-reporter
let gasReporter = {};
try {
  require("hardhat-gas-reporter");
  gasReporter = {
    enabled: true,
    currency: 'USD',
    gasPrice: 21
  };
} catch (error) {
  console.warn("hardhat-gas-reporter not installed");
}

module.exports = {
  solidity: "0.8.19",
  networks: {
    hardhat: {
      forking: {
        url: `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
        blockNumber: 3100000 // Use a specific block number
      }
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: 20000000000, // 20 gwei
      gasMultiplier: 1.2, // Multiply estimated gas by 1.2
      timeout: 90000 // 90 seconds
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  gasReporter: gasReporter,
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
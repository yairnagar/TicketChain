require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("dotenv").config();

// Conditionally require hardhat-gas-reporter
let gasReporter = {};
try {
  require("hardhat-gas-reporter");
  gasReporter = {
    enabled: process.env.REPORT_GAS === 'true', // Enable only if REPORT_GAS=true in the environment variables
    currency: 'USD',                           // Report gas in USD
    gasPrice: 21,                              // Set gas price to 21 Gwei for calculation
    coinmarketcap: process.env.COINMARKETCAP_API_KEY || undefined, // Optional, add CoinMarketCap API key if available
    outputFile: process.env.GAS_REPORT_FILE || undefined, // Optional, write gas reports to a file if set
    noColors: process.env.NO_COLORS === 'true', // Disable colors in report if set
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
        blockNumber: 3100000 // Use a specific block number for forking
      }
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: [process.env.PRIVATE_KEY], // Private key for deploying on Sepolia
      gasPrice: 20000000000, // Set gas price to 20 gwei
      gasMultiplier: 1.2,    // Multiply estimated gas by 1.2 for a buffer
      timeout: 90000 // 90 seconds timeout for transactions
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY // Etherscan API key for verifying contracts
  },
  gasReporter: gasReporter, // Add gas reporter configuration
  paths: {
    sources: "./contracts", // Path to contracts directory
    tests: "./test",        // Path to tests directory
    cache: "./cache",       // Path to cache directory
    artifacts: "./artifacts" // Path to artifacts directory
  }
};

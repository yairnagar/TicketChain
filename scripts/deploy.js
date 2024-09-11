const hre = require("hardhat");

async function deployContract(name, factory, ...args) {
  console.log(`Deploying ${name}...`);
  const contract = await factory.deploy(...args);
  console.log(`${name} deployment transaction hash:`, contract.deployTransaction.hash);
  
  console.log(`Waiting for ${name} deployment to be mined...`);
  await contract.deployed();
  console.log(`${name} deployed to:`, contract.address);
  return contract;
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  console.log("\nIMPORTANT: Make sure to run all tests before deployment!");
  console.log("Run 'npx hardhat test' to execute all tests.\n");

  // Prompt user to confirm they've run tests
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  await new Promise((resolve) => {
    readline.question('Have you run all tests? (yes/no): ', (answer) => {
      if (answer.toLowerCase() !== 'yes') {
        console.log("Please run all tests before deploying. Exiting...");
        process.exit(1);
      }
      readline.close();
      resolve();
    });
  });

  try {
    // Deploy EventManager
    const EventManager = await hre.ethers.getContractFactory("EventManager");
    const eventManager = await deployContract("EventManager", EventManager);

    // Deploy TicketNFT
    const TicketNFT = await hre.ethers.getContractFactory("TicketNFT");
    const ticketNFT = await deployContract("TicketNFT", TicketNFT, eventManager.address);

    // Deploy TicketMarketplace
    const TicketMarketplace = await hre.ethers.getContractFactory("TicketMarketplace");
    const ticketMarketplace = await deployContract("TicketMarketplace", TicketMarketplace, ticketNFT.address, eventManager.address);

    console.log("Deployment completed successfully");

    // Verify contracts on Etherscan
    console.log("Waiting for block confirmations...");
    await eventManager.deployTransaction.wait(5);
    await ticketNFT.deployTransaction.wait(5);
    await ticketMarketplace.deployTransaction.wait(5);

    console.log("Verifying contracts on Etherscan...");
    await hre.run("verify:verify", {
      address: eventManager.address,
      constructorArguments: [],
    });

    await hre.run("verify:verify", {
      address: ticketNFT.address,
      constructorArguments: [eventManager.address],
    });

    await hre.run("verify:verify", {
      address: ticketMarketplace.address,
      constructorArguments: [ticketNFT.address, eventManager.address],
    });

    console.log("Contracts verified on Etherscan");

    // Log all deployed contract addresses
    console.log("\nDeployed Contract Addresses:");
    console.log("EventManager:", eventManager.address);
    console.log("TicketNFT:", ticketNFT.address);
    console.log("TicketMarketplace:", ticketMarketplace.address);

  } catch (error) {
    console.error("Deployment failed:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
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

  try {
    // Deploy TicketNFT
    // const TicketNFT = await hre.ethers.getContractFactory("TicketNFT");
    // const ticketNFT = await deployContract("TicketNFT", TicketNFT);

    // Deploy TicketMarketplace
    const TicketMarketplace = await hre.ethers.getContractFactory("TicketMarketplace");
    const ticketMarketplace = await deployContract("TicketMarketplace", TicketMarketplace, '0x1A1CF724F991cbF74354Bf7bBAD25e42B410aD51');

    console.log("Deployment completed successfully");

    // Verify contracts on Etherscan
    // console.log("Waiting for block confirmations...");
    // await ticketNFT.deployTransaction.wait(5);
    // await ticketMarketplace.deployTransaction.wait(5);

    // console.log("Verifying contracts on Etherscan...");
    // await hre.run("verify:verify", {
    //   address: ticketNFT.address,
    //   constructorArguments: [],
    // });

    // await hre.run("verify:verify", {
    //   address: ticketMarketplace.address,
    //   constructorArguments: [ticketNFT.address],
    // });

    // console.log("Contracts verified on Etherscan");
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
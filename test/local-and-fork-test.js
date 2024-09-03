const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BlockTicket System", function() {
  let TicketNFT, ticketNFT, TicketMarketplace, marketplace;
  let owner, addr1, addr2, addr3;
  let mintFee, listingFee;

  beforeEach(async function() {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();

    TicketNFT = await ethers.getContractFactory("TicketNFT");
    ticketNFT = await TicketNFT.deploy();
    await ticketNFT.deployed();

    TicketMarketplace = await ethers.getContractFactory("TicketMarketplace");
    marketplace = await TicketMarketplace.deploy(ticketNFT.address);
    await marketplace.deployed();

    mintFee = await ticketNFT.mintFee();
    listingFee = await marketplace.listingFee();
  });

  describe("TicketNFT", function() {
    describe("Minting", function() {
      it("Should mint a single ticket", async function() {
        await ticketNFT.mintTicket("Test Event", Math.floor(Date.now() / 1000) + 86400, 0, "A1", { value: mintFee });
        expect(await ticketNFT.ownerOf(1)).to.equal(owner.address);
      });

      it("Should batch mint tickets", async function() {
        const eventName = "Batch Event";
        const eventDate = Math.floor(Date.now() / 1000) + 86400;
        const eventType = 2;
        const seatingInfoList = ["A1", "A2", "A3", "A4", "A5"];
        await ticketNFT.batchMintTickets(eventName, eventDate, eventType, seatingInfoList, { value: mintFee.mul(seatingInfoList.length) });
        
        for (let i = 1; i <= seatingInfoList.length; i++) {
          expect(await ticketNFT.ownerOf(i)).to.equal(owner.address);
        }
      });

      it("Should revert when minting with insufficient fee", async function() {
        await expect(
          ticketNFT.mintTicket("Test Event", Math.floor(Date.now() / 1000) + 86400, 0, "A1", { value: mintFee.sub(1) })
        ).to.be.revertedWith("Insufficient mint fee");
      });

      it("Should revert when batch minting exceeds MAX_BATCH_SIZE", async function() {
        const MAX_BATCH_SIZE = await ticketNFT.MAX_BATCH_SIZE();
        const seatingInfoList = Array(MAX_BATCH_SIZE.add(1).toNumber()).fill("A1");
        await expect(
          ticketNFT.batchMintTickets("Test Event", Math.floor(Date.now() / 1000) + 86400, 0, seatingInfoList, { value: mintFee.mul(seatingInfoList.length) })
        ).to.be.revertedWith("Invalid batch size");
      });
    });

    describe("Ticket Details", function() {
      it("Should return correct ticket details", async function() {
        const eventName = "Concert";
        const eventDate = Math.floor(Date.now() / 1000) + 86400;
        const eventType = 3;
        const seatingInfo = "B2";
        await ticketNFT.mintTicket(eventName, eventDate, eventType, seatingInfo, { value: mintFee });
        const [returnedEventName, returnedEventDate, returnedEventType, returnedSeatingInfo] = await ticketNFT.getTicketDetails(1);
        expect(returnedEventName).to.equal(eventName);
        expect(returnedEventDate).to.equal(eventDate);
        expect(returnedEventType).to.equal(eventType);
        expect(returnedSeatingInfo).to.equal(seatingInfo);
      });

      it("Should revert when querying non-existent token", async function() {
        await expect(ticketNFT.getTicketDetails(999)).to.be.revertedWith("ERC721: invalid token ID");
      });
    });

    describe("Owner Functions", function() {
      it("Should allow owner to set mint fee", async function() {
        const newFee = ethers.utils.parseEther("0.002");
        await ticketNFT.setMintFee(newFee);
        expect(await ticketNFT.mintFee()).to.equal(newFee);
      });

      it("Should revert when non-owner tries to set mint fee", async function() {
        const newFee = ethers.utils.parseEther("0.002");
        await expect(ticketNFT.connect(addr1).setMintFee(newFee)).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("Should allow owner to withdraw fees", async function() {
        await ticketNFT.mintTicket("Test Event", Math.floor(Date.now() / 1000) + 86400, 0, "A1", { value: mintFee });
        const initialBalance = await owner.getBalance();
        await ticketNFT.withdrawFees();
        const finalBalance = await owner.getBalance();
        expect(finalBalance.gt(initialBalance)).to.be.true;
      });
    });
  });

  describe("TicketMarketplace", function() {
    beforeEach(async function() {
      await ticketNFT.mintTicket("Test Event", Math.floor(Date.now() / 1000) + 86400, 0, "A1", { value: mintFee });
      await ticketNFT.approve(marketplace.address, 1);
    });

    describe("Listing", function() {
      it("Should list a ticket for sale", async function() {
        await marketplace.listTicket(1, ethers.utils.parseEther("0.1"), { value: listingFee });
        const listing = await marketplace.listings(1);
        expect(listing.price).to.equal(ethers.utils.parseEther("0.1"));
        expect(listing.seller).to.equal(owner.address);
      });

      it("Should batch list tickets", async function() {
        await ticketNFT.batchMintTickets("Batch Event", Math.floor(Date.now() / 1000) + 86400, 2, ["B1", "B2", "B3"], { value: mintFee.mul(3) });
        await ticketNFT.setApprovalForAll(marketplace.address, true);
        
        const tokenIds = [2, 3, 4];
        const prices = [ethers.utils.parseEther("0.1"), ethers.utils.parseEther("0.2"), ethers.utils.parseEther("0.3")];
        await marketplace.batchListTickets(tokenIds, prices, { value: listingFee.mul(3) });

        for (let i = 0; i < tokenIds.length; i++) {
          const listing = await marketplace.listings(tokenIds[i]);
          expect(listing.price).to.equal(prices[i]);
          expect(listing.seller).to.equal(owner.address);
        }
      });

      it("Should revert when listing with insufficient fee", async function() {
        await expect(
          marketplace.listTicket(1, ethers.utils.parseEther("0.1"), { value: listingFee.sub(1) })
        ).to.be.revertedWith("Insufficient listing fee");
      });
    });

    describe("Buying", function() {
      beforeEach(async function() {
        await marketplace.listTicket(1, ethers.utils.parseEther("0.1"), { value: listingFee });
      });

      it("Should allow buying a listed ticket", async function() {
        await marketplace.connect(addr1).buyTicket(1, { value: ethers.utils.parseEther("0.1") });
        expect(await ticketNFT.ownerOf(1)).to.equal(addr1.address);
      });

      it("Should revert when buying with insufficient payment", async function() {
        await expect(
          marketplace.connect(addr1).buyTicket(1, { value: ethers.utils.parseEther("0.05") })
        ).to.be.revertedWith("Insufficient payment");
      });

      it("Should refund excess payment", async function() {
        const buyerInitialBalance = await addr1.getBalance();
        await marketplace.connect(addr1).buyTicket(1, { value: ethers.utils.parseEther("0.15") });
        const buyerFinalBalance = await addr1.getBalance();
        expect(buyerInitialBalance.sub(buyerFinalBalance)).to.be.lt(ethers.utils.parseEther("0.11")); // Accounting for gas costs
      });
    });

    describe("Cancelling", function() {
      beforeEach(async function() {
        await marketplace.listTicket(1, ethers.utils.parseEther("0.1"), { value: listingFee });
      });

      it("Should allow seller to cancel listing", async function() {
        await marketplace.cancelListing(1);
        const listing = await marketplace.listings(1);
        expect(listing.price).to.equal(0);
        expect(listing.seller).to.equal(ethers.constants.AddressZero);
      });

      it("Should revert when non-seller tries to cancel listing", async function() {
        await expect(marketplace.connect(addr1).cancelListing(1)).to.be.revertedWith("Not the seller");
      });
    });

    describe("Querying", function() {
      it("Should return all listed tickets", async function() {
        await ticketNFT.batchMintTickets("Batch Event", Math.floor(Date.now() / 1000) + 86400, 2, ["B1", "B2"], { value: mintFee.mul(2) });
        await ticketNFT.setApprovalForAll(marketplace.address, true);
        await marketplace.batchListTickets([1, 2, 3], [ethers.utils.parseEther("0.1"), ethers.utils.parseEther("0.2"), ethers.utils.parseEther("0.3")], { value: listingFee.mul(3) });

        const [tokenIds, prices, sellers, eventTypes] = await marketplace.getAllListedTickets();
        expect(tokenIds.length).to.equal(3);
        expect(prices.length).to.equal(3);
        expect(sellers.length).to.equal(3);
        expect(eventTypes.length).to.equal(3);
      });
    });

    describe("Owner Functions", function() {
      it("Should allow owner to set listing fee", async function() {
        const newFee = ethers.utils.parseEther("0.002");
        await marketplace.setListingFee(newFee);
        expect(await marketplace.listingFee()).to.equal(newFee);
      });

      it("Should allow owner to withdraw fees", async function() {
        await marketplace.listTicket(1, ethers.utils.parseEther("0.1"), { value: listingFee });
        const initialBalance = await owner.getBalance();
        await marketplace.withdrawFees();
        const finalBalance = await owner.getBalance();
        expect(finalBalance.gt(initialBalance)).to.be.true;
      });
    });
  });

  describe("Integration", function() {
    it("Should handle full ticketing cycle", async function() {
      // Mint ticket
      await ticketNFT.mintTicket("Big Event", Math.floor(Date.now() / 1000) + 86400, 3, "E5", { value: mintFee });
      
      // List ticket
      await ticketNFT.approve(marketplace.address, 1);
      await marketplace.listTicket(1, ethers.utils.parseEther("0.2"), { value: listingFee });
      
      // Buy ticket
      await marketplace.connect(addr1).buyTicket(1, { value: ethers.utils.parseEther("0.2") });
      
      // Verify new owner
      expect(await ticketNFT.ownerOf(1)).to.equal(addr1.address);
      
      // Check marketplace state
      const listing = await marketplace.listings(1);
      expect(listing.price).to.equal(0);
      expect(listing.seller).to.equal(ethers.constants.AddressZero);

      // Verify ticket details
      const [eventName, , eventType, seatingInfo] = await ticketNFT.getTicketDetails(1);
      expect(eventName).to.equal("Big Event");
      expect(eventType).to.equal(3);
      expect(seatingInfo).to.equal("E5");
    });
  });

  describe("Stress Test", function() {
    this.timeout(60000); // 60 seconds

    it("Should handle large number of mints and listings", async function() {
      const batchSize = 20;
      const eventName = "Stress Test Event";
      const eventDate = Math.floor(Date.now() / 1000) + 86400;
      const eventType = 2;
      const seatingInfoList = Array.from({length: batchSize}, (_, i) => `Seat${i+1}`);

      // Batch mint
      await ticketNFT.batchMintTickets(eventName, eventDate, eventType, seatingInfoList, { value: mintFee.mul(batchSize) });

      // Approve all tokens
      await ticketNFT.setApprovalForAll(marketplace.address, true);

      // Batch list
      const tokenIds = Array.from({length: batchSize}, (_, i) => i + 1);
      const prices = Array(batchSize).fill(ethers.utils.parseEther("0.1"));
      await marketplace.batchListTickets(tokenIds, prices, { value: listingFee.mul(batchSize) });

      // Verify listings
      const [listedTokenIds, , , ] = await marketplace.getAllListedTickets();
      expect(listedTokenIds.length).to.equal(batchSize);

      // Add some buying operations to test the full cycle
      for (let i = 0; i < 5; i++) {
        await marketplace.connect(addr1).buyTicket(tokenIds[i], { value: ethers.utils.parseEther("0.1") });
      }

      // Verify the purchases
      for (let i = 0; i < 5; i++) {
        expect(await ticketNFT.ownerOf(tokenIds[i])).to.equal(addr1.address);
      }
    });
  });
});
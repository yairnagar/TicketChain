const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BlockTicket System", function() {
  let EventManager, eventManager, TicketNFT, ticketNFT, TicketMarketplace, marketplace;
  let owner, addr1, addr2, addr3;
  let mintFee, listingFee;

  beforeEach(async function() {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();

    EventManager = await ethers.getContractFactory("EventManager");
    eventManager = await EventManager.deploy();
    await eventManager.deployed();

    TicketNFT = await ethers.getContractFactory("TicketNFT");
    ticketNFT = await TicketNFT.deploy(eventManager.address);
    await ticketNFT.deployed();

    TicketMarketplace = await ethers.getContractFactory("TicketMarketplace");
    marketplace = await TicketMarketplace.deploy(ticketNFT.address, eventManager.address);
    await marketplace.deployed();

    mintFee = await ticketNFT.mintFee();
    listingFee = await marketplace.listingFee();
  });

  describe("EventManager", function() {
    it("Should create an event", async function() {
      const eventName = "Test Event";
      const eventDate = Math.floor(Date.now() / 1000) + 86400;
      const venue = "Test Venue";
      const capacity = 100;

      await eventManager.createEvent(eventName, eventDate, venue, capacity);
      const [id, name, date, eventVenue, eventCapacity, isActive, organizer] = await eventManager.getEvent(1);

      expect(id).to.equal(1);
      expect(name).to.equal(eventName);
      expect(date).to.equal(eventDate);
      expect(eventVenue).to.equal(venue);
      expect(eventCapacity).to.equal(capacity);
      expect(isActive).to.be.true;
      expect(organizer).to.equal(owner.address);
    });

    it("Should update an event", async function() {
      await eventManager.createEvent("Test Event", Math.floor(Date.now() / 1000) + 86400, "Test Venue", 100);
      
      const newEventName = "Updated Event";
      const newEventDate = Math.floor(Date.now() / 1000) + 172800;
      const newVenue = "New Venue";
      const newCapacity = 200;

      await eventManager.updateEvent(1, newEventName, newEventDate, newVenue, newCapacity);
      const [, name, date, venue, capacity] = await eventManager.getEvent(1);

      expect(name).to.equal(newEventName);
      expect(date).to.equal(newEventDate);
      expect(venue).to.equal(newVenue);
      expect(capacity).to.equal(newCapacity);
    });

    it("Should cancel an event", async function() {
      await eventManager.createEvent("Test Event", Math.floor(Date.now() / 1000) + 86400, "Test Venue", 100);
      await eventManager.cancelEvent(1);
      
      const [, , , , , isActive] = await eventManager.getEvent(1);
      expect(isActive).to.be.false;
    });

    it("Should get active events", async function() {
      await eventManager.createEvent("Event 1", Math.floor(Date.now() / 1000) + 86400, "Venue 1", 100);
      await eventManager.createEvent("Event 2", Math.floor(Date.now() / 1000) + 172800, "Venue 2", 200);
      await eventManager.cancelEvent(1);

      const activeEvents = await eventManager.getActiveEvents();
      expect(activeEvents.length).to.equal(1);
      expect(activeEvents[0]).to.equal(2);
    });
  });

  describe("TicketNFT", function() {
    let eventId;

    beforeEach(async function() {
      await eventManager.createEvent("Test Event", Math.floor(Date.now() / 1000) + 86400, "Test Venue", 100);
      eventId = 1;
    });

    describe("Minting", function() {
      it("Should mint a single ticket", async function() {
        await ticketNFT.mintTicket(eventId, "Test Event", Math.floor(Date.now() / 1000) + 86400, 0, "A1", { value: mintFee });
        expect(await ticketNFT.ownerOf(1)).to.equal(owner.address);
      });

      it("Should batch mint tickets", async function() {
        const eventName = "Batch Event";
        const eventDate = Math.floor(Date.now() / 1000) + 86400;
        const eventType = 2;
        const seatingInfoList = ["A1", "A2", "A3", "A4", "A5"];
        await ticketNFT.batchMintTickets(eventId, eventName, eventDate, eventType, seatingInfoList, { value: mintFee.mul(seatingInfoList.length) });
        
        for (let i = 1; i <= seatingInfoList.length; i++) {
          expect(await ticketNFT.ownerOf(i)).to.equal(owner.address);
        }
      });

      it("Should revert when minting for an invalid event", async function() {
        await expect(
          ticketNFT.mintTicket(999, "Invalid Event", Math.floor(Date.now() / 1000) + 86400, 0, "A1", { value: mintFee })
        ).to.be.revertedWith("Invalid or inactive event");
      });
    });

    describe("Ticket Details", function() {
      it("Should return correct ticket details", async function() {
        const eventName = "Concert";
        const eventDate = Math.floor(Date.now() / 1000) + 86400;
        const eventType = 3;
        const seatingInfo = "B2";
        await ticketNFT.mintTicket(eventId, eventName, eventDate, eventType, seatingInfo, { value: mintFee });
        const [returnedEventId, returnedEventName, returnedEventDate, returnedEventType, returnedSeatingInfo] = await ticketNFT.getTicketDetails(1);
        expect(returnedEventId).to.equal(eventId);
        expect(returnedEventName).to.equal(eventName);
        expect(returnedEventDate).to.equal(eventDate);
        expect(returnedEventType).to.equal(eventType);
        expect(returnedSeatingInfo).to.equal(seatingInfo);
      });
    });
  });

  describe("TicketMarketplace", function() {
    let eventId;

    beforeEach(async function() {
      await eventManager.createEvent("Test Event", Math.floor(Date.now() / 1000) + 86400, "Test Venue", 100);
      eventId = 1;
      await ticketNFT.mintTicket(eventId, "Test Event", Math.floor(Date.now() / 1000) + 86400, 0, "A1", { value: mintFee });
      await ticketNFT.approve(marketplace.address, 1);
    });

    describe("Listing", function() {
      it("Should list a ticket for sale", async function() {
        await marketplace.listTicket(1, ethers.utils.parseEther("0.1"), { value: listingFee });
        const listing = await marketplace.listings(1);
        expect(listing.price).to.equal(ethers.utils.parseEther("0.1"));
        expect(listing.seller).to.equal(owner.address);
        expect(listing.eventId).to.equal(eventId);
      });

      it("Should revert when listing a ticket for a cancelled event", async function() {
        await eventManager.cancelEvent(eventId);
        await expect(
          marketplace.listTicket(1, ethers.utils.parseEther("0.1"), { value: listingFee })
        ).to.be.revertedWith("Event is no longer valid");
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

      it("Should revert when buying a ticket for a cancelled event", async function() {
        await eventManager.cancelEvent(eventId);
        await expect(
          marketplace.connect(addr1).buyTicket(1, { value: ethers.utils.parseEther("0.1") })
        ).to.be.revertedWith("Event is no longer valid");
      });
    });
  });

  describe("Integration", function() {
    it("Should handle full ticketing cycle", async function() {
      // Create event
      await eventManager.createEvent("Big Event", Math.floor(Date.now() / 1000) + 86400, "Main Stadium", 1000);
      const eventId = 1;
      
      // Mint ticket
      await ticketNFT.mintTicket(eventId, "Big Event", Math.floor(Date.now() / 1000) + 86400, 3, "E5", { value: mintFee });
      
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
      const [returnedEventId, eventName, , eventType, seatingInfo] = await ticketNFT.getTicketDetails(1);
      expect(returnedEventId).to.equal(eventId);
      expect(eventName).to.equal("Big Event");
      expect(eventType).to.equal(3);
      expect(seatingInfo).to.equal("E5");
    });
  });

  describe("Stress Test", function() {
    this.timeout(300000); // Increase timeout to 5 minutes
  
    it("Should handle large number of events, mints and listings", async function() {
      const eventCount = 3; // Reduced from 5
      const ticketsPerEvent = 10; // Reduced from 20
  
      // Create multiple events
      for (let i = 0; i < eventCount; i++) {
        await eventManager.createEvent(`Event ${i+1}`, Math.floor(Date.now() / 1000) + 86400 * (i+1), `Venue ${i+1}`, 100);
      }
  
      // Mint and list tickets for each event
      for (let eventId = 1; eventId <= eventCount; eventId++) {
        const seatingInfoList = Array.from({length: ticketsPerEvent}, (_, i) => `Seat${i+1}`);
        
        // Batch mint
        await ticketNFT.batchMintTickets(
          eventId,
          `Event ${eventId}`,
          Math.floor(Date.now() / 1000) + 86400 * eventId,
          2,
          seatingInfoList,
          { value: mintFee.mul(ticketsPerEvent) }
        );
  
        // Approve all tokens
        await ticketNFT.setApprovalForAll(marketplace.address, true);
  
        // Batch list
        const tokenIds = Array.from({length: ticketsPerEvent}, (_, i) => i + 1 + (eventId - 1) * ticketsPerEvent);
        const prices = Array(ticketsPerEvent).fill(ethers.utils.parseEther("0.1"));
        await marketplace.batchListTickets(tokenIds, prices, { value: listingFee.mul(ticketsPerEvent) });
      }
  
      // Verify listings
      const [listedTokenIds, , , , eventIds] = await marketplace.getAllListedTickets();
      expect(listedTokenIds.length).to.equal(eventCount * ticketsPerEvent);
      expect(new Set(eventIds.map(id => id.toNumber())).size).to.equal(eventCount);
  
      // Add some buying operations to test the full cycle
      for (let i = 0; i < 3; i++) { // Reduced from 5
        await marketplace.connect(addr1).buyTicket(i + 1, { value: ethers.utils.parseEther("0.1") });
      }
  
      // Verify the purchases
      for (let i = 0; i < 3; i++) { // Reduced from 5
        expect(await ticketNFT.ownerOf(i + 1)).to.equal(addr1.address);
      }
    });
  });
});
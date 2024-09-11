// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./TicketNFT.sol";
import "./EventManager.sol";

contract TicketMarketplace is ReentrancyGuard, Ownable {
    TicketNFT public immutable nftContract;
    EventManager public eventManager;

    struct Listing {
        uint256 price;
        address seller;
        TicketNFT.EventType eventType;
        uint256 eventId;
    }

    mapping(uint256 => Listing) public listings;
    uint256[] public listedTokenIds;

    event TicketListed(uint256 indexed tokenId, uint256 price, address indexed seller, TicketNFT.EventType eventType, uint256 indexed eventId);
    event TicketSold(uint256 indexed tokenId, uint256 price, address indexed seller, address indexed buyer, TicketNFT.EventType eventType, uint256 eventId);
    event ListingCancelled(uint256 indexed tokenId, address indexed seller);
    event BatchTicketsListed(uint256[] tokenIds, uint256[] prices, address indexed seller, TicketNFT.EventType[] eventTypes, uint256[] eventIds);

    uint256 public constant MAX_BATCH_SIZE = 100;
    uint256 public listingFee = 0.001 ether;

    constructor(address _nftContract, address _eventManager) {
        nftContract = TicketNFT(_nftContract);
        eventManager = EventManager(_eventManager);
    }

    function setEventManager(address _eventManager) external onlyOwner {
        eventManager = EventManager(_eventManager);
    }

    function listTicket(uint256 tokenId, uint256 price) external payable nonReentrant {
        require(msg.value >= listingFee, "Insufficient listing fee");
        _listTicket(tokenId, price, msg.sender);
    }

    function batchListTickets(uint256[] calldata tokenIds, uint256[] calldata prices) external payable nonReentrant {
        require(tokenIds.length == prices.length, "Arrays length mismatch");
        require(tokenIds.length > 0 && tokenIds.length <= MAX_BATCH_SIZE, "Invalid batch size");
        require(msg.value >= listingFee * tokenIds.length, "Insufficient listing fee");

        TicketNFT.EventType[] memory eventTypes = new TicketNFT.EventType[](tokenIds.length);
        uint256[] memory eventIds = new uint256[](tokenIds.length);

        for (uint256 i = 0; i < tokenIds.length; i++) {
            (uint256 eventId, , , TicketNFT.EventType eventType, ) = nftContract.getTicketDetails(tokenIds[i]);
            _listTicket(tokenIds[i], prices[i], msg.sender);
            eventTypes[i] = eventType;
            eventIds[i] = eventId;
        }

        emit BatchTicketsListed(tokenIds, prices, msg.sender, eventTypes, eventIds);
    }

    function _listTicket(uint256 tokenId, uint256 price, address seller) internal {
        require(nftContract.ownerOf(tokenId) == seller, "Not the owner");
        require(nftContract.getApproved(tokenId) == address(this) || nftContract.isApprovedForAll(seller, address(this)), "Not approved for marketplace");
        
        (uint256 eventId, , , TicketNFT.EventType eventType, ) = nftContract.getTicketDetails(tokenId);
        require(eventManager.isValidEvent(eventId), "Event is no longer valid");
        
        listings[tokenId] = Listing(price, seller, eventType, eventId);
        listedTokenIds.push(tokenId);
        
        emit TicketListed(tokenId, price, seller, eventType, eventId);
    }

    function buyTicket(uint256 tokenId) external payable nonReentrant {
        Listing memory listing = listings[tokenId];
        require(listing.price > 0, "Not for sale");
        require(msg.value >= listing.price, "Insufficient payment");

        require(eventManager.isValidEvent(listing.eventId), "Event is no longer valid");

        delete listings[tokenId];
        _removeTokenIdFromList(tokenId);

        nftContract.safeTransferFrom(listing.seller, msg.sender, tokenId);
        
        payable(listing.seller).transfer(listing.price);
        
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }

        emit TicketSold(tokenId, listing.price, listing.seller, msg.sender, listing.eventType, listing.eventId);
    }

    function cancelListing(uint256 tokenId) external nonReentrant {
        require(listings[tokenId].seller == msg.sender, "Not the seller");
        
        delete listings[tokenId];
        _removeTokenIdFromList(tokenId);
        
        emit ListingCancelled(tokenId, msg.sender);
    }
    function getAllListedTickets() external view returns (uint256[] memory, uint256[] memory, address[] memory, TicketNFT.EventType[] memory, uint256[] memory) {
        uint256 listedCount = listedTokenIds.length;

        uint256[] memory tokenIds = new uint256[](listedCount);
        uint256[] memory prices = new uint256[](listedCount);
        address[] memory sellers = new address[](listedCount);
        TicketNFT.EventType[] memory eventTypes = new TicketNFT.EventType[](listedCount);
        uint256[] memory eventIds = new uint256[](listedCount);

        for (uint256 i = 0; i < listedCount; i++) {
            uint256 tokenId = listedTokenIds[i];
            Listing memory listing = listings[tokenId];
            tokenIds[i] = tokenId;
            prices[i] = listing.price;
            sellers[i] = listing.seller;
            eventTypes[i] = listing.eventType;
            eventIds[i] = listing.eventId;
        }

        return (tokenIds, prices, sellers, eventTypes, eventIds);
    }

    function _removeTokenIdFromList(uint256 tokenId) internal {
        for (uint256 i = 0; i < listedTokenIds.length; i++) {
            if (listedTokenIds[i] == tokenId) {
                listedTokenIds[i] = listedTokenIds[listedTokenIds.length - 1];
                listedTokenIds.pop();
                break;
            }
        }
    }

    function setListingFee(uint256 newFee) public onlyOwner {
        listingFee = newFee;
    }

    function withdrawFees() public onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner()).transfer(balance);
    }
}
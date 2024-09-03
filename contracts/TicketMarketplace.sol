// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./TicketNFT.sol";

contract TicketMarketplace is ReentrancyGuard, Ownable {
    TicketNFT public immutable nftContract;

    struct Listing {
        uint256 price;
        address seller;
        TicketNFT.EventType eventType;
    }

    mapping(uint256 => Listing) public listings;
    uint256[] public listedTokenIds;

    event TicketListed(uint256 indexed tokenId, uint256 price, address indexed seller, TicketNFT.EventType eventType);
    event TicketSold(uint256 indexed tokenId, uint256 price, address indexed seller, address indexed buyer, TicketNFT.EventType eventType);
    event ListingCancelled(uint256 indexed tokenId, address indexed seller);
    event BatchTicketsListed(uint256[] tokenIds, uint256[] prices, address indexed seller, TicketNFT.EventType[] eventTypes);

    uint256 public constant MAX_BATCH_SIZE = 100;
    uint256 public listingFee = 0.001 ether;

    constructor(address _nftContract) {
        nftContract = TicketNFT(_nftContract);
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

        for (uint256 i = 0; i < tokenIds.length; i++) {
            (,, TicketNFT.EventType eventType,) = nftContract.getTicketDetails(tokenIds[i]);
            _listTicket(tokenIds[i], prices[i], msg.sender);
            eventTypes[i] = eventType;
        }

        emit BatchTicketsListed(tokenIds, prices, msg.sender, eventTypes);
    }

    function _listTicket(uint256 tokenId, uint256 price, address seller) internal {
        require(nftContract.ownerOf(tokenId) == seller, "Not the owner");
        require(nftContract.getApproved(tokenId) == address(this) || nftContract.isApprovedForAll(seller, address(this)), "Not approved for marketplace");
        
        (,, TicketNFT.EventType eventType,) = nftContract.getTicketDetails(tokenId);
        
        listings[tokenId] = Listing(price, seller, eventType);
        listedTokenIds.push(tokenId);
        
        emit TicketListed(tokenId, price, seller, eventType);
    }

    function buyTicket(uint256 tokenId) external payable nonReentrant {
        Listing memory listing = listings[tokenId];
        require(listing.price > 0, "Not for sale");
        require(msg.value >= listing.price, "Insufficient payment");

        delete listings[tokenId];
        _removeTokenIdFromList(tokenId);

        nftContract.safeTransferFrom(listing.seller, msg.sender, tokenId);
        
        payable(listing.seller).transfer(listing.price);
        
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }

        emit TicketSold(tokenId, listing.price, listing.seller, msg.sender, listing.eventType);
    }

    function cancelListing(uint256 tokenId) external nonReentrant {
        require(listings[tokenId].seller == msg.sender, "Not the seller");
        
        delete listings[tokenId];
        _removeTokenIdFromList(tokenId);
        
        emit ListingCancelled(tokenId, msg.sender);
    }

    function getAllListedTickets() external view returns (uint256[] memory, uint256[] memory, address[] memory, TicketNFT.EventType[] memory) {
        uint256 listedCount = listedTokenIds.length;

        uint256[] memory tokenIds = new uint256[](listedCount);
        uint256[] memory prices = new uint256[](listedCount);
        address[] memory sellers = new address[](listedCount);
        TicketNFT.EventType[] memory eventTypes = new TicketNFT.EventType[](listedCount);

        for (uint256 i = 0; i < listedCount; i++) {
            uint256 tokenId = listedTokenIds[i];
            Listing memory listing = listings[tokenId];
            tokenIds[i] = tokenId;
            prices[i] = listing.price;
            sellers[i] = listing.seller;
            eventTypes[i] = listing.eventType;
        }

        return (tokenIds, prices, sellers, eventTypes);
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
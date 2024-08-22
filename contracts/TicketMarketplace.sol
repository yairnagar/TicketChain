// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TicketMarketplace is ReentrancyGuard, Ownable {
    IERC721 public nftContract;

    struct Listing {
        uint256 price;
        address seller;
    }

    mapping(uint256 => Listing) public listings;
    uint256[] public listedTokenIds;

    event TicketListed(uint256 tokenId, uint256 price, address seller);
    event TicketSold(uint256 tokenId, uint256 price, address seller, address buyer);
    event ListingCancelled(uint256 tokenId, address seller);

constructor(address _nftContract) {
    nftContract = IERC721(_nftContract);
}
    function listTicket(uint256 tokenId, uint256 price) external {
        require(nftContract.ownerOf(tokenId) == msg.sender, "Not the ticket owner");
        require(nftContract.getApproved(tokenId) == address(this), "Marketplace not approved");

        listings[tokenId] = Listing(price, msg.sender);
        listedTokenIds.push(tokenId);
        emit TicketListed(tokenId, price, msg.sender);
    }

    function buyTicket(uint256 tokenId) external payable {
        Listing memory listing = listings[tokenId];
        require(listing.price > 0, "Ticket not listed for sale");
        require(msg.value >= listing.price, "Insufficient payment");

        delete listings[tokenId];
        _removeTokenFromList(tokenId);

        nftContract.safeTransferFrom(listing.seller, msg.sender, tokenId);

        (bool sent, ) = payable(listing.seller).call{value: listing.price}("");
        require(sent, "Failed to send Ether");

        if (msg.value > listing.price) {
            (bool refunded, ) = payable(msg.sender).call{value: msg.value - listing.price}("");
            require(refunded, "Failed to refund excess");
        }

        emit TicketSold(tokenId, listing.price, listing.seller, msg.sender);
    }

    function cancelListing(uint256 tokenId) external {
        require(listings[tokenId].seller == msg.sender, "Not the seller");
        delete listings[tokenId];
        _removeTokenFromList(tokenId);
        emit ListingCancelled(tokenId, msg.sender);
    }

    function getAllListedTickets() public view returns (uint256[] memory, uint256[] memory, address[] memory) {
        uint256[] memory tokenIds = new uint256[](listedTokenIds.length);
        uint256[] memory prices = new uint256[](listedTokenIds.length);
        address[] memory sellers = new address[](listedTokenIds.length);

        for (uint i = 0; i < listedTokenIds.length; i++) {
            uint256 tokenId = listedTokenIds[i];
            Listing memory listing = listings[tokenId];
            tokenIds[i] = tokenId;
            prices[i] = listing.price;
            sellers[i] = listing.seller;
        }

        return (tokenIds, prices, sellers);
    }

    function getUserListedTickets(address user) public view returns (uint256[] memory, uint256[] memory) {
        uint256 count = 0;
        for (uint i = 0; i < listedTokenIds.length; i++) {
            if (listings[listedTokenIds[i]].seller == user) {
                count++;
            }
        }

        uint256[] memory userTokenIds = new uint256[](count);
        uint256[] memory userPrices = new uint256[](count);

        uint256 index = 0;
        for (uint i = 0; i < listedTokenIds.length; i++) {
            if (listings[listedTokenIds[i]].seller == user) {
                userTokenIds[index] = listedTokenIds[i];
                userPrices[index] = listings[listedTokenIds[i]].price;
                index++;
            }
        }

        return (userTokenIds, userPrices);
    }

    function _removeTokenFromList(uint256 tokenId) private {
        for (uint i = 0; i < listedTokenIds.length; i++) {
            if (listedTokenIds[i] == tokenId) {
                listedTokenIds[i] = listedTokenIds[listedTokenIds.length - 1];
                listedTokenIds.pop();
                break;
            }
        }
    }
}
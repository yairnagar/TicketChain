// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract TicketNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    struct Ticket {
        string eventName;
        uint256 eventDate;
        string seat;
    }

    mapping(uint256 => Ticket) private _tickets;

    constructor() ERC721("TicketNFT", "TNFT") {}

    function mintTicket(
        address recipient,
        string memory eventName,
        uint256 eventDate,
        string memory seat,
        string memory tokenURI
    ) public onlyOwner returns (uint256) {
        _tokenIds.increment();
        uint256 newTicketId = _tokenIds.current();

        _mint(recipient, newTicketId);
        _setTokenURI(newTicketId, tokenURI);

        _tickets[newTicketId] = Ticket(eventName, eventDate, seat);

        return newTicketId;
    }

    function getTicketDetails(uint256 tokenId) public view returns (string memory, uint256, string memory) {
        require(_exists(tokenId), "TicketNFT: Query for nonexistent token");
        Ticket memory ticket = _tickets[tokenId];
        return (ticket.eventName, ticket.eventDate, ticket.seat);
    }

    function burn(uint256 tokenId) public {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "TicketNFT: caller is not owner nor approved");
        _burn(tokenId);
        delete _tickets[tokenId];
    }
}
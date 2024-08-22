// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract TicketNFT is ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _ticketIds;

    struct Ticket {
        string eventName;
        uint256 eventDate;
        string seat;
    }

    mapping(uint256 => Ticket) private _tickets;

    event TicketMinted(uint256 indexed tokenId, address indexed owner, string eventName, uint256 eventDate, string seat);

    constructor() ERC721("TicketNFT", "TNFT") {}

    function mintTicket(
        string memory eventName,
        uint256 eventDate,
        string memory seat
    ) public returns (uint256) {
        _ticketIds.increment();
        uint256 newTicketId = _ticketIds.current();

        _safeMint(msg.sender, newTicketId);
        _tickets[newTicketId] = Ticket(eventName, eventDate, seat);

        emit TicketMinted(newTicketId, msg.sender, eventName, eventDate, seat);

        return newTicketId;
    }

    function getTicketDetails(uint256 tokenId) public view returns (string memory, uint256, string memory) {
        require(_exists(tokenId), "TicketNFT: Query for nonexistent token");
        Ticket memory ticket = _tickets[tokenId];
        return (ticket.eventName, ticket.eventDate, ticket.seat);
    }

    function burn(uint256 tokenId) public {
        require(_exists(tokenId), "TicketNFT: Token does not exist");
        require(ownerOf(tokenId) == _msgSender() || getApproved(tokenId) == _msgSender() || isApprovedForAll(ownerOf(tokenId), _msgSender()),
            "TicketNFT: caller is not owner nor approved");
        _burn(tokenId);
        delete _tickets[tokenId];
    }
}
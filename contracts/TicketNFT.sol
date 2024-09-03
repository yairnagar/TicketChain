// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TicketNFT is ERC721, ReentrancyGuard, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    enum EventType { PrivateEvent, SportsGame, Show, Concert, Conference }

    struct TicketDetails {
        uint64 eventDate;
        string eventName;
        EventType eventType;
        string seatingInfo;
    }

    mapping(uint256 => TicketDetails) private _tickets;

    event TicketMinted(uint256 indexed tokenId, address indexed owner, string eventName, uint64 eventDate, EventType eventType, string seatingInfo);
    event BatchTicketsMinted(uint256[] tokenIds, address indexed owner, string eventName, uint64 eventDate, EventType eventType);

    uint256 public constant MAX_BATCH_SIZE = 100;
    uint256 public mintFee = 0.001 ether;

    constructor() ERC721("TicketNFT", "TNFT") {}

    function mintTicket(string memory eventName, uint64 eventDate, EventType eventType, string memory seatingInfo) public payable nonReentrant returns (uint256) {
        require(msg.value >= mintFee, "Insufficient mint fee");
        return _mintSingleTicket(msg.sender, eventName, eventDate, eventType, seatingInfo);
    }

    function batchMintTickets(
        string memory eventName,
        uint64 eventDate,
        EventType eventType,
        string[] memory seatingInfoList
    ) public payable nonReentrant returns (uint256[] memory) {
        uint256 quantity = seatingInfoList.length;
        require(quantity > 0 && quantity <= MAX_BATCH_SIZE, "Invalid batch size");
        require(msg.value >= mintFee * quantity, "Insufficient mint fee");

        uint256[] memory newTokenIds = new uint256[](quantity);

        for (uint256 i = 0; i < quantity; i++) {
            newTokenIds[i] = _mintSingleTicket(msg.sender, eventName, eventDate, eventType, seatingInfoList[i]);
        }

        emit BatchTicketsMinted(newTokenIds, msg.sender, eventName, eventDate, eventType);
        return newTokenIds;
    }

    function _mintSingleTicket(
        address to,
        string memory eventName,
        uint64 eventDate,
        EventType eventType,
        string memory seatingInfo
    ) internal returns (uint256) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _safeMint(to, newTokenId);
        _tickets[newTokenId] = TicketDetails(eventDate, eventName, eventType, seatingInfo);

        emit TicketMinted(newTokenId, to, eventName, eventDate, eventType, seatingInfo);

        return newTokenId;
    }

    function getTicketDetails(uint256 tokenId) public view returns (string memory, uint64, EventType, string memory) {
        require(_exists(tokenId), "ERC721: invalid token ID");
        TicketDetails storage details = _tickets[tokenId];
        return (details.eventName, details.eventDate, details.eventType, details.seatingInfo);
    }

    function setMintFee(uint256 newFee) public onlyOwner {
        mintFee = newFee;
    }

    function withdrawFees() public onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner()).transfer(balance);
    }
}
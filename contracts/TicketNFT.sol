// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./EventManager.sol";

contract TicketNFT is ERC721, ReentrancyGuard, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    enum EventType { PrivateEvent, SportsGame, Show, Concert, Conference }

    struct TicketDetails {
        uint256 eventId;
        uint64 eventDate;
        string eventName;
        EventType eventType;
        string seatingInfo;
    }

    mapping(uint256 => TicketDetails) private _tickets;

    event TicketMinted(uint256 indexed tokenId, address indexed owner, uint256 indexed eventId, string eventName, uint64 eventDate, EventType eventType, string seatingInfo);
    event BatchTicketsMinted(uint256[] tokenIds, address indexed owner, uint256 indexed eventId, string eventName, uint64 eventDate, EventType eventType);

    uint256 public constant MAX_BATCH_SIZE = 100;
    uint256 public mintFee = 0.001 ether;

    EventManager public eventManager;

    constructor(address _eventManager) ERC721("TicketNFT", "TNFT") {
        eventManager = EventManager(_eventManager);
    }

    function setEventManager(address _eventManager) external onlyOwner {
        eventManager = EventManager(_eventManager);
    }

    function mintTicket(uint256 _eventId, string memory _eventName, uint64 _eventDate, EventType _eventType, string memory _seatingInfo) public payable nonReentrant returns (uint256) {
        require(msg.value >= mintFee, "Insufficient mint fee");
        require(eventManager.isValidEvent(_eventId), "Invalid or inactive event");

        return _mintSingleTicket(msg.sender, _eventId, _eventName, _eventDate, _eventType, _seatingInfo);
    }

    function batchMintTickets(
        uint256 _eventId,
        string memory _eventName,
        uint64 _eventDate,
        EventType _eventType,
        string[] memory _seatingInfoList
    ) public payable nonReentrant returns (uint256[] memory) {
        uint256 quantity = _seatingInfoList.length;
        require(quantity > 0 && quantity <= MAX_BATCH_SIZE, "Invalid batch size");
        require(msg.value >= mintFee * quantity, "Insufficient mint fee");
        require(eventManager.isValidEvent(_eventId), "Invalid or inactive event");

        uint256[] memory newTokenIds = new uint256[](quantity);

        for (uint256 i = 0; i < quantity; i++) {
            newTokenIds[i] = _mintSingleTicket(msg.sender, _eventId, _eventName, _eventDate, _eventType, _seatingInfoList[i]);
        }

        emit BatchTicketsMinted(newTokenIds, msg.sender, _eventId, _eventName, _eventDate, _eventType);
        return newTokenIds;
    }

    function _mintSingleTicket(
        address to,
        uint256 _eventId,
        string memory _eventName,
        uint64 _eventDate,
        EventType _eventType,
        string memory _seatingInfo
    ) internal returns (uint256) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _safeMint(to, newTokenId);
        _tickets[newTokenId] = TicketDetails(_eventId, _eventDate, _eventName, _eventType, _seatingInfo);

        emit TicketMinted(newTokenId, to, _eventId, _eventName, _eventDate, _eventType, _seatingInfo);

        return newTokenId;
    }

    function getTicketDetails(uint256 tokenId) public view returns (uint256, string memory, uint64, EventType, string memory) {
        require(_exists(tokenId), "ERC721: invalid token ID");
        TicketDetails storage details = _tickets[tokenId];
        return (details.eventId, details.eventName, details.eventDate, details.eventType, details.seatingInfo);
    }

    function setMintFee(uint256 newFee) public onlyOwner {
        mintFee = newFee;
    }

    function withdrawFees() public onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner()).transfer(balance);
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract EventManager is Ownable, ReentrancyGuard {
    struct Event {
        uint256 id;
        string name;
        uint256 date;
        string venue;
        uint256 capacity;
        bool isActive;
        address organizer;
    }

    mapping(uint256 => Event) public events;
    uint256 public eventCount;

    event EventCreated(uint256 indexed eventId, string name, uint256 date, string venue, uint256 capacity, address organizer);
    event EventUpdated(uint256 indexed eventId, string name, uint256 date, string venue, uint256 capacity);
    event EventCancelled(uint256 indexed eventId);

    constructor() {
        eventCount = 0;
    }

    function createEvent(string memory _name, uint256 _date, string memory _venue, uint256 _capacity) external nonReentrant returns (uint256) {
        require(bytes(_name).length > 0, "Event name cannot be empty");
        require(_date > block.timestamp, "Event date must be in the future");
        require(_capacity > 0, "Event capacity must be greater than zero");

        eventCount++;
        events[eventCount] = Event(eventCount, _name, _date, _venue, _capacity, true, msg.sender);

        emit EventCreated(eventCount, _name, _date, _venue, _capacity, msg.sender);

        return eventCount;
    }

    function updateEvent(uint256 _eventId, string memory _name, uint256 _date, string memory _venue, uint256 _capacity) external nonReentrant {
        require(_eventId > 0 && _eventId <= eventCount, "Invalid event ID");
        Event storage eventToUpdate = events[_eventId];
        require(eventToUpdate.organizer == msg.sender, "Only the event organizer can update the event");
        require(eventToUpdate.isActive, "Cannot update a cancelled event");
        require(_date > block.timestamp, "Event date must be in the future");
        require(_capacity > 0, "Event capacity must be greater than zero");

        eventToUpdate.name = _name;
        eventToUpdate.date = _date;
        eventToUpdate.venue = _venue;
        eventToUpdate.capacity = _capacity;

        emit EventUpdated(_eventId, _name, _date, _venue, _capacity);
    }

    function cancelEvent(uint256 _eventId) external nonReentrant {
        require(_eventId > 0 && _eventId <= eventCount, "Invalid event ID");
        Event storage eventToCancel = events[_eventId];
        require(eventToCancel.organizer == msg.sender, "Only the event organizer can cancel the event");
        require(eventToCancel.isActive, "Event is already cancelled");

        eventToCancel.isActive = false;

        emit EventCancelled(_eventId);
    }

    function getEvent(uint256 _eventId) external view returns (
        uint256 id,
        string memory name,
        uint256 date,
        string memory venue,
        uint256 capacity,
        bool isActive,
        address organizer
    ) {
        require(_eventId > 0 && _eventId <= eventCount, "Invalid event ID");
        Event storage event_ = events[_eventId];
        return (
            event_.id,
            event_.name,
            event_.date,
            event_.venue,
            event_.capacity,
            event_.isActive,
            event_.organizer
        );
    }

    function getActiveEvents() external view returns (uint256[] memory) {
        uint256[] memory activeEventIds = new uint256[](eventCount);
        uint256 activeCount = 0;

        for (uint256 i = 1; i <= eventCount; i++) {
            if (events[i].isActive) {
                activeEventIds[activeCount] = i;
                activeCount++;
            }
        }

        // Resize the array to remove any empty slots
        assembly {
            mstore(activeEventIds, activeCount)
        }

        return activeEventIds;
    }

    function isValidEvent(uint256 _eventId) external view returns (bool) {
        if (_eventId == 0 || _eventId > eventCount) {
            return false;
        }
        Event storage event_ = events[_eventId];
        return event_.isActive && event_.date > block.timestamp;
    }
}
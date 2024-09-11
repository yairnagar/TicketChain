import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Edit, Trash2, Loader, RefreshCw } from 'lucide-react';
import { ethers } from 'ethers';

// Make sure to import your contract ABI
import EVENT_MANAGER_ABI from '../abis/EventManager.json';

const EventManagement = ({ provider, signer, contractAddress }) => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, [provider, contractAddress]);

  const fetchEvents = async () => {
    if (!provider || !contractAddress) return;
    setIsLoading(true);
    setError(null);
    try {
      console.log('Fetching events...');
      const fetchedEvents = [];

      const contract = new ethers.Contract(contractAddress, EVENT_MANAGER_ABI, provider);
      const getEventFunction = contract.interface.getFunction('getEvent');
      const eventCount = await contract.eventCount();

      for (let eventId = 1; eventId <= eventCount; eventId++) {
        try {
          const data = contract.interface.encodeFunctionData(getEventFunction, [eventId]);
          const result = await provider.call({
            to: contractAddress,
            data: data,
          });

          const decodedResult = contract.interface.decodeFunctionResult(getEventFunction, result);
          console.log('Decoded result:', decodedResult);

          const [id, name, date, venue, capacity, isActive, organizer] = decodedResult;

          if (isActive) {
            fetchedEvents.push({
              id: id.toString(),
              name,
              date: new Date(Number(date) * 1000), // Convert BigInt to Number
              venue,
              capacity: capacity.toString(),
              isActive,
              organizer,
            });
          }
        } catch (error) {
          console.error(`Error fetching event ${eventId}:`, error);
          // Continue to the next event even if there's an error
        }
      }

      console.log('Fetched events:', fetchedEvents);
      setEvents(fetchedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to fetch events. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateEvent = async (eventId, updatedData) => {
    // Implement event update logic here
  };

  const handleCancelEvent = async (eventId) => {
    if (!signer || !contractAddress) return;
    try {
      const contract = new ethers.Contract(contractAddress, EVENT_MANAGER_ABI, signer);
      const tx = await contract.cancelEvent(eventId);
      await tx.wait();
      fetchEvents(); // Refresh the event list
    } catch (error) {
      console.error('Error cancelling event:', error);
      setError(`Failed to cancel event: ${error.message}`);
    }
  };

  const handleRefresh = () => {
    fetchEvents();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin h-12 w-12 text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
        <p className="font-bold">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manage Events</h1>
        <button
          onClick={handleRefresh}
          className="btn btn-secondary flex items-center"
          disabled={isLoading}
        >
          <RefreshCw className={`h-5 w-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      {events.length === 0 ? (
        <p className="text-gray-600">No active events found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div key={event.id} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-2">{event.name}</h3>
              <p className="flex items-center text-gray-600 mb-2">
                <Calendar className="mr-2 h-5 w-5" />
                {event.date.toLocaleString()}
              </p>
              <p className="flex items-center text-gray-600 mb-2">
                <MapPin className="mr-2 h-5 w-5" />
                {event.venue}
              </p>
              <p className="flex items-center text-gray-600 mb-4">
                <Users className="mr-2 h-5 w-5" />
                Capacity: {event.capacity}
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleUpdateEvent(event.id)}
                  className="flex-1 flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Update
                </button>
                <button
                  onClick={() => handleCancelEvent(event.id)}
                  className="flex-1 flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventManagement;
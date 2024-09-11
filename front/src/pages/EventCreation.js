import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Loader } from 'lucide-react';
import { ethers } from 'ethers';
import EVENT_MANAGER_ABI from '../abis/EventManager.json';

const EventCreation = ({ provider, signer, contractAddress }) => {
  const navigate = useNavigate();
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [venue, setVenue] = useState('');
  const [capacity, setCapacity] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [eventManagerContract, setEventManagerContract] = useState(null);

  // Initialize the contract when the provider and contractAddress are available
  useEffect(() => {
    if (provider && contractAddress && signer) {
      const contract = new ethers.Contract(contractAddress, EVENT_MANAGER_ABI, signer);
      setEventManagerContract(contract);
      console.log("EventManager contract is initialized:", contract);
    } else {
      console.error("Provider, signer, or contractAddress not available.");
      setError("Contract not initialized. Please check your wallet connection.");
    }
  }, [provider, contractAddress, signer]);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!eventManagerContract) {
      setError("Contract not initialized. Please check your wallet connection.");
      return;
    }

    setIsCreating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      console.log("Creating event with data:", { eventName, eventDate, venue, capacity });
      const dateInSeconds = Math.floor(new Date(eventDate).getTime() / 1000);
      console.log("Date in seconds:", dateInSeconds);

      const tx = await eventManagerContract.createEvent(eventName, dateInSeconds, venue, capacity);
      console.log("Transaction sent:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);

      setSuccessMessage("Event created successfully!");
      setTimeout(() => navigate('/manage-events'), 2000);
    } catch (error) {
      console.error('Error creating event:', error);
      setError(`Failed to create event: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create New Event</h1>
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      {successMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4" role="alert">
          <p className="font-bold">Success</p>
          <p>{successMessage}</p>
        </div>
      )}
      <form onSubmit={handleCreateEvent} className="space-y-4">
        <div>
          <label htmlFor="eventName" className="block text-sm font-medium text-gray-700">Event Name</label>
          <input
            type="text"
            id="eventName"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
        </div>
        <div>
          <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700">Event Date</label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="datetime-local"
              id="eventDate"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
              className="block w-full pl-10 rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
        </div>
        <div>
          <label htmlFor="venue" className="block text-sm font-medium text-gray-700">Venue</label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPin className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="venue"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              required
              className="block w-full pl-10 rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
        </div>
        <div>
          <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">Capacity</label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Users className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              id="capacity"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              required
              min="1"
              className="block w-full pl-10 rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isCreating}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          {isCreating ? (
            <>
              <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
              Creating...
            </>
          ) : (
            'Create Event'
          )}
        </button>
      </form>
    </div>
  );
};

export default EventCreation;

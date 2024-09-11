import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Ticket, Calendar, MapPin, Users, Loader } from 'lucide-react';

const TicketMinting = ({ ticketNFTContract, eventManagerContract }) => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [seatingInfo, setSeatingInfo] = useState('');
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEventDetails();
  }, [eventId, eventManagerContract]);

  const fetchEventDetails = async () => {
    if (!eventManagerContract || !eventId) return;
    try {
      const eventDetails = await eventManagerContract.getEvent(eventId);
      setEvent(eventDetails);
    } catch (error) {
      console.error('Error fetching event details:', error);
      setError('Failed to fetch event details. Please try again.');
    }
  };

  const handleMintTicket = async (e) => {
    e.preventDefault();
    if (!ticketNFTContract || !event) return;

    setIsMinting(true);
    setError(null);

    try {
      const mintFee = await ticketNFTContract.mintFee();
      const tx = await ticketNFTContract.mintTicket(
        event.id,
        event.name,
        event.date,
        0, // Assuming EventType.PrivateEvent for simplicity
        seatingInfo,
        { value: mintFee }
      );
      await tx.wait();
      alert('Ticket minted successfully!');
      setSeatingInfo('');
    } catch (error) {
      console.error('Error minting ticket:', error);
      setError(`Failed to mint ticket: ${error.message}`);
    } finally {
      setIsMinting(false);
    }
  };

  if (!event) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin h-12 w-12 text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Mint Ticket for {event.name}</h1>
      <div className="card p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Event Details</h2>
        <p className="flex items-center text-gray-600 mb-2">
          <Calendar className="mr-2 h-5 w-5" />
          {new Date(event.date * 1000).toLocaleString()}
        </p>
        <p className="flex items-center text-gray-600 mb-2">
          <MapPin className="mr-2 h-5 w-5" />
          {event.venue}
        </p>
        <p className="flex items-center text-gray-600">
          <Users className="mr-2 h-5 w-5" />
          Capacity: {event.capacity.toString()}
        </p>
      </div>
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      <form onSubmit={handleMintTicket} className="space-y-4">
        <div>
          <label htmlFor="seatingInfo" className="block text-sm font-medium text-gray-700">Seating Information</label>
          <input
            type="text"
            id="seatingInfo"
            value={seatingInfo}
            onChange={(e) => setSeatingInfo(e.target.value)}
            required
            className="input mt-1"
            placeholder="e.g., Row A, Seat 12"
          />
        </div>
        <button
          type="submit"
          disabled={isMinting}
          className="btn btn-primary w-full flex justify-center items-center"
        >
          {isMinting ? (
            <>
              <Loader className="animate-spin -ml-1 mr-3 h-5 w-5" />
              Minting...
            </>
          ) : (
            <>
              <Ticket className="mr-2 h-5 w-5" />
              Mint Ticket
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default TicketMinting;
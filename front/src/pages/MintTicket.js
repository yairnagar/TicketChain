import React, { useState } from 'react';
import { Ticket, Calendar, MapPin, Tag } from 'lucide-react';
import { ethers } from 'ethers';

function MintTicket({ contract }) {
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventType, setEventType] = useState(0); // Default to PrivateEvent
  const [seat, setSeat] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastMintedTokenId, setLastMintedTokenId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contract) {
      setError('Contract is not initialized. Please connect your wallet and try again.');
      return;
    }
  
    try {
      setIsLoading(true);
      setError(null);
  
      const eventDateTimestamp = Math.floor(new Date(eventDate).getTime() / 1000);
  
      console.log('Minting ticket with params:', eventName, eventDateTimestamp, eventType, seat);
      
      const mintFee = await contract.mintFee();
      const tx = await contract.mintTicket(eventName, eventDateTimestamp, eventType, seat, { value: mintFee });
      console.log('Transaction sent:', tx.hash);
  
      const receipt = await tx.wait();
      console.log('Transaction receipt:', receipt);
  
      const mintEvent = receipt.events.find(event => event.event === 'TicketMinted');
      if (mintEvent) {
        setLastMintedTokenId(mintEvent.args.tokenId.toString());
      }

      setEventName('');
      setEventDate('');
      setEventType(0);
      setSeat('');
      setError(null);
    } catch (error) {
      console.error('Error minting ticket:', error);
      setError(`Failed to mint ticket: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-center text-blue-600 mb-8">Mint New Ticket</h2>
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
      {lastMintedTokenId && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          Ticket minted successfully! Token ID: {lastMintedTokenId}
        </div>
      )}
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="eventName">
              Event Name
            </label>
            <div className="relative">
              <input
                className="input pl-10"
                id="eventName"
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                required
              />
              <Ticket className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="eventDate">
              Event Date
            </label>
            <div className="relative">
              <input
                className="input pl-10"
                id="eventDate"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
              />
              <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="eventType">
              Event Type
            </label>
            <div className="relative">
              <select
                className="input pl-10"
                id="eventType"
                value={eventType}
                onChange={(e) => setEventType(Number(e.target.value))}
                required
              >
                <option value={0}>Private Event</option>
                <option value={1}>Sports Game</option>
                <option value={2}>Show</option>
                <option value={3}>Concert</option>
                <option value={4}>Conference</option>
              </select>
              <Tag className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="seat">
              Seat Number
            </label>
            <div className="relative">
              <input
                className="input pl-10"
                id="seat"
                type="text"
                value={seat}
                onChange={(e) => setSeat(e.target.value)}
                required
              />
              <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
          <button
            type="submit"
            className="btn btn-primary w-full flex justify-center items-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <Ticket className="h-5 w-5 mr-2" />
            )}
            {isLoading ? 'Minting...' : 'Mint Ticket'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default MintTicket;
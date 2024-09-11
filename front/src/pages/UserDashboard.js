import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Ticket, Calendar, MapPin, DollarSign, Tag, Loader } from 'lucide-react';

const UserDashboard = ({ ticketNFTContract, marketplaceContract, eventManagerContract }) => {
  const [ownedTickets, setOwnedTickets] = useState([]);
  const [listedTickets, setListedTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserTickets();
  }, [ticketNFTContract, marketplaceContract]);

  const fetchUserTickets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const address = await ticketNFTContract.signer.getAddress();
      
      // Fetch owned tickets
      const balance = await ticketNFTContract.balanceOf(address);
      const ownedTokens = [];
      for (let i = 0; i < balance; i++) {
        const tokenId = await ticketNFTContract.tokenOfOwnerByIndex(address, i);
        const [eventId, eventName, eventDate, eventType, seatingInfo] = await ticketNFTContract.getTicketDetails(tokenId);
        ownedTokens.push({ tokenId: tokenId.toString(), eventName, eventDate: new Date(Number(eventDate) * 1000).toLocaleDateString(), eventType: Number(eventType), seatingInfo });
      }
      setOwnedTickets(ownedTokens);

      // Fetch listed tickets
      const [listedTokenIds, prices, sellers, , ] = await marketplaceContract.getAllListedTickets();
      const listedTokens = listedTokenIds.filter((_, index) => sellers[index].toLowerCase() === address.toLowerCase());
      const listedTicketsDetails = await Promise.all(listedTokens.map(async (tokenId, index) => {
        const [eventName, eventDate, eventType, seatingInfo] = await ticketNFTContract.getTicketDetails(tokenId);
        return {
          tokenId: tokenId.toString(),
          eventName,
          eventDate: new Date(Number(eventDate) * 1000).toLocaleDateString(),
          eventType: Number(eventType),
          seatingInfo,
          price: ethers.formatEther(prices[listedTokenIds.indexOf(tokenId)])
        };
      }));
      setListedTickets(listedTicketsDetails);
    } catch (error) {
      console.error('Error fetching user tickets:', error);
      setError(`Failed to fetch user tickets: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelListing = async (tokenId) => {
    try {
      const tx = await marketplaceContract.cancelListing(tokenId);
      await tx.wait();
      alert('Listing cancelled successfully!');
      fetchUserTickets(); // Refresh the lists
    } catch (error) {
      console.error('Error cancelling listing:', error);
      alert(`Failed to cancel listing: ${error.message}`);
    }
  };

  const getEventTypeName = (eventType) => {
    const types = ['Private Event', 'Sports Game', 'Show', 'Concert', 'Conference'];
    return types[eventType] || 'Unknown';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin h-12 w-12 text-primary-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Dashboard</h1>
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">My Tickets</h2>
        {ownedTickets.length === 0 ? (
          <p className="text-gray-600">You don't own any tickets yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ownedTickets.map((ticket) => (
              <div key={ticket.tokenId} className="card p-6">
                <h3 className="text-xl font-semibold mb-2">{ticket.eventName}</h3>
                <p className="flex items-center text-gray-600 mb-2">
                  <Calendar className="mr-2 h-5 w-5" />
                  {ticket.eventDate}
                </p>
                <p className="flex items-center text-gray-600 mb-2">
                  <Ticket className="mr-2 h-5 w-5" />
                  {getEventTypeName(ticket.eventType)}
                </p>
                <p className="flex items-center text-gray-600 mb-2">
                  <MapPin className="mr-2 h-5 w-5" />
                  Seat: {ticket.seatingInfo}
                </p>
                <p className="text-sm text-gray-500">Token ID: {ticket.tokenId}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <h2 className="text-2xl font-semibold mb-4">My Listed Tickets</h2>
        {listedTickets.length === 0 ? (
          <p className="text-gray-600">You haven't listed any tickets for sale.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listedTickets.map((ticket) => (
              <div key={ticket.tokenId} className="card p-6">
                <h3 className="text-xl font-semibold mb-2">{ticket.eventName}</h3>
                <p className="flex items-center text-gray-600 mb-2">
                  <Calendar className="mr-2 h-5 w-5" />
                  {ticket.eventDate}
                </p>
                <p className="flex items-center text-gray-600 mb-2">
                  <Ticket className="mr-2 h-5 w-5" />
                  {getEventTypeName(ticket.eventType)}
                </p>
                <p className="flex items-center text-gray-600 mb-2">
                  <MapPin className="mr-2 h-5 w-5" />
                  Seat: {ticket.seatingInfo}
                </p>
                <p className="flex items-center text-gray-600 mb-4">
                  <DollarSign className="mr-2 h-5 w-5" />
                  Price: {ticket.price} ETH
                </p>
                <button
                  onClick={() => handleCancelListing(ticket.tokenId)}
                  className="btn btn-secondary w-full flex items-center justify-center"
                >
                  <Tag className="mr-2 h-5 w-5" />
                  Cancel Listing
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
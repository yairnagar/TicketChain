import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Ticket, Calendar, MapPin, DollarSign, Loader, RefreshCw } from 'lucide-react';

const TicketMarketplace = ({ marketplaceContract, ticketNFTContract }) => {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchListedTickets();
  }, [marketplaceContract, ticketNFTContract]);

  const fetchListedTickets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [tokenIds, prices, sellers, eventTypes, eventIds] = await marketplaceContract.getAllListedTickets();

      const ticketsDetails = await Promise.all(tokenIds.map(async (tokenId, index) => {
        const [eventName, eventDate, , seatingInfo] = await ticketNFTContract.getTicketDetails(tokenId);

        return {
          tokenId: tokenId.toString(),
          price: ethers.formatEther(prices[index]),
          seller: sellers[index],
          eventName,
          eventDate: new Date(Number(eventDate) * 1000).toLocaleDateString(),
          eventType: Number(eventTypes[index]),
          seatingInfo
        };
      }));

      setTickets(ticketsDetails);
    } catch (error) {
      console.error('Error fetching listed tickets:', error);
      setError(`Failed to fetch listed tickets: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyTicket = async (tokenId, price) => {
    try {
      const tx = await marketplaceContract.buyTicket(tokenId, { value: ethers.parseEther(price) });
      await tx.wait();
      alert('Ticket purchased successfully!');
      fetchListedTickets(); // Refresh the list of tickets
    } catch (error) {
      console.error('Error buying ticket:', error);
      alert(`Failed to buy ticket: ${error.message}`);
    }
  };

  const getEventTypeName = (eventType) => {
    const types = ['Private Event', 'Sports Game', 'Show', 'Concert', 'Conference'];
    return types[eventType] || 'Unknown';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Ticket Marketplace</h1>
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      <div className="mb-4">
        <button
          onClick={fetchListedTickets}
          disabled={isLoading}
          className="btn btn-secondary flex items-center"
        >
          <RefreshCw className={`mr-2 h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Refreshing...' : 'Refresh Tickets'}
        </button>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader className="animate-spin h-12 w-12 text-primary-600" />
        </div>
      ) : tickets.length === 0 ? (
        <p className="text-center text-gray-600">No tickets available for purchase</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tickets.map((ticket) => (
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
                onClick={() => handleBuyTicket(ticket.tokenId, ticket.price)}
                className="btn btn-primary w-full"
              >
                Buy Ticket
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TicketMarketplace;
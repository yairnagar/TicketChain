import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Calendar, MapPin, Bitcoin, RefreshCw } from 'lucide-react';
import { formatEther } from 'ethers';

function AvailableTickets({ marketplaceContract, nftContract }) {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (marketplaceContract && nftContract) {
      fetchAvailableTickets();
    }
  }, [marketplaceContract, nftContract]);

  const fetchAvailableTickets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [tokenIds, prices, sellers] = await marketplaceContract.getAllListedTickets();

      const ticketsDetails = await Promise.all(tokenIds.map(async (tokenId, index) => {
        const [eventName, eventDate, seat] = await nftContract.getTicketDetails(tokenId);

        return {
          tokenId: tokenId.toString(),
          price: formatEther(prices[index]),
          seller: sellers[index],
          eventName,
          eventDate: new Date(Number(eventDate) * 1000).toLocaleDateString(),
          seat
        };
      }));

      setTickets(ticketsDetails);
    } catch (error) {
      setError(`Failed to fetch tickets: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyClick = (tokenId) => {
    navigate(`/buy/${tokenId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-center text-primary-600 mb-8">Available Tickets</h2>
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
      <div className="flex justify-center mb-8">
        <button
          onClick={fetchAvailableTickets}
          disabled={isLoading}
          className="btn btn-secondary flex items-center"
        >
          <RefreshCw className={`h-5 w-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Refreshing...' : 'Refresh Tickets'}
        </button>
      </div>
      {isLoading ? (
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 mx-auto text-primary-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : tickets.length === 0 ? (
        <p className="text-center text-gray-600">No tickets available</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tickets.map((ticket, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md flex flex-col h-64">
              <div className="p-4 flex flex-col h-full">
                <div className="h-[30%] flex items-center">
                  <h3 className="text-lg font-semibold truncate">
                    <Ticket className="h-5 w-5 inline mr-2 text-primary-600" />
                    {ticket.eventName}
                  </h3>
                </div>
                <div className="h-[40%] flex flex-col justify-center">
                  <p className="text-sm text-gray-600 mb-1 flex items-center">
                    <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span className="truncate">{ticket.eventDate}</span>
                  </p>
                  <p className="text-sm text-gray-600 mb-1 flex items-center">
                    <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span className="truncate">Seat: {ticket.seat}</span>
                  </p>
                  <p className="text-sm text-gray-600 flex items-center">
                    <Bitcoin className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span className="truncate">Price: {ticket.price} ETH</span>
                  </p>
                </div>
                <div className="h-[30%] flex items-end">
                  <button
                    onClick={() => handleBuyClick(ticket.tokenId)}
                    className="btn btn-primary w-full text-sm"
                  >
                    Buy Ticket
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AvailableTickets;
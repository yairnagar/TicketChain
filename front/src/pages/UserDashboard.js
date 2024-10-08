import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Calendar, MapPin, Bitcoin, X, Tag } from 'lucide-react';

function UserDashboard({ marketplaceContract, nftContract, connectedAddress }) {
  const [listedTickets, setListedTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (marketplaceContract && nftContract && connectedAddress) {
      fetchListedTickets();
    }
  }, [marketplaceContract, nftContract, connectedAddress]);

  const fetchListedTickets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch all listed tickets
      const [tokenIds, prices, sellers, eventTypes] = await marketplaceContract.getAllListedTickets();
      
      // Filter tickets for the connected address
      const userListedTickets = await Promise.all(
        tokenIds.map(async (tokenId, index) => {
          if (sellers[index].toLowerCase() === connectedAddress.toLowerCase()) {
            const [eventName, eventDate, , seatingInfo] = await nftContract.getTicketDetails(tokenId);
            return {
              tokenId: tokenId.toString(),
              price: ethers.formatEther(prices[index]),
              eventName,
              eventDate: new Date(Number(eventDate) * 1000).toLocaleDateString(),
              eventType: Number(eventTypes[index]),
              seatingInfo
            };
          }
          return null;
        })
      );

      // Remove null values (tickets not owned by the user)
      setListedTickets(userListedTickets.filter(ticket => ticket !== null));
    } catch (error) {
      console.error("Failed to fetch listed tickets:", error);
      setError("Failed to fetch your listed tickets. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const cancelListing = async (tokenId) => {
    setIsLoading(true);
    setError(null);
    try {
      const tx = await marketplaceContract.cancelListing(tokenId);
      await tx.wait();
      setSuccess('Listing canceled successfully!');
      fetchListedTickets(); // Refresh the listed tickets
    } catch (error) {
      console.error("Failed to cancel listing:", error);
      setError(`Failed to cancel listing: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getEventTypeName = (eventType) => {
    const types = ['Private Event', 'Sports Game', 'Show', 'Concert', 'Conference'];
    return types[eventType] || 'Unknown';
  };

  if (isLoading) return <div className="text-center">Loading your listed tickets...</div>;
  if (error) return <div className="text-center text-red-500">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-center text-primary-600 mb-8">Your Listed Tickets</h2>
      {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">{success}</div>}
      
      {listedTickets.length === 0 ? (
        <p className="text-center text-gray-600">You haven't listed any tickets for sale.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listedTickets.map((ticket) => (
            <div key={ticket.tokenId} className="bg-white rounded-lg shadow-md p-4">
              <h3 className="font-semibold text-lg mb-2">{ticket.eventName}</h3>
              <p className="text-gray-600"><Calendar className="inline-block mr-2" size={16} /> {ticket.eventDate}</p>
              <p className="text-gray-600"><Tag className="inline-block mr-2" size={16} /> {getEventTypeName(ticket.eventType)}</p>
              <p className="text-gray-600"><MapPin className="inline-block mr-2" size={16} /> Seat: {ticket.seatingInfo}</p>
              <p className="text-gray-600"><Bitcoin className="inline-block mr-2" size={16} /> Price: {ticket.price} ETH</p>
              <button
                onClick={() => cancelListing(ticket.tokenId)}
                className="mt-4 btn btn-secondary w-full flex items-center justify-center"
              >
                <X size={16} className="mr-2" />
                Cancel Listing
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UserDashboard;
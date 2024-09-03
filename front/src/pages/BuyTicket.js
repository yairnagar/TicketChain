import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { Ticket, Calendar, MapPin, DollarSign, User, Loader, Tag } from 'lucide-react';

function BuyTicket({ contract, nftContract }) {
  const { tokenId } = useParams();
  const navigate = useNavigate();
  const [ticketDetails, setTicketDetails] = useState(null);
  const [price, setPrice] = useState(null);
  const [seller, setSeller] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (contract && nftContract && tokenId) {
      fetchTicketDetails();
    }
  }, [contract, nftContract, tokenId]);

  const fetchTicketDetails = async () => {
    try {
      setIsLoading(true);
      const listing = await contract.listings(tokenId);
      const [eventName, eventDate, eventType, seatingInfo] = await nftContract.getTicketDetails(tokenId);

      setTicketDetails({
        tokenId,
        eventName,
        eventDate: new Date(Number(eventDate) * 1000).toLocaleDateString(),
        eventType: Number(eventType),
        seatingInfo
      });
      setPrice(ethers.formatEther(listing.price));
      setSeller(listing.seller);
    } catch (error) {
      console.error('Error fetching ticket details:', error);
      setError('Failed to load ticket details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyTicket = async () => {
    if (!contract) return;
  
    try {
      setIsLoading(true);
      const priceInWei = ethers.parseEther(price);
      const tx = await contract.buyTicket(tokenId, { value: priceInWei });
      await tx.wait();
  
      alert('Ticket purchased successfully!');
      navigate('/');
    } catch (error) {
      console.error('Error buying ticket:', error);
      setError(`Failed to purchase ticket: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getEventTypeName = (eventType) => {
    const types = ['Private Event', 'Sports Game', 'Show', 'Concert', 'Conference'];
    return types[eventType] || 'Unknown';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-center text-primary-600 mb-8">Buy Ticket</h2>
      {isLoading && !ticketDetails ? (
        <div className="flex justify-center items-center">
          <Loader className="animate-spin text-primary-600 mr-3" size={24} />
          <p className="text-gray-600">Loading ticket details...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p>{error}</p>
        </div>
      ) : ticketDetails ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden max-w-md mx-auto">
          <div className="p-6">
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">{ticketDetails.eventName}</h3>
            <div className="space-y-3 mb-6">
              <DetailItem icon={<Calendar />} label="Date" value={ticketDetails.eventDate} />
              <DetailItem icon={<Tag />} label="Event Type" value={getEventTypeName(ticketDetails.eventType)} />
              <DetailItem icon={<MapPin />} label="Seat" value={ticketDetails.seatingInfo} />
              <DetailItem icon={<DollarSign />} label="Price" value={`${price} ETH`} />
              <DetailItem icon={<User />} label="Seller" value={`${seller.slice(0, 6)}...${seller.slice(-4)}`} />
            </div>
            <button 
              className="btn btn-primary w-full flex justify-center items-center"
              onClick={handleBuyTicket} 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader className="animate-spin mr-2" size={20} />
                  Processing...
                </>
              ) : (
                'Buy Ticket'
              )}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-600">No ticket details available</p>
      )}
    </div>
  );
}

function DetailItem({ icon, label, value }) {
  return (
    <div className="flex items-center text-gray-700">
      <div className="mr-3 text-primary-500">{icon}</div>
      <span className="font-medium mr-2">{label}:</span>
      <span>{value}</span>
    </div>
  );
}

export default BuyTicket;
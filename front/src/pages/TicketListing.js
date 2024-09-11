import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Tag, DollarSign, Ticket, Loader } from 'lucide-react';

const TicketListing = ({ ticketNFTContract, marketplaceContract }) => {
  const [ownedTokens, setOwnedTokens] = useState([]);
  const [selectedToken, setSelectedToken] = useState('');
  const [price, setPrice] = useState('');
  const [isListing, setIsListing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOwnedTokens();
  }, [ticketNFTContract]);

  const fetchOwnedTokens = async () => {
    if (ticketNFTContract) {
      try {
        const address = await ticketNFTContract.signer.getAddress();
        const balance = await ticketNFTContract.balanceOf(address);
        const tokens = [];
        for (let i = 0; i < balance; i++) {
          const tokenId = await ticketNFTContract.tokenOfOwnerByIndex(address, i);
          const [eventId, eventName, eventDate, , seatingInfo] = await ticketNFTContract.getTicketDetails(tokenId);
          tokens.push({
            tokenId: tokenId.toString(),
            eventName,
            eventDate: new Date(Number(eventDate) * 1000).toLocaleDateString(),
            seatingInfo
          });
        }
        setOwnedTokens(tokens);
      } catch (error) {
        console.error("Error fetching owned tokens:", error);
        setError("Failed to fetch owned tickets. Please try again.");
      }
    }
  };

  const handlePriceChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    setPrice(value);
  };

  const listTicket = async (e) => {
    e.preventDefault();
    if (!marketplaceContract || !selectedToken || !price) return;

    setIsListing(true);
    setError(null);

    try {
      const priceInWei = ethers.parseEther(price);
      const listingFee = await marketplaceContract.listingFee();

      // First, approve the marketplace contract to transfer the NFT
      const approveTx = await ticketNFTContract.approve(marketplaceContract.address, selectedToken);
      await approveTx.wait();

      // Then, list the ticket
      const listTx = await marketplaceContract.listTicket(selectedToken, priceInWei, { value: listingFee });
      await listTx.wait();

      alert('Ticket listed successfully!');
      setSelectedToken('');
      setPrice('');
      fetchOwnedTokens(); // Refresh the list of owned tokens
    } catch (error) {
      console.error("Error listing ticket:", error);
      setError(`Failed to list ticket: ${error.message}`);
    } finally {
      setIsListing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">List Your Ticket</h1>
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      <form onSubmit={listTicket} className="space-y-4">
        <div>
          <label htmlFor="tokenId" className="block text-sm font-medium text-gray-700">Select Ticket</label>
          <select
            id="tokenId"
            value={selectedToken}
            onChange={(e) => setSelectedToken(e.target.value)}
            required
            className="input mt-1"
          >
            <option value="">Select a ticket</option>
            {ownedTokens.map((token) => (
              <option key={token.tokenId} value={token.tokenId}>
                {token.eventName} - Seat: {token.seatingInfo} (ID: {token.tokenId})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">Listing Price (ETH)</label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="price"
              value={price}
              onChange={handlePriceChange}
              placeholder="0.00"
              required
              className="input pl-10"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isListing}
          className="btn btn-primary w-full flex justify-center items-center"
        >
          {isListing ? (
            <>
              <Loader className="animate-spin -ml-1 mr-3 h-5 w-5" />
              Listing...
            </>
          ) : (
            <>
              <Tag className="mr-2 h-5 w-5" />
              List Ticket for Sale
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default TicketListing;
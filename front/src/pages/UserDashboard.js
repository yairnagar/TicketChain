import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Send, Tag, Bitcoin, User, Ticket, X } from 'lucide-react';

function UserDashboard({ contract, nftContract }) {
  const [ownedTickets, setOwnedTickets] = useState([]);
  const [listedTickets, setListedTickets] = useState([]);
  const [invitedTickets, setInvitedTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState('');
  const [price, setPrice] = useState('');
  const [inviteeAddress, setInviteeAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchUserTickets();
  }, [contract]);

  const fetchUserTickets = async () => {
    try {
      const signer = await contract.runner.provider.getSigner();
      const address = await signer.getAddress();
      
      // Fetch owned tickets
      const ownedTicketsResult = await contract.getUserOwnedTickets(address);
      setOwnedTickets(ownedTicketsResult.map(ticket => ticket.toString()));

      // Fetch listed tickets
      const [tokenIds, prices, invitedBuyers] = await contract.getUserListedTickets(address);
      setListedTickets(tokenIds.map((tokenId, index) => ({
        tokenId: tokenId.toString(),
        price: ethers.formatEther(prices[index]),
        invitedBuyer: invitedBuyers[index]
      })));

      // Fetch invited tickets
      const [invitedTokenIds, invitedPrices, sellers] = await contract.getInvitedTickets(address);
      setInvitedTickets(invitedTokenIds.map((tokenId, index) => ({
        tokenId: tokenId.toString(),
        price: ethers.formatEther(invitedPrices[index]),
        seller: sellers[index]
      })));
    } catch (error) {
      console.error("Failed to fetch user tickets:", error);
      setError("Failed to fetch your tickets. Please try again.");
    }
  };

  const handlePriceChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    setPrice(value);
  };

  const listTicket = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!selectedTicket) {
        throw new Error('Please select a ticket.');
      }
      if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
        throw new Error('Please enter a valid price greater than 0.');
      }
      if (inviteeAddress && !ethers.isAddress(inviteeAddress)) {
        throw new Error('Please enter a valid Ethereum address for the invitee or leave it empty for public listing.');
      }

      const priceInWei = ethers.parseUnits(price, 'ether');

      // First, approve the marketplace contract
      const approveTx = await nftContract.approve(contract.target, selectedTicket);
      await approveTx.wait();

      // Then, list the ticket
      const tx = await contract.listTicket(selectedTicket, priceInWei, inviteeAddress || ethers.ZeroAddress);
      await tx.wait();

      setSuccess('Ticket listed successfully!');
      setSelectedTicket('');
      setPrice('');
      setInviteeAddress('');
      fetchUserTickets(); // Refresh the ticket lists
    } catch (error) {
      setError(`Failed to list ticket: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelListing = async (tokenId) => {
    setIsLoading(true);
    setError(null);
    try {
      const tx = await contract.cancelListing(tokenId);
      await tx.wait();
      setSuccess('Listing canceled successfully!');
      fetchUserTickets(); // Refresh the ticket lists
    } catch (error) {
      setError(`Failed to cancel listing: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const buyTicket = async (tokenId, price) => {
    setIsLoading(true);
    setError(null);
    try {
      const tx = await contract.buyTicket(tokenId, { value: ethers.parseEther(price) });
      await tx.wait();
      setSuccess('Ticket purchased successfully!');
      fetchUserTickets(); // Refresh the ticket lists
    } catch (error) {
      setError(`Failed to buy ticket: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-center text-primary-600 mb-8">User Dashboard</h2>
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
      {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">{success}</div>}
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* List Ticket Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">List a Ticket</h3>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="ticketSelect">
              Select Ticket
            </label>
            <div className="relative">
              <select
                className="input pl-10 appearance-none"
                id="ticketSelect"
                value={selectedTicket}
                onChange={(e) => setSelectedTicket(e.target.value)}
                required
              >
                <option value="">Choose a ticket</option>
                {ownedTickets.map((ticket) => (
                  <option key={ticket} value={ticket}>
                    Ticket ID: {ticket}
                  </option>
                ))}
              </select>
              <Ticket className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="price">
              Listing Price (ETH)
            </label>
            <div className="relative">
              <input
                className="input pl-10"
                id="price"
                type="text"
                value={price}
                onChange={handlePriceChange}
                placeholder="0.00"
                required
              />
              <Bitcoin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="inviteeAddress">
              Invitee's Ethereum Address (Optional)
            </label>
            <div className="relative">
              <input
                className="input pl-10"
                id="inviteeAddress"
                type="text"
                value={inviteeAddress}
                onChange={(e) => setInviteeAddress(e.target.value)}
                placeholder="0x... (Leave empty for public listing)"
              />
              <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
          <button
            className="btn btn-primary w-full transition-transform duration-200 ease-in-out transform hover:scale-105 flex items-center justify-center"
            onClick={listTicket}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⭕</span>
                Listing...
              </>
            ) : (
              <>
                <Tag className="mr-2" size={20} />
                List Ticket
              </>
              )}
              </button>
            </div>
    
            {/* Listed Tickets Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">Your Listed Tickets</h3>
              {listedTickets.length === 0 ? (
                <p>You have no listed tickets.</p>
              ) : (
                <ul className="space-y-4">
                  {listedTickets.map((ticket) => (
                    <li key={ticket.tokenId} className="flex justify-between items-center border-b pb-2">
                      <span>Ticket ID: {ticket.tokenId}</span>
                      <span>Price: {ticket.price} ETH</span>
                      {ticket.invitedBuyer !== ethers.ZeroAddress && (
                        <span className="text-xs text-gray-500">Private: {ticket.invitedBuyer.slice(0, 6)}...{ticket.invitedBuyer.slice(-4)}</span>
                      )}
                      <button
                        onClick={() => cancelListing(ticket.tokenId)}
                        className="btn btn-secondary flex items-center"
                        disabled={isLoading}
                      >
                        <X size={16} className="mr-1" />
                        Cancel
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
    
          {/* Invited Tickets Section */}
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">Tickets You're Invited to Buy</h3>
            {invitedTickets.length === 0 ? (
              <p>You have no invitations to buy tickets.</p>
            ) : (
              <ul className="space-y-4">
                {invitedTickets.map((ticket) => (
                  <li key={ticket.tokenId} className="flex justify-between items-center border-b pb-2">
                    <span>Ticket ID: {ticket.tokenId}</span>
                    <span>Price: {ticket.price} ETH</span>
                    <span className="text-xs text-gray-500">Seller: {ticket.seller.slice(0, 6)}...{ticket.seller.slice(-4)}</span>
                    <button
                      onClick={() => buyTicket(ticket.tokenId, ticket.price)}
                      className="btn btn-primary flex items-center"
                      disabled={isLoading}
                    >
                      <Ticket size={16} className="mr-1" />
                      Buy
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      );
    }
    
    export default UserDashboard;
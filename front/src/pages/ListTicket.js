import React, { useState } from 'react';
import { Tag, Bitcoin } from 'lucide-react';
import { ethers } from 'ethers';

function ListTicket({ contract, nftContract }) {
  const [tokenId, setTokenId] = useState('');
  const [price, setPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const approveMarketplace = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const tx = await nftContract.approve(contract.target, tokenId);
      await tx.wait();
      setSuccess('Marketplace approved successfully!');
    } catch (error) {
      setError(`Failed to approve marketplace: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const listTicket = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Validate price
      if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
        throw new Error('Please enter a valid price greater than 0.');
      }

      // Format price to 18 decimal places (wei)
      const priceInWei = ethers.parseUnits(price, 'ether');

      const tx = await contract.listTicket(tokenId, priceInWei);
      await tx.wait();
      setSuccess('Ticket listed successfully!');
      setTokenId('');
      setPrice('');
    } catch (error) {
      setError(`Failed to list ticket: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePriceChange = (e) => {
    // Allow only numbers and a single decimal point
    const value = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    setPrice(value);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-center text-primary-600 mb-8">List Your Ticket</h2>
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
      {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">{success}</div>}
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="tokenId">
            Ticket ID
          </label>
          <div className="relative">
            <input
              className="input pl-10"
              id="tokenId"
              type="number"
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
              required
              placeholder="Enter your ticket ID"
            />
            <Tag className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>
        <div className="mb-6">
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
        <button
          className="btn btn-secondary w-full mb-4 transition-transform duration-200 ease-in-out transform hover:scale-105"
          onClick={approveMarketplace}
          disabled={isLoading}
        >
          {isLoading ? 'Approving...' : 'Approve for Listing'}
        </button>
        <button
          className="btn btn-primary w-full transition-transform duration-200 ease-in-out transform hover:scale-105"
          onClick={listTicket}
          disabled={isLoading}
        >
          {isLoading ? 'Listing...' : 'List Ticket for Sale'}
        </button>
      </div>
    </div>
  );
}

export default ListTicket;
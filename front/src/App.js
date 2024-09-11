import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ethers } from 'ethers';
import Header from './components/Header';
import WalletConnection from './components/WalletConnection';
import Home from './pages/Home';
import EventCreation from './pages/EventCreation';
import EventManagement from './pages/EventManagement';
import TicketMinting from './pages/TicketMinting';
import TicketListing from './pages/TicketListing';
import TicketMarketplace from './pages/TicketMarketplace';
import UserDashboard from './pages/UserDashboard';

const EVENT_MANAGER_ADDRESS = '0x5835ED50C6e07D2448E2DC47De2fa594CbFFE5cA';
const TICKET_NFT_ADDRESS = '0x5835ED50C6e07D2448E2DC47De2fa594CbFFE5cA';
const TICKET_MARKETPLACE_ADDRESS = '0xfC465F72fCB861e82241DA21727e695B0B24A82e';

function App() {
  const [connectedAddress, setConnectedAddress] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  const handleWalletConnected = async (address) => {
    setConnectedAddress(address);
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        setProvider(provider);
        const signer = await provider.getSigner();
        setSigner(signer);
        console.log('Provider and signer initialized');
      } catch (error) {
        console.error('Error initializing provider or signer:', error);
        alert('Failed to initialize provider or signer. Please check your wallet connection and try again.');
      }
    } else {
      alert('Please install MetaMask!');
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Header />
        <WalletConnection onWalletConnected={handleWalletConnected} />
        
        <main className="container mx-auto px-4 py-8">
          {connectedAddress && provider && signer ? (
            <Routes>
              <Route path="/" element={<Home provider={provider} contractAddress={EVENT_MANAGER_ADDRESS} />} />
              <Route path="/create-event" element={<EventCreation provider={provider} signer={signer} contractAddress={EVENT_MANAGER_ADDRESS} />} />
              <Route path="/manage-events" element={<EventManagement provider={provider} signer={signer} contractAddress={EVENT_MANAGER_ADDRESS} />} />
              <Route path="/mint-ticket/:eventId" element={<TicketMinting provider={provider} signer={signer} contractAddress={TICKET_NFT_ADDRESS} />} />
              <Route path="/list-ticket" element={<TicketListing provider={provider} signer={signer} nftContractAddress={TICKET_NFT_ADDRESS} marketplaceContractAddress={TICKET_MARKETPLACE_ADDRESS} />} />
              <Route path="/marketplace" element={<TicketMarketplace provider={provider} signer={signer} nftContractAddress={TICKET_NFT_ADDRESS} marketplaceContractAddress={TICKET_MARKETPLACE_ADDRESS} />} />
              <Route path="/dashboard" element={<UserDashboard provider={provider} signer={signer} nftContractAddress={TICKET_NFT_ADDRESS} marketplaceContractAddress={TICKET_MARKETPLACE_ADDRESS} eventManagerContractAddress={EVENT_MANAGER_ADDRESS} />} />
            </Routes>
          ) : (
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Welcome to BlockTicket</h2>
              <p className="text-xl text-gray-600">Please connect your wallet to use the app.</p>
            </div>
          )}
        </main>
      </div>
    </Router>
  );
}

export default App;
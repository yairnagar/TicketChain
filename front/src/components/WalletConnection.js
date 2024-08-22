import React, { useState, useEffect } from 'react';
import { Wallet, Copy, Check, ExternalLink, Loader, AlertCircle, RefreshCw } from 'lucide-react';

function WalletConnection({ onConnected }) {
  const [connectedAddress, setConnectedAddress] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkIfWalletIsConnected();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  async function checkIfWalletIsConnected() {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          handleAccountsChanged(accounts);
        }
      } catch (error) {
        console.error("An error occurred while checking the wallet connection:", error);
      }
    }
  }

  async function connectWallet() {
    if (window.ethereum) {
      setIsConnecting(true);
      setError(null);
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        handleAccountsChanged(accounts);
      } catch (error) {
        console.error("Failed to connect to wallet:", error);
        handleConnectionError(error);
      } finally {
        setIsConnecting(false);
      }
    } else {
      setError("MetaMask not detected. Please install MetaMask and refresh the page.");
    }
  }

  function handleConnectionError(error) {
    if (error.code === -32002) {
      setError("MetaMask is already processing a connection request. Please open MetaMask to continue.");
    } else if (error.code === 4001) {
      setError("Connection rejected. Please try again and approve the connection request in MetaMask.");
    } else {
      setError("Failed to connect. Please ensure MetaMask is unlocked and try again.");
    }
  }

  function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
      setConnectedAddress(null);
      onConnected(null);
    } else if (accounts[0] !== connectedAddress) {
      setConnectedAddress(accounts[0]);
      onConnected(accounts[0]);
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(connectedAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openEtherscan = () => {
    window.open(`https://etherscan.io/address/${connectedAddress}`, '_blank');
  };

  return (
    <div className="bg-blue shadow-md py-4 mb-8">
      <div className="container mx-auto px-4">
        {connectedAddress ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Wallet className="text-primary-500" size={24} />
              <span className="text-sm font-medium text-gray-600">
                {connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={copyToClipboard}
                className="p-2 text-gray-400 hover:text-primary-500 transition-colors duration-300 rounded-full hover:bg-primary-50"
                title="Copy address"
              >
                {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
              </button>
              <button
                onClick={openEtherscan}
                className="p-2 text-gray-400 hover:text-primary-500 transition-colors duration-300 rounded-full hover:bg-primary-50"
                title="View on Etherscan"
              >
                <ExternalLink size={18} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <button 
              className={`btn btn-primary flex items-center space-x-2 ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={connectWallet}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <Loader className="animate-spin" size={20} />
              ) : (
                <Wallet size={20} />
              )}
              <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
            </button>
            {error && (
              <div className="mt-4 p-4 bg-red-100 rounded-md">
                <div className="flex items-center mb-2">
                  <AlertCircle size={20} className="text-red-500 mr-2" />
                  <h3 className="font-semibold text-red-700">Connection Error</h3>
                </div>
                <p className="text-sm text-red-600 mb-2">{error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
                >
                  <RefreshCw size={14} className="mr-1" />
                  Refresh page and try again
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default WalletConnection;
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Ticket, Tag, ShoppingCart, CreditCard, Loader, RefreshCw } from 'lucide-react';
import { ethers } from 'ethers';

// Make sure to import your contract ABI
import EVENT_MANAGER_ABI from '../abis/EventManager.json';

const Home = ({ provider, contractAddress }) => {
  const [activeEvents, setActiveEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchActiveEvents();
  }, [provider, contractAddress]);

  const fetchActiveEvents = async () => {
    if (!provider || !contractAddress) return;
    setIsLoading(true);
    setError(null);
    try {
      console.log('Fetching active events...');
      const fetchedEvents = [];

      const contract = new ethers.Contract(contractAddress, EVENT_MANAGER_ABI, provider);
      const getEventFunction = contract.interface.getFunction('getEvent');
      const eventCount = await contract.eventCount();

      for (let eventId = 1; eventId <= eventCount; eventId++) {
        try {
          const data = contract.interface.encodeFunctionData(getEventFunction, [eventId]);
          const result = await provider.call({
            to: contractAddress,
            data: data,
          });

          const decodedResult = contract.interface.decodeFunctionResult(getEventFunction, result);
          console.log('Decoded result:', decodedResult);

          const [id, name, date, venue, capacity, isActive, organizer] = decodedResult;

          if (isActive) {
            fetchedEvents.push({
              id: id.toString(),
              name,
              date: new Date(Number(date) * 1000), // Convert BigInt to Number
              venue,
              capacity: capacity.toString(),
              isActive,
              organizer,
            });
          }
        } catch (error) {
          console.error(`Error fetching event ${eventId}:`, error);
          // Continue to the next event even if there's an error
        }
      }

      console.log('Fetched active events:', fetchedEvents);
      setActiveEvents(fetchedEvents);
    } catch (error) {
      console.error('Error fetching active events:', error);
      setError('Failed to fetch active events. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchActiveEvents();
  };

  const FeatureCard = ({ icon, title, description }) => (
    <div className="bg-white rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <div className="text-primary-600 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );

  return (
    <div className="space-y-12">
      <section className="text-center space-y-4">
        <h1 className="text-5xl font-bold text-gray-800">Welcome to BlockTicket</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Your gateway to secure, transparent, and efficient event ticketing on the blockchain.
        </p>
      </section>
      
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/create-event" className="btn btn-primary text-lg py-3">
          Create New Event
        </Link>
        <Link to="/marketplace" className="btn btn-secondary text-lg py-3">
          Browse Marketplace
        </Link>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <FeatureCard 
          icon={<Ticket size={40} />}
          title="Mint NFT Tickets"
          description="Create unique, verifiable tickets as NFTs for your events."
        />
        <FeatureCard 
          icon={<Tag size={40} />}
          title="List and Sell"
          description="Easily list your tickets for sale on our decentralized marketplace."
        />
        <FeatureCard 
          icon={<ShoppingCart size={40} />}
          title="Buy with Confidence"
          description="Purchase tickets securely, with full transparency on the blockchain."
        />
        <FeatureCard 
          icon={<CreditCard size={40} />}
          title="Resell Securely"
          description="Resell your tickets through our platform with built-in royalties for organizers."
        />
        <FeatureCard 
          icon={<Calendar size={40} />}
          title="Event Management"
          description="Create, update, and manage your events with ease."
        />
        <FeatureCard 
          icon={<Users size={40} />}
          title="User Dashboard"
          description="Keep track of your tickets, listings, and event history in one place."
        />
      </section>

      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-semibold text-gray-800">Active Events</h2>
          <button
            onClick={handleRefresh}
            className="btn btn-secondary flex items-center"
            disabled={isLoading}
          >
            <RefreshCw className={`h-5 w-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="animate-spin h-12 w-12 text-primary-600" />
          </div>
        ) : error ? (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        ) : activeEvents.length === 0 ? (
          <p className="text-center text-gray-600 text-lg">No active events at the moment.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeEvents.map((event) => (
              <div key={event.id} className="bg-white rounded-xl shadow-md p-6 transition-all duration-300 hover:shadow-lg">
                <h3 className="text-xl font-semibold mb-3">{event.name}</h3>
                <p className="flex items-center text-gray-600 mb-2">
                  <Calendar className="mr-2 h-5 w-5" />
                  {event.date.toLocaleString()}
                </p>
                <p className="flex items-center text-gray-600 mb-2">
                  <MapPin className="mr-2 h-5 w-5" />
                  {event.venue}
                </p>
                <p className="flex items-center text-gray-600 mb-4">
                  <Users className="mr-2 h-5 w-5" />
                  Capacity: {event.capacity}
                </p>
                <Link 
                  to={`/mint-ticket/${event.id}`} 
                  className="btn btn-primary w-full flex items-center justify-center"
                >
                  <Ticket className="mr-2 h-5 w-5" />
                  Mint Ticket
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
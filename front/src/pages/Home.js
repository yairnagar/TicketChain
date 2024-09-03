import React from 'react';
import { Ticket, Bitcoin, Users } from 'lucide-react';

function Home({ connectedAddress }) {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl md:text-5xl font-bold text-center text-primary-600 mb-8">Welcome to BlockTicket</h1>
      <p className="text-xl text-center text-gray-600 mb-12 max-w-2xl mx-auto">
        The future of event ticketing on the blockchain. Secure, transparent, and easy to use.
      </p>
      
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <FeatureCard 
          icon={<Ticket className="h-12 w-12 text-primary-500" />}
          title="Mint Tickets"
          description="Create and issue unique NFT tickets for your events with ease."
        />
        <FeatureCard 
          icon={<Bitcoin className="h-12 w-12 text-secondary-500" />}
          title="Buy & Sell"
          description="Trade tickets securely on our decentralized marketplace."
        />
        <FeatureCard 
          icon={<Users className="h-12 w-12 text-primary-500" />}
          title="Attend Events"
          description="Use your NFT tickets to access exclusive events seamlessly."
        />
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center text-center">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2 text-gray-800">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

export default Home;
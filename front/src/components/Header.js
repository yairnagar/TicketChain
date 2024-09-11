import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Ticket } from 'lucide-react';

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="flex items-center space-x-2 text-2xl font-bold text-primary-600">
            <Ticket size={28} />
            <span>BlockTicket</span>
          </Link>
          <nav className="hidden md:flex space-x-6">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/create-event">Create Event</NavLink>
            <NavLink to="/manage-events">Manage Events</NavLink>
            <NavLink to="/list-ticket">List Ticket</NavLink>
            <NavLink to="/marketplace">Marketplace</NavLink>
            <NavLink to="/dashboard">My Dashboard</NavLink>
          </nav>
          <button
            className="md:hidden text-gray-600 hover:text-primary-600 transition-colors duration-300"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <nav className="flex flex-col space-y-2 px-4 py-2">
            <NavLink to="/" onClick={() => setIsMenuOpen(false)}>Home</NavLink>
            <NavLink to="/create-event" onClick={() => setIsMenuOpen(false)}>Create Event</NavLink>
            <NavLink to="/manage-events" onClick={() => setIsMenuOpen(false)}>Manage Events</NavLink>
            <NavLink to="/list-ticket" onClick={() => setIsMenuOpen(false)}>List Ticket</NavLink>
            <NavLink to="/marketplace" onClick={() => setIsMenuOpen(false)}>Marketplace</NavLink>
            <NavLink to="/dashboard" onClick={() => setIsMenuOpen(false)}>My Dashboard</NavLink>
          </nav>
        </div>
      )}
    </header>
  );
}

function NavLink({ to, children, ...props }) {
  return (
    <Link
      to={to}
      className="text-gray-600 hover:text-primary-600 transition-colors duration-300"
      {...props}
    >
      {children}
    </Link>
  );
}

export default Header;
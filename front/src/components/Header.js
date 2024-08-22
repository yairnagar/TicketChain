import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-2xl font-display font-bold text-primary-600">
        BlockTicket
          </Link>
          <nav className="hidden md:flex space-x-6">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/mint">Mint Ticket</NavLink>
            <NavLink to="/list">List Ticket</NavLink>
            <NavLink to="/marketplace">Marketplace</NavLink>
            <NavLink to="/mytickets">My Tickets</NavLink>
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
            <NavLink to="/mint" onClick={() => setIsMenuOpen(false)}>Mint Ticket</NavLink>
            <NavLink to="/list" onClick={() => setIsMenuOpen(false)}>List Ticket</NavLink>
            <NavLink to="/marketplace" onClick={() => setIsMenuOpen(false)}>Marketplace</NavLink>
            <NavLink to="/mytickets" onClick={() => setIsMenuOpen(false)}>My Tickets</NavLink>
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
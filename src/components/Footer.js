import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold mb-4">SureBank Shop</h3>
            <p className="text-gray-400 text-sm">
              Quality products with flexible payment options. Shop now, pay later with our installment plans.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/" className="hover:text-white">Home</Link></li>
              <li><Link to="/products" className="hover:text-white">Products</Link></li>
              <li><Link to="/cart" className="hover:text-white">Cart</Link></li>
              <li><Link to="/orders" className="hover:text-white">My Orders</Link></li>
            </ul>
          </div>

          {/* Payment Options */}
          <div>
            <h4 className="font-semibold mb-4">Payment Options</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Outright Payment</li>
              <li>Weekly Installments</li>
              <li>Monthly Installments</li>
              <li>Flexible Durations</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Email: support@surebank.com</li>
              <li>Phone: +234 XXX XXX XXXX</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} SureBank Shop. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

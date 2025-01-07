import React from 'react';
import { Search, Bell, Menu } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button className="sm:hidden p-2">
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold text-blue-600">NShorts</h1>
          </div>

          <div className="hidden sm:flex items-center flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search news..."
                className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:border-blue-500"
              />
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <Bell className="w-6 h-6" />
            </button>
            <button className="hidden sm:block bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700">
              Sign In
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
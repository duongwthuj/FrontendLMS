import React from 'react';
import { Menu, Search, Bell } from 'lucide-react';
import NotificationBell from './NotificationBell';

const Navbar = ({ onMenuClick }) => {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-secondary-200 sticky top-0 z-30">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1">
            <button
              onClick={onMenuClick}
              className="p-2 -ml-2 mr-2 text-secondary-500 hover:bg-secondary-100 rounded-lg lg:hidden transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Search Bar */}
            <div className="relative w-full max-w-md hidden md:block">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-secondary-400" />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm giáo viên, môn học..."
                className="block w-full pl-10 pr-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-secondary-400"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Notification Bell Component */}
            <NotificationBell />


          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;


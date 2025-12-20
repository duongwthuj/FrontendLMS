import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  BookMarked,
  GraduationCap,
  UserPlus,
  Layers,
  ClipboardCheck,
  LogOut
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user, logout, hasRole } = useAuth();

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'st', 'user'] },
    { path: '/users', icon: Users, label: 'Tài khoản', roles: ['admin'] },
    { path: '/teachers', icon: Users, label: 'Giáo viên', roles: ['admin'] },
    { path: '/subjects', icon: BookOpen, label: 'Môn học', roles: ['admin'] },
    { path: '/schedule', icon: Calendar, label: 'Lịch làm việc', roles: ['admin', 'st', 'user'] },
    { path: '/offset-classes', icon: BookMarked, label: 'Lớp Offset', roles: ['admin'] },
    { path: '/supplementary-classes', icon: Layers, label: 'Lớp Bổ Trợ', roles: ['admin'] },
    { path: '/test-classes', icon: ClipboardCheck, label: 'Lớp Test', roles: ['admin', 'st'] },
    { path: '/leave-requests', icon: UserPlus, label: 'Yêu cầu nghỉ', roles: ['admin'] },
  ];

  const filteredItems = menuItems.filter(item => hasRole(item.roles));

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-secondary-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div
        className={`${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-secondary-200 shadow-xl lg:shadow-none transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col`}
      >
        {/* Logo Area */}
        <div className="flex items-center px-8 py-6 border-b border-secondary-100">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-600 text-white shadow-lg shadow-primary-500/30 mr-3">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-secondary-900 tracking-tight">LMS Connect</h1>
            <p className="text-xs text-secondary-500 font-medium">Education Management</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto scrollbar-hide">
          <p className="px-4 text-xs font-semibold text-secondary-400 uppercase tracking-wider mb-4">
            Menu Chính
          </p>
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => window.innerWidth < 1024 && onClose && onClose()}
                className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  active
                    ? 'bg-primary-50 text-primary-700 shadow-sm'
                    : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                }`}
              >
                <Icon 
                  className={`w-5 h-5 mr-3 transition-colors ${
                    active ? 'text-primary-600' : 'text-secondary-400 group-hover:text-secondary-600'
                  }`} 
                />
                {item.label}
                {active && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-600" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile (Bottom) */}
        <div className="p-4 border-t border-secondary-100">
          <div className="flex items-center mb-4 p-3 rounded-xl bg-secondary-50 border border-secondary-100">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center border-2 border-white shadow-sm">
              <Users className="w-5 h-5 text-primary-600" />
            </div>
            <div className="ml-3">
            <Link to="/profile" className="block hover:underline">
                <p className="text-sm font-medium text-gray-700">{user?.name}</p>
            </Link>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Đăng xuất
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;


import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, hasRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
        <div className="flex h-screen items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    // If user is logged in but route is not allowed, redirect to a safe page or home
    // Avoid infinite loop if home is also restricted (which it is for User/ST except schedule)
    // If user only has access to Schedule, redirect to /schedule?
    if (user.role === 'user' || user.role === 'st') {
       if (location.pathname !== '/schedule' && location.pathname !== '/test-classes') {
            return <Navigate to="/schedule" replace />;
       }
    }
    // Default fallback
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;

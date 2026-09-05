import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, isAdmin } = useAuth();

  if (!user || (requireAdmin && !isAdmin)) {
    return <Navigate to="/login" replace state={{ message: requireAdmin ? 'Administrator privileges required.' : 'Please log in to proceed.' }} />;
  }

  return children;
};

export default ProtectedRoute;

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useClinic } from '../../contexts/ClinicContext';

export function ProtectedRoute({ allowedRoles }) {
  const { isLoggedIn, role } = useClinic();

  if (!isLoggedIn) {
    // User is not logged in, redirect to login
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // User is logged in but does not have the required role, redirect to root
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;

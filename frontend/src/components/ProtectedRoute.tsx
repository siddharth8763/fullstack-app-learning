// =============================================================
// ProtectedRoute — guards routes from unauthenticated access
// INTERVIEW: React Router v6 uses Outlet to render child routes.
// The ProtectedRoute component checks auth state and either:
//   - renders <Outlet /> (proceed to the protected page)
//   - redirects to /login (not authenticated)
//
// Using state.from allows redirecting back to the original URL
// after login (deep-linking support).
// =============================================================

import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../store/store';

export const ProtectedRoute: React.FC = () => {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    // Pass the attempted location so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

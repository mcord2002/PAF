import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { defaultDashboardPath, primaryDashboardRole } from '../utils/dashboardPath';
import { hasRole } from '../utils/roles';

/**
 * Requires an authenticated user (parent layout should already enforce this)
 * and at least one of the given roles.
 */
export default function RoleRoute({ roles, exactPrimaryRole, children }) {
  const { user } = useAuth();
  if (exactPrimaryRole) {
    const current = primaryDashboardRole(user);
    if (current !== exactPrimaryRole) {
      return <Navigate to={defaultDashboardPath(user)} replace />;
    }
    return children;
  }
  if (!roles || roles.length === 0) {
    return children;
  }
  const ok = roles.some((r) => hasRole(user, r));
  if (!ok) {
    return <Navigate to={defaultDashboardPath(user)} replace />;
  }
  return children;
}


 //Add Role-Based Route Protection (Frontend) 
 //  Implement role-based route guards for frontend access control (different roles for different pages).
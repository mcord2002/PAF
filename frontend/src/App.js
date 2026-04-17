import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import RoleRoute from './components/RoleRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserDashboard from './pages/dashboards/UserDashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import TechnicianDashboard from './pages/dashboards/TechnicianDashboard';
import ResourcesPage from './pages/ResourcesPage';
import BookingsPage from './pages/BookingsPage';
import TicketsPage from './pages/TicketsPage';
import TicketEditorPage from './pages/TicketEditorPage';
import TicketDetailPage from './pages/TicketDetailPage';
import NotificationsPage from './pages/NotificationsPage';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Navigate to="/register/user" replace />} />
        <Route path="/register/:roleType" element={<RegisterPage />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route
            path="/dashboard/user"
            element={
              <RoleRoute exactPrimaryRole="USER">
                <UserDashboard />
              </RoleRoute>
            }
          />
          <Route
            path="/dashboard/admin"
            element={
              <RoleRoute exactPrimaryRole="ADMIN">
                <AdminDashboard />
              </RoleRoute>
            }
          />
          <Route
            path="/dashboard/technician"
            element={
              <RoleRoute exactPrimaryRole="TECHNICIAN">
                <TechnicianDashboard />
              </RoleRoute>
            }
          />
          <Route
            path="/resources"
            element={
              <RoleRoute roles={['USER', 'ADMIN', 'TECHNICIAN']}>
                <ResourcesPage />
              </RoleRoute>
            }
          />
          <Route
            path="/bookings"
            element={
              <RoleRoute roles={['USER', 'ADMIN']}>
                <BookingsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/tickets"
            element={
              <RoleRoute roles={['USER', 'ADMIN', 'TECHNICIAN']}>
                <TicketsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/tickets/new"
            element={
              <RoleRoute roles={['USER', 'ADMIN']}>
                <TicketEditorPage />
              </RoleRoute>
            }
          />
          <Route
            path="/tickets/:id"
            element={
              <RoleRoute roles={['USER', 'ADMIN', 'TECHNICIAN']}>
                <TicketDetailPage />
              </RoleRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <RoleRoute roles={['USER', 'ADMIN', 'TECHNICIAN']}>
                <NotificationsPage />
              </RoleRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;

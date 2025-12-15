import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Teachers from './pages/Teachers';
import TeacherDetails from './pages/TeacherDetails';
import Subjects from './pages/Subjects';
import Schedule from './pages/Schedule';
import OffsetClasses from './pages/OffsetClasses';
import SupplementaryClasses from './pages/SupplementaryClasses';
import TestClasses from './pages/TestClasses';
import LeaveRequests from './pages/LeaveRequests';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';

import { NotificationProvider } from './components/ui/NotificationProvider';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <NotificationProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/" element={
              <ProtectedRoute allowedRoles={['admin', 'st', 'user']}>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/teachers" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <Teachers />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/teachers/:id" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <TeacherDetails />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/subjects" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <Subjects />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/offset-classes" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <OffsetClasses />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/supplementary-classes" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <SupplementaryClasses />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/leave-requests" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <LeaveRequests />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Shared Routes */}
            <Route path="/schedule" element={
              <ProtectedRoute allowedRoles={['admin', 'st', 'user']}>
                <Layout>
                  <Schedule />
                </Layout>
              </ProtectedRoute>
            } />
            
             <Route path="/profile" element={
              <ProtectedRoute allowedRoles={['admin', 'st', 'user']}>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/test-classes" element={
              <ProtectedRoute allowedRoles={['admin', 'st']}>
                <Layout>
                  <TestClasses />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Catch all */}
             <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </NotificationProvider>
    </Router>
  );
}

export default App;

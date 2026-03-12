import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/contexts/SupabaseAuthContext';

// Layouts
import MainLayout from '@/layouts/MainLayout';
import AppLayout from '@/layouts/AppLayout';

// Public Pages
import HomePage from '@/pages/HomePage';
import BookingPage from '@/pages/BookingPage';
import LoginPage from '@/pages/LoginPage';
import NotFoundPage from '@/pages/NotFoundPage';

// Protected App Pages
import DashboardPage from '@/pages/app/DashboardPage';
import TrainingPage from '@/pages/app/TrainingPage';
import NutritionPage from '@/pages/app/NutritionPage';
import ProgressPage from '@/pages/app/ProgressPage';
import ChatPage from '@/pages/app/ChatPage';
import ResourcesAppPage from '@/pages/app/ResourcesAppPage';
import CheckInPage from '@/pages/app/CheckInPage';

// Admin Pages
import AdminPage from '@/pages/admin/AdminPage';

// Admin Route Guard
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  
  // Basic check - in production you might want to check a role in the database or metadata
  // Here we just check if user is logged in for simplicity, as the AdminPage handles its own role checks internally
  if (!user) return <Navigate to="/login" replace />;
  
  return children;
};

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  
  if (!user) return <Navigate to="/login" replace />;
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/agendar" element={<BookingPage />} />
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* Protected App Routes */}
          <Route path="/app" element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route index element={<DashboardPage />} />
            <Route path="entrenamiento" element={<TrainingPage />} />
            <Route path="nutricion" element={<NutritionPage />} />
            <Route path="progreso" element={<ProgressPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="recursos" element={<ResourcesAppPage />} />
            <Route path="checkin" element={<CheckInPage />} />
            
            {/* Admin Route */}
            <Route path="admin" element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            } />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>

        <Toaster />
      </Router>
    </AuthProvider>
  );
}

export default App;
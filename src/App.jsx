import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

import Login from "./pages/Login";
import AttendanceDetails from "./pages/AttendanceDetails";
import AttendanceOverview from "./pages/AttendanceOverview";
import EmployeeProfile from "./pages/EmployeeProfile";
import EmployeeList from "./pages/EmployeeList";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const user = localStorage.getItem('user');
      setIsAuthenticated(!!user);
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  if (isLoading) {
    // Show loading state while checking authentication
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/" replace />;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner 
          position="top-center" 
          closeButton={true} 
          className="font-light"
          toastOptions={{
            style: {
              borderRadius: '12px',
              backdropFilter: 'blur(8px)',
              background: 'rgba(17, 24, 39, 0.8)', // Dark background
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
            }
          }}
        />
        <BrowserRouter>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Login />} />
              <Route 
                path="/attendance/overview" 
                element={
                  <ProtectedRoute>
                    <AttendanceOverview />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/attendance/:employeeId" 
                element={
                  <ProtectedRoute>
                    <AttendanceDetails />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/employee/list" 
                element={
                  <ProtectedRoute>
                    <EmployeeList />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/reports" 
                element={
                  <ProtectedRoute>
                    <Reports />
                  </ProtectedRoute>
                } 
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnimatePresence>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

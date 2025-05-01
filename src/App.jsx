import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { AnimatePresence } from 'framer-motion';

import Login from "./pages/Login";
import AttendanceDetails from "./pages/AttendanceDetails";
import AttendanceOverview from "./pages/AttendanceOverview";
import EmployeeProfile from "./pages/EmployeeProfile";
import EmployeeList from "./pages/EmployeeList";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
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
            <Route path="/attendance/overview" element={<AttendanceOverview />} />
            <Route path="/attendance/:employeeId" element={<AttendanceDetails />} />
            <Route path="/employee/list" element={<EmployeeList />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

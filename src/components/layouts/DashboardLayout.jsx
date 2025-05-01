import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Button } from '../ui/button';
import { 
  Menu, 
  X, 
  Users, 
  Calendar, 
  BarChart4, 
  LogOut,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from "../../assets/schbanghashtag.png"

const DashboardLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileView, setIsMobileView] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // Check for authenticated user
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/');
      return;
    }
    
    try {
      setUser(JSON.parse(storedUser));
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/');
    }
    
    // Handle responsive sidebar
    const checkWindowSize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobileView(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    checkWindowSize();
    window.addEventListener('resize', checkWindowSize);
    
    return () => window.removeEventListener('resize', checkWindowSize);
  }, [navigate]);
  
  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };
  
  const navItems = [
    { name: 'Attendance', icon: Calendar, path: '/attendance/overview' },
    { name: 'Employees', icon: Users, path: '/employee/list' },
    { name: 'Reports', icon: BarChart4, path: '/reports' }
  ];

  const sidebarVariants = {
    open: { x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
    closed: { x: "-100%", transition: { type: "spring", stiffness: 300, damping: 30 } }
  };
  
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Sidebar */}
      <motion.div
        className="fixed top-0 left-0 z-40 h-full w-72 bg-slate-800/50 backdrop-blur-xl border-r border-slate-700/50 lg:translate-x-0"
        variants={sidebarVariants}
        initial={isMobileView ? "closed" : "open"}
        animate={isSidebarOpen ? "open" : "closed"}
      >
        <div className="flex flex-col h-full">
          <motion.div 
            className="flex items-center h-20 px-6 border-b border-slate-700/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <Link to="/attendance/overview" className="flex items-center space-x-3">
              <img 
                src={logo}
                alt="Schbang Logo" 
                className="h-10"
              />
              <span className="text-xl font-light text-slate-100">SchbangPeople</span>
            </Link>
          </motion.div>
          
          <div className="flex-1 px-3 py-8 overflow-y-auto">
            <ul className="space-y-2">
              {navItems.map((item, index) => {
                const isActive = location.pathname === item.path;
                return (
                  <motion.li 
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
                  >
                    <Link
                      to={item.path}
                      className={`
                        flex items-center justify-between p-3 rounded-lg transition-all duration-200
                        ${isActive 
                          ? 'bg-slate-700/50 text-slate-100' 
                          : 'text-slate-400 hover:bg-slate-700/30 hover:text-slate-100'
                        }
                      `}
                    >
                      <div className="flex items-center">
                        <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                        <span className="ml-3 font-medium">{item.name}</span>
                      </div>
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronRight className="w-4 h-4 text-blue-400" />
                        </motion.div>
                      )}
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          </div>
          
          <div className="p-4 mt-auto border-t border-slate-700/50">
            <div className="mb-4 px-2">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-slate-700/50 flex items-center justify-center">
                  <span className="text-slate-300 font-medium">
                    {user?.name?.charAt(0) || 'C'}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-100">
                    {user?.name || 'Client'}
                  </div>
                  <div className="text-xs text-slate-400">
                    {user?.email || 'client@schbang.com'}
                  </div>
                </div>
              </div>
            </div>
            
            <Button
              variant="ghost"
              className="w-full flex items-center justify-center gap-2 py-3 font-medium text-red-400 hover:text-white hover:bg-red-500/80 transition-all duration-150"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
              <span>Sign out</span>
            </Button>
          </div>
        </div>
      </motion.div>
      
      {/* Main Content */}
      <div className={`${isSidebarOpen ? 'lg:ml-72' : ''} transition-all duration-300 ease-in-out`}>
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-6 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-slate-400 hover:text-slate-100 hover:bg-slate-700/30"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="min-h-[calc(100vh-8rem)]">
          {children}
        </main>
        
        {/* Footer */}
        <footer className="py-6 px-6 border-t border-slate-700/50">
          <div className="text-center text-sm text-slate-400 font-light">
            {new Date().getFullYear()} SchbangPeople. All rights reserved.
          </div>
        </footer>
      </div>
      
      {/* Mobile sidebar overlay */}
      {isMobileView && isSidebarOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-30 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;

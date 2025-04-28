
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../ui/button';
import ThemeToggle from '../ThemeToggle';
import { 
  Menu, 
  X, 
  Home, 
  Users, 
  Calendar, 
  BarChart4, 
  Settings, 
  LogOut 
} from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileView, setIsMobileView] = useState(false);
  const navigate = useNavigate();
  
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
    { name: 'Dashboard', icon: Home, path: '/dashboard' },
    { name: 'Attendance', icon: Calendar, path: '/attendance/overview' },
    { name: 'Employees', icon: Users, path: '/employee/list' },
    { name: 'Reports', icon: BarChart4, path: '/reports' },
    { name: 'Settings', icon: Settings, path: '/settings' }
  ];
  
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Sidebar */}
      <div
        className={`${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed top-0 left-0 z-40 h-full w-64 transition-transform duration-300 ease-in-out bg-white dark:bg-black border-r border-gray-100 dark:border-gray-900 lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-20 px-6">
            <h1 className="text-2xl font-light">
              SchbangPeople
            </h1>
          </div>
          
          <div className="flex-1 px-3 py-8 overflow-y-auto">
            <ul className="space-y-6">
              {navItems.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className="flex items-center p-3 text-base font-light rounded-lg hover:bg-gray-50 dark:hover:bg-gray-950 group"
                  >
                    <item.icon className="w-5 h-5 text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors" />
                    <span className="ml-3 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="p-4 border-t border-gray-100 dark:border-gray-900">
            <Button
              variant="ghost" 
              className="w-full justify-start text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-transparent"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className={`${isSidebarOpen ? 'lg:ml-64' : ''} transition-all duration-300 ease-in-out`}>
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-6 bg-white/80 dark:bg-black/80 backdrop-blur-md">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <X /> : <Menu />}
            </Button>
          </div>
          
          <div className="flex items-center space-x-6">
            <ThemeToggle />
            <div className="text-sm font-light">
              {user?.name || 'Client'}
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="px-6 py-10">
          {children}
        </main>
        
        {/* Footer */}
        <footer className="py-10 px-6 border-t border-gray-100 dark:border-gray-900">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 font-light">
            © {new Date().getFullYear()} SchbangPeople. All rights reserved.
          </div>
        </footer>
      </div>
      
      {/* Mobile sidebar overlay */}
      {isMobileView && isSidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;

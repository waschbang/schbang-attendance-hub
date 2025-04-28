
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
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <div
        className={`${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed top-0 left-0 z-40 h-full w-64 transition-transform duration-300 ease-in-out bg-card border-r border-border lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-16 px-6 border-b border-border">
            <h1 className="text-xl font-bold bg-clip-text text-transparent animated-gradient">
              SchbangPeople
            </h1>
          </div>
          
          <div className="flex-1 px-3 py-4 overflow-y-auto">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className="flex items-center p-3 text-base font-medium rounded-lg hover:bg-accent/10 group"
                  >
                    <item.icon className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <span className="ml-3 text-muted-foreground group-hover:text-foreground transition-colors">{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost" 
              className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className={`${isSidebarOpen ? 'lg:ml-64' : ''} transition-all duration-300 ease-in-out`}>
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-background/95 backdrop-blur-sm border-b border-border">
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
          
          <div className="flex items-center space-x-3">
            <ThemeToggle />
            <div className="text-sm font-medium">
              {user?.name || 'Client'}
            </div>
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              {user?.name?.charAt(0) || 'C'}
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="px-4 sm:px-6 py-8">
          {children}
        </main>
        
        {/* Footer */}
        <footer className="py-6 px-4 sm:px-6 border-t border-border">
          <div className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} SchbangPeople. All rights reserved.
          </div>
        </footer>
      </div>
      
      {/* Mobile sidebar overlay */}
      {isMobileView && isSidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;

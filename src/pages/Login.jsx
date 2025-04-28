
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useToast } from '../components/ui/use-toast';
import { Eye, EyeOff } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Mock login for demo purposes
      setTimeout(() => {
        // Hardcoded credentials for demo - replace with actual auth
        if (email === 'demo@client.com' && password === 'password') {
          toast({
            title: "Success",
            description: "Login successful!",
          });
          localStorage.setItem('user', JSON.stringify({ email, name: 'Demo Client' }));
          navigate('/dashboard');
        } else {
          toast({
            title: "Error",
            description: "Invalid email or password.",
            variant: "destructive",
          });
        }
        setIsLoading(false);
      }, 1500);
      
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Error",
        description: "An error occurred during login. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-white dark:bg-black p-4 relative">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-light mb-6">SchbangPeople</h1>
          <p className="text-muted-foreground text-lg font-light">
            Employee Attendance Portal
          </p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-8">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 bg-transparent border-x-0 border-t-0 border-b border-gray-200 dark:border-gray-800 rounded-none px-0 text-lg font-light"
              required
            />
          </div>
          
          <div className="space-y-2 relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 bg-transparent border-x-0 border-t-0 border-b border-gray-200 dark:border-gray-800 rounded-none px-0 text-lg font-light pr-10"
              required
            />
            <button
              type="button"
              className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="remember"
                className="h-4 w-4 rounded-sm border-gray-200 dark:border-gray-800"
              />
              <label 
                htmlFor="remember"
                className="text-sm text-muted-foreground font-light"
              >
                Remember me
              </label>
            </div>
            <a
              href="#"
              className="text-sm text-primary hover:underline font-light"
            >
              Forgot password?
            </a>
          </div>
          
          <Button
            type="submit"
            className="w-full h-12 mt-6 bg-black dark:bg-white text-white dark:text-black rounded-full font-light hover:opacity-90 transition-opacity"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        
        <div className="mt-16 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} SchbangPeople. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;

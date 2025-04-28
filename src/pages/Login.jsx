
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
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
      // Replace with actual API call to your authentication service
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
            title: "Authentication Error",
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-primary">
          <span className="animated-gradient bg-clip-text text-transparent">SchbangPeople</span>
        </h1>
        <p className="mt-2 text-muted-foreground">Client Attendance Portal</p>
      </div>
      
      <Card className="w-full max-w-md shadow-lg glass-card animate-fade-in">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">
            Sign in to access your employee attendance dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="client@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-10"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="remember"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label
                  htmlFor="remember"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  Remember me
                </label>
              </div>
              <a
                href="#"
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </a>
            </div>
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Need assistance? Contact{" "}
            <a href="mailto:support@schbang.com" className="text-primary hover:underline">
              support@schbang.com
            </a>
          </p>
        </CardFooter>
      </Card>
      
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} SchbangPeople. All rights reserved.</p>
      </div>
    </div>
  );
};

export default Login;

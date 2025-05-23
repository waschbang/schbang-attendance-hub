import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import logo from "../assets/schbanghashtag.png";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      navigate('/attendance/overview');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Error", {
        description: "Please enter both email and password.",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Mock login for demo purposes
      setTimeout(() => {
        // Hardcoded credentials for demo - replace with actual auth
        if (email === 'demo@client.com' && password === 'password') {
          toast.success("Login successful!", {
            description: "Welcome back!",
          });
          const userData = { email, name: 'User' };
          localStorage.setItem('user', JSON.stringify(userData));
          localStorage.setItem('isAuthenticated', 'true');
          navigate('/attendance/overview');
        } else if (email === 'hk@Schbangpeople.com' && password === 'Schbang@mumbai') {
          toast.success("Login successful!", {
            description: "Welcome back, Harshil!",
          });
          const userData = { email, name: 'Harshil Karia' };
          localStorage.setItem('user', JSON.stringify(userData));
          localStorage.setItem('isAuthenticated', 'true');
          navigate('/attendance/overview');
        } else if (email === 'client@schbang.com' && password === 'Schbang#678') {
          toast.success("Login successful!", {
            description: "Welcome back!",
          });
          const userData = { email, name: 'Client' };
          localStorage.setItem('user', JSON.stringify(userData));
          localStorage.setItem('isAuthenticated', 'true');
          navigate('/attendance/overview');
        } else if (email === 'hk@Schbangpeople.com' && password !== 'Schbang@mumbai') {
          toast.error("Authentication Error", {
            description: "Incorrect password for this account. Please try again.",
          });
        } else if (email === 'demo@client.com' && password !== 'password') {
          toast.error("Authentication Error", {
            description: "Incorrect password for this account. Please try again.",
          });
        } else if (email === 'client@schbang.com' && password !== 'Schbang#678') {
          toast.error("Authentication Error", {
            description: "Incorrect password for this account. Please try again.",
          });
        } else {
          toast.error("Account Not Found", {
            description: "No account exists with this email. Please check your credentials.",
          });
        }
        setIsLoading(false);
      }, 1500);
      
    } catch (error) {
      // Login error occurred
      toast.error("Error", {
        description: "An error occurred during login. Please try again.",
      });
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.3
      } 
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black p-2 sm:p-4 relative">
      <motion.div 
        className="w-full max-w-md mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="text-center mb-12"
          variants={itemVariants}
        >
          <motion.div 
            className="flex items-center justify-center mb-8"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          >
            <img 
              src={logo}
              alt="Schbang Logo" 
              className="h-24 w-24 md:h-32 md:w-32"
            />
          </motion.div>
          <h1 className="text-3xl sm:text-4xl font-light mb-4 sm:mb-6 tracking-tight">SchbangPeople</h1>
          <p className="text-muted-foreground text-base sm:text-lg font-light">
            Employee Attendance Portal
          </p>
        </motion.div>
        
        <motion.form 
          onSubmit={handleLogin} 
          className="space-y-6 sm:space-y-10 px-2 sm:px-4 md:px-0 w-full"
          variants={containerVariants}
        >
          <motion.div 
            className="space-y-4"
            variants={itemVariants}
          >
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 sm:h-14 bg-transparent border-x-0 border-t-0 border-b border-gray-200 dark:border-gray-800 rounded-none px-1 text-base sm:text-lg font-light transition-all duration-300 focus:border-black dark:focus:border-white"
              required
            />
          </motion.div>
          
          <motion.div 
            className="space-y-2 relative"
            variants={itemVariants}
          >
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 sm:h-14 bg-transparent border-x-0 border-t-0 border-b border-gray-200 dark:border-gray-800 rounded-none px-1 text-base sm:text-lg font-light pr-10 transition-all duration-300 focus:border-black dark:focus:border-white"
              required
            />
            <button
              type="button"
              className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground p-2 transition-opacity duration-200 hover:opacity-70"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </motion.div>
          
          <motion.div 
            className="flex items-center space-x-2"
            variants={itemVariants}
          >
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded-sm border-gray-200 dark:border-gray-800 transition-colors"
            />
            <label 
              htmlFor="remember"
              className="text-sm text-muted-foreground font-light"
            >
              Remember me
            </label>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Button
              type="submit"
              className="w-full h-12 sm:h-14 mt-4 sm:mt-8 bg-black dark:bg-white text-white dark:text-black rounded-full font-light transition-all duration-300 hover:opacity-90 hover:scale-[0.99] active:scale-[0.97]"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </motion.div>
        </motion.form>
        
        <motion.div 
          className="mt-20 text-center text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <p> {new Date().getFullYear()} SchbangPeople. All rights reserved.</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;

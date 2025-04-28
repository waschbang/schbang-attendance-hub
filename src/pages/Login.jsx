
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useToast } from '../components/ui/use-toast';
import { Eye, EyeOff } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { motion } from 'framer-motion';

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
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-black p-4 relative">
      <motion.div 
        className="absolute top-6 right-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <ThemeToggle />
      </motion.div>
      
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
              src="/schbang-logo.png" 
              alt="Schbang Logo" 
              className="h-14 md:h-16"
            />
          </motion.div>
          <h1 className="text-4xl font-light mb-6 tracking-tight">SchbangPeople</h1>
          <p className="text-muted-foreground text-lg font-light">
            Employee Attendance Portal
          </p>
        </motion.div>
        
        <motion.form 
          onSubmit={handleLogin} 
          className="space-y-10 px-4 md:px-0"
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
              className="h-14 bg-transparent border-x-0 border-t-0 border-b border-gray-200 dark:border-gray-800 rounded-none px-1 text-lg font-light transition-all duration-300 focus:border-black dark:focus:border-white"
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
              className="h-14 bg-transparent border-x-0 border-t-0 border-b border-gray-200 dark:border-gray-800 rounded-none px-1 text-lg font-light pr-10 transition-all duration-300 focus:border-black dark:focus:border-white"
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
            className="flex items-center justify-between"
            variants={itemVariants}
          >
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="remember"
                className="h-4 w-4 rounded-sm border-gray-200 dark:border-gray-800 transition-colors"
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
              className="text-sm text-primary hover:underline font-light transition-all duration-200"
            >
              Forgot password?
            </a>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Button
              type="submit"
              className="w-full h-14 mt-8 bg-black dark:bg-white text-white dark:text-black rounded-full font-light transition-all duration-300 hover:opacity-90 hover:scale-[0.99] active:scale-[0.97]"
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
          <p>© {new Date().getFullYear()} SchbangPeople. All rights reserved.</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;

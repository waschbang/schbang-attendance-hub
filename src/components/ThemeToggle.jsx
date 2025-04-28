
import { useTheme } from "next-themes";
import { Button } from "./ui/button";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // After mounting, we can safely show the theme toggle
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="w-10 h-10"></div>; // Placeholder to prevent layout shift
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        aria-label="Toggle theme"
        className="relative w-10 h-10 rounded-full overflow-hidden transition-all duration-500 ease-in-out hover:bg-gray-100/80 dark:hover:bg-gray-900/80 group"
      >
        <div className="absolute inset-0 flex items-center justify-center">
          {theme === "dark" ? (
            <motion.div
              initial={{ rotate: -45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            >
              <Sun 
                size={20} 
                className="text-gray-300 group-hover:text-gray-100 transition-all duration-300" 
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ rotate: 45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            >
              <Moon 
                size={20} 
                className="text-gray-600 group-hover:text-gray-800 transition-all duration-300" 
              />
            </motion.div>
          )}
        </div>
      </Button>
    </motion.div>
  );
};

export default ThemeToggle;

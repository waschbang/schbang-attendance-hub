
import { useTheme } from "next-themes";
import { Button } from "./ui/button";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // After mounting, we can safely show the theme toggle
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="w-10 h-10"></div>; // Placeholder to prevent layout shift
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
      className="relative w-10 h-10 rounded-full overflow-hidden transition-all duration-500 ease-in-out hover:bg-gray-100/80 dark:hover:bg-gray-900/80 group"
    >
      <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 ease-in-out">
        {theme === "dark" ? (
          <Sun 
            size={20} 
            className="opacity-100 group-hover:scale-110 transition-transform duration-300 text-gray-300" 
          />
        ) : (
          <Moon 
            size={20} 
            className="opacity-100 group-hover:scale-110 transition-transform duration-300 text-gray-600" 
          />
        )}
      </div>
    </Button>
  );
};

export default ThemeToggle;

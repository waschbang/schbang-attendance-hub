
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
    return <div className="w-9 h-9"></div>; // Placeholder of same size to prevent layout shift
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
      className="rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900"
    >
      {theme === "dark" ? (
        <Sun size={18} className="text-gray-400" />
      ) : (
        <Moon size={18} className="text-gray-600" />
      )}
    </Button>
  );
};

export default ThemeToggle;

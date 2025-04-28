
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
      className="rounded-full"
    >
      {theme === "dark" ? (
        <Sun size={20} className="text-yellow-400" />
      ) : (
        <Moon size={20} className="text-schbang-primary" />
      )}
    </Button>
  );
};

export default ThemeToggle;

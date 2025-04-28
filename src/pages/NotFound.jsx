
import { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Button } from "../components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted px-6">
      <div className="text-center">
        <h1 className="text-8xl font-bold text-primary mb-6">404</h1>
        <div className="w-16 h-1 bg-primary mx-auto mb-6"></div>
        <p className="text-2xl font-semibold mb-3">Page Not Found</p>
        <p className="text-muted-foreground mb-8 max-w-md">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <Button asChild size="lg">
          <Link to="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;

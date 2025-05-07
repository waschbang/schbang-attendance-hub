import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initAuthService } from './services/authService'

// Initialize the authentication service to get the first token
initAuthService()
  .then(() => {
    // Authentication service initialized successfully
  })
  .catch(error => {
    // Failed to initialize authentication service
  });

createRoot(document.getElementById("root")!).render(<App />);

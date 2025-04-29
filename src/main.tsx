import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initAuthService } from './services/authService'

// Initialize the authentication service to get the first token
initAuthService()
  .then(() => {
    console.log('Authentication service initialized successfully');
  })
  .catch(error => {
    console.error('Failed to initialize authentication service:', error);
  });

createRoot(document.getElementById("root")!).render(<App />);

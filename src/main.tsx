import React from 'react';
import { createRoot } from 'react-dom/client';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { msalConfig } from '../authConfig'; // Adjust path if necessary
import App from './App';
import './firebase'; // Import firebase to ensure initialization occurs

// Create MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

// Get the root element
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');
const root = createRoot(rootElement);

// Render a loading indicator initially
root.render(
  <React.StrictMode>
    <div>Initializing authentication...</div> {/* Or a more sophisticated loader */}
  </React.StrictMode>
);

// Define an async function to initialize MSAL and render the app
const initializeAndRender = async () => {
  try {
    // Initialize MSAL instance - MUST be done before any other MSAL operations
    await msalInstance.initialize();
    console.log("MSAL Initialized Successfully"); // Add log for confirmation

    // Render the main app ONLY after successful initialization
    root.render(
      <React.StrictMode> {/* Recommended for development */}
        <MsalProvider instance={msalInstance}>
          <App />
        </MsalProvider>
      </React.StrictMode>
    );
  } catch (error) {
    console.error("MSAL initialization error:", error); // Updated error message
    root.render(
      <div>
        <h1>Erro de autenticação no MSAL.</h1>
        <pre>{error instanceof Error ? error.toString() : String(error)}</pre>
      </div>
    );
  }
};

// Call the async function to start the process
initializeAndRender();

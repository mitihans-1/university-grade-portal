import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';

// Get the root element
const rootElement = document.getElementById('root');

// Check if the element exists
if (!rootElement) {
  throw new Error('Failed to find the root element');
}

// Create React root
const root = ReactDOM.createRoot(rootElement);

// Render the app
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
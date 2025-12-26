import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

console.log('index.tsx: Starting app initialization...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('ERROR: Could not find root element');
  throw new Error("Could not find root element to mount to");
}

console.log('index.tsx: Root element found, creating root...');

// Safety fallback: Only remove splash after 30 seconds if something goes very wrong
setTimeout(() => {
  if (!document.body.classList.contains('loaded')) {
    console.error('Emergency fallback: Removing splash screen after 30s timeout');
    document.body.classList.add('loaded');
  }
}, 30000);

// Immediate fallback after 3 seconds as well
setTimeout(() => {
  if (!document.body.classList.contains('loaded')) {
    console.warn('Quick fallback: Removing splash screen after 3s');
    document.body.classList.add('loaded');
  }
}, 3000);

try {
  const root = ReactDOM.createRoot(rootElement);
  console.log('index.tsx: Rendering App component...');
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('index.tsx: App component rendered successfully');
} catch (error) {
  console.error('ERROR rendering app:', error);
  // Force remove splash on error
  document.body.classList.add('loaded');
}
import React from 'react';
import ReactDOM from 'react-dom/client';
import './src/index.css';
import './src/styles/critical.css';
import { App } from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Safety fallback: remove splash if app fails to load
setTimeout(() => {
  if (!document.body.classList.contains('loaded')) {
    document.body.classList.add('loaded');
  }
}, 30000);

setTimeout(() => {
  if (!document.body.classList.contains('loaded')) {
    document.body.classList.add('loaded');
  }
}, 3000);

console.log(
  '%c Auricapri %c v' + __APP_VERSION__ + ' %c',
  'background:#1a1a1a;color:#fff;padding:4px 8px;border-radius:3px 0 0 3px;font-weight:bold;font-family:monospace',
  'background:#000;color:#fff;padding:4px 8px;border-radius:0 3px 3px 0;font-weight:bold;font-family:monospace',
  'background:transparent'
);

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (_) {
  document.body.classList.add('loaded');
}
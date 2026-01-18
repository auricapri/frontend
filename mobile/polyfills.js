// Polyfills for React Native - must be loaded first
// This polyfill ensures URL.hostname and URL.protocol are available
import { URL as URLPolyfill, URLSearchParams } from 'react-native-url-polyfill';

// Patch the URL prototype to add missing properties
if (URLPolyfill.prototype) {
  // Add hostname getter to prototype
  if (!('hostname' in URLPolyfill.prototype) || 
      typeof Object.getOwnPropertyDescriptor(URLPolyfill.prototype, 'hostname') === 'undefined') {
    try {
      Object.defineProperty(URLPolyfill.prototype, 'hostname', {
        get: function() {
          try {
            const match = String(this.href || '').match(/^[^:]+:\/\/([^\/:]+)/);
            return match ? match[1] : '';
          } catch (e) {
            return '';
          }
        },
        enumerable: true,
        configurable: true
      });
    } catch (e) {
      console.warn('Failed to add hostname to URL prototype:', e);
    }
  }
  
  // Add protocol getter to prototype
  if (!('protocol' in URLPolyfill.prototype) || 
      typeof Object.getOwnPropertyDescriptor(URLPolyfill.prototype, 'protocol') === 'undefined') {
    try {
      Object.defineProperty(URLPolyfill.prototype, 'protocol', {
        get: function() {
          try {
            const match = String(this.href || '').match(/^([^:]+):/);
            return match ? match[1] + ':' : '';
          } catch (e) {
            return '';
          }
        },
        enumerable: true,
        configurable: true
      });
    } catch (e) {
      console.warn('Failed to add protocol to URL prototype:', e);
    }
  }
}

// Set global URL immediately and synchronously - CRITICAL
// Use defineProperty to avoid readonly property errors
try {
  if (typeof global.URL === 'undefined') {
    Object.defineProperty(global, 'URL', {
      value: URLPolyfill,
      writable: true,
      enumerable: true,
      configurable: true
    });
  }
  if (typeof global.URLSearchParams === 'undefined') {
    Object.defineProperty(global, 'URLSearchParams', {
      value: URLSearchParams,
      writable: true,
      enumerable: true,
      configurable: true
    });
  }
} catch (e) {
  // Fallback if defineProperty fails
  if (typeof global.URL === 'undefined') {
    global.URL = URLPolyfill;
  }
  if (typeof global.URLSearchParams === 'undefined') {
    global.URLSearchParams = URLSearchParams;
  }
}

// Also set on window if it exists
if (typeof window !== 'undefined') {
  try {
    if (typeof window.URL === 'undefined') {
      Object.defineProperty(window, 'URL', {
        value: URLPolyfill,
        writable: true,
        enumerable: true,
        configurable: true
      });
    }
    if (typeof window.URLSearchParams === 'undefined') {
      Object.defineProperty(window, 'URLSearchParams', {
        value: URLSearchParams,
        writable: true,
        enumerable: true,
        configurable: true
      });
    }
  } catch (e) {
    if (typeof window.URL === 'undefined') {
      window.URL = URLPolyfill;
    }
    if (typeof window.URLSearchParams === 'undefined') {
      window.URLSearchParams = URLSearchParams;
    }
  }
}

// Verify
if (typeof global.URL === 'undefined') {
  throw new Error('Failed to load URL polyfill');
}

// Make TypeScript happy with service worker environment
/// <reference lib="webworker" />

// Import modules statically instead of dynamically
import './firebase';
import './auth-channel';
import './db';
import './queue';
import './bus-handler';

// Log to show service worker is starting
console.log("Service worker starting initialization");

// Add error handlers
self.addEventListener('error', (event) => {
  console.error('Service worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

console.log("Service worker initialization complete");
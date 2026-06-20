// Force immediate event listener attachment on initial evaluation
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle background push messages immediately
self.addEventListener('message', (event) => {
  // Console errors bypass
});

// Safely import the OneSignal core script
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

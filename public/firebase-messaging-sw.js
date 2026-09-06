// Firebase Messaging Service Worker
/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Fast service worker activation for seamless client updates
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Initialize the Firebase app in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyB7OgY2cd9axnhoo9Uq5sOIznWfHpXYe80",
  authDomain: "push-notification-5366b.firebaseapp.com",
  projectId: "push-notification-5366b",
  storageBucket: "push-notification-5366b.firebasestorage.app",
  messagingSenderId: "496469641293",
  appId: "1:496469641293:web:ea2560c7d686fd55eef404",
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle =
    payload.notification?.title ||
    payload.data?.title ||
    'WebPush Notification';

  const clickActionPath =
    payload.fcmOptions?.link ||
    payload.notification?.click_action ||
    payload.data?.click_action ||
    payload.data?.url ||
    '/notifications';

  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || '',
    icon: payload.notification?.icon || '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [100, 50, 100],
    data: {
      ...(payload.data || {}),
      click_action: clickActionPath,
    },
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle Notification Click on Mobile and Desktop
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event.notification);
  event.notification.close();

  const clickPath =
    event.notification.data?.click_action ||
    event.notification.data?.url ||
    '/notifications';

  const targetUrl = new URL(clickPath, self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Look for an existing open window under the same origin
        for (const client of windowClients) {
          if (client.url.startsWith(self.location.origin) && 'focus' in client) {
            if ('navigate' in client && client.url !== targetUrl) {
              client.navigate(targetUrl);
            }
            return client.focus();
          }
        }
        // If no open client exists, open a new window to the target URL
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});

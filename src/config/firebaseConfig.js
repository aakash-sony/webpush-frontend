import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const firebaseConfig = {
    apiKey: "AIzaSyB7OgY2cd9axnhoo9Uq5sOIznWfHpXYe80",
  authDomain: "push-notification-5366b.firebaseapp.com",
  projectId: "push-notification-5366b",
  storageBucket: "push-notification-5366b.firebasestorage.app",
  messagingSenderId: "496469641293",
  appId: "1:496469641293:web:ea2560c7d686fd55eef404"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Messaging instance getter (safe for SSR / browsers without push support)
let messaging = null;

export const getFirebaseMessaging = async () => {
  if (messaging) return messaging;
  const supported = await isSupported();
  if (supported) {
    messaging = getMessaging(app);
    return messaging;
  }
  return null;
};

// VAPID key placeholder (User will configure or provide)
const VAPID_KEY = "BKbuS11fAv8v_dguuftH5vt7J4DWDeH-EE-HIkzQNk3xu1zX-mvocKIMmdP7seZfAaorKj_r8kpDwA08Htpj6oM";

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    throw new Error('This browser does not support desktop notification');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { token: null, permission };
  }

  const msg = await getFirebaseMessaging();
  if (!msg) {
    throw new Error('Firebase Messaging is not supported in this browser environment');
  }

  // Register service worker if not already registered
  let swRegistration;
  if ('serviceWorker' in navigator) {
    swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  }

  try {
    const currentToken = await getToken(msg, {
      serviceWorkerRegistration: swRegistration,
      vapidKey: VAPID_KEY,
    });
    return { token: currentToken, permission };
  } catch (err) {
    console.error('An error occurred while retrieving token: ', err);
    throw err;
  }
};

export const onForegroundMessage = async (callback) => {
  const msg = await getFirebaseMessaging();
  if (msg) {
    return onMessage(msg, callback);
  }
  return () => {};
};

export default app;

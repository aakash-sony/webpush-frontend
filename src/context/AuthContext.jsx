import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginUser as loginApi, logoutUser as logoutApi } from '../api/authApi';
import { associateGuest, registerSubscription, checkSubscription } from '../api/subscriptionApi';
import { getOrCreateGuestId, setStoredGuestId, resetGuestId } from '../utils/guestUtils';
import { getDeviceInfo } from '../utils/deviceUtils';
import { requestNotificationPermission } from '../config/firebaseConfig';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('webpush_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [guestId, setGuestId] = useState(() => getOrCreateGuestId());
  const [fcmToken, setFcmToken] = useState(() => localStorage.getItem('webpush_fcm_token') || '');
  const [assocError, setAssocError] = useState(null);
  const [permissionState, setPermissionState] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );

  const updateGuestId = useCallback((newGuestId) => {
    if (newGuestId) {
      setStoredGuestId(newGuestId);
      setGuestId((prev) => (prev !== newGuestId ? newGuestId : prev));
    }
  }, []);

  const autoRegisterSubscription = useCallback(async (overrideGuestId, shouldPrompt = true) => {
    try {
      if (typeof Notification === 'undefined') return false;

      // Update current permission state
      setPermissionState(Notification.permission);

      // If user explicitly denied notifications, do not prompt
      if (Notification.permission === 'denied') return false;

      // If shouldPrompt is false and permission is not yet granted, return
      if (!shouldPrompt && Notification.permission !== 'granted') return false;

      let currentGuestId = overrideGuestId || guestId || getOrCreateGuestId();
      if (!currentGuestId) return false;

      const deviceInfo = getDeviceInfo();
      const deviceType = `${deviceInfo.browserName || 'Browser'} on ${deviceInfo.platform || 'Unknown'}`;

      const savedUser = localStorage.getItem('webpush_user');
      const currentUser = user || (savedUser ? JSON.parse(savedUser) : null);
      const userIdVal = currentUser?.username || currentUser?.id;

      // Request or obtain permission and retrieve FCM token
      const { token, permission } = await requestNotificationPermission();
      setPermissionState(permission);

      if (token) {
        setFcmToken(token);
        localStorage.setItem('webpush_fcm_token', token);

        try {
          const exists = await checkSubscription(currentGuestId, token);
          if (!exists) {
            console.warn(`Server registration for guestId ${currentGuestId} not found. Reconciling client identity.`);
            currentGuestId = resetGuestId();
            setGuestId(currentGuestId);
          }
        } catch (checkErr) {
          console.warn('Subscription check warning:', checkErr);
        }

        await registerSubscription({
          guestId: currentGuestId,
          fcmToken: token,
          deviceType: deviceType,
          userId: userIdVal ? String(userIdVal) : undefined,
        });

        console.log(`Push subscription auto-registered on load for guestId: ${currentGuestId}`);

        if (currentUser && userIdVal) {
          try {
            await associateGuest(currentGuestId, String(userIdVal));
          } catch (assocErr) {
            console.warn('Subscription guest association error after auto-register:', assocErr);
          }
        }

        window.dispatchEvent(new CustomEvent('webpush-subscription-registered', { detail: { token, guestId: currentGuestId } }));
        return true;
      }
    } catch (err) {
      console.warn('Auto registration of push notification failed:', err);
    }
    return false;
  }, [guestId, user]);

  useEffect(() => {
    const currentGid = getOrCreateGuestId();
    // Immediate native prompt on website open if permission is not yet decided ('default') or already 'granted'
    autoRegisterSubscription(currentGid, true);

    const handleUnauthorized = () => {
      setUser(null);
      setAssocError(null);
      localStorage.removeItem('webpush_user');
    };

    window.addEventListener('webpush-auth-unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('webpush-auth-unauthorized', handleUnauthorized);
    };
  }, [autoRegisterSubscription]);

  const retryGuestAssociation = async () => {
    if (!user) return false;
    try {
      const currentGuestId = guestId || getOrCreateGuestId();
      const userIdVal = user.username || user.id;
      await associateGuest(currentGuestId, String(userIdVal));
      setAssocError(null);
      console.log(`Guest ID ${currentGuestId} successfully associated with user ${user.username}`);
      return true;
    } catch (assocErr) {
      console.warn('Subscription association retry error:', assocErr);
      setAssocError('Unable to link guest push notification subscription to your user account.');
      return false;
    }
  };

  const login = async (credentials) => {
    const data = await loginApi(credentials);
    const userData = typeof data === 'object' && data !== null
      ? {
          ...data,
          id: data.id !== undefined && data.id !== null ? Number(data.id) : undefined,
          username: data.username || credentials.username,
          role: data.role || (data.username === 'admin' || credentials.username === 'admin' ? 'ADMIN' : 'USER'),
        }
      : { username: credentials.username, role: credentials.username === 'admin' ? 'ADMIN' : 'USER' };
    
    setUser(userData);
    localStorage.setItem('webpush_user', JSON.stringify(userData));

    try {
      const currentGuestId = guestId || getOrCreateGuestId();
      const userIdVal = userData.username || userData.id;
      await associateGuest(currentGuestId, String(userIdVal));
      setAssocError(null);
      console.log(`Guest ID ${currentGuestId} successfully associated with user ${userData.username || credentials.username}`);
      await autoRegisterSubscription(currentGuestId, false);
    } catch (assocErr) {
      console.warn('Subscription association error:', assocErr);
      setAssocError('Unable to link guest push notification subscription to your user account.');
    }

    return userData;
  };

  const logout = async () => {
    try {
      let currentToken = fcmToken || localStorage.getItem('webpush_fcm_token');
      if (!currentToken) {
        try {
          const { token } = await requestNotificationPermission();
          currentToken = token;
        } catch {
          // non-fatal
        }
      }
      const currentGuestId = guestId || getOrCreateGuestId();
      await logoutApi({ guestId: currentGuestId, fcmToken: currentToken });
    } catch (err) {
      console.warn('Backend logout API request error (non-fatal):', err);
    } finally {
      setUser(null);
      setAssocError(null);
      localStorage.removeItem('webpush_user');
    }
  };

  const isAdmin = user && (user.role === 'ADMIN' || user.role === 'ROLE_ADMIN' || user.username === 'admin');

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        guestId,
        fcmToken,
        permissionState,
        assocError,
        updateGuestId,
        handleStaleGuestId: () => {},
        autoRegisterSubscription,
        retryGuestAssociation,
        clearAssocError: () => setAssocError(null),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

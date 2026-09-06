import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDeviceInfo } from '../utils/deviceUtils';
import { getOrCreateGuestId } from '../utils/guestUtils';
import { requestNotificationPermission } from '../config/firebaseConfig';
import { registerSubscription, associateGuest } from '../api/subscriptionApi';
import StatusBadge from '../components/StatusBadge';
import ErrorAlert from '../components/ErrorAlert';

const LandingView = () => {
  const { guestId, updateGuestId, user, fcmToken: contextFcmToken, permissionState: contextPermission } = useAuth();
  const [deviceInfo] = useState(() => getDeviceInfo());
  const [permissionState, setPermissionState] = useState(() =>
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const [fcmToken, setFcmToken] = useState(() => contextFcmToken || localStorage.getItem('webpush_fcm_token') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [copiedGuestId, setCopiedGuestId] = useState(false);

  // Sync token from AuthContext if available
  useEffect(() => {
    if (contextFcmToken) {
      setFcmToken(contextFcmToken);
    }
  }, [contextFcmToken]);

  // Sync permission state from context or browser
  useEffect(() => {
    if (contextPermission) {
      setPermissionState(contextPermission);
    } else if (typeof Notification !== 'undefined') {
      setPermissionState(Notification.permission);
    }
  }, [contextPermission]);

  const handleEnableNotifications = useCallback(async (isAutoPrompt = false) => {
    if (typeof Notification === 'undefined') {
      setError('Push notifications are not supported in this browser environment.');
      return;
    }

    if (Notification.permission === 'denied' && isAutoPrompt) {
      return;
    }

    setLoading(true);
    setError(null);
    if (!isAutoPrompt) setSuccessMessage('');

    try {
      const { token, permission } = await requestNotificationPermission();
      setPermissionState(permission);

      if (token) {
        setFcmToken(token);
        localStorage.setItem('webpush_fcm_token', token);

        const currentGuestId = guestId || getOrCreateGuestId();
        const currentDevice = getDeviceInfo();
        const deviceType = `${currentDevice.browserName || 'Browser'} on ${currentDevice.platform || 'Unknown'}`;

        const response = await registerSubscription({
          fcmToken: token,
          guestId: currentGuestId,
          deviceType: deviceType,
          userId: user ? String(user.username || user.id) : undefined,
        });

        const activeGuestId = response?.guestId || currentGuestId;
        if (response?.guestId && response.guestId !== currentGuestId) {
          updateGuestId(response.guestId);
        }

        if (user) {
          try {
            await associateGuest(activeGuestId, String(user.username || user.id));
          } catch (assocErr) {
            console.warn('Subscription association error in LandingView:', assocErr);
          }
        }

        setSuccessMessage(
          typeof response === 'string'
            ? response
            : 'Push Notification subscription registered successfully with backend!'
        );
      } else if (!isAutoPrompt) {
        setError('Notification permission was not granted by the browser.');
      }
    } catch (err) {
      console.error('Subscription registration error:', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to register notification subscription.';
      if (!isAutoPrompt) {
        setError(errMsg);
      }
    } finally {
      setLoading(false);
    }
  }, [guestId, updateGuestId, user]);

  // Immediately ask for push permission on website opening if not already granted or denied
  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      if (Notification.permission === 'default') {
        handleEnableNotifications(true);
      } else if (Notification.permission === 'granted' && !fcmToken) {
        handleEnableNotifications(true);
      }
    }
  }, [handleEnableNotifications, fcmToken]);

  const handleCopyGuestId = () => {
    if (guestId) {
      navigator.clipboard.writeText(guestId);
      setCopiedGuestId(true);
      setTimeout(() => setCopiedGuestId(false), 2200);
    }
  };

  return (
    <div className="container py-5">
      {/* Hero Section */}
      <div className="row align-items-center mb-5">
        <div className="col-lg-7">
          <span className="badge bg-primary bg-opacity-20 text-primary border border-primary border-opacity-25 px-3 py-2 rounded-pill mb-3">
            <i className="bi bi-broadcast me-1"></i> Web Push Notification Hub
          </span>
          <h1 className="display-4 fw-extrabold mb-3 text-gradient">
            Real-Time Browser Push Notifications
          </h1>
          <p className="lead text-secondary mb-4">
            Manage your notification preferences, test guest session transitions, and receive background push alerts directly in your browser.
          </p>
        </div>
        <div className="col-lg-5 text-center">
          <div className="card glass-card shadow-lg border-0 p-4 rounded-4 position-relative overflow-hidden">
            <div className="glow-effect"></div>
            <div className="card-body">
              <i className="bi bi-bell-fill display-1 text-primary mb-3 d-block bounce-anim"></i>
              <h5 className="card-title fw-bold text-slate-100">Notification Status</h5>
              <div className="my-3">
                <StatusBadge
                  type={permissionState === 'granted' ? 'granted' : permissionState === 'denied' ? 'denied' : 'prompt'}
                  text={`Permission: ${permissionState.toUpperCase()}`}
                  icon={permissionState === 'granted' ? 'check-circle-fill' : permissionState === 'denied' ? 'x-circle-fill' : 'bell'}
                />
              </div>

              {permissionState !== 'granted' ? (
                <button
                  onClick={() => handleEnableNotifications(false)}
                  disabled={loading}
                  className="btn btn-primary btn-lg w-100 rounded-pill shadow-sm d-flex align-items-center justify-content-center gap-2 mt-3"
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      <span>Requesting Permission...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-bell me-1"></i> Enable Push Notifications
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => handleEnableNotifications(false)}
                  disabled={loading}
                  className="btn btn-outline-primary w-100 rounded-pill shadow-sm d-flex align-items-center justify-content-center gap-2 mt-3"
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      <span>Syncing Push Registration...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-arrow-repeat me-1"></i> Sync Push Registration
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <ErrorAlert message={error} onClose={() => setError(null)} />
      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show border-0 shadow-sm d-flex align-items-center gap-2 mb-4" role="alert">
          <i className="bi bi-check-circle-fill fs-5 flex-shrink-0"></i>
          <div className="flex-grow-1">{successMessage}</div>
          <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
        </div>
      )}

      {/* Device & Session Info Cards */}
      <div className="row g-4 mt-2">
        <div className="col-md-6">
          <div className="card glass-card shadow-sm border-0 h-100 rounded-4">
            <div className="card-header bg-transparent border-bottom border-secondary border-opacity-10 py-3">
              <h5 className="mb-0 fw-semibold d-flex align-items-center gap-2 text-slate-100">
                <i className="bi bi-person-badge text-info"></i> Session & Guest Metadata
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label text-slate-300 small fw-bold mb-0">Persistent Guest ID</label>
                  {copiedGuestId && (
                    <span className="badge bg-success bg-opacity-20 text-success border border-success border-opacity-30 rounded-pill fs-7">
                      <i className="bi bi-check2 me-1"></i> Copied to Clipboard
                    </span>
                  )}
                </div>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control bg-dark text-light border-secondary border-opacity-25 font-monospace small"
                    value={guestId || ''}
                    readOnly
                  />
                  <button
                    className={`btn ${copiedGuestId ? 'btn-success text-dark' : 'btn-outline-secondary'} transition-all`}
                    onClick={handleCopyGuestId}
                    title="Copy Guest ID"
                  >
                    <i className={`bi ${copiedGuestId ? 'bi-check-lg' : 'bi-clipboard'}`}></i>
                  </button>
                </div>
              </div>

              <div className="mb-0">
                <label className="form-label text-slate-300 small fw-bold">Auth User Context</label>
                <div>
                  {user ? (
                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 p-2 px-3 rounded-pill">
                      <i className="bi bi-person-check-fill me-1"></i> Logged in as <strong>{user.username}</strong>
                    </span>
                  ) : (
                    <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 p-2 px-3 rounded-pill">
                      <i className="bi bi-person-x me-1"></i> Guest Session (Unauthenticated)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card glass-card shadow-sm border-0 h-100 rounded-4">
            <div className="card-header bg-transparent border-bottom border-secondary border-opacity-10 py-3">
              <h5 className="mb-0 fw-semibold d-flex align-items-center gap-2 text-slate-100">
                <i className="bi bi-laptop text-warning"></i> Device Environment
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-6">
                  <span className="text-slate-400 small d-block">Detected Browser</span>
                  <span className="fw-semibold text-light">{deviceInfo.browserName || 'Unknown'}</span>
                </div>
                <div className="col-6">
                  <span className="text-slate-400 small d-block">Platform</span>
                  <span className="fw-semibold text-light">{deviceInfo.platform || 'Unknown'}</span>
                </div>
                <div className="col-12">
                  <span className="text-slate-400 small d-block">User Agent</span>
                  <p className="font-monospace small text-slate-300 text-break mb-0 bg-dark p-2 rounded border border-secondary border-opacity-25">
                    {deviceInfo.userAgent || 'Fetching userAgent...'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingView;

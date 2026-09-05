import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getUserNotifications,
  getGuestNotifications,
  getUserUnreadCount,
  getGuestUnreadCount,
  markNotificationAsRead,
} from '../api/notificationApi';
import { onForegroundMessage } from '../config/firebaseConfig';
import NotificationItem from '../components/NotificationItem';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';

const NotificationsView = () => {
  const { user, guestId } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [pagination, setPagination] = useState({
    totalPages: 0,
    totalElements: 0,
    number: 0,
    first: true,
    last: true,
  });

  const rawUserId = user ? (user.id ?? user.userId) : null;
  const activeUserId = rawUserId !== undefined && rawUserId !== null && !isNaN(Number(rawUserId)) ? Number(rawUserId) : null;
  const activeGuestId = !user ? guestId : null;

  const fetchNotificationsData = useCallback(
    async (pageIndex = 0, isInitialLoad = false) => {
      if (isInitialLoad) {
        setLoading(true);
      }
      setError(null);

      try {
        let historyData;
        let countData;

        if (user && activeUserId !== null) {
          [historyData, countData] = await Promise.all([
            getUserNotifications(activeUserId, pageIndex, 20),
            getUserUnreadCount(activeUserId),
          ]);
        } else if (activeGuestId) {
          [historyData, countData] = await Promise.all([
            getGuestNotifications(activeGuestId, pageIndex, 20),
            getGuestUnreadCount(activeGuestId),
          ]);
        } else {
          setLoading(false);
          return;
        }

        // Handle Spring Data Page structure
        if (historyData && Array.isArray(historyData.content)) {
          setNotifications(historyData.content);
          setPagination({
            totalPages: historyData.totalPages || 0,
            totalElements: historyData.totalElements || 0,
            number: historyData.number || 0,
            first: historyData.first ?? true,
            last: historyData.last ?? true,
          });
        } else if (Array.isArray(historyData)) {
          // Fallback if array returned
          setNotifications(historyData);
          setPagination({
            totalPages: 1,
            totalElements: historyData.length,
            number: 0,
            first: true,
            last: true,
          });
        }

        if (countData && typeof countData.count === 'number') {
          setUnreadCount(countData.count);
        }
      } catch (err) {
        console.error('Failed to load notifications:', err);
        const errMsg =
          err.response?.data?.message ||
          err.message ||
          'Unable to load notifications. Please try again.';
        setError(errMsg);
      } finally {
        setLoading(false);
      }
    },
    [user, activeUserId, activeGuestId]
  );

  const fetchRef = useRef(fetchNotificationsData);
  const pageRef = useRef(page);

  useEffect(() => {
    fetchRef.current = fetchNotificationsData;
    pageRef.current = page;
  }, [fetchNotificationsData, page]);

  // Reset pagination page index to 0 whenever recipient user/guest context changes
  useEffect(() => {
    setPage(0);
  }, [activeUserId, activeGuestId]);

  useEffect(() => {
    fetchNotificationsData(page, true);
  }, [fetchNotificationsData, page]);

  // Subscribe to FCM foreground push messages for real-time inbox refresh
  useEffect(() => {
    let unsubscribe = () => {};
    let isMounted = true;

    const setupFcmListener = async () => {
      try {
        const unsub = await onForegroundMessage((payload) => {
          if (!isMounted) return;
          console.log('Foreground FCM notification received in Notifications view:', payload);
          if (fetchRef.current) {
            fetchRef.current(pageRef.current, false);
          }
          window.dispatchEvent(new CustomEvent('webpush-notification-refresh'));
        });

        if (typeof unsub === 'function') {
          if (isMounted) {
            unsubscribe = unsub;
          } else {
            unsub();
          }
        }
      } catch (fcmErr) {
        console.warn('FCM foreground listener setup warning:', fcmErr);
      }
    };

    setupFcmListener();

    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const handleMarkAsRead = async (notificationId) => {
    try {
      const updatedLog = await markNotificationAsRead(notificationId, {
        userId: activeUserId,
        guestId: activeGuestId,
      });

      // Update local state on backend success
      setNotifications((prev) =>
        prev.map((item) => {
          if (item.id === notificationId) {
            return {
              ...item,
              isRead: true,
              read: true,
              readAt: updatedLog?.readAt || new Date().toISOString(),
            };
          }
          return item;
        })
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Notify Navbar to update unread badge immediately
      window.dispatchEvent(new CustomEvent('webpush-notification-refresh'));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      const errMsg =
        err.response?.data?.message || 'Failed to update notification read status.';
      setError(errMsg);
    }
  };

  const handleNextPage = () => {
    if (!pagination.last) {
      setPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (!pagination.first && page > 0) {
      setPage((prev) => prev - 1);
    }
  };

  return (
    <div className="container py-5">
      {/* Header Section */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-3 mb-1">
            <h1 className="h2 fw-bold text-gradient mb-0">Notification Inbox</h1>
            {unreadCount > 0 && (
              <span className="badge bg-primary rounded-pill px-3 py-1.5 fs-6 shadow-sm d-inline-flex align-items-center gap-1.5">
                <i className="bi bi-bell-fill"></i>
                <span>{unreadCount} Unread</span>
              </span>
            )}
          </div>
          <p className="text-secondary small mb-0">
            View notification history sent to your account or guest device session.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            onClick={() => fetchNotificationsData(page, true)}
            disabled={loading}
            className="btn btn-outline-secondary btn-sm rounded-pill px-3 py-1.5 d-inline-flex align-items-center gap-1.5"
            title="Refresh Notification Inbox"
          >
            <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Recipient Identity Banner */}
      <div className="card glass-card border-0 rounded-4 p-3 mb-4">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 text-slate-300 small">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-person-badge text-primary fs-5"></i>
            <span>
              Recipient Scope:{' '}
              <strong className="text-light">
                {user ? `User (${user.username})` : `Guest Visitor (${guestId})`}
              </strong>
            </span>
          </div>
          <span className="badge bg-dark bg-opacity-50 text-slate-400 border border-secondary border-opacity-25 px-2.5 py-1 font-monospace">
            {user ? `User ID: ${activeUserId}` : `Guest ID: ${guestId}`}
          </span>
        </div>
      </div>

      {/* Error Alert */}
      <ErrorAlert message={error} onClose={() => setError(null)} />

      {/* Loading State */}
      {loading ? (
        <LoadingSpinner message="Loading notification history..." />
      ) : notifications.length === 0 ? (
        /* Empty State */
        <div className="card glass-card border-0 rounded-4 p-4 text-center my-4">
          <EmptyState
            title="No Notifications Yet"
            message="When admins dispatch push alerts to your user account or guest session, they will appear here."
            icon="bell-slash"
          />
        </div>
      ) : (
        /* Notification List */
        <div className="row">
          <div className="col-12">
            {notifications.map((item) => (
              <NotificationItem
                key={item.id}
                notification={item}
                onMarkAsRead={handleMarkAsRead}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="col-12 d-flex justify-content-between align-items-center mt-3 pt-3 border-top border-secondary border-opacity-25">
              <button
                onClick={handlePrevPage}
                disabled={pagination.first || loading}
                className="btn btn-outline-light btn-sm rounded-pill px-3 py-1.5 d-inline-flex align-items-center gap-1"
              >
                <i className="bi bi-chevron-left"></i> Previous
              </button>

              <span className="text-slate-300 small">
                Page <strong>{pagination.number + 1}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.totalElements} total)
              </span>

              <button
                onClick={handleNextPage}
                disabled={pagination.last || loading}
                className="btn btn-outline-light btn-sm rounded-pill px-3 py-1.5 d-inline-flex align-items-center gap-1"
              >
                Next <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsView;

import React, { useState } from 'react';
import { formatRelativeTime, formatDateTime } from '../utils/dateUtils';

const NotificationItem = ({ notification, onMarkAsRead }) => {
  const [isMarking, setIsMarking] = useState(false);

  const isRead = Boolean(notification.isRead ?? notification.read ?? false);

  const handleClick = async () => {
    if (isRead || isMarking || !onMarkAsRead) return;
    setIsMarking(true);
    try {
      await onMarkAsRead(notification.id);
    } finally {
      setIsMarking(false);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`card glass-card mb-3 transition-all rounded-4 border ${
        !isRead
          ? 'border-primary border-opacity-50 shadow-sm bg-primary bg-opacity-10 cursor-pointer'
          : 'border-secondary border-opacity-25 opacity-90'
      }`}
      style={{ cursor: !isRead ? 'pointer' : 'default', transition: 'all 0.2s ease-in-out' }}
      role="button"
      tabIndex={!isRead ? 0 : -1}
      onKeyDown={(e) => {
        if (!isRead && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="card-body p-3.5 p-md-4">
        <div className="d-flex align-items-start justify-content-between gap-3 mb-2">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            {/* Unread dot / indicator */}
            {!isRead ? (
              <span className="badge bg-primary rounded-circle p-1 d-inline-block me-1" title="Unread notification">
                <span className="visually-hidden">Unread</span>
              </span>
            ) : (
              <i className="bi bi-check2 text-muted me-1" title="Read notification"></i>
            )}

            {/* Title */}
            <h6 className={`mb-0 ${!isRead ? 'fw-bold text-white' : 'fw-semibold text-slate-200'}`}>
              {notification.title || 'Notification'}
            </h6>

            {/* Template Code Badge if available */}
            {notification.code && (
              <span className="badge bg-secondary bg-opacity-20 text-slate-300 border border-secondary border-opacity-25 px-2 py-0.5 rounded-pill font-monospace extra-small">
                {notification.code}
              </span>
            )}
          </div>

          {/* Time & Read Status Pill */}
          <div className="d-flex align-items-center gap-2 flex-shrink-0">
            <span
              className="text-muted small"
              title={formatDateTime(notification.createdAt)}
            >
              <i className="bi bi-clock me-1"></i>
              {formatRelativeTime(notification.createdAt)}
            </span>

            {!isRead && (
              <span className="badge bg-primary bg-opacity-20 text-primary border border-primary border-opacity-30 rounded-pill px-2 py-1 small fw-medium d-flex align-items-center gap-1">
                {isMarking ? (
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ width: '0.75rem', height: '0.75rem' }}></span>
                ) : (
                  <i className="bi bi-circle-fill" style={{ fontSize: '0.5rem' }}></i>
                )}
                <span>Unread</span>
              </span>
            )}
          </div>
        </div>

        {/* Message Body */}
        <p className={`mb-0 ${!isRead ? 'text-slate-100 fw-normal' : 'text-slate-300'} text-break small`}>
          {notification.body || 'No description provided.'}
        </p>

        {/* Footer info & Mark as Read action helper */}
        {!isRead && (
          <div className="mt-2.5 pt-2 border-top border-primary border-opacity-10 d-flex justify-content-between align-items-center extra-small text-primary">
            <span>
              <i className="bi bi-cursor-fill me-1"></i> Click anywhere on this notification to mark as read
            </span>
            {isMarking && <span className="fw-semibold">Updating...</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationItem;

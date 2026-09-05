import React from 'react';

export const ScheduleTypeBadge = ({ type }) => {
  switch (type) {
    case 'DAILY':
      return (
        <span className="badge bg-info bg-opacity-15 text-info border border-info border-opacity-25 rounded-pill px-2.5 py-1 small d-inline-flex align-items-center gap-1">
          <i className="bi bi-clock"></i> DAILY
        </span>
      );
    case 'OFFSET':
      return (
        <span className="badge bg-primary bg-opacity-15 text-primary border border-primary border-opacity-25 rounded-pill px-2.5 py-1 small d-inline-flex align-items-center gap-1">
          <i className="bi bi-calendar-event"></i> OFFSET
        </span>
      );
    case 'LOGIN_REMINDER':
      return (
        <span className="badge bg-warning bg-opacity-15 text-warning border border-warning border-opacity-25 rounded-pill px-2.5 py-1 small d-inline-flex align-items-center gap-1">
          <i className="bi bi-person-check"></i> LOGIN REMINDER
        </span>
      );
    default:
      return (
        <span className="badge bg-secondary bg-opacity-15 text-secondary border border-secondary border-opacity-25 rounded-pill px-2.5 py-1 small">
          {type || 'UNKNOWN'}
        </span>
      );
  }
};

export const ActiveStatusBadge = ({ isActive }) => {
  if (isActive) {
    return (
      <span className="badge bg-success bg-opacity-15 text-success border border-success border-opacity-25 rounded-pill px-2.5 py-1 small d-inline-flex align-items-center gap-1">
        <i className="bi bi-check-circle-fill"></i> Active
      </span>
    );
  }
  return (
    <span className="badge bg-secondary bg-opacity-15 text-slate-400 border border-secondary border-opacity-25 rounded-pill px-2.5 py-1 small d-inline-flex align-items-center gap-1">
      <i className="bi bi-pause-circle-fill"></i> Inactive
    </span>
  );
};

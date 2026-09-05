import React from 'react';

const StatusBadge = ({ type, text, icon }) => {
  const getBadgeStyle = () => {
    switch (type) {
      case 'success':
      case 'granted':
      case 'active':
        return 'bg-success bg-opacity-10 text-success border border-success border-opacity-25';
      case 'warning':
      case 'prompt':
      case 'default':
        return 'bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25';
      case 'danger':
      case 'denied':
      case 'error':
        return 'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25';
      case 'info':
      case 'admin':
        return 'bg-info bg-opacity-10 text-info border border-info border-opacity-25';
      case 'primary':
      default:
        return 'bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25';
    }
  };

  return (
    <span className={`badge rounded-pill px-3 py-2 fw-medium d-inline-flex align-items-center gap-1 ${getBadgeStyle()}`}>
      {icon && <i className={`bi bi-${icon}`}></i>}
      {text}
    </span>
  );
};

export default StatusBadge;

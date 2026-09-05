import React from 'react';

const EmptyState = ({ title = 'No Data Found', message = 'There are no items to display at this time.', icon = 'inbox' }) => {
  return (
    <div className="text-center p-5 rounded-4 border border-dashed my-3">
      <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-inline-flex align-items-center justify-content-center p-4 mb-3" style={{ width: '80px', height: '80px' }}>
        <i className={`bi bi-${icon} fs-1`}></i>
      </div>
      <h5 className="fw-semibold mb-2">{title}</h5>
      <p className="text-muted small mb-0" style={{ maxWidth: '400px', margin: '0 auto' }}>{message}</p>
    </div>
  );
};

export default EmptyState;

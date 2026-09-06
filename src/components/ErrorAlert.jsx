const ErrorAlert = ({ message, onClose }) => {
  if (!message) return null;

  let content;
  if (typeof message === 'string') {
    content = <div>{message}</div>;
  } else if (Array.isArray(message)) {
    content = (
      <ul className="mb-0 ps-3">
        {message.map((msg, idx) => (
          <li key={idx}>{msg}</li>
        ))}
      </ul>
    );
  } else if (typeof message === 'object') {
    const errorList = Object.values(message).map((msg) => `${msg}`);
    content = (
      <ul className="mb-0 ps-3">
        {errorList.map((err, idx) => (
          <li key={idx}>{err}</li>
        ))}
      </ul>
    );
  } else {
    content = <div>Validation or server error occurred.</div>;
  }

  return (
    <div className="alert alert-danger alert-dismissible fade show d-flex align-items-center gap-2 border-0 shadow-sm rounded-3 bg-danger bg-opacity-20 text-slate-100 border-start border-danger border-4 mb-3" role="alert">
      <i className="bi bi-exclamation-triangle-fill flex-shrink-0 fs-5 text-danger"></i>
      <div className="flex-grow-1 small">{content}</div>
      {onClose && (
        <button
          type="button"
          className="btn-close btn-close-white"
          aria-label="Close"
          onClick={onClose}
        ></button>
      )}
    </div>
  );
};

export default ErrorAlert;


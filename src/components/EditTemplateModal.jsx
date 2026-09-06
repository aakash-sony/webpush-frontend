import { useState, useEffect, useRef } from 'react';

const EditTemplateModal = ({
  isOpen,
  template,
  initialTitle = '',
  initialBody = '',
  onSave,
  onClose,
  onReset,
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const titleInputRef = useRef(null);

  const defaultTitle = template?.title || '';
  const defaultBody = template?.bodyTemplate || template?.body || '';

  // Synchronize initial values when modal opens or template changes
  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle !== undefined && initialTitle !== '' ? initialTitle : defaultTitle);
      setBody(initialBody !== undefined && initialBody !== '' ? initialBody : defaultBody);
      // Auto-focus the title input when modal appears
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, initialTitle, initialBody, defaultTitle, defaultBody]);

  // Handle ESC key press to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !template) return null;

  const isCustomized =
    title.trim() !== defaultTitle.trim() || body.trim() !== defaultBody.trim();

  const handleResetToDefault = () => {
    setTitle(defaultTitle);
    setBody(defaultBody);
    if (onReset) onReset();
  };

  const handleApply = (e) => {
    e.preventDefault();
    onSave({
      title: title.trim() || defaultTitle,
      body: body.trim() || defaultBody,
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop-custom"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        className="modal-dialog-custom"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-template-modal-title"
      >
        <div
          className="modal-content-custom glass-card p-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="d-flex align-items-center justify-content-between p-4 border-bottom border-secondary border-opacity-25">
            <div className="d-flex align-items-center gap-3">
              <div
                className="rounded-3 p-2.5 text-white d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm"
                style={{
                  width: '42px',
                  height: '42px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                }}
              >
                <i className="bi bi-pencil-square fs-5"></i>
              </div>
              <div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <h5
                    id="edit-template-modal-title"
                    className="fw-bold text-slate-100 mb-0"
                  >
                    Edit Notification Message
                  </h5>
                  <span className="badge bg-dark border border-secondary text-warning font-monospace small">
                    #{template.id || template.templateId || 'TPL'}
                  </span>
                  {template.code && (
                    <span className="badge bg-secondary bg-opacity-20 text-slate-300 border border-secondary border-opacity-25 font-monospace extra-small">
                      {template.code}
                    </span>
                  )}
                </div>
                <span className="text-slate-400 extra-small">
                  Customize notification text and preview real-time push appearance
                </span>
              </div>
            </div>

            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              aria-label="Close edit popup"
            ></button>
          </div>

          {/* Body */}
          <form onSubmit={handleApply}>
            <div className="p-4">
              {/* Context Info Banner */}
              <div className="alert alert-info border-0 bg-info bg-opacity-10 text-info-emphasis extra-small py-2.5 px-3 rounded-3 d-flex align-items-start gap-2.5 mb-3.5">
                <i className="bi bi-info-circle-fill fs-6 flex-shrink-0 text-info mt-0.5"></i>
                <div className="text-slate-200">
                  <span>
                    Editing this notification will customize the dispatched message for this send and save it in the{' '}
                    <strong>notification logs table</strong>. The <strong>master database template</strong> remains unchanged.
                  </span>
                </div>
              </div>

              {/* Title Field */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1.5">
                  <label
                    htmlFor="modalCustomTitle"
                    className="form-label text-slate-200 small fw-semibold mb-0"
                  >
                    Notification Title <span className="text-danger">*</span>
                  </label>
                  <span className="text-slate-400 extra-small">
                    {title.length} characters
                  </span>
                </div>
                <input
                  ref={titleInputRef}
                  id="modalCustomTitle"
                  type="text"
                  className="form-control bg-dark text-slate-100 border-secondary border-opacity-40 rounded-3 py-2"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter notification title..."
                  required
                />
              </div>

              {/* Body & Description Field */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-1.5">
                  <label
                    htmlFor="modalCustomBody"
                    className="form-label text-slate-200 small fw-semibold mb-0"
                  >
                    Body & Description <span className="text-danger">*</span>
                  </label>
                  <span className="text-slate-400 extra-small">
                    {body.length} characters
                  </span>
                </div>
                <textarea
                  id="modalCustomBody"
                  rows={3}
                  className="form-control bg-dark text-slate-100 border-secondary border-opacity-40 rounded-3 py-2"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Enter notification body and description..."
                  required
                />
              </div>
            </div>

            {/* Footer */}
            <div className="d-flex align-items-center justify-content-between p-3.5 px-4 bg-dark bg-opacity-50 border-top border-secondary border-opacity-25 rounded-bottom-4">
              <div>
                {isCustomized && (
                  <button
                    type="button"
                    onClick={handleResetToDefault}
                    className="btn btn-sm btn-outline-warning rounded-pill px-3 py-1.5 extra-small fw-semibold d-inline-flex align-items-center gap-1.5"
                    title="Reset to default template values"
                  >
                    <i className="bi bi-arrow-counterclockwise"></i>
                    <span>Reset Default</span>
                  </button>
                )}
              </div>

              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-sm btn-outline-secondary rounded-pill px-3.5 py-1.5 mt-2 mb-2 fw-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-sm btn-primary rounded-pill px-4 py-1.5 mt-2 mb-2 fw-bold d-inline-flex align-items-center gap-1.5 shadow"
                >
                  <i className="bi bi-check-lg fs-6"></i>
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default EditTemplateModal;

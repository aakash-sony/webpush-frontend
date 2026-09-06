import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getGuests, getUsers, getTemplates, sendNotification } from '../api/adminApi';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import EditTemplateModal from '../components/EditTemplateModal';

const AdminDashboardView = () => {
  const [viewMode, setViewMode] = useState('dispatch'); // 'dispatch' | 'overview'
  const [activeOverviewTab, setActiveOverviewTab] = useState('guests');

  // Data states
  const [guests, setGuests] = useState([]);
  const [users, setUsers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Selection states for Admin Workflow
  const [selectedGuestIds, setSelectedGuestIds] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customBody, setCustomBody] = useState('');

  const chosenTemplate = templates.find(
    (t, idx) => String(t.id || idx) === String(selectedTemplateId)
  );

  // UI Feedback states
  const [validationError, setValidationError] = useState(null);
  const [dispatchFeedback, setDispatchFeedback] = useState(null);
  const [sending, setSending] = useState(false);

  const fetchAdminData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setFetchError(null);
    try {
      const [guestsData, usersData, templatesData] = await Promise.allSettled([
        getGuests(),
        getUsers(),
        getTemplates(),
      ]);

      if (guestsData.status === 'fulfilled') setGuests(Array.isArray(guestsData.value) ? guestsData.value : []);
      if (usersData.status === 'fulfilled') setUsers(Array.isArray(usersData.value) ? usersData.value : []);
      if (templatesData.status === 'fulfilled') setTemplates(Array.isArray(templatesData.value) ? templatesData.value : []);

      if (guestsData.status === 'rejected' && usersData.status === 'rejected' && templatesData.status === 'rejected') {
        const err = guestsData.reason || usersData.reason || templatesData.reason;
        setFetchError(err.response?.data?.message || err.message || 'Failed to load system data from backend.');
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setFetchError('Failed to load system data from backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData(true);
  }, [fetchAdminData]);

  const handleRefresh = () => {
    fetchAdminData(true);
  };


  // --- Guest Selection Handlers ---
  const toggleGuestSelect = (id) => {
    setSelectedGuestIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllGuests = (e) => {
    if (e.target.checked) {
      const allIds = guests.map((g, idx) => g.guestId || g.id || String(idx));
      setSelectedGuestIds(allIds);
    } else {
      setSelectedGuestIds([]);
    }
  };

  // --- User Selection Handlers ---
  const toggleUserSelect = (id) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllUsers = (e) => {
    if (e.target.checked) {
      const allIds = users.map((u, idx) => String(u.id || idx));
      setSelectedUserIds(allIds);
    } else {
      setSelectedUserIds([]);
    }
  };

  const clearAllSelections = () => {
    setSelectedGuestIds([]);
    setSelectedUserIds([]);
    setSelectedTemplateId('');
    setCustomTitle('');
    setCustomBody('');
    setValidationError(null);
    setDispatchFeedback(null);
  };

  const handleSelectTemplate = (tId) => {
    setSelectedTemplateId(tId);
    const tpl = templates.find((t, idx) => String(t.id || idx) === String(tId));
    if (tpl) {
      setCustomTitle(tpl.title || '');
      setCustomBody(tpl.bodyTemplate || tpl.body || '');
    }
  };

  const handleResetToTemplateDefault = () => {
    const tpl = templates.find((t, idx) => String(t.id || idx) === String(selectedTemplateId));
    if (tpl) {
      setCustomTitle(tpl.title || '');
      setCustomBody(tpl.bodyTemplate || tpl.body || '');
    }
  };

  // --- Template Edit Popup Handlers ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [modalTargetTemplate, setModalTargetTemplate] = useState(null);

  const handleOpenEditModal = (tpl) => {
    const tId = String(tpl.id || '');
    if (String(selectedTemplateId) !== tId) {
      setSelectedTemplateId(tId);
      setCustomTitle(tpl.title || '');
      setCustomBody(tpl.bodyTemplate || tpl.body || '');
    }
    setModalTargetTemplate(tpl);
    setIsEditModalOpen(true);
  };

  const handleSaveTemplateCustomization = ({ title, body }) => {
    setCustomTitle(title);
    setCustomBody(body);
    setIsEditModalOpen(false);
  };

  const handleOverviewEditTemplate = (tpl) => {
    setViewMode('dispatch');
    handleOpenEditModal(tpl);
  };

  // --- Send Notification UI Trigger ---
  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (sending) return;

    setValidationError(null);
    setDispatchFeedback(null);

    // Validation 1: At least one recipient selected
    if (selectedGuestIds.length === 0 && selectedUserIds.length === 0) {
      setValidationError('Please select at least one recipient (guest or registered user).');
      return;
    }

    // Validation 2: Exactly one template selected
    if (!selectedTemplateId) {
      setValidationError('Please select a notification template.');
      return;
    }

    // Prepare deduplicated IDs according to backend DTO contract
    const userIds = Array.from(new Set(selectedUserIds.map((id) => Number(id)).filter((id) => !isNaN(id))));
    const guestIds = Array.from(new Set(selectedGuestIds.map((id) => String(id)).filter((id) => id.trim() !== '')));
    const templateId = Number(selectedTemplateId);

    // Find template details
    const chosenTemplate = templates.find(
      (t, idx) => String(t.id || idx) === String(selectedTemplateId)
    );

    const defaultTitle = chosenTemplate?.title || 'Notification Template';
    const defaultBody = chosenTemplate?.bodyTemplate || chosenTemplate?.body || '';
    const finalTitle = customTitle.trim() || defaultTitle;
    const finalBody = customBody.trim() || defaultBody;
    const isCustomized = (customTitle.trim() !== defaultTitle) || (customBody.trim() !== defaultBody);

    setSending(true);

    try {
      const response = await sendNotification({
        userIds,
        guestIds,
        templateId,
        title: finalTitle,
        body: finalBody,
        description: finalBody,
        bodyTemplate: finalBody,
      });

      setDispatchFeedback({
        message: response.message || 'Notification processed by server.',
        status: response.status || 'SUCCESS',
        usersSelected: response.usersSelected ?? userIds.length,
        guestsSelected: response.guestsSelected ?? guestIds.length,
        tokensFound: response.tokensFound ?? 0,
        notificationsSent: response.notificationsSent ?? 0,
        notificationsFailed: response.notificationsFailed ?? 0,
        templateTitle: isCustomized ? `${finalTitle} (Custom Message)` : defaultTitle,
        timestamp: new Date().toLocaleTimeString(),
      });

      // Clear selections post successful dispatch
      setSelectedGuestIds([]);
      setSelectedUserIds([]);
      setSelectedTemplateId('');
      setCustomTitle('');
      setCustomBody('');
    } catch (err) {
      console.error('Send notification error:', err);
      const errMsg =
        err.response?.data?.message ||
        (typeof err.response?.data === 'string' ? err.response.data : null) ||
        err.message ||
        'Unable to send notification. Please try again.';
      setValidationError(errMsg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container py-5">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-3 border-bottom border-secondary border-opacity-25">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h2 className="fw-bold text-gradient mb-0">Admin Panel</h2>
            <span className="badge bg-primary bg-opacity-20 text-primary border border-primary border-opacity-25 px-2.5 py-1 rounded-pill small">
              <i className="bi bi-shield-lock me-1"></i> Authorised
            </span>
          </div>
          <p className="text-slate-400 mb-0 small">
            Manage recipient targets, select notification templates, and inspect active system subscriptions.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2 mt-3 mt-md-0">
          <div className="btn-group p-1 bg-dark rounded-pill border border-secondary border-opacity-25 shadow-sm">
            <button
              className={`btn btn-sm rounded-pill px-3 py-1.5 fw-semibold transition-all ${
                viewMode === 'dispatch' ? 'btn-primary shadow' : 'btn-dark text-slate-400'
              }`}
              onClick={() => setViewMode('dispatch')}
            >
              <i className="bi bi-send-fill me-1.5"></i> Send Notification
            </button>
            <button
              className={`btn btn-sm rounded-pill px-3 py-1.5 fw-semibold transition-all ${
                viewMode === 'overview' ? 'btn-primary shadow' : 'btn-dark text-slate-400'
              }`}
              onClick={() => setViewMode('overview')}
            >
              <i className="bi bi-table me-1.5"></i> System Overview
            </button>
          </div>

          <Link
            to="/admin/notification-schedules"
            className="btn btn-outline-info btn-sm rounded-pill px-3 py-1.5 fw-semibold shadow-sm ms-1"
          >
            <i className="bi bi-clock-history me-1.5"></i> Schedules
          </Link>

          <button
            onClick={handleRefresh}
            className="btn btn-outline-secondary rounded-circle p-2 shadow-sm ms-1"
            title="Refresh System Data"
          >
            <i className="bi bi-arrow-clockwise fs-5"></i>
          </button>
        </div>
      </div>

      <ErrorAlert message={fetchError} onClose={() => setFetchError(null)} />

      {loading ? (
        <LoadingSpinner message="Fetching users, guests, and templates from Spring Boot..." />
      ) : viewMode === 'dispatch' ? (
        /* ==================== NOTIFICATION DISPATCH WORKFLOW ==================== */
        <div className="row g-4">
          {/* Validation Alert */}
          {validationError && (
            <div className="col-12">
              <div className="alert alert-danger border-0 shadow-sm d-flex align-items-center gap-2 mb-0 rounded-4 bg-danger bg-opacity-20 text-slate-100 border-start border-danger border-4">
                <i className="bi bi-exclamation-triangle-fill text-danger fs-4 flex-shrink-0"></i>
                <div className="flex-grow-1 fw-medium">{validationError}</div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setValidationError(null)}
                ></button>
              </div>
            </div>
          )}

          {/* Send Feedback Toast/Banner */}
          {dispatchFeedback && (
            <div className="col-12">
              <div
                className={`card glass-card shadow-lg rounded-4 overflow-hidden ${
                  dispatchFeedback.status === 'SUCCESS'
                    ? 'border-success border-opacity-50'
                    : 'border-warning border-opacity-50'
                }`}
              >
                <div
                  className={`card-body p-4 ${
                    dispatchFeedback.status === 'SUCCESS' ? 'bg-success bg-opacity-10' : 'bg-warning bg-opacity-10'
                  }`}
                >
                  <div className="d-flex align-items-start justify-content-between">
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className={`rounded-circle p-3 d-flex align-items-center justify-content-center ${
                          dispatchFeedback.status === 'SUCCESS'
                            ? 'bg-success text-dark'
                            : 'bg-warning text-dark'
                        }`}
                      >
                        <i
                          className={`bi fs-3 fw-bold ${
                            dispatchFeedback.status === 'SUCCESS' ? 'bi-check-lg' : 'bi-exclamation-lg'
                          }`}
                        ></i>
                      </div>
                      <div>
                        <h5
                          className={`fw-bold mb-1 ${
                            dispatchFeedback.status === 'SUCCESS' ? 'text-success' : 'text-warning'
                          }`}
                        >
                          {dispatchFeedback.status === 'SUCCESS'
                            ? 'Notification Dispatched Successfully!'
                            : 'Notification Dispatched with Partial Delivery'}
                        </h5>
                        <p className="text-slate-300 small mb-2">{dispatchFeedback.message}</p>
                        <div className="d-flex flex-wrap gap-2 align-items-center small">
                          <span className="badge bg-dark border border-secondary text-info px-2.5 py-1 rounded-pill">
                            <i className="bi bi-person-badge me-1"></i> {dispatchFeedback.guestsSelected} Guests Selected
                          </span>
                          <span className="badge bg-dark border border-secondary text-primary px-2.5 py-1 rounded-pill">
                            <i className="bi bi-people me-1"></i> {dispatchFeedback.usersSelected} Users Selected
                          </span>
                          <span className="badge bg-dark border border-secondary text-light px-2.5 py-1 rounded-pill">
                            <i className="bi bi-phone me-1"></i> {dispatchFeedback.tokensFound} Tokens Found
                          </span>
                          <span className="badge bg-dark border border-secondary text-success px-2.5 py-1 rounded-pill">
                            <i className="bi bi-send-check me-1"></i> {dispatchFeedback.notificationsSent} Sent
                          </span>
                          {dispatchFeedback.notificationsFailed > 0 && (
                            <span className="badge bg-dark border border-secondary text-danger px-2.5 py-1 rounded-pill">
                              <i className="bi bi-send-x me-1"></i> {dispatchFeedback.notificationsFailed} Failed
                            </span>
                          )}
                          <span className="badge bg-dark border border-secondary text-warning px-2.5 py-1 rounded-pill">
                            <i className="bi bi-file-earmark-text me-1"></i> {dispatchFeedback.templateTitle}
                          </span>
                          <span className="text-slate-400 ms-1 font-monospace small">
                            [{dispatchFeedback.timestamp}]
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      className="btn-close btn-close-white"
                      onClick={() => setDispatchFeedback(null)}
                    ></button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Left Column: Recipients Selection */}
          <div className="col-lg-7">
            <div className="card glass-card shadow-lg border-0 rounded-4 h-100">
              <div className="card-header bg-transparent border-bottom border-secondary border-opacity-25 py-3 px-4 d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-0 fw-bold text-slate-100 d-flex align-items-center gap-2">
                    <i className="bi bi-people-fill text-primary"></i> 1. Select Target Recipients
                  </h5>
                  <span className="text-slate-400 small">Select guests, registered users, or both</span>
                </div>
                {(selectedGuestIds.length > 0 || selectedUserIds.length > 0) && (
                  <button
                    onClick={clearAllSelections}
                    className="btn btn-link text-danger p-0 text-decoration-none small fw-semibold"
                  >
                    <i className="bi bi-x-circle me-1"></i> Clear Selection
                  </button>
                )}
              </div>

              <div className="card-body p-4">
                {/* Guests Sub-Section */}
                <div className="mb-4 pb-3 border-bottom border-secondary border-opacity-25">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="d-flex align-items-center gap-2">
                      <i className="bi bi-person-badge text-info fs-5"></i>
                      <h6 className="fw-bold mb-0 text-slate-200">Guests ({guests.length})</h6>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                      <span className="badge bg-info bg-opacity-15 text-info border border-info border-opacity-25 rounded-pill px-2.5 py-1 small">
                        Selected Guests: {selectedGuestIds.length}
                      </span>
                      {guests.length > 0 && (
                        <div className="form-check mb-0">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="selectAllGuests"
                            checked={guests.length > 0 && selectedGuestIds.length === guests.length}
                            onChange={handleSelectAllGuests}
                          />
                          <label className="form-check-input-label text-slate-300 small fw-semibold ms-1 cursor-pointer" htmlFor="selectAllGuests">
                            Select All
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {guests.length === 0 ? (
                    <p className="text-slate-400 small italic mb-0 bg-dark p-3 rounded-3 border border-secondary border-opacity-25">
                      No active guest sessions currently stored.
                    </p>
                  ) : (
                    <div className="row g-2 max-vh-30 overflow-auto pe-1">
                      {guests.map((g, idx) => {
                        const gId = g.guestId || g.id || String(idx);
                        const isSelected = selectedGuestIds.includes(gId);
                        return (
                          <div key={gId} className="col-12 col-sm-6">
                            <div
                              onClick={() => toggleGuestSelect(gId)}
                              className={`selection-card p-2.5 d-flex align-items-center justify-content-between ${
                                isSelected ? 'selected' : ''
                              }`}
                            >
                              <div className="d-flex align-items-center gap-2 overflow-hidden">
                                <input
                                  className="form-check-input flex-shrink-0"
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}} // Handled by card click
                                />
                                <div className="text-truncate">
                                  <span className="font-monospace text-slate-200 small d-block text-truncate">
                                    {g.guestId || `Guest #${g.id || idx + 1}`}
                                  </span>
                                  <span className="text-slate-400 fs-7 d-block">
                                    {g.deviceType || 'Browser Client'}
                                  </span>
                                </div>
                              </div>
                              <StatusBadge
                                type={g.active ? 'success' : 'secondary'}
                                text={g.active ? 'Active' : 'Offline'}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Users Sub-Section */}
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="d-flex align-items-center gap-2">
                      <i className="bi bi-people text-primary fs-5"></i>
                      <h6 className="fw-bold mb-0 text-slate-200">Registered Users ({users.length})</h6>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                      <span className="badge bg-primary bg-opacity-15 text-primary border border-primary border-opacity-25 rounded-pill px-2.5 py-1 small">
                        Selected Users: {selectedUserIds.length}
                      </span>
                      {users.length > 0 && (
                        <div className="form-check mb-0">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="selectAllUsers"
                            checked={users.length > 0 && selectedUserIds.length === users.length}
                            onChange={handleSelectAllUsers}
                          />
                          <label className="form-check-input-label text-slate-300 small fw-semibold ms-1 cursor-pointer" htmlFor="selectAllUsers">
                            Select All
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {users.length === 0 ? (
                    <p className="text-slate-400 small italic mb-0 bg-dark p-3 rounded-3 border border-secondary border-opacity-25">
                      No registered user accounts found.
                    </p>
                  ) : (
                    <div className="row g-2 max-vh-30 overflow-auto pe-1">
                      {users.map((u, idx) => {
                        const uId = String(u.id || idx);
                        const isSelected = selectedUserIds.includes(uId);
                        return (
                          <div key={uId} className="col-12 col-sm-6">
                            <div
                              onClick={() => toggleUserSelect(uId)}
                              className={`selection-card p-2.5 d-flex align-items-center justify-content-between ${
                                isSelected ? 'selected' : ''
                              }`}
                            >
                              <div className="d-flex align-items-center gap-2 overflow-hidden">
                                <input
                                  className="form-check-input flex-shrink-0"
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}} // Handled by card click
                                />
                                <div className="text-truncate">
                                  <span className="fw-semibold text-slate-100 small d-block text-truncate">
                                    {u.username}
                                  </span>
                                  <span className="text-slate-400 fs-7 d-block">
                                    ID #{u.id || idx + 1}
                                  </span>
                                </div>
                              </div>
                              <StatusBadge
                                type={u.username === 'admin' ? 'admin' : 'primary'}
                                text={u.username === 'admin' ? 'ADMIN' : 'USER'}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Template Selection & Action Button */}
          <div className="col-lg-5">
            <div className="card glass-card shadow-lg border-0 rounded-4 h-100 d-flex flex-column">
              <div className="card-header bg-transparent border-bottom border-secondary border-opacity-25 py-3 px-4">
                <h5 className="mb-0 fw-bold text-slate-100 d-flex align-items-center gap-2">
                  <i className="bi bi-file-earmark-text-fill text-warning"></i> 2. Choose Notification Template
                </h5>
                <span className="text-slate-400 small">Select exactly ONE template to dispatch</span>
              </div>

              <div className="card-body p-4 flex-grow-1">
                {templates.length === 0 ? (
                  <p className="text-slate-400 small italic mb-0 bg-dark p-3 rounded-3 border border-secondary border-opacity-25">
                    No notification templates available.
                  </p>
                ) : (
                  <div className="d-flex flex-column gap-3 mb-4">
                    {templates.map((tpl, idx) => {
                      const tId = String(tpl.id || idx);
                      const isSelected = selectedTemplateId === tId;
                      return (
                        <div
                          key={tId}
                          onClick={() => handleSelectTemplate(tId)}
                          className={`selection-card p-3 ${isSelected ? 'selected' : ''}`}
                        >
                          <div className="d-flex align-items-start gap-3">
                            <input
                              className="form-check-input mt-1 flex-shrink-0"
                              type="radio"
                              name="notificationTemplateRadio"
                              id={`template-radio-${tId}`}
                              checked={isSelected}
                              onChange={() => handleSelectTemplate(tId)}
                            />
                            <div className="flex-grow-1">
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <label
                                  htmlFor={`template-radio-${tId}`}
                                  className="fw-bold text-slate-100 mb-0 cursor-pointer"
                                >
                                  {tpl.title || 'Untitled Template'}
                                </label>
                                <div className="d-flex align-items-center gap-1.5">
                                  <span className="badge bg-dark border border-secondary text-slate-300 font-monospace small">
                                    #{tpl.id || idx + 1}
                                  </span>
                                  <button
                                    type="button"
                                    className="btn btn-sm edit-template-btn rounded-circle p-0 d-inline-flex align-items-center justify-content-center flex-shrink-0 shadow-sm"
                                    style={{ width: '28px', height: '28px' }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenEditModal(tpl);
                                    }}
                                    title="Edit notification message for this template"
                                    aria-label={`Edit template #${tpl.id || idx + 1}`}
                                  >
                                    <i className="bi bi-pencil-fill" style={{ fontSize: '0.75rem' }}></i>
                                  </button>
                                </div>
                              </div>
                              <p className="text-slate-400 small mb-0 line-clamp-2">
                                {tpl.bodyTemplate || tpl.body || 'Standard notification message payload.'}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Summary Box */}
                <div className="bg-dark p-3 rounded-3 border border-secondary border-opacity-25 mb-4">
                  <span className="text-slate-400 fs-7 text-uppercase fw-bold tracking-wider d-block mb-2">
                    Dispatch Target Summary
                  </span>
                  <div className="d-flex justify-content-between text-slate-200 small mb-1">
                    <span>Target Guests:</span>
                    <strong className="text-info">{selectedGuestIds.length}</strong>
                  </div>
                  <div className="d-flex justify-content-between text-slate-200 small mb-1">
                    <span>Target Users:</span>
                    <strong className="text-primary">{selectedUserIds.length}</strong>
                  </div>
                  <div className="d-flex justify-content-between text-slate-200 small">
                    <span>Selected Template:</span>
                    <strong className="text-warning">
                      {selectedTemplateId
                        ? templates.find((t, idx) => String(t.id || idx) === String(selectedTemplateId))?.title || 'Selected'
                        : 'None'}
                    </strong>
                  </div>
                </div>

                {/* Prominent Send Notification Button */}
                <button
                  type="button"
                  onClick={handleSendNotification}
                  disabled={sending || loading}
                  className="btn btn-primary btn-lg w-100 py-3 rounded-pill shadow-lg fw-bold d-flex align-items-center justify-content-center gap-2 mt-auto"
                >
                  {sending ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      <span>Sending Notification...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-send-fill fs-5"></i>
                      <span>Send Notification</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ==================== SYSTEM OVERVIEW DATA TABLES ==================== */
        <div>
          {/* Sub Navigation Tabs */}
          <ul className="nav nav-pills nav-fill bg-dark p-2 rounded-4 border border-secondary border-opacity-25 mb-4 shadow-sm">
            <li className="nav-item">
              <button
                className={`nav-link rounded-3 fw-semibold transition-all ${
                  activeOverviewTab === 'guests' ? 'active bg-primary text-white' : 'text-slate-400'
                }`}
                onClick={() => setActiveOverviewTab('guests')}
              >
                <i className="bi bi-person-badge me-2"></i> Guests ({guests.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link rounded-3 fw-semibold transition-all ${
                  activeOverviewTab === 'users' ? 'active bg-primary text-white' : 'text-slate-400'
                }`}
                onClick={() => setActiveOverviewTab('users')}
              >
                <i className="bi bi-people me-2"></i> Registered Users ({users.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link rounded-3 fw-semibold transition-all ${
                  activeOverviewTab === 'templates' ? 'active bg-primary text-white' : 'text-slate-400'
                }`}
                onClick={() => setActiveOverviewTab('templates')}
              >
                <i className="bi bi-file-earmark-text me-2"></i> Notification Templates ({templates.length})
              </button>
            </li>
          </ul>

          <div className="card glass-card shadow-lg border-0 rounded-4 overflow-hidden">
            <div className="card-body p-0">
              {activeOverviewTab === 'guests' &&
                (guests.length === 0 ? (
                  <EmptyState
                    title="No Guests Stored"
                    message="No guest devices or session records are currently registered."
                    icon="person-badge"
                  />
                ) : (
                  <div className="table-responsive">
                    <table className="table table-dark table-hover align-middle mb-0">
                      <thead>
                        <tr>
                          <th className="py-3 px-4">#</th>
                          <th className="py-3 px-4">Guest ID</th>
                          <th className="py-3 px-4">Device Info</th>
                          <th className="py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {guests.map((g, idx) => (
                          <tr key={g.id || g.guestId || idx}>
                            <td className="py-3 px-4 text-slate-400">{g.id || idx + 1}</td>
                            <td className="py-3 px-4 font-monospace text-info small fw-medium">
                              {g.guestId || (g.id ? `Guest #${g.id}` : `Guest #${idx + 1}`)}
                            </td>
                            <td className="py-3 px-4 text-slate-200 small">{g.deviceType || 'Browser Client'}</td>
                            <td className="py-3 px-4">
                              <StatusBadge
                                type={g.active ? 'success' : 'secondary'}
                                text={g.active ? 'Active' : 'Offline'}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}

              {activeOverviewTab === 'users' &&
                (users.length === 0 ? (
                  <EmptyState
                    title="No Users Registered"
                    message="There are no registered user records in the database."
                    icon="people"
                  />
                ) : (
                  <div className="table-responsive">
                    <table className="table table-dark table-hover align-middle mb-0">
                      <thead>
                        <tr>
                          <th className="py-3 px-4">User ID</th>
                          <th className="py-3 px-4">Username</th>
                          <th className="py-3 px-4">System Role</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u, idx) => (
                          <tr key={u.id || idx}>
                            <td className="py-3 px-4 font-monospace text-slate-400 small">{u.id || idx + 1}</td>
                            <td className="py-3 px-4 fw-semibold text-slate-100">
                              <i className="bi bi-person-circle text-primary me-2"></i>
                              {u.username}
                            </td>
                            <td className="py-3 px-4">
                              <StatusBadge
                                type={u.username === 'admin' ? 'admin' : 'primary'}
                                text={u.username === 'admin' ? 'ADMIN' : 'USER'}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}

              {activeOverviewTab === 'templates' &&
                (templates.length === 0 ? (
                  <EmptyState
                    title="No Templates Found"
                    message="No notification templates configured in backend database."
                    icon="file-earmark-text"
                  />
                ) : (
                  <div className="p-4">
                    <div className="row g-4">
                      {templates.map((tpl, idx) => (
                        <div key={tpl.id || idx} className="col-md-6 col-lg-4">
                          <div className="card bg-dark border border-secondary border-opacity-25 h-100 rounded-3 shadow-sm">
                            <div className="card-body p-4">
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <div className="d-flex align-items-center gap-1.5">
                                  <span className="badge bg-primary bg-opacity-20 text-primary border border-primary border-opacity-25 rounded-pill px-2.5 py-1">
                                    ID #{tpl.id || idx + 1}
                                  </span>
                                  <button
                                    type="button"
                                    className="btn btn-sm edit-template-btn rounded-circle p-0 d-inline-flex align-items-center justify-content-center flex-shrink-0 shadow-sm"
                                    style={{ width: '26px', height: '26px' }}
                                    onClick={() => handleOverviewEditTemplate(tpl)}
                                    title="Edit and dispatch this template"
                                    aria-label={`Edit and dispatch template #${tpl.id || idx + 1}`}
                                  >
                                    <i className="bi bi-pencil-fill" style={{ fontSize: '0.7rem' }}></i>
                                  </button>
                                </div>
                                <StatusBadge
                                  type={tpl.active ? 'success' : 'secondary'}
                                  text={tpl.active ? 'Active' : 'Inactive'}
                                />
                              </div>
                              <h5 className="fw-bold text-slate-100 mb-2">{tpl.title || 'Untitled Template'}</h5>
                              <p className="text-slate-300 small mb-3">{tpl.bodyTemplate || tpl.body || 'No template body content'}</p>
                              {tpl.code && (
                                <div className="small text-info font-monospace bg-black bg-opacity-40 p-2 rounded border border-secondary border-opacity-25">
                                  Code: {tpl.code}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Template Edit Popup Modal */}
      <EditTemplateModal
        isOpen={isEditModalOpen}
        template={modalTargetTemplate || chosenTemplate}
        initialTitle={customTitle}
        initialBody={customBody}
        onSave={handleSaveTemplateCustomization}
        onClose={() => setIsEditModalOpen(false)}
        onReset={handleResetToTemplateDefault}
      />
    </div>
  );
};

export default AdminDashboardView;

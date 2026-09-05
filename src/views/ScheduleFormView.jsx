import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getTemplates } from '../api/adminApi';
import { getScheduleById, createSchedule, updateSchedule } from '../api/scheduleApi';
import ScheduleTypeFields from '../components/ScheduleTypeFields';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';

const ScheduleFormView = ({ isEdit = false }) => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const [formData, setFormData] = useState({
    templateId: '',
    scheduleType: 'DAILY',
    timeOfDay: '09:00',
    offsets: [1, 3, 7],
    offsetsString: '1, 3, 7',
    intervalMinutes: 15,
    isActive: true,
  });

  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      setError(null);
      try {
        const templatesData = await getTemplates();
        if (!isMounted) return;
        const activeTemplates = Array.isArray(templatesData) ? templatesData : [];
        setTemplates(activeTemplates);

        if (isEdit && id) {
          const schedule = await getScheduleById(id);
          if (!isMounted) return;
          setFormData({
            templateId: String(schedule.templateId || ''),
            scheduleType: schedule.scheduleType || 'DAILY',
            timeOfDay: schedule.timeOfDay || '',
            offsets: Array.isArray(schedule.offsets) ? schedule.offsets : [],
            offsetsString: Array.isArray(schedule.offsets) ? schedule.offsets.join(', ') : '',
            intervalMinutes: schedule.intervalMinutes || 15,
            isActive: schedule.active !== undefined ? schedule.active : true,
          });
        } else if (activeTemplates.length > 0) {
          setFormData((prev) => ({
            ...prev,
            templateId: String(activeTemplates[0].id || ''),
          }));
        }
      } catch (err) {
        console.error('Error loading form data:', err);
        if (isMounted) {
          const msg = err.response?.data?.message || err.message || 'Failed to load initial form data.';
          setError(msg);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, [isEdit, id]);

  const handleScheduleTypeChange = (e) => {
    const newType = e.target.value;
    setFieldErrors({});
    setFormData((prev) => {
      const updated = {
        templateId: prev.templateId,
        scheduleType: newType,
        isActive: prev.isActive,
      };

      if (newType === 'DAILY') {
        updated.timeOfDay = prev.timeOfDay || '09:00';
      } else if (newType === 'OFFSET') {
        updated.offsets = prev.offsets && prev.offsets.length > 0 ? prev.offsets : [1, 3, 7];
        updated.offsetsString = prev.offsetsString !== undefined ? prev.offsetsString : (updated.offsets.join(', '));
        if (prev.timeOfDay) {
          updated.timeOfDay = prev.timeOfDay;
        }
      } else if (newType === 'LOGIN_REMINDER') {
        updated.intervalMinutes = prev.intervalMinutes || 15;
      }
      return updated;
    });
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.templateId) {
      errors.templateId = 'Please select a notification template.';
    }

    if (!formData.scheduleType) {
      errors.scheduleType = 'Please select a schedule type.';
    }

    if (formData.scheduleType === 'DAILY') {
      if (!formData.timeOfDay) {
        errors.timeOfDay = 'Time of day is required for DAILY schedule.';
      }
    } else if (formData.scheduleType === 'OFFSET') {
      const rawString = formData.offsetsString !== undefined ? formData.offsetsString : (formData.offsets ? formData.offsets.join(', ') : '');
      const rawTokens = rawString.split(',').map((item) => item.trim()).filter((item) => item !== '');

      const hasInvalidToken = rawTokens.some((token) => !/^\d+$/.test(token));

      if (hasInvalidToken) {
        errors.offsets = 'Invalid offset days entered. Please enter valid non-negative integers separated by commas (e.g. 1, 3, 7).';
      } else if (!Array.isArray(formData.offsets) || formData.offsets.length === 0) {
        errors.offsets = 'Please enter at least one valid offset day (e.g. 1, 3, 7).';
      }
    } else if (formData.scheduleType === 'LOGIN_REMINDER') {
      if (!formData.intervalMinutes || Number(formData.intervalMinutes) <= 0) {
        errors.intervalMinutes = 'Interval minutes must be greater than zero.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setError(null);

    // Build payload strictly adhering to DTO contract
    const payload = {
      templateId: Number(formData.templateId),
      scheduleType: formData.scheduleType,
      isActive: Boolean(formData.isActive),
    };

    if (formData.scheduleType === 'DAILY') {
      payload.timeOfDay = formData.timeOfDay;
    } else if (formData.scheduleType === 'OFFSET') {
      payload.offsets = formData.offsets;
      if (formData.timeOfDay) {
        payload.timeOfDay = formData.timeOfDay;
      }
    } else if (formData.scheduleType === 'LOGIN_REMINDER') {
      payload.intervalMinutes = Number(formData.intervalMinutes);
    }

    try {
      if (isEdit) {
        await updateSchedule(id, payload);
      } else {
        await createSchedule(payload);
      }
      navigate('/admin/notification-schedules');
    } catch (err) {
      console.error('Error saving schedule:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to save schedule to server.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5">
        <LoadingSpinner message={isEdit ? 'Fetching schedule details...' : 'Loading notification templates...'} />
      </div>
    );
  }

  return (
    <div className="container py-5">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom border-secondary border-opacity-25">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h2 className="fw-bold text-gradient mb-0">
              {isEdit ? `Edit Schedule #${id}` : 'Create Notification Schedule'}
            </h2>
            <span className="badge bg-primary bg-opacity-20 text-primary border border-primary border-opacity-25 px-2.5 py-1 rounded-pill small">
              <i className={`bi me-1 ${isEdit ? 'bi-pencil-square' : 'bi-plus-circle'}`}></i>
              {isEdit ? 'Edit Mode' : 'New Schedule'}
            </span>
          </div>
          <p className="text-slate-400 mb-0 small">
            {isEdit
              ? 'Update existing automated notification schedule options.'
              : 'Configure recurring daily or offset notifications triggered automatically by Spring Boot.'}
          </p>
        </div>

        <Link
          to="/admin/notification-schedules"
          className="btn btn-outline-secondary rounded-pill px-3.5 py-2 fw-semibold small d-inline-flex align-items-center gap-1.5"
        >
          <i className="bi bi-arrow-left"></i>
          <span>Back to Schedules</span>
        </Link>
      </div>

      <ErrorAlert message={error} onClose={() => setError(null)} />

      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card glass-card shadow-lg border-0 rounded-4 overflow-hidden">
            <div className="card-body p-4 p-md-5">
              <form onSubmit={handleSubmit}>
                {/* 1. Notification Template */}
                <div className="mb-4">
                  <label htmlFor="templateId" className="form-label text-slate-200 fw-bold">
                    Select Notification Template <span className="text-danger">*</span>
                  </label>
                  <select
                    id="templateId"
                    className={`form-select bg-dark text-slate-100 border-secondary py-2.5 ${
                      fieldErrors.templateId ? 'is-invalid' : ''
                    }`}
                    value={formData.templateId}
                    onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                  >
                    <option value="" disabled>
                      -- Choose a Notification Template --
                    </option>
                    {templates.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        #{tpl.id} - {tpl.title || 'Untitled Template'}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.templateId && (
                    <div className="invalid-feedback d-block mt-1.5">{fieldErrors.templateId}</div>
                  )}
                  {formData.templateId && (
                    <div className="mt-2.5 p-3 bg-dark rounded-3 border border-secondary border-opacity-20 text-slate-300 small">
                      <span className="fw-semibold text-warning d-block mb-1">Template Content Preview:</span>
                      {templates.find((t) => String(t.id) === String(formData.templateId))?.bodyTemplate ||
                        'Standard notification body template.'}
                    </div>
                  )}
                </div>

                {/* 2. Schedule Type Selection */}
                <div className="mb-4">
                  <label htmlFor="scheduleType" className="form-label text-slate-200 fw-bold">
                    Schedule Type <span className="text-danger">*</span>
                  </label>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <div
                        className={`selection-card p-3 h-100 ${
                          formData.scheduleType === 'DAILY' ? 'selected' : ''
                        }`}
                        onClick={() => handleScheduleTypeChange({ target: { value: 'DAILY' } })}
                      >
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="scheduleTypeRadio"
                            id="typeDaily"
                            value="DAILY"
                            checked={formData.scheduleType === 'DAILY'}
                            onChange={handleScheduleTypeChange}
                          />
                          <label className="form-check-label fw-bold text-slate-100 cursor-pointer ms-1" htmlFor="typeDaily">
                            DAILY
                          </label>
                        </div>
                        <p className="text-slate-400 fs-7 mb-0 mt-2">
                          Executes every day at a specified fixed time of day.
                        </p>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div
                        className={`selection-card p-3 h-100 ${
                          formData.scheduleType === 'OFFSET' ? 'selected' : ''
                        }`}
                        onClick={() => handleScheduleTypeChange({ target: { value: 'OFFSET' } })}
                      >
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="scheduleTypeRadio"
                            id="typeOffset"
                            value="OFFSET"
                            checked={formData.scheduleType === 'OFFSET'}
                            onChange={handleScheduleTypeChange}
                          />
                          <label className="form-check-label fw-bold text-slate-100 cursor-pointer ms-1" htmlFor="typeOffset">
                            OFFSET
                          </label>
                        </div>
                        <p className="text-slate-400 fs-7 mb-0 mt-2">
                          Triggers N days after a user or guest registers.
                        </p>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div
                        className={`selection-card p-3 h-100 ${
                          formData.scheduleType === 'LOGIN_REMINDER' ? 'selected' : ''
                        }`}
                        onClick={() => handleScheduleTypeChange({ target: { value: 'LOGIN_REMINDER' } })}
                      >
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="scheduleTypeRadio"
                            id="typeReminder"
                            value="LOGIN_REMINDER"
                            checked={formData.scheduleType === 'LOGIN_REMINDER'}
                            onChange={handleScheduleTypeChange}
                          />
                          <label className="form-check-label fw-bold text-slate-100 cursor-pointer ms-1" htmlFor="typeReminder">
                            LOGIN REMINDER
                          </label>
                        </div>
                        <p className="text-slate-400 fs-7 mb-0 mt-2">
                          Sends periodic reminders after recipient reads notification.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Dynamic Configuration Fields */}
                <ScheduleTypeFields
                  scheduleType={formData.scheduleType}
                  formData={formData}
                  setFormData={setFormData}
                  errors={fieldErrors}
                />

                {/* 4. Active Switch */}
                <div className="mb-4 p-3 bg-dark rounded-3 border border-secondary border-opacity-25 d-flex align-items-center justify-content-between">
                  <div>
                    <h6 className="fw-bold text-slate-200 mb-0">Active Schedule Status</h6>
                    <span className="text-slate-400 small">
                      Enable or disable this schedule execution in the automated background worker.
                    </span>
                  </div>
                  <div className="form-check form-switch fs-4">
                    <input
                      className="form-check-input cursor-pointer"
                      type="checkbox"
                      role="switch"
                      id="isActiveSwitch"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="d-flex align-items-center justify-content-end gap-3 pt-3 border-top border-secondary border-opacity-25">
                  <Link
                    to="/admin/notification-schedules"
                    className="btn btn-outline-secondary rounded-pill px-4 py-2.5 fw-semibold"
                  >
                    Cancel
                  </Link>

                  <button
                    type="submit"
                    disabled={saving}
                    className="btn btn-primary rounded-pill px-4 py-2.5 fw-bold shadow-lg d-inline-flex align-items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        <span>Saving Schedule...</span>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-lg fs-5"></i>
                        <span>{isEdit ? 'Update Schedule' : 'Create Schedule'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleFormView;

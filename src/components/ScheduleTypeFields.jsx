import React from 'react';

const ScheduleTypeFields = ({
  scheduleType,
  formData,
  setFormData,
  errors = {},
}) => {
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleOffsetsChange = (value) => {
    // Parse comma-separated integers strictly
    const rawItems = value.split(',').map((item) => item.trim());
    const parsed = rawItems
      .filter((item) => item !== '' && /^\d+$/.test(item))
      .map((item) => parseInt(item, 10));

    setFormData((prev) => ({
      ...prev,
      offsetsString: value,
      offsets: parsed,
    }));
  };

  if (scheduleType === 'DAILY') {
    return (
      <div className="bg-dark p-4 rounded-3 border border-secondary border-opacity-25 mb-4">
        <h6 className="fw-bold text-slate-200 mb-3 d-flex align-items-center gap-2">
          <i className="bi bi-clock-history text-info"></i> Daily Schedule Configuration
        </h6>
        <div className="mb-3">
          <label htmlFor="timeOfDay" className="form-label text-slate-300 small fw-semibold">
            Execution Time (Asia/Kolkata) <span className="text-danger">*</span>
          </label>
          <input
            type="time"
            id="timeOfDay"
            className={`form-control bg-dark text-slate-100 border-secondary ${errors.timeOfDay ? 'is-invalid' : ''}`}
            value={formData.timeOfDay || ''}
            onChange={(e) => handleInputChange('timeOfDay', e.target.value)}
            required
          />
          {errors.timeOfDay ? (
            <div className="invalid-feedback d-block mt-1.5">{errors.timeOfDay}</div>
          ) : (
            <div className="form-text text-slate-400 fs-7">
              The daily time when this notification will be triggered for target users/guests.
            </div>
          )}
        </div>
      </div>
    );
  }

  if (scheduleType === 'OFFSET') {
    return (
      <div className="bg-dark p-4 rounded-3 border border-secondary border-opacity-25 mb-4">
        <h6 className="fw-bold text-slate-200 mb-3 d-flex align-items-center gap-2">
          <i className="bi bi-calendar-range text-primary"></i> Offset Schedule Configuration
        </h6>
        
        <div className="mb-3">
          <label htmlFor="offsetsInput" className="form-label text-slate-300 small fw-semibold">
            Offset Days (Comma Separated) <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            id="offsetsInput"
            className={`form-control bg-dark text-slate-100 border-secondary ${errors.offsets ? 'is-invalid' : ''}`}
            placeholder="e.g. 1, 3, 7"
            value={formData.offsetsString !== undefined ? formData.offsetsString : (formData.offsets ? formData.offsets.join(', ') : '')}
            onChange={(e) => handleOffsetsChange(e.target.value)}
          />
          {errors.offsets ? (
            <div className="invalid-feedback d-block mt-1.5">{errors.offsets}</div>
          ) : (
            <div className="form-text text-slate-400 fs-7">
              Number of days after recipient creation/registration to trigger notification (e.g. Day 1, Day 3, Day 7).
            </div>
          )}
          {Array.isArray(formData.offsets) && formData.offsets.length > 0 && (
            <div className="mt-2 d-flex flex-wrap gap-1.5 align-items-center">
              <span className="text-slate-400 fs-7 me-1">Parsed Offsets:</span>
              {formData.offsets.map((day, idx) => (
                <span key={idx} className="badge bg-primary bg-opacity-20 text-primary border border-primary border-opacity-30 rounded-pill">
                  Day {day}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mb-0">
          <label htmlFor="offsetTimeOfDay" className="form-label text-slate-300 small fw-semibold">
            Execution Time (Optional, Asia/Kolkata)
          </label>
          <input
            type="time"
            id="offsetTimeOfDay"
            className={`form-control bg-dark text-slate-100 border-secondary ${errors.timeOfDay ? 'is-invalid' : ''}`}
            value={formData.timeOfDay || ''}
            onChange={(e) => handleInputChange('timeOfDay', e.target.value)}
          />
          {errors.timeOfDay ? (
            <div className="invalid-feedback d-block mt-1.5">{errors.timeOfDay}</div>
          ) : (
            <div className="form-text text-slate-400 fs-7">
              Optional time of day to hold offset executions until specified hour (leave empty for instant processing on offset days).
            </div>
          )}
        </div>
      </div>
    );
  }

  if (scheduleType === 'LOGIN_REMINDER') {
    return (
      <div className="bg-dark p-4 rounded-3 border border-secondary border-opacity-25 mb-4">
        <h6 className="fw-bold text-slate-200 mb-3 d-flex align-items-center gap-2">
          <i className="bi bi-arrow-repeat text-warning"></i> Login Reminder Configuration
        </h6>
        <div className="mb-0">
          <label htmlFor="intervalMinutes" className="form-label text-slate-300 small fw-semibold">
            Inactivity Interval (Minutes) <span className="text-danger">*</span>
          </label>
          <input
            type="number"
            id="intervalMinutes"
            className={`form-control bg-dark text-slate-100 border-secondary ${errors.intervalMinutes ? 'is-invalid' : ''}`}
            placeholder="e.g. 15"
            min="1"
            value={formData.intervalMinutes || ''}
            onChange={(e) => handleInputChange('intervalMinutes', e.target.value)}
            required
          />
          {errors.intervalMinutes ? (
            <div className="invalid-feedback d-block mt-1.5">{errors.intervalMinutes}</div>
          ) : (
            <div className="form-text text-slate-400 fs-7">
              Time delay in minutes after a recipient reads or receives a notification before sending the next login reminder.
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default ScheduleTypeFields;

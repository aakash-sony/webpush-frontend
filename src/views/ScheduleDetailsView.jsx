import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getScheduleById, updateScheduleStatus } from '../api/scheduleApi';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { ScheduleTypeBadge, ActiveStatusBadge } from '../components/ScheduleStatusBadge';
import { formatDateTime } from '../utils/dateUtils';

const ScheduleDetailsView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  const fetchScheduleDetails = async () => {
    setError(null);
    try {
      const data = await getScheduleById(id);
      setSchedule(data);
    } catch (err) {
      console.error('Error fetching schedule details:', err);
      const msg = err.response?.data?.message || err.message || 'Schedule not found or failed to load.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduleDetails();
  }, [id]);

  const handleToggleStatus = async () => {
    if (!schedule || updating) return;
    const targetStatus = !schedule.active;
    setUpdating(true);
    setError(null);
    try {
      const updated = await updateScheduleStatus(schedule.id, targetStatus);
      setSchedule(updated);
    } catch (err) {
      console.error('Error updating status:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to update schedule status.';
      setError(msg);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5">
        <LoadingSpinner message="Fetching schedule details..." />
      </div>
    );
  }

  if (error || !schedule) {
    return (
      <div className="container py-5">
        <ErrorAlert message={error || 'Schedule details unavailable.'} />
        <div className="text-center mt-3">
          <Link to="/admin/notification-schedules" className="btn btn-primary rounded-pill px-4">
            <i className="bi bi-arrow-left me-2"></i> Back to Notification Schedules
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-3 border-bottom border-secondary border-opacity-25">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h2 className="fw-bold text-gradient mb-0">Schedule #{schedule.id} Details</h2>
            <ActiveStatusBadge isActive={schedule.active} />
          </div>
          <p className="text-slate-400 mb-0 small">
            Detailed configuration overview for automated notification schedule.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2 mt-3 mt-md-0">
          <Link
            to={`/admin/notification-schedules/${schedule.id}/edit`}
            className="btn btn-warning rounded-pill px-3.5 py-2 fw-semibold d-inline-flex align-items-center gap-1.5"
          >
            <i className="bi bi-pencil"></i>
            <span>Edit Schedule</span>
          </Link>

          <button
            onClick={handleToggleStatus}
            disabled={updating}
            className={`btn rounded-pill px-3.5 py-2 fw-semibold d-inline-flex align-items-center gap-1.5 ${
              schedule.active ? 'btn-outline-danger' : 'btn-outline-success'
            }`}
          >
            {updating ? (
              <span className="spinner-border spinner-border-sm" role="status"></span>
            ) : (
              <i className={`bi ${schedule.active ? 'bi-pause-circle' : 'bi-play-circle'}`}></i>
            )}
            <span>{schedule.active ? 'Disable Schedule' : 'Enable Schedule'}</span>
          </button>

          <Link
            to="/admin/notification-schedules"
            className="btn btn-outline-secondary rounded-pill px-3.5 py-2 fw-semibold small"
          >
            <i className="bi bi-arrow-left me-1"></i> Back
          </Link>
        </div>
      </div>

      <div className="row g-4">
        {/* Main Details Card */}
        <div className="col-lg-8">
          <div className="card glass-card shadow-lg border-0 rounded-4 overflow-hidden mb-4">
            <div className="card-header bg-transparent border-bottom border-secondary border-opacity-25 py-3 px-4">
              <h5 className="mb-0 fw-bold text-slate-100 d-flex align-items-center gap-2">
                <i className="bi bi-card-heading text-primary"></i> Schedule Overview
              </h5>
            </div>

            <div className="card-body p-4">
              <div className="row g-4">
                <div className="col-md-6">
                  <span className="text-slate-400 fs-7 text-uppercase fw-bold tracking-wider d-block mb-1">
                    Schedule ID
                  </span>
                  <span className="font-monospace text-slate-100 fw-bold fs-5">
                    #{schedule.id}
                  </span>
                </div>

                <div className="col-md-6">
                  <span className="text-slate-400 fs-7 text-uppercase fw-bold tracking-wider d-block mb-1">
                    Schedule Type
                  </span>
                  <div>
                    <ScheduleTypeBadge type={schedule.scheduleType} />
                  </div>
                </div>

                <div className="col-md-6">
                  <span className="text-slate-400 fs-7 text-uppercase fw-bold tracking-wider d-block mb-1">
                    Target Template ID
                  </span>
                  <span className="badge bg-dark border border-secondary text-info px-2.5 py-1.5 font-monospace">
                    Template #{schedule.templateId}
                  </span>
                </div>

                <div className="col-md-6">
                  <span className="text-slate-400 fs-7 text-uppercase fw-bold tracking-wider d-block mb-1">
                    Template Title
                  </span>
                  <span className="fw-semibold text-slate-100">
                    {schedule.templateTitle || `Template #${schedule.templateId}`}
                  </span>
                </div>

                <div className="col-12">
                  <hr className="border-secondary border-opacity-25 my-1" />
                </div>

                {/* Configuration Breakdown */}
                <div className="col-12">
                  <h6 className="fw-bold text-slate-200 mb-3 d-flex align-items-center gap-2">
                    <i className="bi bi-sliders text-warning"></i> Configuration Settings
                  </h6>

                  {schedule.scheduleType === 'DAILY' && (
                    <div className="bg-dark p-3.5 rounded-3 border border-secondary border-opacity-25">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-slate-300 small">Daily Execution Time:</span>
                        <strong className="font-monospace text-info fs-6">
                          {schedule.timeOfDay || '00:00'} (Server Asia/Kolkata)
                        </strong>
                      </div>
                    </div>
                  )}

                  {schedule.scheduleType === 'OFFSET' && (
                    <div className="bg-dark p-3.5 rounded-3 border border-secondary border-opacity-25">
                      <div className="mb-2">
                        <span className="text-slate-300 small d-block mb-1.5">Offset Trigger Days:</span>
                        <div className="d-flex flex-wrap gap-2">
                          {Array.isArray(schedule.offsets) && schedule.offsets.length > 0 ? (
                            schedule.offsets.map((day, idx) => (
                              <span
                                key={idx}
                                className="badge bg-primary bg-opacity-20 text-primary border border-primary border-opacity-30 rounded-pill px-3 py-1 font-monospace"
                              >
                                Day {day} ({day} {day === 1 ? 'day' : 'days'} after join)
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 italic">No offset days specified</span>
                          )}
                        </div>
                      </div>

                      {schedule.timeOfDay && (
                        <div className="pt-2 mt-2 border-top border-secondary border-opacity-20 d-flex justify-content-between align-items-center">
                          <span className="text-slate-300 small">Execution Time on Offset Days:</span>
                          <strong className="font-monospace text-info fs-6">
                            {schedule.timeOfDay} (Server Asia/Kolkata)
                          </strong>
                        </div>
                      )}
                    </div>
                  )}

                  {schedule.scheduleType === 'LOGIN_REMINDER' && (
                    <div className="bg-dark p-3.5 rounded-3 border border-secondary border-opacity-25">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-slate-300 small">Reminder Interval:</span>
                        <strong className="font-monospace text-warning fs-6">
                          Every {schedule.intervalMinutes || 15} Minutes
                        </strong>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Metadata Card */}
        <div className="col-lg-4">
          <div className="card glass-card shadow-lg border-0 rounded-4 overflow-hidden mb-4">
            <div className="card-header bg-transparent border-bottom border-secondary border-opacity-25 py-3 px-4">
              <h5 className="mb-0 fw-bold text-slate-100 d-flex align-items-center gap-2">
                <i className="bi bi-info-circle text-info"></i> Metadata
              </h5>
            </div>

            <div className="card-body p-4">
              <div className="d-flex flex-column gap-3">
                <div>
                  <span className="text-slate-400 fs-7 text-uppercase fw-bold tracking-wider d-block mb-1">
                    Current Status
                  </span>
                  <ActiveStatusBadge isActive={schedule.active} />
                </div>

                <div>
                  <span className="text-slate-400 fs-7 text-uppercase fw-bold tracking-wider d-block mb-1">
                    Created Timestamp
                  </span>
                  <span className="text-slate-200 small font-monospace d-block">
                    {formatDateTime(schedule.createdAt) || 'N/A'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 fs-7 text-uppercase fw-bold tracking-wider d-block mb-1">
                    Last Updated
                  </span>
                  <span className="text-slate-200 small font-monospace d-block">
                    {formatDateTime(schedule.updatedAt) || 'N/A'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 fs-7 text-uppercase fw-bold tracking-wider d-block mb-1">
                    Scheduler Timezone
                  </span>
                  <span className="badge bg-dark text-slate-300 border border-secondary border-opacity-30 font-monospace">
                    Asia/Kolkata (IST)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleDetailsView;

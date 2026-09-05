import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSchedules, updateScheduleStatus } from '../api/scheduleApi';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';
import { ScheduleTypeBadge, ActiveStatusBadge } from '../components/ScheduleStatusBadge';
import { formatDateTime } from '../utils/dateUtils';

const AdminNotificationSchedulesView = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [confirmToggleSchedule, setConfirmToggleSchedule] = useState(null);

  const fetchSchedules = async () => {
    setError(null);
    try {
      const data = await getSchedules();
      setSchedules(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching schedules:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to fetch notification schedules from backend.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleToggleStatus = async (schedule) => {
    const targetStatus = !schedule.active;
    setUpdatingId(schedule.id);
    setError(null);
    try {
      const updated = await updateScheduleStatus(schedule.id, targetStatus);
      setSchedules((prev) =>
        prev.map((s) => (s.id === schedule.id ? updated : s))
      );
      setConfirmToggleSchedule(null);
    } catch (err) {
      console.error('Error updating schedule status:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to update schedule status.';
      setError(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const formatScheduleConfig = (schedule) => {
    if (schedule.scheduleType === 'DAILY') {
      return (
        <span className="font-monospace small text-info">
          Daily at {schedule.timeOfDay || '00:00'} (Server Asia/Kolkata)
        </span>
      );
    }
    if (schedule.scheduleType === 'OFFSET') {
      const offsetsStr = Array.isArray(schedule.offsets) && schedule.offsets.length > 0
        ? `Day ${schedule.offsets.join(', Day ')}`
        : 'No offsets set';
      return (
        <div>
          <span className="font-monospace small text-primary d-block">{offsetsStr}</span>
          {schedule.timeOfDay && (
            <span className="text-slate-400 fs-7">At {schedule.timeOfDay} (Server Asia/Kolkata)</span>
          )}
        </div>
      );
    }
    if (schedule.scheduleType === 'LOGIN_REMINDER') {
      return (
        <span className="font-monospace small text-warning">
          Every {schedule.intervalMinutes || 15} mins after read/login
        </span>
      );
    }
    return <span className="text-slate-400">N/A</span>;
  };

  return (
    <div className="container py-5">
      {/* Header & Actions */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-3 border-bottom border-secondary border-opacity-25">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h2 className="fw-bold text-gradient mb-0">Notification Schedules</h2>
            <span className="badge bg-primary bg-opacity-20 text-primary border border-primary border-opacity-25 px-2.5 py-1 rounded-pill small">
              <i className="bi bi-clock-history me-1"></i> Admin Management
            </span>
          </div>
          <p className="text-slate-400 mb-0 small">
            Configure automated daily pushes, subscriber lifecycle offsets, and login reminder schedules.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2 mt-3 mt-md-0">
          <Link
            to="/admin/notification-schedules/new"
            className="btn btn-primary rounded-pill px-3.5 py-2 fw-semibold shadow-sm d-inline-flex align-items-center gap-1.5"
          >
            <i className="bi bi-plus-lg"></i>
            <span>Create Schedule</span>
          </Link>

          <button
            onClick={() => {
              setLoading(true);
              fetchSchedules();
            }}
            className="btn btn-outline-secondary rounded-circle p-2 shadow-sm"
            title="Refresh Schedules"
          >
            <i className="bi bi-arrow-clockwise fs-5"></i>
          </button>
        </div>
      </div>

      <ErrorAlert message={error} onClose={() => setError(null)} />

      {/* Confirmation Modal Backdrop / Card */}
      {confirmToggleSchedule && (
        <div className="alert alert-warning border-warning border-opacity-50 glass-card shadow-lg rounded-4 p-4 mb-4">
          <div className="d-flex align-items-start justify-content-between">
            <div className="d-flex align-items-center gap-3">
              <i className="bi bi-exclamation-circle text-warning fs-2 flex-shrink-0"></i>
              <div>
                <h5 className="fw-bold text-slate-100 mb-1">
                  Confirm Status Change
                </h5>
                <p className="text-slate-300 small mb-0">
                  Are you sure you want to {confirmToggleSchedule.active ? 'DISABLE' : 'ENABLE'} schedule #{confirmToggleSchedule.id} ({confirmToggleSchedule.templateTitle || 'Schedule'})?
                </p>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button
                className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                onClick={() => setConfirmToggleSchedule(null)}
                disabled={updatingId !== null}
              >
                Cancel
              </button>
              <button
                className={`btn btn-sm rounded-pill px-3 fw-bold ${confirmToggleSchedule.active ? 'btn-danger' : 'btn-success'}`}
                onClick={() => handleToggleStatus(confirmToggleSchedule)}
                disabled={updatingId !== null}
              >
                {updatingId === confirmToggleSchedule.id ? (
                  <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                ) : (
                  <i className={`bi me-1 ${confirmToggleSchedule.active ? 'bi-pause-circle' : 'bi-play-circle'}`}></i>
                )}
                Confirm {confirmToggleSchedule.active ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingSpinner message="Loading notification schedules..." />
      ) : schedules.length === 0 ? (
        <EmptyState
          title="No Notification Schedules"
          message="No active or inactive notification schedules have been configured yet."
          icon="clock-history"
        />
      ) : (
        <div className="card glass-card shadow-lg border-0 rounded-4 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-dark table-hover align-middle mb-0">
              <thead className="bg-dark bg-opacity-50">
                <tr>
                  <th className="py-3.5 px-4 text-slate-400 font-monospace small"># ID</th>
                  <th className="py-3.5 px-4 text-slate-200">Template / Title</th>
                  <th className="py-3.5 px-4 text-slate-200">Schedule Type</th>
                  <th className="py-3.5 px-4 text-slate-200">Configuration</th>
                  <th className="py-3.5 px-4 text-slate-200">Status</th>
                  <th className="py-3.5 px-4 text-slate-400 small">Created At</th>
                  <th className="py-3.5 px-4 text-end text-slate-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((schedule) => (
                  <tr key={schedule.id}>
                    <td className="py-3.5 px-4 font-monospace text-slate-400 small">
                      #{schedule.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="fw-semibold text-slate-100">
                        {schedule.templateTitle || `Template #${schedule.templateId}`}
                      </div>
                      <span className="text-slate-400 fs-7">Template ID: #{schedule.templateId}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <ScheduleTypeBadge type={schedule.scheduleType} />
                    </td>
                    <td className="py-3.5 px-4">
                      {formatScheduleConfig(schedule)}
                    </td>
                    <td className="py-3.5 px-4">
                      <ActiveStatusBadge isActive={schedule.active} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 small">
                      {formatDateTime(schedule.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-end">
                      <div className="d-flex justify-content-end align-items-center gap-1.5">
                        <Link
                          to={`/admin/notification-schedules/${schedule.id}`}
                          className="btn btn-sm btn-outline-info rounded-circle p-1.5"
                          title="View Details"
                        >
                          <i className="bi bi-eye"></i>
                        </Link>

                        <Link
                          to={`/admin/notification-schedules/${schedule.id}/edit`}
                          className="btn btn-sm btn-outline-warning rounded-circle p-1.5"
                          title="Edit Schedule"
                        >
                          <i className="bi bi-pencil"></i>
                        </Link>

                        <button
                          onClick={() => setConfirmToggleSchedule(schedule)}
                          disabled={updatingId === schedule.id}
                          className={`btn btn-sm rounded-circle p-1.5 ${
                            schedule.active
                              ? 'btn-outline-danger'
                              : 'btn-outline-success'
                          }`}
                          title={schedule.active ? 'Disable Schedule' : 'Enable Schedule'}
                        >
                          {updatingId === schedule.id ? (
                            <span className="spinner-border spinner-border-sm" role="status"></span>
                          ) : (
                            <i className={`bi ${schedule.active ? 'bi-pause-fill' : 'bi-play-fill'}`}></i>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotificationSchedulesView;

import api from './axiosConfig';

/**
 * Fetch all notification schedules.
 */
export const getSchedules = async () => {
  const response = await api.get('/admin/notification-schedules');
  return response.data;
};

/**
 * Fetch a single notification schedule by ID.
 */
export const getScheduleById = async (id) => {
  const response = await api.get(`/admin/notification-schedules/${id}`);
  return response.data;
};

/**
 * Create a new notification schedule.
 * @param {Object} scheduleData
 */
export const createSchedule = async (scheduleData) => {
  const response = await api.post('/admin/notification-schedules', scheduleData);
  return response.data;
};

/**
 * Update an existing notification schedule by ID.
 * @param {string|number} id
 * @param {Object} scheduleData
 */
export const updateSchedule = async (id, scheduleData) => {
  const response = await api.put(`/admin/notification-schedules/${id}`, scheduleData);
  return response.data;
};

/**
 * Update active status of a schedule.
 * @param {string|number} id
 * @param {boolean} active
 */
export const updateScheduleStatus = async (id, active) => {
  const response = await api.patch(`/admin/notification-schedules/${id}/status`, null, {
    params: { active },
  });
  return response.data;
};

/**
 * Delete a notification schedule by ID.
 * @param {string|number} id
 */
export const deleteSchedule = async (id) => {
  const response = await api.delete(`/admin/notification-schedules/${id}`);
  return response.data;
};


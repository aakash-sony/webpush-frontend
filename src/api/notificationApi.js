import api from './axiosConfig';

/**
 * Fetch paginated notification history for an authenticated user.
 */
export const getUserNotifications = async (userId, page = 0, size = 20) => {
  const response = await api.get(`/notifications/user/${encodeURIComponent(userId)}`, {
    params: { page, size },
  });
  return response.data;
};

/**
 * Fetch paginated notification history for a guest visitor.
 */
export const getGuestNotifications = async (guestId, page = 0, size = 20) => {
  const response = await api.get(`/notifications/guest/${encodeURIComponent(guestId)}`, {
    params: { page, size },
  });
  return response.data;
};

/**
 * Fetch unread notification count for an authenticated user.
 */
export const getUserUnreadCount = async (userId) => {
  const response = await api.get(`/notifications/user/${encodeURIComponent(userId)}/unread-count`);
  return response.data;
};

/**
 * Fetch unread notification count for a guest visitor.
 */
export const getGuestUnreadCount = async (guestId) => {
  const response = await api.get(`/notifications/guest/${encodeURIComponent(guestId)}/unread-count`);
  return response.data;
};

/**
 * Mark a specific notification as read.
 */
export const markNotificationAsRead = async (notificationId, { userId, guestId } = {}) => {
  const params = {};
  if (userId) params.userId = userId;
  if (guestId) params.guestId = guestId;

  const response = await api.patch(`/notifications/${notificationId}/read`, null, { params });
  return response.data;
};

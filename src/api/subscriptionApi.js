import api from './axiosConfig';

export const registerSubscription = async ({ guestId, fcmToken, deviceType, userId }) => {
  const response = await api.post('/notifications/subscriptions', {
    guestId,
    fcmToken,
    deviceType,
    userId,
  });
  return response.data;
};

export const associateGuest = async (guestId, userId) => {
  const response = await api.patch('/notifications/subscriptions/associate', {
    guestId,
    userId,
  });
  return response.data;
};

export const checkSubscription = async (guestId, fcmToken) => {
  const params = {};
  if (guestId) params.guestId = guestId;
  if (fcmToken) params.fcmToken = fcmToken;
  const response = await api.get('/notifications/subscriptions/check', { params });
  return response.data;
};

export const disassociateSubscription = async (guestId, fcmToken) => {
  const params = {};
  if (guestId) params.guestId = guestId;
  if (fcmToken) params.fcmToken = fcmToken;
  const response = await api.post('/notifications/subscriptions/disassociate', null, { params });
  return response.data;
};

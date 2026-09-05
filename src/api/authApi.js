import api from './axiosConfig';

export const registerUser = async ({ username, password, confirmPassword }) => {
  const response = await api.post('/auth/register', {
    username,
    password,
    confirmPassword,
  });
  return response.data;
};

export const loginUser = async ({ username, password }) => {
  const response = await api.post('/auth/login', {
    username,
    password,
  });
  return response.data;
};

export const logoutUser = async ({ guestId, fcmToken } = {}) => {
  const params = {};
  if (guestId) params.guestId = guestId;
  if (fcmToken) params.fcmToken = fcmToken;
  const response = await api.post('/auth/logout', null, { params });
  return response.data;
};


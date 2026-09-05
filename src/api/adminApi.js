import api from './axiosConfig';

export const getGuests = async () => {
  const response = await api.get('/admin/guests');
  return response.data;
};

export const getUsers = async () => {
  const response = await api.get('/admin/users');
  return response.data;
};

export const getTemplates = async () => {
  const response = await api.get('/admin/notifications/templates');
  return response.data;
};

export const sendNotification = async (sendData) => {
  const response = await api.post('/admin/notifications/send', sendData);
  return response.data;
};


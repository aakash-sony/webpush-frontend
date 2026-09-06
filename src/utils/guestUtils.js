const GUEST_ID_KEY = 'webpush_guest_id';

export const generateSecureUUID = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const generateNewGuestId = () => {
  const guestId = `guest_${generateSecureUUID()}`;
  localStorage.setItem(GUEST_ID_KEY, guestId);
  return guestId;
};

export const getOrCreateGuestId = () => {
  let guestId = localStorage.getItem(GUEST_ID_KEY);

  if (!guestId || !guestId.trim()) {
    guestId = generateNewGuestId();
  }

  return guestId.trim();
};

export const setStoredGuestId = (guestId) => {
  if (guestId && guestId.trim()) {
    localStorage.setItem(GUEST_ID_KEY, guestId.trim());
  }
};

export const resetGuestId = () => {
  localStorage.removeItem(GUEST_ID_KEY);
  return generateNewGuestId();
};

export const getStoredGuestId = () => {
  return localStorage.getItem(GUEST_ID_KEY);
};
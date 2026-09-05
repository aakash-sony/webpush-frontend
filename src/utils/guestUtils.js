const GUEST_ID_KEY = 'webpush_guest_id';

export const getOrCreateGuestId = () => {
  let guestId = localStorage.getItem(GUEST_ID_KEY);

  if (!guestId || !guestId.trim()) {
    guestId = generateNewGuestId();
  }

  return guestId;
};

export const setStoredGuestId = (guestId) => {
  if (guestId && guestId.trim()) {
    localStorage.setItem(GUEST_ID_KEY, guestId.trim());
  }
};

export const generateNewGuestId = () => {
  const guestId = `guest_${Date.now()}`;

  localStorage.setItem(GUEST_ID_KEY, guestId);

  return guestId;
};

export const resetGuestId = () => {
  localStorage.removeItem(GUEST_ID_KEY);

  return generateNewGuestId();
};

export const getStoredGuestId = () => {
  return localStorage.getItem(GUEST_ID_KEY);
};
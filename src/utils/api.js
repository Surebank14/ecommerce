const DEFAULT_API_URL = 'https://surebank-backend.onrender.com';

export const API_URL =
  process.env.REACT_APP_API_URL?.replace(/\/$/, '') || DEFAULT_API_URL;

export const getAuthHeader = () => {
  const token = localStorage.getItem('customerToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getSessionId = () => {
  let sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
};

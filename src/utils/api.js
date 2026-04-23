const REMOTE_API_URL = 'https://surebank-backend.onrender.com';
const LOCAL_API_URL = 'http://localhost:8080';

const getDefaultApiUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return LOCAL_API_URL;
    }
  }

  return REMOTE_API_URL;
};

export const API_URL =
  process.env.REACT_APP_API_URL?.replace(/\/$/, '') || getDefaultApiUrl();

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

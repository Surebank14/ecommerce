import { createSlice } from '@reduxjs/toolkit';

// Try to restore customer data from localStorage
const getStoredCustomer = () => {
  try {
    const stored = localStorage.getItem('customerData');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const initialState = {
  customer: getStoredCustomer(),
  token: localStorage.getItem('customerToken') || null,
  accountNumber: localStorage.getItem('customerAccountNumber') || null,
  SBAccountNumber: localStorage.getItem('customerSBAccountNumber') || null,
  loading: false,
  error: null,
  isAuthenticated: !!localStorage.getItem('customerToken'),
  requiresPasswordUpdate: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.customer = action.payload.customer;
      state.token = action.payload.token;
      state.accountNumber = action.payload.accountNumber;
      state.SBAccountNumber = action.payload.SBAccountNumber;
      state.isAuthenticated = true;
      state.requiresPasswordUpdate = action.payload.requiresPasswordUpdate === true;
      localStorage.setItem('customerToken', action.payload.token);
      localStorage.setItem('customerData', JSON.stringify(action.payload.customer));
      localStorage.setItem('customerAccountNumber', action.payload.accountNumber || '');
      localStorage.setItem('customerSBAccountNumber', action.payload.SBAccountNumber || '');
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    registerRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    registerSuccess: (state, action) => {
      state.loading = false;
      state.customer = action.payload.customer;
      state.token = action.payload.token;
      state.accountNumber = action.payload.accountNumber;
      state.SBAccountNumber = action.payload.SBAccountNumber;
      state.isAuthenticated = true;
      state.requiresPasswordUpdate = false;
      localStorage.setItem('customerToken', action.payload.token);
      localStorage.setItem('customerData', JSON.stringify(action.payload.customer));
      localStorage.setItem('customerAccountNumber', action.payload.accountNumber || '');
      localStorage.setItem('customerSBAccountNumber', action.payload.SBAccountNumber || '');
    },
    registerFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    checkPhoneRequest: (state) => {
      state.loading = true;
    },
    checkPhoneSuccess: (state) => {
      state.loading = false;
    },
    checkPhoneFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateCustomerProfile: (state, action) => {
      state.customer = {
        ...(state.customer || {}),
        ...(action.payload || {}),
      };
      localStorage.setItem('customerData', JSON.stringify(state.customer));
    },
    logout: (state) => {
      state.customer = null;
      state.token = null;
      state.accountNumber = null;
      state.SBAccountNumber = null;
      state.isAuthenticated = false;
      state.requiresPasswordUpdate = false;
      localStorage.removeItem('customerToken');
      localStorage.removeItem('customerData');
      localStorage.removeItem('customerAccountNumber');
      localStorage.removeItem('customerSBAccountNumber');
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  loginRequest,
  loginSuccess,
  loginFailure,
  registerRequest,
  registerSuccess,
  registerFailure,
  checkPhoneRequest,
  checkPhoneSuccess,
  checkPhoneFailure,
  updateCustomerProfile,
  logout,
  clearError,
} = authSlice.actions;

export default authSlice.reducer;

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,
  success: false,
  paymentData: null,
  paymentLoading: false,
  paymentError: null,
  paymentVerified: false,
  payoffLoading: false,
  payoffError: null,
  orderDepositLoading: false,
  orderDepositError: null,
};

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    fetchOrdersRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchOrdersSuccess: (state, action) => {
      state.loading = false;
      state.orders = action.payload;
    },
    fetchOrdersFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    fetchOrderByNumberRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchOrderByNumberSuccess: (state, action) => {
      state.loading = false;
      state.currentOrder = action.payload;
    },
    fetchOrderByNumberFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    payoffRemainingBalanceRequest: (state) => {
      state.payoffLoading = true;
      state.payoffError = null;
    },
    payoffRemainingBalanceSuccess: (state, action) => {
      state.payoffLoading = false;
      state.currentOrder = action.payload.order;
      state.success = true;
    },
    payoffRemainingBalanceFailure: (state, action) => {
      state.payoffLoading = false;
      state.payoffError = action.payload;
    },
    initializeOrderDepositRequest: (state) => {
      state.orderDepositLoading = true;
      state.orderDepositError = null;
    },
    initializeOrderDepositSuccess: (state) => {
      state.orderDepositLoading = false;
    },
    initializeOrderDepositFailure: (state, action) => {
      state.orderDepositLoading = false;
      state.orderDepositError = action.payload;
    },
    clearOrderState: (state) => {
      state.currentOrder = null;
      state.success = false;
      state.error = null;
      state.paymentData = null;
      state.paymentError = null;
      state.paymentVerified = false;
      state.payoffLoading = false;
      state.payoffError = null;
      state.orderDepositLoading = false;
      state.orderDepositError = null;
    },
    // Payment actions
    initializePaymentRequest: (state) => {
      state.paymentLoading = true;
      state.paymentError = null;
      state.paymentData = null;
    },
    initializePaymentSuccess: (state, action) => {
      state.paymentLoading = false;
      state.paymentData = action.payload;
    },
    initializePaymentFailure: (state, action) => {
      state.paymentLoading = false;
      state.paymentError = action.payload;
    },
    verifyPaymentRequest: (state) => {
      state.loading = true;
      state.error = null;
      state.paymentVerified = false;
    },
    verifyPaymentSuccess: (state, action) => {
      state.loading = false;
      state.currentOrder = action.payload.order;
      state.paymentVerified = true;
      state.success = true;
    },
    verifyPaymentFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.paymentVerified = false;
    },
    clearPaymentState: (state) => {
      state.paymentData = null;
      state.paymentError = null;
      state.paymentLoading = false;
      state.paymentVerified = false;
    },
  },
});

export const {
  fetchOrdersRequest,
  fetchOrdersSuccess,
  fetchOrdersFailure,
  fetchOrderByNumberRequest,
  fetchOrderByNumberSuccess,
  fetchOrderByNumberFailure,
  payoffRemainingBalanceRequest,
  payoffRemainingBalanceSuccess,
  payoffRemainingBalanceFailure,
  initializeOrderDepositRequest,
  initializeOrderDepositSuccess,
  initializeOrderDepositFailure,
  clearOrderState,
  initializePaymentRequest,
  initializePaymentSuccess,
  initializePaymentFailure,
  verifyPaymentRequest,
  verifyPaymentSuccess,
  verifyPaymentFailure,
  clearPaymentState,
} = orderSlice.actions;

export default orderSlice.reducer;

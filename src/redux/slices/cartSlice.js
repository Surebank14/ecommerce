import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  totalAmount: 0,
  totalItems: 0,
  loading: false,
  error: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    fetchCartRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchCartSuccess: (state, action) => {
      state.loading = false;
      state.items = action.payload.items || [];
      state.totalAmount = action.payload.totalAmount || 0;
      state.totalItems = action.payload.totalItems || 0;
    },
    fetchCartFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    addToCartRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    addToCartSuccess: (state, action) => {
      state.loading = false;
      state.items = action.payload.items || [];
      state.totalAmount = action.payload.totalAmount || 0;
      state.totalItems = action.payload.totalItems || 0;
    },
    addToCartFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateCartItemRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    updateCartItemSuccess: (state, action) => {
      state.loading = false;
      state.items = action.payload.items || [];
      state.totalAmount = action.payload.totalAmount || 0;
      state.totalItems = action.payload.totalItems || 0;
    },
    updateCartItemFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    removeFromCartRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    removeFromCartSuccess: (state, action) => {
      state.loading = false;
      state.items = action.payload.items || [];
      state.totalAmount = action.payload.totalAmount || 0;
      state.totalItems = action.payload.totalItems || 0;
    },
    removeFromCartFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    clearCartRequest: (state) => {
      state.loading = true;
    },
    clearCartSuccess: (state) => {
      state.loading = false;
      state.items = [];
      state.totalAmount = 0;
      state.totalItems = 0;
    },
    clearCartFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    mergeCartRequest: (state) => {
      state.loading = true;
    },
    mergeCartSuccess: (state, action) => {
      state.loading = false;
      state.items = action.payload.items || [];
      state.totalAmount = action.payload.totalAmount || 0;
      state.totalItems = action.payload.totalItems || 0;
    },
    mergeCartFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const {
  fetchCartRequest,
  fetchCartSuccess,
  fetchCartFailure,
  addToCartRequest,
  addToCartSuccess,
  addToCartFailure,
  updateCartItemRequest,
  updateCartItemSuccess,
  updateCartItemFailure,
  removeFromCartRequest,
  removeFromCartSuccess,
  removeFromCartFailure,
  clearCartRequest,
  clearCartSuccess,
  clearCartFailure,
  mergeCartRequest,
  mergeCartSuccess,
  mergeCartFailure,
} = cartSlice.actions;

export default cartSlice.reducer;

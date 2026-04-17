import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  products: [],
  product: null,
  featuredProducts: [],
  categories: [],
  loading: false,
  error: null,
};

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    fetchProductsRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchProductsSuccess: (state, action) => {
      state.loading = false;
      state.products = action.payload;
    },
    fetchProductsFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    fetchProductByIdRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchProductByIdSuccess: (state, action) => {
      state.loading = false;
      state.product = action.payload;
    },
    fetchProductByIdFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    fetchFeaturedProductsRequest: (state) => {
      state.loading = true;
    },
    fetchFeaturedProductsSuccess: (state, action) => {
      state.loading = false;
      state.featuredProducts = action.payload;
    },
    fetchFeaturedProductsFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    fetchCategoriesRequest: (state) => {
      state.loading = true;
    },
    fetchCategoriesSuccess: (state, action) => {
      state.loading = false;
      state.categories = action.payload;
    },
    fetchCategoriesFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    clearProduct: (state) => {
      state.product = null;
    },
  },
});

export const {
  fetchProductsRequest,
  fetchProductsSuccess,
  fetchProductsFailure,
  fetchProductByIdRequest,
  fetchProductByIdSuccess,
  fetchProductByIdFailure,
  fetchFeaturedProductsRequest,
  fetchFeaturedProductsSuccess,
  fetchFeaturedProductsFailure,
  fetchCategoriesRequest,
  fetchCategoriesSuccess,
  fetchCategoriesFailure,
  clearProduct,
} = productSlice.actions;

export default productSlice.reducer;

import { call, put, takeLatest } from 'redux-saga/effects';
import axios from 'axios';
import {
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
} from '../slices/cartSlice';
import { API_URL, getAuthHeader, getSessionId } from '../../utils/api';

function* fetchCartSaga() {
  try {
    const token = localStorage.getItem('customerToken');
    let url = `${API_URL}/api/cart`;
    let config = {};

    if (token) {
      config.headers = getAuthHeader();
    } else {
      url += `?sessionId=${getSessionId()}`;
    }

    const response = yield call(axios.get, url, config);
    yield put(fetchCartSuccess(response.data));
  } catch (error) {
    yield put(fetchCartFailure(error.response?.data?.message || 'Failed to fetch cart'));
  }
}

function* addToCartSaga(action) {
  try {
    const { productId, quantity, variationId } = action.payload;
    const token = localStorage.getItem('customerToken');
    const config = token ? { headers: getAuthHeader() } : {};

    const response = yield call(axios.post, `${API_URL}/api/cart/add`, {
      productId,
      quantity,
      variationId,
      sessionId: token ? undefined : getSessionId(),
    }, config);

    yield put(addToCartSuccess(response.data.cart));
  } catch (error) {
    yield put(addToCartFailure(error.response?.data?.message || 'Failed to add to cart'));
  }
}

function* updateCartItemSaga(action) {
  try {
    const { productId, quantity, variationId } = action.payload;
    const token = localStorage.getItem('customerToken');
    const config = token ? { headers: getAuthHeader() } : {};

    const response = yield call(axios.put, `${API_URL}/api/cart/update`, {
      productId,
      quantity,
      variationId,
      sessionId: token ? undefined : getSessionId(),
    }, config);

    yield put(updateCartItemSuccess(response.data.cart));
  } catch (error) {
    yield put(updateCartItemFailure(error.response?.data?.message || 'Failed to update cart'));
  }
}

function* removeFromCartSaga(action) {
  try {
    const { productId, variationId } = action.payload;
    const token = localStorage.getItem('customerToken');
    const config = token ? { headers: getAuthHeader() } : {};
    const params = new URLSearchParams();
    if (!token) params.append('sessionId', getSessionId());
    if (variationId) params.append('variationId', variationId);
    const sessionParam = params.toString() ? `?${params.toString()}` : '';

    const response = yield call(axios.delete, `${API_URL}/api/cart/remove/${productId}${sessionParam}`, config);
    yield put(removeFromCartSuccess(response.data.cart));
  } catch (error) {
    yield put(removeFromCartFailure(error.response?.data?.message || 'Failed to remove from cart'));
  }
}

function* clearCartSaga() {
  try {
    const token = localStorage.getItem('customerToken');
    const config = token ? { headers: getAuthHeader() } : {};
    const sessionParam = token ? '' : `?sessionId=${getSessionId()}`;

    yield call(axios.delete, `${API_URL}/api/cart/clear${sessionParam}`, config);
    yield put(clearCartSuccess());
  } catch (error) {
    yield put(clearCartFailure(error.response?.data?.message || 'Failed to clear cart'));
  }
}

function* mergeCartSaga(action) {
  try {
    const { sessionId } = action.payload;
    const config = { headers: getAuthHeader() };

    const response = yield call(axios.post, `${API_URL}/api/cart/merge`, { sessionId }, config);
    yield put(mergeCartSuccess(response.data.cart));
  } catch (error) {
    yield put(mergeCartFailure(error.response?.data?.message || 'Failed to merge cart'));
  }
}

export default function* cartSaga() {
  yield takeLatest(fetchCartRequest.type, fetchCartSaga);
  yield takeLatest(addToCartRequest.type, addToCartSaga);
  yield takeLatest(updateCartItemRequest.type, updateCartItemSaga);
  yield takeLatest(removeFromCartRequest.type, removeFromCartSaga);
  yield takeLatest(clearCartRequest.type, clearCartSaga);
  yield takeLatest(mergeCartRequest.type, mergeCartSaga);
}

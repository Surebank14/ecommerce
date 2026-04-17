import { all } from 'redux-saga/effects';
import authSaga from './authSaga';
import productSaga from './productSaga';
import cartSaga from './cartSaga';
import orderSaga from './orderSaga';
import walletSaga from './walletSaga';

export default function* rootSaga() {
  yield all([
    authSaga(),
    productSaga(),
    cartSaga(),
    orderSaga(),
    walletSaga(),
  ]);
}

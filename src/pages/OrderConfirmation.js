import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchOrderByNumberRequest,
  clearOrderState,
  payoffRemainingBalanceRequest,
  initializeOrderDepositRequest
} from '../redux/slices/orderSlice';
import { fetchWalletRequest } from '../redux/slices/walletSlice';
import { API_URL, getAuthHeader } from '../utils/api';
import { calculateCustomerSellingPrice, getProductDisplayPrice } from '../utils/pricing';

const getVariationLabel = (variation) => {
  if (!variation) return '';
  const optionValues = variation.optionValues && typeof variation.optionValues === 'object'
    ? Object.values(variation.optionValues).filter(Boolean)
    : [];
  return optionValues.length > 0 ? optionValues.join(' / ') : variation.name;
};

const formatVariationCurrency = (amount) => `₦${Number(amount || 0).toLocaleString()}`;

const MobileVariationDropdown = ({ value, options, onChange }) => {
  const [open, setOpen] = useState(false);
  const selectedVariation = (options || []).find((variation) => variation._id === value);

  return (
    <div className="relative sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm"
      >
        <span className={selectedVariation ? 'font-semibold text-gray-900' : 'text-gray-500'}>
          {selectedVariation
            ? `${getVariationLabel(selectedVariation)} - ${formatVariationCurrency(calculateCustomerSellingPrice(selectedVariation.price))}`
            : 'Select variation'}
        </span>
        <span className={`ml-3 text-xs transition-transform ${open ? 'rotate-180' : ''}`}>⌄</span>
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-[70] max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl">
          {(options || []).map((variation) => {
            const selected = variation._id === value;
            return (
              <button
                type="button"
                key={variation._id}
                onClick={() => {
                  onChange(variation._id);
                  setOpen(false);
                }}
                className={`block w-full border-b border-gray-100 px-4 py-3 text-left text-xs font-semibold last:border-b-0 ${
                  selected
                    ? 'bg-orange-50 text-orange-800'
                    : 'bg-white text-gray-700'
                }`}
              >
                {getVariationLabel(variation)} - {formatVariationCurrency(calculateCustomerSellingPrice(variation.price))}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const OrderConfirmation = () => {
  const dispatch = useDispatch();
  const { orderNumber } = useParams();
  const { currentOrder: order, loading, error, payoffLoading, payoffError, orderDepositLoading, orderDepositError } = useSelector((state) => state.orders);
  const { account } = useSelector((state) => state.wallet);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositError, setDepositError] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [products, setProducts] = useState([]);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [replaceItem, setReplaceItem] = useState(null);
  const [replacementProductId, setReplacementProductId] = useState('');
  const [replacementVariationId, setReplacementVariationId] = useState('');
  const [replaceError, setReplaceError] = useState('');
  const [replaceLoading, setReplaceLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchOrderByNumberRequest({ orderNumber }));
    dispatch(fetchWalletRequest());
    return () => {
      dispatch(clearOrderState());
    };
  }, [dispatch, orderNumber]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/products`);
        setProducts(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        setProducts([]);
      }
    };

    fetchProducts();
  }, []);

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      partially_paid: 'bg-orange-100 text-orange-800',
      completed: 'bg-emerald-200 text-emerald-900',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getScheduleStatusColor = (status) => {
    const colors = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
    };

    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Order not found</h2>
        <Link to="/orders" className="text-primary-600 hover:text-primary-700">
          View all orders
        </Link>
      </div>
    );
  }

  const payments = order.installmentPlan?.payments || [];
  const paidPayments = payments.filter((payment) => payment.status === 'paid');
  const totalPaid = Number(order.installmentPlan?.totalPaid || 0);
  const orderItemsPaidAmount = (order.items || []).reduce((sum, item) => sum + Number(item.paidAmount || 0), 0);
  const progressPercentage = Number(order.totalAmount || 0) > 0
    ? Math.min(100, Math.round((totalPaid / Number(order.totalAmount || 0)) * 100))
    : 0;
  const walletBalance = Number(account?.availableBalance || 0);
  const remainingBalance = Number(order.installmentPlan?.remainingBalance || 0);
  const creditBalance = Number(order.installmentPlan?.creditBalance || 0);
  const hasOutOfMarketItems = order.items?.some((item) => item.requiresReplacement);
  const canPayoffFromWallet = order.paymentType === 'installment'
    && remainingBalance > 0
    && walletBalance >= remainingBalance
    && !payoffLoading;

  const handlePayoffRemainingBalance = () => {
    dispatch(payoffRemainingBalanceRequest({ orderNumber }));
  };

  const handleDepositForOrder = () => {
    const amount = Number(depositAmount);
    setDepositError('');

    if (!Number.isFinite(amount) || amount <= 0) {
      setDepositError('Enter a valid amount');
      return;
    }
    if (amount > remainingBalance) {
      setDepositError(`Amount cannot exceed remaining balance of ₦${remainingBalance.toLocaleString()}`);
      return;
    }

    dispatch(initializeOrderDepositRequest({
      orderNumber,
      amount,
      customerEmail: order.customerEmail,
      onSuccess: (data) => {
        if (data?.authorization_url) {
          window.location.href = data.authorization_url;
        } else {
          setDepositError('Failed to get payment URL. Please try again.');
        }
      },
      onError: (message) => setDepositError(message)
    }));
  };

  const handleSubmitReview = async () => {
    if (!reviewText.trim()) {
      setReviewError('Please write your feedback');
      return;
    }

    setReviewSubmitting(true);
    setReviewError('');
    setReviewMessage('');

    try {
      await axios.post(
        `${API_URL}/api/product-reviews`,
        {
          orderNumber: order.orderNumber,
          rating: reviewRating,
          review: reviewText
        },
        { headers: getAuthHeader() }
      );
      setReviewText('');
      setReviewRating(5);
      setReviewMessage('Thanks for your feedback. It may appear after admin approval.');
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const isBackofficeSBAccount = order.isBackofficeSBAccount || order.source === 'backoffice_sb_account';
  const canReviewExperience = !isBackofficeSBAccount && ['paid', 'partial'].includes(order.paymentStatus);
  const canReplaceItems = order.paymentType === 'installment'
    && !isBackofficeSBAccount
    && (hasOutOfMarketItems || (order.paymentStatus !== 'paid' && remainingBalance > 0))
    && !['delivered', 'completed', 'shipped', 'cancelled'].includes(order.status);
  const isItemDelivered = (item) =>
    ['delivered', 'completed'].includes(item?.fulfillmentStatus);
  const canReplaceItem = (item) =>
    canReplaceItems && (
      item.requiresReplacement ||
      (order.paymentStatus !== 'paid' && remainingBalance > 0)
    );
  const selectedReplacementProduct = products.find((product) => product._id === replacementProductId);
  const activeReplacementVariations = selectedReplacementProduct?.hasVariations && Array.isArray(selectedReplacementProduct.variations)
    ? selectedReplacementProduct.variations.filter((variation) => variation.isActive !== false)
    : [];
  const selectedReplacementVariation = activeReplacementVariations.find(
    (variation) => variation._id === replacementVariationId
  );
  const replacementUnitPrice = selectedReplacementVariation
    ? calculateCustomerSellingPrice(selectedReplacementVariation.price)
    : getProductDisplayPrice(selectedReplacementProduct);
  const replacementSubtotal = replacementUnitPrice * Number(replaceItem?.quantity || 1);
  const replacementOrderTotal = replaceItem
    ? Number(order.totalAmount || 0) - Number(replaceItem.subtotal || 0) + replacementSubtotal
    : Number(order.totalAmount || 0);
  const replacePaidAmount = Number(replaceItem?.paidAmount || 0);
  const otherItemsPaidAmount = Math.max(0, orderItemsPaidAmount - replacePaidAmount);
  const walletAfterOldPaymentReversal = walletBalance + replacePaidAmount;
  const replacementWillBePaid = replacementSubtotal > 0 && walletAfterOldPaymentReversal >= replacementSubtotal;
  const replacementPaidAmount = replacementWillBePaid ? replacementSubtotal : 0;
  const replacementProjectedPaidAmount = otherItemsPaidAmount + replacementPaidAmount;
  const replacementRemainingBalance = Math.max(0, replacementOrderTotal - replacementProjectedPaidAmount);
  const projectedWalletBalance = replacementWillBePaid
    ? walletAfterOldPaymentReversal - replacementSubtotal
    : walletAfterOldPaymentReversal;

  const openReplaceModal = (item) => {
    setReplaceItem(item);
    setReplacementProductId('');
    setReplacementVariationId('');
    setReplaceError('');
    setShowReplaceModal(true);
  };

  const handleReplaceOrderItem = async () => {
    if (!replaceItem || !replacementProductId) {
      setReplaceError('Please select the product you want to change to');
      return;
    }

    if (activeReplacementVariations.length > 0 && !replacementVariationId) {
      setReplaceError('Please select a product variation');
      return;
    }

    setReplaceLoading(true);
    setReplaceError('');

    try {
      await axios.put(
        `${API_URL}/api/ecommerce/orders/number/${order.orderNumber}/items/${replaceItem._id}/replace`,
        {
          productId: replacementProductId,
          variationId: replacementVariationId
        },
        { headers: getAuthHeader() }
      );
      setShowReplaceModal(false);
      setReplaceItem(null);
      dispatch(fetchOrderByNumberRequest({ orderNumber }));
    } catch (err) {
      setReplaceError(err.response?.data?.message || 'Failed to change product');
    } finally {
      setReplaceLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Success Message */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">{isBackofficeSBAccount ? 'Order Details' : 'Order Placed Successfully!'}</h1>
        <p className="text-gray-600">Order Number: {order.orderNumber}</p>
      </div>

      {/* Order Details */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-4">
          <h2 className="text-lg font-semibold">Order Details</h2>
          <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
            {order.status.replace('_', ' ')}
          </span>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
            <span className="text-gray-600">Order Date</span>
            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
            <span className="text-gray-600">Payment Type</span>
            <span className="capitalize">{order.paymentType}</span>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
            <span className="text-gray-600">Payment Status</span>
            <span className={`capitalize font-medium ${order.paymentStatus === 'paid' ? 'text-green-600' : order.paymentStatus === 'partial' ? 'text-orange-600' : 'text-red-600'}`}>
              {order.paymentStatus}
            </span>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
            <span className="text-gray-600">Shipping Address</span>
            <span className="sm:text-right sm:max-w-xs break-words">{order.shippingAddress}</span>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Items Ordered</h2>
        {canReplaceItems && (
          <p className="mb-4 rounded-lg bg-orange-50 px-3 py-2 text-sm text-orange-700">
            You can change products while this pay-small-small order is still ongoing. The remaining balance will be recalculated after the change.
          </p>
        )}
        {hasOutOfMarketItems && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            One or more products in this order are out of market. Replace them with another product from SureBank stores before supply, delivery, or pickup.
          </p>
        )}
        <div className="space-y-4">
          {order.items?.map((item, index) => (
            <div key={index} className="flex flex-col gap-2 sm:flex-row sm:justify-between py-2 border-b last:border-b-0">
              <div>
                <p className="font-medium">{item.productName}</p>
                {item.requiresReplacement && (
                  <span className="mt-1 inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                    out of market, replace with another product
                  </span>
                )}
                {isItemDelivered(item) && (
                  <span className="mt-1 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                    delivered
                  </span>
                )}
                {(item.variationName || (item.selectedOptions && Object.keys(item.selectedOptions).length > 0)) && (
                  <p className="text-xs text-gray-500">
                    {[item.variationName, ...Object.entries(item.selectedOptions || {}).map(([name, value]) => `${name}: ${value}`)]
                      .filter(Boolean)
                      .join(' • ')}
                  </p>
                )}
                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                {canReplaceItem(item) && (
                  <button
                    type="button"
                    onClick={() => openReplaceModal(item)}
                    className="mt-3 inline-flex items-center rounded-full bg-orange-500 px-4 py-2 text-sm font-bold text-white shadow-md shadow-orange-100 transition hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                  >
                    {item.requiresReplacement ? 'Replace product' : 'Change product'}
                  </button>
                )}
              </div>
              <p className="font-medium">₦{item.subtotal?.toLocaleString()}</p>
            </div>
          ))}
        </div>
        <div className="border-t mt-4 pt-4">
          <div className="flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span>₦{order.totalAmount?.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {canReviewExperience && (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">How was your experience?</h2>
            <p className="text-sm text-gray-500">This is optional and helps us improve Sure-Bank Stores.</p>
          </div>
          <div className="mt-3 flex gap-1">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => setReviewRating(rating)}
                className={`text-2xl ${rating <= reviewRating ? 'text-orange-500' : 'text-gray-300'}`}
                aria-label={`${rating} star rating`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={reviewText}
            onChange={(event) => setReviewText(event.target.value)}
            rows={3}
            placeholder="Tell us about your payment and shopping experience"
            className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
          />
          {reviewError && <p className="mt-2 text-xs text-red-600">{reviewError}</p>}
          {reviewMessage && <p className="mt-2 text-xs text-green-600">{reviewMessage}</p>}
          <button
            type="button"
            onClick={handleSubmitReview}
            disabled={reviewSubmitting || !reviewText.trim()}
            className="mt-3 rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
          >
            {reviewSubmitting ? 'Submitting...' : 'Submit optional feedback'}
          </button>
        </div>
      )}

      {/* Installment Plan */}
      {order.paymentType === 'installment' && order.installmentPlan && (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold">Payment Plan</h2>
              <span className="text-sm text-gray-500">
                ₦{totalPaid.toLocaleString()} paid of ₦{order.totalAmount?.toLocaleString()}
              </span>
            </div>
            <div className="flex flex-col items-start md:items-end gap-2">
              <div className="text-sm text-gray-600">
                Wallet Balance: <span className={`font-semibold ${walletBalance >= remainingBalance ? 'text-green-600' : 'text-orange-600'}`}>
                  ₦{walletBalance.toLocaleString()}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowDepositModal(true)}
                disabled={remainingBalance <= 0 || orderDepositLoading}
                className="rounded-full bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
              >
                {orderDepositLoading ? 'Opening payment...' : 'Deposit for This Order'}
              </button>
              <button
                type="button"
                onClick={handlePayoffRemainingBalance}
                disabled={!canPayoffFromWallet}
                className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                {payoffLoading ? 'Processing payoff...' : 'Pay Off Remaining Balance'}
              </button>
            </div>
          </div>

          {payoffError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {payoffError}
            </div>
          )}

          {orderDepositError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {orderDepositError}
            </div>
          )}

          {hasOutOfMarketItems && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Payment can continue, but this order cannot be supplied until the out-of-market product is replaced.
            </div>
          )}

          {!payoffError && remainingBalance > 0 && walletBalance < remainingBalance && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Add more money to your wallet to pay off the remaining balance at once.
            </div>
          )}

          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Payment progress</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Total Paid</p>
              <p className="mt-1 text-lg font-semibold text-emerald-700">
                ₦{order.installmentPlan.totalPaid?.toLocaleString() || 0}
              </p>
            </div>
            <div className={`rounded-xl border p-4 ${creditBalance > 0 ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50'}`}>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                {creditBalance > 0 ? 'Credit Balance' : 'Remaining Balance'}
              </p>
              <p className={`mt-1 text-lg font-semibold ${creditBalance > 0 ? 'text-emerald-700' : 'text-orange-700'}`}>
                ₦{(creditBalance > 0 ? creditBalance : remainingBalance).toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Payments Made</p>
              <p className="mt-1 text-lg font-semibold">
                {paidPayments.length}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Collection Status</p>
              <p className="mt-1 text-lg font-semibold">
                {remainingBalance <= 0 ? 'Ready' : 'Paying'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-sm">
            <div>
              <span className="text-gray-600">Payment Type</span>
              <p className="font-medium">Flexible pay as you like</p>
            </div>
            <div>
              <span className="text-gray-600">Order Account</span>
              <p className="font-medium">{order.SBAccountNumber || 'N/A'}</p>
            </div>
            <div>
              <span className="text-gray-600">Minimum Subsequent Payment</span>
              <p className="font-medium">Any amount</p>
            </div>
            <div>
              <span className="text-gray-600">{creditBalance > 0 ? 'Credit Balance' : 'Remaining Balance'}</span>
              <p className={`font-medium ${creditBalance > 0 ? 'text-emerald-700' : ''}`}>
                ₦{(creditBalance > 0 ? creditBalance : remainingBalance).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Payment</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Paid On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-4 py-6 text-center text-sm text-gray-500">
                        No payment has been recorded for this order yet.
                      </td>
                    </tr>
                  )}
                  {payments.map((payment, index) => {
                    const isDebit = payment.type === 'debit' || ['Debit', 'Bought', 'Delivered', 'Purchased'].includes(payment.direction);
                    const debitLabel = ['Bought', 'Delivered'].includes(payment.direction) ? payment.direction : 'debit';
                    return (
                    <tr key={payment._id || `${payment.date}-${index}`}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {isDebit ? debitLabel : `Payment ${index + 1}`}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(payment.date).toLocaleDateString()}
                      </td>
                      <td className={`px-4 py-3 text-sm ${isDebit ? 'text-red-700' : 'text-gray-900'}`}>
                        {isDebit ? '-' : ''}₦{payment.amount?.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize ${isDebit ? 'bg-red-100 text-red-700' : getScheduleStatusColor(payment.status)}`}>
                          {isDebit ? debitLabel : payment.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : 'Not paid yet'}
                        {payment.transactionRef && (
                          <div className="mt-1 text-xs text-gray-500">
                            Ref: {payment.transactionRef}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-gray-100 p-4 rounded">
            <p className="text-sm text-gray-800">
              Your Order Account Number: <strong>{order.SBAccountNumber}</strong>
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Use the Deposit for This Order button to pay any amount. Each successful payment credits your wallet, moves the money to this order account, and reduces the remaining balance.
            </p>
          </div>
        </div>
      )}

      {showReplaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Change Product</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Choose another product for this ongoing pay-small-small order.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReplaceModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                ×
              </button>
            </div>

            {replaceItem && (
              <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm">
                <p className="text-gray-500">Changing</p>
                <p className="font-semibold text-gray-900">{replaceItem.productName}</p>
                <p className="text-gray-600">Current subtotal: ₦{Number(replaceItem.subtotal || 0).toLocaleString()}</p>
              </div>
            )}

            <label className="mb-1 block text-sm font-medium text-gray-700">New product</label>
            <select
              value={replacementProductId}
              onChange={(event) => {
                setReplacementProductId(event.target.value);
                setReplacementVariationId('');
                setReplaceError('');
              }}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product._id} value={product._id}>
                  {product.name} - ₦{getProductDisplayPrice(product).toLocaleString()}
                </option>
              ))}
            </select>

            {activeReplacementVariations.length > 0 && (
              <div className="mt-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">Variation</label>
                <MobileVariationDropdown
                  value={replacementVariationId}
                  options={activeReplacementVariations}
                  onChange={(variationId) => {
                    setReplacementVariationId(variationId);
                    setReplaceError('');
                  }}
                />
                <select
                  value={replacementVariationId}
                  onChange={(event) => {
                    setReplacementVariationId(event.target.value);
                    setReplaceError('');
                  }}
                  className="hidden w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 sm:block"
                >
                  <option value="">Select variation</option>
                  {activeReplacementVariations.map((variation) => (
                    <option key={variation._id} value={variation._id}>
                      {getVariationLabel(variation)} - {formatVariationCurrency(calculateCustomerSellingPrice(variation.price))}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {replacementProductId && (
              <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-gray-600">New order total</span>
                  <span className="font-semibold">₦{replacementOrderTotal.toLocaleString()}</span>
                </div>
                {replacePaidAmount > 0 && (
                  <div className="mt-2 flex justify-between gap-3">
                    <span className="text-gray-600">Old payment reversed</span>
                    <span className="font-semibold text-green-700">₦{replacePaidAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="mt-2 flex justify-between gap-3">
                  <span className="text-gray-600">New item payment</span>
                  <span className={`font-semibold ${replacementWillBePaid ? 'text-green-700' : 'text-gray-700'}`}>
                    {replacementWillBePaid ? `₦${replacementSubtotal.toLocaleString()}` : 'Waiting for payment'}
                  </span>
                </div>
                <div className="mt-2 flex justify-between gap-3">
                  <span className="text-gray-600">New remaining balance</span>
                  <span className="font-semibold text-orange-700">₦{replacementRemainingBalance.toLocaleString()}</span>
                </div>
                <div className="mt-2 flex justify-between gap-3">
                  <span className="text-gray-600">Wallet after change</span>
                  <span className="font-semibold text-purple-700">₦{projectedWalletBalance.toLocaleString()}</span>
                </div>
              </div>
            )}

            {replaceError && (
              <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {replaceError}
              </div>
            )}

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={handleReplaceOrderItem}
                disabled={replaceLoading}
                className="flex-1 rounded-full bg-orange-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
              >
                {replaceLoading ? 'Changing...' : 'Change Product'}
              </button>
              <button
                type="button"
                onClick={() => setShowReplaceModal(false)}
                className="rounded-full border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Deposit for This Order</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Enter any amount up to the remaining balance. Payment will be routed through your wallet into this order account.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDepositModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                ×
              </button>
            </div>

            <div className="mb-4 rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Remaining balance</span>
                <span className="font-bold text-orange-700">₦{remainingBalance.toLocaleString()}</span>
              </div>
            </div>

            <label className="mb-1 block text-sm font-medium text-gray-700">Amount</label>
            <input
              type="number"
              min="1"
              max={remainingBalance}
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="Enter amount to pay"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />

            {(depositError || orderDepositError) && (
              <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {depositError || orderDepositError}
              </div>
            )}

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={handleDepositForOrder}
                disabled={orderDepositLoading}
                className="flex-1 rounded-full bg-orange-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
              >
                {orderDepositLoading ? 'Processing...' : 'Pay Now'}
              </button>
              <button
                type="button"
                onClick={() => setShowDepositModal(false)}
                className="rounded-full border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link to="/orders" className="btn-secondary">
          View All Orders
        </Link>
        <Link to="/products" className="btn-primary">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};

export default OrderConfirmation;

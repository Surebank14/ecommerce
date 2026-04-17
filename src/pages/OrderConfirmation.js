import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrderByNumberRequest, clearOrderState, payoffRemainingBalanceRequest } from '../redux/slices/orderSlice';
import { fetchWalletRequest } from '../redux/slices/walletSlice';

const OrderConfirmation = () => {
  const dispatch = useDispatch();
  const { orderNumber } = useParams();
  const { currentOrder: order, loading, error, payoffLoading, payoffError } = useSelector((state) => state.orders);
  const { account } = useSelector((state) => state.wallet);

  useEffect(() => {
    dispatch(fetchOrderByNumberRequest({ orderNumber }));
    dispatch(fetchWalletRequest());
    return () => {
      dispatch(clearOrderState());
    };
  }, [dispatch, orderNumber]);

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      partially_paid: 'bg-orange-100 text-orange-800',
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
  const outstandingPayments = payments.filter((payment) => payment.status !== 'paid');
  const progressPercentage = payments.length > 0
    ? Math.round((paidPayments.length / payments.length) * 100)
    : 0;
  const walletBalance = Number(account?.availableBalance || 0);
  const remainingBalance = Number(order.installmentPlan?.remainingBalance || 0);
  const canPayoffFromWallet = order.paymentType === 'installment'
    && remainingBalance > 0
    && walletBalance >= remainingBalance
    && !payoffLoading;

  const handlePayoffRemainingBalance = () => {
    dispatch(payoffRemainingBalanceRequest({ orderNumber }));
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
        <h1 className="text-2xl font-bold mb-2">Order Placed Successfully!</h1>
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
        <div className="space-y-4">
          {order.items?.map((item, index) => (
            <div key={index} className="flex flex-col gap-2 sm:flex-row sm:justify-between py-2 border-b last:border-b-0">
              <div>
                <p className="font-medium">{item.productName}</p>
                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
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

      {/* Installment Plan */}
      {order.paymentType === 'installment' && order.installmentPlan && (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold">Payment Plan</h2>
              <span className="text-sm text-gray-500">
                {paidPayments.length} of {payments.length} payments completed
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

          {!payoffError && remainingBalance > 0 && walletBalance < remainingBalance && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Add more money to your wallet to pay off the remaining balance at once.
            </div>
          )}

          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Schedule progress</span>
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
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Remaining Balance</p>
              <p className="mt-1 text-lg font-semibold text-orange-700">
                ₦{order.installmentPlan.remainingBalance?.toLocaleString() || 0}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Amount per Payment</p>
              <p className="mt-1 text-lg font-semibold">
                ₦{order.installmentPlan.amountPerPeriod?.toLocaleString() || 0}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Next Due Date</p>
              <p className="mt-1 text-lg font-semibold">
                {order.installmentPlan.nextPaymentDate
                  ? new Date(order.installmentPlan.nextPaymentDate).toLocaleDateString()
                  : outstandingPayments[0]
                    ? new Date(outstandingPayments[0].date).toLocaleDateString()
                    : 'Completed'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-sm">
            <div>
              <span className="text-gray-600">Frequency</span>
              <p className="font-medium capitalize">{order.installmentPlan.frequency}</p>
            </div>
            <div>
              <span className="text-gray-600">Duration</span>
              <p className="font-medium">{order.installmentPlan.duration} payments</p>
            </div>
            <div>
              <span className="text-gray-600">Amount per Payment</span>
              <p className="font-medium">₦{order.installmentPlan.amountPerPeriod?.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-gray-600">Next Payment</span>
              <p className="font-medium">
                {order.installmentPlan.nextPaymentDate
                  ? new Date(order.installmentPlan.nextPaymentDate).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Payment</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Due Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Paid On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {payments.map((payment, index) => (
                    <tr key={payment._id || `${payment.date}-${index}`}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        Payment {index + 1}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(payment.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        ₦{payment.amount?.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize ${getScheduleStatusColor(payment.status)}`}>
                          {payment.status}
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-gray-100 p-4 rounded">
            <p className="text-sm text-gray-800">
              Your SB Account Number: <strong>{order.SBAccountNumber}</strong>
            </p>
            <p className="text-sm text-gray-600 mt-1">
              You can make payments at any SureBank branch using this account number. Each successful payment will update this schedule automatically and reduce your remaining balance.
            </p>
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

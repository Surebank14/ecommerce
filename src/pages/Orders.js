import React, { useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrdersRequest } from '../redux/slices/orderSlice';

const Orders = () => {
  const dispatch = useDispatch();
  const { orders, loading } = useSelector((state) => state.orders);
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchOrdersRequest());
    }
  }, [dispatch, isAuthenticated]);

  if (!isAuthenticated) {
    return <Navigate to="/login?redirect=orders" />;
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-gray-200 text-gray-800',
      paid: 'bg-green-100 text-green-800',
      partially_paid: 'bg-orange-100 text-orange-800',
      processing: 'bg-gray-200 text-gray-700',
      shipped: 'bg-gray-300 text-gray-800',
      delivered: 'bg-green-200 text-green-900',
      cancelled: 'bg-red-100 text-red-800',
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-lg mb-4">You haven't placed any orders yet</p>
          <Link to="/products" className="btn-primary">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-semibold text-lg">Order #{order.orderNumber}</h3>
                  <p className="text-sm text-gray-500">
                    Placed on {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="mt-2 md:mt-0 flex flex-wrap items-center gap-2 sm:gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                    {order.status.replace('_', ' ')}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                    order.paymentStatus === 'partial' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {order.paymentStatus}
                  </span>
                  <Link
                    to={`/order-confirmation/${order.orderNumber}`}
                    className={
                      order.paymentType === 'installment'
                        ? 'inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md transition hover:scale-[1.02] hover:shadow-lg sm:gap-2 sm:px-4 sm:py-2 sm:text-sm'
                        : 'text-primary-600 hover:text-primary-700 text-sm font-medium'
                    }
                  >
                    {order.paymentType === 'installment' ? 'make payment' : 'View Details'}
                  </Link>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex flex-wrap gap-4">
                  {order.items?.slice(0, 3).map((item, index) => (
                    <div key={index} className="text-sm">
                      <span className="text-gray-600">{item.productName}</span>
                      <span className="text-gray-400 ml-1">x{item.quantity}</span>
                    </div>
                  ))}
                  {order.items?.length > 3 && (
                    <span className="text-sm text-gray-500">
                      +{order.items.length - 3} more items
                    </span>
                  )}
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                  <div className="text-sm text-gray-600">
                    <span>
                      Payment: <span className="capitalize">{order.paymentType}</span>
                    </span>
                    {order.paymentType === 'installment' && (
                      <>
                        <span className="ml-2 text-gray-500">
                          (flexible payments)
                        </span>
                        <div className="mt-1 text-xs text-gray-500">
                          Paid: ₦{order.installmentPlan?.totalPaid?.toLocaleString() || 0} • Remaining: ₦{order.installmentPlan?.remainingBalance?.toLocaleString() || 0}
                        </div>
                      </>
                    )}
                  </div>
                  <span className="font-semibold">
                    Total: ₦{order.totalAmount?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;

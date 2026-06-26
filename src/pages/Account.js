import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, updateCustomerProfile } from '../redux/slices/authSlice';
import { API_URL, getAuthHeader } from '../utils/api';

const Account = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, customer, accountNumber, SBAccountNumber } = useSelector((state) => state.auth);
  const [email, setEmail] = useState(customer?.email || '');
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    setEmail(customer?.email || '');
  }, [customer?.email]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const handleSaveEmail = async (event) => {
    event.preventDefault();
    setEmailMessage('');
    setEmailError('');

    const nextEmail = email.trim().toLowerCase();
    if (nextEmail && !nextEmail.includes('@')) {
      setEmailError('Enter a valid email address');
      return;
    }

    setSavingEmail(true);
    try {
      const response = await axios.put(`${API_URL}/api/ecommerce/auth/profile`, {
        firstName: customer?.firstName || '',
        lastName: customer?.lastName || '',
        address: customer?.address || '',
        email: nextEmail,
      }, {
        headers: getAuthHeader(),
      });

      dispatch(updateCustomerProfile(response.data.customer));
      setEmailMessage('Email updated successfully');
    } catch (requestError) {
      setEmailError(requestError.response?.data?.message || 'Failed to update email');
    } finally {
      setSavingEmail(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">My Account</h1>
          <p className="mt-2 text-sm text-gray-600">
            Login or create an account to view your profile, order history, wallet, and saved account details.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              to="/login?redirect=account"
              className="inline-flex items-center justify-center rounded-lg bg-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
            >
              Login
            </Link>
            <Link
              to="/register?redirect=account"
              className="inline-flex items-center justify-center rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-700 transition hover:bg-orange-100"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const fullName = [customer?.firstName, customer?.lastName].filter(Boolean).join(' ') || 'Customer';

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Account</h1>
          <p className="mt-1 text-sm text-gray-600">Manage your profile and shopping activity.</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
        >
          Logout
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-[1.2fr,0.8fr]">
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
          <div className="mt-5 space-y-4 text-sm">
            <div>
              <p className="text-gray-500">Name</p>
              <p className="font-medium text-gray-900">{fullName}</p>
            </div>
            <div>
              <p className="text-gray-500">Phone</p>
              <p className="font-medium text-gray-900">{customer?.phone || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-gray-500">Email</p>
              <form onSubmit={handleSaveEmail} className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="customer@example.com"
                  className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  type="submit"
                  disabled={savingEmail}
                  className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
                >
                  {savingEmail ? 'Saving...' : 'Save'}
                </button>
              </form>
              {emailMessage && <p className="mt-2 text-xs text-green-600">{emailMessage}</p>}
              {emailError && <p className="mt-2 text-xs text-red-600">{emailError}</p>}
            </div>
            <div>
              <p className="text-gray-500">Address</p>
              <p className="font-medium text-gray-900">{customer?.address || 'Not provided'}</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          <div className="mt-5 space-y-3">
            <Link
              to="/orders"
              className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-800 transition hover:border-orange-200 hover:bg-orange-50"
            >
              <span>Order History</span>
              <span className="text-orange-600">View</span>
            </Link>
            <Link
              to="/wallet"
              className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-800 transition hover:border-orange-200 hover:bg-orange-50"
            >
              <span>Wallet</span>
              <span className="text-orange-600">Open</span>
            </Link>
          </div>

          <div className="mt-6 rounded-xl bg-gray-50 p-4 text-sm">
            <p className="text-gray-500">Wallet Account</p>
            <p className="mt-1 font-semibold text-gray-900">{accountNumber || customer?.phone || 'Not available'}</p>
            {SBAccountNumber && (
              <>
                <p className="mt-4 text-gray-500">SB Account</p>
                <p className="mt-1 font-semibold text-gray-900">{SBAccountNumber}</p>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Account;

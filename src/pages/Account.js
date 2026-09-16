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
  const [referralSummary, setReferralSummary] = useState(null);
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralTransferLoading, setReferralTransferLoading] = useState(false);
  const [referralTransferMessage, setReferralTransferMessage] = useState('');
  const [referralTransferError, setReferralTransferError] = useState('');
  const [loginBonusTransferLoading, setLoginBonusTransferLoading] = useState(false);
  const [loginBonusTransferMessage, setLoginBonusTransferMessage] = useState('');
  const [loginBonusTransferError, setLoginBonusTransferError] = useState('');
  const [transactionBonusTransferLoading, setTransactionBonusTransferLoading] = useState(false);
  const [transactionBonusTransferMessage, setTransactionBonusTransferMessage] = useState('');
  const [transactionBonusTransferError, setTransactionBonusTransferError] = useState('');
  const [referralCodeCopied, setReferralCodeCopied] = useState(false);

  useEffect(() => {
    setEmail(customer?.email || '');
  }, [customer?.email]);

  useEffect(() => {
    if (!isAuthenticated) {
      setReferralSummary(null);
      return;
    }

    setReferralLoading(true);
    axios.get(`${API_URL}/api/referrals/me`, {
      headers: getAuthHeader(),
    }).then((response) => {
      setReferralSummary(response.data);
    }).catch(() => {
      setReferralSummary(null);
    }).finally(() => {
      setReferralLoading(false);
    });
  }, [isAuthenticated]);

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

  const handleTransferReferralToWallet = async () => {
    setReferralTransferMessage('');
    setReferralTransferError('');

    const amount = Number(referralSummary?.referralIncentiveBalance || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      setReferralTransferError('No referral incentive balance available to transfer');
      return;
    }

    setReferralTransferLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/referrals/me/transfer-to-wallet`, {
        amount,
      }, {
        headers: getAuthHeader(),
      });

      setReferralSummary((currentSummary) => ({
        ...(currentSummary || {}),
        referralIncentiveBalance: response.data.referralIncentiveBalance,
        referralIncentiveTotalEarned: response.data.referralIncentiveTotalEarned,
      }));
      setReferralTransferMessage(
        `Transferred ₦${Number(response.data.transferredAmount || amount).toLocaleString()} to your wallet`
      );
    } catch (requestError) {
      setReferralTransferError(requestError.response?.data?.message || 'Failed to transfer referral incentive');
    } finally {
      setReferralTransferLoading(false);
    }
  };

  const handleTransferLoginBonusToWallet = async () => {
    setLoginBonusTransferMessage('');
    setLoginBonusTransferError('');

    const amount = Number(referralSummary?.loginBonusBalance || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      setLoginBonusTransferError('No login bonus balance available to transfer');
      return;
    }

    setLoginBonusTransferLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/referrals/me/login-bonus/transfer-to-wallet`, {
        amount,
      }, {
        headers: getAuthHeader(),
      });

      setReferralSummary((currentSummary) => ({
        ...(currentSummary || {}),
        loginBonusBalance: response.data.loginBonusBalance,
        loginBonusTotalEarned: response.data.loginBonusTotalEarned,
        loginBonusCredited: response.data.loginBonusCredited,
        loginBonusCreditedAt: response.data.loginBonusCreditedAt,
        loginBonusTransferredAt: response.data.loginBonusTransferredAt,
      }));
      setLoginBonusTransferMessage(
        `Transferred ₦${Number(response.data.transferredAmount || amount).toLocaleString()} to your wallet`
      );
    } catch (requestError) {
      setLoginBonusTransferError(requestError.response?.data?.message || 'Failed to transfer login bonus');
    } finally {
      setLoginBonusTransferLoading(false);
    }
  };

  const handleTransferTransactionBonusToWallet = async () => {
    setTransactionBonusTransferMessage('');
    setTransactionBonusTransferError('');

    const amount = Number(referralSummary?.transactionBonusBalance || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      setTransactionBonusTransferError('No transaction bonus balance available to transfer');
      return;
    }

    setTransactionBonusTransferLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/referrals/me/transaction-bonus/transfer-to-wallet`, {
        amount,
      }, {
        headers: getAuthHeader(),
      });

      setReferralSummary((currentSummary) => ({
        ...(currentSummary || {}),
        transactionBonusBalance: response.data.transactionBonusBalance,
        transactionBonusTotalEarned: response.data.transactionBonusTotalEarned,
        transactionBonusLastCreditedAt: response.data.transactionBonusLastCreditedAt,
        transactionBonusTransferredAt: response.data.transactionBonusTransferredAt,
      }));
      setTransactionBonusTransferMessage(
        `Transferred ₦${Number(response.data.transferredAmount || amount).toLocaleString()} to your order wallet`
      );
    } catch (requestError) {
      setTransactionBonusTransferError(requestError.response?.data?.message || 'Failed to transfer transaction bonus');
    } finally {
      setTransactionBonusTransferLoading(false);
    }
  };

  const referralCode = referralSummary?.referralCode || customer?.phone || '';
  const handleCopyReferralCode = async () => {
    if (!referralCode) return;

    try {
      await navigator.clipboard.writeText(referralCode);
      setReferralCodeCopied(true);
      setTimeout(() => setReferralCodeCopied(false), 1800);
    } catch (error) {
      setReferralCodeCopied(false);
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
  const loginBonusBalance = Number(referralSummary?.loginBonusBalance || 0);
  const transactionBonusBalance = Number(referralSummary?.transactionBonusBalance || 0);
  const loginBonusTransferred = Boolean(referralSummary?.loginBonusTransferredAt) && loginBonusBalance <= 0;
  const formatDisplayDate = (dateValue) => dateValue
    ? new Date(dateValue).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    : 'Not available';

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

        <section className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-orange-50 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Referral Incentive</h2>
          <p className="mt-1 text-sm text-gray-600">Your referral code is your phone number.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase text-gray-500">Available Balance</p>
              <p className="mt-1 text-2xl font-black text-emerald-700">
                ₦{Number(referralSummary?.referralIncentiveBalance || 0).toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase text-gray-500">Referral Code</p>
              <div className="mt-1 flex min-w-0 items-center justify-between gap-2 sm:block">
                <p className="min-w-0 whitespace-nowrap text-[11px] font-black leading-tight text-gray-900 sm:text-sm">
                  {referralLoading ? 'Loading...' : referralCode || 'Not available'}
                </p>
                <button
                  type="button"
                  onClick={handleCopyReferralCode}
                  disabled={referralLoading || !referralCode}
                  title="Copy referral code"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 sm:mt-2 sm:ml-auto"
                >
                  <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="9" y="9" width="11" height="11" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
              </div>
              {referralCodeCopied && <p className="mt-1 text-xs font-semibold text-emerald-700">Copied</p>}
            </div>
          </div>
          <div className="mt-4 rounded-xl bg-white/70 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">People referred directly</span>
              <span className="font-bold text-gray-900">{Number(referralSummary?.referralCount || 0).toLocaleString()}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-gray-600">Total earned</span>
              <span className="font-bold text-gray-900">₦{Number(referralSummary?.referralIncentiveTotalEarned || 0).toLocaleString()}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleTransferReferralToWallet}
            disabled={referralTransferLoading || Number(referralSummary?.referralIncentiveBalance || 0) <= 0}
            className="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            {referralTransferLoading ? 'Transferring...' : 'Transfer to Wallet'}
          </button>
          {referralTransferMessage && <p className="mt-2 text-xs font-medium text-emerald-700">{referralTransferMessage}</p>}
          {referralTransferError && <p className="mt-2 text-xs font-medium text-red-600">{referralTransferError}</p>}

          {loginBonusTransferred ? (
            <div className="mt-5 overflow-hidden rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-500 via-teal-500 to-orange-400 p-[1px] shadow-sm">
              <div className="rounded-xl bg-white/95 px-4 py-3">
                <p className="text-sm font-bold leading-6 text-slate-900">
                  Login bonus of ₦{Number(referralSummary?.loginBonusTotalEarned || 0).toLocaleString()} has been transferred to order wallet on {formatDisplayDate(referralSummary.loginBonusTransferredAt)}.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-5 rounded-xl bg-white/80 p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-gray-700">Login Bonus Balance</span>
                  <span className="font-black text-emerald-700">₦{loginBonusBalance.toLocaleString()}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-gray-600">Total login bonus earned</span>
                  <span className="font-bold text-gray-900">₦{Number(referralSummary?.loginBonusTotalEarned || 0).toLocaleString()}</span>
                </div>
                {referralSummary?.loginBonusCreditedAt && (
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-gray-600">Credited</span>
                    <span className="font-bold text-gray-900">{formatDisplayDate(referralSummary.loginBonusCreditedAt)}</span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleTransferLoginBonusToWallet}
                disabled={loginBonusTransferLoading || loginBonusBalance <= 0}
                className="mt-3 w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {loginBonusTransferLoading ? 'Transferring...' : 'Transfer Login Bonus to Wallet'}
              </button>
            </>
          )}
          {loginBonusTransferMessage && <p className="mt-2 text-xs font-medium text-emerald-700">{loginBonusTransferMessage}</p>}
          {loginBonusTransferError && <p className="mt-2 text-xs font-medium text-red-600">{loginBonusTransferError}</p>}

          <div className="mt-5 rounded-xl bg-white/80 p-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-gray-700">Transaction Bonus Balance</span>
              <span className="font-black text-orange-600">₦{transactionBonusBalance.toLocaleString()}</span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-gray-600">Total transaction bonus earned</span>
              <span className="font-bold text-gray-900">₦{Number(referralSummary?.transactionBonusTotalEarned || 0).toLocaleString()}</span>
            </div>
            {referralSummary?.transactionBonusLastCreditedAt && (
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-gray-600">Last credited</span>
                <span className="font-bold text-gray-900">{formatDisplayDate(referralSummary.transactionBonusLastCreditedAt)}</span>
              </div>
            )}
            {referralSummary?.transactionBonusTransferredAt && (
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-gray-600">Last transferred</span>
                <span className="font-bold text-gray-900">{formatDisplayDate(referralSummary.transactionBonusTransferredAt)}</span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleTransferTransactionBonusToWallet}
            disabled={transactionBonusTransferLoading || transactionBonusBalance <= 0}
            className="mt-3 w-full rounded-lg bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
          >
            {transactionBonusTransferLoading ? 'Transferring...' : 'Transfer Transaction Bonus to Wallet'}
          </button>
          {transactionBonusTransferMessage && <p className="mt-2 text-xs font-medium text-emerald-700">{transactionBonusTransferMessage}</p>}
          {transactionBonusTransferError && <p className="mt-2 text-xs font-medium text-red-600">{transactionBonusTransferError}</p>}
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

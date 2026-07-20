import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  clearWalletMessages,
  fetchWalletRequest,
  initializeWalletFundingRequest,
} from '../redux/slices/walletSlice';
import { API_URL, getAuthHeader } from '../utils/api';
import { calculatePaystackPayableForNetAmount } from '../utils/paystackFee';

const formatCurrency = (amount) => `N${Number(amount || 0).toLocaleString()}`;
const isDebitLike = (transaction) => ['Debit', 'Charge'].includes(transaction?.direction);
const clampPercent = (value) => Math.min(100, Math.max(0, Number(value || 0)));
const dsPackageOptions = ['Rent', 'School fees', 'Food'];

const getRequestStatusClass = (status = '') => {
  const normalizedStatus = String(status).toLowerCase();

  if (normalizedStatus === 'completed') return 'bg-emerald-100 text-emerald-700';
  if (normalizedStatus === 'processing') return 'bg-amber-100 text-amber-800';
  return 'bg-orange-100 text-orange-700';
};

const StatusPill = ({ transaction }) => {
  const debit = isDebitLike(transaction);

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${
      debit ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
    }`}>
      {transaction.direction || 'N/A'}
    </span>
  );
};

const MyDS = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const {
    customer,
    mainAccount,
    dsAccounts,
    dsTransactions,
    loading,
    error,
    fundingLoading,
    fundingError,
  } = useSelector((state) => state.wallet);
  const [selectedDSAccountId, setSelectedDSAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [formError, setFormError] = useState('');
  const [flashMessage, setFlashMessage] = useState(location.state?.message || '');
  const [isPackageDropdownOpen, setIsPackageDropdownOpen] = useState(false);
  const [newPackageType, setNewPackageType] = useState('');
  const [newPackageAmount, setNewPackageAmount] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [showCreatePackageModal, setShowCreatePackageModal] = useState(false);
  const [isCreatePackageDropdownOpen, setIsCreatePackageDropdownOpen] = useState(false);
  const [showDSTransactionModal, setShowDSTransactionModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestAmount, setRequestAmount] = useState('');
  const [settlementBankName, setSettlementBankName] = useState('');
  const [settlementAccountName, setSettlementAccountName] = useState('');
  const [settlementBankAccountNumber, setSettlementBankAccountNumber] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [requestStatusLoading, setRequestStatusLoading] = useState(false);
  const packageDropdownRef = useRef(null);
  const createPackageDropdownRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchWalletRequest());
    }

    return () => {
      dispatch(clearWalletMessages());
    };
  }, [dispatch, isAuthenticated]);

  const fetchWithdrawalRequests = useCallback(async () => {
    if (!customer?.id) return;

    setRequestStatusLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/api/customerwithdrawalrequest/customer/${customer.id}`,
        { headers: getAuthHeader() }
      );
      setWithdrawalRequests(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setWithdrawalRequests([]);
    } finally {
      setRequestStatusLoading(false);
    }
  }, [customer?.id]);

  useEffect(() => {
    if (isAuthenticated && customer?.id) {
      fetchWithdrawalRequests();
    }
  }, [fetchWithdrawalRequests, isAuthenticated, customer?.id]);

  useEffect(() => {
    if (!selectedDSAccountId && dsAccounts?.length > 0) {
      setSelectedDSAccountId(dsAccounts[0]._id);
    }
  }, [dsAccounts, selectedDSAccountId]);

  useEffect(() => {
    if (!location.state?.message) return undefined;

    setFlashMessage(location.state.message);
    navigate(location.pathname, { replace: true, state: {} });

    const timeoutId = window.setTimeout(() => {
      setFlashMessage('');
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (packageDropdownRef.current && !packageDropdownRef.current.contains(event.target)) {
        setIsPackageDropdownOpen(false);
      }

      if (createPackageDropdownRef.current && !createPackageDropdownRef.current.contains(event.target)) {
        setIsCreatePackageDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedDSAccount = useMemo(
    () => (dsAccounts || []).find((dsAccount) => dsAccount._id === selectedDSAccountId) || null,
    [dsAccounts, selectedDSAccountId]
  );

  const filteredTransactions = useMemo(() => {
    if (!selectedDSAccount) return dsTransactions || [];
    return (dsTransactions || []).filter((transaction) => (
      transaction.accountTypeId === selectedDSAccount._id
    ));
  }, [dsTransactions, selectedDSAccount]);

  const targetDays = 31;
  const daysPaid = Number(selectedDSAccount?.totalCount || 0);
  const progressPercent = clampPercent((daysPaid / targetDays) * 100);
  const freeToWithdrawBalance = Number(mainAccount?.availableBalance || 0);
  const dsPaystackCharge = useMemo(
    () => calculatePaystackPayableForNetAmount(amount),
    [amount]
  );
  const hasSettlementBankDetails = Boolean(
    customer?.settlementBankDetails?.bankName
    && customer?.settlementBankDetails?.accountName
    && customer?.settlementBankDetails?.bankAccountNumber
  );
  const latestWithdrawalRequest = withdrawalRequests.find((request) => (
    String(request?.status || '').toLowerCase() !== 'completed'
  )) || null;

  const handleDeposit = (event) => {
    event.preventDefault();
    setFormError('');

    if (!selectedDSAccount) {
      setFormError('Select a DS package to fund.');
      return;
    }

    const paymentAmount = Number(amount);
    const packageAmount = Number(selectedDSAccount.amountPerDay || 0);

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      setFormError('Enter a valid amount.');
      return;
    }

    if (paymentAmount < packageAmount) {
      setFormError(`Amount cannot be less than ${formatCurrency(packageAmount)}.`);
      return;
    }

    if (packageAmount > 0 && paymentAmount % packageAmount !== 0) {
      setFormError(`Amount must be a multiple of ${formatCurrency(packageAmount)}.`);
      return;
    }

    dispatch(initializeWalletFundingRequest({
      fundingData: {
        fundingType: 'ds_package',
        dsAccountId: selectedDSAccount._id,
        amount,
        callbackUrl: `${window.location.origin}/payment/wallet/verify?funding=ds`,
      },
      onSuccess: (data) => {
        window.location.href = data.authorization_url;
      },
      onError: (message) => setFormError(message),
    }));
  };

  const handleCreateDSPackage = async (event) => {
    event.preventDefault();
    setCreateError('');
    setFormError('');
    setFlashMessage('');

    const amountPerDay = Number(newPackageAmount);

    if (!newPackageType) {
      setCreateError('Select a DS package type.');
      return;
    }

    if (!Number.isFinite(amountPerDay) || amountPerDay <= 0) {
      setCreateError('Enter a valid daily deposit amount.');
      return;
    }

    if (!hasSettlementBankDetails && (!settlementBankName.trim() || !settlementAccountName.trim() || !settlementBankAccountNumber.trim())) {
      setCreateError('Enter your settlement bank name, account name and account number.');
      return;
    }

    setCreateLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/api/ecommerce/auth/wallet/ds-package`,
        {
          accountType: newPackageType,
          amountPerDay,
          bankName: settlementBankName.trim(),
          accountName: settlementAccountName.trim(),
          bankAccountNumber: settlementBankAccountNumber.trim(),
        },
        { headers: getAuthHeader() }
      );

      setNewPackageType('');
      setNewPackageAmount('');
      setSettlementBankName('');
      setSettlementAccountName('');
      setSettlementBankAccountNumber('');
      setShowCreatePackageModal(false);
      setFlashMessage(response.data?.message || 'DS package created successfully.');
      dispatch(fetchWalletRequest());
    } catch (error) {
      setCreateError(error.response?.data?.message || 'Failed to create DS package.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleFreeToWithdrawRequest = async (event) => {
    event.preventDefault();
    setRequestError('');
    setFormError('');
    setFlashMessage('');

    const amountValue = Number(requestAmount);

    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setRequestError('Enter a valid request amount.');
      return;
    }

    if (amountValue > freeToWithdrawBalance) {
      setRequestError(`Amount cannot be more than ${formatCurrency(freeToWithdrawBalance)}.`);
      return;
    }

    if (!hasSettlementBankDetails && (!settlementBankName.trim() || !settlementAccountName.trim() || !settlementBankAccountNumber.trim())) {
      setRequestError('Enter your settlement bank name, account name and account number.');
      return;
    }

    setRequestLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/api/ecommerce/auth/wallet/free-to-withdraw/request`,
        {
          amount: amountValue,
          bankName: settlementBankName.trim(),
          accountName: settlementAccountName.trim(),
          bankAccountNumber: settlementBankAccountNumber.trim(),
        },
        { headers: getAuthHeader() }
      );

      setRequestAmount('');
      setSettlementBankName('');
      setSettlementAccountName('');
      setSettlementBankAccountNumber('');
      setShowRequestModal(false);
      setFlashMessage(response.data?.message || 'Withdrawal request sent successfully.');
      dispatch(fetchWalletRequest());
      fetchWithdrawalRequests();
    } catch (error) {
      setRequestError(error.response?.data?.message || 'Failed to send request.');
    } finally {
      setRequestLoading(false);
    }
  };

  const settlementBankFields = (
    <div className="rounded-2xl border border-orange-200 bg-white/85 p-3 md:col-span-3">
      <p className="mb-2 text-xs font-black uppercase text-orange-700">Settlement bank details</p>
      <div className="grid gap-2 sm:grid-cols-3">
        <input
          type="text"
          value={settlementBankName}
          onChange={(event) => setSettlementBankName(event.target.value)}
          placeholder="Bank name"
          className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          required={!hasSettlementBankDetails}
        />
        <input
          type="text"
          value={settlementAccountName}
          onChange={(event) => setSettlementAccountName(event.target.value)}
          placeholder="Account name"
          className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          required={!hasSettlementBankDetails}
        />
        <input
          type="text"
          value={settlementBankAccountNumber}
          onChange={(event) => setSettlementBankAccountNumber(event.target.value)}
          placeholder="Account number"
          className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          required={!hasSettlementBankDetails}
        />
      </div>
    </div>
  );

  const createDSPackageForm = (
    <form className="mt-4 grid gap-3 md:grid-cols-[1fr,1fr,auto]" onSubmit={handleCreateDSPackage}>
      <div ref={createPackageDropdownRef} className="relative">
        <label className="mb-1.5 block text-xs font-bold text-slate-700">
          Package type
        </label>
        <button
          type="button"
          onClick={() => setIsCreatePackageDropdownOpen((open) => !open)}
          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-orange-200 bg-white px-3 py-2.5 text-left text-sm font-bold text-slate-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
        >
          <span className={newPackageType ? 'text-slate-950' : 'text-slate-400'}>
            {newPackageType || 'Select package'}
          </span>
          <svg
            className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${isCreatePackageDropdownOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 9-7 7-7-7" />
          </svg>
        </button>
        {isCreatePackageDropdownOpen && (
          <div className="absolute left-0 right-0 top-full z-[80] mt-2 overflow-hidden rounded-2xl border border-orange-100 bg-white p-1.5 shadow-xl">
            {dsPackageOptions.map((option) => {
              const active = option === newPackageType;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setNewPackageType(option);
                    setIsCreatePackageDropdownOpen(false);
                  }}
                  className={`block w-full rounded-xl px-3 py-2.5 text-left text-sm font-black transition ${
                    active ? 'bg-orange-50 text-orange-700' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="new-ds-package-amount" className="mb-1.5 block text-xs font-bold text-slate-700">
          Daily deposit
        </label>
        <input
          id="new-ds-package-amount"
          type="number"
          min="1"
          step="1"
          value={newPackageAmount}
          onChange={(event) => setNewPackageAmount(event.target.value)}
          placeholder="Enter amount"
          className="w-full rounded-2xl border border-orange-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          required
        />
      </div>

      {!hasSettlementBankDetails && settlementBankFields}

      <button
        type="submit"
        disabled={createLoading}
        className="self-end rounded-2xl bg-orange-500 px-5 py-2.5 text-sm font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
      >
        {createLoading ? 'Creating...' : 'Create'}
      </button>
    </form>
  );

  const createDSPackageCard = (
    <section className="hidden min-w-0 rounded-2xl border border-orange-100 bg-orange-50 p-3 shadow-sm sm:block sm:rounded-3xl sm:p-5">
      <div className="hidden flex-col gap-1 sm:flex sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase text-orange-700">Create package</p>
          <h2 className="text-base font-black text-slate-950 sm:text-lg">Open a DS Account Package</h2>
          <p className="mt-1 text-xs leading-5 text-slate-600 sm:text-sm">
            Choose the package type and daily amount. Existing DS account rules still apply.
          </p>
        </div>
      </div>

      {createError && (
        <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
          {createError}
        </div>
      )}

      <div>
        {createDSPackageForm}
      </div>
    </section>
  );

  const dsTransactionHistoryContent = filteredTransactions.length === 0 ? (
    <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
      No DS transactions found for this package.
    </div>
  ) : (
    <div className="w-full overflow-x-auto rounded-2xl border border-slate-100">
      <table className="min-w-[680px] divide-y divide-slate-200 text-xs sm:min-w-[820px] sm:text-sm">
        <thead>
          <tr className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
            <th className="px-3 py-3.5">Date</th>
            <th className="px-3 py-3">DS Account</th>
            <th className="px-3 py-3">Narration</th>
            <th className="px-3 py-3">Type</th>
            <th className="px-3 py-3">Amount</th>
            <th className="px-3 py-3">Balance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {filteredTransactions.map((transaction) => (
            <tr key={transaction._id} className="text-slate-700 hover:bg-slate-50">
              <td className="whitespace-nowrap px-3 py-4 text-xs font-semibold text-slate-500">{transaction.date}</td>
              <td className="whitespace-nowrap px-3 py-4">
                <span className="font-bold text-slate-950">{transaction.DSAccountNumber || 'N/A'}</span>
                <span className="ml-1 text-xs text-slate-400">{transaction.accountType || ''}</span>
              </td>
              <td className="min-w-[180px] px-3 py-4 sm:min-w-[240px]">{transaction.narration}</td>
              <td className="whitespace-nowrap px-3 py-4">
                <StatusPill transaction={transaction} />
              </td>
              <td className={`whitespace-nowrap px-3 py-4 font-bold ${
                isDebitLike(transaction) ? 'text-red-600' : 'text-green-600'
              }`}>
                {isDebitLike(transaction) ? '-' : '+'}{formatCurrency(transaction.amount)}
              </td>
              <td className="whitespace-nowrap px-3 py-4 font-semibold">{formatCurrency(transaction.balance)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (!isAuthenticated) {
    return <Navigate to="/login?redirect=my-ds" replace />;
  }

  return (
    <div className="mx-auto w-full max-w-7xl overflow-x-hidden px-2.5 py-3 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-3 overflow-hidden rounded-2xl bg-slate-950 text-white shadow-sm sm:mb-6 sm:rounded-3xl">
        <div className="relative p-4 sm:p-7">
          <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-orange-500/20 sm:h-32 sm:w-32" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase text-orange-300">Daily savings</p>
              <h1 className="mt-1 text-xl font-black tracking-normal sm:text-3xl">My DS</h1>
              <p className="mt-1 max-w-xl text-xs text-purple-100 sm:text-base">
                Deposit into your DS package and keep track of every contribution.
              </p>
            </div>
            <div className="grid min-w-0 gap-2 sm:min-w-[360px]">
              <div className="grid min-w-0 grid-cols-2 gap-2">
                <div className="min-w-0 rounded-2xl bg-emerald-600 px-3 py-2 text-xs shadow-sm ring-1 ring-emerald-300/30 sm:px-4 sm:py-3 sm:text-sm">
                  <p className="truncate text-emerald-50">Available balance</p>
                  <p className="mt-0.5 truncate font-black text-white">{formatCurrency(freeToWithdrawBalance)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRequestError('');
                    setShowRequestModal(true);
                  }}
                  className="min-w-0 rounded-2xl bg-sky-600 px-3 py-2 text-left text-xs font-black text-white shadow-sm ring-1 ring-sky-300/30 sm:px-4 sm:py-3 sm:text-sm"
                >
                  <span className="block truncate text-sky-50">Withdrawal</span>
                  <span className="mt-0.5 block truncate text-white">Make Request</span>
                </button>
              </div>
              <div className={`grid min-w-0 gap-2 ${selectedDSAccount ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {selectedDSAccount && (
                  <div className="min-w-0 rounded-2xl bg-purple-700 px-3 py-2 text-xs backdrop-blur sm:px-4 sm:py-3 sm:text-sm">
                    <p className="text-purple-100">Active package</p>
                    <p className="mt-0.5 truncate font-black text-white">{selectedDSAccount.DSAccountNumber}</p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setCreateError('');
                    setShowCreatePackageModal(true);
                  }}
                  className="min-w-0 rounded-2xl bg-orange-600 px-3 py-2 text-center text-xs font-black text-white shadow-sm ring-1 ring-orange-300/40 sm:hidden"
                >
                  Create New Package
                </button>
              </div>
              <div className="min-w-0 rounded-2xl bg-white/10 px-3 py-2 text-xs ring-1 ring-white/10 sm:px-4 sm:py-3 sm:text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-bold text-purple-100">Request status</p>
                  {requestStatusLoading ? (
                    <span className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : latestWithdrawalRequest ? (
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${getRequestStatusClass(latestWithdrawalRequest.status)}`}>
                      {latestWithdrawalRequest.status || 'Pending'}
                    </span>
                  ) : null}
                </div>
                {latestWithdrawalRequest ? (
                  <div className="mt-1 flex items-center justify-between gap-2 text-white">
                    <span className="truncate font-black">{formatCurrency(latestWithdrawalRequest.amount)}</span>
                    <span className="shrink-0 text-[10px] font-semibold text-purple-100">
                      {latestWithdrawalRequest.createdAt
                        ? new Date(latestWithdrawalRequest.createdAt).toLocaleDateString()
                        : 'N/A'}
                    </span>
                  </div>
                ) : (
                  <p className="mt-1 truncate font-semibold text-purple-100">No request yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {(flashMessage || error || fundingError || formError) && (
        <div className={`mb-4 rounded-2xl border px-4 py-3 text-sm font-semibold ${
          flashMessage
            ? 'border-green-200 bg-green-50 text-green-700'
            : 'border-red-200 bg-red-50 text-red-700'
        }`}>
          {flashMessage || error || fundingError || formError}
        </div>
      )}

      {loading ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-4 py-12 text-center text-slate-500 shadow-sm">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />
          <p className="font-semibold">Loading DS accounts...</p>
        </div>
      ) : dsAccounts.length === 0 ? (
        <div className="mx-auto w-full max-w-[344px] space-y-3 sm:max-w-none sm:space-y-5">
          {createDSPackageCard}
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-orange-600">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
              </svg>
            </div>
            <p className="font-bold text-slate-900">No DS package found.</p>
            <p className="mt-1 text-sm text-slate-500">Create a DS package to start your daily savings.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-5">
          {createDSPackageCard}
          <section className="min-w-0 rounded-2xl border border-slate-100 bg-white p-2.5 shadow-sm sm:rounded-3xl sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-base font-black text-slate-950 sm:text-lg">Your DS Packages</h2>
              <button
                type="button"
                onClick={() => dispatch(fetchWalletRequest())}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Refresh
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:-mx-2 sm:flex sm:max-w-full sm:gap-3 sm:overflow-x-auto sm:px-2 sm:pb-1">
              {dsAccounts.map((dsAccount, index) => {
                const active = dsAccount._id === selectedDSAccountId;
                const shouldSpanMobileRow = dsAccounts.length % 2 === 1 && index === dsAccounts.length - 1;

                return (
                  <button
                    key={dsAccount._id}
                    type="button"
                    onClick={() => setSelectedDSAccountId(dsAccount._id)}
                    className={`min-w-0 rounded-2xl border p-3 text-left transition sm:min-w-[220px] sm:max-w-[220px] sm:p-4 ${
                      shouldSpanMobileRow ? 'col-span-2 sm:col-span-1' : ''
                    } ${
                      active
                        ? 'border-purple-700 bg-purple-700 text-white shadow-sm'
                        : 'border-sky-600 bg-sky-600 text-white shadow-sm hover:border-sky-700 hover:bg-sky-700'
                    }`}
                  >
                    <p className={`truncate text-[11px] font-bold uppercase sm:text-xs ${active ? 'text-purple-100' : 'text-sky-50'}`}>
                      {dsAccount.accountType}
                    </p>
                    <p className="mt-1 truncate text-sm font-black text-white sm:text-lg">{dsAccount.DSAccountNumber}</p>
                    <p className={`mt-2 truncate text-xs font-semibold sm:text-sm ${active ? 'text-purple-100' : 'text-sky-50'}`}>
                      {formatCurrency(dsAccount.amountPerDay)} daily
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          {selectedDSAccount && (
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:justify-center sm:gap-3">
              <section className="min-w-0 rounded-2xl border border-purple-700 bg-purple-700 p-3 shadow-sm sm:min-w-[220px] sm:max-w-[220px] sm:p-4">
                <p className="truncate text-[10px] font-bold uppercase text-purple-100 sm:text-xs">Selected DS balance</p>
                <div className="mt-1 flex flex-col gap-1">
                  <p className="truncate text-base font-black text-white sm:text-lg">
                    {formatCurrency(selectedDSAccount.totalContribution)}
                  </p>
                  <p className="truncate text-[10px] font-semibold text-purple-100 sm:text-xs">
                    {selectedDSAccount.DSAccountNumber} | {selectedDSAccount.accountType}
                  </p>
                </div>
              </section>

              <button
                type="button"
                onClick={() => {
                  dispatch(fetchWalletRequest());
                  setShowDSTransactionModal(true);
                }}
                className="min-w-0 rounded-2xl border border-sky-600 bg-sky-600 p-3 text-left shadow-sm sm:hidden"
              >
                <p className="text-[10px] font-bold uppercase text-sky-50">DS Transaction</p>
                <p className="mt-1 text-base font-black text-white">History</p>
                <p className="mt-1 text-[10px] font-semibold text-sky-50">
                  {filteredTransactions.length.toLocaleString()} record{filteredTransactions.length === 1 ? '' : 's'}
                </p>
              </button>
            </div>
          )}

          <div className="grid min-w-0 gap-3 lg:grid-cols-[0.85fr,1.35fr] lg:gap-5">
          <div className="min-w-0 space-y-3 sm:space-y-5">
          <section className="min-w-0 rounded-2xl border border-emerald-700 bg-emerald-700 p-2.5 text-white shadow-sm sm:rounded-3xl sm:p-4">
            <div className="flex items-start gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white sm:h-9 sm:w-9 sm:rounded-2xl">
                <span className="text-sm font-black leading-none sm:text-lg">N</span>
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-black text-white sm:text-lg">Deposit to DS Package</h2>
                <p className="text-[11px] text-emerald-50 sm:mt-0.5 sm:text-sm">Pay securely with Paystack.</p>
              </div>
            </div>

            <form className="mt-2 space-y-2.5 sm:mt-3 sm:space-y-3" onSubmit={handleDeposit}>
              <div ref={packageDropdownRef} className="relative">
                <label id="ds-package-label" className="mb-1 block text-xs font-bold text-emerald-50 sm:text-sm">
                  DS Package
                </label>
                <button
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={isPackageDropdownOpen}
                  aria-labelledby="ds-package-label"
                  onClick={() => setIsPackageDropdownOpen((open) => !open)}
                  className="flex w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-slate-300 bg-white px-2.5 py-2 text-left text-xs font-semibold text-slate-950 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 sm:rounded-2xl sm:px-3 sm:py-2.5 sm:text-sm"
                >
                  <span className="min-w-0 flex-1 truncate">
                    {selectedDSAccount
                      ? `${selectedDSAccount.DSAccountNumber} - ${selectedDSAccount.accountType} - ${formatCurrency(selectedDSAccount.amountPerDay)}`
                      : 'Select DS package'}
                  </span>
                  <svg
                    className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${isPackageDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 9-7 7-7-7" />
                  </svg>
                </button>
                {isPackageDropdownOpen && (
                  <div
                    role="listbox"
                    aria-labelledby="ds-package-label"
                    className="absolute left-0 right-0 top-full z-40 mt-2 max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl"
                  >
                    {dsAccounts.map((dsAccount) => {
                      const active = dsAccount._id === selectedDSAccountId;

                      return (
                        <button
                          key={dsAccount._id}
                          type="button"
                          role="option"
                          aria-selected={active}
                          onClick={() => {
                            setSelectedDSAccountId(dsAccount._id);
                            setIsPackageDropdownOpen(false);
                          }}
                          className={`flex w-full flex-col rounded-xl px-3 py-2.5 text-left text-sm transition ${
                            active ? 'bg-purple-700 text-white' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className="font-black">{dsAccount.DSAccountNumber}</span>
                          <span className={`mt-0.5 text-xs font-semibold ${active ? 'text-purple-100' : 'text-slate-500'}`}>
                            {dsAccount.accountType} | {formatCurrency(dsAccount.amountPerDay)} daily
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="ds-amount" className="mb-1 block text-xs font-bold text-emerald-50 sm:text-sm">
                  Amount
                </label>
                <input
                  id="ds-amount"
                  type="number"
                  min={selectedDSAccount?.amountPerDay || 100}
                  step={selectedDSAccount?.amountPerDay || 100}
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder={String(selectedDSAccount?.amountPerDay || 1000)}
                  className="w-full min-w-0 rounded-xl border border-slate-300 px-2.5 py-2 text-sm font-bold text-slate-950 placeholder:text-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 sm:rounded-2xl sm:px-3 sm:py-2.5 sm:text-base"
                  required
                />
              </div>

              {Number(amount || 0) > 0 && (
                <div className="rounded-2xl bg-white/95 p-3 text-xs font-bold text-slate-800">
                  <div className="flex items-center justify-between gap-3">
                    <span>DS contribution</span>
                    <span>{formatCurrency(dsPaystackCharge.contributionAmount)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-3 text-orange-700">
                    <span>Paystack fee</span>
                    <span>{formatCurrency(dsPaystackCharge.paystackFee)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 border-t border-slate-200 pt-2 text-sm font-black text-slate-950">
                    <span>Total to pay</span>
                    <span>{formatCurrency(dsPaystackCharge.payableAmount)}</span>
                  </div>
                  <p className="mt-2 text-[11px] font-semibold text-slate-500">
                    This fee is charged by Paystack, not SureBank.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={fundingLoading}
                className="flex w-full items-center justify-center rounded-full bg-orange-500 px-4 py-2.5 text-xs font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300 sm:px-5 sm:py-3 sm:text-sm"
              >
                {fundingLoading ? 'Redirecting...' : 'Deposit with Paystack'}
              </button>
            </form>
          </section>

          {selectedDSAccount && (
            <section className="min-w-0 rounded-2xl border border-amber-600 bg-amber-500 p-3 shadow-sm sm:rounded-3xl sm:p-5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-bold text-amber-950">Package progress</span>
                <span className="font-black text-amber-950">{Math.round(progressPercent)}%</span>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-amber-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-700 to-slate-950"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </section>
          )}
          </div>

          <section className="hidden min-w-0 overflow-hidden rounded-2xl border border-sky-700 bg-sky-700 p-2.5 shadow-sm sm:block sm:rounded-3xl sm:p-6">
            <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4 sm:gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-base font-black text-white sm:text-lg">DS Transaction History</h2>
                <p className="text-xs text-sky-50 sm:text-sm">Swipe the table sideways on mobile.</p>
              </div>
              <button
                type="button"
                onClick={() => dispatch(fetchWalletRequest())}
                className="shrink-0 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/25"
              >
                Refresh
              </button>
            </div>

            {dsTransactionHistoryContent}
          </section>
          </div>
        </div>
      )}

      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-950">Make Request</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Available balance: {formatCurrency(freeToWithdrawBalance)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowRequestModal(false);
                  setRequestError('');
                }}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700"
              >
                Close
              </button>
            </div>

            {requestError && (
              <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
                {requestError}
              </div>
            )}

            <form className="mt-4 space-y-3" onSubmit={handleFreeToWithdrawRequest}>
              <div>
                <label htmlFor="free-withdraw-request-amount" className="mb-1.5 block text-xs font-bold text-slate-700">
                  Amount
                </label>
                <input
                  id="free-withdraw-request-amount"
                  type="number"
                  min="1"
                  max={freeToWithdrawBalance || undefined}
                  step="1"
                  value={requestAmount}
                  onChange={(event) => setRequestAmount(event.target.value)}
                  placeholder="Enter amount"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  required
                />
              </div>

              {!hasSettlementBankDetails && (
                <div className="rounded-2xl border border-orange-200 bg-orange-50 p-3">
                  <p className="mb-2 text-xs font-black uppercase text-orange-700">Settlement bank details</p>
                  <div className="grid gap-2">
                    <input
                      type="text"
                      value={settlementBankName}
                      onChange={(event) => setSettlementBankName(event.target.value)}
                      placeholder="Bank name"
                      className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      required
                    />
                    <input
                      type="text"
                      value={settlementAccountName}
                      onChange={(event) => setSettlementAccountName(event.target.value)}
                      placeholder="Account name"
                      className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      required
                    />
                    <input
                      type="text"
                      value={settlementBankAccountNumber}
                      onChange={(event) => setSettlementBankAccountNumber(event.target.value)}
                      placeholder="Account number"
                      className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      required
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={requestLoading || freeToWithdrawBalance <= 0}
                className="flex w-full items-center justify-center rounded-full bg-orange-500 px-5 py-3 text-sm font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
              >
                {requestLoading ? 'Sending...' : 'Request'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showCreatePackageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 sm:hidden">
          <div className="w-full max-w-sm rounded-3xl bg-white p-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-950">Create DS Package</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Select package type and enter your daily deposit amount.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreatePackageModal(false)}
                className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-slate-700"
              >
                Close
              </button>
            </div>

            {createError && (
              <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
                {createError}
              </div>
            )}

            {createDSPackageForm}
          </div>
        </div>
      )}

      {showDSTransactionModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 p-2 sm:hidden">
          <div className="flex max-h-full min-h-full flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-4">
              <div className="min-w-0">
                <h2 className="truncate text-base font-black text-slate-950">DS Transaction History</h2>
                <p className="mt-0.5 text-xs text-slate-500">Swipe the table sideways.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowDSTransactionModal(false)}
                className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-slate-700"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {dsTransactionHistoryContent}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyDS;

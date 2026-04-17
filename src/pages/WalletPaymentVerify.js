import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { verifyWalletFundingRequest } from '../redux/slices/walletSlice';

const WalletPaymentVerify = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('reference');
  const { verifying, verifyError } = useSelector((state) => state.wallet);

  useEffect(() => {
    if (reference) {
      dispatch(verifyWalletFundingRequest({ reference, navigate }));
    }
  }, [dispatch, navigate, reference]);

  if (!reference) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Wallet Payment Reference</h2>
          <p className="text-gray-600 mb-6">No wallet payment reference was provided.</p>
          <button
            onClick={() => navigate('/wallet')}
            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full text-sm font-medium"
          >
            Go to Wallet
          </button>
        </div>
      </div>
    );
  }

  if (verifyError) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Wallet Funding Verification Failed</h2>
          <p className="text-gray-600 mb-6">{verifyError}</p>
          <button
            onClick={() => navigate('/wallet')}
            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full text-sm font-medium"
          >
            Back to Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="animate-spin h-8 w-8 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying Wallet Funding</h2>
        <p className="text-gray-600">
          {verifying ? 'Please wait while we update your wallet balance.' : 'Finalizing your wallet payment.'}
        </p>
        <p className="text-sm text-gray-400 mt-4">Reference: {reference}</p>
      </div>
    </div>
  );
};

export default WalletPaymentVerify;

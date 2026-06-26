import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../utils/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('email');
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const requestOtp = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/ecommerce/auth/forgot-password`, {
        email: formData.email,
      });
      setMessage(response.data.message || 'OTP sent to your email');
      setStep('reset');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/ecommerce/auth/reset-password`, {
        email: formData.email,
        otp: formData.otp,
        newPassword: formData.newPassword,
      });
      setMessage(response.data.message || 'Password reset successfully');
      setTimeout(() => navigate('/login'), 1200);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  return (
    <div className="min-h-[70vh] bg-orange-50 px-4 py-10">
      <div className="mx-auto w-full max-w-md overflow-hidden rounded-xl bg-white p-5">
        <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
        <p className="mt-1 text-sm text-gray-600">
          Enter the email on your account to receive a reset OTP.
        </p>

        {step === 'email' ? (
          <form onSubmit={requestOtp} className="mt-5 space-y-3">
            <input
              type="email"
              placeholder="Email address"
              value={formData.email}
              onChange={(event) => updateField('email', event.target.value)}
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-orange-500 py-3 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={resetPassword} className="mt-5 space-y-3">
            <input
              type="text"
              inputMode="numeric"
              placeholder="OTP"
              value={formData.otp}
              onChange={(event) => updateField('otp', event.target.value)}
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
            <input
              type="password"
              placeholder="New password"
              value={formData.newPassword}
              onChange={(event) => updateField('newPassword', event.target.value)}
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={formData.confirmPassword}
              onChange={(event) => updateField('confirmPassword', event.target.value)}
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-orange-500 py-3 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        {message && <div className="mt-4 rounded-lg bg-green-100 p-3 text-sm text-green-700">{message}</div>}
        {error && <div className="mt-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">{error}</div>}

        <Link to="/login" className="mt-4 block text-center text-sm font-medium text-orange-500 hover:text-orange-600">
          Back to login
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;

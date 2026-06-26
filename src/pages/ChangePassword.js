import React, { useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { API_URL, getAuthHeader } from '../utils/api';

const ChangePassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const forced = location.state?.forced === true;
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

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
      await axios.put(`${API_URL}/api/ecommerce/auth/change-password`, {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      }, {
        headers: getAuthHeader(),
      });
      navigate('/');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] bg-orange-50 px-4 py-10">
      <div className="mx-auto w-full max-w-md overflow-hidden rounded-xl bg-white p-5">
        <h2 className="text-2xl font-bold text-gray-900">Change Password</h2>
        <p className="mt-1 text-sm text-gray-600">
          {forced
            ? 'Your password was reset by admin. Enter the temporary password and choose a new password.'
            : 'Update your ecommerce account password.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <input
            type="password"
            placeholder={forced ? 'Temporary password' : 'Current password'}
            value={formData.currentPassword}
            onChange={(event) => updateField('currentPassword', event.target.value)}
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
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>

        {error && <div className="mt-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">{error}</div>}
      </div>
    </div>
  );
};

export default ChangePassword;

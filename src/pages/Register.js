import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerRequest, clearError } from '../redux/slices/authSlice';
import { getStates, getLGAs, getTowns } from '../data/nigerianLocations';

const formatAddress = ({ streetAddress, town, lga, state }) => (
  [streetAddress, town, lga, state]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .join(', ')
);

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '';

  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    streetAddress: '',
    state: '',
    lga: '',
    town: '',
    password: '',
    referralCode: '',
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirect ? `/${redirect}` : '/');
    }
    return () => {
      dispatch(clearError());
    };
  }, [isAuthenticated, navigate, redirect, dispatch]);

  const updateField = (field, value) => {
    setValidationError('');
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!formData.fullName.trim() || !formData.phone.trim() || !formData.password) {
      setValidationError('Full name, phone number, and password are required');
      return;
    }

    if (formData.password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return;
    }

    const [firstName, ...lastNameParts] = formData.fullName.trim().split(' ');
    const lastName = lastNameParts.join(' ') || firstName;

    dispatch(registerRequest({
      firstName,
      lastName,
      email: formData.email.trim(),
      phone: formData.phone,
      address: formatAddress(formData),
      password: formData.password,
      navigate,
      redirect
    }));
  };

  return (
    <div className="min-h-[70vh] bg-orange-50 px-4 py-10">
      <div className="mx-auto w-full max-w-md overflow-hidden rounded-xl">
        <div className="px-4 pb-4">
          <h2 className="text-2xl font-bold text-gray-900">Create a Free Account</h2>
          <p className="mt-1 text-sm text-gray-600">
            Welcome! Create your account in seconds and start paying small small for the things you love.
          </p>

          <div className="mt-4 rounded-xl bg-white p-4">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm text-gray-600">Have an Account?</span>
              <Link
                to={`/login${redirect ? `?redirect=${redirect}` : ''}`}
                className="text-sm font-medium text-orange-500 hover:text-orange-600"
              >
                Login
              </Link>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChange={(event) => updateField('fullName', event.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={(event) => updateField('phone', event.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <input
                  type="text"
                  placeholder="House number, Street name..."
                  value={formData.streetAddress}
                  onChange={(event) => updateField('streetAddress', event.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <select
                  value={formData.state}
                  onChange={(event) => {
                    setValidationError('');
                    setFormData((prev) => ({
                      ...prev,
                      state: event.target.value,
                      lga: '',
                      town: '',
                    }));
                  }}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select State</option>
                  {getStates().map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                {formData.state && (
                  <select
                    value={formData.lga}
                    onChange={(event) => {
                      setValidationError('');
                      setFormData((prev) => ({
                        ...prev,
                        lga: event.target.value,
                        town: '',
                      }));
                    }}
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select LGA</option>
                    {getLGAs(formData.state).map((lga) => (
                      <option key={lga} value={lga}>{lga}</option>
                    ))}
                  </select>
                )}
                {formData.lga && (
                  <select
                    value={formData.town}
                    onChange={(event) => updateField('town', event.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select Town</option>
                    {getTowns(formData.state, formData.lga).map((town) => (
                      <option key={town} value={town}>{town}</option>
                    ))}
                  </select>
                )}
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={formData.password}
                    onChange={(event) => updateField('password', event.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 pr-10 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500">At least 6 characters</p>
              </div>

              <Link
                to="/"
                className="mt-3 inline-block text-sm text-gray-500 hover:text-orange-500"
              >
                Sign Up later &gt;&gt;&gt;
              </Link>

              <div className="mt-4 rounded-lg bg-gray-50 p-3">
                <input
                  type="text"
                  placeholder="How did you hear about us?"
                  value={formData.referralCode}
                  onChange={(event) => updateField('referralCode', event.target.value)}
                  className="w-full bg-transparent px-3 py-2 text-sm focus:outline-none"
                />
                <p className="mt-1 text-xs text-orange-500">
                  If you input your friend's referral code, we'll send a thank you note to them and also credit you with some money for remembering them when you make your first purchase (T&Cs apply).
                </p>
              </div>

              {(error || validationError) && (
                <div className="mt-3 rounded-lg bg-red-100 p-3 text-sm text-red-700">
                  {error || validationError}
                </div>
              )}

              <div className="mt-4">
                <p className="text-center text-xs text-gray-500">
                  By clicking Sign Up, you agree to our <span className="text-orange-500">Terms and Conditions</span> and{' '}
                  <span className="text-orange-500">Privacy Policy</span>. You may receive email/sms notifications from us.
                </p>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-4 w-full rounded-full bg-orange-500 py-3 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  {loading ? 'Please wait...' : 'Sign Up'}
                </button>

                <p className="mt-4 text-center text-sm">
                  Already have an Account?{' '}
                  <Link
                    to={`/login${redirect ? `?redirect=${redirect}` : ''}`}
                    className="font-medium text-orange-500 hover:text-orange-600"
                  >
                    Log In
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

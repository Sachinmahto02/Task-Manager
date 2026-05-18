import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

/**
 * GoogleButton — renders the "Continue with Google" button.
 * Uses @react-oauth/google's useGoogleLogin hook (popup flow).
 *
 * Props:
 *   label  — button text (default: "Continue with Google")
 *   onStart — optional callback right before API call
 */
const GoogleButton = ({ label = 'Continue with Google', onStart }) => {
  const { googleLogin, authLoading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const isClientIdSet = process.env.REACT_APP_GOOGLE_CLIENT_ID &&
    !process.env.REACT_APP_GOOGLE_CLIENT_ID.includes('YOUR_GOOGLE_CLIENT_ID');

  // useGoogleLogin returns a function you call to open the popup
  const openGooglePopup = useGoogleLogin({
    // We use the token_response flow — exchange access_token for user info on backend
    // OR use oneTap/credential flow — both are supported.
    // Here we use the credential (id_token) flow via the custom button below.
    onError: () => {
      setBusy(false);
      toast.error('Google sign-in was cancelled or failed.');
    }
  });

  const handleClick = () => {
    if (!isClientIdSet) {
      toast.error('Google Client ID is not configured. See frontend/.env');
      return;
    }
    if (onStart) onStart();
    openGooglePopup();
  };

  return (
    <button
      type="button"
      className="google-btn"
      onClick={handleClick}
      disabled={busy || authLoading}
    >
      <svg className="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      {busy || authLoading ? 'Signing in…' : label}
    </button>
  );
};

/**
 * GoogleOneTapButton — uses @react-oauth/google's GoogleLogin component
 * which renders Google's own styled button and handles the credential flow.
 * This is the simplest approach and recommended by Google.
 */
export const GoogleCredentialButton = ({ label }) => {
  const { googleLogin, authLoading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const isClientIdSet = process.env.REACT_APP_GOOGLE_CLIENT_ID &&
    !process.env.REACT_APP_GOOGLE_CLIENT_ID.includes('YOUR_GOOGLE_CLIENT_ID');

  const handleSuccess = async (credentialResponse) => {
    setBusy(true);
    const result = await googleLogin(credentialResponse.credential);
    setBusy(false);
    if (result.success) {
      toast.success('Signed in with Google! 🎉');
      navigate('/dashboard');
    } else {
      toast.error(result.message);
    }
  };

  const handleError = () => {
    setBusy(false);
    toast.error('Google sign-in failed or was cancelled.');
  };

  if (!isClientIdSet) {
    return (
      <button
        type="button"
        className="google-btn google-btn-disabled"
        title="Set REACT_APP_GOOGLE_CLIENT_ID in frontend/.env to enable"
        disabled
      >
        <GoogleIcon />
        Google (not configured)
      </button>
    );
  }

  // Dynamically import GoogleLogin to avoid crashing when GOOGLE_CLIENT_ID not set
  const { GoogleLogin } = require('@react-oauth/google');

  return (
    <div className="google-login-wrap">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        text={label === 'Continue with Google' ? 'continue_with' : 'signin_with'}
        shape="rectangular"
        theme="filled_black"
        size="large"
        width="100%"
        locale="en"
      />
      {(busy || authLoading) && (
        <div className="google-loading-overlay">
          <div className="spinner" style={{ width: 20, height: 20 }} />
          <span>Signing in…</span>
        </div>
      )}
    </div>
  );
};

const GoogleIcon = () => (
  <svg style={{ width: 20, height: 20, flexShrink: 0 }} viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default GoogleButton;

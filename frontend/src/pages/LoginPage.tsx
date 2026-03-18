// =============================================================
// Login Page — RTK Query mutation + Redux dispatch + Google OAuth
// INTERVIEW: React hooks rules — only call hooks at the top level.
// useLoginMutation() returns a tuple: [triggerFn, { isLoading, error }]
// This is different from useQuery which auto-fires on render.
// Mutations are manually triggered by calling the trigger function.
// =============================================================

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useLoginMutation } from '../api/authApi';
import { useAppDispatch } from '../store/store';
import { setCredentials } from '../store/authSlice';

const LoginPage: React.FC = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [login, { isLoading, error }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect back to the page they tried to access (deep-linking)
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await login(form).unwrap();
      // .unwrap() throws on error, making try/catch work cleanly
      dispatch(setCredentials({ user: result.user, accessToken: result.accessToken }));
      navigate(from, { replace: true });
    } catch (err) {
      // Error handled by RTK Query — visible via `error` from mutation
      console.error('Login failed:', err);
    }
  };

  const googleLoginUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/auth/google`;

  return (
    <div style={{
      minHeight: '100vh', display: 'grid', placeItems: 'center',
      background: 'var(--bg-primary)', padding: '1rem',
    }}>
      <div className="card fade-in" style={{ width: '100%', maxWidth: '420px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⬡</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.375rem' }}>Welcome back</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Sign in to your account to continue
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
            {'data' in error
              ? (error.data as { error: string })?.error
              : 'Login failed. Please try again.'}
          </div>
        )}

        {/* Google OAuth Button */}
        <a href={googleLoginUrl} className="btn btn-google btn-full" style={{ marginBottom: '1.25rem' }}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </a>

        <div className="divider" style={{ marginBottom: '1.25rem' }}>or</div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email address</label>
            <input
              id="email" type="email" className="form-input" required
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password" type="password" className="form-input" required
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={isLoading} style={{ marginTop: '0.5rem' }}>
            {isLoading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 500 }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

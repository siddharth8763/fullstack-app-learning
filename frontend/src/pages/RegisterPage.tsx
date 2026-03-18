import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRegisterMutation } from '../api/authApi';

const RegisterPage: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [register, { isLoading, error }] = useRegisterMutation();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(form).unwrap();
      navigate('/login?registered=true');
    } catch (err) {
      console.error('Register failed:', err);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'grid', placeItems: 'center',
      background: 'var(--bg-primary)', padding: '1rem',
    }}>
      <div className="card fade-in" style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⬡</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.375rem' }}>Create an account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Start your full-stack journey today</p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
            {'data' in error ? (error.data as { error: string })?.error : 'Registration failed.'}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full name</label>
            <input id="name" type="text" className="form-input" required placeholder="John Doe"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email address</label>
            <input id="email" type="email" className="form-input" required placeholder="you@example.com"
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input id="password" type="password" className="form-input" required placeholder="Min 8 chars, upper+lower+digit"
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <span className="form-error" style={{ color: 'var(--text-muted)' }}>Must have uppercase, lowercase and a digit</span>
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={isLoading} style={{ marginTop: '0.5rem' }}>
            {isLoading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;

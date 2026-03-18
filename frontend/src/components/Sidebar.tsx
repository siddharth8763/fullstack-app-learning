import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/store';
import { logout } from '../store/authSlice';
import { useLogoutMutation } from '../api/authApi';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { to: '/profile', label: 'Profile', icon: '👤' },
  { to: '/users', label: 'Users', icon: '👥' },
];

export const Sidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const [logoutApi] = useLogoutMutation();

  const handleLogout = async () => {
    await logoutApi();
    dispatch(logout());
    navigate('/login');
  };

  return (
    <aside style={{
      position: 'fixed', inset: '0 auto 0 0', width: '260px',
      background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', padding: '1.5rem 0', zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: '0 1.5rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-blue)' }}>
          ⬡ FullStack
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Learning Platform
        </div>
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-sm)',
              textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500,
              color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
              background: isActive ? 'rgba(88,166,255,0.1)' : 'transparent',
              transition: 'var(--transition)',
            })}
          >
            <span style={{ fontSize: '1.1rem' }}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User Info + Logout */}
      <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)' }}>
        {user && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</div>
            <span className={`badge badge-${user.role.toLowerCase()}`} style={{ marginTop: '0.375rem' }}>
              {user.role}
            </span>
          </div>
        )}
        <button onClick={handleLogout} className="btn btn-danger" style={{ width: '100%', justifyContent: 'center' }}>
          Sign Out
        </button>
      </div>
    </aside>
  );
};

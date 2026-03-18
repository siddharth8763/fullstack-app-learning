// =============================================================
// Dashboard Page — shows user stats and RTK Query data
// INTERVIEW: useGetUsersQuery() is a RTK Query auto-generated hook.
// It returns { data, isLoading, isError, isFetching, refetch }.
// 'isLoading' is true only on first load (no cached data).
// 'isFetching' is true whenever a request is in flight (including refetch).
// =============================================================

import React from 'react';
import { useAppSelector } from '../store/store';
import { useGetUsersQuery } from '../api/usersApi';

const DashboardPage: React.FC = () => {
  const user = useAppSelector((s) => s.auth.user);
  // Skip API call if user is not ADMIN (no permission for user list)
  const { data, isLoading, isError } = useGetUsersQuery(
    { page: 1, limit: 5 },
    { skip: user?.role !== 'ADMIN' }
  );

  const stats = [
    { label: 'Total Users', value: data?.pagination.total ?? '—', icon: '👥', color: 'var(--accent-blue)' },
    { label: 'Your Role', value: user?.role ?? '—', icon: '🛡️', color: 'var(--accent-purple)' },
    { label: 'Services', value: '3', icon: '⚡', color: 'var(--accent-green)' },
    { label: 'Uptime', value: '99.9%', icon: '📊', color: 'var(--accent-orange)' },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back, <strong>{user?.name}</strong> 👋</p>
      </div>

      {/* Stats Grid */}
      <div className="grid-cols-4" style={{ marginBottom: '2rem' }}>
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div style={{ fontSize: '1.75rem' }}>{stat.icon}</div>
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value" style={{ color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Architecture Overview */}
      <div className="grid-cols-2" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1rem', color: 'var(--accent-blue)' }}>🏗️ Tech Stack</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              ['Frontend', 'React 18 + TypeScript + RTK Query'],
              ['API Gateway', 'Express + JWT + Rate Limiting'],
              ['Auth Service', 'bcrypt + JWT + Google OAuth 2.0'],
              ['User Service', 'Express + Prisma + MySQL + RBAC'],
              ['Monitoring', 'Grafana + Prometheus'],
              ['DevOps', 'Docker + Kubernetes + AWS CDK'],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{label}</span>
                <span style={{ color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1rem', color: 'var(--accent-green)' }}>📡 API Endpoints</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              ['POST', '/api/auth/register', 'Register'],
              ['POST', '/api/auth/login', 'Login'],
              ['POST', '/api/auth/refresh', 'Refresh Token'],
              ['GET', '/api/auth/google', 'Google OAuth'],
              ['GET', '/api/users', 'List Users (Admin)'],
              ['GET', '/api/users/:id', 'Get User'],
            ].map(([method, path, desc]) => (
              <div key={path} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{
                  padding: '0.125rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700,
                  background: method === 'GET' ? 'rgba(63,185,80,0.15)' : 'rgba(88,166,255,0.15)',
                  color: method === 'GET' ? 'var(--accent-green)' : 'var(--accent-blue)',
                  fontFamily: 'monospace',
                }}>
                  {method}
                </span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', flex: 1 }}>{path}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Users (Admin only) */}
      {user?.role === 'ADMIN' && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>👥 Recent Users</h3>
          {isLoading && <div className="spinner-center"><div className="spinner" /></div>}
          {isError && <div className="alert alert-error">Failed to load users.</div>}
          {data && (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((u) => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 500 }}>{u.name}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td><span className={`badge badge-${u.role.toLowerCase()}`}>{u.role}</span></td>
                      <td><span className={`badge badge-${u.isActive ? 'active' : 'inactive'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;

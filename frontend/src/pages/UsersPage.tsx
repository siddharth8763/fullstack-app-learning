import React, { useState } from 'react';
import { useGetUsersQuery, useDeleteUserMutation } from '../api/usersApi';

const UsersPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useGetUsersQuery({ page, limit: 10 });
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Deactivate user "${name}"?`)) return;
    try { await deleteUser(id).unwrap(); } catch { /* error toast in prod */ }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Users</h1>
        <p>Manage all registered users. RTK Query auto-refreshes after mutations.</p>
      </div>

      {isLoading && <div className="spinner-center"><div className="spinner" /></div>}
      {isError && <div className="alert alert-error">Failed to load users.</div>}

      {data && (
        <>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {data.data.map((u) => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>{u.name}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td><span className={`badge badge-${u.role.toLowerCase()}`}>{u.role}</span></td>
                      <td><span className={`badge badge-${u.isActive ? 'active' : 'inactive'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        {u.isActive && (
                          <button
                            className="btn btn-danger"
                            style={{ padding: '0.25rem 0.75rem', fontSize: '0.8125rem' }}
                            onClick={() => handleDelete(u.id, u.name)}
                            disabled={isDeleting}
                          >
                            Deactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={() => setPage((p) => p - 1)} disabled={!data.pagination.hasPrev}>
              ← Previous
            </button>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} users)
            </span>
            <button className="btn btn-secondary" onClick={() => setPage((p) => p + 1)} disabled={!data.pagination.hasNext}>
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default UsersPage;

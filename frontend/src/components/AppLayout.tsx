import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const AppLayout: React.FC = () => (
  <div className="app-layout">
    <Sidebar />
    <main className="main-content fade-in">
      <Outlet />
    </main>
  </div>
);

// src/components/layout/Layout.jsx
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      className="h-screen flex bg-gray-950 overflow-hidden font-sans selection:bg-indigo-100 selection:text-indigo-900 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url("/login_background.png")' }}
    >
      {/* Sidebar - Always visible on desktop, toggleable on mobile */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area with Glassmorphism Overlay */}
      <div className="flex-1 flex flex-col min-w-0 relative bg-white/5 dark:bg-black/20 backdrop-blur-2xl">
        {/* Fixed Navbar */}
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
'use client';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import Navbar from './Navbar';

export default function AppShell({ children, role }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <Navbar
        role={role}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content with left margin for sidebar on desktop */}
      <div className="lg:ml-60">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-[#c3c6d7] sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 text-[#434655]"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#004ac6] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">G</span>
            </div>
            <span className="font-bold text-base text-[#191c1d]">GETRAD</span>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 max-w-6xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

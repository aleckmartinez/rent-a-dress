import React from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#faf9f6]">
      {/* Fixed Admin Sidebar */}
      <AdminSidebar />

      {/* Main Content Area (Offset by sidebar width on desktop) */}
      <div className="flex flex-col md:pl-64 min-h-screen">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

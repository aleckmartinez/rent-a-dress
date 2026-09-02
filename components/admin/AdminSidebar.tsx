'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Shirt,
  CalendarCheck,
  Users,
  Wallet,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Sparkles
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      document.cookie = 'demo_admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      router.push('/login');
      router.refresh();
    }
  };

  const navItems = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Dresses', href: '/admin/dresses', icon: Shirt },
    { label: 'Rentals', href: '/admin/rentals', icon: CalendarCheck },
    { label: 'Customers', href: '/admin/customers', icon: Users },
    { label: 'Finance', href: '/admin/finance', icon: Wallet },
  ];

  return (
    <>
      {/* Mobile Top Navigation Bar */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between bg-white px-4 py-3 border-b border-slate-200 shadow-sm">
        <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold text-slate-800">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-100 text-pink-600">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="tracking-wide text-sm">DRESS RENTAL</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-slate-600 hover:text-slate-900 rounded-md focus:outline-none"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Backdrop for mobile drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col justify-between border-r border-slate-200/80 bg-white px-5 py-6 transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Header Brand */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-100">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-2.5 font-semibold text-slate-900 hover:opacity-90 transition-opacity"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-50 border border-pink-100 text-pink-600 shadow-sm">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wider text-pink-600">Atelier</span>
                <span className="text-sm font-semibold tracking-tight text-slate-800">Dress Rental</span>
              </div>
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 flex flex-col gap-1">
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Management
            </span>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-pink-50 text-pink-700 shadow-sm font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-pink-600' : 'text-slate-400'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Links */}
        <div className="flex flex-col gap-3 pt-6 border-t border-slate-100">
          <Link
            href="/availability"
            target="_blank"
            className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-slate-50/50 px-3.5 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Public Availability Page
            </span>
            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
          </Link>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-100 text-xs font-semibold text-pink-700">
                AD
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-900">Administrator</span>
                <span className="text-[10px] text-slate-400">admin@dressrental.com</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

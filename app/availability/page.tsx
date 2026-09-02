'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Search, Filter, Sparkles, ShieldCheck } from 'lucide-react';
import { PublicDressAvailability } from '@/lib/types/database';
import { getPublicAvailability } from '@/lib/services/api';
import { PublicDressCard } from '@/components/public/PublicDressCard';

export default function PublicAvailabilityPage() {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [colorFilter, setColorFilter] = useState<string>('all');
  const [sizeFilter, setSizeFilter] = useState<string>('all');
  const [dresses, setDresses] = useState<PublicDressAvailability[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailability = async () => {
    setLoading(true);
    setError(null);
    try {
      if (startDate && endDate && endDate < startDate) {
        setError('End Date cannot be earlier than Start Date.');
        setLoading(false);
        return;
      }
      const data = await getPublicAvailability({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search,
        color: colorFilter,
        size: sizeFilter
      });
      setDresses(data);
    } catch (err: any) {
      console.error('Error loading public availability:', err);
      setError('Unable to load availability. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, [colorFilter, sizeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAvailability();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f6]">
      {/* Public Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-100 border border-pink-200 text-pink-600 shadow-sm">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight">Atelier Rental Catalog</h1>
              <p className="text-[11px] text-slate-500 font-medium">Browse Collection & Date Availability</p>
            </div>
          </div>

          <Link
            href="/login"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ShieldCheck className="h-4 w-4 text-pink-600" />
            Admin Login
          </Link>
        </div>
      </header>

      {/* Date Search Hero Section */}
      <section className="bg-gradient-to-b from-pink-50/70 via-white to-[#faf9f6] py-10 border-b border-slate-200/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-block rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold text-pink-700 mb-3">
            DRESS AVAILABILITY CHECKER
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Find the Perfect Dress for Your Event
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
            Select your event rental dates to verify real-time inventory availability.
          </p>

          {/* Date Search Form */}
          <form
            onSubmit={handleSearchSubmit}
            className="mt-6 bg-white p-4 sm:p-6 rounded-3xl shadow-soft border border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-end gap-4"
          >
            <div className="flex-1 text-left">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Rental Start Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-sm text-slate-800 focus:border-pink-500 focus:bg-white focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex-1 text-left">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Rental End Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-sm text-slate-800 focus:border-pink-500 focus:bg-white focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-xl bg-pink-600 hover:bg-pink-700 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-colors"
            >
              <Search className="h-4 w-4" />
              Check Availability
            </button>
          </form>

          {error && (
            <p className="mt-3 text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-2.5 max-w-lg mx-auto">
              {error}
            </p>
          )}
        </div>
      </section>

      {/* Catalog Search & Filters */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search dress name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchAvailability()}
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-xs text-slate-800 focus:border-pink-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <span>Filters:</span>
            </div>

            <select
              value={colorFilter}
              onChange={(e) => setColorFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-pink-500 focus:outline-none"
            >
              <option value="all">All Colors</option>
              <option value="Blush Pink">Blush Pink</option>
              <option value="Navy Blue">Navy Blue</option>
              <option value="Emerald Green">Emerald Green</option>
              <option value="Champagne Gold">Champagne Gold</option>
              <option value="Pastel Lilac">Pastel Lilac</option>
            </select>

            <select
              value={sizeFilter}
              onChange={(e) => setSizeFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-pink-500 focus:outline-none"
            >
              <option value="all">All Sizes</option>
              <option value="Small (S)">Small (S)</option>
              <option value="Medium (M)">Medium (M)</option>
              <option value="Large (L)">Large (L)</option>
            </select>
          </div>
        </div>

        {/* Dress Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="rounded-2xl border border-slate-200 bg-white p-4 animate-pulse h-80 flex flex-col justify-between">
                <div className="h-48 bg-slate-100 rounded-xl" />
                <div className="h-4 bg-slate-100 rounded w-3/4 mt-4" />
                <div className="h-4 bg-slate-100 rounded w-1/2 mt-2" />
              </div>
            ))}
          </div>
        ) : dresses.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center my-8">
            <Sparkles className="h-10 w-10 text-pink-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No dresses found</h3>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your date range, search query, or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {dresses.map((dress) => (
              <PublicDressCard key={dress.id} dress={dress} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Atelier Dress Rental Management. All rights reserved.
      </footer>
    </div>
  );
}

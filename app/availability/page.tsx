'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Search,
  Filter,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X,
  Shirt,
  Info,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { PublicDressAvailability } from '@/lib/types/database';
import { getPublicAvailability, checkDressAvailability } from '@/lib/services/api';
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

  // Selected Dress Modal State
  const [selectedDress, setSelectedDress] = useState<PublicDressAvailability | null>(null);
  const [modalStartDate, setModalStartDate] = useState<string>('');
  const [modalEndDate, setModalEndDate] = useState<string>('');
  const [modalCheckResult, setModalCheckResult] = useState<{
    checked: boolean;
    available: boolean;
    reason?: string;
  }>({ checked: false, available: true });
  const [checkingModalAvailability, setCheckingModalAvailability] = useState<boolean>(false);

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

  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAvailability();
  };

  // Open Dress Selection Modal
  const handleSelectDressCard = (dress: PublicDressAvailability) => {
    setSelectedDress(dress);
    setModalStartDate(startDate);
    setModalEndDate(endDate);
    setModalCheckResult({ checked: false, available: true });

    // If dates already picked in hero search bar, automatically check availability for this dress
    if (startDate && endDate && endDate >= startDate) {
      runModalCheck(dress.id, startDate, endDate);
    }
  };

  const runModalCheck = async (dressId: string, sDate: string, eDate: string) => {
    setCheckingModalAvailability(true);
    try {
      if (eDate < sDate) {
        setModalCheckResult({
          checked: true,
          available: false,
          reason: 'End Date cannot be earlier than Start Date.'
        });
        return;
      }
      const res = await checkDressAvailability(dressId, sDate, eDate);
      setModalCheckResult({
        checked: true,
        ...res
      });
    } catch (err: any) {
      setModalCheckResult({
        checked: true,
        available: false,
        reason: err.message || 'Error checking dress availability.'
      });
    } finally {
      setCheckingModalAvailability(false);
    }
  };

  const handleModalDateCheckSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDress || !modalStartDate || !modalEndDate) return;
    runModalCheck(selectedDress.id, modalStartDate, modalEndDate);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f6]">
      {/* Public Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-100 border border-pink-200 text-pink-600 shadow-sm">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight">Atelier Rental Catalog</h1>
            <p className="text-[11px] text-slate-500 font-medium">Browse Collection & Date Availability</p>
          </div>
        </div>
      </header>

      {/* Hero Section with Global Date Search */}
      <section className="bg-gradient-to-b from-pink-50/70 via-white to-[#faf9f6] py-10 border-b border-slate-200/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-block rounded-full bg-pink-100 px-3.5 py-1 text-xs font-bold text-pink-700 mb-3">
            DRESS AVAILABILITY CATALOG
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Select a Dress or Check Your Event Dates
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
            Click on any dress to check specific date availability, or filter the entire catalog below.
          </p>

          {/* Date Search Bar Form */}
          <form
            onSubmit={handleGlobalSearchSubmit}
            className="mt-6 bg-white p-4 sm:p-6 rounded-3xl shadow-soft border border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-end gap-4"
          >
            <div className="flex-1 text-left">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-pink-600" />
                Rental Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 focus:border-pink-500 focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            <div className="flex-1 text-left">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-pink-600" />
                Rental End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 focus:border-pink-500 focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-xl bg-pink-600 hover:bg-pink-700 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-colors"
            >
              <Search className="h-4 w-4" />
              Check Catalog
            </button>
          </form>

          {error && (
            <p className="mt-3 text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-2.5 max-w-lg mx-auto">
              {error}
            </p>
          )}
        </div>
      </section>

      {/* Main Catalog Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Search & Filters Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search dress by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchAvailability()}
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-xs text-slate-800 focus:border-pink-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <span>Filter By:</span>
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
              <div key={n} className="rounded-3xl border border-slate-200 bg-white p-4 animate-pulse h-80 flex flex-col justify-between">
                <div className="h-48 bg-slate-100 rounded-2xl" />
                <div className="h-4 bg-slate-100 rounded w-3/4 mt-4" />
                <div className="h-4 bg-slate-100 rounded w-1/2 mt-2" />
              </div>
            ))}
          </div>
        ) : dresses.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center my-8">
            <Sparkles className="h-10 w-10 text-pink-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No dresses found</h3>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your search query, color, or size filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {dresses.map((dress) => (
              <PublicDressCard
                key={dress.id}
                dress={dress}
                onSelectDress={handleSelectDressCard}
              />
            ))}
          </div>
        )}
      </main>

      {/* INTERACTIVE DRESS SELECTION & AVAILABILITY MODAL */}
      {selectedDress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-pink-600" />
                <h3 className="text-sm font-bold text-slate-900">Dress Availability Checker</h3>
              </div>
              <button
                onClick={() => setSelectedDress(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200/60 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex flex-col gap-6">
              {/* Selected Dress Overview Card */}
              <div className="flex flex-col sm:flex-row gap-5 p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
                <div className="relative h-44 sm:h-36 w-full sm:w-28 rounded-xl overflow-hidden bg-slate-200 shrink-0">
                  {selectedDress.main_photo_path ? (
                    <img
                      src={selectedDress.main_photo_path}
                      alt={selectedDress.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center text-slate-400">
                      <Shirt className="h-8 w-8 text-pink-300" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-between flex-1 text-xs">
                  <div>
                    <span className="inline-block rounded-md bg-pink-100 text-pink-700 px-2 py-0.5 font-bold text-[10px] uppercase mb-1">
                      {selectedDress.size}
                    </span>
                    <h4 className="text-base font-extrabold text-slate-900">{selectedDress.name}</h4>
                    <p className="text-slate-500 font-medium mt-0.5">{selectedDress.color}</p>
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-200/60">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Rental Price</span>
                      <span className="text-base font-extrabold text-pink-600">
                        {formatPrice(selectedDress.default_price)}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                      Status: {selectedDress.operational_status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Date Availability Checker Form */}
              <form onSubmit={handleModalDateCheckSubmit} className="flex flex-col gap-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-pink-600" /> Select Your Rental Event Dates
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Start Date *</label>
                    <input
                      type="date"
                      required
                      value={modalStartDate}
                      onChange={(e) => setModalStartDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 focus:border-pink-500 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">End Date *</label>
                    <input
                      type="date"
                      required
                      value={modalEndDate}
                      onChange={(e) => setModalEndDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 focus:border-pink-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={checkingModalAvailability || !modalStartDate || !modalEndDate}
                  className="flex items-center justify-center gap-2 rounded-xl bg-pink-600 hover:bg-pink-700 disabled:opacity-50 py-3 text-xs font-bold text-white shadow-sm transition-colors"
                >
                  <Search className="h-4 w-4" />
                  {checkingModalAvailability ? 'Checking Availability...' : 'Check Availability for Selected Dates'}
                </button>
              </form>

              {/* Availability Result Banner */}
              {modalCheckResult.checked && (
                <div className="mt-1">
                  {modalCheckResult.available ? (
                    <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-900 flex flex-col gap-2">
                      <div className="flex items-center gap-2 font-bold text-emerald-800 text-sm">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        AVAILABLE FOR YOUR DATES!
                      </div>
                      <p className="text-emerald-700 font-medium">
                        This dress is free and ready for booking from <strong>{modalStartDate}</strong> to <strong>{modalEndDate}</strong>.
                      </p>
                      <div className="mt-2 pt-2 border-t border-emerald-200/80 flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-emerald-800">Interested in renting?</span>
                        <span className="font-extrabold text-pink-700 bg-white px-3 py-1 rounded-xl border border-emerald-200 shadow-xs">
                          Contact Admin to Reserve
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-900 flex flex-col gap-2">
                      <div className="flex items-center gap-2 font-bold text-rose-800 text-sm">
                        <AlertTriangle className="h-5 w-5 text-rose-600" />
                        NOT AVAILABLE
                      </div>
                      <p className="text-rose-700 font-medium">
                        {modalCheckResult.reason || 'This dress is unavailable for the selected dates.'}
                      </p>
                      <p className="text-[11px] text-slate-500 italic mt-1">
                        Tip: Try selecting different start/end dates or check another dress in our catalog.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setSelectedDress(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Atelier Dress Rental Management. All rights reserved.
      </footer>
    </div>
  );
}

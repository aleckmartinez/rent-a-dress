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
  ShieldCheck,
  Tag,
  Palette
} from 'lucide-react';
import { PublicDressAvailability } from '@/lib/types/database';
import { getPublicAvailability, checkDressAvailability } from '@/lib/services/api';
import { PublicDressCard } from '@/components/public/PublicDressCard';

export default function PublicAvailabilityPage() {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
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

  const DRESS_TYPES = [
    { id: 'all', label: 'All Dress Types', icon: '✨' },
    { id: 'Long Dress', label: 'Long Dress', icon: '👗' },
    { id: 'Short Dress', label: 'Short Dress', icon: '👗' },
    { id: 'Evening Gown', label: 'Evening Gown', icon: '💃' },
    { id: 'Cocktail Dress', label: 'Cocktail Dress', icon: '🍸' },
    { id: 'Ball Gown', label: 'Ball Gown', icon: '👑' },
    { id: 'Midi Dress', label: 'Midi Dress', icon: '✨' },
    { id: 'Prom Dress', label: 'Prom Dress', icon: '🌟' }
  ];

  const COLOR_OPTIONS = [
    { id: 'all', label: 'All Colors' },
    { id: 'Blush Pink', label: 'Blush Pink' },
    { id: 'Navy Blue', label: 'Navy Blue' },
    { id: 'Emerald Green', label: 'Emerald Green' },
    { id: 'Champagne Gold', label: 'Champagne Gold' },
    { id: 'Pastel Lilac', label: 'Pastel Lilac' }
  ];

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
        type: typeFilter,
        color: colorFilter,
        size: sizeFilter
      });
      setDresses(data);
    } catch (err: any) {
      console.error('Error loading public availability:', err);
      setError('Unable to load dress catalog. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, [typeFilter, colorFilter, sizeFilter]);

  const handleGlobalDateCheckSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAvailability();
  };

  const handleSelectDressCard = (dress: PublicDressAvailability) => {
    setSelectedDress(dress);
    setModalStartDate(startDate);
    setModalEndDate(endDate);
    setModalCheckResult({ checked: false, available: true });
  };

  const handleModalDateCheckSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDress) return;

    if (!modalStartDate || !modalEndDate) {
      setModalCheckResult({
        checked: true,
        available: false,
        reason: 'Please select both Event Start Date and Return End Date.'
      });
      return;
    }

    if (modalEndDate < modalStartDate) {
      setModalCheckResult({
        checked: true,
        available: false,
        reason: 'Return End Date cannot be earlier than Event Start Date.'
      });
      return;
    }

    setCheckingModalAvailability(true);
    try {
      const res = await checkDressAvailability(selectedDress.id, modalStartDate, modalEndDate);
      setModalCheckResult({
        checked: true,
        available: res.available,
        reason: res.reason
      });
    } catch (err: any) {
      console.error('Error checking availability:', err);
      setModalCheckResult({
        checked: true,
        available: false,
        reason: err.message || 'System check failed. Please try again.'
      });
    } finally {
      setCheckingModalAvailability(false);
    }
  };

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(p);

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans antialiased text-slate-900">
      {/* Hero Header Section */}
      <section className="bg-gradient-to-b from-pink-900 via-purple-950 to-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-pink-500/20 px-3.5 py-1 text-xs font-bold text-pink-300 border border-pink-400/30 backdrop-blur-md mb-3">
            <Sparkles className="h-3.5 w-3.5" /> Luxury Dress Rental Collection
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white max-w-2xl leading-tight">
            Check Dress Availability & Book Your Dream Outfit
          </h1>
          <p className="mt-3 text-sm text-pink-100/80 max-w-xl">
            Browse our gorgeous gowns by category or select your event dates below to verify real-time availability.
          </p>

          {/* Quick Date Availability Filter Bar */}
          <form
            onSubmit={handleGlobalDateCheckSubmit}
            className="mt-8 w-full max-w-3xl rounded-3xl bg-white/10 p-3 sm:p-4 backdrop-blur-md border border-white/20 shadow-2xl flex flex-col sm:flex-row items-center gap-3 text-left"
          >
            <div className="flex-1 w-full">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-pink-200 mb-1">
                Event Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-slate-900/60 px-3.5 py-2 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>

            <div className="flex-1 w-full">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-pink-200 mb-1">
                Return End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-slate-900/60 px-3.5 py-2 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>

            <div className="w-full sm:w-auto self-end pt-2 sm:pt-0">
              <button
                type="submit"
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-pink-600 hover:bg-pink-500 px-6 py-2.5 text-xs font-extrabold text-white shadow-lg transition-all"
              >
                <Search className="h-4 w-4" />
                Check Dates
              </button>
            </div>
          </form>

          {error && (
            <p className="mt-3 text-xs font-semibold text-rose-300 bg-rose-950/60 px-4 py-1.5 rounded-full border border-rose-500/30">
              {error}
            </p>
          )}
        </div>
      </section>

      {/* Main Catalog & Interactive Filtering Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Step 1: Category / Dress Type Tabs */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="h-4 w-4 text-pink-600" />
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">1. Select Dress Category / Type</h2>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {DRESS_TYPES.map((t) => {
              const active = typeFilter === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTypeFilter(t.id)}
                  className={`shrink-0 flex items-center gap-1.5 rounded-2xl px-4 py-2 text-xs font-extrabold transition-all duration-200 border ${
                    active
                      ? 'bg-pink-600 text-white border-pink-600 shadow-md scale-105'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-pink-50 hover:border-pink-300'
                  }`}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Color & Search Filters */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-soft flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search dress by title or style..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchAvailability()}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs text-slate-800 focus:border-pink-500 focus:bg-white focus:outline-none transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1 text-slate-400 font-medium">
              <Palette className="h-3.5 w-3.5" />
              <span>Available Colors:</span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setColorFilter(c.id)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors border ${
                    colorFilter === c.id
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <select
              value={sizeFilter}
              onChange={(e) => setSizeFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-pink-500 focus:outline-none ml-auto lg:ml-0"
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
            <h3 className="text-sm font-bold text-slate-800">No dresses found for selected filters</h3>
            <p className="text-xs text-slate-500 mt-1">Try switching dress type categories or clearing search filters.</p>
            <button
              onClick={() => {
                setTypeFilter('all');
                setColorFilter('all');
                setSizeFilter('all');
                setSearch('');
              }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-pink-600 px-4 py-2 text-xs font-bold text-white shadow-sm"
            >
              Reset All Filters
            </button>
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

      {/* DRESS SELECTION & DATE AVAILABILITY CHECKER MODAL */}
      {selectedDress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-pink-400" />
                <h3 className="text-lg font-black tracking-tight">Check Dress Availability</h3>
              </div>
              <button
                onClick={() => setSelectedDress(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
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
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-block rounded-md bg-pink-100 text-pink-700 px-2 py-0.5 font-bold text-[10px] uppercase">
                        {selectedDress.size}
                      </span>
                      <span className="inline-block rounded-md bg-slate-200 text-slate-700 px-2 py-0.5 font-bold text-[10px] uppercase">
                        {selectedDress.dress_type || 'Long Dress'}
                      </span>
                    </div>
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
                    <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full border ${
                      selectedDress.is_available
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {selectedDress.is_available ? '🟢 AVAILABLE' : '🔴 UNAVAILABLE'}
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
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Event Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={modalStartDate}
                      onChange={(e) => setModalStartDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 focus:border-pink-500 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Return End Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={modalEndDate}
                      onChange={(e) => setModalEndDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 focus:border-pink-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={checkingModalAvailability}
                  className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-pink-600 hover:bg-pink-700 py-3 text-xs font-bold text-white shadow-md transition-colors"
                >
                  <Clock className="h-4 w-4" />
                  {checkingModalAvailability ? 'Checking Availability...' : 'Check Availability For Selected Dates'}
                </button>
              </form>

              {/* Real-time Check Result Feedback Box */}
              {modalCheckResult.checked && (
                <div
                  className={`rounded-2xl p-4 border transition-all ${
                    modalCheckResult.available
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {modalCheckResult.available ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                    )}

                    <div className="flex-1 text-xs">
                      <h5 className="font-extrabold text-sm">
                        {modalCheckResult.available
                          ? 'Great news! Dress is AVAILABLE for your dates'
                          : 'Dress is NOT AVAILABLE for these dates'}
                      </h5>
                      <p className="mt-1 font-medium leading-relaxed">
                        {modalCheckResult.available
                          ? `This dress is completely open for booking from ${modalStartDate} to ${modalEndDate}.`
                          : modalCheckResult.reason || 'This dress has an existing booking during your requested period.'}
                      </p>

                      {modalCheckResult.available && (
                        <div className="mt-3 pt-3 border-t border-emerald-200/80 flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-emerald-700" />
                          <span className="font-bold text-emerald-800">
                            Ready to reserve? Contact shop staff to secure your booking.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <Info className="h-3.5 w-3.5 text-slate-400" /> Real-time status cross-referenced
              </span>
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
      <footer className="bg-slate-900 text-slate-400 py-6 text-center text-xs border-t border-slate-800 mt-auto">
        <p>© 2026 Dress Rental Shop. All rights reserved.</p>
      </footer>
    </div>
  );
}

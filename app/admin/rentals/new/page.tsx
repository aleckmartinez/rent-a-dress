'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Sparkles, UserPlus, Users, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  getDresses,
  getCustomers,
  findOrCreateCustomer,
  checkDressAvailability,
  createRental
} from '@/lib/services/api';
import { Dress, Customer } from '@/lib/types/database';

export default function NewRentalPage() {
  const router = useRouter();

  // Inventory & Customer Options
  const [dresses, setDresses] = useState<Dress[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Form Mode: 'existing' | 'new'
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('existing');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  // New Customer Fields
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custFacebook, setCustFacebook] = useState('');

  // Rental Order Fields
  const [selectedDressId, setSelectedDressId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pricing Fields
  const [rentalPrice, setRentalPrice] = useState<string>('0');
  const [additionalCharges, setAdditionalCharges] = useState<string>('0');
  const [discount, setDiscount] = useState<string>('0');
  const [notes, setNotes] = useState('');

  // Availability State
  const [availabilityResult, setAvailabilityResult] = useState<{
    checked: boolean;
    available: boolean;
    reason?: string;
  }>({ checked: false, available: true });

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOptions() {
      try {
        const [dList, cList] = await Promise.all([getDresses(), getCustomers()]);
        setDresses(dList);
        setCustomers(cList);
      } catch (err) {
        console.error('Error loading options:', err);
      } finally {
        setLoadingOptions(false);
      }
    }
    loadOptions();
  }, []);

  // When dress changes, auto-populate default rental price (without modifying dress default price)
  const handleDressSelect = (dressId: string) => {
    setSelectedDressId(dressId);
    const dress = dresses.find((d) => d.id === dressId);
    if (dress) {
      setRentalPrice(String(dress.default_price));
    }
  };

  // Availability Check Trigger
  useEffect(() => {
    async function checkAvailability() {
      if (selectedDressId && startDate && endDate) {
        if (endDate < startDate) {
          setAvailabilityResult({
            checked: true,
            available: false,
            reason: 'End Date cannot be before Start Date.'
          });
          return;
        }
        const res = await checkDressAvailability(selectedDressId, startDate, endDate);
        setAvailabilityResult({ checked: true, ...res });
      } else {
        setAvailabilityResult({ checked: false, available: true });
      }
    }
    checkAvailability();
  }, [selectedDressId, startDate, endDate]);

  // Price Calculation: Total = Rental Price + Additional Charges - Discount
  const rPrice = Math.max(0, Number(rentalPrice) || 0);
  const addCharges = Math.max(0, Number(additionalCharges) || 0);
  const disc = Math.max(0, Number(discount) || 0);
  const calculatedTotal = Math.max(0, rPrice + addCharges - disc);

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(p);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedDressId) {
      setFormError('Please select a dress.');
      return;
    }
    if (!startDate || !endDate) {
      setFormError('Please select rental start and end dates.');
      return;
    }
    if (endDate < startDate) {
      setFormError('End date cannot be before start date.');
      return;
    }

    if (!availabilityResult.available) {
      setFormError(availabilityResult.reason || 'Selected dress is unavailable for these dates.');
      return;
    }

    setSubmitting(true);
    try {
      let targetCustomerId = selectedCustomerId;

      if (customerMode === 'new') {
        if (!custName.trim() || !custPhone.trim()) {
          setFormError('Customer Name and Contact Number are required.');
          setSubmitting(false);
          return;
        }
        const newCust = await findOrCreateCustomer({
          full_name: custName.trim(),
          contact_number: custPhone.trim(),
          facebook_url: custFacebook.trim() || null
        });
        targetCustomerId = newCust.id;
      } else {
        if (!targetCustomerId) {
          setFormError('Please select an existing customer or switch to Create Customer.');
          setSubmitting(false);
          return;
        }
      }

      await createRental({
        customer_id: targetCustomerId,
        dress_id: selectedDressId,
        rental_start_date: startDate,
        rental_end_date: endDate,
        rental_price: rPrice,
        additional_charges: addCharges,
        discount: disc,
        notes: notes.trim() || null,
        status: 'confirmed'
      });

      router.push('/admin/rentals');
      router.refresh();
    } catch (err: any) {
      console.error('Error creating rental:', err);
      setFormError(err.message || 'Unable to create rental order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/rentals"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Create Rental Order</h1>
          <p className="text-xs text-slate-500">Record a new dress rental booking and calculate totals</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {formError && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-semibold text-rose-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Box: Customer & Dress Selection */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft flex flex-col gap-5">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">1. Select Dress</h2>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Dress *
              </label>
              <select
                required
                value={selectedDressId}
                onChange={(e) => handleDressSelect(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-800 focus:border-pink-500 focus:bg-white focus:outline-none"
              >
                <option value="">-- Choose a Dress --</option>
                {dresses.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.color}, {d.size}) — {formatPrice(d.default_price)} [{d.operational_status}]
                  </option>
                ))}
              </select>
            </div>

            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 pt-2">
              2. Customer Details
            </h2>

            {/* Toggle Customer Mode */}
            <div className="flex items-center rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setCustomerMode('existing')}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                  customerMode === 'existing'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                Existing Customer
              </button>
              <button
                type="button"
                onClick={() => setCustomerMode('new')}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                  customerMode === 'new'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <UserPlus className="h-3.5 w-3.5 text-pink-600" />
                Create New Customer
              </button>
            </div>

            {customerMode === 'existing' ? (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Select Existing Customer *
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-800 focus:border-pink-500 focus:bg-white focus:outline-none"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.contact_number})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    placeholder="e.g. Maria Santos"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-xs text-slate-800 focus:border-pink-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Contact Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    placeholder="09171234567"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-xs text-slate-800 focus:border-pink-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Facebook URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={custFacebook}
                    onChange={(e) => setCustFacebook(e.target.value)}
                    placeholder="https://facebook.com/username"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-xs text-slate-800 focus:border-pink-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Box: Dates & Price Breakdown */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft flex flex-col justify-between gap-5">
            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                3. Dates & Availability
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Rental Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 focus:border-pink-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Rental End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 focus:border-pink-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Real-time availability indicator badge */}
              {availabilityResult.checked && (
                <div>
                  {availabilityResult.available ? (
                    <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span><strong>AVAILABLE!</strong> No conflicting booking for selected dates.</span>
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{availabilityResult.reason}</span>
                    </div>
                  )}
                </div>
              )}

              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 pt-2">
                4. Pricing Breakdown
              </h2>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Rental Price (₱)</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    required
                    value={rentalPrice}
                    onChange={(e) => setRentalPrice(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 font-semibold focus:border-pink-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Add. Charges (₱)</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={additionalCharges}
                    onChange={(e) => setAdditionalCharges(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 font-semibold focus:border-pink-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Discount (₱)</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 font-semibold focus:border-pink-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Total Calculation Display */}
              <div className="rounded-2xl bg-pink-50/60 border border-pink-100 p-4 flex items-center justify-between mt-2">
                <div className="flex flex-col text-xs text-pink-900 font-medium">
                  <span>Calculation: ₱{rPrice} + ₱{addCharges} - ₱{disc}</span>
                  <span className="text-[10px] text-pink-600 font-semibold uppercase">Total Rental Price</span>
                </div>
                <span className="text-xl font-extrabold text-pink-700">{formatPrice(calculatedTotal)}</span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Deposit details, fitting notes, pickup arrangements..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 focus:border-pink-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Link
                href="/admin/rentals"
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || (availabilityResult.checked && !availabilityResult.available)}
                className="flex items-center gap-2 rounded-xl bg-pink-600 hover:bg-pink-700 disabled:opacity-50 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-colors"
              >
                <Save className="h-4 w-4" />
                {submitting ? 'Confirming Order...' : 'Create Rental Order'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  CalendarCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Wallet,
  Coins,
  MapPin,
  Truck,
  Home
} from 'lucide-react';
import {
  getRentalById,
  updateRental,
  updateRentalStatus,
  updateRentalDeposit,
  getDresses,
  getCustomers,
  checkDressAvailability
} from '@/lib/services/api';
import { Rental, Dress, Customer, RentalOrderStatus, DepositStatus } from '@/lib/types/database';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { formatOrderNumber } from '@/lib/utils/formatters';
import { Modal } from '@/components/ui/Modal';

export default function RentalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [rental, setRental] = useState<Rental | null>(null);
  const [dresses, setDresses] = useState<Dress[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [dressId, setDressId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rentalPrice, setRentalPrice] = useState('0');
  const [additionalCharges, setAdditionalCharges] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [depositAmount, setDepositAmount] = useState('0');
  const [status, setStatus] = useState<RentalOrderStatus>('confirmed');
  const [fulfillmentType, setFulfillmentType] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Availability re-check state
  const [availabilityResult, setAvailabilityResult] = useState<{
    checked: boolean;
    available: boolean;
    reason?: string;
  }>({ checked: false, available: true });

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Deposit Update Modal State
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [targetDepositStatus, setTargetDepositStatus] = useState<DepositStatus>('returned');
  const [returnedAmt, setReturnedAmt] = useState<string>('0');
  const [retainedAmt, setRetainedAmt] = useState<string>('0');
  const [retentionReason, setRetentionReason] = useState<string>('');
  const [depositUpdating, setDepositUpdating] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);

  // Modals
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const loadRentalData = async () => {
    setLoading(true);
    try {
      const [rData, dList, cList] = await Promise.all([
        getRentalById(resolvedParams.id),
        getDresses(),
        getCustomers()
      ]);
      if (rData) {
        setRental(rData);
        setCustomerId(rData.customer_id);
        setDressId(rData.dress_id);
        setStartDate(rData.rental_start_date);
        setEndDate(rData.rental_end_date);
        setRentalPrice(String(rData.rental_price));
        setAdditionalCharges(String(rData.additional_charges));
        setDiscount(String(rData.discount));
        setDepositAmount(String(rData.deposit_amount));
        setStatus(rData.status);
        setFulfillmentType(rData.fulfillment_type || 'pickup');
        setDeliveryAddress(rData.delivery_address || '');
        setNotes(rData.notes || '');

        setTargetDepositStatus(rData.deposit_status);
        setReturnedAmt(String(rData.deposit_returned_amount || rData.deposit_amount));
        setRetainedAmt(String(rData.deposit_retained_amount || 0));
        setRetentionReason(rData.deposit_retention_reason || '');
      }
      setDresses(dList);
      setCustomers(cList);
    } catch (err) {
      console.error('Error loading rental order:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRentalData();
  }, [resolvedParams.id]);

  useEffect(() => {
    async function checkAvailability() {
      if (rental && dressId && startDate && endDate) {
        if (endDate < startDate) {
          setAvailabilityResult({
            checked: true,
            available: false,
            reason: 'End Date cannot be before Start Date.'
          });
          return;
        }
        const res = await checkDressAvailability(dressId, startDate, endDate, rental.id);
        setAvailabilityResult({ checked: true, ...res });
      } else {
        setAvailabilityResult({ checked: false, available: true });
      }
    }
    checkAvailability();
  }, [dressId, startDate, endDate, rental]);

  const rPrice = Math.max(0, Number(rentalPrice) || 0);
  const addCharges = Math.max(0, Number(additionalCharges) || 0);
  const disc = Math.max(0, Number(discount) || 0);
  const depAmount = Math.max(0, Number(depositAmount) || 0);
  const calculatedTotal = Math.max(0, rPrice + addCharges - disc);

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(p);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!availabilityResult.available) {
      setErrorMsg(availabilityResult.reason || 'Selected dress or dates are unavailable.');
      return;
    }

    setSaving(true);
    try {
      const updated = await updateRental(resolvedParams.id, {
        customer_id: customerId,
        dress_id: dressId,
        rental_start_date: startDate,
        rental_end_date: endDate,
        rental_price: rPrice,
        additional_charges: addCharges,
        discount: disc,
        deposit_amount: depAmount,
        status,
        fulfillment_type: fulfillmentType,
        delivery_address: fulfillmentType === 'delivery' ? deliveryAddress.trim() || null : null,
        notes: notes.trim() || null
      });

      setRental(updated);
      await loadRentalData();
    } catch (err: any) {
      console.error('Error saving rental update:', err);
      setErrorMsg(err.message || 'Unable to update rental.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusQuickChange = async (newStatus: RentalOrderStatus) => {
    if (newStatus === 'returned') {
      setReturnModalOpen(true);
      return;
    }
    if (newStatus === 'cancelled') {
      setCancelModalOpen(true);
      return;
    }

    setStatusUpdating(true);
    try {
      const updated = await updateRentalStatus(resolvedParams.id, newStatus);
      setRental(updated);
      setStatus(newStatus);
    } catch (err: any) {
      console.error('Error changing status:', err);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleConfirmReturn = async () => {
    setStatusUpdating(true);
    try {
      const updated = await updateRentalStatus(resolvedParams.id, 'returned');
      setRental(updated);
      setStatus('returned');
      setReturnModalOpen(false);
    } catch (err) {
      console.error('Error marking returned:', err);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleConfirmCancel = async () => {
    setStatusUpdating(true);
    try {
      const updated = await updateRentalStatus(resolvedParams.id, 'cancelled');
      setRental(updated);
      setStatus('cancelled');
      setCancelModalOpen(false);
    } catch (err) {
      console.error('Error cancelling rental:', err);
    } finally {
      setStatusUpdating(false);
    }
  };

  // Open Deposit Modal with preset defaults
  const handleOpenDepositModal = (presetStatus: DepositStatus = 'returned') => {
    if (!rental) return;
    setDepositError(null);
    setTargetDepositStatus(presetStatus);

    if (presetStatus === 'returned') {
      setReturnedAmt(String(rental.deposit_amount));
      setRetainedAmt('0');
    } else if (presetStatus === 'retained') {
      setReturnedAmt('0');
      setRetainedAmt(String(rental.deposit_amount));
    }
    setDepositModalOpen(true);
  };

  const handleProcessDeposit = async () => {
    if (!rental) return;
    setDepositError(null);

    const ret = Number(returnedAmt) || 0;
    const keep = Number(retainedAmt) || 0;

    if (ret < 0 || keep < 0) {
      setDepositError('Amounts cannot be negative.');
      return;
    }

    if (ret + keep > rental.deposit_amount) {
      setDepositError(`Returned (${formatPrice(ret)}) + Retained (${formatPrice(keep)}) exceeds original deposit (${formatPrice(rental.deposit_amount)}).`);
      return;
    }

    if (keep > 0 && !retentionReason.trim()) {
      setDepositError('Please provide a reason for retaining part or all of the deposit.');
      return;
    }

    setDepositUpdating(true);
    try {
      const updated = await updateRentalDeposit(
        rental.id,
        targetDepositStatus,
        ret,
        keep,
        retentionReason.trim() || undefined
      );
      setRental(updated);
      setDepositModalOpen(false);
    } catch (err: any) {
      console.error('Error updating deposit:', err);
      setDepositError(err.message || 'Failed to update deposit.');
    } finally {
      setDepositUpdating(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-xs text-slate-400">Loading rental details...</div>;
  }

  if (!rental) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-base font-bold text-slate-800">Rental Order Not Found</h2>
        <Link href="/admin/rentals" className="mt-4 inline-block text-xs font-semibold text-pink-600">
          ← Return to Rental Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/rentals"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Order {formatOrderNumber(rental.id)}
              </h1>
              <StatusBadge status={rental.status} type="rental" />
              <StatusBadge status={rental.deposit_status} type="deposit" size="sm" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {rental.customer?.full_name} • {rental.dress?.name}
            </p>
          </div>
        </div>

        {/* Quick Lifecycle Actions */}
        <div className="flex items-center gap-2">
          {rental.status !== 'returned' && rental.status !== 'completed' && rental.status !== 'cancelled' && (
            <button
              onClick={() => handleStatusQuickChange('returned')}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-colors"
            >
              <Clock className="h-3.5 w-3.5" />
              Mark Returned
            </button>
          )}

          {rental.status !== 'cancelled' && (
            <button
              onClick={() => setCancelModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
            >
              <XCircle className="h-3.5 w-3.5" />
              Cancel Rental
            </button>
          )}
        </div>
      </div>

      {/* DEPOSIT MANAGEMENT SECTION */}
      <div className="rounded-3xl border border-amber-200/80 bg-amber-50/40 p-6 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 font-bold">
            <Coins className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-amber-950 text-sm">Security Deposit Control</span>
              <StatusBadge status={rental.deposit_status} type="deposit" size="sm" />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-700">
              <span>Deposit Held: <strong>{formatPrice(rental.deposit_amount)}</strong></span>
              <span>Returned: <strong className="text-emerald-700">{formatPrice(rental.deposit_returned_amount)}</strong></span>
              <span>Retained: <strong className="text-indigo-700">{formatPrice(rental.deposit_retained_amount)}</strong></span>
            </div>
            {rental.deposit_retention_reason && (
              <p className="text-[11px] text-amber-800 font-medium italic mt-0.5">
                Note: {rental.deposit_retention_reason}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => handleOpenDepositModal('returned')}
          className="shrink-0 flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors"
        >
          <Coins className="h-4 w-4" />
          Process Deposit
        </button>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {errorMsg && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-semibold text-rose-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft flex flex-col gap-5">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Order Information</h2>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Customer
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-800 focus:border-pink-500 focus:bg-white focus:outline-none"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} ({c.contact_number})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Dress
              </label>
              <select
                value={dressId}
                onChange={(e) => setDressId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-800 focus:border-pink-500 focus:bg-white focus:outline-none"
              >
                {dresses.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.color}, {d.size})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Order Lifecycle Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as RentalOrderStatus)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-800 font-semibold focus:border-pink-500 focus:bg-white focus:outline-none"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="reserved">Reserved</option>
                <option value="on_rent">On Rent</option>
                <option value="returned">Returned</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Fulfillment Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFulfillmentType('pickup')}
                  className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold transition-all ${
                    fulfillmentType === 'pickup'
                      ? 'border-pink-400 bg-pink-50 text-pink-700 shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Home className="h-3.5 w-3.5" /> Pickup
                </button>
                <button
                  type="button"
                  onClick={() => setFulfillmentType('delivery')}
                  className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold transition-all ${
                    fulfillmentType === 'delivery'
                      ? 'border-sky-400 bg-sky-50 text-sky-700 shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Truck className="h-3.5 w-3.5" /> Delivery
                </button>
              </div>
            </div>

            {fulfillmentType === 'delivery' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-sky-700 mb-1 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> Delivery Address
                </label>
                <textarea
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  rows={2}
                  placeholder="Full delivery address..."
                  className="w-full rounded-xl border border-sky-200 bg-sky-50/40 px-3 py-2 text-xs text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Rental Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-800 focus:border-pink-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Right Panel */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft flex flex-col justify-between gap-5">
            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Dates & Pricing</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Start Date
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
                    End Date
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

              {availabilityResult.checked && (
                <div>
                  {availabilityResult.available ? (
                    <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span><strong>AVAILABLE!</strong> Date check passed.</span>
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{availabilityResult.reason}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Rental Price (₱)</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
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

              <div>
                <label className="block text-[11px] font-semibold text-amber-800 mb-1">Deposit Amount (₱)</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full rounded-xl border border-amber-200 bg-amber-50/40 px-3 py-2 text-xs font-bold text-amber-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="rounded-2xl bg-pink-50/60 border border-pink-100 p-4 flex items-center justify-between mt-2">
                <span className="text-xs text-pink-900 font-semibold">Recognized Rental Revenue</span>
                <span className="text-xl font-extrabold text-pink-700">{formatPrice(calculatedTotal)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Link
                href="/admin/rentals"
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Back
              </Link>
              <button
                type="submit"
                disabled={saving || (availabilityResult.checked && !availabilityResult.available)}
                className="flex items-center gap-2 rounded-xl bg-pink-600 hover:bg-pink-700 disabled:opacity-50 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-colors"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving Changes...' : 'Save Order Changes'}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Deposit Processing Modal */}
      <Modal
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        onConfirm={handleProcessDeposit}
        title="Process Security Deposit"
        description={`Original Deposit Amount: ${formatPrice(rental.deposit_amount)}`}
        confirmLabel="Save Deposit Decision"
        isLoading={depositUpdating}
      >
        <div className="flex flex-col gap-4 mt-2">
          {depositError && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs font-semibold text-rose-700">
              {depositError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Deposit Decision Status
            </label>
            <select
              value={targetDepositStatus}
              onChange={(e) => {
                const newSt = e.target.value as DepositStatus;
                setTargetDepositStatus(newSt);
                if (newSt === 'returned') {
                  setReturnedAmt(String(rental.deposit_amount));
                  setRetainedAmt('0');
                } else if (newSt === 'retained') {
                  setReturnedAmt('0');
                  setRetainedAmt(String(rental.deposit_amount));
                }
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-800 focus:border-pink-500 focus:bg-white focus:outline-none"
            >
              <option value="held">Held (Pending Inspection)</option>
              <option value="eligible_for_return">Ready for Return</option>
              <option value="returned">Return Full Deposit</option>
              <option value="partially_retained">Partially Retain Deposit</option>
              <option value="retained">Retain Full Deposit (Damage/Fee)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Amount Returned (₱)</label>
              <input
                type="number"
                min="0"
                max={rental.deposit_amount}
                value={returnedAmt}
                onChange={(e) => {
                  const val = Number(e.target.value) || 0;
                  setReturnedAmt(e.target.value);
                  setRetainedAmt(String(Math.max(0, rental.deposit_amount - val)));
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-semibold text-emerald-800 focus:border-emerald-500 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Amount Retained (₱)</label>
              <input
                type="number"
                min="0"
                max={rental.deposit_amount}
                value={retainedAmt}
                onChange={(e) => {
                  const val = Number(e.target.value) || 0;
                  setRetainedAmt(e.target.value);
                  setReturnedAmt(String(Math.max(0, rental.deposit_amount - val)));
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-semibold text-indigo-800 focus:border-indigo-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Retention Reason / Damage Notes
            </label>
            <textarea
              value={retentionReason}
              onChange={(e) => setRetentionReason(e.target.value)}
              rows={2}
              placeholder="e.g. Fabric tear on hem, late return fee..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 focus:border-pink-500 focus:bg-white focus:outline-none"
            />
          </div>
        </div>
      </Modal>

      {/* Return Workflow Confirmation Modal */}
      <Modal
        isOpen={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
        onConfirm={handleConfirmReturn}
        title="Mark this dress rental as Returned?"
        description="Marking as Returned will transition the dress operational status to CLEANING. It will NOT automatically reset to Available."
        confirmLabel="Confirm Return & Set Status to Cleaning"
        isLoading={statusUpdating}
      />

      {/* Cancel Order Confirmation Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        title="Cancel this rental order?"
        description="Cancelling will release date availability while preserving order history for audit purposes."
        confirmLabel="Cancel Order"
        variant="danger"
        isLoading={statusUpdating}
      />
    </div>
  );
}

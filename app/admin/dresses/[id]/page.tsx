'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Edit3,
  History,
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  Archive,
  Save,
  Shirt,
  Wallet,
  TrendingUp
} from 'lucide-react';
import {
  getDressById,
  updateDressOperationalStatus,
  updateDress,
  getDressStatusHistory,
  getRentals
} from '@/lib/services/api';
import { Dress, DressStatusHistory, Rental, DressOperationalStatus } from '@/lib/types/database';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { PhotoUploader } from '@/components/admin/PhotoUploader';

export default function DressDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditQuery = searchParams.get('edit') === 'true';

  const [dress, setDress] = useState<Dress | null>(null);
  const [history, setHistory] = useState<DressStatusHistory[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(isEditQuery);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('Long Dress');
  const [editColor, setEditColor] = useState('');
  const [editSize, setEditSize] = useState('Medium (M)');
  const [editPrice, setEditPrice] = useState('');
  const [editDeposit, setEditDeposit] = useState('');
  const [editPhoto, setEditPhoto] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Status Change Modal State
  const [selectedNewStatus, setSelectedNewStatus] = useState<DressOperationalStatus | null>(null);
  const [statusReason, setStatusReason] = useState('');
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Archive Modal State
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);

  const loadDressData = async () => {
    setLoading(true);
    try {
      const data = await getDressById(resolvedParams.id);
      if (data) {
        setDress(data);
        setEditName(data.name);
        setEditType(data.dress_type || 'Long Dress');
        setEditColor(data.color);
        setEditSize(data.size);
        setEditPrice(String(data.default_price));
        setEditDeposit(String(data.default_deposit));
        setEditPhoto(data.main_photo_path);

        const [hData, rData] = await Promise.all([
          getDressStatusHistory(data.id),
          getRentals({ dress_id: data.id })
        ]);
        setHistory(hData);
        setRentals(rData);
      }
    } catch (err) {
      console.error('Error loading dress detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDressData();
  }, [resolvedParams.id]);

  const handleStatusChangeClick = (newStatus: DressOperationalStatus) => {
    if (!dress || dress.operational_status === newStatus) return;
    setSelectedNewStatus(newStatus);
    setStatusReason(`Admin manually updated status to ${newStatus.replace('_', ' ')}`);
    setStatusModalOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!dress || !selectedNewStatus) return;
    setStatusUpdating(true);
    try {
      const updated = await updateDressOperationalStatus(dress.id, selectedNewStatus, statusReason);
      setDress(updated);
      setStatusModalOpen(false);
      await loadDressData();
    } catch (err: any) {
      console.error('Error updating status:', err);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dress) return;

    setSavingEdit(true);
    try {
      const updated = await updateDress(dress.id, {
        name: editName.trim(),
        dress_type: editType,
        color: editColor.trim(),
        size: editSize,
        default_price: Number(editPrice),
        default_deposit: Number(editDeposit),
        main_photo_path: editPhoto
      });
      setDress(updated);
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving dress details:', err);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleArchiveConfirm = async () => {
    if (!dress) return;
    try {
      await updateDressOperationalStatus(dress.id, 'archived', 'Archived by administrator');
      router.push('/admin/dresses');
    } catch (err) {
      console.error('Archive error:', err);
    }
  };

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(p);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return <div className="py-12 text-center text-xs text-slate-400">Loading dress details...</div>;
  }

  if (!dress) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-base font-bold text-slate-800">Dress Not Found</h2>
        <Link href="/admin/dresses" className="mt-4 inline-block text-xs font-semibold text-pink-600">
          ← Return to Dress Catalog
        </Link>
      </div>
    );
  }

  const allStatuses: DressOperationalStatus[] = [
    'available',
    'reserved',
    'on_rent',
    'cleaning',
    'inspection',
    'preparing',
    'repair',
    'unavailable'
  ];

  // Dress-level financial metrics
  const totalRentalRevenue = rentals
    .filter((r) => r.status !== 'cancelled')
    .reduce((sum, r) => sum + Number(r.rental_price || 0), 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/dresses"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{dress.name}</h1>
              <StatusBadge status={dress.operational_status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {dress.color} • {dress.size} • Rate: {formatPrice(dress.default_price)} • Deposit: {formatPrice(dress.default_deposit)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Edit3 className="h-3.5 w-3.5 text-pink-600" />
            {isEditing ? 'Cancel Editing' : 'Edit Details'}
          </button>
          <button
            onClick={() => setArchiveModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
          >
            <Archive className="h-3.5 w-3.5" />
            Archive
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Photo & Details / Edit Form */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-soft">
            {isEditing ? (
              <form onSubmit={handleSaveEdit} className="flex flex-col gap-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
                  Edit Dress Details & Pricing
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Dress Photo</label>
                  <PhotoUploader value={editPhoto} onChange={setEditPhoto} disabled={savingEdit} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-pink-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Dress Type / Category</label>
                    <select
                      value={editType}
                      onChange={(e) => setEditType(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-pink-500 focus:bg-white focus:outline-none"
                    >
                      <option value="Long Dress">Long Dress</option>
                      <option value="Short Dress">Short Dress</option>
                      <option value="Evening Gown">Evening Gown</option>
                      <option value="Cocktail Dress">Cocktail Dress</option>
                      <option value="Ball Gown">Ball Gown</option>
                      <option value="Midi Dress">Midi Dress</option>
                      <option value="Prom Dress">Prom Dress</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Color</label>
                    <input
                      type="text"
                      required
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-pink-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Size</label>
                  <select
                    value={editSize}
                    onChange={(e) => setEditSize(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-pink-500 focus:bg-white focus:outline-none"
                  >
                    <option value="XS / Extra Small">XS / Extra Small</option>
                    <option value="Small (S)">Small (S)</option>
                    <option value="Medium (M)">Medium (M)</option>
                    <option value="Large (L)">Large (L)</option>
                    <option value="XL / Extra Large">XL / Extra Large</option>
                    <option value="Free Size">Free Size</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Rental Rate (₱)</label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      required
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-pink-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Deposit (₱)</label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      required
                      value={editDeposit}
                      onChange={(e) => setEditDeposit(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-pink-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingEdit}
                  className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-pink-600 hover:bg-pink-700 py-2.5 text-xs font-bold text-white shadow-sm transition-colors"
                >
                  <Save className="h-4 w-4" />
                  {savingEdit ? 'Saving Changes...' : 'Save Details'}
                </button>
              </form>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-slate-100 border border-slate-200">
                  {dress.main_photo_path ? (
                    <img src={dress.main_photo_path} alt={dress.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center text-slate-400">
                      <Shirt className="h-12 w-12 text-pink-300 mb-1" />
                      <span className="text-xs">No Photo</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Dress Type</span>
                    <span className="font-bold text-pink-700 bg-pink-50 px-2 py-0.5 rounded border border-pink-100">{dress.dress_type || 'Long Dress'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Color</span>
                    <span className="font-semibold">{dress.color}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Size</span>
                    <span className="font-semibold">{dress.size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Default Rental Rate</span>
                    <span className="font-extrabold text-pink-600">{formatPrice(dress.default_price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Default Deposit</span>
                    <span className="font-bold text-slate-800">{formatPrice(dress.default_deposit)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dress Level Financial Insights Card */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-soft flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase">Dress Rental Performance</h3>
            </div>

            <div className="flex flex-col gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Bookings</span>
                <span className="font-bold text-slate-900">{rentals.length} Orders</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Revenue Generated</span>
                <span className="font-extrabold text-emerald-600">{formatPrice(totalRentalRevenue)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Operational Status & Audit Logs */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Status Switcher */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Change Operational Status</h3>
                <p className="text-xs text-slate-500">
                  Physical condition status controls date availability for bookings.
                </p>
              </div>
              <StatusBadge status={dress.operational_status} />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {allStatuses.map((st) => {
                const isActive = dress.operational_status === st;
                return (
                  <button
                    key={st}
                    onClick={() => handleStatusChangeClick(st)}
                    disabled={isActive}
                    className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/10 cursor-default'
                        : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-pink-50 hover:border-pink-200 hover:text-pink-700'
                    }`}
                  >
                    {st.replace('_', ' ').toUpperCase()}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 p-3.5 text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Important Rule:</strong> Returning a dress sets its status to Cleaning. It will{' '}
                <strong>NEVER</strong> automatically reset to Available. An administrator must manually select{' '}
                <strong className="underline">AVAILABLE</strong> here when it is inspected and ready.
              </span>
            </div>
          </div>

          {/* Audit History Log */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <History className="h-4 w-4 text-pink-600" />
              <h3 className="text-sm font-bold text-slate-900">Status Change Audit History</h3>
            </div>

            <div className="mt-4 flex flex-col gap-3 max-h-60 overflow-y-auto pr-1">
              {history.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No status change history recorded yet.</p>
              ) : (
                history.map((h) => (
                  <div
                    key={h.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl border border-slate-100 bg-slate-50/50 p-3 text-xs"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 font-medium text-slate-800">
                        <span className="text-slate-400">{h.old_status ? h.old_status.replace('_', ' ') : 'None'}</span>
                        <span className="text-slate-300">→</span>
                        <span className="font-bold text-pink-600">{h.new_status.replace('_', ' ')}</span>
                      </div>
                      {h.reason && <p className="text-[11px] text-slate-500 mt-0.5">Reason: {h.reason}</p>}
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">{formatDate(h.changed_at)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Associated Rentals */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-pink-600" />
                <h3 className="text-sm font-bold text-slate-900">Dress Rental History</h3>
              </div>
              <span className="text-xs font-semibold text-slate-400">{rentals.length} Bookings</span>
            </div>

            <div className="mt-4 overflow-x-auto">
              {rentals.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No rentals recorded for this dress yet.</p>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase">
                      <th className="pb-2">Customer</th>
                      <th className="pb-2">Rental Period</th>
                      <th className="pb-2">Price</th>
                      <th className="pb-2">Deposit</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rentals.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 font-medium text-slate-800">{r.customer?.full_name || 'Customer'}</td>
                        <td className="py-2.5 text-slate-600">
                          {r.rental_start_date} to {r.rental_end_date}
                        </td>
                        <td className="py-2.5 font-bold text-slate-900">{formatPrice(r.total_price)}</td>
                        <td className="py-2.5 font-medium text-slate-600">{formatPrice(r.deposit_amount)}</td>
                        <td className="py-2.5">
                          <StatusBadge status={r.status} type="rental" size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Status Change */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        onConfirm={handleConfirmStatusChange}
        title={`Change status to ${selectedNewStatus?.replace('_', ' ').toUpperCase()}?`}
        description="This operational status change will be recorded in the audit log."
        confirmLabel="Update Operational Status"
        isLoading={statusUpdating}
      >
        <div className="mt-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1">Reason / Operational Notes</label>
          <textarea
            value={statusReason}
            onChange={(e) => setStatusReason(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 focus:border-pink-500 focus:bg-white focus:outline-none"
            placeholder="e.g. Returned from event, dry cleaning complete..."
          />
        </div>
      </Modal>

      {/* Archive Modal */}
      <Modal
        isOpen={archiveModalOpen}
        onClose={() => setArchiveModalOpen(false)}
        onConfirm={handleArchiveConfirm}
        title="Archive this dress?"
        description="Archiving will remove the dress from active inventory and public availability while preserving historical rental records."
        confirmLabel="Archive Dress"
        variant="danger"
      />
    </div>
  );
}

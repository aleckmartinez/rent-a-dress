'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Edit3, CalendarCheck, ExternalLink, MapPin, Phone, User } from 'lucide-react';
import { getCustomerById, updateCustomer, getRentals } from '@/lib/services/api';
import { Customer, Rental } from '@/lib/types/database';
import { StatusBadge } from '@/components/admin/StatusBadge';

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Form State
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [facebook, setFacebook] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cData, rData] = await Promise.all([
        getCustomerById(resolvedParams.id),
        getRentals({ customer_id: resolvedParams.id })
      ]);
      if (cData) {
        setCustomer(cData);
        setName(cData.full_name);
        setPhone(cData.contact_number);
        setAddress(cData.address || '');
        setFacebook(cData.facebook_url || '');
        setNotes(cData.notes || '');
      }
      setRentals(rData);
    } catch (err) {
      console.error('Error loading customer details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [resolvedParams.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;
    setSaving(true);
    try {
      const updated = await updateCustomer(customer.id, {
        full_name: name,
        contact_number: phone,
        address: address.trim() || null,
        facebook_url: facebook || null,
        notes: notes || null
      });
      setCustomer(updated);
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating customer:', err);
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(p);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  if (loading) {
    return <div className="py-12 text-center text-xs text-slate-400">Loading customer profile...</div>;
  }

  if (!customer) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-base font-bold text-slate-800">Customer Not Found</h2>
        <Link href="/admin/customers" className="mt-4 inline-block text-xs font-semibold text-pink-600">
          ← Return to Customers List
        </Link>
      </div>
    );
  }

  const totalSpend = rentals
    .filter((r) => r.status !== 'cancelled')
    .reduce((sum, r) => sum + Number(r.total_price || 0), 0);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/customers"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{customer.full_name}</h1>
            <p className="text-xs text-slate-500">{customer.contact_number}
              {customer.address && <span className="ml-2 text-slate-400">• {customer.address}</span>}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Edit3 className="h-3.5 w-3.5 text-pink-600" />
          {isEditing ? 'Cancel Editing' : 'Edit Profile'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Customer Profile Box */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft">
            {isEditing ? (
              <form onSubmit={handleSave} className="flex flex-col gap-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
                  Edit Customer Info
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-pink-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Contact Number *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-pink-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Address</label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={2}
                    placeholder="Street, Barangay, City, Province"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-pink-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Facebook URL</label>
                  <input
                    type="url"
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-pink-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Customer Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 focus:border-pink-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-pink-600 hover:bg-pink-700 py-2 text-xs font-bold text-white shadow-sm transition-colors"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </form>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-100 text-pink-700 font-bold text-base">
                    {customer.full_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{customer.full_name}</h3>
                    <p className="text-xs text-slate-500">{customer.contact_number}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold uppercase text-[10px] flex items-center gap-1">
                      <Phone className="h-3 w-3" /> Contact Number
                    </span>
                    <p className="text-slate-800 font-semibold mt-0.5">{customer.contact_number}</p>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold uppercase text-[10px] flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Address
                    </span>
                    <p className="text-slate-800 mt-0.5 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100 leading-relaxed">
                      {customer.address || <span className="text-slate-400 italic">No address on file</span>}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold uppercase text-[10px] block">Facebook Profile</span>
                    {customer.facebook_url ? (
                      <a
                        href={customer.facebook_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-pink-600 hover:underline font-medium mt-0.5"
                      >
                        Visit Facebook <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-slate-400">Not provided</span>
                    )}
                  </div>

                  <div className="pt-2">
                    <span className="text-slate-400 font-semibold uppercase text-[10px] block">Customer Notes</span>
                    <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 mt-1 leading-relaxed">
                      {customer.notes || 'No customer notes recorded.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stats Card */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-soft flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-100 pb-2">
              Customer Summary
            </h3>
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Orders</span>
                <span className="font-bold text-slate-900">{rentals.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Spend</span>
                <span className="font-extrabold text-pink-600">{formatPrice(totalSpend)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Rental History */}
        <div className="lg:col-span-2">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-pink-600" />
                <h3 className="text-sm font-bold text-slate-900">Rental History</h3>
              </div>
              <span className="text-xs font-semibold text-slate-400">{rentals.length} Orders</span>
            </div>

            <div className="mt-4 overflow-x-auto">
              {rentals.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4">No rental orders recorded for this customer.</p>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase">
                      <th className="pb-2">Dress</th>
                      <th className="pb-2">Dates</th>
                      <th className="pb-2">Fulfillment</th>
                      <th className="pb-2">Total</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rentals.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/50">
                        <td className="py-3 font-medium text-slate-800">
                          <Link href={`/admin/rentals/${r.id}`} className="hover:text-pink-600 transition-colors">
                            {r.dress?.name || 'Dress'}
                          </Link>
                        </td>
                        <td className="py-3 text-slate-600">
                          {formatDate(r.rental_start_date)} – {formatDate(r.rental_end_date)}
                        </td>
                        <td className="py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                            r.fulfillment_type === 'delivery'
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {r.fulfillment_type === 'delivery' ? '🚚 Delivery' : '🏠 Pickup'}
                          </span>
                        </td>
                        <td className="py-3 font-bold text-slate-900">{formatPrice(r.total_price)}</td>
                        <td className="py-3">
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
    </div>
  );
}

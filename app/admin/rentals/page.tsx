'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, CalendarCheck, Edit3 } from 'lucide-react';
import { getRentals, getDresses } from '@/lib/services/api';
import { Rental, Dress } from '@/lib/types/database';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { formatOrderNumber, formatPrice } from '@/lib/utils/formatters';

export default function AdminRentalsPage() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [dresses, setDresses] = useState<Dress[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState('all');
  const [dressFilter, setDressFilter] = useState('all');
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [rData, dData] = await Promise.all([
        getRentals({
          status: statusFilter,
          dress_id: dressFilter !== 'all' ? dressFilter : undefined,
          search
        }),
        getDresses()
      ]);
      setRentals(rData);
      setDresses(dData);
    } catch (err) {
      console.error('Error fetching rentals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, dressFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Rental Orders</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage customer bookings, dates, and order lifecycle</p>
        </div>

        <Link
          href="/admin/rentals/new"
          className="flex items-center justify-center gap-1.5 rounded-xl bg-pink-600 hover:bg-pink-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Rental Order
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-soft flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by order #, customer name, or dress name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs text-slate-800 focus:border-pink-500 focus:bg-white focus:outline-none transition-colors"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1 text-slate-400 font-medium">
            <Filter className="h-3.5 w-3.5" />
            <span>Filters:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 focus:border-pink-500 focus:outline-none"
          >
            <option value="all">All Rental Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="reserved">Reserved</option>
            <option value="on_rent">On Rent</option>
            <option value="returned">Returned</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={dressFilter}
            onChange={(e) => setDressFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 focus:border-pink-500 focus:outline-none"
          >
            <option value="all">All Dresses</option>
            {dresses.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Rentals Table Card */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading rentals...</div>
        ) : rentals.length === 0 ? (
          <div className="py-12 text-center">
            <CalendarCheck className="h-10 w-10 text-pink-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No rental orders found</h3>
            <p className="text-xs text-slate-500 mt-1">Create a new rental order to get started.</p>
            <Link
              href="/admin/rentals/new"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-pink-600 hover:bg-pink-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create First Rental
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 px-3">Order #</th>
                  <th className="pb-3 px-3">Customer</th>
                  <th className="pb-3 px-3">Dress</th>
                  <th className="pb-3 px-3">Start Date</th>
                  <th className="pb-3 px-3">End Date</th>
                  <th className="pb-3 px-3">Fulfillment</th>
                  <th className="pb-3 px-3">Total Price</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rentals.map((rental, idx) => (
                  <tr key={rental.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3">
                      <Link
                        href={`/admin/rentals/${rental.id}`}
                        className="font-extrabold text-pink-600 hover:underline"
                      >
                        {formatOrderNumber(rental.id, rentals.length - 1 - idx)}
                      </Link>
                    </td>
                    <td className="py-3 px-3">
                      <Link
                        href={`/admin/customers/${rental.customer_id}`}
                        className="font-bold text-slate-900 hover:text-pink-600"
                      >
                        {rental.customer?.full_name || 'Customer'}
                      </Link>
                      {rental.customer?.contact_number && (
                        <span className="block text-[10px] text-slate-400">{rental.customer.contact_number}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800">
                      {rental.dress?.name || 'Dress'}
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-medium">{rental.rental_start_date}</td>
                    <td className="py-3 px-3 text-slate-600 font-medium">{rental.rental_end_date}</td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                        rental.fulfillment_type === 'delivery'
                          ? 'bg-sky-50 text-sky-700 border-sky-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {rental.fulfillment_type === 'delivery' ? '🚚 Delivery' : '🏠 Pickup'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-extrabold text-slate-900">{formatPrice(rental.total_price)}</td>
                    <td className="py-3 px-3">
                      <StatusBadge status={rental.status} type="rental" size="sm" />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/rentals/${rental.id}`}
                          className="flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-pink-50 hover:text-pink-700 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition-colors"
                        >
                          <Edit3 className="h-3 w-3" />
                          View / Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

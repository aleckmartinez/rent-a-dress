'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Shirt,
  CalendarCheck,
  Users,
  Sparkles,
  Plus,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  Coins
} from 'lucide-react';
import { getDresses, getRentals, getCustomers, getFinanceSummary } from '@/lib/services/api';
import { Dress, Rental, Customer, FinanceSummary } from '@/lib/types/database';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { formatOrderNumber } from '@/lib/utils/formatters';

export default function AdminDashboardPage() {
  const [dresses, setDresses] = useState<Dress[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [finSummary, setFinSummary] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [dList, rList, cList, fSum] = await Promise.all([
          getDresses(),
          getRentals(),
          getCustomers(),
          getFinanceSummary('this_month')
        ]);
        setDresses(dList);
        setRentals(rList);
        setCustomers(cList);
        setFinSummary(fSum);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalDresses = dresses.length;
  const availableDresses = dresses.filter((d) => d.operational_status === 'available').length;
  const onRentDresses = dresses.filter((d) => d.operational_status === 'on_rent').length;
  const cleaningPreparing = dresses.filter(
    (d) => d.operational_status === 'cleaning' || d.operational_status === 'preparing' || d.operational_status === 'inspection'
  ).length;
  const totalCustomers = customers.length;

  const upcomingRentals = rentals.slice(0, 5);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(price);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">Rental business overview, operational inventory & monthly finances</p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/rentals/new"
            className="flex items-center gap-1.5 rounded-xl bg-pink-600 hover:bg-pink-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Rental Order
          </Link>
          <Link
            href="/admin/dresses/new"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Plus className="h-4 w-4 text-pink-600" />
            Add Dress
          </Link>
        </div>
      </div>

      {/* Inventory & Operational KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Dresses</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <Shirt className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900">{loading ? '...' : totalDresses}</p>
          <p className="text-[11px] text-slate-400 mt-1">In inventory</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-emerald-600">{loading ? '...' : availableDresses}</p>
          <p className="text-[11px] text-slate-400 mt-1">Ready for booking</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">On Rent</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-pink-100 text-pink-600">
              <Sparkles className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-pink-600">{loading ? '...' : onRentDresses}</p>
          <p className="text-[11px] text-slate-400 mt-1">Currently out</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cleaning / Prep</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-indigo-600">{loading ? '...' : cleaningPreparing}</p>
          <p className="text-[11px] text-slate-400 mt-1">Pending release</p>
        </div>

        <div className="col-span-2 lg:col-span-1 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Customers</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900">{loading ? '...' : totalCustomers}</p>
          <p className="text-[11px] text-slate-400 mt-1">Customer profiles</p>
        </div>
      </div>

      {/* Financial Summary Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Earnings (This Month)</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-xl font-extrabold text-emerald-600">
            {loading ? '...' : formatPrice(finSummary?.recognized_revenue || 0)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Deposit Refunds</span>
            <RotateCcw className="h-4 w-4 text-sky-600" />
          </div>
          <p className="mt-2 text-xl font-extrabold text-sky-700">
            {loading ? '...' : formatPrice(finSummary?.refunded_deposits || 0)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">On-Hold Deposits</span>
            <Coins className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-xl font-extrabold text-amber-700">
            {loading ? '...' : formatPrice(finSummary?.on_hold_deposits || 0)}
          </p>
        </div>
      </div>

      {/* Upcoming Rentals Section */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Upcoming Rental Schedule</h2>
            <p className="text-xs text-slate-500">Recent & upcoming customer bookings</p>
          </div>
          <Link
            href="/admin/rentals"
            className="flex items-center gap-1 text-xs font-bold text-pink-600 hover:text-pink-700"
          >
            View All Orders
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading schedules...</div>
          ) : upcomingRentals.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No rental orders recorded yet.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="pb-3 px-2">Order #</th>
                  <th className="pb-3 px-2">Customer</th>
                  <th className="pb-3 px-2">Dress</th>
                  <th className="pb-3 px-2">Rental Period</th>
                  <th className="pb-3 px-2">Total Price</th>
                  <th className="pb-3 px-2">Deposit</th>
                  <th className="pb-3 px-2">Status</th>
                  <th className="pb-3 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {upcomingRentals.map((rental, idx) => (
                  <tr key={rental.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-2 font-extrabold text-pink-600">
                      <Link href={`/admin/rentals/${rental.id}`} className="hover:underline">
                        {formatOrderNumber(rental.id, idx)}
                      </Link>
                    </td>
                    <td className="py-3 px-2 font-semibold text-slate-900">
                      {rental.customer?.full_name || 'Customer'}
                    </td>
                    <td className="py-3 px-2 text-slate-700 font-medium">
                      {rental.dress?.name || 'Dress'}
                    </td>
                    <td className="py-3 px-2 text-slate-600">
                      {formatDate(rental.rental_start_date)} — {formatDate(rental.rental_end_date)}
                    </td>
                    <td className="py-3 px-2 font-bold text-slate-900">
                      {formatPrice(rental.total_price)}
                    </td>
                    <td className="py-3 px-2 font-medium text-slate-700">
                      {formatPrice(rental.deposit_amount)}
                    </td>
                    <td className="py-3 px-2">
                      <StatusBadge status={rental.status} type="rental" size="sm" />
                    </td>
                    <td className="py-3 px-2 text-right">
                      <Link
                        href={`/admin/rentals/${rental.id}`}
                        className="rounded-lg bg-slate-100 hover:bg-pink-50 hover:text-pink-700 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition-colors"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

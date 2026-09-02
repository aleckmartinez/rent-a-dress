'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Coins,
  Calendar,
  ArrowUpRight,
  RotateCcw,
  ShieldAlert
} from 'lucide-react';
import {
  getFinanceSummary,
  getFinancialTransactions
} from '@/lib/services/api';
import { FinanceSummary, FinancialTransaction } from '@/lib/types/database';

export default function AdminFinancePage() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [dateRange, setDateRange] = useState('30_days');

  const loadFinanceData = async () => {
    setLoading(true);
    try {
      const [sumData, txData] = await Promise.all([
        getFinanceSummary(dateRange),
        getFinancialTransactions()
      ]);
      setSummary(sumData);
      setTransactions(txData);
    } catch (err) {
      console.error('Error loading financial data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinanceData();
  }, [dateRange]);

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(p);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Finance & Earnings</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Rental earnings, deposit refunds, and on-hold security deposits tracking
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Range Picker Dropdown */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-sm">
            <Calendar className="h-3.5 w-3.5 text-pink-600" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent focus:outline-none font-semibold text-slate-800 cursor-pointer"
            >
              <option value="7_days">Last 7 Days</option>
              <option value="30_days">Last 30 Days</option>
              <option value="this_month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="this_year">This Year</option>
              <option value="all_time">All Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Date Filter Indicator Banner */}
      <div className="flex items-center justify-between text-xs text-slate-500 bg-white px-5 py-3 rounded-2xl border border-slate-200/80 shadow-soft">
        <span className="font-semibold text-slate-800">
          Financial Period: <span className="text-pink-600">{summary?.date_range_label || 'Loading...'}</span>
        </span>
        <span className="text-[11px] text-slate-400 flex items-center gap-1">
          <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
          On-hold security deposits are tracked separately as liabilities
        </span>
      </div>

      {/* KPI Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total Earnings Card */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Gross Earnings</span>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold text-slate-900">
              {loading ? '...' : formatPrice(summary?.recognized_revenue || 0)}
            </p>
            <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <ArrowUpRight className="h-3.5 w-3.5" />
              Rentals + Add-ons + Retained Deposits
            </p>
          </div>
        </div>

        {/* Total Deposit Refunds Card */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Deposit Refunds</span>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
              <RotateCcw className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold text-sky-700">
              {loading ? '...' : formatPrice(summary?.refunded_deposits || 0)}
            </p>
            <p className="text-xs text-slate-400 mt-1">Returned back to customers upon dress return</p>
          </div>
        </div>

        {/* On-Hold Deposits Card */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">On-Hold Deposits</span>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
              <Coins className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold text-amber-700">
              {loading ? '...' : formatPrice(summary?.on_hold_deposits || 0)}
            </p>
            <p className="text-xs text-amber-700 font-medium mt-1">Active refundable security deposits held</p>
          </div>
        </div>
      </div>

      {/* Revenue & Deposits Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings Breakdown */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Earnings Breakdown</h3>
            <span className="text-xs font-bold text-emerald-600">
              Total: {formatPrice(summary?.recognized_revenue || 0)}
            </span>
          </div>

          <div className="flex flex-col gap-3 text-xs">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="font-semibold text-slate-700">Rental Fee Revenue</span>
              <span className="font-extrabold text-slate-900">
                {formatPrice(summary?.rental_revenue || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="font-semibold text-slate-700">Additional Charges & Services</span>
              <span className="font-extrabold text-slate-900">
                {formatPrice(summary?.additional_charges || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100">
              <div>
                <span className="font-semibold text-indigo-900 block">Retained Deposits</span>
                <span className="text-[10px] text-indigo-600 font-medium">Converted to income from damage/late fees</span>
              </div>
              <span className="font-extrabold text-indigo-700">
                {formatPrice(summary?.retained_deposits || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Deposit Summary Box */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Deposit Management Overview</h3>
            <span className="text-xs font-bold text-amber-700">
              On-Hold: {formatPrice(summary?.on_hold_deposits || 0)}
            </span>
          </div>

          <div className="flex flex-col gap-3 text-xs">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200">
              <div>
                <span className="font-semibold text-amber-900 block">Current On-Hold Deposits</span>
                <span className="text-[10px] text-amber-700">Held for active and reserved rentals</span>
              </div>
              <span className="font-extrabold text-amber-900">
                {formatPrice(summary?.on_hold_deposits || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-sky-50/60 border border-sky-100">
              <div>
                <span className="font-semibold text-sky-900 block">Returned Deposits</span>
                <span className="text-[10px] text-sky-600">Refunded back to customers</span>
              </div>
              <span className="font-extrabold text-sky-700">
                {formatPrice(summary?.refunded_deposits || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100">
              <div>
                <span className="font-semibold text-indigo-900 block">Retained / Forfeited Deposits</span>
                <span className="text-[10px] text-indigo-600">Retained due to damages/late fees</span>
              </div>
              <span className="font-extrabold text-indigo-700">
                {formatPrice(summary?.retained_deposits || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Audit Ledger Table */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Financial Audit Ledger</h3>
            <p className="text-xs text-slate-500">Traceable history of all earnings and deposit transactions</p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          {transactions.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-8 text-center">No financial transactions recorded.</p>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 px-3">Date</th>
                  <th className="pb-3 px-3">Type</th>
                  <th className="pb-3 px-3">Category</th>
                  <th className="pb-3 px-3">Description</th>
                  <th className="pb-3 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => {
                  const isEarnings = tx.transaction_type === 'income' || tx.transaction_type === 'deposit_retained';
                  const isReturned = tx.transaction_type === 'deposit_returned';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 text-slate-600 font-medium whitespace-nowrap">
                        {formatDate(tx.transaction_date)}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                            isEarnings
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isReturned
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {tx.transaction_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">{tx.category}</td>
                      <td className="py-3 px-3 text-slate-600">{tx.description}</td>
                      <td
                        className={`py-3 px-3 text-right font-extrabold ${
                          isEarnings ? 'text-emerald-600' : isReturned ? 'text-sky-700' : 'text-amber-800'
                        }`}
                      >
                        {isEarnings ? '+' : ''}
                        {formatPrice(tx.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

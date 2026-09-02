'use client';

import React, { useState, useEffect } from 'react';
import {
  Wallet,
  TrendingUp,
  Receipt,
  Coins,
  Plus,
  Filter,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Tag,
  CheckCircle2
} from 'lucide-react';
import {
  getFinanceSummary,
  getExpenses,
  createExpense,
  getFinancialTransactions
} from '@/lib/services/api';
import { FinanceSummary, Expense, FinancialTransaction } from '@/lib/types/database';
import { Modal } from '@/components/ui/Modal';

export default function AdminFinancePage() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [dateRange, setDateRange] = useState('30_days');

  // Expense Modal State
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expCategory, setExpCategory] = useState('Cleaning');
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expRef, setExpRef] = useState('');
  const [expNotes, setExpNotes] = useState('');
  const [expSubmitting, setExpSubmitting] = useState(false);
  const [expError, setExpError] = useState<string | null>(null);

  const loadFinanceData = async () => {
    setLoading(true);
    try {
      const [sumData, expData, txData] = await Promise.all([
        getFinanceSummary(dateRange),
        getExpenses(),
        getFinancialTransactions()
      ]);
      setSummary(sumData);
      setExpenses(expData);
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

  const handleAddExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setExpError(null);

    if (!expDesc.trim() || !expAmount || Number(expAmount) <= 0) {
      setExpError('Please provide a description and a valid expense amount (> 0).');
      return;
    }

    setExpSubmitting(true);
    try {
      await createExpense({
        category: expCategory,
        description: expDesc.trim(),
        amount: Number(expAmount),
        expense_date: expDate,
        receipt_reference: expRef.trim() || null,
        notes: expNotes.trim() || null
      });

      setExpenseModalOpen(false);
      setExpDesc('');
      setExpAmount('');
      setExpRef('');
      setExpNotes('');
      await loadFinanceData();
    } catch (err: any) {
      console.error('Error creating expense:', err);
      setExpError(err.message || 'Failed to save expense.');
    } finally {
      setExpSubmitting(false);
    }
  };

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(p);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Finance & Accounting</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Revenue recognition, business expense tracking, and held deposit liabilities
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Range Picker Dropdown */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm">
            <Calendar className="h-3.5 w-3.5 text-pink-600" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent focus:outline-none font-semibold text-slate-800"
            >
              <option value="7_days">Last 7 Days</option>
              <option value="30_days">Last 30 Days</option>
              <option value="this_month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="this_year">This Year</option>
              <option value="all_time">All Time</option>
            </select>
          </div>

          <button
            onClick={() => setExpenseModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-pink-600 hover:bg-pink-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            Record Expense
          </button>
        </div>
      </div>

      {/* Date Filter Indicator Banner */}
      <div className="flex items-center justify-between text-xs text-slate-500 bg-white px-5 py-2.5 rounded-2xl border border-slate-200/80 shadow-soft">
        <span className="font-semibold text-slate-800">
          Financial Period: <span className="text-pink-600">{summary?.date_range_label || 'Loading...'}</span>
        </span>
        <span className="text-[11px] text-slate-400">
          Note: Refundable held deposits are excluded from revenue totals
        </span>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Recognized Revenue */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recognized Revenue</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900">
            {loading ? '...' : formatPrice(summary?.recognized_revenue || 0)}
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <ArrowUpRight className="h-3.5 w-3.5" />
            Rentals + Add-ons + Retained Deposits
          </p>
        </div>

        {/* Total Expenses */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Expenses</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
              <Receipt className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-extrabold text-rose-600">
            {loading ? '...' : formatPrice(summary?.total_expenses || 0)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Dress purchases & operations</p>
        </div>

        {/* Net Income */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Income</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-pink-100 text-pink-600">
              <Wallet className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-extrabold text-pink-600">
            {loading ? '...' : formatPrice(summary?.net_income || 0)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Recognized Revenue - Expenses</p>
        </div>

        {/* Deposits Held */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Deposits Currently Held</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
              <Coins className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-extrabold text-amber-700">
            {loading ? '...' : formatPrice(summary?.deposits_held || 0)}
          </p>
          <p className="text-[11px] text-amber-700 font-medium mt-1">Refundable customer liabilities</p>
        </div>
      </div>

      {/* Revenue & Expense Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Recognized Revenue Breakdown</h3>
            <span className="text-xs font-bold text-emerald-600">
              Total: {formatPrice(summary?.recognized_revenue || 0)}
            </span>
          </div>

          <div className="flex flex-col gap-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="font-semibold text-slate-700">Rental Revenue</span>
              <span className="font-extrabold text-slate-900">
                {formatPrice(summary?.rental_revenue || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="font-semibold text-slate-700">Additional Charges</span>
              <span className="font-extrabold text-slate-900">
                {formatPrice(summary?.additional_charges || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100">
              <div>
                <span className="font-semibold text-indigo-900 block">Retained Deposits</span>
                <span className="text-[10px] text-indigo-600 font-medium">Converted from damage/late fees</span>
              </div>
              <span className="font-extrabold text-indigo-700">
                {formatPrice(summary?.retained_deposits || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Expenses by Category</h3>
            <span className="text-xs font-bold text-rose-600">
              Total: {formatPrice(summary?.total_expenses || 0)}
            </span>
          </div>

          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1 text-xs">
            {summary?.expenses_by_category.length === 0 ? (
              <p className="text-slate-400 italic py-4 text-center">No recorded expenses in this period.</p>
            ) : (
              summary?.expenses_by_category.map((cat) => (
                <div
                  key={cat.category}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <span className="font-semibold text-slate-700">{cat.category}</span>
                  <span className="font-bold text-rose-600">{formatPrice(cat.amount)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Financial Transactions Audit Ledger Table */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Financial Audit Ledger</h3>
            <p className="text-xs text-slate-500">Traceable history of all income, expenses, and deposit movements</p>
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
                  const isIncome = tx.transaction_type === 'income' || tx.transaction_type === 'deposit_retained';
                  const isExpense = tx.transaction_type === 'expense';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 text-slate-600 font-medium whitespace-nowrap">
                        {formatDate(tx.transaction_date)}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            isIncome
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isExpense
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
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
                          isIncome ? 'text-emerald-600' : isExpense ? 'text-rose-600' : 'text-slate-700'
                        }`}
                      >
                        {isIncome ? '+' : isExpense ? '-' : ''}
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

      {/* Record Expense Modal */}
      <Modal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        onConfirm={handleAddExpenseSubmit as any}
        title="Record Business Expense"
        description="Add operational costs like dry cleaning, dress purchases, or repairs."
        confirmLabel="Save Expense"
        isLoading={expSubmitting}
      >
        <form onSubmit={handleAddExpenseSubmit} className="flex flex-col gap-4 mt-2">
          {expError && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs font-semibold text-rose-700">
              {expError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Category *</label>
              <select
                value={expCategory}
                onChange={(e) => setExpCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 focus:border-pink-500 focus:bg-white focus:outline-none"
              >
                <option value="Cleaning">Cleaning / Dry Cleaning</option>
                <option value="Dress Purchase">Dress Purchase / Acquisition</option>
                <option value="Laundry">Laundry</option>
                <option value="Repair">Dress Repair / Alterations</option>
                <option value="Transportation">Transportation / Courier</option>
                <option value="Packaging">Packaging & Supplies</option>
                <option value="Utilities">Utilities</option>
                <option value="Supplies">Supplies</option>
                <option value="Marketing">Marketing</option>
                <option value="Rent">Rent</option>
                <option value="Other">Other Expense</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₱) *</label>
              <input
                type="number"
                min="0"
                step="50"
                required
                value={expAmount}
                onChange={(e) => setExpAmount(e.target.value)}
                placeholder="500"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-900 focus:border-pink-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description *</label>
            <input
              type="text"
              required
              value={expDesc}
              onChange={(e) => setExpDesc(e.target.value)}
              placeholder="e.g. Dry cleaning for Midnight Sapphire Gown"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 focus:border-pink-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Date *</label>
              <input
                type="date"
                required
                value={expDate}
                onChange={(e) => setExpDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-800 focus:border-pink-500 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Receipt / Ref # (Optional)</label>
              <input
                type="text"
                value={expRef}
                onChange={(e) => setExpRef(e.target.value)}
                placeholder="REC-9941"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-800 focus:border-pink-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes (Optional)</label>
            <textarea
              value={expNotes}
              onChange={(e) => setExpNotes(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 focus:border-pink-500 focus:bg-white focus:outline-none"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Users, ExternalLink, CalendarCheck } from 'lucide-react';
import { getCustomers, getRentals } from '@/lib/services/api';
import { Customer, Rental } from '@/lib/types/database';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [cData, rData] = await Promise.all([getCustomers(search), getRentals()]);
      setCustomers(cData);
      setRentals(rData);
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const getCustomerStats = (customerId: string) => {
    const cRentals = rentals.filter((r) => r.customer_id === customerId);
    const count = cRentals.length;
    const latest = cRentals.length > 0 ? cRentals[0].rental_start_date : 'No rentals';
    return { count, latest };
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Customer CRM</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage customer contact profiles & rental history</p>
        </div>
      </div>

      {/* Search Controls */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-soft flex items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search customer by name or contact number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs text-slate-800 focus:border-pink-500 focus:bg-white focus:outline-none transition-colors"
          />
        </form>
      </div>

      {/* Customers Table */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading customer profiles...</div>
        ) : customers.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="h-10 w-10 text-pink-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No customers yet</h3>
            <p className="text-xs text-slate-500 mt-1">
              Customers will automatically appear here when creating rental orders.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 px-3">Customer Name</th>
                  <th className="pb-3 px-3">Contact Number</th>
                  <th className="pb-3 px-3">Facebook</th>
                  <th className="pb-3 px-3">Total Rentals</th>
                  <th className="pb-3 px-3">Latest Booking</th>
                  <th className="pb-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => {
                  const stats = getCustomerStats(c.id);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-3 font-bold text-slate-900">{c.full_name}</td>
                      <td className="py-3.5 px-3 font-medium text-slate-700">{c.contact_number}</td>
                      <td className="py-3.5 px-3">
                        {c.facebook_url ? (
                          <a
                            href={c.facebook_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-pink-600 hover:underline font-medium"
                          >
                            Facebook <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-slate-400 font-normal">N/A</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 font-bold text-slate-800">
                          {stats.count} rentals
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 font-medium">{stats.latest}</td>
                      <td className="py-3.5 px-3 text-right">
                        <Link
                          href={`/admin/customers/${c.id}`}
                          className="rounded-lg bg-slate-100 hover:bg-pink-50 hover:text-pink-700 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors"
                        >
                          View Profile
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

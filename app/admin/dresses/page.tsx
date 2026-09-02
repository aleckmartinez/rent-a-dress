'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, Shirt, Sparkles } from 'lucide-react';
import { getDresses } from '@/lib/services/api';
import { Dress } from '@/lib/types/database';
import { DressCard } from '@/components/admin/DressCard';

export default function AdminDressesPage() {
  const [dresses, setDresses] = useState<Dress[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [colorFilter, setColorFilter] = useState('all');
  const [sizeFilter, setSizeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  const loadDresses = async () => {
    setLoading(true);
    try {
      const data = await getDresses({
        status: statusFilter,
        color: colorFilter,
        size: sizeFilter,
        search
      });

      // Client-side sort
      const sorted = [...data].sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'price_low') return a.default_price - b.default_price;
        if (sortBy === 'price_high') return b.default_price - a.default_price;
        if (sortBy === 'status') return a.operational_status.localeCompare(b.operational_status);
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setDresses(sorted);
    } catch (err) {
      console.error('Error fetching dresses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDresses();
  }, [statusFilter, colorFilter, sizeFilter, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadDresses();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Dress Inventory</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage dresses, operational statuses, and rental pricing</p>
        </div>

        <Link
          href="/admin/dresses/new"
          className="flex items-center justify-center gap-1.5 rounded-xl bg-pink-600 hover:bg-pink-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Dress
        </Link>
      </div>

      {/* Search & Filter Controls */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-soft flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search dress by name..."
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
            <option value="all">All Operational Statuses</option>
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="on_rent">On Rent</option>
            <option value="cleaning">Cleaning</option>
            <option value="inspection">Inspection</option>
            <option value="preparing">Preparing</option>
            <option value="repair">Repair</option>
            <option value="unavailable">Unavailable</option>
          </select>

          <select
            value={colorFilter}
            onChange={(e) => setColorFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 focus:border-pink-500 focus:outline-none"
          >
            <option value="all">All Colors</option>
            <option value="Blush Pink">Blush Pink</option>
            <option value="Navy Blue">Navy Blue</option>
            <option value="Emerald Green">Emerald Green</option>
            <option value="Champagne Gold">Champagne Gold</option>
            <option value="Pastel Lilac">Pastel Lilac</option>
          </select>

          <select
            value={sizeFilter}
            onChange={(e) => setSizeFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 focus:border-pink-500 focus:outline-none"
          >
            <option value="all">All Sizes</option>
            <option value="Small (S)">Small (S)</option>
            <option value="Medium (M)">Medium (M)</option>
            <option value="Large (L)">Large (L)</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold text-pink-700 bg-pink-50/50 border-pink-200 focus:outline-none"
          >
            <option value="recent">Sort: Recently Added</option>
            <option value="name">Sort: Name (A-Z)</option>
            <option value="price_low">Sort: Price (Low to High)</option>
            <option value="price_high">Sort: Price (High to Low)</option>
            <option value="status">Sort: Status</option>
          </select>
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="rounded-2xl border border-slate-200 bg-white p-4 animate-pulse h-80 flex flex-col justify-between">
              <div className="h-48 bg-slate-100 rounded-xl" />
              <div className="h-4 bg-slate-100 rounded w-3/4 mt-4" />
              <div className="h-4 bg-slate-100 rounded w-1/2 mt-2" />
            </div>
          ))}
        </div>
      ) : dresses.length === 0 ? (
        /* Empty State */
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center my-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-50 text-pink-500 mb-3">
            <Shirt className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No dresses yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Add your first dress to start managing your rental inventory and tracking availability.
          </p>
          <Link
            href="/admin/dresses/new"
            className="inline-flex items-center gap-1.5 mt-4 rounded-xl bg-pink-600 hover:bg-pink-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add First Dress
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {dresses.map((dress) => (
            <DressCard key={dress.id} dress={dress} />
          ))}
        </div>
      )}
    </div>
  );
}

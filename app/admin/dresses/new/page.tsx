'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Sparkles } from 'lucide-react';
import { createDress } from '@/lib/services/api';
import { PhotoUploader } from '@/components/admin/PhotoUploader';

export default function NewDressPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [color, setColor] = useState('');
  const [size, setSize] = useState('Medium (M)');
  const [price, setPrice] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!name.trim()) errs.name = 'Dress Name is required.';
    if (!color.trim()) errs.color = 'Color is required.';
    if (price === '' || isNaN(Number(price)) || Number(price) < 0) {
      errs.price = 'Default Rental Price must be 0 or greater.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await createDress({
        name: name.trim(),
        color: color.trim(),
        size,
        default_price: Number(price),
        main_photo_path: photoUrl,
        operational_status: 'available'
      });
      router.push('/admin/dresses');
      router.refresh();
    } catch (err: any) {
      console.error('Failed to create dress:', err);
      setErrors({ form: err.message || 'Unable to save the dress. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/dresses"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Add New Dress</h1>
          <p className="text-xs text-slate-500">Create a new item in your rental inventory</p>
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-soft flex flex-col gap-6">
        {errors.form && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-medium text-rose-700">
            {errors.form}
          </div>
        )}

        {/* Photo Upload Section */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Dress Photo
          </label>
          <PhotoUploader value={photoUrl} onChange={setPhotoUrl} disabled={loading} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Dress Name */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Dress Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Blush Rose Silk Gown"
              className={`w-full rounded-xl border ${
                errors.name ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 bg-slate-50/50'
              } px-4 py-2.5 text-sm text-slate-800 focus:border-pink-500 focus:bg-white focus:outline-none transition-colors`}
            />
            {errors.name && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.name}</p>}
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Color *
            </label>
            <input
              type="text"
              required
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="e.g. Blush Pink"
              className={`w-full rounded-xl border ${
                errors.color ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 bg-slate-50/50'
              } px-4 py-2.5 text-sm text-slate-800 focus:border-pink-500 focus:bg-white focus:outline-none transition-colors`}
            />
            {errors.color && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.color}</p>}
          </div>

          {/* Size */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Size *
            </label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 focus:border-pink-500 focus:bg-white focus:outline-none transition-colors"
            >
              <option value="XS / Extra Small">XS / Extra Small</option>
              <option value="Small (S)">Small (S)</option>
              <option value="Medium (M)">Medium (M)</option>
              <option value="Large (L)">Large (L)</option>
              <option value="XL / Extra Large">XL / Extra Large</option>
              <option value="Free Size">Free Size</option>
            </select>
          </div>

          {/* Default Rental Price */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Default Rental Price (₱) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-2.5 text-sm font-bold text-slate-400">₱</span>
              <input
                type="number"
                min="0"
                step="50"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="2500"
                className={`w-full rounded-xl border ${
                  errors.price ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 bg-slate-50/50'
                } pl-9 pr-4 py-2.5 text-sm text-slate-800 focus:border-pink-500 focus:bg-white focus:outline-none transition-colors`}
              />
            </div>
            {errors.price && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.price}</p>}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="mt-4 flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
          <Link
            href="/admin/dresses"
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-pink-600 hover:bg-pink-700 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-colors"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Saving Dress...' : 'Save Dress'}
          </button>
        </div>
      </form>
    </div>
  );
}

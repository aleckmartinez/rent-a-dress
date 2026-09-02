'use client';

import React from 'react';
import Link from 'next/link';
import { Shirt, Eye, Edit3 } from 'lucide-react';
import { Dress } from '@/lib/types/database';
import { StatusBadge } from './StatusBadge';

interface DressCardProps {
  dress: Dress;
}

export function DressCard({ dress }: DressCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="group flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-soft transition-all duration-200 hover:shadow-md hover:border-slate-300 overflow-hidden">
      {/* Photo Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-100">
        {dress.main_photo_path ? (
          <img
            src={dress.main_photo_path}
            alt={dress.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-pink-50/50 text-slate-400">
            <Shirt className="h-10 w-10 text-pink-300 mb-1" />
            <span className="text-xs font-medium text-slate-400">No Photo</span>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <StatusBadge status={dress.operational_status} />
        </div>
      </div>

      {/* Dress Content */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <h3 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-pink-600 transition-colors">
            {dress.name}
          </h3>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
            <span>{dress.color}</span>
            <span className="font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
              {dress.size}
            </span>
          </div>
          <p className="mt-2 text-base font-extrabold text-slate-900">
            {formatPrice(dress.default_price)}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-100">
          <Link
            href={`/admin/dresses/${dress.id}`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Eye className="h-3.5 w-3.5 text-slate-500" />
            View
          </Link>
          <Link
            href={`/admin/dresses/${dress.id}?edit=true`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-pink-50 text-pink-700 hover:bg-pink-100 py-2 text-xs font-semibold transition-colors"
          >
            <Edit3 className="h-3.5 w-3.5" />
            Edit
          </Link>
        </div>
      </div>
    </div>
  );
}

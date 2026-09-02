'use client';

import React from 'react';
import { Shirt, CheckCircle2, XCircle } from 'lucide-react';
import { PublicDressAvailability } from '@/lib/types/database';

interface PublicDressCardProps {
  dress: PublicDressAvailability;
}

export function PublicDressCard({ dress }: PublicDressCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-soft overflow-hidden transition-all duration-200 hover:shadow-md">
      {/* Image */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-100">
        {dress.main_photo_path ? (
          <img
            src={dress.main_photo_path}
            alt={dress.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-pink-50/40 text-slate-400">
            <Shirt className="h-10 w-10 text-pink-300 mb-1" />
            <span className="text-xs font-medium text-slate-400">No Image</span>
          </div>
        )}

        {/* Availability Badge */}
        <div className="absolute top-3 right-3">
          {dress.is_available ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-sm">
              <CheckCircle2 className="h-3.5 w-3.5" />
              AVAILABLE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/90 px-3 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-sm">
              <XCircle className="h-3.5 w-3.5" />
              UNAVAILABLE
            </span>
          )}
        </div>
      </div>

      {/* Card Info */}
      <div className="p-4 flex flex-1 flex-col justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{dress.name}</h3>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
            <span>{dress.color}</span>
            <span className="font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
              {dress.size}
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rental Price</span>
          <span className="text-base font-extrabold text-pink-600">
            {formatPrice(dress.default_price)}
          </span>
        </div>
      </div>
    </div>
  );
}

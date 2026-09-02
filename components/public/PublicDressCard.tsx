'use client';

import React from 'react';
import { Shirt, CheckCircle2, XCircle, Calendar, Sparkles } from 'lucide-react';
import { PublicDressAvailability } from '@/lib/types/database';

interface PublicDressCardProps {
  dress: PublicDressAvailability;
  onSelectDress: (dress: PublicDressAvailability) => void;
}

export function PublicDressCard({ dress, onSelectDress }: PublicDressCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div
      onClick={() => onSelectDress(dress)}
      className="group flex flex-col rounded-3xl border border-slate-200/80 bg-white shadow-soft overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-pink-200 hover:-translate-y-1"
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-100">
        {dress.main_photo_path ? (
          <img
            src={dress.main_photo_path}
            alt={dress.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-pink-50/40 text-slate-400">
            <Shirt className="h-10 w-10 text-pink-300 mb-1" />
            <span className="text-xs font-medium text-slate-400">No Image</span>
          </div>
        )}

        {/* Availability Badge Overlay */}
        <div className="absolute top-3 right-3">
          {dress.is_available ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-3 py-1 text-[11px] font-extrabold text-white shadow-sm backdrop-blur-md">
              <CheckCircle2 className="h-3.5 w-3.5" />
              AVAILABLE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/90 px-3 py-1 text-[11px] font-extrabold text-white shadow-sm backdrop-blur-md">
              <XCircle className="h-3.5 w-3.5" />
              UNAVAILABLE
            </span>
          )}
        </div>

        {/* Hover Action Banner */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-pink-600 px-4 py-2 text-xs font-bold text-white shadow-md">
            <Calendar className="h-3.5 w-3.5" />
            Select & Check Dates
          </span>
        </div>
      </div>

      {/* Card Details */}
      <div className="p-5 flex flex-1 flex-col justify-between">
        <div>
          <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-pink-600 transition-colors line-clamp-1">
            {dress.name}
          </h3>
          <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium text-slate-600">{dress.color}</span>
            <span className="font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg border border-slate-200/60">
              {dress.size}
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rental Price</span>
          <span className="text-base font-extrabold text-pink-600">
            {formatPrice(dress.default_price)}
          </span>
        </div>
      </div>
    </div>
  );
}

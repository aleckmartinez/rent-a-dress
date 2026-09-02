import React from 'react';
import { DressOperationalStatus, RentalOrderStatus } from '@/lib/types/database';

interface StatusBadgeProps {
  status: DressOperationalStatus | RentalOrderStatus;
  type?: 'dress' | 'rental';
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, type = 'dress', size = 'md' }: StatusBadgeProps) {
  let label = status.replace('_', ' ');
  label = label.charAt(0).toUpperCase() + label.slice(1);

  // Configuration for visual indicator dot & background colors
  const getConfig = () => {
    switch (status) {
      // Available / Confirmed
      case 'available':
      case 'confirmed':
      case 'completed':
        return {
          dotColor: 'bg-emerald-500',
          bgColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };

      // Reserved / Pending
      case 'reserved':
      case 'pending':
        return {
          dotColor: 'bg-amber-500',
          bgColor: 'bg-amber-50 text-amber-700 border-amber-200',
        };

      // On Rent / Preparing
      case 'on_rent':
      case 'preparing':
        return {
          dotColor: 'bg-pink-500',
          bgColor: 'bg-pink-50 text-pink-700 border-pink-200',
        };

      // Cleaning / Inspection
      case 'cleaning':
      case 'inspection':
      case 'returned':
        return {
          dotColor: 'bg-indigo-500',
          bgColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        };

      // Repair / Unavailable / Cancelled / Archived
      case 'repair':
      case 'unavailable':
      case 'cancelled':
      case 'archived':
      default:
        return {
          dotColor: 'bg-slate-400',
          bgColor: 'bg-slate-100 text-slate-600 border-slate-200',
        };
    }
  };

  const config = getConfig();
  const paddingClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bgColor} ${paddingClass} transition-colors`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dotColor}`} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

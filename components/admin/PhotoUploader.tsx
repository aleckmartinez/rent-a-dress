'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface PhotoUploaderProps {
  value: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}

export function PhotoUploader({ value, onChange, disabled = false }: PhotoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setError(null);

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, WebP, or GIF).');
      return;
    }

    // Validate max size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be under 5MB.');
      return;
    }

    setUploading(true);

    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const isLive = Boolean(url && !url.includes('placeholder') && url.startsWith('http'));

      if (isLive) {
        const supabase = createClient();
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `dresses/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('dress-images')
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('dress-images')
          .getPublicUrl(filePath);

        onChange(publicUrlData.publicUrl);
      } else {
        // Local preview fallback using Data URL
        const reader = new FileReader();
        reader.onloadend = () => {
          onChange(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      console.error('Photo upload error:', err);
      setError(err.message || 'Unable to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || uploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />

      {value ? (
        <div className="relative group overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          <img
            src={value}
            alt="Dress preview"
            className="h-64 w-full object-cover rounded-2xl"
          />
          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-xl bg-white/90 px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-sm hover:bg-white transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5 text-pink-600" />
              Replace Photo
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="flex items-center gap-1.5 rounded-xl bg-rose-500/90 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-600 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-pink-500 bg-pink-50/50'
              : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-pink-500 border-t-transparent" />
              <span className="text-xs font-medium text-slate-600">Uploading dress image...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-50 text-pink-500">
                <Upload className="h-6 w-6" />
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-slate-800">
                  Click to upload or drag & drop
                </span>
                <span className="text-xs text-slate-400">
                  Supports JPG, PNG, WebP up to 5MB
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs font-medium text-rose-600 flex items-center gap-1">
          <span>⚠️</span> {error}
        </p>
      )}
    </div>
  );
}

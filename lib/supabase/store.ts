import {
  Dress,
  Customer,
  Rental,
  DressStatusHistory,
  Expense,
  FinancialTransaction
} from '@/lib/types/database';

export const INITIAL_DRESSES: Dress[] = [
  {
    id: 'd1010101-0000-0000-0000-000000000001',
    name: 'Blush Rose Silk Gown',
    color: 'Blush Pink',
    size: 'Medium (M)',
    cost: 8000,
    default_price: 2800,
    default_deposit: 1000,
    main_photo_path: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=800&auto=format&fit=crop',
    operational_status: 'available',
    created_by: 'admin-01',
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-01T10:00:00Z'
  },
  {
    id: 'd1010101-0000-0000-0000-000000000002',
    name: 'Midnight Sapphire Evening Dress',
    color: 'Navy Blue',
    size: 'Small (S)',
    cost: 10000,
    default_price: 3200,
    default_deposit: 1500,
    main_photo_path: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=800&auto=format&fit=crop',
    operational_status: 'available',
    created_by: 'admin-01',
    created_at: '2026-08-05T12:00:00Z',
    updated_at: '2026-08-05T12:00:00Z'
  },
  {
    id: 'd1010101-0000-0000-0000-000000000003',
    name: 'Emerald Gala Satin Gown',
    color: 'Emerald Green',
    size: 'Large (L)',
    cost: 9500,
    default_price: 3500,
    default_deposit: 1200,
    main_photo_path: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800&auto=format&fit=crop',
    operational_status: 'cleaning',
    created_by: 'admin-01',
    created_at: '2026-08-10T14:30:00Z',
    updated_at: '2026-09-01T09:00:00Z'
  },
  {
    id: 'd1010101-0000-0000-0000-000000000004',
    name: 'Champagne Sparkle Corset Dress',
    color: 'Champagne Gold',
    size: 'Small (S)',
    cost: 12000,
    default_price: 4000,
    default_deposit: 1500,
    main_photo_path: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=800&auto=format&fit=crop',
    operational_status: 'available',
    created_by: 'admin-01',
    created_at: '2026-08-15T09:15:00Z',
    updated_at: '2026-08-15T09:15:00Z'
  },
  {
    id: 'd1010101-0000-0000-0000-000000000005',
    name: 'Lilac Floral Promenade Dress',
    color: 'Pastel Lilac',
    size: 'Medium (M)',
    cost: 7000,
    default_price: 2500,
    default_deposit: 1000,
    main_photo_path: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=800&auto=format&fit=crop',
    operational_status: 'preparing',
    created_by: 'admin-01',
    created_at: '2026-08-20T11:00:00Z',
    updated_at: '2026-09-02T08:00:00Z'
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'c2020202-0000-0000-0000-000000000001',
    full_name: 'Maria Santos',
    contact_number: '09171234567',
    facebook_url: 'https://facebook.com/mariasantos.ph',
    notes: 'Prefers pickup in the morning. Frequent borrower.',
    created_by: 'admin-01',
    created_at: '2026-08-12T08:00:00Z',
    updated_at: '2026-08-12T08:00:00Z'
  },
  {
    id: 'c2020202-0000-0000-0000-000000000002',
    full_name: 'Ana Cruz',
    contact_number: '09189876543',
    facebook_url: 'https://facebook.com/anacruz.official',
    notes: 'Wedding attendee rental.',
    created_by: 'admin-01',
    created_at: '2026-08-18T10:30:00Z',
    updated_at: '2026-08-18T10:30:00Z'
  },
  {
    id: 'c2020202-0000-0000-0000-000000000003',
    full_name: 'Sophia Reyes',
    contact_number: '09205551234',
    facebook_url: 'https://facebook.com/sophia.reyes',
    notes: 'Debut photoshoot event.',
    created_by: 'admin-01',
    created_at: '2026-08-25T15:20:00Z',
    updated_at: '2026-08-25T15:20:00Z'
  }
];

export const INITIAL_RENTALS: Rental[] = [
  {
    id: 'r3030303-0000-0000-0000-000000000001',
    customer_id: 'c2020202-0000-0000-0000-000000000001',
    dress_id: 'd1010101-0000-0000-0000-000000000001',
    rental_start_date: '2026-09-10',
    rental_end_date: '2026-09-12',
    rental_price: 2800,
    additional_charges: 200,
    discount: 0,
    deposit_amount: 1000,
    deposit_status: 'held',
    deposit_returned_amount: 0,
    deposit_retained_amount: 0,
    deposit_retention_reason: null,
    total_price: 3000,
    status: 'reserved',
    notes: 'Security deposit paid.',
    created_by: 'admin-01',
    updated_by: 'admin-01',
    created_at: '2026-09-01T09:00:00Z',
    updated_at: '2026-09-01T09:00:00Z'
  },
  {
    id: 'r3030303-0000-0000-0000-000000000002',
    customer_id: 'c2020202-0000-0000-0000-000000000002',
    dress_id: 'd1010101-0000-0000-0000-000000000002',
    rental_start_date: '2026-09-12',
    rental_end_date: '2026-09-14',
    rental_price: 3200,
    additional_charges: 0,
    discount: 200,
    deposit_amount: 1500,
    deposit_status: 'held',
    deposit_returned_amount: 0,
    deposit_retained_amount: 0,
    deposit_retention_reason: null,
    total_price: 3000,
    status: 'confirmed',
    notes: 'Gala night event',
    created_by: 'admin-01',
    updated_by: 'admin-01',
    created_at: '2026-09-02T10:15:00Z',
    updated_at: '2026-09-02T10:15:00Z'
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'e5050505-0000-0000-0000-000000000001',
    category: 'Cleaning',
    description: 'Dry cleaning for Midnight Sapphire & Emerald Satin Gown',
    amount: 850,
    expense_date: '2026-09-01',
    receipt_reference: 'REC-2026-0901',
    notes: 'Express 24-hr dry cleaning service',
    created_by: 'admin-01',
    created_at: '2026-09-01T11:00:00Z',
    updated_at: '2026-09-01T11:00:00Z'
  },
  {
    id: 'e5050505-0000-0000-0000-000000000002',
    category: 'Supplies',
    description: 'Garment bags and custom velvet hangers',
    amount: 1200,
    expense_date: '2026-08-28',
    receipt_reference: 'SUP-8841',
    notes: '100 pcs garment covers',
    created_by: 'admin-01',
    created_at: '2026-08-28T14:00:00Z',
    updated_at: '2026-08-28T14:00:00Z'
  }
];

export const INITIAL_TRANSACTIONS: FinancialTransaction[] = [
  {
    id: 't6060606-0000-0000-0000-000000000001',
    transaction_type: 'income',
    category: 'Rental Revenue',
    reference_type: 'rental',
    reference_id: 'r3030303-0000-0000-0000-000000000001',
    amount: 3000,
    transaction_date: '2026-09-01',
    description: 'Rental order r3030303 payment received',
    created_by: 'admin-01',
    created_at: '2026-09-01T09:00:00Z'
  },
  {
    id: 't6060606-0000-0000-0000-000000000002',
    transaction_type: 'deposit_received',
    category: 'Deposit Held',
    reference_type: 'rental',
    reference_id: 'r3030303-0000-0000-0000-000000000001',
    amount: 1000,
    transaction_date: '2026-09-01',
    description: 'Refundable deposit held for order r3030303',
    created_by: 'admin-01',
    created_at: '2026-09-01T09:00:00Z'
  },
  {
    id: 't6060606-0000-0000-0000-000000000003',
    transaction_type: 'expense',
    category: 'Cleaning',
    reference_type: 'expense',
    reference_id: 'e5050505-0000-0000-0000-000000000001',
    amount: 850,
    transaction_date: '2026-09-01',
    description: 'Dry cleaning expense for dresses',
    created_by: 'admin-01',
    created_at: '2026-09-01T11:00:00Z'
  }
];

export const INITIAL_STATUS_HISTORY: DressStatusHistory[] = [
  {
    id: 'h4040404-0000-0000-0000-000000000001',
    dress_id: 'd1010101-0000-0000-0000-000000000003',
    old_status: 'on_rent',
    new_status: 'cleaning',
    reason: 'Returned from gala event on Sep 1',
    changed_by: 'admin-01',
    changed_at: '2026-09-01T09:00:00Z'
  }
];

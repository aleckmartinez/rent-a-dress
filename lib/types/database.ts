export type DressOperationalStatus =
  | 'available'
  | 'reserved'
  | 'on_rent'
  | 'cleaning'
  | 'inspection'
  | 'preparing'
  | 'repair'
  | 'unavailable'
  | 'archived';

export type RentalOrderStatus =
  | 'pending'
  | 'confirmed'
  | 'reserved'
  | 'on_rent'
  | 'returned'
  | 'completed'
  | 'cancelled';

export type DepositStatus =
  | 'pending'
  | 'held'
  | 'eligible_for_return'
  | 'returned'
  | 'retained'
  | 'partially_retained';

export type FulfillmentType = 'pickup' | 'delivery';

export type FinancialTransactionType =
  | 'income'
  | 'deposit_received'
  | 'deposit_returned'
  | 'deposit_retained';

export interface Profile {
  id: string;
  full_name: string;
  role: 'admin' | 'staff' | 'viewer';
  created_at: string;
  updated_at: string;
}

export interface Dress {
  id: string;
  name: string;
  color: string;
  size: string;
  default_price: number;
  default_deposit: number;
  main_photo_path: string | null;
  operational_status: DressOperationalStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DressPhoto {
  id: string;
  dress_id: string;
  photo_path: string;
  is_primary: boolean;
  created_at: string;
}

export interface Customer {
  id: string;
  full_name: string;
  contact_number: string;
  address: string | null;
  facebook_url: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Rental {
  id: string;
  customer_id: string;
  dress_id: string;
  rental_start_date: string;
  rental_end_date: string;
  rental_price: number;
  additional_charges: number;
  discount: number;
  deposit_amount: number;
  deposit_status: DepositStatus;
  deposit_returned_amount: number;
  deposit_retained_amount: number;
  deposit_retention_reason: string | null;
  total_price: number;
  status: RentalOrderStatus;
  fulfillment_type: FulfillmentType;
  delivery_address: string | null;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  customer?: Customer;
  dress?: Dress;
}

export interface FinancialTransaction {
  id: string;
  transaction_type: FinancialTransactionType;
  category: string;
  reference_type: string | null;
  reference_id: string | null;
  amount: number;
  transaction_date: string;
  description: string;
  created_by: string | null;
  created_at: string;
}

export interface DressStatusHistory {
  id: string;
  dress_id: string;
  old_status: DressOperationalStatus | null;
  new_status: DressOperationalStatus;
  reason: string | null;
  changed_by: string | null;
  changed_at: string;
}

export interface PublicDressAvailability {
  id: string;
  name: string;
  color: string;
  size: string;
  default_price: number;
  main_photo_path: string | null;
  operational_status: DressOperationalStatus;
  is_available: boolean;
}

export interface FinanceSummary {
  rental_revenue: number;
  additional_charges: number;
  retained_deposits: number;
  recognized_revenue: number; // Total Earnings
  refunded_deposits: number; // Deposit Refunds
  on_hold_deposits: number;  // On-hold deposit amount
  date_range_label: string;
}

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: any; Update: any };
      dresses: { Row: Dress; Insert: any; Update: any };
      dress_photos: { Row: DressPhoto; Insert: any; Update: any };
      customers: { Row: Customer; Insert: any; Update: any };
      rentals: { Row: Rental; Insert: any; Update: any };
      financial_transactions: { Row: FinancialTransaction; Insert: any; Update: any };
      dress_status_history: { Row: DressStatusHistory; Insert: any; Update: any };
    };
    Functions: {
      get_public_dress_availability: {
        Args: {
          p_start_date?: string;
          p_end_date?: string;
          p_search?: string;
          p_color?: string;
          p_size?: string;
        };
        Returns: PublicDressAvailability[];
      };
    };
  };
};

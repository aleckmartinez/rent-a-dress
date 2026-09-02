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
  total_price: number;
  status: RentalOrderStatus;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields for display convenience
  customer?: Customer;
  dress?: Dress;
}

export interface DressStatusHistory {
  id: string;
  dress_id: string;
  old_status: DressOperationalStatus | null;
  new_status: DressOperationalStatus;
  reason: string | null;
  changed_by: string | null;
  changed_at: string;
  changed_by_profile?: Profile;
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

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string };
        Update: Partial<Omit<Profile, 'id'>>;
      };
      dresses: {
        Row: Dress;
        Insert: Omit<Dress, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Omit<Dress, 'id'>>;
      };
      dress_photos: {
        Row: DressPhoto;
        Insert: Omit<DressPhoto, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<DressPhoto, 'id'>>;
      };
      customers: {
        Row: Customer;
        Insert: Omit<Customer, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Omit<Customer, 'id'>>;
      };
      rentals: {
        Row: Rental;
        Insert: Omit<Rental, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Omit<Rental, 'id'>>;
      };
      dress_status_history: {
        Row: DressStatusHistory;
        Insert: Omit<DressStatusHistory, 'id' | 'changed_at'> & { id?: string; changed_at?: string };
        Update: Partial<Omit<DressStatusHistory, 'id'>>;
      };
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

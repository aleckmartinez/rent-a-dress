import { createClient } from '@/lib/supabase/client';
import {
  Dress,
  Customer,
  Rental,
  DressStatusHistory,
  PublicDressAvailability,
  DressOperationalStatus,
  RentalOrderStatus
} from '@/lib/types/database';
import {
  INITIAL_DRESSES,
  INITIAL_CUSTOMERS,
  INITIAL_RENTALS,
  INITIAL_STATUS_HISTORY
} from '@/lib/supabase/store';

// Check if running against live Supabase or mock fallback
const isLiveSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return Boolean(url && !url.includes('placeholder') && url.startsWith('http'));
};

// Memory store for local browser persistence when live Supabase is not connected
let localDresses: Dress[] = [...INITIAL_DRESSES];
let localCustomers: Customer[] = [...INITIAL_CUSTOMERS];
let localRentals: Rental[] = [...INITIAL_RENTALS];
let localHistory: DressStatusHistory[] = [...INITIAL_STATUS_HISTORY];

// Initialize from localStorage if in browser environment
if (typeof window !== 'undefined') {
  try {
    const savedDresses = localStorage.getItem('rad_dresses');
    if (savedDresses) localDresses = JSON.parse(savedDresses);
    
    const savedCustomers = localStorage.getItem('rad_customers');
    if (savedCustomers) localCustomers = JSON.parse(savedCustomers);
    
    const savedRentals = localStorage.getItem('rad_rentals');
    if (savedRentals) localRentals = JSON.parse(savedRentals);
    
    const savedHistory = localStorage.getItem('rad_history');
    if (savedHistory) localHistory = JSON.parse(savedHistory);
  } catch (e) {
    console.error('Error loading local storage state:', e);
  }
}

function persistLocalState() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('rad_dresses', JSON.stringify(localDresses));
      localStorage.setItem('rad_customers', JSON.stringify(localCustomers));
      localStorage.setItem('rad_rentals', JSON.stringify(localRentals));
      localStorage.setItem('rad_history', JSON.stringify(localHistory));
    } catch (e) {
      console.error('Error saving local storage state:', e);
    }
  }
}

// Helper: Check if two date ranges overlap [start1, end1] and [start2, end2]
export function doDatesOverlap(
  start1Str: string,
  end1Str: string,
  start2Str: string,
  end2Str: string
): boolean {
  const start1 = new Date(start1Str);
  const end1 = new Date(end1Str);
  const start2 = new Date(start2Str);
  const end2 = new Date(end2Str);

  return start1 <= end2 && end1 >= start2;
}

// ----------------------------------------------------------------------------
// DRESS SERVICES
// ----------------------------------------------------------------------------

export async function getDresses(filters?: {
  status?: string;
  color?: string;
  size?: string;
  search?: string;
}): Promise<Dress[]> {
  if (isLiveSupabase()) {
    const supabase = createClient();
    let query = supabase.from('dresses').select('*').ne('operational_status', 'archived').order('created_at', { ascending: false });
    
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('operational_status', filters.status as DressOperationalStatus);
    }
    if (filters?.color && filters.color !== 'all') {
      query = query.ilike('color', `%${filters.color}%`);
    }
    if (filters?.size && filters.size !== 'all') {
      query = query.ilike('size', `%${filters.size}%`);
    }
    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  }

  // Fallback memory query
  return localDresses.filter(d => {
    if (d.operational_status === 'archived') return false;
    if (filters?.status && filters.status !== 'all' && d.operational_status !== filters.status) return false;
    if (filters?.color && filters.color !== 'all' && !d.color.toLowerCase().includes(filters.color.toLowerCase())) return false;
    if (filters?.size && filters.size !== 'all' && !d.size.toLowerCase().includes(filters.size.toLowerCase())) return false;
    if (filters?.search && !d.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });
}

export async function getDressById(id: string): Promise<Dress | null> {
  if (isLiveSupabase()) {
    const supabase = createClient();
    const { data, error } = await supabase.from('dresses').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  }
  return localDresses.find(d => d.id === id) || null;
}

export async function createDress(dressData: {
  name: string;
  color: string;
  size: string;
  default_price: number;
  main_photo_path?: string | null;
  operational_status?: DressOperationalStatus;
}): Promise<Dress> {
  const newDress: Dress = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `d-${Date.now()}`,
    name: dressData.name,
    color: dressData.color,
    size: dressData.size,
    default_price: dressData.default_price,
    main_photo_path: dressData.main_photo_path || null,
    operational_status: dressData.operational_status || 'available',
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (isLiveSupabase()) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('dresses')
      .insert({ ...newDress, created_by: user?.id || null })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  localDresses.unshift(newDress);
  persistLocalState();
  return newDress;
}

export async function updateDressOperationalStatus(
  dressId: string,
  newStatus: DressOperationalStatus,
  reason?: string
): Promise<Dress> {
  const dress = await getDressById(dressId);
  if (!dress) throw new Error('Dress not found');

  const oldStatus = dress.operational_status;

  if (isLiveSupabase()) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Update dress
    const { data: updatedDress, error: dressError } = await supabase
      .from('dresses')
      .update({ operational_status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', dressId)
      .select()
      .single();

    if (dressError) throw new Error(dressError.message);

    // 2. Insert audit log
    await supabase.from('dress_status_history').insert({
      dress_id: dressId,
      old_status: oldStatus,
      new_status: newStatus,
      reason: reason || `Admin updated status to ${newStatus}`,
      changed_by: user?.id || null
    });

    return updatedDress;
  }

  // Memory fallback
  dress.operational_status = newStatus;
  dress.updated_at = new Date().toISOString();

  localHistory.unshift({
    id: `h-${Date.now()}`,
    dress_id: dressId,
    old_status: oldStatus,
    new_status: newStatus,
    reason: reason || `Admin updated status to ${newStatus}`,
    changed_by: 'admin-01',
    changed_at: new Date().toISOString()
  });

  persistLocalState();
  return dress;
}

export async function updateDress(
  id: string,
  data: Partial<Omit<Dress, 'id' | 'created_at' | 'updated_at'>>
): Promise<Dress> {
  if (isLiveSupabase()) {
    const supabase = createClient();
    const { data: updated, error } = await supabase
      .from('dresses')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return updated;
  }

  const idx = localDresses.findIndex(d => d.id === id);
  if (idx === -1) throw new Error('Dress not found');

  localDresses[idx] = {
    ...localDresses[idx],
    ...data,
    updated_at: new Date().toISOString()
  };
  persistLocalState();
  return localDresses[idx];
}

export async function getDressStatusHistory(dressId: string): Promise<DressStatusHistory[]> {
  if (isLiveSupabase()) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('dress_status_history')
      .select('*')
      .eq('dress_id', dressId)
      .order('changed_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }
  return localHistory.filter(h => h.dress_id === dressId);
}

// ----------------------------------------------------------------------------
// CUSTOMER CRM SERVICES
// ----------------------------------------------------------------------------

export async function getCustomers(search?: string): Promise<Customer[]> {
  if (isLiveSupabase()) {
    const supabase = createClient();
    let query = supabase.from('customers').select('*').order('full_name', { ascending: true });
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,contact_number.ilike.%${search}%`);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  }

  return localCustomers.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.full_name.toLowerCase().includes(q) || c.contact_number.includes(q);
  });
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  if (isLiveSupabase()) {
    const supabase = createClient();
    const { data, error } = await supabase.from('customers').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  }
  return localCustomers.find(c => c.id === id) || null;
}

export async function findOrCreateCustomer(customerData: {
  full_name: string;
  contact_number: string;
  facebook_url?: string | null;
  notes?: string | null;
}): Promise<Customer> {
  const cleanPhone = customerData.contact_number.trim();
  
  if (isLiveSupabase()) {
    const supabase = createClient();
    // 1. Check existing by phone number
    const { data: existing } = await supabase
      .from('customers')
      .select('*')
      .eq('contact_number', cleanPhone)
      .maybeSingle();

    if (existing) {
      // Update details if supplied
      const { data: updated } = await supabase
        .from('customers')
        .update({
          full_name: customerData.full_name,
          facebook_url: customerData.facebook_url || existing.facebook_url,
          notes: customerData.notes || existing.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();
      return updated || existing;
    }

    // 2. Create new customer
    const { data: { user } } = await supabase.auth.getUser();
    const { data: created, error } = await supabase
      .from('customers')
      .insert({
        full_name: customerData.full_name,
        contact_number: cleanPhone,
        facebook_url: customerData.facebook_url || null,
        notes: customerData.notes || null,
        created_by: user?.id || null
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return created;
  }

  // Memory store fallback
  const existingIndex = localCustomers.findIndex(c => c.contact_number === cleanPhone);
  if (existingIndex !== -1) {
    localCustomers[existingIndex] = {
      ...localCustomers[existingIndex],
      full_name: customerData.full_name,
      facebook_url: customerData.facebook_url || localCustomers[existingIndex].facebook_url,
      notes: customerData.notes || localCustomers[existingIndex].notes,
      updated_at: new Date().toISOString()
    };
    persistLocalState();
    return localCustomers[existingIndex];
  }

  const newCust: Customer = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `c-${Date.now()}`,
    full_name: customerData.full_name,
    contact_number: cleanPhone,
    facebook_url: customerData.facebook_url || null,
    notes: customerData.notes || null,
    created_by: 'admin-01',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  localCustomers.push(newCust);
  persistLocalState();
  return newCust;
}

export async function updateCustomer(
  id: string,
  data: Partial<Omit<Customer, 'id' | 'created_at' | 'updated_at'>>
): Promise<Customer> {
  if (isLiveSupabase()) {
    const supabase = createClient();
    const { data: updated, error } = await supabase
      .from('customers')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return updated;
  }

  const idx = localCustomers.findIndex(c => c.id === id);
  if (idx === -1) throw new Error('Customer not found');

  localCustomers[idx] = {
    ...localCustomers[idx],
    ...data,
    updated_at: new Date().toISOString()
  };
  persistLocalState();
  return localCustomers[idx];
}

// ----------------------------------------------------------------------------
// RENTAL ORDER SERVICES & DOUBLE BOOKING PREVENTION
// ----------------------------------------------------------------------------

export async function checkDressAvailability(
  dressId: string,
  startDate: string,
  endDate: string,
  excludeRentalId?: string
): Promise<{ available: boolean; reason?: string }> {
  // 1. Check dress operational status
  const dress = await getDressById(dressId);
  if (!dress) return { available: false, reason: 'Dress not found' };

  if (dress.operational_status !== 'available') {
    return {
      available: false,
      reason: `Dress operational status is currently '${dress.operational_status.toUpperCase()}'. An admin must manually mark it Available before it can be booked.`
    };
  }

  // 2. Check for conflicting active rentals
  let rentals: Rental[] = [];
  if (isLiveSupabase()) {
    const supabase = createClient();
    let query = supabase
      .from('rentals')
      .select('*')
      .eq('dress_id', dressId)
      .ne('status', 'cancelled');
    if (excludeRentalId) {
      query = query.ne('id', excludeRentalId);
    }
    const { data } = await query;
    rentals = data || [];
  } else {
    rentals = localRentals.filter(r => r.dress_id === dressId && r.status !== 'cancelled' && r.id !== excludeRentalId);
  }

  const conflicting = rentals.find(r => doDatesOverlap(startDate, endDate, r.rental_start_date, r.rental_end_date));
  if (conflicting) {
    return {
      available: false,
      reason: `This dress is already booked from ${conflicting.rental_start_date} to ${conflicting.rental_end_date}. Please select different dates.`
    };
  }

  return { available: true };
}

export async function getRentals(filters?: {
  status?: string;
  dress_id?: string;
  customer_id?: string;
  search?: string;
}): Promise<Rental[]> {
  let items: Rental[] = [];

  if (isLiveSupabase()) {
    const supabase = createClient();
    let query = supabase
      .from('rentals')
      .select('*, customer:customers(*), dress:dresses(*)')
      .order('created_at', { ascending: false });

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status as RentalOrderStatus);
    }
    if (filters?.dress_id) {
      query = query.eq('dress_id', filters.dress_id);
    }
    if (filters?.customer_id) {
      query = query.eq('customer_id', filters.customer_id);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    items = data || [];
  } else {
    items = localRentals
      .map(r => ({
        ...r,
        customer: localCustomers.find(c => c.id === r.customer_id),
        dress: localDresses.find(d => d.id === r.dress_id)
      }))
      .filter(r => {
        if (filters?.status && filters.status !== 'all' && r.status !== filters.status) return false;
        if (filters?.dress_id && r.dress_id !== filters.dress_id) return false;
        if (filters?.customer_id && r.customer_id !== filters.customer_id) return false;
        if (filters?.search) {
          const q = filters.search.toLowerCase();
          const custMatch = r.customer?.full_name.toLowerCase().includes(q);
          const dressMatch = r.dress?.name.toLowerCase().includes(q);
          if (!custMatch && !dressMatch) return false;
        }
        return true;
      });
  }

  return items;
}

export async function getRentalById(id: string): Promise<Rental | null> {
  if (isLiveSupabase()) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('rentals')
      .select('*, customer:customers(*), dress:dresses(*)')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  }

  const rental = localRentals.find(r => r.id === id);
  if (!rental) return null;

  return {
    ...rental,
    customer: localCustomers.find(c => c.id === rental.customer_id),
    dress: localDresses.find(d => d.id === rental.dress_id)
  };
}

export async function createRental(rentalData: {
  customer_id: string;
  dress_id: string;
  rental_start_date: string;
  rental_end_date: string;
  rental_price: number;
  additional_charges: number;
  discount: number;
  notes?: string | null;
  status?: RentalOrderStatus;
}): Promise<Rental> {
  // 1. Availability check (Double booking prevention)
  const availability = await checkDressAvailability(
    rentalData.dress_id,
    rentalData.rental_start_date,
    rentalData.rental_end_date
  );

  if (!availability.available) {
    throw new Error(availability.reason || 'This dress is unavailable for the selected dates.');
  }

  const totalPrice = Math.max(0, rentalData.rental_price + rentalData.additional_charges - rentalData.discount);

  const newRental: Rental = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `r-${Date.now()}`,
    customer_id: rentalData.customer_id,
    dress_id: rentalData.dress_id,
    rental_start_date: rentalData.rental_start_date,
    rental_end_date: rentalData.rental_end_date,
    rental_price: rentalData.rental_price,
    additional_charges: rentalData.additional_charges,
    discount: rentalData.discount,
    total_price: totalPrice,
    status: rentalData.status || 'confirmed',
    notes: rentalData.notes || null,
    created_by: null,
    updated_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (isLiveSupabase()) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('rentals')
      .insert({
        ...newRental,
        created_by: user?.id || null,
        updated_by: user?.id || null
      })
      .select('*, customer:customers(*), dress:dresses(*)')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  localRentals.unshift(newRental);
  persistLocalState();

  return {
    ...newRental,
    customer: localCustomers.find(c => c.id === newRental.customer_id),
    dress: localDresses.find(d => d.id === newRental.dress_id)
  };
}

export async function updateRentalStatus(
  rentalId: string,
  newStatus: RentalOrderStatus
): Promise<Rental> {
  const rental = await getRentalById(rentalId);
  if (!rental) throw new Error('Rental order not found');

  if (isLiveSupabase()) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: updated, error } = await supabase
      .from('rentals')
      .update({
        status: newStatus,
        updated_by: user?.id || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', rentalId)
      .select('*, customer:customers(*), dress:dresses(*)')
      .single();

    if (error) throw new Error(error.message);

    // CRITICAL OPERATIONAL WORKFLOW RULE:
    // When rental transitions to 'returned', automatically transition dress operational status to 'cleaning'.
    // DO NOT automatically set dress to 'available'. Admin must explicitly set cleaning -> available!
    if (newStatus === 'returned' && rental.dress_id) {
      await updateDressOperationalStatus(
        rental.dress_id,
        'cleaning',
        `Rental order ${rentalId.slice(0, 8)} returned by customer`
      );
    }

    return updated;
  }

  const idx = localRentals.findIndex(r => r.id === rentalId);
  if (idx !== -1) {
    localRentals[idx].status = newStatus;
    localRentals[idx].updated_at = new Date().toISOString();
  }

  // Execute operational rule in local memory store
  if (newStatus === 'returned' && rental.dress_id) {
    await updateDressOperationalStatus(
      rental.dress_id,
      'cleaning',
      `Rental order ${rentalId.slice(0, 8)} returned by customer`
    );
  }

  persistLocalState();
  const result = await getRentalById(rentalId);
  return result!;
}

export async function updateRental(
  rentalId: string,
  data: {
    customer_id?: string;
    dress_id?: string;
    rental_start_date?: string;
    rental_end_date?: string;
    rental_price?: number;
    additional_charges?: number;
    discount?: number;
    status?: RentalOrderStatus;
    notes?: string | null;
  }
): Promise<Rental> {
  const existing = await getRentalById(rentalId);
  if (!existing) throw new Error('Rental not found');

  const targetDressId = data.dress_id || existing.dress_id;
  const targetStart = data.rental_start_date || existing.rental_start_date;
  const targetEnd = data.rental_end_date || existing.rental_end_date;

  // Re-check availability excluding current rental
  const availability = await checkDressAvailability(targetDressId, targetStart, targetEnd, rentalId);
  if (!availability.available) {
    throw new Error(availability.reason || 'Requested dates or dress are unavailable.');
  }

  const rentalPrice = data.rental_price ?? existing.rental_price;
  const additionalCharges = data.additional_charges ?? existing.additional_charges;
  const discount = data.discount ?? existing.discount;
  const totalPrice = Math.max(0, rentalPrice + additionalCharges - discount);

  if (isLiveSupabase()) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: updated, error } = await supabase
      .from('rentals')
      .update({
        ...data,
        total_price: totalPrice,
        updated_by: user?.id || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', rentalId)
      .select('*, customer:customers(*), dress:dresses(*)')
      .single();

    if (error) throw new Error(error.message);
    return updated;
  }

  const idx = localRentals.findIndex(r => r.id === rentalId);
  if (idx === -1) throw new Error('Rental not found');

  localRentals[idx] = {
    ...localRentals[idx],
    ...data,
    total_price: totalPrice,
    updated_at: new Date().toISOString()
  };

  persistLocalState();
  const updatedObj = await getRentalById(rentalId);
  return updatedObj!;
}

// ----------------------------------------------------------------------------
// SECURE PUBLIC AVAILABILITY API (Zero Customer PII Exposure)
// ----------------------------------------------------------------------------

export async function getPublicAvailability(params: {
  startDate?: string;
  endDate?: string;
  search?: string;
  color?: string;
  size?: string;
}): Promise<PublicDressAvailability[]> {
  if (isLiveSupabase()) {
    const supabase = createClient();
    const { data, error } = await supabase.rpc('get_public_dress_availability', {
      p_start_date: params.startDate || undefined,
      p_end_date: params.endDate || undefined,
      p_search: params.search || '',
      p_color: params.color || '',
      p_size: params.size || ''
    });

    if (error) throw new Error(error.message);
    return data || [];
  }

  // Pure public data transformer — NO customer data, NO phone numbers, NO notes
  const activeRentals = localRentals.filter(r => r.status !== 'cancelled');

  return localDresses
    .filter(d => d.operational_status !== 'archived')
    .filter(d => {
      if (params.search && !d.name.toLowerCase().includes(params.search.toLowerCase())) return false;
      if (params.color && params.color !== 'all' && !d.color.toLowerCase().includes(params.color.toLowerCase())) return false;
      if (params.size && params.size !== 'all' && !d.size.toLowerCase().includes(params.size.toLowerCase())) return false;
      return true;
    })
    .map(d => {
      let available = d.operational_status === 'available';

      if (available && params.startDate && params.endDate) {
        const hasConflict = activeRentals.some(
          r => r.dress_id === d.id && doDatesOverlap(params.startDate!, params.endDate!, r.rental_start_date, r.rental_end_date)
        );
        if (hasConflict) available = false;
      }

      return {
        id: d.id,
        name: d.name,
        color: d.color,
        size: d.size,
        default_price: d.default_price,
        main_photo_path: d.main_photo_path,
        operational_status: d.operational_status,
        is_available: available
      };
    });
}

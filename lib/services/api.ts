import { createClient } from '@/lib/supabase/client';
import {
  Dress,
  Customer,
  Rental,
  DressStatusHistory,
  FinancialTransaction,
  PublicDressAvailability,
  DressOperationalStatus,
  RentalOrderStatus,
  DepositStatus,
  FinanceSummary
} from '@/lib/types/database';
import {
  INITIAL_DRESSES,
  INITIAL_CUSTOMERS,
  INITIAL_RENTALS,
  INITIAL_TRANSACTIONS,
  INITIAL_STATUS_HISTORY
} from '@/lib/supabase/store';

const isLiveSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return Boolean(url && !url.includes('placeholder') && url.startsWith('http'));
};

let localDresses: Dress[] = [...INITIAL_DRESSES];
let localCustomers: Customer[] = [...INITIAL_CUSTOMERS];
let localRentals: Rental[] = [...INITIAL_RENTALS];
let localTransactions: FinancialTransaction[] = [...INITIAL_TRANSACTIONS];
let localHistory: DressStatusHistory[] = [...INITIAL_STATUS_HISTORY];

if (typeof window !== 'undefined') {
  try {
    const savedD = localStorage.getItem('rad_dresses');
    if (savedD) localDresses = JSON.parse(savedD);

    const savedC = localStorage.getItem('rad_customers');
    if (savedC) localCustomers = JSON.parse(savedC);

    const savedR = localStorage.getItem('rad_rentals');
    if (savedR) localRentals = JSON.parse(savedR);

    const savedT = localStorage.getItem('rad_transactions');
    if (savedT) localTransactions = JSON.parse(savedT);

    const savedH = localStorage.getItem('rad_history');
    if (savedH) localHistory = JSON.parse(savedH);
  } catch (e) {
    console.error('Error loading local storage:', e);
  }
}

function persistLocalState() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('rad_dresses', JSON.stringify(localDresses));
      localStorage.setItem('rad_customers', JSON.stringify(localCustomers));
      localStorage.setItem('rad_rentals', JSON.stringify(localRentals));
      localStorage.setItem('rad_transactions', JSON.stringify(localTransactions));
      localStorage.setItem('rad_history', JSON.stringify(localHistory));
    } catch (e) {
      console.error('Error saving local storage:', e);
    }
  }
}

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
  type?: string;
  color?: string;
  size?: string;
  search?: string;
}): Promise<Dress[]> {
  const todayStr = new Date().toISOString().split('T')[0];
  let list: Dress[] = [];

  if (isLiveSupabase()) {
    const supabase = createClient();
    let query = (supabase.from('dresses') as any)
      .select('*')
      .neq('operational_status', 'archived')
      .order('created_at', { ascending: false });

    if (filters?.type && filters.type !== 'all') {
      query = query.ilike('dress_type', `%${filters.type}%`);
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
    list = data || [];
  } else {
    list = localDresses.filter((d) => {
      if (d.operational_status === 'archived') return false;
      if (filters?.type && filters.type !== 'all' && !d.dress_type.toLowerCase().includes(filters.type.toLowerCase())) return false;
      if (filters?.color && filters.color !== 'all' && !d.color.toLowerCase().includes(filters.color.toLowerCase())) return false;
      if (filters?.size && filters.size !== 'all' && !d.size.toLowerCase().includes(filters.size.toLowerCase())) return false;
      if (filters?.search && !d.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
  }

  // Cross-reference active rentals to ensure dresses on rent today reflect 'on_rent' or 'reserved' status
  const rentals = await getRentals();
  const updatedList = list.map((d) => {
    if (d.operational_status === 'available') {
      const activeRental = rentals.find(
        (r) =>
          r.dress_id === d.id &&
          r.status !== 'cancelled' &&
          r.status !== 'returned' &&
          r.status !== 'completed' &&
          doDatesOverlap(todayStr, todayStr, r.rental_start_date, r.rental_end_date)
      );

      if (activeRental) {
        const effectiveStatus: DressOperationalStatus =
          activeRental.status === 'on_rent' ? 'on_rent' : 'reserved';
        return { ...d, operational_status: effectiveStatus };
      }
    }
    return d;
  });

  if (filters?.status && filters.status !== 'all') {
    return updatedList.filter((d) => d.operational_status === filters.status);
  }

  return updatedList;
}

export async function getDressById(id: string): Promise<Dress | null> {
  if (isLiveSupabase()) {
    const supabase = createClient();
    const { data, error } = await (supabase.from('dresses') as any).select('*').eq('id', id).single();
    if (error) return null;
    return data;
  }
  return localDresses.find((d) => d.id === id) || null;
}

export async function createDress(dressData: {
  name: string;
  dress_type?: string;
  color: string;
  size: string;
  default_price: number;
  default_deposit?: number;
  main_photo_path?: string | null;
  operational_status?: DressOperationalStatus;
}): Promise<Dress> {
  const newDress: Dress = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `d-${Date.now()}`,
    name: dressData.name,
    dress_type: dressData.dress_type || 'Long Dress',
    color: dressData.color,
    size: dressData.size,
    default_price: dressData.default_price,
    default_deposit: dressData.default_deposit || Math.round(dressData.default_price * 0.4),
    main_photo_path: dressData.main_photo_path || null,
    operational_status: dressData.operational_status || 'available',
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (isLiveSupabase()) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await (supabase.from('dresses') as any)
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

    const { data: updatedDress, error: dressError } = await (supabase.from('dresses') as any)
      .update({ operational_status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', dressId)
      .select()
      .single();

    if (dressError) throw new Error(dressError.message);

    await (supabase.from('dress_status_history') as any).insert({
      dress_id: dressId,
      old_status: oldStatus,
      new_status: newStatus,
      reason: reason || `Admin updated status to ${newStatus}`,
      changed_by: user?.id || null
    });

    return updatedDress;
  }

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
    const { data: updated, error } = await (supabase.from('dresses') as any)
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return updated;
  }

  const idx = localDresses.findIndex((d) => d.id === id);
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
    const { data, error } = await (supabase.from('dress_status_history') as any)
      .select('*')
      .eq('dress_id', dressId)
      .order('changed_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }
  return localHistory.filter((h) => h.dress_id === dressId);
}

// ----------------------------------------------------------------------------
// CUSTOMER SERVICES
// ----------------------------------------------------------------------------

export async function getCustomers(search?: string): Promise<Customer[]> {
  if (isLiveSupabase()) {
    const supabase = createClient();
    let query = (supabase.from('customers') as any).select('*').order('full_name', { ascending: true });
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,contact_number.ilike.%${search}%`);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  }

  return localCustomers.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.full_name.toLowerCase().includes(q) || c.contact_number.includes(q);
  });
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  if (isLiveSupabase()) {
    const supabase = createClient();
    const { data, error } = await (supabase.from('customers') as any).select('*').eq('id', id).single();
    if (error) return null;
    return data;
  }
  return localCustomers.find((c) => c.id === id) || null;
}

export async function findOrCreateCustomer(customerData: {
  full_name: string;
  contact_number: string;
  address?: string | null;
  facebook_url?: string | null;
  notes?: string | null;
}): Promise<Customer> {
  const cleanPhone = customerData.contact_number.trim();

  if (isLiveSupabase()) {
    const supabase = createClient();
    const { data: existing } = await (supabase.from('customers') as any)
      .select('*')
      .eq('contact_number', cleanPhone)
      .maybeSingle();

    if (existing) {
      const { data: updated } = await (supabase.from('customers') as any)
        .update({
          full_name: customerData.full_name,
          address: customerData.address ?? existing.address,
          facebook_url: customerData.facebook_url || existing.facebook_url,
          notes: customerData.notes || existing.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();
      return updated || existing;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const { data: created, error } = await (supabase.from('customers') as any)
      .insert({
        full_name: customerData.full_name,
        contact_number: cleanPhone,
        address: customerData.address || null,
        facebook_url: customerData.facebook_url || null,
        notes: customerData.notes || null,
        created_by: user?.id || null
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return created;
  }

  const existingIndex = localCustomers.findIndex((c) => c.contact_number === cleanPhone);
  if (existingIndex !== -1) {
    localCustomers[existingIndex] = {
      ...localCustomers[existingIndex],
      full_name: customerData.full_name,
      address: customerData.address ?? localCustomers[existingIndex].address,
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
    address: customerData.address || null,
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
    const { data: updated, error } = await (supabase.from('customers') as any)
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return updated;
  }

  const idx = localCustomers.findIndex((c) => c.id === id);
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
  const dress = await getDressById(dressId);
  if (!dress) return { available: false, reason: 'Dress not found' };

  if (dress.operational_status !== 'available') {
    return {
      available: false,
      reason: `Dress status is currently '${dress.operational_status.toUpperCase()}'. It cannot be rented while on rent, in cleaning, or unavailable.`
    };
  }

  let rentals: Rental[] = [];
  if (isLiveSupabase()) {
    const supabase = createClient();
    let query = (supabase.from('rentals') as any)
      .select('*')
      .eq('dress_id', dressId)
      .neq('status', 'cancelled');
    if (excludeRentalId) {
      query = query.neq('id', excludeRentalId);
    }
    const { data } = await query;
    rentals = data || [];
  } else {
    rentals = localRentals.filter((r) => r.dress_id === dressId && r.status !== 'cancelled' && r.id !== excludeRentalId);
  }

  const conflicting = rentals.find((r) => doDatesOverlap(startDate, endDate, r.rental_start_date, r.rental_end_date));
  if (conflicting) {
    return {
      available: false,
      reason: `This dress is already booked from ${conflicting.rental_start_date} to ${conflicting.rental_end_date}.`
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
    let query = (supabase.from('rentals') as any)
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
      .map((r) => ({
        ...r,
        customer: localCustomers.find((c) => c.id === r.customer_id),
        dress: localDresses.find((d) => d.id === r.dress_id)
      }))
      .filter((r) => {
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
    const { data, error } = await (supabase.from('rentals') as any)
      .select('*, customer:customers(*), dress:dresses(*)')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  }

  const rental = localRentals.find((r) => r.id === id);
  if (!rental) return null;

  return {
    ...rental,
    customer: localCustomers.find((c) => c.id === rental.customer_id),
    dress: localDresses.find((d) => d.id === rental.dress_id)
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
  deposit_amount?: number;
  fulfillment_type?: 'pickup' | 'delivery';
  delivery_address?: string | null;
  notes?: string | null;
  status?: RentalOrderStatus;
}): Promise<Rental> {
  const availability = await checkDressAvailability(
    rentalData.dress_id,
    rentalData.rental_start_date,
    rentalData.rental_end_date
  );

  if (!availability.available) {
    throw new Error(availability.reason || 'This dress is unavailable for the selected dates.');
  }

  const dress = await getDressById(rentalData.dress_id);
  const depAmount = rentalData.deposit_amount ?? (dress ? dress.default_deposit : 1000);
  const totalPrice = Math.max(0, rentalData.rental_price + rentalData.additional_charges - rentalData.discount);
  const initialStatus = rentalData.status || 'confirmed';

  const newRental: Rental = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `r-${Date.now()}`,
    customer_id: rentalData.customer_id,
    dress_id: rentalData.dress_id,
    rental_start_date: rentalData.rental_start_date,
    rental_end_date: rentalData.rental_end_date,
    rental_price: rentalData.rental_price,
    additional_charges: rentalData.additional_charges,
    discount: rentalData.discount,
    deposit_amount: depAmount,
    deposit_status: 'held',
    deposit_returned_amount: 0,
    deposit_retained_amount: 0,
    deposit_retention_reason: null,
    total_price: totalPrice,
    status: initialStatus,
    fulfillment_type: rentalData.fulfillment_type || 'pickup',
    delivery_address: rentalData.delivery_address || null,
    notes: rentalData.notes || null,
    created_by: null,
    updated_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (isLiveSupabase()) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await (supabase.from('rentals') as any)
      .insert({
        ...newRental,
        created_by: user?.id || null,
        updated_by: user?.id || null
      })
      .select('*, customer:customers(*), dress:dresses(*)')
      .single();

    if (error) throw new Error(error.message);

    // Synchronize dress operational status if order is active/on_rent/reserved
    if (initialStatus === 'on_rent') {
      await updateDressOperationalStatus(rentalData.dress_id, 'on_rent', `Rental order ${data.id.slice(0, 8)} started`);
    } else if (initialStatus === 'reserved') {
      await updateDressOperationalStatus(rentalData.dress_id, 'reserved', `Rental order ${data.id.slice(0, 8)} reserved`);
    }

    // Audit transaction entries
    await (supabase.from('financial_transactions') as any).insert({
      transaction_type: 'income',
      category: 'Rental Revenue',
      reference_type: 'rental',
      reference_id: data.id,
      amount: totalPrice,
      transaction_date: data.rental_start_date,
      description: `Rental revenue for order ${data.id.slice(0, 8)}`,
      created_by: user?.id || null
    });

    if (depAmount > 0) {
      await (supabase.from('financial_transactions') as any).insert({
        transaction_type: 'deposit_received',
        category: 'Deposit Held',
        reference_type: 'rental',
        reference_id: data.id,
        amount: depAmount,
        transaction_date: data.rental_start_date,
        description: `Refundable deposit held for order ${data.id.slice(0, 8)}`,
        created_by: user?.id || null
      });
    }

    return data;
  }

  localRentals.unshift(newRental);

  if (initialStatus === 'on_rent') {
    await updateDressOperationalStatus(rentalData.dress_id, 'on_rent', `Rental order ${newRental.id.slice(0, 8)} started`);
  } else if (initialStatus === 'reserved') {
    await updateDressOperationalStatus(rentalData.dress_id, 'reserved', `Rental order ${newRental.id.slice(0, 8)} reserved`);
  }

  localTransactions.unshift({
    id: `t-${Date.now()}-1`,
    transaction_type: 'income',
    category: 'Rental Revenue',
    reference_type: 'rental',
    reference_id: newRental.id,
    amount: totalPrice,
    transaction_date: newRental.rental_start_date,
    description: `Rental revenue for order ${newRental.id.slice(0, 8)}`,
    created_by: 'admin-01',
    created_at: new Date().toISOString()
  });

  if (depAmount > 0) {
    localTransactions.unshift({
      id: `t-${Date.now()}-2`,
      transaction_type: 'deposit_received',
      category: 'Deposit Held',
      reference_type: 'rental',
      reference_id: newRental.id,
      amount: depAmount,
      transaction_date: newRental.rental_start_date,
      description: `Refundable deposit held for order ${newRental.id.slice(0, 8)}`,
      created_by: 'admin-01',
      created_at: new Date().toISOString()
    });
  }

  persistLocalState();

  return {
    ...newRental,
    customer: localCustomers.find((c) => c.id === newRental.customer_id),
    dress: localDresses.find((d) => d.id === newRental.dress_id)
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

    const { data: updated, error } = await (supabase.from('rentals') as any)
      .update({
        status: newStatus,
        updated_by: user?.id || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', rentalId)
      .select('*, customer:customers(*), dress:dresses(*)')
      .single();

    if (error) throw new Error(error.message);

    if (rental.dress_id) {
      if (newStatus === 'on_rent') {
        await updateDressOperationalStatus(rental.dress_id, 'on_rent', `Rental order ${rentalId.slice(0, 8)} on rent`);
      } else if (newStatus === 'reserved') {
        await updateDressOperationalStatus(rental.dress_id, 'reserved', `Rental order ${rentalId.slice(0, 8)} reserved`);
      } else if (newStatus === 'returned' || newStatus === 'completed' || newStatus === 'cancelled') {
        await updateDressOperationalStatus(rental.dress_id, 'available', `Rental order ${rentalId.slice(0, 8)} ${newStatus}`);
      }
    }

    return updated;
  }

  const idx = localRentals.findIndex((r) => r.id === rentalId);
  if (idx !== -1) {
    localRentals[idx].status = newStatus;
    localRentals[idx].updated_at = new Date().toISOString();
  }

  if (rental.dress_id) {
    if (newStatus === 'on_rent') {
      await updateDressOperationalStatus(rental.dress_id, 'on_rent', `Rental order ${rentalId.slice(0, 8)} on rent`);
    } else if (newStatus === 'reserved') {
      await updateDressOperationalStatus(rental.dress_id, 'reserved', `Rental order ${rentalId.slice(0, 8)} reserved`);
    } else if (newStatus === 'returned' || newStatus === 'completed' || newStatus === 'cancelled') {
      await updateDressOperationalStatus(rental.dress_id, 'available', `Rental order ${rentalId.slice(0, 8)} ${newStatus}`);
    }
  }

  persistLocalState();
  const result = await getRentalById(rentalId);
  return result!;
}

// Deposit processing: Full return, Partial retention, Full retention
export async function updateRentalDeposit(
  rentalId: string,
  depositStatus: DepositStatus,
  returnedAmount: number,
  retainedAmount: number,
  reason?: string
): Promise<Rental> {
  const rental = await getRentalById(rentalId);
  if (!rental) throw new Error('Rental order not found');

  if (returnedAmount < 0 || retainedAmount < 0) {
    throw new Error('Amounts cannot be negative.');
  }

  if (returnedAmount + retainedAmount > rental.deposit_amount) {
    throw new Error(`Total of returned (₱${returnedAmount}) + retained (₱${retainedAmount}) cannot exceed original deposit (₱${rental.deposit_amount}).`);
  }

  if (isLiveSupabase()) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: updated, error } = await (supabase.from('rentals') as any)
      .update({
        deposit_status: depositStatus,
        deposit_returned_amount: returnedAmount,
        deposit_retained_amount: retainedAmount,
        deposit_retention_reason: reason || null,
        updated_by: user?.id || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', rentalId)
      .select('*, customer:customers(*), dress:dresses(*)')
      .single();

    if (error) throw new Error(error.message);

    if (returnedAmount > 0) {
      await (supabase.from('financial_transactions') as any).insert({
        transaction_type: 'deposit_returned',
        category: 'Deposit Return',
        reference_type: 'rental',
        reference_id: rentalId,
        amount: returnedAmount,
        transaction_date: new Date().toISOString().split('T')[0],
        description: `Deposit returned to customer for order ${rentalId.slice(0, 8)}`,
        created_by: user?.id || null
      });
    }

    if (retainedAmount > 0) {
      await (supabase.from('financial_transactions') as any).insert({
        transaction_type: 'deposit_retained',
        category: 'Retained Deposits',
        reference_type: 'rental',
        reference_id: rentalId,
        amount: retainedAmount,
        transaction_date: new Date().toISOString().split('T')[0],
        description: `Retained deposit for order ${rentalId.slice(0, 8)}: ${reason || 'Damage/Late charge'}`,
        created_by: user?.id || null
      });
    }

    return updated;
  }

  const idx = localRentals.findIndex((r) => r.id === rentalId);
  if (idx !== -1) {
    localRentals[idx].deposit_status = depositStatus;
    localRentals[idx].deposit_returned_amount = returnedAmount;
    localRentals[idx].deposit_retained_amount = retainedAmount;
    localRentals[idx].deposit_retention_reason = reason || null;
    localRentals[idx].updated_at = new Date().toISOString();
  }

  if (returnedAmount > 0) {
    localTransactions.unshift({
      id: `t-${Date.now()}-ret`,
      transaction_type: 'deposit_returned',
      category: 'Deposit Return',
      reference_type: 'rental',
      reference_id: rentalId,
      amount: returnedAmount,
      transaction_date: new Date().toISOString().split('T')[0],
      description: `Deposit returned to customer for order ${rentalId.slice(0, 8)}`,
      created_by: 'admin-01',
      created_at: new Date().toISOString()
    });
  }

  if (retainedAmount > 0) {
    localTransactions.unshift({
      id: `t-${Date.now()}-keep`,
      transaction_type: 'deposit_retained',
      category: 'Retained Deposits',
      reference_type: 'rental',
      reference_id: rentalId,
      amount: retainedAmount,
      transaction_date: new Date().toISOString().split('T')[0],
      description: `Retained deposit for order ${rentalId.slice(0, 8)}: ${reason || 'Damage/Late charge'}`,
      created_by: 'admin-01',
      created_at: new Date().toISOString()
    });
  }

  persistLocalState();
  const res = await getRentalById(rentalId);
  return res!;
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
    deposit_amount?: number;
    status?: RentalOrderStatus;
    fulfillment_type?: 'pickup' | 'delivery';
    delivery_address?: string | null;
    notes?: string | null;
  }
): Promise<Rental> {
  const existing = await getRentalById(rentalId);
  if (!existing) throw new Error('Rental not found');

  const targetDressId = data.dress_id || existing.dress_id;
  const targetStart = data.rental_start_date || existing.rental_start_date;
  const targetEnd = data.rental_end_date || existing.rental_end_date;

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

    const { data: updated, error } = await (supabase.from('rentals') as any)
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

    if (data.status && targetDressId) {
      if (data.status === 'on_rent') {
        await updateDressOperationalStatus(targetDressId, 'on_rent', `Rental order updated to on_rent`);
      } else if (data.status === 'reserved') {
        await updateDressOperationalStatus(targetDressId, 'reserved', `Rental order updated to reserved`);
      } else if (data.status === 'returned' || data.status === 'completed' || data.status === 'cancelled') {
        await updateDressOperationalStatus(targetDressId, 'available', `Rental order ${data.status}`);
      }
    }

    return updated;
  }

  const idx = localRentals.findIndex((r) => r.id === rentalId);
  if (idx === -1) throw new Error('Rental not found');

  localRentals[idx] = {
    ...localRentals[idx],
    ...data,
    total_price: totalPrice,
    updated_at: new Date().toISOString()
  };

  if (data.status && targetDressId) {
    if (data.status === 'on_rent') {
      await updateDressOperationalStatus(targetDressId, 'on_rent', `Rental order updated to on_rent`);
    } else if (data.status === 'reserved') {
      await updateDressOperationalStatus(targetDressId, 'reserved', `Rental order updated to reserved`);
    } else if (data.status === 'returned' || data.status === 'completed' || data.status === 'cancelled') {
      await updateDressOperationalStatus(targetDressId, 'available', `Rental order ${data.status}`);
    }
  }

  persistLocalState();
  const updatedObj = await getRentalById(rentalId);
  return updatedObj!;
}

// ----------------------------------------------------------------------------
// FINANCIAL TRANSACTIONS & SUMMARY METRICS (EARNINGS, REFUNDS, ON-HOLD DEPOSITS)
// ----------------------------------------------------------------------------

export async function getFinancialTransactions(): Promise<FinancialTransaction[]> {
  if (isLiveSupabase()) {
    const supabase = createClient();
    const { data, error } = await (supabase.from('financial_transactions') as any)
      .select('*')
      .order('transaction_date', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }
  return localTransactions;
}

export async function getFinanceSummary(range: string = '30_days'): Promise<FinanceSummary> {
  const rList = await getRentals();

  const now = new Date();
  let startDateLimit: Date | null = null;
  let label = 'Financial Summary';

  if (range === '7_days') {
    startDateLimit = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    label = 'Last 7 Days';
  } else if (range === '30_days') {
    startDateLimit = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    label = 'Last 30 Days';
  } else if (range === 'this_month') {
    startDateLimit = new Date(now.getFullYear(), now.getMonth(), 1);
    label = `${now.toLocaleString('en-US', { month: 'long' })} ${now.getFullYear()}`;
  } else if (range === 'quarter') {
    const qMonth = Math.floor(now.getMonth() / 3) * 3;
    startDateLimit = new Date(now.getFullYear(), qMonth, 1);
    label = `Current Quarter (${now.getFullYear()})`;
  } else if (range === 'this_year') {
    startDateLimit = new Date(now.getFullYear(), 0, 1);
    label = `Year ${now.getFullYear()}`;
  } else {
    label = 'All Time Financials';
  }

  // Filter non-cancelled rentals in range
  const filteredRentals = rList.filter((r) => {
    if (r.status === 'cancelled') return false;
    if (!startDateLimit) return true;
    return new Date(r.rental_start_date) >= startDateLimit;
  });

  // Calculate Recognized Revenue (Earnings) & Deposits
  let rental_revenue = 0;
  let additional_charges = 0;
  let retained_deposits = 0;
  let refunded_deposits = 0;
  let on_hold_deposits = 0;

  filteredRentals.forEach((r) => {
    rental_revenue += Number(r.rental_price || 0);
    additional_charges += Number(r.additional_charges || 0);
    retained_deposits += Number(r.deposit_retained_amount || 0);
    refunded_deposits += Number(r.deposit_returned_amount || 0);

    if (r.deposit_status === 'held' || r.deposit_status === 'pending') {
      on_hold_deposits += Number(r.deposit_amount || 0);
    }
  });

  const recognized_revenue = rental_revenue + additional_charges + retained_deposits;

  return {
    rental_revenue,
    additional_charges,
    retained_deposits,
    recognized_revenue,
    refunded_deposits,
    on_hold_deposits,
    date_range_label: label
  };
}

// ----------------------------------------------------------------------------
// SECURE PUBLIC AVAILABILITY API
// ----------------------------------------------------------------------------

export async function getPublicAvailability(params: {
  startDate?: string;
  endDate?: string;
  search?: string;
  type?: string;
  color?: string;
  size?: string;
}): Promise<PublicDressAvailability[]> {
  if (isLiveSupabase()) {
    const supabase = createClient();
    const { data, error } = await (supabase as any).rpc('get_public_dress_availability', {
      p_start_date: params.startDate || null,
      p_end_date: params.endDate || null,
      p_search: params.search && params.search.trim() ? params.search.trim() : null,
      p_type: params.type && params.type !== 'all' ? params.type : null,
      p_color: params.color && params.color !== 'all' ? params.color : null,
      p_size: params.size && params.size !== 'all' ? params.size : null
    });

    if (error) throw new Error(error.message);
    return data || [];
  }

  const activeRentals = localRentals.filter((r) => r.status !== 'cancelled');
  const todayStr = new Date().toISOString().split('T')[0];

  return localDresses
    .filter((d) => d.operational_status !== 'archived')
    .filter((d) => {
      if (params.search && !d.name.toLowerCase().includes(params.search.toLowerCase())) return false;
      if (params.type && params.type !== 'all' && !d.dress_type.toLowerCase().includes(params.type.toLowerCase())) return false;
      if (params.color && params.color !== 'all' && !d.color.toLowerCase().includes(params.color.toLowerCase())) return false;
      if (params.size && params.size !== 'all' && !d.size.toLowerCase().includes(params.size.toLowerCase())) return false;
      return true;
    })
    .map((d) => {
      // Check operational status
      let available = !['on_rent', 'reserved', 'cleaning', 'repair', 'unavailable', 'archived'].includes(d.operational_status);

      if (available) {
        if (params.startDate && params.endDate) {
          const hasConflict = activeRentals.some(
            (r) => r.dress_id === d.id && doDatesOverlap(params.startDate!, params.endDate!, r.rental_start_date, r.rental_end_date)
          );
          if (hasConflict) available = false;
        } else {
          // If no dates requested, check if currently on rent today
          const currentlyOnRent = activeRentals.some(
            (r) => r.dress_id === d.id && ['confirmed', 'reserved', 'on_rent'].includes(r.status) && doDatesOverlap(todayStr, todayStr, r.rental_start_date, r.rental_end_date)
          );
          if (currentlyOnRent) available = false;
        }
      }

      return {
        id: d.id,
        name: d.name,
        dress_type: d.dress_type || 'Long Dress',
        color: d.color,
        size: d.size,
        default_price: d.default_price,
        main_photo_path: d.main_photo_path,
        operational_status: d.operational_status,
        is_available: available
      };
    });
}

import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export interface Instructor {
  id: string;
  profile_id: string;
  ratings: string[];
  bio?: string;
  hourly_rate_cents: number;
  status: 'active' | 'inactive';
  profiles?: {
    full_name?: string;
    email: string;
  };
}

export interface Reservation {
  id: string;
  aircraft_id: string;
  instructor_id?: string;
  created_by: string;
  start_at: string;
  end_at: string;
  purpose: string;
  status: 'requested' | 'confirmed' | 'completed' | 'canceled';
  notes?: string;
  cancellation_reason?: string;
  aircraft?: {
    tail_number: string;
    model: string;
  };
  instructor?: Instructor;
  creator?: {
    full_name?: string;
    email: string;
  };
}

export interface Service {
  id: string;
  aircraft_id: string;
  requested_by: string;
  type: 'detail' | 'tks' | 'o2' | 'oil' | 'staging' | 'cleaning';
  status: 'requested' | 'scheduled' | 'in_progress' | 'completed' | 'canceled';
  scheduled_at?: string;
  completed_at?: string;
  assigned_to?: string;
  notes?: string;
  photos?: any[];
  cost_cents?: number;
  aircraft?: {
    tail_number: string;
    model: string;
  };
}

export interface Membership {
  id: string;
  owner_id: string;
  tier: 'basic' | 'premium' | 'platinum';
  starts_at: string;
  ends_at?: string;
  status: 'active' | 'paused' | 'canceled';
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
}

export interface TrainingRecord {
  id: string;
  profile_id: string;
  type: 'IPC' | 'BFR';
  completed_at: string;
  expires_at: string;
  instructor_name: string;
  notes?: string;
}

export interface Charge {
  id: string;
  owner_id: string;
  source: string;
  amount_cents: number;
  currency: string;
  description: string;
  stripe_invoice_id?: string;
  stripe_payment_intent_id?: string;
  paid_at?: string;
  due_at?: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  created_at: string;
}

export interface TrainingCurrency {
  ipc_current: boolean;
  ipc_expires?: string;
  ipc_due_soon: boolean;
  bfr_current: boolean;
  bfr_expires?: string;
  bfr_due_soon: boolean;
}

// ============================================================================
// RESERVATIONS
// ============================================================================

export const getReservations = async (userId: string) => {
  const { data, error } = await supabase
    .from('reservations' as any)
    .select(`
      *,
      aircraft:aircraft_id (tail_number, model),
      instructor:instructor_id (
        id,
        ratings,
        profiles:profile_id (full_name, email)
      ),
      creator:created_by (full_name, email)
    `)
    .eq('created_by', userId)
    .order('start_at', { ascending: true });

  if (error) throw error;
  return data as any as Reservation[];
};

export const createReservation = async (reservation: {
  aircraft_id: string;
  instructor_id?: string;
  start_at: string;
  end_at: string;
  purpose: string;
  notes?: string;
}) => {
  // First check if booking is available
  const { data: available } = await supabase.rpc('can_book' as any, {
    p_aircraft_id: reservation.aircraft_id,
    p_instructor_id: reservation.instructor_id || null,
    p_start_at: reservation.start_at,
    p_end_at: reservation.end_at,
  });

  if (!available) {
    throw new Error('Time slot not available - conflict detected');
  }

  const { data, error } = await supabase
    .from('reservations' as any)
    .insert([
      {
        ...reservation,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      } as any,
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateReservationStatus = async (
  id: string,
  status: 'requested' | 'confirmed' | 'completed' | 'canceled',
  cancellation_reason?: string
) => {
  const { data, error} = await supabase
    .from('reservations' as any)
    .update({ status, cancellation_reason } as any)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getAllReservations = async () => {
  const { data, error } = await supabase
    .from('reservations' as any)
    .select(`
      *,
      aircraft:aircraft_id (tail_number, model),
      instructor:instructor_id (
        id,
        ratings,
        profiles:profile_id (full_name, email)
      ),
      creator:created_by (full_name, email)
    `)
    .order('start_at', { ascending: true });

  if (error) throw error;
  return data as any as Reservation[];
};

// ============================================================================
// SERVICES
// ============================================================================

export const getServices = async (userId: string) => {
  const { data, error } = await supabase
    .from('services' as any)
    .select(`
      *,
      aircraft:aircraft_id (tail_number, model)
    `)
    .eq('requested_by', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as any as Service[];
};

export const createService = async (service: {
  aircraft_id: string;
  type: 'detail' | 'tks' | 'o2' | 'oil' | 'staging' | 'cleaning';
  notes?: string;
  scheduled_at?: string;
}) => {
  const { data, error } = await supabase
    .from('services' as any)
    .insert([
      {
        ...service,
        requested_by: (await supabase.auth.getUser()).data.user?.id,
      } as any,
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateServiceStatus = async (
  id: string,
  status: 'requested' | 'scheduled' | 'in_progress' | 'completed' | 'canceled',
  updates?: {
    scheduled_at?: string;
    completed_at?: string;
    assigned_to?: string;
    cost_cents?: number;
    notes?: string;
  }
) => {
  const { data, error } = await supabase
    .from('services' as any)
    .update({ status, ...updates } as any)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getAllServices = async () => {
  const { data, error } = await supabase
    .from('services' as any)
    .select(`
      *,
      aircraft:aircraft_id (tail_number, model),
      requester:requested_by (full_name, email)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// ============================================================================
// INSTRUCTORS
// ============================================================================

export const getInstructors = async () => {
  const { data, error } = await supabase
    .from('instructors' as any)
    .select(`
      *,
      profiles:profile_id (full_name, email)
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as any as Instructor[];
};

// ============================================================================
// MEMBERSHIPS
// ============================================================================

export const getMembership = async (userId: string) => {
  const { data, error } = await supabase
    .from('memberships' as any)
    .select('*')
    .eq('owner_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) throw error;
  return data as any as Membership | null;
};

// ============================================================================
// TRAINING
// ============================================================================

export const getTrainingRecords = async (userId: string) => {
  const { data, error } = await supabase
    .from('training_records' as any)
    .select('*')
    .eq('profile_id', userId)
    .order('completed_at', { ascending: false });

  if (error) throw error;
  return data as any as TrainingRecord[];
};

export const getTrainingCurrency = async (userId: string) => {
  const { data, error } = await supabase.rpc('check_training_currency' as any, {
    p_profile_id: userId,
  });

  if (error) throw error;
  return data as TrainingCurrency;
};

export const createTrainingRecord = async (record: {
  profile_id: string;
  type: 'IPC' | 'BFR';
  completed_at: string;
  expires_at: string;
  instructor_name: string;
  notes?: string;
}) => {
  const { data, error } = await supabase
    .from('training_records' as any)
    .insert([record as any])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ============================================================================
// CHARGES
// ============================================================================

export const getCharges = async (userId: string) => {
  const { data, error } = await supabase
    .from('charges' as any)
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as any as Charge[];
};

export const getAllCharges = async () => {
  const { data, error } = await supabase
    .from('charges' as any)
    .select(`
      *,
      owner:owner_id (full_name, email)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// ============================================================================
// AIRCRAFT
// ============================================================================

export const getAircraft = async (userId: string) => {
  const { data, error } = await supabase
    .from('aircraft')
    .select('*')
    .eq('owner_id', userId)
    .order('tail_number', { ascending: true });

  if (error) throw error;
  return data;
};

export const getAllAircraft = async () => {
  const { data, error } = await supabase
    .from('aircraft')
    .select(`
      *,
      owner:owner_id (full_name, email)
    `)
    .order('tail_number', { ascending: true });

  if (error) throw error;
  return data;
};

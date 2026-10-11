import { 
  UserProfile, 
  VisaReminder, 
  PassportDetail, 
  VisaApplication, 
  VisaJourneyStep, 
  ApplicationUpdate, 
  UserDocument, 
  UrgentCaseItem,
  VisaStatus,
  SmtpConfig,
  EmailReminderLog,
  PassportCheckResult,
  MailboxMessage
} from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

// Helper for date calculations
export function calculateDaysRemaining(targetDateStr: string): number {
  if (!targetDateStr) return 0;
  const target = new Date(targetDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function determineVisaStatus(expiryDateStr: string): VisaStatus {
  const days = calculateDaysRemaining(expiryDateStr);
  if (days < 0) return 'expired';
  if (days <= 30) return 'renewal_required';
  if (days <= 90) return 'expiring_soon';
  return 'valid';
}

export function maskPassportNumber(num: string): string {
  if (!num) return '••••••••';
  const clean = num.replace(/\s+/g, '');
  if (clean.length <= 4) return '•••• ' + clean;
  const last4 = clean.slice(-4);
  const maskedLength = Math.max(4, clean.length - 4);
  return '•'.repeat(maskedLength).match(/.{1,4}/g)?.join(' ') + ' ' + last4;
}

// -------------------------------------------------------------
// SEED DATA FOR LOCAL REPOSITORY & DEMO TESTABILITY
// -------------------------------------------------------------
const STORAGE_KEY_PREFIX = 'viaggio_data_';

function getLocalStore<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setLocalStore<T>(key: string, val: T): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(val));
  } catch (e) {
    console.error('Failed to save to local store', e);
  }
}

// Default seed records for instant demo and evaluation
const DEFAULT_PROFILES: UserProfile[] = [
  {
    id: 'user-krishna-1',
    email: 'krishnaanil@gmail.com',
    full_name: 'Krishnendu Anil',
    role: 'user',
    created_at: '2026-01-01T10:00:00Z',
  },
  {
    id: 'user-admin-1',
    email: 'admin@gmail.com',
    full_name: 'Administrator',
    role: 'admin',
    created_at: '2026-01-10T09:00:00Z',
  },
  {
    id: 'user-traveler-1',
    email: 'akashsudheer678@gmail.com',
    full_name: 'Akash Sudheer',
    role: 'user',
    created_at: '2026-02-15T10:00:00Z',
  },
  {
    id: 'user-traveler-2',
    email: 'traveler@example.com',
    full_name: 'Clara Oswald',
    role: 'user',
    created_at: '2026-03-01T12:00:00Z',
  }
];

const DEFAULT_VISAS: VisaReminder[] = [
  {
    id: 'visa-krishna-expiring',
    user_id: 'user-krishna-1',
    passport_number: 'N8492015',
    country: 'Japan',
    visa_type: 'Tourist eVisa (Single Entry)',
    issue_date: '2026-05-05',
    expiry_date: '2026-11-05', // ~25 days from now - EXPIRING SOON (<90 days, 30/20/15-day alerts active!)
    reminder_intervals: [90, 60, 30, 20, 15],
    status: 'renewal_required',
    notes: 'Expiring in 25 days. Automated email alert dispatched from viaggio.remaninder@gmail.com to krishnaanil116@gmail.com.',
    created_at: '2026-05-05T10:00:00Z',
  },
  {
    id: 'visa-krishna-valid',
    user_id: 'user-krishna-1',
    passport_number: 'N8492015',
    country: 'United Kingdom',
    visa_type: 'Standard Visitor Visa (5 Years)',
    issue_date: '2025-06-01',
    expiry_date: '2030-06-01', // ~1,300+ days from now - NOT EXPIRING!
    reminder_intervals: [90, 60, 30, 20, 15],
    status: 'valid',
    notes: 'Long-term multiple-entry visitor visa. Fully valid (NOT expiring).',
    created_at: '2025-06-01T10:00:00Z',
  },
  {
    id: 'visa-1',
    user_id: 'user-traveler-1',
    passport_number: 'N8492015',
    country: 'Japan',
    visa_type: 'Tourist (Single Entry)',
    issue_date: '2026-05-10',
    expiry_date: '2026-11-10', // ~30 days from now - triggers 30-day email alert!
    reminder_intervals: [90, 60, 30, 20, 15],
    status: 'renewal_required',
    notes: 'Requires confirmed return flight ticket upon renewal.',
    created_at: '2026-05-10T12:00:00Z',
  },
  {
    id: 'visa-2',
    user_id: 'user-traveler-1',
    passport_number: 'N8492015',
    country: 'United Kingdom',
    visa_type: 'Standard Visitor Visa (6 Months)',
    issue_date: '2026-07-01',
    expiry_date: '2027-01-01',
    reminder_intervals: [90, 60, 30, 20, 15],
    status: 'valid',
    notes: 'Biometrics were taken at VFS Global center.',
    created_at: '2026-07-01T08:00:00Z',
  },
  {
    id: 'visa-3',
    user_id: 'user-traveler-2',
    passport_number: 'GB9821447',
    country: 'Schengen (France)',
    visa_type: 'Short Stay Type C',
    issue_date: '2026-03-10',
    expiry_date: '2026-09-10',
    reminder_intervals: [60, 30, 20, 15],
    status: 'expired',
    notes: 'Expired Schengen tourist visa.',
    created_at: '2026-03-10T10:00:00Z',
  }
];

const DEFAULT_PASSPORTS: PassportDetail[] = [
  {
    id: 'pass-krishna-1',
    user_id: 'user-krishna-1',
    issuing_country: 'India',
    passport_number: 'N8492015',
    issue_date: '2022-04-12',
    expiry_date: '2032-04-11', // Valid for ~5.5 years (2,000+ days) - NOT EXPIRING!
    reminder_intervals: [180, 90, 30],
    notes: '36 pages regular booklet. Complies with international 6-month validity rule (NOT expiring).',
    created_at: '2022-04-12T10:00:00Z',
  },
  {
    id: 'pass-1',
    user_id: 'user-traveler-1',
    issuing_country: 'India',
    passport_number: 'N8492015',
    issue_date: '2018-04-12',
    expiry_date: '2028-04-11', // valid for ~1.5 years
    reminder_intervals: [180, 90, 30],
    notes: '36 pages regular booklet. Stored in travel safe.',
    created_at: '2026-01-15T10:00:00Z',
  },
  {
    id: 'pass-2',
    user_id: 'user-traveler-2',
    issuing_country: 'United Kingdom',
    passport_number: 'GB9821447',
    issue_date: '2016-11-20',
    expiry_date: '2026-11-20', // Expiring in 41 days! Urgent!
    reminder_intervals: [180, 90, 30],
    notes: 'Urgent renewal needed due to 6-month international validity rule.',
    created_at: '2026-02-01T10:00:00Z',
  }
];

const DEFAULT_APPLICATIONS: VisaApplication[] = [
  {
    id: 'app-1',
    user_id: 'user-traveler-1',
    user_email: 'akashsudheer678@gmail.com',
    user_name: 'Akash Sudheer',
    country: 'Schengen (Germany)',
    visa_type: 'National Visa Type D (Work / Tech Permit)',
    reference_number: 'DEU-2026-88194',
    status: 'under_review',
    current_stage: 'Application Under Review',
    submission_date: '2026-09-18',
    estimated_decision_date: '2026-10-28',
    notes: 'Applied through the German consulate with official employer sponsorship letter.',
    internal_admin_notes: 'Consular dossier verified; biometrics matched on Sept 22.',
    is_urgent: false,
    created_at: '2026-09-15T11:00:00Z',
    updated_at: '2026-09-24T14:30:00Z',
  },
  {
    id: 'app-2',
    user_id: 'user-traveler-2',
    user_email: 'traveler@example.com',
    user_name: 'Clara Oswald',
    country: 'Canada',
    visa_type: 'Visitor Visa (eTA / TRV)',
    reference_number: 'CAN-TRV-5501',
    status: 'in_progress',
    current_stage: 'Documents Pending',
    submission_date: '2026-10-02',
    estimated_decision_date: '2026-11-15',
    notes: 'Awaiting updated bank statement showing 6 months proof of funds.',
    internal_admin_notes: 'User has not yet uploaded bank statement; reminder flagged.',
    is_urgent: true,
    urgent_reason: 'Missing mandatory bank statement required before biometrics appointment.',
    created_at: '2026-10-01T09:00:00Z',
    updated_at: '2026-10-05T10:00:00Z',
  }
];

const DEFAULT_STEPS: VisaJourneyStep[] = [
  {
    id: 'step-1-1',
    application_id: 'app-1',
    user_id: 'user-traveler-1',
    step_order: 1,
    step_title: 'Application Created',
    step_description: 'Case dossier established and personal data verified.',
    status: 'completed',
    completed_at: '2026-09-15T11:30:00Z',
    created_at: '2026-09-15T11:00:00Z',
  },
  {
    id: 'step-1-2',
    application_id: 'app-1',
    user_id: 'user-traveler-1',
    step_order: 2,
    step_title: 'Documents Pending',
    step_description: 'Upload required employer contracts and passport copy.',
    status: 'completed',
    completed_at: '2026-09-17T16:00:00Z',
    created_at: '2026-09-15T11:00:00Z',
  },
  {
    id: 'step-1-3',
    application_id: 'app-1',
    user_id: 'user-traveler-1',
    step_order: 3,
    step_title: 'Documents Submitted',
    step_description: 'All dossier records submitted to the visa processing center.',
    status: 'completed',
    completed_at: '2026-09-18T14:00:00Z',
    created_at: '2026-09-15T11:00:00Z',
  },
  {
    id: 'step-1-4',
    application_id: 'app-1',
    user_id: 'user-traveler-1',
    step_order: 4,
    step_title: 'Application Under Review',
    step_description: 'Embassy consular section is conducting background verification.',
    status: 'current',
    created_at: '2026-09-15T11:00:00Z',
  },
  {
    id: 'step-1-5',
    application_id: 'app-1',
    user_id: 'user-traveler-1',
    step_order: 5,
    step_title: 'Decision Received',
    step_description: 'Final consular decision and passport collection instruction.',
    status: 'pending',
    created_at: '2026-09-15T11:00:00Z',
  },
  // Clara's Canadian steps
  {
    id: 'step-2-1',
    application_id: 'app-2',
    user_id: 'user-traveler-2',
    step_order: 1,
    step_title: 'Application Created',
    step_description: 'Initial intake created.',
    status: 'completed',
    completed_at: '2026-10-01T09:30:00Z',
    created_at: '2026-10-01T09:00:00Z',
  },
  {
    id: 'step-2-2',
    application_id: 'app-2',
    user_id: 'user-traveler-2',
    step_order: 2,
    step_title: 'Documents Pending',
    step_description: 'Upload bank statements and invitation letter.',
    status: 'current',
    created_at: '2026-10-01T09:00:00Z',
  },
  {
    id: 'step-2-3',
    application_id: 'app-2',
    user_id: 'user-traveler-2',
    step_order: 3,
    step_title: 'Documents Submitted',
    step_description: 'Files to be dispatched.',
    status: 'pending',
    created_at: '2026-10-01T09:00:00Z',
  },
  {
    id: 'step-2-4',
    application_id: 'app-2',
    user_id: 'user-traveler-2',
    step_order: 4,
    step_title: 'Application Under Review',
    step_description: 'Consular evaluation.',
    status: 'pending',
    created_at: '2026-10-01T09:00:00Z',
  },
  {
    id: 'step-2-5',
    application_id: 'app-2',
    user_id: 'user-traveler-2',
    step_order: 5,
    step_title: 'Decision Received',
    step_description: 'Passport stamping.',
    status: 'pending',
    created_at: '2026-10-01T09:00:00Z',
  }
];

const DEFAULT_UPDATES: ApplicationUpdate[] = [
  {
    id: 'update-1',
    application_id: 'app-1',
    author_id: 'user-admin-1',
    author_name: 'Viaggio Senior Officer',
    title: 'Biometrics verified successfully',
    message: 'Your biometrics and finger-scan appointment at VFS Center concluded without discrepancies. Dossier forwarded to the Consulate General.',
    is_internal_note: false,
    created_at: '2026-09-22T10:15:00Z',
  },
  {
    id: 'update-2',
    application_id: 'app-1',
    author_id: 'user-admin-1',
    author_name: 'Viaggio Senior Officer',
    title: 'Internal processing clearance',
    message: 'Consulate file tracking code received. Processing time standard is 15-25 business days.',
    is_internal_note: true,
    created_at: '2026-09-24T14:30:00Z',
  }
];

const DEFAULT_DOCUMENTS: UserDocument[] = [
  {
    id: 'doc-1',
    user_id: 'user-traveler-1',
    application_id: 'app-1',
    file_name: 'Passport_Scan_BioPage.pdf',
    file_path: 'user-traveler-1/passport_scan.pdf',
    file_size: 1420000,
    file_type: 'application/pdf',
    category: 'passport',
    status: 'verified',
    admin_comment: 'High resolution color scan accepted.',
    created_at: '2026-09-16T10:30:00Z',
  },
  {
    id: 'doc-2',
    user_id: 'user-traveler-1',
    application_id: 'app-1',
    file_name: 'Employment_Offer_Contract.pdf',
    file_path: 'user-traveler-1/employment_contract.pdf',
    file_size: 2840000,
    file_type: 'application/pdf',
    category: 'employment',
    status: 'verified',
    admin_comment: 'Original signature present.',
    created_at: '2026-09-16T11:00:00Z',
  },
  {
    id: 'doc-3',
    user_id: 'user-traveler-1',
    application_id: 'app-1',
    file_name: 'Travel_Health_Insurance_Policy.pdf',
    file_path: 'user-traveler-1/insurance_policy.pdf',
    file_size: 890000,
    file_type: 'application/pdf',
    category: 'itinerary',
    status: 'verified',
    admin_comment: 'Complies with €30,000 Schengen minimum coverage.',
    created_at: '2026-09-17T09:20:00Z',
  }
];

// Initialize local store if not present
function initializeLocalStoreIfNeeded() {
  const existingProfiles = getLocalStore<UserProfile[]>('profiles', []);
  const mergedProfiles = [...existingProfiles];
  DEFAULT_PROFILES.forEach(dp => {
    if (!mergedProfiles.some(p => p.email.toLowerCase() === dp.email.toLowerCase())) {
      mergedProfiles.push(dp);
    }
  });
  setLocalStore('profiles', mergedProfiles);

  const existingVisas = getLocalStore<VisaReminder[]>('visas', []);
  const mergedVisas = [...existingVisas];
  DEFAULT_VISAS.forEach(dv => {
    if (!mergedVisas.some(v => v.id === dv.id)) {
      mergedVisas.push(dv);
    }
  });
  setLocalStore('visas', mergedVisas);

  const existingPassports = getLocalStore<PassportDetail[]>('passports', []);
  const mergedPassports = [...existingPassports];
  DEFAULT_PASSPORTS.forEach(dp => {
    if (!mergedPassports.some(p => p.id === dp.id)) {
      mergedPassports.push(dp);
    }
  });
  setLocalStore('passports', mergedPassports);

  if (!localStorage.getItem(STORAGE_KEY_PREFIX + 'applications')) {
    setLocalStore('applications', DEFAULT_APPLICATIONS);
  }
  if (!localStorage.getItem(STORAGE_KEY_PREFIX + 'steps')) {
    setLocalStore('steps', DEFAULT_STEPS);
  }
  if (!localStorage.getItem(STORAGE_KEY_PREFIX + 'updates')) {
    setLocalStore('updates', DEFAULT_UPDATES);
  }
  if (!localStorage.getItem(STORAGE_KEY_PREFIX + 'documents')) {
    setLocalStore('documents', DEFAULT_DOCUMENTS);
  }
}

// -------------------------------------------------------------
// REPOSITORY METHODS (DATA ACCESS LAYER)
// -------------------------------------------------------------

export const DataService = {
  // --- PROFILES ---
  async getProfile(userId: string): Promise<UserProfile | null> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        if (!error && data) return data as UserProfile;
      } catch (err) {
        console.warn('Supabase profile fetch failed, falling back to local store', err);
      }
    }
    initializeLocalStoreIfNeeded();
    const profiles = getLocalStore<UserProfile[]>('profiles', DEFAULT_PROFILES);
    return profiles.find(p => p.id === userId) || null;
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', userId)
          .select()
          .single();
        if (!error && data) return data as UserProfile;
      } catch (err) {
        console.warn('Supabase profile update error', err);
      }
    }
    initializeLocalStoreIfNeeded();
    const profiles = getLocalStore<UserProfile[]>('profiles', DEFAULT_PROFILES);
    const idx = profiles.findIndex(p => p.id === userId);
    if (idx >= 0) {
      profiles[idx] = { ...profiles[idx], ...updates, updated_at: new Date().toISOString() };
      setLocalStore('profiles', profiles);
      return profiles[idx];
    }
    return null;
  },

  // --- VISA REMINDERS ---
  async getVisaReminders(userId: string): Promise<VisaReminder[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('visa_reminders')
          .select('*')
          .eq('user_id', userId)
          .order('expiry_date', { ascending: true });
        if (!error && data) return data as VisaReminder[];
      } catch (err) {
        console.warn('Supabase getVisaReminders failed', err);
      }
    }
    initializeLocalStoreIfNeeded();
    const visas = getLocalStore<VisaReminder[]>('visas', DEFAULT_VISAS);
    return visas
      .filter(v => v.user_id === userId)
      .map(v => ({ ...v, status: determineVisaStatus(v.expiry_date) }))
      .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());
  },

  async createVisaReminder(reminder: Omit<VisaReminder, 'id' | 'created_at'>): Promise<VisaReminder> {
    const computedStatus = determineVisaStatus(reminder.expiry_date);
    const itemToInsert = { ...reminder, status: computedStatus };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('visa_reminders')
          .insert(itemToInsert)
          .select()
          .single();
        if (!error && data) return data as VisaReminder;
      } catch (err) {
        console.warn('Supabase createVisaReminder failed', err);
      }
    }
    initializeLocalStoreIfNeeded();
    const visas = getLocalStore<VisaReminder[]>('visas', DEFAULT_VISAS);
    const newVisa: VisaReminder = {
      ...itemToInsert,
      id: 'visa-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    visas.push(newVisa);
    setLocalStore('visas', visas);
    return newVisa;
  },

  async updateVisaReminder(id: string, updates: Partial<VisaReminder>): Promise<VisaReminder | null> {
    if (updates.expiry_date) {
      updates.status = determineVisaStatus(updates.expiry_date);
    }
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('visa_reminders')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return data as VisaReminder;
      } catch (err) {
        console.warn('Supabase updateVisaReminder failed', err);
      }
    }
    initializeLocalStoreIfNeeded();
    const visas = getLocalStore<VisaReminder[]>('visas', DEFAULT_VISAS);
    const idx = visas.findIndex(v => v.id === id);
    if (idx >= 0) {
      visas[idx] = { ...visas[idx], ...updates, updated_at: new Date().toISOString() };
      setLocalStore('visas', visas);
      return visas[idx];
    }
    return null;
  },

  async deleteVisaReminder(id: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('visa_reminders')
          .delete()
          .eq('id', id);
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase deleteVisaReminder failed', err);
      }
    }
    initializeLocalStoreIfNeeded();
    const visas = getLocalStore<VisaReminder[]>('visas', DEFAULT_VISAS);
    const filtered = visas.filter(v => v.id !== id);
    setLocalStore('visas', filtered);
    return true;
  },

  // --- PASSPORT DETAILS ---
  async getPassportDetails(userId: string): Promise<PassportDetail[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('passport_details')
          .select('*')
          .eq('user_id', userId)
          .order('expiry_date', { ascending: true });
        if (!error && data) return data as PassportDetail[];
      } catch (err) {
        console.warn('Supabase getPassportDetails failed', err);
      }
    }
    initializeLocalStoreIfNeeded();
    const passports = getLocalStore<PassportDetail[]>('passports', DEFAULT_PASSPORTS);
    return passports.filter(p => p.user_id === userId);
  },

  async savePassportDetail(passport: Omit<PassportDetail, 'id' | 'created_at'>): Promise<PassportDetail> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('passport_details')
          .insert(passport)
          .select()
          .single();
        if (!error && data) return data as PassportDetail;
      } catch (err) {
        console.warn('Supabase savePassportDetail failed', err);
      }
    }
    initializeLocalStoreIfNeeded();
    const passports = getLocalStore<PassportDetail[]>('passports', DEFAULT_PASSPORTS);
    const newPassport: PassportDetail = {
      ...passport,
      id: 'pass-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    passports.push(newPassport);
    setLocalStore('passports', passports);
    return newPassport;
  },

  async updatePassportDetail(id: string, updates: Partial<PassportDetail>): Promise<PassportDetail | null> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('passport_details')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return data as PassportDetail;
      } catch (err) {
        console.warn('Supabase updatePassportDetail failed', err);
      }
    }
    initializeLocalStoreIfNeeded();
    const passports = getLocalStore<PassportDetail[]>('passports', DEFAULT_PASSPORTS);
    const idx = passports.findIndex(p => p.id === id);
    if (idx >= 0) {
      passports[idx] = { ...passports[idx], ...updates, updated_at: new Date().toISOString() };
      setLocalStore('passports', passports);
      return passports[idx];
    }
    return null;
  },

  async deletePassportDetail(id: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('passport_details')
          .delete()
          .eq('id', id);
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase deletePassportDetail failed', err);
      }
    }
    initializeLocalStoreIfNeeded();
    const passports = getLocalStore<PassportDetail[]>('passports', DEFAULT_PASSPORTS);
    const filtered = passports.filter(p => p.id !== id);
    setLocalStore('passports', filtered);
    return true;
  },

  // --- VISA APPLICATIONS & JOURNEY ---
  async getVisaApplications(userId: string): Promise<VisaApplication[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('visa_applications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        if (!error && data) return data as VisaApplication[];
      } catch (err) {
        console.warn('Supabase getVisaApplications failed', err);
      }
    }
    initializeLocalStoreIfNeeded();
    const apps = getLocalStore<VisaApplication[]>('applications', DEFAULT_APPLICATIONS);
    return apps.filter(a => a.user_id === userId);
  },

  async getVisaApplicationById(id: string): Promise<VisaApplication | null> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('visa_applications')
          .select('*')
          .eq('id', id)
          .single();
        if (!error && data) return data as VisaApplication;
      } catch (err) {
        console.warn('Supabase getVisaApplicationById failed', err);
      }
    }
    initializeLocalStoreIfNeeded();
    const apps = getLocalStore<VisaApplication[]>('applications', DEFAULT_APPLICATIONS);
    return apps.find(a => a.id === id) || null;
  },

  async createVisaApplication(
    app: Omit<VisaApplication, 'id' | 'created_at'>
  ): Promise<{ application: VisaApplication; steps: VisaJourneyStep[] }> {
    const defaultStageTitles: { title: VisaApplication['current_stage']; desc: string }[] = [
      { title: 'Application Created', desc: 'Case file opened and initial information logged.' },
      { title: 'Documents Pending', desc: 'Required documentation being compiled.' },
      { title: 'Documents Submitted', desc: 'Dossier successfully submitted to processing agency.' },
      { title: 'Application Under Review', desc: 'Consulate officer evaluating credentials.' },
      { title: 'Decision Received', desc: 'Official outcome ready for notification.' },
    ];

    if (isSupabaseConfigured) {
      try {
        const { data: newApp, error: appError } = await supabase
          .from('visa_applications')
          .insert(app)
          .select()
          .single();
        if (!appError && newApp) {
          const stepsToInsert = defaultStageTitles.map((item, index) => ({
            application_id: newApp.id,
            user_id: newApp.user_id,
            step_order: index + 1,
            step_title: item.title,
            step_description: item.desc,
            status: index === 0 ? 'completed' : index === 1 ? 'current' : 'pending',
            completed_at: index === 0 ? new Date().toISOString() : null,
          }));
          const { data: createdSteps } = await supabase
            .from('visa_journey_steps')
            .insert(stepsToInsert)
            .select();
          return { application: newApp as VisaApplication, steps: (createdSteps || []) as VisaJourneyStep[] };
        }
      } catch (err) {
        console.warn('Supabase createVisaApplication failed', err);
      }
    }

    initializeLocalStoreIfNeeded();
    const apps = getLocalStore<VisaApplication[]>('applications', DEFAULT_APPLICATIONS);
    const steps = getLocalStore<VisaJourneyStep[]>('steps', DEFAULT_STEPS);

    const newAppId = 'app-' + Date.now();
    const newApp: VisaApplication = {
      ...app,
      id: newAppId,
      created_at: new Date().toISOString(),
    };
    apps.unshift(newApp);
    setLocalStore('applications', apps);

    const createdSteps: VisaJourneyStep[] = defaultStageTitles.map((item, index) => ({
      id: `step-${newAppId}-${index + 1}`,
      application_id: newAppId,
      user_id: app.user_id,
      step_order: index + 1,
      step_title: item.title,
      step_description: item.desc,
      status: index === 0 ? 'completed' : index === 1 ? 'current' : 'pending',
      completed_at: index === 0 ? new Date().toISOString() : undefined,
      created_at: new Date().toISOString(),
    }));
    steps.push(...createdSteps);
    setLocalStore('steps', steps);

    return { application: newApp, steps: createdSteps };
  },

  async updateVisaApplication(id: string, updates: Partial<VisaApplication>): Promise<VisaApplication | null> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('visa_applications')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return data as VisaApplication;
      } catch (err) {
        console.warn('Supabase updateVisaApplication failed', err);
      }
    }
    initializeLocalStoreIfNeeded();
    const apps = getLocalStore<VisaApplication[]>('applications', DEFAULT_APPLICATIONS);
    const idx = apps.findIndex(a => a.id === id);
    if (idx >= 0) {
      apps[idx] = { ...apps[idx], ...updates, updated_at: new Date().toISOString() };
      setLocalStore('applications', apps);
      return apps[idx];
    }
    return null;
  },

  async getJourneySteps(applicationId: string): Promise<VisaJourneyStep[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('visa_journey_steps')
          .select('*')
          .eq('application_id', applicationId)
          .order('step_order', { ascending: true });
        if (!error && data) return data as VisaJourneyStep[];
      } catch (err) {
        console.warn('Supabase getJourneySteps failed', err);
      }
    }
    initializeLocalStoreIfNeeded();
    const steps = getLocalStore<VisaJourneyStep[]>('steps', DEFAULT_STEPS);
    return steps
      .filter(s => s.application_id === applicationId)
      .sort((a, b) => a.step_order - b.step_order);
  },

  async updateJourneyStep(stepId: string, status: 'completed' | 'current' | 'pending'): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('visa_journey_steps')
          .update({
            status,
            completed_at: status === 'completed' ? new Date().toISOString() : null,
          })
          .eq('id', stepId);
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase updateJourneyStep failed', err);
      }
    }
    initializeLocalStoreIfNeeded();
    const steps = getLocalStore<VisaJourneyStep[]>('steps', DEFAULT_STEPS);
    const idx = steps.findIndex(s => s.id === stepId);
    if (idx >= 0) {
      steps[idx].status = status;
      steps[idx].completed_at = status === 'completed' ? new Date().toISOString() : undefined;
      setLocalStore('steps', steps);
      return true;
    }
    return false;
  },

  async getApplicationUpdates(applicationId: string, isAdmin = false): Promise<ApplicationUpdate[]> {
    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('application_updates')
          .select('*')
          .eq('application_id', applicationId);
        if (!isAdmin) {
          query = query.eq('is_internal_note', false);
        }
        const { data, error } = await query.order('created_at', { ascending: false });
        if (!error && data) return data as ApplicationUpdate[];
      } catch (err) {
        console.warn('Supabase getApplicationUpdates failed', err);
      }
    }
    initializeLocalStoreIfNeeded();
    const updates = getLocalStore<ApplicationUpdate[]>('updates', DEFAULT_UPDATES);
    return updates
      .filter(u => u.application_id === applicationId && (isAdmin ? true : !u.is_internal_note))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async addApplicationUpdate(update: Omit<ApplicationUpdate, 'id' | 'created_at'>): Promise<ApplicationUpdate> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('application_updates')
          .insert(update)
          .select()
          .single();
        if (!error && data) return data as ApplicationUpdate;
      } catch (err) {
        console.warn('Supabase addApplicationUpdate failed', err);
      }
    }
    initializeLocalStoreIfNeeded();
    const updates = getLocalStore<ApplicationUpdate[]>('updates', DEFAULT_UPDATES);
    const newUpdate: ApplicationUpdate = {
      ...update,
      id: 'update-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    updates.unshift(newUpdate);
    setLocalStore('updates', updates);
    return newUpdate;
  },

  // --- USER DOCUMENTS ---
  async getUserDocuments(userId: string): Promise<UserDocument[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('user_documents')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        if (!error && data) return data as UserDocument[];
      } catch (err) {
        console.warn('Supabase getUserDocuments failed', err);
      }
    }
    initializeLocalStoreIfNeeded();
    const docs = getLocalStore<UserDocument[]>('documents', DEFAULT_DOCUMENTS);
    return docs.filter(d => d.user_id === userId);
  },

  async uploadUserDocument(
    doc: Omit<UserDocument, 'id' | 'created_at'>,
    file?: File
  ): Promise<UserDocument> {
    let filePath = doc.file_path;

    if (isSupabaseConfigured && file) {
      try {
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `${doc.user_id}/${Date.now()}_${sanitizedName}`;
        const { error: uploadError } = await supabase.storage
          .from('travel-documents')
          .upload(storagePath, file, { cacheControl: '3600', upsert: false });
        if (!uploadError) {
          filePath = storagePath;
        }
      } catch (err) {
        console.warn('Supabase storage upload failed', err);
      }

      try {
        const { data, error } = await supabase
          .from('user_documents')
          .insert({ ...doc, file_path: filePath })
          .select()
          .single();
        if (!error && data) return data as UserDocument;
      } catch (err) {
        console.warn('Supabase insert user_documents failed', err);
      }
    }

    initializeLocalStoreIfNeeded();
    const docs = getLocalStore<UserDocument[]>('documents', DEFAULT_DOCUMENTS);
    const newDoc: UserDocument = {
      ...doc,
      file_path: filePath,
      id: 'doc-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    docs.unshift(newDoc);
    setLocalStore('documents', docs);
    return newDoc;
  },

  async deleteUserDocument(docId: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('user_documents')
          .delete()
          .eq('id', docId);
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase deleteUserDocument failed', err);
      }
    }
    initializeLocalStoreIfNeeded();
    const docs = getLocalStore<UserDocument[]>('documents', DEFAULT_DOCUMENTS);
    const filtered = docs.filter(d => d.id !== docId);
    setLocalStore('documents', filtered);
    return true;
  },

  // -------------------------------------------------------------
  // ADMIN PORTAL QUERIES (DATABASE-LEVEL AGGREGATIONS & RECORDS)
  // -------------------------------------------------------------
  async adminGetAllUsers(): Promise<UserProfile[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) return data as UserProfile[];
      } catch (err) {
        console.warn('Supabase adminGetAllUsers failed', err);
      }
    }
    initializeLocalStoreIfNeeded();
    return getLocalStore<UserProfile[]>('profiles', DEFAULT_PROFILES);
  },

  async adminGetAllApplications(): Promise<VisaApplication[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('visa_applications')
          .select(`
            *,
            profiles:user_id (email, full_name)
          `)
          .order('created_at', { ascending: false });
        if (!error && data) {
          return data.map((item: any) => ({
            ...item,
            user_email: item.profiles?.email || 'traveler@viaggio.app',
            user_name: item.profiles?.full_name || 'Traveler',
          }));
        }
      } catch (err) {
        console.warn('Supabase adminGetAllApplications failed', err);
      }
    }
    initializeLocalStoreIfNeeded();
    return getLocalStore<VisaApplication[]>('applications', DEFAULT_APPLICATIONS);
  },

  async adminGetAllPassports(): Promise<PassportDetail[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('passport_details')
          .select('*')
          .order('expiry_date', { ascending: true });
        if (!error && data) return data as PassportDetail[];
      } catch (err) {
        console.warn('Supabase adminGetAllPassports failed', err);
      }
    }
    initializeLocalStoreIfNeeded();
    return getLocalStore<PassportDetail[]>('passports', DEFAULT_PASSPORTS);
  },

  async adminGetAllVisas(): Promise<VisaReminder[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('visa_reminders')
          .select('*')
          .order('expiry_date', { ascending: true });
        if (!error && data) return data as VisaReminder[];
      } catch (err) {
        console.warn('Supabase adminGetAllVisas failed', err);
      }
    }
    initializeLocalStoreIfNeeded();
    const visas = getLocalStore<VisaReminder[]>('visas', DEFAULT_VISAS);
    return visas.map(v => ({ ...v, status: determineVisaStatus(v.expiry_date) }));
  },

  async adminGetUrgentCases(): Promise<UrgentCaseItem[]> {
    initializeLocalStoreIfNeeded();
    const [visas, passports, apps, docs, profiles] = await Promise.all([
      this.adminGetAllVisas(),
      this.adminGetAllPassports(),
      this.adminGetAllApplications(),
      getLocalStore<UserDocument[]>('documents', DEFAULT_DOCUMENTS),
      this.adminGetAllUsers(),
    ]);

    const userMap = new Map<string, UserProfile>();
    profiles.forEach(p => userMap.set(p.id, p));

    const urgentCases: UrgentCaseItem[] = [];

    // 1. Visas expiring in <= 30 days
    visas.forEach(v => {
      const days = calculateDaysRemaining(v.expiry_date);
      const user = userMap.get(v.user_id);
      if (days <= 30) {
        urgentCases.push({
          id: `case-visa-${v.id}`,
          user_id: v.user_id,
          user_name: user?.full_name || 'Traveler',
          user_email: user?.email || '',
          title: `${v.country} (${v.visa_type}) Renewal Required`,
          type: 'visa_expiry',
          severity: days < 0 ? 'urgent' : 'warning',
          reason: days < 0 ? `Visa expired ${Math.abs(days)} days ago.` : `Visa expires in ${days} days. Embassy processing buffer is critical.`,
          target_date: v.expiry_date,
          days_remaining: days,
        });
      }
    });

    // 2. Passports expiring in <= 180 days (6-month rule violation warning)
    passports.forEach(p => {
      const days = calculateDaysRemaining(p.expiry_date);
      const user = userMap.get(p.user_id);
      if (days <= 180) {
        urgentCases.push({
          id: `case-pass-${p.id}`,
          user_id: p.user_id,
          user_name: user?.full_name || 'Traveler',
          user_email: user?.email || '',
          title: `${p.issuing_country} Passport (${maskPassportNumber(p.passport_number)}) Expiring`,
          type: 'passport_expiry',
          severity: days <= 60 ? 'urgent' : 'warning',
          reason: `Breaches 6-month validity threshold for international transit in ${days} days.`,
          target_date: p.expiry_date,
          days_remaining: days,
        });
      }
    });

    // 3. Applications with missing documents or marked urgent
    apps.forEach(a => {
      const user = userMap.get(a.user_id);
      if (a.is_urgent) {
        urgentCases.push({
          id: `case-app-${a.id}`,
          user_id: a.user_id,
          user_name: a.user_name || user?.full_name || 'Traveler',
          user_email: a.user_email || user?.email || '',
          title: `${a.country} Visa Case Flagged`,
          type: 'missing_document',
          severity: 'urgent',
          reason: a.urgent_reason || 'Application marked urgent by administrator due to document delay.',
          target_date: a.estimated_decision_date,
        });
      }
    });

    return urgentCases;
  },

  async adminGetOverviewStats() {
    initializeLocalStoreIfNeeded();
    const [profiles, apps, visas, passports, docs] = await Promise.all([
      this.adminGetAllUsers(),
      this.adminGetAllApplications(),
      this.adminGetAllVisas(),
      this.adminGetAllPassports(),
      getLocalStore<UserDocument[]>('documents', DEFAULT_DOCUMENTS),
    ]);

    const activeUsers = profiles.filter(p => p.role === 'user');
    const inProgressApps = apps.filter(a => a.status === 'in_progress' || a.status === 'under_review');
    const completedApps = apps.filter(a => a.status === 'decision_received' || a.status === 'approved');
    const upcomingVisaExpiries = visas.filter(v => calculateDaysRemaining(v.expiry_date) <= 60);
    const upcomingPassportExpiries = passports.filter(p => calculateDaysRemaining(p.expiry_date) <= 180);
    const missingDocsCount = apps.filter(a => a.current_stage === 'Documents Pending' || a.is_urgent).length;
    const delayedApps = apps.filter(a => a.status === 'delayed' || a.is_urgent);

    return {
      totalUsers: activeUsers.length,
      totalApplications: apps.length,
      applicationsInProgress: inProgressApps.length,
      completedApplications: completedApps.length,
      upcomingVisaExpirations: upcomingVisaExpiries.length,
      upcomingPassportExpirations: upcomingPassportExpiries.length,
      missingDocumentsCount: missingDocsCount,
      delayedApplicationsCount: delayedApps.length,
    };
  },

  // -------------------------------------------------------------
  // PASSPORT & ASSIGNED VISAS CROSS-CHECK ENGINE
  // -------------------------------------------------------------
  async getVisasByPassport(passportNumber: string, userId?: string): Promise<VisaReminder[]> {
    if (!passportNumber) return [];
    initializeLocalStoreIfNeeded();
    const cleanNum = passportNumber.trim().toLowerCase();
    
    let allVisas: VisaReminder[] = [];
    if (userId) {
      allVisas = await this.getVisaReminders(userId);
    } else {
      allVisas = await this.adminGetAllVisas();
    }

    return allVisas.filter(v => (v.passport_number || '').trim().toLowerCase() === cleanNum);
  },

  async checkPassportAndVisas(passportNumber: string, userId?: string): Promise<PassportCheckResult> {
    const cleanNum = (passportNumber || '').trim();
    if (!cleanNum) {
      return {
        passportNumber: '',
        passport: null,
        passportDaysRemaining: null,
        passportStatus: 'not_found',
        assignedVisas: [],
        warnings: ['Please enter a passport number to begin verification.'],
      };
    }

    initializeLocalStoreIfNeeded();
    
    // Look up passport across user's passports or all passports
    const allPassports = userId 
      ? await this.getPassportDetails(userId) 
      : await this.adminGetAllPassports();

    const matchedPassport = allPassports.find(
      p => p.passport_number.trim().toLowerCase() === cleanNum.toLowerCase()
    ) || null;

    // Look up assigned visas
    const assignedVisas = await this.getVisasByPassport(cleanNum, userId);

    const warnings: string[] = [];
    let passportDays: number | null = null;
    let passportStatus: PassportCheckResult['passportStatus'] = 'not_found';

    if (matchedPassport) {
      passportDays = calculateDaysRemaining(matchedPassport.expiry_date);
      
      if (passportDays < 0) {
        passportStatus = 'expired';
        warnings.push(`Passport expired ${Math.abs(passportDays)} days ago. All attached visas cannot be presented for international travel.`);
      } else if (passportDays <= 45) {
        passportStatus = 'urgent';
        warnings.push(`CRITICAL: Passport expires in only ${passportDays} days! International travel strictly prohibited.`);
      } else if (passportDays <= 90) {
        passportStatus = 'expiring_soon';
        warnings.push(`Passport expires in ${passportDays} days (<90-day threshold). Immediate consular renewal advised.`);
      } else if (passportDays <= 180) {
        passportStatus = 'valid';
        warnings.push(`Warning: Passport expires in ${passportDays} days. Breaches the mandatory 6-month validity threshold for many international destinations.`);
      } else {
        passportStatus = 'valid';
      }

      // Cross-check each assigned visa against passport validity
      assignedVisas.forEach(visa => {
        const visaDays = calculateDaysRemaining(visa.expiry_date);
        if (new Date(visa.expiry_date) > new Date(matchedPassport.expiry_date)) {
          warnings.push(
            `Embassy Validity Conflict: ${visa.country} visa expires on ${visa.expiry_date}, which is AFTER passport expiry date (${matchedPassport.expiry_date}). Visas cannot remain valid past passport expiration.`
          );
        }
        if (visaDays <= 30 && visaDays >= 0) {
          warnings.push(`${visa.country} visa requires urgent renewal (${visaDays} days remaining).`);
        }
      });
    } else {
      passportStatus = 'not_found';
      warnings.push(`Passport number "${cleanNum}" is not yet registered in your vault. You can assign visas or record it now.`);
    }

    return {
      passportNumber: cleanNum,
      passport: matchedPassport,
      passportDaysRemaining: passportDays,
      passportStatus,
      assignedVisas,
      warnings,
    };
  },

  // -------------------------------------------------------------
  // AUTOMATED REMINDERS (<90 DAYS: 30, 20, 15 DAYS AUTO-EMAIL)
  // -------------------------------------------------------------
  async getExpiringItemsUnder90Days(userId?: string) {
    initializeLocalStoreIfNeeded();
    const visas = userId ? await this.getVisaReminders(userId) : await this.adminGetAllVisas();
    const passports = userId ? await this.getPassportDetails(userId) : await this.adminGetAllPassports();

    const items: Array<{
      id: string;
      itemType: 'visa' | 'passport';
      title: string;
      country?: string;
      passportNumber?: string;
      issueDate: string;
      expiryDate: string;
      targetDate: string;
      daysRemaining: number;
      status: string;
      triggerTier: 30 | 20 | 15 | 60 | 0;
      isUrgent: boolean;
      notes?: string;
    }> = [];

    // Check visas < 90 days
    visas.forEach(v => {
      const days = calculateDaysRemaining(v.expiry_date);
      if (days <= 90) {
        let triggerTier: 30 | 20 | 15 | 60 | 0 = 60;
        if (days <= 0) triggerTier = 0;
        else if (days <= 15) triggerTier = 15;
        else if (days <= 20) triggerTier = 20;
        else if (days <= 30) triggerTier = 30;

        items.push({
          id: `visa-${v.id}`,
          itemType: 'visa',
          title: `${v.country} (${v.visa_type})`,
          country: v.country,
          passportNumber: v.passport_number,
          issueDate: v.issue_date,
          expiryDate: v.expiry_date,
          targetDate: v.expiry_date,
          daysRemaining: days,
          status: v.status,
          triggerTier,
          isUrgent: days <= 20,
          notes: v.notes,
        });
      }
    });

    // Check passports < 90 days
    passports.forEach(p => {
      const days = calculateDaysRemaining(p.expiry_date);
      if (days <= 90) {
        let triggerTier: 30 | 20 | 15 | 60 | 0 = 60;
        if (days <= 0) triggerTier = 0;
        else if (days <= 15) triggerTier = 15;
        else if (days <= 20) triggerTier = 20;
        else if (days <= 30) triggerTier = 30;

        items.push({
          id: `passport-${p.id}`,
          itemType: 'passport',
          title: `${p.issuing_country} Passport (${p.passport_number})`,
          country: p.issuing_country,
          passportNumber: p.passport_number,
          issueDate: p.issue_date,
          expiryDate: p.expiry_date,
          targetDate: p.expiry_date,
          daysRemaining: days,
          status: days < 0 ? 'expired' : days <= 30 ? 'renewal_required' : 'expiring_soon',
          triggerTier,
          isUrgent: days <= 20,
          notes: p.notes,
        });
      }
    });

    return items.sort((a, b) => a.daysRemaining - b.daysRemaining);
  },

  // SMTP Settings & Dispatcher
  getSmtpConfig(): SmtpConfig {
    const defaultConf: SmtpConfig = {
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      user: '',
      pass: '',
      fromName: 'Viaggio Expiry Guardian',
      fromEmail: 'viaggio.remaninder@gmail.com',
      enabled: true,
      useTestMode: true,
    };
    return getLocalStore<SmtpConfig>('smtp_config', defaultConf);
  },

  saveSmtpConfig(config: SmtpConfig): void {
    setLocalStore('smtp_config', config);
  },

  getSmtpLogs(): EmailReminderLog[] {
    return getLocalStore<EmailReminderLog[]>('smtp_logs', []);
  },

  addSmtpLog(log: EmailReminderLog): void {
    const logs = this.getSmtpLogs();
    logs.unshift(log);
    setLocalStore('smtp_logs', logs.slice(0, 50)); // keep last 50
  },

  async triggerSmtpReminders(
    recipientEmail: string,
    userId?: string,
    customConfig?: SmtpConfig
  ): Promise<{ success: boolean; dispatchedCount: number; logs: EmailReminderLog[]; message?: string }> {
    const items = await this.getExpiringItemsUnder90Days(userId);
    const config = customConfig || this.getSmtpConfig();

    if (items.length === 0) {
      return {
        success: true,
        dispatchedCount: 0,
        logs: [],
        message: 'All passports and visas are currently outside the <90 day alert window.',
      };
    }

    try {
      const response = await fetch('/api/smtp/check-and-send-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          recipientEmail: recipientEmail || 'krishnaanil116@gmail.com',
          config,
        }),
      });

      const data = await response.json();
      if (data.success && Array.isArray(data.logs)) {
        data.logs.forEach((l: EmailReminderLog) => this.addSmtpLog(l));
      }

      return {
        success: data.success,
        dispatchedCount: data.dispatchedCount || 0,
        logs: data.logs || [],
        message: data.message,
      };
    } catch (err: any) {
      console.error('Failed to dispatch reminders via server API', err);
      return {
        success: false,
        dispatchedCount: 0,
        logs: [],
        message: err.message || 'Server communication failed.',
      };
    }
  },

  // Consular Mailbox Service
  async getMailboxMessages(): Promise<MailboxMessage[]> {
    try {
      const response = await fetch('/api/mailbox');
      const data = await response.json();
      if (data.success && Array.isArray(data.messages)) {
        return data.messages;
      }
    } catch (e) {
      console.warn('Mailbox fetch failed, falling back to local store:', e);
    }
    return getLocalStore<MailboxMessage[]>('mailbox_messages', []);
  },

  async markMailboxRead(id?: string): Promise<void> {
    try {
      await fetch('/api/mailbox/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch (e) {
      console.warn('Mailbox mark-read failed:', e);
    }
  },

  async triggerAutomatedExpiryCheck(): Promise<boolean> {
    try {
      const res = await fetch('/api/mailbox/trigger-auto', { method: 'POST' });
      const data = await res.json();
      return Boolean(data.success);
    } catch (e) {
      return false;
    }
  },

  // -------------------------------------------------------------
  // SUPABASE SEEDING & DATA SYNC (LIVE BACKEND SYNCHRONIZATION)
  // -------------------------------------------------------------
  async syncAllDataToSupabase(): Promise<{ success: boolean; count: number; error?: string }> {
    if (!isSupabaseConfigured) {
      return { success: false, count: 0, error: 'Supabase is not configured yet. Please configure URL and Anon Key.' };
    }

    initializeLocalStoreIfNeeded();
    let count = 0;

    try {
      // 1. Sync Profiles
      const profiles = getLocalStore<UserProfile[]>('profiles', DEFAULT_PROFILES);
      for (const p of profiles) {
        // Upsert into profiles
        const { error } = await supabase.from('profiles').upsert({
          id: p.id.startsWith('user-') ? '00000000-0000-0000-0000-00000000000' + p.id.replace('user-', '') : p.id,
          email: p.email,
          full_name: p.full_name,
          role: p.role,
        }, { onConflict: 'email' });
        if (!error) count++;
      }

      // 2. Sync Passports
      const passports = getLocalStore<PassportDetail[]>('passports', DEFAULT_PASSPORTS);
      for (const pass of passports) {
        await supabase.from('passport_details').upsert({
          user_id: pass.user_id.startsWith('user-') ? '00000000-0000-0000-0000-00000000000' + pass.user_id.replace('user-', '') : pass.user_id,
          issuing_country: pass.issuing_country,
          passport_number: pass.passport_number,
          issue_date: pass.issue_date,
          expiry_date: pass.expiry_date,
          notes: pass.notes,
        });
        count++;
      }

      // 3. Sync Visas
      const visas = getLocalStore<VisaReminder[]>('visas', DEFAULT_VISAS);
      for (const v of visas) {
        await supabase.from('visa_reminders').upsert({
          user_id: v.user_id.startsWith('user-') ? '00000000-0000-0000-0000-00000000000' + v.user_id.replace('user-', '') : v.user_id,
          country: v.country,
          visa_type: v.visa_type,
          issue_date: v.issue_date,
          expiry_date: v.expiry_date,
          status: v.status,
          notes: (v.passport_number ? `Passport: ${v.passport_number}. ` : '') + (v.notes || ''),
        });
        count++;
      }

      return { success: true, count };
    } catch (err: any) {
      console.error('Supabase sync failed:', err);
      return { success: false, count, error: err.message || 'Sync failed.' };
    }
  }
};


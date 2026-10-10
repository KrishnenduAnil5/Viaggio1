export type UserRole = 'user' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
}

export type VisaStatus = 'valid' | 'expiring_soon' | 'renewal_required' | 'expired';

export interface VisaReminder {
  id: string;
  user_id: string;
  country: string;
  visa_type: string;
  issue_date: string;
  expiry_date: string;
  reminder_intervals: number[]; // e.g. [90, 60, 30]
  status: VisaStatus;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface PassportDetail {
  id: string;
  user_id: string;
  issuing_country: string;
  passport_number: string;
  issue_date: string;
  expiry_date: string;
  reminder_intervals: number[]; // e.g. [180, 90, 30]
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export type ApplicationStage = 
  | 'Application Created'
  | 'Documents Pending'
  | 'Documents Submitted'
  | 'Application Under Review'
  | 'Decision Received';

export interface VisaApplication {
  id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  country: string;
  visa_type: string;
  reference_number?: string;
  status: 'draft' | 'in_progress' | 'under_review' | 'decision_received' | 'approved' | 'delayed';
  current_stage: ApplicationStage;
  submission_date?: string;
  estimated_decision_date?: string;
  notes?: string;
  internal_admin_notes?: string;
  is_urgent: boolean;
  urgent_reason?: string;
  created_at: string;
  updated_at?: string;
}

export interface VisaJourneyStep {
  id: string;
  application_id: string;
  user_id: string;
  step_order: number;
  step_title: ApplicationStage | string;
  step_description?: string;
  status: 'completed' | 'current' | 'pending';
  completed_at?: string;
  created_at: string;
}

export interface ApplicationUpdate {
  id: string;
  application_id: string;
  author_id?: string;
  author_name?: string;
  title: string;
  message: string;
  is_internal_note: boolean;
  created_at: string;
}

export type DocumentCategory = 
  | 'passport'
  | 'financial'
  | 'employment'
  | 'itinerary'
  | 'photo'
  | 'accommodation'
  | 'other';

export interface UserDocument {
  id: string;
  user_id: string;
  application_id?: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  category: DocumentCategory;
  status: 'pending_review' | 'verified' | 'rejected';
  admin_comment?: string;
  created_at: string;
}

export interface UrgentCaseItem {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  title: string;
  type: 'visa_expiry' | 'passport_expiry' | 'missing_document' | 'delayed_application';
  severity: 'urgent' | 'warning';
  reason: string;
  target_date?: string;
  days_remaining?: number;
}

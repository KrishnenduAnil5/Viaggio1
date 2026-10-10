import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/authContext';
import { DataService, calculateDaysRemaining, maskPassportNumber } from '../lib/storage';
import { 
  UserProfile, 
  VisaApplication, 
  PassportDetail, 
  VisaReminder, 
  UrgentCaseItem,
  ApplicationStage,
  ApplicationUpdate
} from '../types';
import { 
  ShieldCheck, 
  Users, 
  FileText, 
  Calendar, 
  AlertTriangle, 
  BarChart3, 
  Search, 
  CheckCircle2, 
  Clock, 
  Layers, 
  FileCheck, 
  LogOut, 
  Lock, 
  ChevronRight, 
  Plus, 
  X, 
  Compass, 
  FolderLock 
} from 'lucide-react';

interface AdminPageProps {
  onNavigate: (path: string) => void;
}

type AdminTab = 
  | 'overview' 
  | 'users' 
  | 'applications' 
  | 'passports' 
  | 'visas' 
  | 'stages' 
  | 'urgent' 
  | 'analytics';

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigate }) => {
  const { user, isAdmin, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(true);

  // Database Data States
  const [stats, setStats] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [allApplications, setAllApplications] = useState<VisaApplication[]>([]);
  const [allPassports, setAllPassports] = useState<PassportDetail[]>([]);
  const [allVisas, setAllVisas] = useState<VisaReminder[]>([]);
  const [urgentCases, setUrgentCases] = useState<UrgentCaseItem[]>([]);

  // Search & Filter States
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<UserProfile | null>(null);

  // Application Stage Management Modal
  const [editingApp, setEditingApp] = useState<VisaApplication | null>(null);
  const [newStage, setNewStage] = useState<ApplicationStage>('Application Created');
  const [publicUpdateTitle, setPublicUpdateTitle] = useState('');
  const [publicUpdateMessage, setPublicUpdateMessage] = useState('');
  const [internalAdminNote, setInternalAdminNote] = useState('');
  const [markUrgent, setMarkUrgent] = useState(false);
  const [urgentReason, setUrgentReason] = useState('');

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [
        overviewStats,
        usersList,
        appsList,
        passportsList,
        visasList,
        casesList
      ] = await Promise.all([
        DataService.adminGetOverviewStats(),
        DataService.adminGetAllUsers(),
        DataService.adminGetAllApplications(),
        DataService.adminGetAllPassports(),
        DataService.adminGetAllVisas(),
        DataService.adminGetUrgentCases(),
      ]);

      setStats(overviewStats);
      setAllUsers(usersList);
      setAllApplications(appsList);
      setAllPassports(passportsList);
      setAllVisas(visasList);
      setUrgentCases(casesList);
    } catch (err) {
      console.error('Failed to load administrative data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin]);

  // If user is not authorized as admin, block access immediately
  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl border border-[#EAE5DF] p-8 max-w-md w-full text-center shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-[#C95C54]/10 text-[#C95C54] flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="font-editorial text-2xl font-bold text-[#111111] mb-2">
            Access Restricted
          </h2>
          <p className="text-xs text-[#77716B] leading-relaxed mb-6">
            The administrator console requires trusted server-verified privileges. Your current account ({user?.email || 'Guest'}) does not possess administrative authorization.
          </p>
          <div className="p-3 bg-[#F7F1E9] rounded-xl text-xs text-[#111111] mb-6 text-left border border-[#EAE5DF]">
            <p className="font-semibold mb-1">To access the admin portal:</p>
            <p className="text-[#77716B]">Sign in with authorized credentials (<code className="font-mono text-[#111111]">admin@gmail.com</code> / <code className="font-mono text-[#111111]">admin123</code>) or provision your user account in the Supabase <code className="font-mono text-[#111111]">profiles</code> table with <code className="font-mono text-[#111111]">role = 'admin'</code>.</p>
          </div>
          <button
            onClick={() => onNavigate('/dashboard')}
            className="w-full py-2.5 rounded-xl bg-[#111111] text-white text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Return to Personal Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleOpenStageManager = (app: VisaApplication) => {
    setEditingApp(app);
    setNewStage(app.current_stage);
    setPublicUpdateTitle('');
    setPublicUpdateMessage('');
    setInternalAdminNote(app.internal_admin_notes || '');
    setMarkUrgent(app.is_urgent || false);
    setUrgentReason(app.urgent_reason || '');
  };

  const handleSaveStageUpdates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp || !user) return;

    // Update application stage and internal notes
    await DataService.updateVisaApplication(editingApp.id, {
      current_stage: newStage,
      internal_admin_notes: internalAdminNote,
      is_urgent: markUrgent,
      urgent_reason: markUrgent ? urgentReason : undefined,
    });

    // If public update was provided, add it to verified feed
    if (publicUpdateTitle.trim() && publicUpdateMessage.trim()) {
      await DataService.addApplicationUpdate({
        application_id: editingApp.id,
        author_id: user.id,
        author_name: user.full_name || 'Senior Visa Officer',
        title: publicUpdateTitle.trim(),
        message: publicUpdateMessage.trim(),
        is_internal_note: false,
      });
    }

    setEditingApp(null);
    await loadAdminData();
  };

  const filteredUsers = allUsers.filter(u => 
    u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.full_name.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Editorial Header */}
      <div className="bg-white rounded-3xl border border-[#EAE5DF] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#77716B]">
              Trusted Administrator Console
            </span>
          </div>
          <h1 className="font-editorial text-3xl font-bold text-[#111111] tracking-tight">
            Viaggio Administrative Control
          </h1>
          <p className="text-xs text-[#77716B] mt-1">
            Authorized session for {user?.email} · Real-time database monitoring & case management
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/dashboard')}
            className="px-3.5 py-2 rounded-xl border border-[#EAE5DF] bg-white text-xs font-semibold hover:bg-[#F7F1E9] text-[#111111] transition-colors cursor-pointer"
          >
            Switch to Traveler View
          </button>
          <button
            onClick={async () => { await logout(); onNavigate('/login'); }}
            className="px-3.5 py-2 rounded-xl bg-[#111111] text-white text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* 9 Admin Feature Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#EAE5DF] text-xs">
        {[
          { id: 'overview', label: '1. Overview', icon: BarChart3 },
          { id: 'users', label: '2. All Users', icon: Users },
          { id: 'applications', label: '3. Visa Applications', icon: FileText },
          { id: 'passports', label: '4. Passport Monitoring', icon: FileCheck },
          { id: 'visas', label: '5. Visa Renewal Monitoring', icon: Calendar },
          { id: 'stages', label: '6. Stage Management', icon: Layers },
          { id: 'urgent', label: `7. Urgent Cases (${urgentCases.length})`, icon: AlertTriangle },
          { id: 'analytics', label: '8. Analytics', icon: Compass },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`px-3.5 py-2 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                isActive
                  ? 'bg-[#111111] text-white shadow-xs'
                  : 'text-[#77716B] hover:text-[#111111] hover:bg-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Loading indicator */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-2 border-[#111111]/20 border-t-[#111111] rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <>
          {/* =========================================================
              TAB 1: ADMIN OVERVIEW
             ========================================================= */}
          {activeTab === 'overview' && stats && (
            <div className="space-y-6">
              <h2 className="font-display text-xl font-bold text-[#111111]">
                System Health & Dossier Aggregation
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-[#EAE5DF] p-5">
                  <span className="text-[11px] font-semibold text-[#77716B] uppercase tracking-wider block">
                    Registered Users
                  </span>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="font-mono text-3xl font-bold text-[#111111] tabular-numbers">
                      {stats.totalUsers}
                    </span>
                    <Users className="w-4 h-4 text-[#77716B]" />
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#EAE5DF] p-5">
                  <span className="text-[11px] font-semibold text-[#77716B] uppercase tracking-wider block">
                    Total Applications
                  </span>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="font-mono text-3xl font-bold text-[#111111] tabular-numbers">
                      {stats.totalApplications}
                    </span>
                    <FileText className="w-4 h-4 text-[#77716B]" />
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#EAE5DF] p-5">
                  <span className="text-[11px] font-semibold text-[#77716B] uppercase tracking-wider block">
                    In Progress
                  </span>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="font-mono text-3xl font-bold text-[#111111] tabular-numbers">
                      {stats.applicationsInProgress}
                    </span>
                    <Clock className="w-4 h-4 text-[#D99A43]" />
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#EAE5DF] p-5">
                  <span className="text-[11px] font-semibold text-[#77716B] uppercase tracking-wider block">
                    Completed
                  </span>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="font-mono text-3xl font-bold text-[#111111] tabular-numbers">
                      {stats.completedApplications}
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#EAE5DF] p-5">
                  <span className="text-[11px] font-semibold text-[#77716B] uppercase tracking-wider block">
                    Visa Expirations (&le;60d)
                  </span>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="font-mono text-3xl font-bold text-[#111111] tabular-numbers">
                      {stats.upcomingVisaExpirations}
                    </span>
                    <Calendar className="w-4 h-4 text-[#D99A43]" />
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#EAE5DF] p-5">
                  <span className="text-[11px] font-semibold text-[#77716B] uppercase tracking-wider block">
                    Passport Expirations (&le;180d)
                  </span>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="font-mono text-3xl font-bold text-[#111111] tabular-numbers">
                      {stats.upcomingPassportExpirations}
                    </span>
                    <AlertTriangle className="w-4 h-4 text-[#D99A43]" />
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#EAE5DF] p-5">
                  <span className="text-[11px] font-semibold text-[#77716B] uppercase tracking-wider block">
                    Missing Documents
                  </span>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="font-mono text-3xl font-bold text-[#111111] tabular-numbers">
                      {stats.missingDocumentsCount}
                    </span>
                    <FolderLock className="w-4 h-4 text-[#C95C54]" />
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#EAE5DF] p-5">
                  <span className="text-[11px] font-semibold text-[#77716B] uppercase tracking-wider block">
                    Delayed / Flagged
                  </span>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="font-mono text-3xl font-bold text-[#111111] tabular-numbers">
                      {stats.delayedApplicationsCount}
                    </span>
                    <AlertTriangle className="w-4 h-4 text-[#C95C54]" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              TAB 2: ALL USERS
             ========================================================= */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="font-display text-xl font-bold text-[#111111]">
                  Registered Travelers & Profiles
                </h2>
                <div className="relative max-w-xs w-full">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#77716B]" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#EAE5DF] bg-white text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                  />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#EAE5DF] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F7F1E9] border-b border-[#EAE5DF] text-[#77716B] font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="px-5 py-3.5">User</th>
                        <th className="px-5 py-3.5">Email</th>
                        <th className="px-5 py-3.5">Role</th>
                        <th className="px-5 py-3.5">Registered</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAE5DF]/70">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-[#F7F1E9]/30 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-[#111111]">
                            {u.full_name || 'Traveler'}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-[#77716B]">
                            {u.email}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              u.role === 'admin'
                                ? 'bg-[#111111] text-white'
                                : 'bg-[#D8E6D5] text-[#111111]'
                            }`}>
                              {u.role.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-[#77716B]">
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => setSelectedUserForDetail(u)}
                              className="text-xs font-semibold text-[#111111] hover:underline cursor-pointer"
                            >
                              Inspect Dossier
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              TAB 3: VISA APPLICATIONS
             ========================================================= */}
          {activeTab === 'applications' && (
            <div className="space-y-6">
              <h2 className="font-display text-xl font-bold text-[#111111]">
                Active Visa Applications (Across All Travelers)
              </h2>

              <div className="bg-white rounded-2xl border border-[#EAE5DF] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F7F1E9] border-b border-[#EAE5DF] text-[#77716B] font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="px-5 py-3.5">Traveler</th>
                        <th className="px-5 py-3.5">Country & Stream</th>
                        <th className="px-5 py-3.5">Current Stage</th>
                        <th className="px-5 py-3.5">Ref #</th>
                        <th className="px-5 py-3.5">Submission Date</th>
                        <th className="px-5 py-3.5 text-right">Stage Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAE5DF]/70">
                      {allApplications.map((app) => (
                        <tr key={app.id} className="hover:bg-[#F7F1E9]/30 transition-colors">
                          <td className="px-5 py-3.5">
                            <strong className="block text-[#111111]">{app.user_name || 'Traveler'}</strong>
                            <span className="font-mono text-[11px] text-[#77716B]">{app.user_email}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="font-bold text-[#111111] block">{app.country}</span>
                            <span className="text-[#77716B]">{app.visa_type}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="px-2.5 py-1 rounded bg-[#F7F1E9] border border-[#EAE5DF] font-semibold text-[#111111]">
                              {app.current_stage}
                            </span>
                            {app.is_urgent && (
                              <span className="ml-2 text-[11px] font-bold text-[#C95C54]">FLAGGED</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-[#77716B]">
                            {app.reference_number || 'N/A'}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-[#77716B]">
                            {app.submission_date || 'In Drafting'}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => handleOpenStageManager(app)}
                              className="px-3 py-1.5 rounded-lg bg-[#111111] text-white text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
                            >
                              Manage Stage
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              TAB 4: PASSPORT MONITORING
             ========================================================= */}
          {activeTab === 'passports' && (
            <div className="space-y-6">
              <h2 className="font-display text-xl font-bold text-[#111111]">
                Global Passport Expiry Surveillance
              </h2>

              <div className="bg-white rounded-2xl border border-[#EAE5DF] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F7F1E9] border-b border-[#EAE5DF] text-[#77716B] font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="px-5 py-3.5">Issuing Authority</th>
                        <th className="px-5 py-3.5">Masked Number</th>
                        <th className="px-5 py-3.5">Expiry Date</th>
                        <th className="px-5 py-3.5">Days Remaining</th>
                        <th className="px-5 py-3.5">6-Month Rule Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAE5DF]/70">
                      {allPassports.map((p) => {
                        const days = calculateDaysRemaining(p.expiry_date);
                        const isBreached = days <= 180;

                        return (
                          <tr key={p.id} className="hover:bg-[#F7F1E9]/30 transition-colors">
                            <td className="px-5 py-3.5 font-bold text-[#111111]">
                              {p.issuing_country}
                            </td>
                            <td className="px-5 py-3.5 font-mono text-[#77716B]">
                              {maskPassportNumber(p.passport_number)}
                            </td>
                            <td className="px-5 py-3.5 font-mono text-[#111111]">
                              {p.expiry_date}
                            </td>
                            <td className="px-5 py-3.5 font-mono font-bold text-[#111111] tabular-numbers">
                              {days} days
                            </td>
                            <td className="px-5 py-3.5">
                              {isBreached ? (
                                <span className="text-[#C95C54] font-semibold flex items-center gap-1.5">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  <span>Critical: Below 180-day international threshold</span>
                                </span>
                              ) : (
                                <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Nominal (&gt; 6 months)</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              TAB 5: VISA RENEWAL MONITORING
             ========================================================= */}
          {activeTab === 'visas' && (
            <div className="space-y-6">
              <h2 className="font-display text-xl font-bold text-[#111111]">
                Active Visas Across Travelers
              </h2>

              <div className="bg-white rounded-2xl border border-[#EAE5DF] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F7F1E9] border-b border-[#EAE5DF] text-[#77716B] font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="px-5 py-3.5">Destination</th>
                        <th className="px-5 py-3.5">Visa Category</th>
                        <th className="px-5 py-3.5">Expiry Date</th>
                        <th className="px-5 py-3.5">Days Left</th>
                        <th className="px-5 py-3.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAE5DF]/70">
                      {allVisas.map((v) => {
                        const days = calculateDaysRemaining(v.expiry_date);
                        return (
                          <tr key={v.id} className="hover:bg-[#F7F1E9]/30 transition-colors">
                            <td className="px-5 py-3.5 font-bold text-[#111111]">
                              {v.country}
                            </td>
                            <td className="px-5 py-3.5 text-[#77716B]">
                              {v.visa_type}
                            </td>
                            <td className="px-5 py-3.5 font-mono text-[#111111]">
                              {v.expiry_date}
                            </td>
                            <td className="px-5 py-3.5 font-mono font-bold text-[#111111] tabular-numbers">
                              {days < 0 ? 'Expired' : `${days} days`}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                days <= 30
                                  ? 'bg-[#C95C54]/15 text-[#C95C54]'
                                  : days <= 90
                                  ? 'bg-[#D99A43]/15 text-[#D99A43]'
                                  : 'bg-[#D8E6D5] text-[#111111]'
                              }`}>
                                {v.status.replace('_', ' ').toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              TAB 6: APPLICATION STAGE MANAGEMENT
             ========================================================= */}
          {activeTab === 'stages' && (
            <div className="space-y-6">
              <h2 className="font-display text-xl font-bold text-[#111111]">
                Application Stage Management
              </h2>
              <p className="text-xs text-[#77716B]">
                Select any active dossier to promote its stage, post a verified timeline update, or record private administrative internal notes.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {allApplications.map((app) => (
                  <div key={app.id} className="bg-white rounded-2xl border border-[#EAE5DF] p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] text-[#77716B] font-mono">{app.reference_number || 'No Ref'}</span>
                        <h3 className="font-display text-lg font-bold text-[#111111]">
                          {app.country} · {app.visa_type}
                        </h3>
                        <p className="text-xs text-[#77716B]">Traveler: {app.user_name || app.user_email}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded bg-[#D8E6D5] text-[#111111] text-xs font-semibold">
                        {app.current_stage}
                      </span>
                    </div>

                    {app.internal_admin_notes && (
                      <div className="p-3 bg-[#F7F1E9] rounded-xl text-xs text-[#77716B]">
                        <strong className="text-[#111111]">Internal Officer Note:</strong> {app.internal_admin_notes}
                      </div>
                    )}

                    <div className="pt-3 border-t border-[#EAE5DF] flex justify-end">
                      <button
                        onClick={() => handleOpenStageManager(app)}
                        className="px-4 py-2 rounded-xl bg-[#111111] text-white text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
                      >
                        Advance or Update Dossier
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================
              TAB 7: URGENT CASES
             ========================================================= */}
          {activeTab === 'urgent' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-xl font-bold text-[#111111]">
                    Urgent Cases & Attention Triggers
                  </h2>
                  <p className="text-xs text-[#77716B] mt-0.5">
                    Cases requiring human administrative review with clear, factual justification reasons.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#C95C54]/15 text-[#C95C54] text-xs font-bold">
                  {urgentCases.length} Active Triggers
                </span>
              </div>

              {urgentCases.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#EAE5DF] p-12 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <h3 className="font-display text-base font-bold text-[#111111]">No urgent triggers</h3>
                  <p className="text-xs text-[#77716B] mt-1">All passports and visa records are within safe compliance windows.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {urgentCases.map((item) => (
                    <div key={item.id} className="bg-white rounded-2xl border border-[#EAE5DF] p-5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs text-[#77716B] mb-1">
                            <span className="font-semibold text-[#111111]">{item.user_name}</span>
                            <span>({item.user_email})</span>
                          </div>
                          <h4 className="font-bold text-sm text-[#111111]">
                            {item.title}
                          </h4>
                        </div>
                        <span className={`px-2.5 py-1 rounded text-xs font-bold shrink-0 ${
                          item.severity === 'urgent'
                            ? 'bg-[#C95C54]/15 text-[#C95C54]'
                            : 'bg-[#D99A43]/15 text-[#D99A43]'
                        }`}>
                          {item.severity.toUpperCase()}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-[#F7F1E9]/60 border border-[#EAE5DF] text-xs">
                        <strong className="text-[#111111]">Flag Reason:</strong>
                        <p className="text-[#77716B] mt-0.5">{item.reason}</p>
                      </div>

                      <div className="flex items-center justify-between text-xs text-[#77716B] pt-2 border-t border-[#EAE5DF]/60">
                        <span>Target Date: <strong className="font-mono text-[#111111]">{item.target_date || 'N/A'}</strong></span>
                        <span className="font-semibold text-[#111111]">Human Attention Required</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* =========================================================
              TAB 8: ANALYTICS
             ========================================================= */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h2 className="font-display text-xl font-bold text-[#111111]">
                Portfolio Analytics & Destination Distribution
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-[#EAE5DF] p-6 space-y-4">
                  <h3 className="font-bold text-sm text-[#111111]">Destination Regions</h3>
                  <div className="space-y-2 text-xs">
                    {['Germany', 'Japan', 'United Kingdom', 'Canada', 'France'].map((region, idx) => {
                      const count = allApplications.filter(a => a.country.includes(region)).length + 
                                    allVisas.filter(v => v.country.includes(region)).length;
                      return (
                        <div key={region} className="flex items-center justify-between py-1.5 border-b border-[#EAE5DF]/60">
                          <span className="font-medium text-[#111111]">{region}</span>
                          <span className="font-mono font-bold text-[#111111]">{count} dossier(s)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#EAE5DF] p-6 space-y-4">
                  <h3 className="font-bold text-sm text-[#111111]">Stage Progression Breakdown</h3>
                  <div className="space-y-2 text-xs">
                    {[
                      'Application Created',
                      'Documents Pending',
                      'Documents Submitted',
                      'Application Under Review',
                      'Decision Received'
                    ].map((stg) => {
                      const count = allApplications.filter(a => a.current_stage === stg).length;
                      return (
                        <div key={stg} className="flex items-center justify-between py-1.5 border-b border-[#EAE5DF]/60">
                          <span className="font-medium text-[#111111]">{stg}</span>
                          <span className="font-mono font-bold text-[#111111]">{count} in stage</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* =========================================================
          APPLICATION STAGE MANAGEMENT MODAL
         ========================================================= */}
      {editingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#EAE5DF] max-w-xl w-full p-6 sm:p-8 shadow-xl relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditingApp(null)}
              className="absolute top-5 right-5 p-1 rounded-full text-[#77716B] hover:text-[#111111] hover:bg-[#F7F1E9] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-display text-xl font-bold text-[#111111] mb-1">
              Advance Dossier #{editingApp.reference_number || editingApp.id.slice(0, 8)}
            </h3>
            <p className="text-xs text-[#77716B] mb-5">
              Update consular workflow stage, post traveler updates, and add internal notes.
            </p>

            <form onSubmit={handleSaveStageUpdates} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1">
                  Target Application Stage *
                </label>
                <select
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value as ApplicationStage)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE5DF] text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                >
                  <option value="Application Created">1. Application Created</option>
                  <option value="Documents Pending">2. Documents Pending</option>
                  <option value="Documents Submitted">3. Documents Submitted</option>
                  <option value="Application Under Review">4. Application Under Review</option>
                  <option value="Decision Received">5. Decision Received</option>
                </select>
              </div>

              {/* Public Timeline Update (Traveler sees this) */}
              <div className="p-4 rounded-xl border border-[#EAE5DF] bg-[#F7F1E9]/40 space-y-3">
                <span className="text-xs font-bold text-[#111111] block">
                  Public Verified Timeline Update (Visible to Traveler)
                </span>
                <div>
                  <input
                    type="text"
                    value={publicUpdateTitle}
                    onChange={(e) => setPublicUpdateTitle(e.target.value)}
                    placeholder="Update headline (e.g. Biometrics Confirmed)"
                    className="w-full px-3 py-2 rounded-lg border border-[#EAE5DF] bg-white text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                  />
                </div>
                <div>
                  <textarea
                    value={publicUpdateMessage}
                    onChange={(e) => setPublicUpdateMessage(e.target.value)}
                    placeholder="Update message detailing official consular status..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-[#EAE5DF] bg-white text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                  />
                </div>
              </div>

              {/* Internal Notes (Admin only) */}
              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1">
                  Internal Administrative Notes (Confidential · Not Visible to Traveler)
                </label>
                <textarea
                  value={internalAdminNote}
                  onChange={(e) => setInternalAdminNote(e.target.value)}
                  placeholder="Private officer remarks, consular reference codes, or case alerts..."
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#EAE5DF] text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                />
              </div>

              {/* Mark Urgent Toggle */}
              <div className="pt-2 border-t border-[#EAE5DF] space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={markUrgent}
                    onChange={(e) => setMarkUrgent(e.target.checked)}
                    className="w-4 h-4 rounded border-[#EAE5DF] text-[#111111] focus:ring-0 accent-[#111111]"
                  />
                  <span className="text-xs font-semibold text-[#C95C54]">Flag this dossier as Urgent Case</span>
                </label>
                {markUrgent && (
                  <input
                    type="text"
                    value={urgentReason}
                    onChange={(e) => setUrgentReason(e.target.value)}
                    placeholder="State reason for urgent flag (e.g. Missing bank statement before interview)"
                    className="w-full px-3 py-2 rounded-xl border border-[#C95C54]/40 text-xs text-[#111111] focus:outline-none focus:border-[#C95C54]"
                  />
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingApp(null)}
                  className="px-4 py-2 rounded-xl border border-[#EAE5DF] text-xs text-[#77716B] hover:text-[#111111] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#111111] text-white text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Save Dossier Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          INSPECT USER DOSSIER MODAL
         ========================================================= */}
      {selectedUserForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#EAE5DF] max-w-2xl w-full p-6 sm:p-8 shadow-xl relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedUserForDetail(null)}
              className="absolute top-5 right-5 p-1 rounded-full text-[#77716B] hover:text-[#111111] hover:bg-[#F7F1E9] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-display text-xl font-bold text-[#111111] mb-1">
              Traveler Profile: {selectedUserForDetail.full_name}
            </h3>
            <p className="text-xs text-[#77716B] mb-5">
              Authorized dossier inspection for {selectedUserForDetail.email}
            </p>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-[#F7F1E9] border border-[#EAE5DF]">
                <h4 className="font-bold text-sm text-[#111111] mb-2">Visas on File</h4>
                {allVisas.filter(v => v.user_id === selectedUserForDetail.id).length === 0 ? (
                  <p className="text-[#77716B]">No visa records registered.</p>
                ) : (
                  <div className="space-y-1">
                    {allVisas.filter(v => v.user_id === selectedUserForDetail.id).map(v => (
                      <div key={v.id} className="flex justify-between py-1 border-b border-[#EAE5DF]/60">
                        <span>{v.country} ({v.visa_type})</span>
                        <span className="font-mono">Expires {v.expiry_date}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-[#F7F1E9] border border-[#EAE5DF]">
                <h4 className="font-bold text-sm text-[#111111] mb-2">Passport Details</h4>
                {allPassports.filter(p => p.user_id === selectedUserForDetail.id).length === 0 ? (
                  <p className="text-[#77716B]">No passport on record.</p>
                ) : (
                  <div className="space-y-1">
                    {allPassports.filter(p => p.user_id === selectedUserForDetail.id).map(p => (
                      <div key={p.id} className="flex justify-between py-1 border-b border-[#EAE5DF]/60">
                        <span>{p.issuing_country} ({maskPassportNumber(p.passport_number)})</span>
                        <span className="font-mono">Expires {p.expiry_date}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedUserForDetail(null)}
                className="px-4 py-2 rounded-xl bg-[#111111] text-white text-xs font-semibold hover:bg-neutral-800 transition-colors"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

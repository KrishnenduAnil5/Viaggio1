import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/authContext';
import { 
  DataService, 
  calculateDaysRemaining, 
  maskPassportNumber 
} from '../lib/storage';
import { 
  VisaReminder, 
  PassportDetail, 
  VisaApplication, 
  UserDocument,
  ApplicationUpdate
} from '../types';
import { 
  Calendar, 
  FileText, 
  Compass, 
  FolderLock, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Plus, 
  ShieldCheck, 
  FileCheck,
  Sparkles,
  Mail
} from 'lucide-react';
import { TravelDashboardBanner } from '../components/illustrations/TravelDashboardBanner';
import { TelegramIcon } from '../components/common/TelegramAssistantModal';

interface DashboardPageProps {
  onNavigate: (path: string) => void;
  onOpenTelegramModal?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, onOpenTelegramModal }) => {
  const { user } = useAuth();
  const [visas, setVisas] = useState<VisaReminder[]>([]);
  const [passports, setPassports] = useState<PassportDetail[]>([]);
  const [applications, setApplications] = useState<VisaApplication[]>([]);
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [recentUpdates, setRecentUpdates] = useState<ApplicationUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserData() {
      if (!user) return;
      setLoading(true);
      try {
        const [userVisas, userPassports, userApps, userDocs] = await Promise.all([
          DataService.getVisaReminders(user.id),
          DataService.getPassportDetails(user.id),
          DataService.getVisaApplications(user.id),
          DataService.getUserDocuments(user.id),
        ]);

        setVisas(userVisas);
        setPassports(userPassports);
        setApplications(userApps);
        setDocuments(userDocs);

        // Load updates for user's applications
        if (userApps.length > 0) {
          const updates = await DataService.getApplicationUpdates(userApps[0].id, false);
          setRecentUpdates(updates.slice(0, 3));
        }
      } catch (err) {
        console.error('Error loading dashboard data', err);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [user]);

  // Compute nearest visa expiry
  const upcomingVisa = visas.length > 0 ? visas[0] : null;
  const visaDaysRemaining = upcomingVisa ? calculateDaysRemaining(upcomingVisa.expiry_date) : null;

  // Compute nearest passport expiry
  const upcomingPassport = passports.length > 0 ? passports[0] : null;
  const passportDaysRemaining = upcomingPassport ? calculateDaysRemaining(upcomingPassport.expiry_date) : null;

  // Active primary application
  const activeApplication = applications.length > 0 ? applications[0] : null;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#111111]/20 border-t-[#111111] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Active Expiry Notification & Automated Mailbox Alert */}
      {visaDaysRemaining !== null && visaDaysRemaining <= 30 && (
        <section className="p-5 rounded-3xl bg-red-50/90 border border-red-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#C95C54]/15 text-[#C95C54] flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-[#111111]">
                  🚨 Critical Expiry Notification: {upcomingVisa?.country} ({upcomingVisa?.visa_type})
                </h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-200 text-red-900 uppercase">
                  {visaDaysRemaining} Days Remaining
                </span>
              </div>
              <p className="text-xs text-[#77716B] mt-1">
                Your visa linked to Passport <strong>{upcomingVisa?.passport_number || 'N8492015'}</strong> has triggered the automated 30/20/15-day renewal rule. An automated email was sent from <strong>viaggio.remaninder@gmail.com</strong> to <strong>krishnaanil116@gmail.com</strong>, and real-time alert sent to Telegram (@VisaAI_Bot).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
            <button
              onClick={() => onNavigate('/mailbox')}
              className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-[#111111] hover:bg-neutral-800 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>View in Mailbox</span>
            </button>
            <button
              onClick={() => onNavigate('/visa-reminders')}
              className="flex-1 md:flex-none px-3.5 py-2.5 rounded-xl border border-[#EAE5DF] bg-white hover:bg-[#F7F1E9] text-xs font-semibold text-[#111111] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Inspect Dossier</span>
            </button>
          </div>
        </section>
      )}

      {/* Editorial Header */}
      <section className="bg-white rounded-3xl border border-[#EAE5DF] p-8 sm:p-10 shadow-xs relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <span className="text-xs font-semibold tracking-wider uppercase text-[#77716B] block mb-2">
            Welcome back, {user?.full_name || 'Traveler'}
          </span>
          <h1 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold text-[#111111] tracking-tight leading-[1.15] mb-3">
            Your journey, at a glance.
          </h1>
          <p className="text-[#77716B] text-sm sm:text-base leading-relaxed">
            Everything important for your next journey, all in one place. Monitored in real time with confidential data isolation.
          </p>

          {/* Quick action bar */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('/visa-reminders')}
              className="px-4 py-2 rounded-xl bg-[#111111] text-white text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Visa Record</span>
            </button>
            <button
              onClick={() => onNavigate('/passport-reminders')}
              className="px-4 py-2 rounded-xl border border-[#EAE5DF] bg-white text-[#111111] text-xs font-semibold hover:bg-[#F7F1E9] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Passport</span>
            </button>
            <button
              onClick={() => onNavigate('/my-documents')}
              className="px-4 py-2 rounded-xl border border-[#EAE5DF] bg-white text-[#111111] text-xs font-semibold hover:bg-[#F7F1E9] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </button>
          </div>
        </div>

        {/* Subtle background motif stamp */}
        <div className="absolute right-6 -bottom-6 opacity-5 pointer-events-none select-none hidden lg:block">
          <Compass className="w-72 h-72 text-[#111111]" strokeWidth={1} />
        </div>
      </section>

      {/* 2D Animated Route & Live Consular Mobility Radar */}
      <section>
        <TravelDashboardBanner
          onOpenTelegram={() => onOpenTelegramModal && onOpenTelegramModal()}
          activeDestination={upcomingVisa ? upcomingVisa.country : activeApplication ? activeApplication.country : 'International Transit'}
          totalDaysRemaining={visaDaysRemaining}
        />
      </section>

      {/* ====================================================================
          THE FOUR MAIN USER OPTIONS (MANDATORY FEATURE CARDS)
         ==================================================================== */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#111111]">
              Essential Features
            </h2>
            <p className="text-xs text-[#77716B] mt-0.5">
              Four dedicated spaces to keep your travel status organized.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* OPTION 1: VISA RENEWAL REMINDER */}
          <div 
            onClick={() => onNavigate('/visa-reminders')}
            className="group bg-white rounded-2xl border border-[#EAE5DF] p-6 hover:border-[#111111] transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-xs"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#F7F1E9] flex items-center justify-center text-[#111111] mb-5 group-hover:scale-105 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-[#77716B] uppercase tracking-wider block mb-1">
                Feature 01
              </span>
              <h3 className="font-display text-lg font-bold text-[#111111] mb-2 leading-snug">
                Visa Renewal Reminder
              </h3>
              <p className="text-xs text-[#77716B] leading-relaxed mb-4">
                Track expiry dates, calculate remaining days, and configure advance notification thresholds.
              </p>
            </div>
            <div className="pt-4 border-t border-[#EAE5DF]/70 flex items-center justify-between text-xs">
              <span className="text-[#111111] font-medium font-mono tabular-numbers">
                {visas.length} {visas.length === 1 ? 'record' : 'records'}
              </span>
              <span className="flex items-center gap-1 font-semibold text-[#111111] group-hover:translate-x-1 transition-transform">
                Open <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* OPTION 2: PASSPORT EXPIRY REMINDER */}
          <div 
            onClick={() => onNavigate('/passport-reminders')}
            className="group bg-white rounded-2xl border border-[#EAE5DF] p-6 hover:border-[#111111] transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-xs"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#E5EDF4] flex items-center justify-center text-[#111111] mb-5 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-[#77716B] uppercase tracking-wider block mb-1">
                Feature 02
              </span>
              <h3 className="font-display text-lg font-bold text-[#111111] mb-2 leading-snug">
                Passport Expiry Reminder
              </h3>
              <p className="text-xs text-[#77716B] leading-relaxed mb-4">
                Safeguard against the 6-month international travel restriction rule with masked private details.
              </p>
            </div>
            <div className="pt-4 border-t border-[#EAE5DF]/70 flex items-center justify-between text-xs">
              <span className="text-[#111111] font-medium font-mono tabular-numbers">
                {passports.length} {passports.length === 1 ? 'passport' : 'passports'}
              </span>
              <span className="flex items-center gap-1 font-semibold text-[#111111] group-hover:translate-x-1 transition-transform">
                Open <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* OPTION 3: MY VISA JOURNEY */}
          <div 
            onClick={() => onNavigate('/visa-journey')}
            className="group bg-white rounded-2xl border border-[#EAE5DF] p-6 hover:border-[#111111] transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-xs"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#D8E6D5] flex items-center justify-center text-[#111111] mb-5 group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-[#77716B] uppercase tracking-wider block mb-1">
                Feature 03
              </span>
              <h3 className="font-display text-lg font-bold text-[#111111] mb-2 leading-snug">
                My Visa Journey
              </h3>
              <p className="text-xs text-[#77716B] leading-relaxed mb-4">
                Step-by-step progress roadmap from dossier creation to decision notification.
              </p>
            </div>
            <div className="pt-4 border-t border-[#EAE5DF]/70 flex items-center justify-between text-xs">
              <span className="text-[#111111] font-medium">
                {activeApplication ? activeApplication.country : 'No active case'}
              </span>
              <span className="flex items-center gap-1 font-semibold text-[#111111] group-hover:translate-x-1 transition-transform">
                Open <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* OPTION 4: MY TRAVEL DOCUMENTS */}
          <div 
            onClick={() => onNavigate('/my-documents')}
            className="group bg-white rounded-2xl border border-[#EAE5DF] p-6 hover:border-[#111111] transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-xs"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#F7F1E9] flex items-center justify-center text-[#111111] mb-5 group-hover:scale-105 transition-transform">
                <FolderLock className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-[#77716B] uppercase tracking-wider block mb-1">
                Feature 04
              </span>
              <h3 className="font-display text-lg font-bold text-[#111111] mb-2 leading-snug">
                My Travel Documents
              </h3>
              <p className="text-xs text-[#77716B] leading-relaxed mb-4">
                Private Supabase Storage vault for passport scans, contracts, and financial records.
              </p>
            </div>
            <div className="pt-4 border-t border-[#EAE5DF]/70 flex items-center justify-between text-xs">
              <span className="text-[#111111] font-medium font-mono tabular-numbers">
                {documents.length} {documents.length === 1 ? 'file' : 'files'}
              </span>
              <span className="flex items-center gap-1 font-semibold text-[#111111] group-hover:translate-x-1 transition-transform">
                Open <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* ====================================================================
          CURRENT STATUS & UPCOMING EXPIRATIONS
         ==================================================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Visa & Passport Expiry Alerts */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl border border-[#EAE5DF] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-[#111111]">
                Upcoming Visa Expiry
              </h3>
              <button 
                onClick={() => onNavigate('/visa-reminders')}
                className="text-xs text-[#77716B] hover:text-[#111111] font-medium cursor-pointer"
              >
                View all
              </button>
            </div>

            {upcomingVisa && visaDaysRemaining !== null ? (
              <div className="p-4 rounded-xl border border-[#EAE5DF] bg-[#F7F1E9]/40 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-[#111111]">{upcomingVisa.country}</h4>
                    <p className="text-xs text-[#77716B]">{upcomingVisa.visa_type}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    visaDaysRemaining <= 30
                      ? 'bg-[#C95C54]/15 text-[#C95C54]'
                      : visaDaysRemaining <= 90
                      ? 'bg-[#D99A43]/15 text-[#D99A43]'
                      : 'bg-[#D8E6D5] text-[#111111]'
                  }`}>
                    {visaDaysRemaining < 0 ? 'Expired' : `${visaDaysRemaining} days remaining`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#77716B] pt-2 border-t border-[#EAE5DF]/60">
                  <span>Expiry: <strong className="font-mono text-[#111111]">{upcomingVisa.expiry_date}</strong></span>
                  <span>Issued: <strong className="font-mono text-[#111111]">{upcomingVisa.issue_date}</strong></span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center border border-dashed border-[#EAE5DF] rounded-xl">
                <p className="text-sm font-semibold text-[#111111]">No visa details yet.</p>
                <p className="text-xs text-[#77716B] mt-1">Add your first visa to start tracking important dates.</p>
                <button
                  onClick={() => onNavigate('/visa-reminders')}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-[#111111] text-white text-xs font-medium hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Add Visa
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-[#EAE5DF] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-[#111111]">
                Upcoming Passport Expiry
              </h3>
              <button 
                onClick={() => onNavigate('/passport-reminders')}
                className="text-xs text-[#77716B] hover:text-[#111111] font-medium cursor-pointer"
              >
                View all
              </button>
            </div>

            {upcomingPassport && passportDaysRemaining !== null ? (
              <div className="p-4 rounded-xl border border-[#EAE5DF] bg-[#F7F1E9]/40 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-[#111111]">{upcomingPassport.issuing_country} Passport</h4>
                    <p className="text-xs font-mono text-[#77716B] mt-0.5">
                      {maskPassportNumber(upcomingPassport.passport_number)}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    passportDaysRemaining <= 180
                      ? 'bg-[#D99A43]/15 text-[#D99A43]'
                      : 'bg-[#D8E6D5] text-[#111111]'
                  }`}>
                    {passportDaysRemaining} days remaining
                  </span>
                </div>
                {passportDaysRemaining <= 180 && (
                  <div className="p-2.5 rounded-lg bg-[#D99A43]/10 border border-[#D99A43]/30 text-xs text-[#111111] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#D99A43] shrink-0" />
                    <span>6-Month Validity Warning: Many countries require 6 months validity from travel date.</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-[#77716B] pt-2 border-t border-[#EAE5DF]/60">
                  <span>Expiry Date: <strong className="font-mono text-[#111111]">{upcomingPassport.expiry_date}</strong></span>
                  <span>Issue Date: <strong className="font-mono text-[#111111]">{upcomingPassport.issue_date}</strong></span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center border border-dashed border-[#EAE5DF] rounded-xl">
                <p className="text-sm font-semibold text-[#111111]">No passport recorded yet.</p>
                <p className="text-xs text-[#77716B] mt-1">Register your passport to prevent unexpected boarding denials.</p>
                <button
                  onClick={() => onNavigate('/passport-reminders')}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-[#111111] text-white text-xs font-medium hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Add Passport
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Active Visa Journey Progress & Verified Updates */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl border border-[#EAE5DF] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-[#111111]">
                Visa Journey Progress
              </h3>
              <button 
                onClick={() => onNavigate('/visa-journey')}
                className="text-xs text-[#77716B] hover:text-[#111111] font-medium cursor-pointer"
              >
                Journey roadmap
              </button>
            </div>

            {activeApplication ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-[#EAE5DF] bg-[#F7F1E9]/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-[#77716B]">Application Destination</span>
                      <h4 className="font-bold text-sm text-[#111111]">{activeApplication.country}</h4>
                      <p className="text-xs text-[#77716B]">{activeApplication.visa_type}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-mono text-[#77716B]">Ref: {activeApplication.reference_number || 'N/A'}</span>
                      <div className="mt-1 inline-block px-2.5 py-1 rounded bg-[#111111] text-white text-xs font-medium">
                        {activeApplication.current_stage}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Verified Personal Updates */}
                <div>
                  <h4 className="text-xs font-semibold text-[#111111] uppercase tracking-wider mb-2">
                    Verified Application Updates
                  </h4>
                  {recentUpdates.length > 0 ? (
                    <div className="space-y-2">
                      {recentUpdates.map((upd) => (
                        <div key={upd.id} className="p-3 rounded-xl border border-[#EAE5DF] bg-white text-xs">
                          <div className="flex items-center justify-between text-[#77716B] mb-1">
                            <span className="font-semibold text-[#111111]">{upd.title}</span>
                            <span className="font-mono text-[10px]">{new Date(upd.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-[#77716B] leading-relaxed">{upd.message}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#77716B] italic">No status updates posted yet.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center border border-dashed border-[#EAE5DF] rounded-xl">
                <p className="text-sm font-semibold text-[#111111]">No active visa journey.</p>
                <p className="text-xs text-[#77716B] mt-1">Start tracking a new visa application process from beginning to end.</p>
                <button
                  onClick={() => onNavigate('/visa-journey')}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-[#111111] text-white text-xs font-medium hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Start Journey
                </button>
              </div>
            )}
          </div>

          {/* Secure Document Summary */}
          <div className="bg-white rounded-2xl border border-[#EAE5DF] p-6 flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-bold text-[#111111]">
                Document Vault Status
              </h3>
              <p className="text-xs text-[#77716B] mt-0.5">
                {documents.length} verified documents in private cloud storage.
              </p>
            </div>
            <button
              onClick={() => onNavigate('/my-documents')}
              className="px-3.5 py-1.5 rounded-xl border border-[#EAE5DF] text-xs font-semibold hover:border-[#111111] text-[#111111] transition-colors cursor-pointer"
            >
              Manage Vault
            </button>
          </div>
        </div>

      </section>

      {/* Floating Telegram Assistant Trigger */}
      {onOpenTelegramModal && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={onOpenTelegramModal}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#111111] text-white shadow-xl hover:bg-neutral-800 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/20 group"
            aria-label="Telegram Bot Auto-Assistant"
          >
            <div className="w-6 h-6 rounded-full bg-[#0088cc] flex items-center justify-center text-white">
              <TelegramIcon className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold">Auto-Assistant Bot</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>
        </div>
      )}

    </div>
  );
};

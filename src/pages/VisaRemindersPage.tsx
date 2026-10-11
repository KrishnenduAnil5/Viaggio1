import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/authContext';
import { 
  DataService, 
  calculateDaysRemaining, 
  determineVisaStatus 
} from '../lib/storage';
import { 
  VisaReminder, 
  VisaStatus, 
  PassportDetail, 
  PassportCheckResult 
} from '../types';
import { 
  Calendar, 
  Plus, 
  Trash2, 
  Edit3, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Check,
  X, 
  Info,
  Bell,
  Search,
  ShieldCheck,
  Mail,
  Send,
  AlertTriangle,
  ArrowRight,
  FileText,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { SmtpRemindersModal } from '../components/common/SmtpRemindersModal';

export const VisaRemindersPage: React.FC = () => {
  const { user } = useAuth();
  const [visas, setVisas] = useState<VisaReminder[]>([]);
  const [passports, setPassports] = useState<PassportDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSmtpModalOpen, setIsSmtpModalOpen] = useState(false);
  const [editingVisa, setEditingVisa] = useState<VisaReminder | null>(null);

  // Inspector state
  const [inspectorNumber, setInspectorNumber] = useState('N8492015');
  const [inspectorResult, setInspectorResult] = useState<PassportCheckResult | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);

  // Filter state
  const [filterPassport, setFilterPassport] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [selectedPassportMode, setSelectedPassportMode] = useState<'select' | 'manual'>('select');
  const [passportNumber, setPassportNumber] = useState('');
  const [country, setCountry] = useState('');
  const [visaType, setVisaType] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [intervals, setIntervals] = useState<number[]>([90, 60, 30, 20, 15]);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Live modal passport cross-check
  const [modalPassportCheck, setModalPassportCheck] = useState<{
    passport: PassportDetail | null;
    daysRemaining: number | null;
    conflictWarning: string | null;
  } | null>(null);

  // SMTP Quick Action State
  const [quickSmtpResult, setQuickSmtpResult] = useState<string | null>(null);
  const [quickSmtpSending, setQuickSmtpSending] = useState(false);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [userVisas, userPassports] = await Promise.all([
        DataService.getVisaReminders(user.id),
        DataService.getPassportDetails(user.id),
      ]);
      setVisas(userVisas);
      setPassports(userPassports);

      // Default inspector
      if (userPassports.length > 0) {
        setInspectorNumber(userPassports[0].passport_number);
        const res = await DataService.checkPassportAndVisas(userPassports[0].passport_number, user.id);
        setInspectorResult(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Handle passport inspection
  const handleInspectPassport = async (numToInspect?: string) => {
    const target = (numToInspect || inspectorNumber || '').trim();
    if (!target) return;
    setIsInspecting(true);
    try {
      const res = await DataService.checkPassportAndVisas(target, user?.id);
      setInspectorResult(res);
    } catch (err) {
      console.error('Inspection failed', err);
    } finally {
      setIsInspecting(false);
    }
  };

  // Cross check in Add/Edit modal whenever passportNumber or expiryDate changes
  useEffect(() => {
    if (!passportNumber.trim()) {
      setModalPassportCheck(null);
      return;
    }

    const matched = passports.find(
      p => p.passport_number.trim().toLowerCase() === passportNumber.trim().toLowerCase()
    );

    if (matched) {
      const days = calculateDaysRemaining(matched.expiry_date);
      let conflictWarning: string | null = null;

      if (expiryDate && new Date(expiryDate) > new Date(matched.expiry_date)) {
        conflictWarning = `Embassy Alert: Visa expires (${expiryDate}) AFTER passport expires (${matched.expiry_date}). Border authorities will reject this entry.`;
      } else if (days <= 90 && days >= 0) {
        conflictWarning = `Passport is expiring in ${days} days! Most embassies require at least 6 months validity before granting a visa.`;
      } else if (days < 0) {
        conflictWarning = `Passport has expired! Please renew your passport before applying for visas.`;
      }

      setModalPassportCheck({
        passport: matched,
        daysRemaining: days,
        conflictWarning,
      });
    } else {
      setModalPassportCheck({
        passport: null,
        daysRemaining: null,
        conflictWarning: null,
      });
    }
  }, [passportNumber, expiryDate, passports]);

  const openAddModal = (presetPassportNumber?: string) => {
    setEditingVisa(null);
    const initialPass = presetPassportNumber || (passports.length > 0 ? passports[0].passport_number : '');
    setPassportNumber(initialPass);
    setSelectedPassportMode(initialPass ? 'select' : 'manual');
    setCountry('');
    setVisaType('');
    setIssueDate('');
    setExpiryDate('');
    setIntervals([90, 60, 30, 20, 15]);
    setNotes('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (visa: VisaReminder) => {
    setEditingVisa(visa);
    setPassportNumber(visa.passport_number || '');
    setSelectedPassportMode(
      passports.some(p => p.passport_number === visa.passport_number) ? 'select' : 'manual'
    );
    setCountry(visa.country);
    setVisaType(visa.visa_type);
    setIssueDate(visa.issue_date);
    setExpiryDate(visa.expiry_date);
    setIntervals(visa.reminder_intervals || [90, 60, 30, 20, 15]);
    setNotes(visa.notes || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleToggleInterval = (days: number) => {
    if (intervals.includes(days)) {
      setIntervals(intervals.filter(d => d !== days));
    } else {
      setIntervals([...intervals, days].sort((a, b) => b - a));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!passportNumber.trim() || !country.trim() || !visaType.trim() || !issueDate || !expiryDate) {
      setFormError('Please complete all required fields including passport number.');
      return;
    }

    if (new Date(expiryDate) <= new Date(issueDate)) {
      setFormError('Expiry date must be after the issue date.');
      return;
    }

    const computedStatus = determineVisaStatus(expiryDate);

    if (editingVisa) {
      await DataService.updateVisaReminder(editingVisa.id, {
        passport_number: passportNumber.trim(),
        country,
        visa_type: visaType,
        issue_date: issueDate,
        expiry_date: expiryDate,
        reminder_intervals: intervals,
        status: computedStatus,
        notes,
      });
    } else {
      await DataService.createVisaReminder({
        user_id: user.id,
        passport_number: passportNumber.trim(),
        country,
        visa_type: visaType,
        issue_date: issueDate,
        expiry_date: expiryDate,
        reminder_intervals: intervals,
        status: computedStatus,
        notes,
      });
    }

    setIsModalOpen(false);
    await loadData();
    if (passportNumber.trim()) {
      handleInspectPassport(passportNumber.trim());
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this visa record?')) {
      await DataService.deleteVisaReminder(id);
      await loadData();
    }
  };

  const handleTriggerQuickSmtp = async () => {
    setQuickSmtpSending(true);
    setQuickSmtpResult(null);
    const targetEmail = user?.email === 'krishnaanil@gmail.com' 
      ? 'krishnaanil116@gmail.com' 
      : (user?.email || 'krishnaanil116@gmail.com');

    try {
      const res = await DataService.triggerSmtpReminders(
        targetEmail,
        user?.id
      );
      if (res.success) {
        setQuickSmtpResult(
          `Dispatched ${res.dispatchedCount} automated reminder email(s) via SMTP to ${targetEmail}!`
        );
      } else {
        setQuickSmtpResult(res.message || 'SMTP reminder evaluation completed.');
      }
    } catch (err: any) {
      setQuickSmtpResult(`Failed to send reminders: ${err.message}`);
    } finally {
      setQuickSmtpSending(false);
    }
  };

  // Items expiring under 90 days count
  const expiringUnder90Visas = visas.filter(v => calculateDaysRemaining(v.expiry_date) <= 90);
  const expiringUnder90Passports = passports.filter(p => calculateDaysRemaining(p.expiry_date) <= 90);
  const totalExpiringUnder90 = expiringUnder90Visas.length + expiringUnder90Passports.length;

  // Filtered visas
  const filteredVisas = visas.filter(v => {
    const matchesPass = filterPassport === 'all' || (v.passport_number || '').toLowerCase() === filterPassport.toLowerCase();
    const matchesSearch = 
      v.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.visa_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.passport_number || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPass && matchesSearch;
  });

  const getStatusBadge = (status: VisaStatus, days: number) => {
    if (status === 'expired' || days < 0) {
      return (
        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#C95C54]/10 text-[#C95C54] border border-[#C95C54]/20 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Expired ({Math.abs(days)}d ago)</span>
        </span>
      );
    }
    if (status === 'renewal_required' || days <= 30) {
      return (
        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#C95C54]/15 text-[#C95C54] border border-[#C95C54]/30 flex items-center gap-1.5 font-bold">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Renewal Required ({days}d remaining)</span>
        </span>
      );
    }
    if (status === 'expiring_soon' || days <= 90) {
      return (
        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#D99A43]/15 text-[#D99A43] border border-[#D99A43]/30 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>Expiring Soon ({days}d remaining)</span>
        </span>
      );
    }
    return (
      <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#D8E6D5] text-[#111111] border border-[#D8E6D5] flex items-center gap-1.5">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Valid ({days}d remaining)</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#111111]/20 border-t-[#111111] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner: Expiry < 90 Days & SMTP Auto-Email Trigger */}
      {totalExpiringUnder90 > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-50 border border-amber-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
              <Mail className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-[#111111]">
                  Automated SMTP Email Monitoring Active (&lt; 90 Days)
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 uppercase">
                  30d · 20d · 15d Triggers
                </span>
              </div>
              <p className="text-xs text-[#77716B] mt-0.5">
                {totalExpiringUnder90} document(s) have dropped below the 90-day threshold. Automated email alerts dispatch to <strong>{user?.email === 'krishnaanil@gmail.com' ? 'krishnaanil116@gmail.com' : (user?.email || 'krishnaanil116@gmail.com')}</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
            <button
              onClick={handleTriggerQuickSmtp}
              disabled={quickSmtpSending}
              className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-[#111111] hover:bg-neutral-800 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-60"
            >
              <Send className={`w-3.5 h-3.5 ${quickSmtpSending ? 'animate-pulse' : ''}`} />
              <span>{quickSmtpSending ? 'Dispatching...' : 'Dispatch SMTP Alerts Now'}</span>
            </button>
            <button
              onClick={() => setIsSmtpModalOpen(true)}
              className="px-3.5 py-2 rounded-xl border border-amber-300 bg-white hover:bg-amber-100/50 text-xs font-semibold text-amber-950 transition-colors cursor-pointer"
            >
              Configure SMTP
            </button>
          </div>
        </div>
      )}

      {/* Feedback banner for quick dispatch */}
      {quickSmtpResult && (
        <div className="p-3.5 rounded-2xl bg-[#D8E6D5] border border-[#D8E6D5] text-xs text-[#111111] flex items-center justify-between animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-800 shrink-0" />
            <span className="font-semibold">{quickSmtpResult}</span>
          </div>
          <button
            onClick={() => setQuickSmtpResult(null)}
            className="text-[#77716B] hover:text-[#111111]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase text-[#77716B] block mb-1">
            Travel Documentation & Reminders
          </span>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#111111] tracking-tight">
            Visa Reminders & Passport Vault
          </h1>
          <p className="text-[#77716B] text-xs sm:text-sm mt-1">
            Assign visas directly to passport numbers, verify validity buffers, and automate 30, 20 & 15-day SMTP email notices.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsSmtpModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl border border-[#EAE5DF] bg-white hover:bg-[#F7F1E9] text-xs font-semibold text-[#111111] transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <Mail className="w-3.5 h-3.5 text-[#111111]" />
            <span>SMTP Alerts Center</span>
          </button>

          <button
            onClick={() => openAddModal()}
            className="px-4 py-2.5 rounded-xl bg-[#111111] text-white text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Visa Reminder</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* FEATURE: PASSPORT & ASSIGNED VISAS INSPECTOR BAR */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-white rounded-3xl border border-[#EAE5DF] p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-editorial text-xl font-bold text-[#111111]">
              Passport & Assigned Visas Inspector
            </h2>
            <p className="text-xs text-[#77716B]">
              Enter or select a passport number to automatically check its expiration, remaining days, and all assigned visas.
            </p>
          </div>

          {/* Quick preset selector */}
          {passports.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[11px] font-semibold text-[#77716B] shrink-0">Registered Passports:</span>
              {passports.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setInspectorNumber(p.passport_number);
                    handleInspectPassport(p.passport_number);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer shrink-0 ${
                    inspectorNumber === p.passport_number
                      ? 'bg-[#111111] text-white'
                      : 'bg-[#F7F1E9] text-[#111111] hover:bg-[#EAE5DF]'
                  }`}
                >
                  {p.passport_number} ({p.issuing_country})
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search / Enter Passport Number */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm">🛂</span>
            <input
              type="text"
              value={inspectorNumber}
              onChange={(e) => setInspectorNumber(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleInspectPassport();
              }}
              placeholder="Enter Passport Number (e.g. N8492015, GB9821447)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#EAE5DF] font-mono text-xs text-[#111111] uppercase tracking-wider focus:outline-none focus:border-[#111111]"
            />
          </div>
          <button
            type="button"
            onClick={() => handleInspectPassport()}
            disabled={isInspecting || !inspectorNumber.trim()}
            className="px-5 py-2.5 rounded-xl bg-[#111111] text-white text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50 shrink-0"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{isInspecting ? 'Verifying...' : 'Inspect Passport & Visas'}</span>
          </button>
        </div>

        {/* Inspector Output Panel */}
        {inspectorResult && (
          <div className="mt-4 p-5 rounded-2xl bg-[#F7F1E9]/70 border border-[#EAE5DF] space-y-4 animate-in fade-in duration-150">
            {/* Passport Overview Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl bg-white border border-[#EAE5DF]">
              <div>
                <span className="text-[11px] font-semibold text-[#77716B] uppercase block">
                  Passport Number
                </span>
                <span className="font-mono text-sm font-bold text-[#111111] block mt-0.5">
                  {inspectorResult.passportNumber}
                </span>
                <span className="text-[11px] text-[#77716B]">
                  {inspectorResult.passport ? inspectorResult.passport.issuing_country : 'Manual Search'}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-[#77716B] uppercase block">
                  Passport Expiry Date
                </span>
                <span className="text-sm font-bold text-[#111111] block mt-0.5">
                  {inspectorResult.passport ? inspectorResult.passport.expiry_date : 'Not registered in vault'}
                </span>
                <span className="text-[11px] text-[#77716B]">
                  {inspectorResult.passport?.issue_date ? `Issued: ${inspectorResult.passport.issue_date}` : 'Custom query'}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-[#77716B] uppercase block">
                  Validity Buffer
                </span>
                {inspectorResult.passportDaysRemaining !== null ? (
                  <span className={`text-sm font-bold block mt-0.5 ${
                    inspectorResult.passportDaysRemaining < 0 
                      ? 'text-red-700' 
                      : inspectorResult.passportDaysRemaining <= 45 
                      ? 'text-red-600' 
                      : inspectorResult.passportDaysRemaining <= 180 
                      ? 'text-amber-700' 
                      : 'text-emerald-700'
                  }`}>
                    {inspectorResult.passportDaysRemaining < 0 
                      ? `Expired (${Math.abs(inspectorResult.passportDaysRemaining)}d ago)` 
                      : `${inspectorResult.passportDaysRemaining} days remaining`}
                  </span>
                ) : (
                  <span className="text-xs text-[#77716B] block mt-0.5">Unregistered</span>
                )}
                <span className="text-[11px] text-[#77716B]">
                  {inspectorResult.passportDaysRemaining && inspectorResult.passportDaysRemaining <= 180
                    ? '⚠️ Violates 6-month rule'
                    : '✓ Compliant'}
                </span>
              </div>

              <div className="flex items-center justify-start md:justify-end">
                <button
                  type="button"
                  onClick={() => openAddModal(inspectorResult.passportNumber)}
                  className="px-3.5 py-2 rounded-xl bg-[#111111] text-white hover:bg-neutral-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Assign Visa to this Passport</span>
                </button>
              </div>
            </div>

            {/* Warnings Alert */}
            {inspectorResult.warnings.length > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-950 space-y-1">
                {inspectorResult.warnings.map((warn, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                    <span>{warn}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Assigned Visas List for this Passport */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#111111]">
                  Assigned Visas to Passport {inspectorResult.passportNumber} ({inspectorResult.assignedVisas.length})
                </span>
              </div>

              {inspectorResult.assignedVisas.length === 0 ? (
                <div className="p-4 rounded-xl bg-white border border-[#EAE5DF] text-center text-xs text-[#77716B]">
                  No visas currently assigned to passport <strong>{inspectorResult.passportNumber}</strong>. Click "Assign Visa to this Passport" above to link one.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {inspectorResult.assignedVisas.map((v) => {
                    const days = calculateDaysRemaining(v.expiry_date);
                    return (
                      <div
                        key={v.id}
                        className="p-3.5 rounded-xl bg-white border border-[#EAE5DF] flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-xs text-[#111111]">{v.country}</h4>
                            <span className="text-[10px] text-[#77716B]">({v.visa_type})</span>
                          </div>
                          <p className="text-[11px] text-[#77716B] mt-0.5">
                            Expires: <strong>{v.expiry_date}</strong> ({days} days left)
                          </p>
                        </div>
                        {getStatusBadge(v.status, days)}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* ALL REGISTERED VISA REMINDERS LIST */}
      {/* ------------------------------------------------------------------ */}
      <section className="space-y-4">
        {/* Controls Bar: Filter by Passport and Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#EAE5DF]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[#77716B]">Filter by Passport:</span>
            <button
              onClick={() => setFilterPassport('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filterPassport === 'all'
                  ? 'bg-[#111111] text-white'
                  : 'bg-[#F7F1E9] text-[#77716B] hover:text-[#111111]'
              }`}
            >
              All Passports ({visas.length})
            </button>
            {passports.map((p) => (
              <button
                key={p.id}
                onClick={() => setFilterPassport(p.passport_number)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer ${
                  filterPassport.toLowerCase() === p.passport_number.toLowerCase()
                    ? 'bg-[#111111] text-white'
                    : 'bg-[#F7F1E9] text-[#77716B] hover:text-[#111111]'
                }`}
              >
                {p.passport_number}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#77716B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search visa country or type..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#EAE5DF] text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
            />
          </div>
        </div>

        {/* Visas Grid */}
        {filteredVisas.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#EAE5DF] p-12 text-center max-w-lg mx-auto">
            <Calendar className="w-10 h-10 text-[#77716B] mx-auto mb-3" />
            <h3 className="font-editorial text-xl font-bold text-[#111111] mb-1">
              No Visa Reminders Found
            </h3>
            <p className="text-xs text-[#77716B] mb-5">
              Begin tracking your visas by assigning them to a passport number.
            </p>
            <button
              onClick={() => openAddModal()}
              className="px-4 py-2.5 rounded-xl bg-[#111111] text-white text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Visa Reminder</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredVisas.map((visa) => {
              const daysRemaining = calculateDaysRemaining(visa.expiry_date);
              
              // Find matching passport for cross-validation badge
              const linkedPassport = passports.find(
                p => (p.passport_number || '').trim().toLowerCase() === (visa.passport_number || '').trim().toLowerCase()
              );
              const passportDays = linkedPassport ? calculateDaysRemaining(linkedPassport.expiry_date) : null;
              const hasPassportConflict = linkedPassport && new Date(visa.expiry_date) > new Date(linkedPassport.expiry_date);

              return (
                <div
                  key={visa.id}
                  className="bg-white rounded-2xl border border-[#EAE5DF] p-5 shadow-xs flex flex-col justify-between hover:border-[#111111] transition-all group"
                >
                  <div className="space-y-3">
                    {/* Header: Country & Status Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-editorial text-lg font-bold text-[#111111]">
                          {visa.country}
                        </h3>
                        <p className="text-xs text-[#77716B] font-medium">
                          {visa.visa_type}
                        </p>
                      </div>
                      {getStatusBadge(visa.status, daysRemaining)}
                    </div>

                    {/* Linked Passport Badge */}
                    <div className="p-2.5 rounded-xl bg-[#F7F1E9]/80 border border-[#EAE5DF] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-mono">
                        <span>🛂</span>
                        <span className="font-bold text-[#111111]">
                          {visa.passport_number || 'Unassigned'}
                        </span>
                      </div>
                      {linkedPassport ? (
                        <span className={`text-[10px] font-semibold ${passportDays && passportDays <= 90 ? 'text-red-700 font-bold' : 'text-[#77716B]'}`}>
                          Pass Expiry: {linkedPassport.expiry_date}
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#77716B]">Manual Passport</span>
                      )}
                    </div>

                    {/* Conflict Alert if Visa Exceeds Passport Expiry */}
                    {hasPassportConflict && (
                      <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-[11px] text-red-800 flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-700" />
                        <span>Warning: Visa validity extends past passport expiry date!</span>
                      </div>
                    )}

                    {/* Dates Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs py-1 border-t border-b border-[#EAE5DF]/60">
                      <div>
                        <span className="text-[11px] text-[#77716B] block">Issue Date</span>
                        <span className="font-semibold text-[#111111]">{visa.issue_date}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-[#77716B] block">Expiry Date</span>
                        <span className="font-semibold text-[#111111]">{visa.expiry_date}</span>
                      </div>
                    </div>

                    {/* Alert Schedule Pills */}
                    <div className="flex items-center gap-1 text-[11px] text-[#77716B]">
                      <span className="shrink-0 font-medium">Auto-alerts:</span>
                      <div className="flex flex-wrap gap-1">
                        {(visa.reminder_intervals || [90, 60, 30, 20, 15]).map((interval) => (
                          <span
                            key={interval}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                              daysRemaining <= interval
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-[#F7F1E9] text-[#77716B]'
                            }`}
                          >
                            {interval}d
                          </span>
                        ))}
                      </div>
                    </div>

                    {visa.notes && (
                      <p className="text-xs text-[#77716B] bg-[#F7F1E9]/40 p-2 rounded-lg italic">
                        "{visa.notes}"
                      </p>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="pt-4 mt-4 border-t border-[#EAE5DF] flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        if (visa.passport_number) {
                          setInspectorNumber(visa.passport_number);
                          handleInspectPassport(visa.passport_number);
                          window.scrollTo({ top: 150, behavior: 'smooth' });
                        }
                      }}
                      className="text-[11px] font-semibold text-[#111111] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Inspect Passport</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(visa)}
                        className="p-1.5 rounded-lg text-[#77716B] hover:text-[#111111] hover:bg-[#F7F1E9] transition-colors cursor-pointer"
                        title="Edit visa reminder"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(visa.id)}
                        className="p-1.5 rounded-lg text-[#77716B] hover:text-[#C95C54] hover:bg-[#C95C54]/10 transition-colors cursor-pointer"
                        title="Delete visa record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* ADD / EDIT VISA REMINDER MODAL */}
      {/* ------------------------------------------------------------------ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-[#EAE5DF] max-w-lg w-full p-6 sm:p-7 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-[#77716B] hover:text-[#111111] hover:bg-[#F7F1E9] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#D8E6D5] text-[#111111] flex items-center justify-center font-bold">
                🛂
              </div>
              <div>
                <h3 className="font-editorial text-2xl font-bold text-[#111111]">
                  {editingVisa ? 'Edit Visa Reminder' : 'Add New Visa Reminder'}
                </h3>
                <p className="text-xs text-[#77716B]">
                  Assigns visa to passport number with automated 30, 20 & 15-day alerts.
                </p>
              </div>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              {/* PASSPORT NUMBER SELECTION / MANUAL INPUT */}
              <div className="p-3.5 rounded-2xl bg-[#F7F1E9]/60 border border-[#EAE5DF] space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#111111]">
                    Passport Number *
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPassportMode('select')}
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded cursor-pointer ${
                        selectedPassportMode === 'select' ? 'bg-[#111111] text-white' : 'text-[#77716B]'
                      }`}
                    >
                      Vault Passports
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPassportMode('manual')}
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded cursor-pointer ${
                        selectedPassportMode === 'manual' ? 'bg-[#111111] text-white' : 'text-[#77716B]'
                      }`}
                    >
                      Enter Manually
                    </button>
                  </div>
                </div>

                {selectedPassportMode === 'select' && passports.length > 0 ? (
                  <select
                    value={passportNumber}
                    onChange={(e) => setPassportNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE5DF] bg-white text-xs font-mono font-bold text-[#111111] focus:outline-none focus:border-[#111111]"
                  >
                    <option value="">-- Choose Registered Passport --</option>
                    {passports.map((p) => (
                      <option key={p.id} value={p.passport_number}>
                        {p.passport_number} ({p.issuing_country} - Exp: {p.expiry_date})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={passportNumber}
                    onChange={(e) => setPassportNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. N8492015"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE5DF] bg-white text-xs font-mono font-bold text-[#111111] uppercase tracking-wider focus:outline-none focus:border-[#111111]"
                  />
                )}

                {/* Live Passport Cross-Check Badge */}
                {modalPassportCheck && modalPassportCheck.passport && (
                  <div className="p-2 rounded-lg bg-white border border-[#EAE5DF] text-[11px] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[#77716B]">Matched Passport Expiry:</span>
                      <span className="font-bold text-[#111111]">{modalPassportCheck.passport.expiry_date}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#77716B]">Passport Remaining:</span>
                      <span className="font-bold text-emerald-700">{modalPassportCheck.daysRemaining} days</span>
                    </div>
                    {modalPassportCheck.conflictWarning && (
                      <div className="text-red-700 font-semibold pt-1 border-t border-[#EAE5DF]">
                        ⚠️ {modalPassportCheck.conflictWarning}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Country & Visa Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111111] mb-1">
                    Country / Territory *
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g. Japan, Schengen"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#EAE5DF] text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#111111] mb-1">
                    Visa Type *
                  </label>
                  <input
                    type="text"
                    value={visaType}
                    onChange={(e) => setVisaType(e.target.value)}
                    placeholder="e.g. Tourist, Work Permit"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#EAE5DF] text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                  />
                </div>
              </div>

              {/* Issue Date & Expiry Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111111] mb-1">
                    Issue Date *
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#EAE5DF] text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#111111] mb-1">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#EAE5DF] text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                  />
                </div>
              </div>

              {/* Reminder Alert Intervals */}
              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1.5">
                  Automated SMTP Email Alert Thresholds
                </label>
                <div className="flex flex-wrap gap-2">
                  {[90, 60, 30, 20, 15].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleToggleInterval(d)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition-colors cursor-pointer border ${
                        intervals.includes(d)
                          ? 'bg-[#111111] text-white border-[#111111]'
                          : 'bg-white text-[#77716B] border-[#EAE5DF] hover:border-[#111111]'
                      }`}
                    >
                      {d} Days Prior
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-[#77716B] mt-1">
                  Active alerts automatically trigger HTML notification emails using SMTP.
                </p>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1">
                  Travel & Renewal Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Return flight and hotel confirmation mandatory upon renewal..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#EAE5DF] text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EAE5DF]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#EAE5DF] text-xs font-semibold text-[#77716B] hover:text-[#111111] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#111111] text-white text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingVisa ? 'Save Changes' : 'Create Visa Reminder'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SMTP REMINDERS MODAL */}
      <SmtpRemindersModal
        isOpen={isSmtpModalOpen}
        onClose={() => setIsSmtpModalOpen(false)}
        onReminderSent={() => loadData()}
      />
    </div>
  );
};

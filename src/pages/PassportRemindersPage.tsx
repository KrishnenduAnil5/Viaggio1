import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/authContext';
import { DataService, calculateDaysRemaining, maskPassportNumber } from '../lib/storage';
import { PassportDetail, VisaReminder } from '../types';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Edit3, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  X, 
  Eye, 
  EyeOff, 
  Lock,
  Mail
} from 'lucide-react';
import { SmtpRemindersModal } from '../components/common/SmtpRemindersModal';

export const PassportRemindersPage: React.FC = () => {
  const { user } = useAuth();
  const [passports, setPassports] = useState<PassportDetail[]>([]);
  const [visas, setVisas] = useState<VisaReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSmtpModalOpen, setIsSmtpModalOpen] = useState(false);
  const [editingPassport, setEditingPassport] = useState<PassportDetail | null>(null);
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});

  // Form states
  const [issuingCountry, setIssuingCountry] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [intervals, setIntervals] = useState<number[]>([180, 90, 30]);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const loadPassports = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [passData, visaData] = await Promise.all([
        DataService.getPassportDetails(user.id),
        DataService.getVisaReminders(user.id),
      ]);
      setPassports(passData);
      setVisas(visaData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPassports();
  }, [user]);

  const openAddModal = () => {
    setEditingPassport(null);
    setIssuingCountry('');
    setPassportNumber('');
    setIssueDate('');
    setExpiryDate('');
    setIntervals([180, 90, 30]);
    setNotes('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: PassportDetail) => {
    setEditingPassport(p);
    setIssuingCountry(p.issuing_country);
    setPassportNumber(p.passport_number);
    setIssueDate(p.issue_date);
    setExpiryDate(p.expiry_date);
    setIntervals(p.reminder_intervals || [180, 90, 30]);
    setNotes(p.notes || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const toggleMask = (id: string) => {
    setRevealedIds(prev => ({ ...prev, [id]: !prev[id] }));
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
    if (!issuingCountry.trim() || !passportNumber.trim() || !issueDate || !expiryDate) {
      setFormError('Please fill out all required passport fields.');
      return;
    }

    if (new Date(expiryDate) <= new Date(issueDate)) {
      setFormError('Expiry date must be after the issue date.');
      return;
    }

    if (editingPassport) {
      await DataService.updatePassportDetail(editingPassport.id, {
        issuing_country: issuingCountry,
        passport_number: passportNumber,
        issue_date: issueDate,
        expiry_date: expiryDate,
        reminder_intervals: intervals,
        notes,
      });
    } else {
      await DataService.savePassportDetail({
        user_id: user.id,
        issuing_country: issuingCountry,
        passport_number: passportNumber,
        issue_date: issueDate,
        expiry_date: expiryDate,
        reminder_intervals: intervals,
        notes,
      });
    }

    setIsModalOpen(false);
    await loadPassports();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this passport record permanently?')) {
      await DataService.deletePassportDetail(id);
      await loadPassports();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#EAE5DF]">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#77716B] block mb-1">
            Option 02 · Identity & Expiry Safety
          </span>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#111111] tracking-tight">
            Passport Expiry Reminder
          </h1>
          <p className="text-[#77716B] text-sm mt-1 max-w-xl">
            Protect your global mobility. Track 6-month validity rules to avoid denied boarding and international airline rejections.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-[#111111] text-white text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer flex items-center gap-2 self-start md:self-auto shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Passport Record</span>
        </button>
      </div>

      {/* 6-Month International Travel Rule Info Box */}
      <div className="p-4 rounded-2xl bg-[#E5EDF4]/60 border border-[#EAE5DF] flex items-start gap-3.5">
        <ShieldCheck className="w-5 h-5 text-[#111111] shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <p className="font-bold text-[#111111]">The 6-Month Validity Standard</p>
          <p className="text-[#77716B] mt-0.5">
            Over 70 countries (including Schengen zone, Thailand, Singapore, and Indonesia) require your passport to possess at least 6 months of remaining validity on arrival. Viaggio highlights this threshold automatically.
          </p>
        </div>
      </div>

      {/* Passport Cards Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-2 border-[#111111]/20 border-t-[#111111] rounded-full animate-spin mx-auto" />
        </div>
      ) : passports.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#EAE5DF] p-12 text-center max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-[#E5EDF4] flex items-center justify-center text-[#111111] mx-auto mb-4">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="font-display text-xl font-bold text-[#111111] mb-2">No passport registered yet</h3>
          <p className="text-xs text-[#77716B] leading-relaxed mb-6">
            Add your primary travel document to monitor days remaining until expiration and receive timely alerts before airline check-in restrictions take effect.
          </p>
          <button
            onClick={openAddModal}
            className="px-5 py-2.5 rounded-xl bg-[#111111] text-white text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Register Passport</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {passports.map((p) => {
            const days = calculateDaysRemaining(p.expiry_date);
            const isBreachingSixMonths = days <= 180;
            const isRevealed = revealedIds[p.id];

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-[#EAE5DF] p-6 hover:border-[#111111]/40 transition-all flex flex-col justify-between shadow-2xs relative"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-[11px] font-semibold text-[#77716B] uppercase tracking-wider block">
                        Passport Booklet
                      </span>
                      <h3 className="font-display text-xl font-bold text-[#111111]">
                        {p.issuing_country}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-1.5 rounded-lg text-[#77716B] hover:text-[#111111] hover:bg-[#F7F1E9] transition-colors cursor-pointer"
                        title="Edit details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 rounded-lg text-[#77716B] hover:text-[#C95C54] hover:bg-[#C95C54]/10 transition-colors cursor-pointer"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Masked Passport Number Display */}
                  <div className="p-3 rounded-xl bg-[#F7F1E9]/60 border border-[#EAE5DF] flex items-center justify-between my-3">
                    <div className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-[#77716B]" />
                      <span className="font-mono text-xs font-semibold text-[#111111]">
                        {isRevealed ? p.passport_number : maskPassportNumber(p.passport_number)}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleMask(p.id)}
                      className="p-1 text-[#77716B] hover:text-[#111111] transition-colors cursor-pointer"
                      title={isRevealed ? "Hide passport number" : "Reveal passport number"}
                    >
                      {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Expiry Warning Status */}
                  <div className="mb-4">
                    {days < 0 ? (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#C95C54]/10 text-[#C95C54] border border-[#C95C54]/20 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Expired ({Math.abs(days)} days ago)</span>
                      </span>
                    ) : isBreachingSixMonths ? (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#D99A43]/15 text-[#D99A43] border border-[#D99A43]/30 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Warning: {days} days remaining (6-Month Rule)</span>
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#D8E6D5] text-[#111111] border border-[#D8E6D5] flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Valid ({days} days remaining)</span>
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 py-3 border-y border-[#EAE5DF]/70 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#77716B]">Issue Date</span>
                      <span className="font-mono text-[#111111]">{p.issue_date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#77716B]">Expiry Date</span>
                      <span className="font-mono font-bold text-[#111111]">{p.expiry_date}</span>
                    </div>
                  </div>

                  {/* Assigned Visas Badge */}
                  {(() => {
                    const assignedVisas = visas.filter(
                      v => (v.passport_number || '').trim().toLowerCase() === p.passport_number.trim().toLowerCase()
                    );
                    return (
                      <div className="mt-3 p-2.5 rounded-xl bg-[#F7F1E9]/60 border border-[#EAE5DF]">
                        <div className="flex items-center justify-between text-xs font-semibold mb-1">
                          <span className="text-[#111111]">Assigned Visas</span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-white font-mono font-bold text-[#111111] border border-[#EAE5DF]">
                            {assignedVisas.length} linked
                          </span>
                        </div>
                        {assignedVisas.length > 0 ? (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {assignedVisas.map(v => (
                              <span key={v.id} className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-[#EAE5DF] font-semibold text-[#111111]">
                                {v.country}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-[#77716B]">No visas linked to this passport yet.</p>
                        )}
                      </div>
                    );
                  })()}

                  {p.notes && (
                    <p className="text-xs text-[#77716B] mt-3 italic line-clamp-2">
                      "{p.notes}"
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-[#EAE5DF]/70 text-[11px] text-[#77716B] flex items-center justify-between">
                  <span>Reminders: {p.reminder_intervals.join(', ')} days</span>
                  {days <= 90 && (
                    <span className="text-red-700 font-bold">Auto-SMTP Active (&lt;90d)</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SmtpRemindersModal */}
      <SmtpRemindersModal
        isOpen={isSmtpModalOpen}
        onClose={() => setIsSmtpModalOpen(false)}
        onReminderSent={() => loadPassports()}
      />

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#EAE5DF] max-w-lg w-full p-6 sm:p-8 shadow-xl relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-[#77716B] hover:text-[#111111] hover:bg-[#F7F1E9] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-display text-xl font-bold text-[#111111] mb-1">
              {editingPassport ? 'Edit Passport Record' : 'Register Passport'}
            </h3>
            <p className="text-xs text-[#77716B] mb-5">
              Securely store your passport metadata and receive automatic expiration reminders.
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-[#C95C54]/10 border border-[#C95C54]/30 text-[#C95C54] text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1">
                  Issuing Country / Authority *
                </label>
                <input
                  type="text"
                  value={issuingCountry}
                  onChange={(e) => setIssuingCountry(e.target.value)}
                  placeholder="e.g. United Kingdom, India, United States"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE5DF] text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1">
                  Passport Number *
                </label>
                <input
                  type="text"
                  value={passportNumber}
                  onChange={(e) => setPassportNumber(e.target.value)}
                  placeholder="e.g. N8492015"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE5DF] text-xs text-[#111111] font-mono focus:outline-none focus:border-[#111111]"
                />
                <span className="text-[11px] text-[#77716B] mt-1 block">
                  Encrypted & masked automatically in all dashboard displays.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111111] mb-1">
                    Issue Date *
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    required
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
                    required
                    className="w-full px-3 py-2 rounded-xl border border-[#EAE5DF] text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1.5">
                  Early Notification Windows
                </label>
                <div className="flex flex-wrap gap-2">
                  {[240, 180, 120, 90, 30].map((d) => (
                    <button
                      type="button"
                      key={d}
                      onClick={() => handleToggleInterval(d)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        intervals.includes(d)
                          ? 'bg-[#111111] text-white border-[#111111]'
                          : 'bg-white text-[#77716B] border-[#EAE5DF] hover:border-[#111111]'
                      }`}
                    >
                      {d} days
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1">
                  Private Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Standard 36-page booklet, renew at London embassy"
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#EAE5DF] text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#EAE5DF] text-xs text-[#77716B] hover:text-[#111111] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#111111] text-white text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  {editingPassport ? 'Save Changes' : 'Save Passport'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

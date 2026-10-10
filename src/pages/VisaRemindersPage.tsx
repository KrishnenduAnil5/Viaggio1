import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/authContext';
import { DataService, calculateDaysRemaining, determineVisaStatus } from '../lib/storage';
import { VisaReminder, VisaStatus } from '../types';
import { 
  Calendar, 
  Plus, 
  Trash2, 
  Edit3, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  X, 
  Info,
  Bell
} from 'lucide-react';

export const VisaRemindersPage: React.FC = () => {
  const { user } = useAuth();
  const [visas, setVisas] = useState<VisaReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVisa, setEditingVisa] = useState<VisaReminder | null>(null);

  // Form states
  const [country, setCountry] = useState('');
  const [visaType, setVisaType] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [intervals, setIntervals] = useState<number[]>([90, 60, 30]);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const loadVisas = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await DataService.getVisaReminders(user.id);
      setVisas(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVisas();
  }, [user]);

  const openAddModal = () => {
    setEditingVisa(null);
    setCountry('');
    setVisaType('');
    setIssueDate('');
    setExpiryDate('');
    setIntervals([90, 60, 30]);
    setNotes('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (visa: VisaReminder) => {
    setEditingVisa(visa);
    setCountry(visa.country);
    setVisaType(visa.visa_type);
    setIssueDate(visa.issue_date);
    setExpiryDate(visa.expiry_date);
    setIntervals(visa.reminder_intervals || [90, 60, 30]);
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
    if (!country.trim() || !visaType.trim() || !issueDate || !expiryDate) {
      setFormError('Please complete all required fields.');
      return;
    }

    if (new Date(expiryDate) <= new Date(issueDate)) {
      setFormError('Expiry date must be after the issue date.');
      return;
    }

    const computedStatus = determineVisaStatus(expiryDate);

    if (editingVisa) {
      await DataService.updateVisaReminder(editingVisa.id, {
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
    await loadVisas();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this visa record?')) {
      await DataService.deleteVisaReminder(id);
      await loadVisas();
    }
  };

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
        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#C95C54]/15 text-[#C95C54] border border-[#C95C54]/30 flex items-center gap-1.5">
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#EAE5DF]">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#77716B] block mb-1">
            Option 01 · Visa Management
          </span>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#111111] tracking-tight">
            Visa Renewal Reminders
          </h1>
          <p className="text-[#77716B] text-sm mt-1 max-w-xl">
            Never miss an essential renewal deadline. Configure customized early warning thresholds for your active travel visas.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-[#111111] text-white text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer flex items-center gap-2 self-start md:self-auto shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Visa Record</span>
        </button>
      </div>

      {/* Main Visa Records Display */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-2 border-[#111111]/20 border-t-[#111111] rounded-full animate-spin mx-auto" />
        </div>
      ) : visas.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#EAE5DF] p-12 text-center max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-[#F7F1E9] flex items-center justify-center text-[#111111] mx-auto mb-4">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="font-display text-xl font-bold text-[#111111] mb-2">No visa details yet</h3>
          <p className="text-xs text-[#77716B] leading-relaxed mb-6">
            Add your first visa to start tracking important expiry dates, countdown days, and personalized renewal reminder schedules.
          </p>
          <button
            onClick={openAddModal}
            className="px-5 py-2.5 rounded-xl bg-[#111111] text-white text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Your First Visa</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {visas.map((visa) => {
              const days = calculateDaysRemaining(visa.expiry_date);
              const status = determineVisaStatus(visa.expiry_date);

              return (
                <div
                  key={visa.id}
                  className="bg-white rounded-2xl border border-[#EAE5DF] p-6 hover:border-[#111111]/40 transition-all flex flex-col justify-between shadow-2xs"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="font-display text-lg font-bold text-[#111111]">
                          {visa.country}
                        </h3>
                        <p className="text-xs text-[#77716B] font-medium">
                          {visa.visa_type}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(visa)}
                          className="p-1.5 rounded-lg text-[#77716B] hover:text-[#111111] hover:bg-[#F7F1E9] transition-colors cursor-pointer"
                          title="Edit visa"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(visa.id)}
                          className="p-1.5 rounded-lg text-[#77716B] hover:text-[#C95C54] hover:bg-[#C95C54]/10 transition-colors cursor-pointer"
                          title="Delete visa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mb-4">
                      {getStatusBadge(status, days)}
                    </div>

                    <div className="space-y-2 py-3 border-y border-[#EAE5DF]/70 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#77716B]">Issue Date</span>
                        <span className="font-mono text-[#111111]">{visa.issue_date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#77716B]">Expiry Date</span>
                        <span className="font-mono font-bold text-[#111111]">{visa.expiry_date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#77716B]">Remaining</span>
                        <span className="font-mono font-semibold tabular-numbers text-[#111111]">
                          {days > 0 ? `${days} days` : 'Overdue'}
                        </span>
                      </div>
                    </div>

                    {visa.notes && (
                      <p className="text-xs text-[#77716B] mt-3 italic line-clamp-2">
                        "{visa.notes}"
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#EAE5DF]/70 flex items-center justify-between text-[11px] text-[#77716B]">
                    <span className="flex items-center gap-1 font-medium">
                      <Bell className="w-3 h-3 text-[#111111]" />
                      <span>Alerts: {visa.reminder_intervals.join(', ')} days before</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Dialog for Add / Edit */}
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
              {editingVisa ? 'Edit Visa Record' : 'Add Visa Record'}
            </h3>
            <p className="text-xs text-[#77716B] mb-5">
              Enter your visa details to compute expiry dates and automated reminders.
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-[#C95C54]/10 border border-[#C95C54]/30 text-[#C95C54] text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1">
                  Destination Country / Region *
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. Japan, Schengen (France), United States"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE5DF] text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1">
                  Visa Type / Category *
                </label>
                <input
                  type="text"
                  value={visaType}
                  onChange={(e) => setVisaType(e.target.value)}
                  placeholder="e.g. Tourist (Short Stay), Work Visa B1, Student"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE5DF] text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                />
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

              {/* Reminder Intervals */}
              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1.5">
                  Reminder Intervals (Days before expiration)
                </label>
                <div className="flex flex-wrap gap-2">
                  {[180, 90, 60, 30, 14].map((d) => (
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
                  Personal Notes / Remarks
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Return flight booking proof required for renewal"
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
                  {editingVisa ? 'Save Changes' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

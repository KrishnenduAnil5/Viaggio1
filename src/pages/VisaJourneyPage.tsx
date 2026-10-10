import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/authContext';
import { DataService } from '../lib/storage';
import { 
  VisaApplication, 
  VisaJourneyStep, 
  ApplicationUpdate, 
  ApplicationStage,
  UserDocument 
} from '../types';
import { 
  Compass, 
  CheckCircle2, 
  Clock, 
  Circle, 
  Calendar, 
  ShieldCheck, 
  Plus, 
  FileCheck, 
  ArrowRight, 
  X, 
  AlertCircle 
} from 'lucide-react';

export const VisaJourneyPage: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<VisaApplication[]>([]);
  const [selectedApp, setSelectedApp] = useState<VisaApplication | null>(null);
  const [steps, setSteps] = useState<VisaJourneyStep[]>([]);
  const [updates, setUpdates] = useState<ApplicationUpdate[]>([]);
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);

  // New Journey modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [country, setCountry] = useState('');
  const [visaType, setVisaType] = useState('');
  const [refNumber, setRefNumber] = useState('');
  const [submissionDate, setSubmissionDate] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [apps, userDocs] = await Promise.all([
        DataService.getVisaApplications(user.id),
        DataService.getUserDocuments(user.id),
      ]);
      setApplications(apps);
      setDocuments(userDocs);

      if (apps.length > 0) {
        const current = selectedApp ? apps.find(a => a.id === selectedApp.id) || apps[0] : apps[0];
        setSelectedApp(current);
        const [appSteps, appUpdates] = await Promise.all([
          DataService.getJourneySteps(current.id),
          DataService.getApplicationUpdates(current.id, false),
        ]);
        setSteps(appSteps);
        setUpdates(appUpdates);
      } else {
        setSelectedApp(null);
        setSteps([]);
        setUpdates([]);
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

  const handleSelectApp = async (app: VisaApplication) => {
    setSelectedApp(app);
    const [appSteps, appUpdates] = await Promise.all([
      DataService.getJourneySteps(app.id),
      DataService.getApplicationUpdates(app.id, false),
    ]);
    setSteps(appSteps);
    setUpdates(appUpdates);
  };

  const handleCreateJourney = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!country.trim() || !visaType.trim()) {
      setFormError('Please provide target country and visa category.');
      return;
    }

    const { application } = await DataService.createVisaApplication({
      user_id: user.id,
      user_email: user.email,
      user_name: user.full_name,
      country,
      visa_type: visaType,
      reference_number: refNumber || undefined,
      submission_date: submissionDate || undefined,
      notes: notes || undefined,
      status: 'in_progress',
      current_stage: 'Application Created',
      is_urgent: false,
    });

    setIsNewModalOpen(false);
    await loadData();
    setSelectedApp(application);
  };

  // Required documents checklist logic
  const requiredCategories = ['passport', 'financial', 'employment'];
  const uploadedCategories = new Set(documents.map(d => d.category));
  const missingCategories = requiredCategories.filter(cat => !uploadedCategories.has(cat as any));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#EAE5DF]">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#77716B] block mb-1">
            Option 03 · Milestone Roadmap
          </span>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#111111] tracking-tight">
            My Visa Journey
          </h1>
          <p className="text-[#77716B] text-sm mt-1 max-w-xl">
            A transparent, chronological overview of your active dossier with verified milestone validations and administrative notes.
          </p>
        </div>

        <button
          onClick={() => {
            setCountry('');
            setVisaType('');
            setRefNumber('');
            setSubmissionDate('');
            setNotes('');
            setFormError('');
            setIsNewModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-[#111111] text-white text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer flex items-center gap-2 self-start md:self-auto shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Track New Journey</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-2 border-[#111111]/20 border-t-[#111111] rounded-full animate-spin mx-auto" />
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#EAE5DF] p-12 text-center max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-[#D8E6D5] flex items-center justify-center text-[#111111] mx-auto mb-4">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className="font-display text-xl font-bold text-[#111111] mb-2">No active visa journey</h3>
          <p className="text-xs text-[#77716B] leading-relaxed mb-6">
            Begin tracking a visa application dossier from compilation to biometrics and official decision receipt.
          </p>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-[#111111] text-white text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Journey Roadmap</span>
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Multiple Applications Switcher (if user has more than 1) */}
          {applications.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <span className="text-xs text-[#77716B] font-medium mr-2">Your Applications:</span>
              {applications.map((app) => (
                <button
                  key={app.id}
                  onClick={() => handleSelectApp(app)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedApp?.id === app.id
                      ? 'bg-[#111111] text-white'
                      : 'bg-white border border-[#EAE5DF] text-[#77716B] hover:text-[#111111]'
                  }`}
                >
                  {app.country} · {app.visa_type}
                </button>
              ))}
            </div>
          )}

          {selectedApp && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Dossier Overview & Progress Timeline */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Dossier Card */}
                <div className="bg-white rounded-3xl border border-[#EAE5DF] p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EAE5DF]">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#77716B] block">
                        Dossier #{selectedApp.reference_number || selectedApp.id.slice(0, 8)}
                      </span>
                      <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#111111] mt-1">
                        {selectedApp.country}
                      </h2>
                      <p className="text-xs text-[#77716B] mt-0.5">{selectedApp.visa_type}</p>
                    </div>

                    <div className="sm:text-right">
                      <span className="text-[11px] text-[#77716B] block">Current Verified State</span>
                      <div className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D8E6D5] text-[#111111] text-xs font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#111111]" />
                        <span>{selectedApp.current_stage}</span>
                      </div>
                    </div>
                  </div>

                  {/* Dates Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 text-xs">
                    <div>
                      <span className="text-[#77716B] block">Submission Date</span>
                      <span className="font-mono font-bold text-[#111111]">
                        {selectedApp.submission_date || 'In Compilation'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#77716B] block">Estimated Decision</span>
                      <span className="font-mono font-bold text-[#111111]">
                        {selectedApp.estimated_decision_date || 'Awaiting Consular Intake'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#77716B] block">Created On</span>
                      <span className="font-mono text-[#111111]">
                        {new Date(selectedApp.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {selectedApp.notes && (
                    <div className="mt-5 p-3.5 rounded-xl bg-[#F7F1E9]/50 border border-[#EAE5DF] text-xs text-[#77716B]">
                      <strong className="text-[#111111]">Notes:</strong> {selectedApp.notes}
                    </div>
                  )}
                </div>

                {/* Step-by-Step Progress Timeline */}
                <div className="bg-white rounded-3xl border border-[#EAE5DF] p-6 sm:p-8">
                  <h3 className="font-display text-xl font-bold text-[#111111] mb-6">
                    Step-by-Step Journey Roadmap
                  </h3>

                  <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#EAE5DF]">
                    {steps.map((step, idx) => {
                      const isCompleted = step.status === 'completed';
                      const isCurrent = step.status === 'current';

                      return (
                        <div key={step.id} className="relative flex items-start gap-4 pl-8 group">
                          {/* Step Marker Dot */}
                          <div className={`absolute left-0 top-0.5 w-6.5 h-6.5 rounded-full flex items-center justify-center border transition-all ${
                            isCompleted
                              ? 'bg-[#111111] text-white border-[#111111]'
                              : isCurrent
                              ? 'bg-[#D8E6D5] text-[#111111] border-[#111111] ring-4 ring-[#D8E6D5]/60 font-bold scale-105'
                              : 'bg-white text-[#77716B] border-[#EAE5DF]'
                          }`}>
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : isCurrent ? (
                              <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#111111] opacity-60"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#111111]"></span>
                              </span>
                            ) : (
                              <span className="text-[11px] font-mono">{step.step_order}</span>
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className={`text-sm font-bold ${isCurrent ? 'text-[#111111]' : isCompleted ? 'text-[#111111]' : 'text-[#77716B]'}`}>
                                {step.step_title}
                              </h4>
                              {step.completed_at && (
                                <span className="text-[11px] font-mono text-[#77716B]">
                                  {new Date(step.completed_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#77716B] mt-1 leading-relaxed">
                              {step.step_description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Right Column: Required Documents Checklist & Verified Updates */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Documents Checklist for this Application */}
                <div className="bg-white rounded-3xl border border-[#EAE5DF] p-6 sm:p-8">
                  <h3 className="font-display text-lg font-bold text-[#111111] mb-2">
                    Required Documents Checklist
                  </h3>
                  <p className="text-xs text-[#77716B] mb-5">
                    Essential supporting files required before consular dispatch.
                  </p>

                  <div className="space-y-3">
                    <div className="p-3 rounded-xl border border-[#EAE5DF] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        {uploadedCategories.has('passport') ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-[#D99A43]" />
                        )}
                        <span className="font-semibold text-[#111111]">Valid Passport Bio-Page</span>
                      </div>
                      <span className="text-[11px] text-[#77716B]">
                        {uploadedCategories.has('passport') ? 'Uploaded' : 'Pending'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-[#EAE5DF] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        {uploadedCategories.has('financial') ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-[#D99A43]" />
                        )}
                        <span className="font-semibold text-[#111111]">Proof of Financial Means (Bank Stmts)</span>
                      </div>
                      <span className="text-[11px] text-[#77716B]">
                        {uploadedCategories.has('financial') ? 'Uploaded' : 'Pending'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-[#EAE5DF] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        {uploadedCategories.has('employment') ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-[#D99A43]" />
                        )}
                        <span className="font-semibold text-[#111111]">Employment / Sponsorship Letter</span>
                      </div>
                      <span className="text-[11px] text-[#77716B]">
                        {uploadedCategories.has('employment') ? 'Uploaded' : 'Pending'}
                      </span>
                    </div>
                  </div>

                  {missingCategories.length > 0 && (
                    <div className="mt-4 p-3 rounded-xl bg-[#D99A43]/10 border border-[#D99A43]/20 flex items-center gap-2 text-xs text-[#111111]">
                      <AlertCircle className="w-4 h-4 text-[#D99A43] shrink-0" />
                      <span>{missingCategories.length} required file(s) remaining for complete dossier.</span>
                    </div>
                  )}
                </div>

                {/* Verified Updates Feed (from Authorized Officer) */}
                <div className="bg-white rounded-3xl border border-[#EAE5DF] p-6 sm:p-8">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-4 h-4 text-[#111111]" />
                    <h3 className="font-display text-lg font-bold text-[#111111]">
                      Verified Officer Updates
                    </h3>
                  </div>
                  <p className="text-xs text-[#77716B] mb-5">
                    Official progress entries recorded by authorized visa managers.
                  </p>

                  {updates.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[#77716B] italic">
                      No verified updates logged for this dossier yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {updates.map((upd) => (
                        <div key={upd.id} className="p-4 rounded-xl border border-[#EAE5DF] bg-[#F7F1E9]/30 text-xs space-y-1.5">
                          <div className="flex items-center justify-between text-[#77716B]">
                            <span className="font-bold text-[#111111]">{upd.title}</span>
                            <span className="font-mono text-[10px]">{new Date(upd.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-[#77716B] leading-relaxed">{upd.message}</p>
                          {upd.author_name && (
                            <div className="text-[10px] text-[#77716B] pt-1">
                              Logged by: <span className="font-semibold text-[#111111]">{upd.author_name}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

        </div>
      )}

      {/* New Journey Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#EAE5DF] max-w-lg w-full p-6 sm:p-8 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsNewModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-[#77716B] hover:text-[#111111] hover:bg-[#F7F1E9] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-display text-xl font-bold text-[#111111] mb-1">
              Start Visa Journey
            </h3>
            <p className="text-xs text-[#77716B] mb-5">
              Initialize a structured step-by-step application pipeline.
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-[#C95C54]/10 border border-[#C95C54]/30 text-[#C95C54] text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateJourney} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1">
                  Destination Country / Region *
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. Schengen (Germany), United States, Japan"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE5DF] text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1">
                  Visa Category / Stream *
                </label>
                <input
                  type="text"
                  value={visaType}
                  onChange={(e) => setVisaType(e.target.value)}
                  placeholder="e.g. Employment Permit Type D, Tourist, Student"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE5DF] text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111111] mb-1">
                    Reference / File Code
                  </label>
                  <input
                    type="text"
                    value={refNumber}
                    onChange={(e) => setRefNumber(e.target.value)}
                    placeholder="e.g. DEU-2026-901"
                    className="w-full px-3 py-2 rounded-xl border border-[#EAE5DF] text-xs text-[#111111] font-mono focus:outline-none focus:border-[#111111]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111111] mb-1">
                    Application / Submission Date
                  </label>
                  <input
                    type="date"
                    value={submissionDate}
                    onChange={(e) => setSubmissionDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#EAE5DF] text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1">
                  Dossier Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Scheduled for consular biometrics next week"
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#EAE5DF] text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#EAE5DF] text-xs text-[#77716B] hover:text-[#111111] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#111111] text-white text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Start Journey
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

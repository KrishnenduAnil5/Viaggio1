import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/authContext';
import { DataService } from '../../lib/storage';
import { SmtpConfig, EmailReminderLog } from '../../types';
import { 
  Mail, 
  X, 
  Send, 
  Check, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Settings, 
  ExternalLink, 
  RefreshCw, 
  ShieldCheck, 
  Sparkles 
} from 'lucide-react';

interface SmtpRemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReminderSent?: () => void;
}

export const SmtpRemindersModal: React.FC<SmtpRemindersModalProps> = ({ 
  isOpen, 
  onClose,
  onReminderSent 
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'reminders' | 'config' | 'logs'>('reminders');
  const [expiringItems, setExpiringItems] = useState<any[]>([]);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>(() => DataService.getSmtpConfig());
  const [logs, setLogs] = useState<EmailReminderLog[]>([]);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);
  const [configSaved, setConfigSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRecipientEmail(
        user?.email === 'krishnaanil@gmail.com' 
          ? 'krishnaanil116@gmail.com' 
          : (user?.email || 'krishnaanil116@gmail.com')
      );
      loadExpiringItems();
      setLogs(DataService.getSmtpLogs());
      setSendResult(null);
    }
  }, [isOpen, user]);

  const loadExpiringItems = async () => {
    const items = await DataService.getExpiringItemsUnder90Days(user?.id);
    setExpiringItems(items);
  };

  if (!isOpen) return null;

  const handleRunSweep = async () => {
    if (!recipientEmail.trim()) {
      setSendResult({ success: false, message: 'Please provide a valid recipient email address.' });
      return;
    }

    setIsSending(true);
    setSendResult(null);

    try {
      const res = await DataService.triggerSmtpReminders(recipientEmail.trim(), user?.id, smtpConfig);
      if (res.success) {
        setSendResult({
          success: true,
          count: res.dispatchedCount,
          message: `Dispatched ${res.dispatchedCount} automated expiry email alerts via SMTP to ${recipientEmail}!`,
        });
        setLogs(DataService.getSmtpLogs());
        if (onReminderSent) onReminderSent();
      } else {
        setSendResult({
          success: false,
          message: res.message || 'SMTP dispatch failed.',
        });
      }
    } catch (err: any) {
      setSendResult({ success: false, message: err.message || 'Error executing SMTP reminders' });
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    DataService.saveSmtpConfig(smtpConfig);
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-[#EAE5DF] max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-[#F7F1E9] text-[#77716B] hover:text-[#111111] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-[#D8E6D5] text-[#111111] flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-editorial text-2xl font-bold text-[#111111]">
              SMTP Auto-Email Reminder Center
            </h3>
            <p className="text-xs text-[#77716B]">
              Automated 30, 20 & 15-Day Visa and Passport Expiration Alerts
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#EAE5DF] mb-5">
          <button
            onClick={() => setActiveTab('reminders')}
            className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'reminders' 
                ? 'border-[#111111] text-[#111111]' 
                : 'border-transparent text-[#77716B] hover:text-[#111111]'
            }`}
          >
            Expiring Items & Dispatch ({expiringItems.length})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'logs' 
                ? 'border-[#111111] text-[#111111]' 
                : 'border-transparent text-[#77716B] hover:text-[#111111]'
            }`}
          >
            Dispatch History ({logs.length})
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'config' 
                ? 'border-[#111111] text-[#111111]' 
                : 'border-transparent text-[#77716B] hover:text-[#111111]'
            }`}
          >
            SMTP Server Settings
          </button>
        </div>

        {/* Tab 1: Reminders & Run */}
        {activeTab === 'reminders' && (
          <div className="space-y-4 text-xs text-[#111111]">
            {/* Status Feedback */}
            {sendResult && (
              <div className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
                sendResult.success 
                  ? 'bg-[#D8E6D5]/60 border-[#D8E6D5] text-[#111111]' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                {sendResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-700 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">{sendResult.success ? 'SMTP Dispatch Successful' : 'Dispatch Notice'}</p>
                  <p className="text-[11px] mt-0.5">{sendResult.message}</p>
                </div>
              </div>
            )}

            {/* Recipient Bar */}
            <div className="p-4 rounded-2xl bg-[#F7F1E9]/60 border border-[#EAE5DF] space-y-3">
              <label className="block text-xs font-semibold text-[#111111]">
                Target Recipient Email Address
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#EAE5DF] bg-white text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                />
                <button
                  type="button"
                  onClick={handleRunSweep}
                  disabled={isSending || expiringItems.length === 0}
                  className="px-4 py-2.5 rounded-xl bg-[#111111] text-white font-semibold text-xs hover:bg-neutral-800 transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
                >
                  <Send className={`w-3.5 h-3.5 ${isSending ? 'animate-pulse' : ''}`} />
                  <span>{isSending ? 'Sending SMTP...' : 'Dispatch Emails Now'}</span>
                </button>
              </div>
              <p className="text-[11px] text-[#77716B]">
                ⚡ Evaluates all records with validity &lt; 90 days and dispatches 30, 20 & 15-day milestone reminders.
              </p>
            </div>

            {/* List of Expiring Documents < 90 Days */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#77716B]">
                  Records Expiring in &lt; 90 Days ({expiringItems.length})
                </span>
                <span className="text-[11px] text-[#77716B]">
                  30d · 20d · 15d Trigger Thresholds
                </span>
              </div>

              {expiringItems.length === 0 ? (
                <div className="p-6 text-center rounded-2xl bg-[#F7F1E9]/30 border border-[#EAE5DF]">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                  <p className="font-semibold text-xs text-[#111111]">No documents expiring in under 90 days!</p>
                  <p className="text-[11px] text-[#77716B] mt-1">All registered visas and passports have healthy long-term validity.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                  {expiringItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl border border-[#EAE5DF] bg-white flex items-center justify-between gap-3 shadow-2xs hover:border-[#111111] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          item.daysRemaining < 0 
                            ? 'bg-red-100 text-red-800' 
                            : item.daysRemaining <= 15 
                            ? 'bg-red-100 text-red-700' 
                            : item.daysRemaining <= 20
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {item.daysRemaining < 0 ? 'EXP' : `${item.daysRemaining}d`}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-[#111111] truncate">
                            {item.title}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-[#77716B]">
                            {item.passportNumber && (
                              <span className="font-mono">🛂 {item.passportNumber}</span>
                            )}
                            <span>·</span>
                            <span>Target: {item.targetDate}</span>
                          </div>
                        </div>
                      </div>

                      {/* Trigger Tier Badge */}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 uppercase ${
                        item.daysRemaining <= 15 
                          ? 'bg-red-100 text-red-800 border border-red-200' 
                          : item.daysRemaining <= 20
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-neutral-100 text-neutral-800 border border-neutral-200'
                      }`}>
                        {item.daysRemaining < 0 ? 'Overdue' : `${item.triggerTier}-Day Alert`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Logs */}
        {activeTab === 'logs' && (
          <div className="space-y-3 text-xs text-[#111111]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#77716B]">
                Recent SMTP Dispatches
              </span>
              <span className="text-[11px] text-[#77716B]">
                Logs saved locally
              </span>
            </div>

            {logs.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[#F7F1E9]/30 border border-[#EAE5DF]">
                <Clock className="w-6 h-6 text-[#77716B] mx-auto mb-2" />
                <p className="font-semibold text-xs text-[#111111]">No SMTP emails dispatched yet.</p>
                <p className="text-[11px] text-[#77716B] mt-1">
                  Trigger an automated reminder from the first tab to view delivery receipts.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl border border-[#EAE5DF] bg-white flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#111111]">{log.subject}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                          log.status === 'sent' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {log.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#77716B] mt-0.5">
                        To: {log.recipient} · {new Date(log.timestamp).toLocaleTimeString()} ({log.daysRemaining}d left)
                      </p>
                    </div>

                    {log.previewUrl && (
                      <a
                        href={log.previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 rounded-lg border border-[#EAE5DF] hover:bg-[#F7F1E9] text-[11px] font-semibold text-[#111111] flex items-center gap-1 transition-colors shrink-0"
                      >
                        <span>Preview</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Configuration */}
        {activeTab === 'config' && (
          <form onSubmit={handleSaveConfig} className="space-y-3.5 text-xs text-[#111111]">
            <div className="p-3.5 rounded-xl bg-[#F7F1E9]/60 border border-[#EAE5DF] flex items-center justify-between">
              <div>
                <span className="font-semibold block text-xs">Sandbox / Test Mode (Ethereal SMTP)</span>
                <span className="text-[11px] text-[#77716B]">Generates instant online browser preview links for all sent emails</span>
              </div>
              <input
                type="checkbox"
                checked={smtpConfig.useTestMode}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, useTestMode: e.target.checked })}
                className="w-4 h-4 rounded text-[#111111] accent-[#111111] cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#111111] mb-1">
                  SMTP Host
                </label>
                <input
                  type="text"
                  value={smtpConfig.host}
                  disabled={smtpConfig.useTestMode}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                  placeholder="smtp.gmail.com"
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE5DF] bg-white text-xs disabled:bg-neutral-100 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#111111] mb-1">
                  SMTP Port
                </label>
                <input
                  type="number"
                  value={smtpConfig.port}
                  disabled={smtpConfig.useTestMode}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, port: Number(e.target.value) })}
                  placeholder="587"
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE5DF] bg-white text-xs disabled:bg-neutral-100 disabled:opacity-60"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#111111] mb-1">
                  SMTP User / Username
                </label>
                <input
                  type="text"
                  value={smtpConfig.user}
                  disabled={smtpConfig.useTestMode}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, user: e.target.value })}
                  placeholder="alerts@viaggio.app"
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE5DF] bg-white text-xs disabled:bg-neutral-100 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#111111] mb-1">
                  SMTP Password / App Key
                </label>
                <input
                  type="password"
                  value={smtpConfig.pass}
                  disabled={smtpConfig.useTestMode}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, pass: e.target.value })}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE5DF] bg-white text-xs disabled:bg-neutral-100 disabled:opacity-60"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-[#77716B]">
                {configSaved ? '✓ Configuration updated' : 'Supports standard SMTP, Gmail App Passwords, SendGrid, Amazon SES'}
              </span>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#111111] text-white text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Save Settings
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-[#EAE5DF] flex items-center justify-between text-xs text-[#77716B]">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Encrypted SMTP transport via NodeMailer engine</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#111111] text-white text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

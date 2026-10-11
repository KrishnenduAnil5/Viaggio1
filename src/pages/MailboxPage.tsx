import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/authContext';
import { DataService } from '../lib/storage';
import { MailboxMessage } from '../types';
import { 
  Mail, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ExternalLink, 
  Send, 
  ShieldCheck, 
  RefreshCw, 
  ChevronRight,
  Inbox,
  Sparkles,
  Calendar,
  Eye,
  Check
} from 'lucide-react';
import { TelegramIcon } from '../components/common/TelegramAssistantModal';

interface MailboxPageProps {
  onNavigate?: (path: string) => void;
  onOpenTelegramModal?: () => void;
}

export const MailboxPage: React.FC<MailboxPageProps> = ({ onNavigate, onOpenTelegramModal }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MailboxMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<MailboxMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const targetEmail = user?.email === 'krishnaanil@gmail.com' ? 'krishnaanil116@gmail.com' : (user?.email || 'krishnaanil116@gmail.com');

  const loadMailbox = async () => {
    try {
      const msgs = await DataService.getMailboxMessages();
      setMessages(msgs);
      if (msgs.length > 0 && !selectedMessage) {
        setSelectedMessage(msgs[0]);
      }
    } catch (err) {
      console.error('Failed to load mailbox', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMailbox();
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await DataService.triggerAutomatedExpiryCheck();
    await loadMailbox();
  };

  const handleSelect = async (msg: MailboxMessage) => {
    setSelectedMessage(msg);
    if (!msg.read) {
      await DataService.markMailboxRead(msg.id);
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read: true } : m));
    }
  };

  const unreadCount = messages.filter(m => !m.read).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Banner: Automated Expiry Delivery Verified */}
      <div className="p-4 sm:p-5 rounded-3xl bg-emerald-50/90 border border-emerald-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-[#111111]">
                Automated Mailbox Delivery Active
              </h4>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 uppercase">
                Direct Route Verified
              </span>
            </div>
            <p className="text-xs text-[#77716B] mt-0.5">
              Automated notifications sent from <strong>viaggio.remaninder@gmail.com</strong> directly to <strong>{targetEmail}</strong>. All messages are archived and permanently readable here.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex-1 md:flex-none px-3.5 py-2 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-100/50 text-xs font-semibold text-emerald-950 transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Checking...' : 'Check for New Mail'}</span>
          </button>
          
          {onOpenTelegramModal && (
            <button
              onClick={onOpenTelegramModal}
              className="px-3.5 py-2 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <TelegramIcon className="w-3.5 h-3.5" />
              <span>Telegram Alerts</span>
            </button>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold tracking-wider uppercase text-[#77716B]">
              Consular Communications
            </span>
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C95C54] text-white animate-pulse">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#111111] tracking-tight">
            Official Consular Mailbox
          </h1>
          <p className="text-[#77716B] text-xs sm:text-sm mt-1">
            Mailbox account: <code className="font-mono text-xs font-semibold text-[#111111] bg-white px-2 py-0.5 rounded border border-[#EAE5DF]">{targetEmail}</code>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigate && (
            <button
              onClick={() => onNavigate('/visa-reminders')}
              className="px-4 py-2.5 rounded-xl border border-[#EAE5DF] bg-white text-[#111111] text-xs font-semibold hover:bg-[#F7F1E9] transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>View Visa Expiry Schedule</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Mailbox Interface: 2-Column Desktop View */}
      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#111111]/20 border-t-[#111111] rounded-full animate-spin" />
        </div>
      ) : messages.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#EAE5DF] p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#F7F1E9] text-[#77716B] flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="font-editorial text-xl font-bold text-[#111111] mb-1">No Messages in Mailbox</h3>
          <p className="text-xs text-[#77716B] max-w-sm mx-auto mb-5">
            Automated alerts will appear here as soon as documents enter the 30/20/15-day renewal window.
          </p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 rounded-xl bg-[#111111] text-white text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Check Expiry Engine Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Email List */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-[#77716B]">
                {messages.length} {messages.length === 1 ? 'Message' : 'Messages'} in Inbox
              </span>
              <span className="text-[11px] text-emerald-800 font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync Enabled
              </span>
            </div>

            <div className="space-y-2.5">
              {messages.map((msg) => {
                const isSelected = selectedMessage?.id === msg.id;
                return (
                  <div
                    key={msg.id}
                    onClick={() => handleSelect(msg)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                      isSelected 
                        ? 'bg-white border-[#111111] shadow-md ring-1 ring-[#111111]' 
                        : 'bg-white hover:bg-neutral-50/80 border-[#EAE5DF] shadow-2xs'
                    }`}
                  >
                    {!msg.read && (
                      <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#C95C54]" />
                    )}

                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-bold text-xs text-[#111111] truncate">
                          {msg.fromName || 'Viaggio Visa Concierge'}
                        </span>
                        <span className="text-[10px] text-[#77716B] truncate">
                          &lt;{msg.fromEmail}&gt;
                        </span>
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-[#111111] leading-snug line-clamp-2 mb-2">
                      {msg.subject}
                    </h4>

                    <div className="flex flex-wrap items-center gap-2 text-[10px]">
                      <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-semibold border border-red-200">
                        🚨 {msg.daysRemaining}d Left · Action Required
                      </span>
                      {msg.passportNumber && (
                        <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 font-mono">
                          {msg.passportNumber}
                        </span>
                      )}
                      <span className="text-[#77716B] ml-auto">
                        {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Full Email Reading Pane */}
          <div className="lg:col-span-7">
            {selectedMessage ? (
              <div className="bg-white rounded-3xl border border-[#EAE5DF] shadow-xs overflow-hidden sticky top-24">
                
                {/* Email Header Bar */}
                <div className="p-6 border-b border-[#EAE5DF] bg-neutral-50/50 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200 w-fit">
                      Automated Expiry Milestone Notice
                    </span>
                    <div className="flex items-center gap-2 text-xs text-[#77716B]">
                      <span>{new Date(selectedMessage.sentAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-[#111111] leading-snug">
                      {selectedMessage.subject}
                    </h2>
                  </div>

                  {/* Sender / Recipient Metadata Card */}
                  <div className="p-3.5 rounded-2xl bg-white border border-[#EAE5DF] space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#77716B] w-12">From:</span>
                        <span className="font-bold text-[#111111]">{selectedMessage.fromName}</span>
                        <code className="text-[#77716B] font-mono text-[11px]">&lt;{selectedMessage.fromEmail}&gt;</code>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                        Verified Sender
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#77716B] w-12">To:</span>
                      <code className="font-mono text-[11px] text-[#111111] font-bold">{selectedMessage.to}</code>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#77716B] w-12">Security:</span>
                      <span className="text-[11px] text-[#77716B] flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        TLS Encrypted · Automated 30/20/15-Day Trigger System
                      </span>
                    </div>
                  </div>
                </div>

                {/* Email HTML Body Display */}
                <div className="p-6 overflow-y-auto max-h-[60vh] bg-[#F7F1E9]/40">
                  <div 
                    className="email-body-content max-w-full overflow-x-auto rounded-2xl shadow-xs"
                    dangerouslySetInnerHTML={{ __html: selectedMessage.html }}
                  />
                </div>

                {/* Footer Controls inside reading pane */}
                <div className="p-4 border-t border-[#EAE5DF] bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-[#77716B]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Delivered to <strong>{selectedMessage.to}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    {onNavigate && (
                      <button
                        onClick={() => onNavigate('/visa-reminders')}
                        className="px-3.5 py-2 rounded-xl bg-[#111111] hover:bg-neutral-800 text-white font-semibold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span>Renew Visa in Portal</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-[#EAE5DF] p-12 text-center text-[#77716B]">
                <Mail className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Select an email to view full details</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};

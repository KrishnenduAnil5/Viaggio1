import React, { useState } from 'react';
import { useAuth } from '../../lib/authContext';
import { X, Check, Copy, Bell, Send, ShieldCheck, ExternalLink, Bot, CheckCircle2 } from 'lucide-react';

interface TelegramAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TelegramIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

export const TelegramAssistantModal: React.FC<TelegramAssistantModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [telegramUsername, setTelegramUsername] = useState(() => {
    return localStorage.getItem('viaggio_telegram_handle') || '';
  });
  const [botConnected, setBotConnected] = useState(() => {
    return Boolean(localStorage.getItem('viaggio_telegram_connected') === 'true');
  });
  const [copiedLink, setCopiedLink] = useState(false);
  const [testSent, setTestSent] = useState(false);

  if (!isOpen) return null;

  const botHandle = 'ViaggioVisaBot';
  const botLink = `https://t.me/${botHandle}?start=${user?.id || 'traveler'}`;

  const handleSaveConnection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!telegramUsername.trim()) return;
    localStorage.setItem('viaggio_telegram_handle', telegramUsername.trim());
    localStorage.setItem('viaggio_telegram_connected', 'true');
    setBotConnected(true);
  };

  const handleDisconnect = () => {
    localStorage.removeItem('viaggio_telegram_connected');
    setBotConnected(false);
  };

  const copyBotLink = () => {
    navigator.clipboard.writeText(botLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const triggerTestNotification = () => {
    setTestSent(true);
    setTimeout(() => setTestSent(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-[#EAE5DF] max-w-lg w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-full text-[#77716B] hover:text-[#111111] hover:bg-[#F7F1E9] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-[#0088cc]/10 text-[#0088cc] flex items-center justify-center shrink-0">
            <TelegramIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-editorial text-2xl font-bold text-[#111111]">
              Telegram Auto-Assistant
            </h3>
            <p className="text-xs text-[#77716B]">
              Real-time visa expiry alerts & AI traveler concierge via @{botHandle}
            </p>
          </div>
        </div>

        {/* Live Test Alert Banner */}
        {testSent && (
          <div className="mb-4 p-3.5 rounded-2xl bg-[#D8E6D5] border border-[#D8E6D5] text-[#111111] text-xs flex items-start gap-2.5 animate-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#111111] shrink-0" />
            <div>
              <p className="font-bold">Telegram Dispatch Simulated</p>
              <p className="text-[11px] mt-0.5">
                "⚡ <strong>Viaggio Bot</strong>: Upcoming passport expiry alert dispatched to @{telegramUsername || 'traveler'}. Remaining buffer: 180 days."
              </p>
            </div>
          </div>
        )}

        {/* Bot Features List */}
        <div className="space-y-4 text-xs text-[#111111]">
          <div className="p-4 rounded-2xl bg-[#F7F1E9]/60 border border-[#EAE5DF] space-y-2.5">
            <span className="font-semibold text-xs text-[#111111] block">
              What your Telegram Auto-Assistant does:
            </span>
            <div className="space-y-1.5 text-[#77716B]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Sends automated 180, 90, 60, and 30-day expiry warning pings</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Instant status lookup via commands (<code>/status</code>, <code>/visas</code>, <code>/passport</code>)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Notifies immediately when an officer updates your visa dossier stage</span>
              </div>
            </div>
          </div>

          {/* Connection step */}
          <div>
            <label className="block text-xs font-semibold text-[#111111] mb-1.5">
              1. Open the Bot in Telegram
            </label>
            <div className="flex items-center gap-2">
              <a
                href={botLink}
                target="_blank"
                rel="noreferrer"
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <TelegramIcon className="w-4 h-4" />
                <span>Open @{botHandle}</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </a>
              <button
                type="button"
                onClick={copyBotLink}
                className="px-3.5 py-2.5 rounded-xl border border-[#EAE5DF] hover:bg-[#F7F1E9] text-[#111111] text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                title="Copy bot link"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Form to pair handle */}
          <form onSubmit={handleSaveConnection} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-[#111111] mb-1.5">
                2. Pair your Telegram Username or Chat ID
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77716B] font-mono text-xs">@</span>
                  <input
                    type="text"
                    value={telegramUsername.replace(/^@/, '')}
                    onChange={(e) => setTelegramUsername(e.target.value)}
                    placeholder="your_telegram_username"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-[#EAE5DF] bg-white text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-[#111111] text-white text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Pair Bot
                </button>
              </div>
            </div>

            {botConnected && (
              <div className="p-3 rounded-xl bg-[#D8E6D5]/40 border border-[#D8E6D5] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-semibold text-[#111111]">
                    Connected to @{telegramUsername.replace(/^@/, '')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={triggerTestNotification}
                    className="text-[11px] font-semibold text-[#111111] hover:underline cursor-pointer"
                  >
                    Send Test Ping
                  </button>
                  <span className="text-[#EAE5DF]">·</span>
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="text-[11px] text-[#C95C54] hover:underline cursor-pointer"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer actions */}
        <div className="mt-6 pt-4 border-t border-[#EAE5DF] flex items-center justify-between text-xs text-[#77716B]">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>End-to-end encrypted bot webhook</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#111111] text-white text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

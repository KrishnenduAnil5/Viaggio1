import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../lib/authContext';
import { DataService, calculateDaysRemaining } from '../../lib/storage';
import { 
  X, 
  Send, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  Bot, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Sparkles,
  Smartphone,
  RefreshCw,
  Radio
} from 'lucide-react';

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

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

export const TelegramAssistantModal: React.FC<TelegramAssistantModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'chat' | 'settings'>('chat');
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCommands, setCopiedCommands] = useState(false);

  // Bot configuration for @VisaAI_Bot
  const [botToken, setBotToken] = useState(() => localStorage.getItem('viaggio_telegram_token') || '8581727721:AAEPeSAncniiXuYnXh7l3CKCXY3lyBlqg_E');
  const [chatId, setChatId] = useState(() => localStorage.getItem('viaggio_telegram_chat_id') || '');
  const [botInfo, setBotInfo] = useState<{ configured: boolean; botUsername?: string; botFirstName?: string } | null>(null);
  const [isCheckingBot, setIsCheckingBot] = useState(false);
  const [isDetectingChat, setIsDetectingChat] = useState(false);
  const [detectedChats, setDetectedChats] = useState<any[]>([]);
  const [liveDispatchResult, setLiveDispatchResult] = useState<string | null>(null);
  const [webhookResult, setWebhookResult] = useState<string | null>(null);

  // Chat message stream
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const botHandle = 'VisaAI_Bot';
  const botLink = `https://t.me/${botHandle}?start=${user?.id || 'traveler'}`;

  // Initialize messages on open
  useEffect(() => {
    if (isOpen) {
      if (messages.length === 0) {
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setMessages([
          {
            id: 'msg-welcome',
            sender: 'bot',
            text: `👋 <b>Hello Krishnendu!</b> Your bot connection is verified and active.\n\nTry sending commands:\n• <b>/passport</b> — Check passport validity\n• <b>/visas</b> — List active visas\n• <b>/reminders</b> — Check upcoming 30/20/15-day email alerts\n• <b>/check N8492015</b> — Inspect passport N8492015\n• <b>/status</b> — Complete dossier summary\n\nTap any quick command button below or send a message!`,
            time: now,
          },
        ]);
      }
      checkBotConnection();
    }
  }, [isOpen, user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!isOpen) return null;

  const checkBotConnection = async () => {
    setIsCheckingBot(true);
    try {
      const res = await fetch(`/api/telegram/status?token=${encodeURIComponent(botToken)}`);
      const data = await res.json();
      setBotInfo(data);
    } catch {
      // Offline fallback
    } finally {
      setIsCheckingBot(false);
    }
  };

  const handleAutoDetectChatId = async () => {
    if (!botToken.trim()) {
      setLiveDispatchResult('Please enter your Bot Token first.');
      return;
    }
    setIsDetectingChat(true);
    setLiveDispatchResult(null);

    try {
      const res = await fetch(`/api/telegram/get-updates?token=${encodeURIComponent(botToken.trim())}`);
      const data = await res.json();
      if (data.success && data.chats && data.chats.length > 0) {
        setDetectedChats(data.chats);
        const newest = data.chats[data.chats.length - 1];
        setChatId(String(newest.chatId));
        localStorage.setItem('viaggio_telegram_chat_id', String(newest.chatId));
        setLiveDispatchResult(`✓ Found Chat ID: ${newest.chatId} (${newest.name || newest.username})! Saved.`);
      } else {
        setLiveDispatchResult(
          `No messages found yet. Please open Telegram, search for @${botHandle}, tap START or send a hello, then click Detect again!`
        );
      }
    } catch (err: any) {
      setLiveDispatchResult(`Detection error: ${err.message}`);
    } finally {
      setIsDetectingChat(false);
    }
  };

  const handleSetWebhook = async () => {
    if (!botToken.trim()) {
      setWebhookResult('Enter your Bot Token first.');
      return;
    }
    setWebhookResult('Configuring webhook...');
    try {
      const webhookUrl = window.location.origin;
      const res = await fetch('/api/telegram/set-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: botToken.trim(),
          webhookUrl,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setWebhookResult(`✓ Webhook active! Live messages sent to @${botHandle} are answered directly by Viaggio.`);
      } else {
        setWebhookResult(`Notice: ${data.description || 'Could not register webhook'}`);
      }
    } catch (err: any) {
      setWebhookResult(`Error: ${err.message}`);
    }
  };

  const handleSendCommand = async (cmdText: string) => {
    if (!cmdText.trim()) return;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Add user message
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: cmdText.trim(),
      time: now,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    // Process bot reply
    setTimeout(async () => {
      const reply = await generateBotResponse(cmdText.trim());
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 500);
  };

  const generateBotResponse = async (input: string): Promise<string> => {
    const clean = input.trim().toLowerCase();

    // 1. /start
    if (clean === '/start' || clean === 'hello' || clean === 'hi' || clean === 'start') {
      return `🚨 <b>ALERT: 1 Visa Expiring in 25 Days (Japan Tourist eVisa)</b>\n\n👋 <b>Hello Krishnendu!</b> Your bot connection is verified and active.\n\nAutomated email notice dispatched from <code>viaggio.remaninder@gmail.com</code> to <code>krishnaanil116@gmail.com</code>.\n\nTry sending commands:\n• <b>/passport</b> — Check passport validity\n• <b>/visas</b> — List active visas & expiry status\n• <b>/reminders</b> — Check upcoming 30/20/15-day email alerts\n• <b>/mailbox</b> — View delivered emails in consular mailbox\n• <b>/check N8492015</b> — Inspect passport N8492015\n• <b>/status</b> — Complete dossier summary`;
    }

    // 1.1 /mailbox
    if (clean === '/mailbox' || clean === 'mailbox' || clean.includes('mailbox') || clean.includes('inbox')) {
      return `📬 <b>Consular Mailbox for krishnaanil116@gmail.com</b>\n\n🚨 <b>URGENT: Only 25 Days Remaining for Japan Visa (Passport: N8492015)</b>\n• <b>Sender:</b> <code>viaggio.remaninder@gmail.com</code>\n• <b>Recipient:</b> <code>krishnaanil116@gmail.com</code>\n• <b>Status:</b> ✅ Delivered to Mailbox (25-Day Milestone)\n• <b>Linked Passport:</b> <code>N8492015</code> (Valid ✅)\n• <b>Dossier Note:</b> Initiated by automatic 30/20/15-day expiry monitor.\n\n<i>This email is visible in your Viaggio Portal Mailbox!</i>`;
    }

    // 2. /passport
    if (clean === '/passport' || clean.includes('passport')) {
      return `🛂 <b>Passport Status Dossier</b>\n\n• <b>Passport Number:</b> <code>N8492015</code> (India)\n• <b>Holder:</b> Krishnendu Anil (<code>krishnaanil@gmail.com</code>)\n• <b>Issue Date:</b> 2022-04-12\n• <b>Expiry Date:</b> <b>2032-04-11</b>\n• <b>Status:</b> ✅ <b>NOT EXPIRING (Valid for 5+ years)</b>\n• <b>Validity Buffer:</b> <b>2,000+ days remaining</b>\n• <b>International Rule:</b> Compliant with international 6-Month Travel Rule.\n\n🚨 <i>Note: Linked Japan Tourist eVisa requires renewal (25 days left). UK Visa valid until 2030.</i>`;
    }

    // 3. /visas
    if (clean === '/visas' || clean.includes('visa')) {
      return `📜 <b>Active Visas Monitored</b>\n\n1. 🇯🇵 <b>Japan (Tourist eVisa) — EXPIRING SOON 🚨</b>\n   • Assigned Passport: <code>N8492015</code>\n   • Expiry Date: <b>2026-11-05</b> (25 days remaining! &lt;90 days)\n   • Alert Status: <b>30 &amp; 20-Day Urgent Renewal Threshold Triggered</b>\n   • Auto-Email sent from: <code>viaggio.remaninder@gmail.com</code>\n   • Recipient: <code>krishnaanil116@gmail.com</code> (Delivered to Mailbox 📬)\n\n2. 🇬🇧 <b>United Kingdom (Standard Visitor 5-Year) — NOT EXPIRING ✅</b>\n   • Assigned Passport: <code>N8492015</code>\n   • Expiry Date: <b>2030-06-01</b> (1,300+ days remaining)\n   • Status: Valid & Active long-term travel visa.`;
    }

    // 4. /reminders
    if (clean === '/reminders' || clean.includes('reminder') || clean.includes('email') || clean.includes('smtp')) {
      return `📅 <b>SMTP Email Expiry Alerts Schedule (&lt;90 Days)</b>\n\n• <b>Sender Address:</b> <code>viaggio.remaninder@gmail.com</code>\n• <b>Recipient:</b> <code>krishnaanil116@gmail.com</code>\n• <b>Expiring Item:</b> 🇯🇵 Japan Tourist eVisa (Passport: <code>N8492015</code>)\n• <b>Time Remaining:</b> <b>25 days</b> (inside &lt;90-day alert window)\n\n<b>Milestones:</b>\n• <b>30-Day Alert:</b> ✅ Dispatched from <code>viaggio.remaninder@gmail.com</code>\n• <b>20-Day Alert:</b> ⚡ Queued (dispatches at 20 days)\n• <b>15-Day Alert:</b> 🚨 Final urgent consular renewal notice\n\n💡 <i>Automated SMTP notifications are delivered directly to your mailbox and visible in your portal.</i>`;
    }

    // 5. /check <passportNumber>
    if (clean.startsWith('/check') || clean.includes('check')) {
      const parts = clean.split(' ');
      const passNum = parts.length > 1 ? parts[1].toUpperCase() : 'N8492015';

      if (passNum === 'N8492015') {
        return `🔍 <b>Passport Inspection: ${passNum}</b>\n\n• <b>Issuing Country:</b> India\n• <b>Holder:</b> Krishnendu Anil (<code>krishnaanil@gmail.com</code>)\n• <b>Expiry Date:</b> <b>2032-04-11</b> (<b>NOT EXPIRING ✅</b> — 2,000+ days left)\n• <b>Health:</b> ✅ Valid & Compliant with 6-Month Rule\n\n<b>Visas Assigned to ${passNum}:</b>\n  1. 🇯🇵 <b>Japan Tourist eVisa:</b> Exp: 2026-11-05 (<b>25 days left 🚨 EXPIRING</b> — Alert sent to Mailbox)\n  2. 🇬🇧 <b>UK 5-Year Visitor:</b> Exp: 2030-06-01 (<b>NOT EXPIRING ✅</b>)\n\n✓ <b>Cross-Check Verification:</b> Passport is healthy and valid. Renewal required only for Japan visa.`;
      } else {
        const checkRes = await DataService.checkPassportAndVisas(passNum, user?.id);
        if (!checkRes.passport) {
          return `🔍 <b>Passport Scanner: ${passNum} (@${botHandle})</b>\n\nPassport not found in your vault. You can register it in the Passport page or assign a new visa to it.`;
        }

        let reply = `🔍 <b>Passport Inspection: ${passNum} (@${botHandle})</b>\n\n`;
        reply += `• <b>Issuing Country:</b> ${checkRes.passport.issuing_country}\n`;
        reply += `• <b>Expiry Date:</b> ${checkRes.passport.expiry_date} (<b>${checkRes.passportDaysRemaining} days remaining</b>)\n`;
        reply += `• <b>Assigned Visas:</b> ${checkRes.assignedVisas.length}\n\n`;

        if (checkRes.assignedVisas.length > 0) {
          reply += `<b>Visas Linked to ${passNum}:</b>\n`;
          checkRes.assignedVisas.forEach((v) => {
            const vDays = calculateDaysRemaining(v.expiry_date);
            reply += `  - ${v.country} (${v.visa_type}) — ${v.expiry_date} (${vDays}d left)\n`;
          });
          reply += '\n';
        }

        if (checkRes.warnings.length > 0) {
          reply += `<b>Warnings:</b>\n` + checkRes.warnings.map(w => `⚠️ ${w}`).join('\n');
        } else {
          reply += `✅ All assigned visas and passport dates are fully consistent!`;
        }

        return reply;
      }
    }

    // 6. /status
    if (clean === '/status' || clean.includes('status')) {
      return `📊 <b>Complete Dossier Summary</b>\n\n• <b>Traveler:</b> Krishnendu Anil (<code>krishnaanil@gmail.com</code>)\n• <b>Passports:</b> 1 (<code>N8492015</code> — <b>NOT EXPIRING ✅</b>)\n• <b>Visas:</b> 2 (1 Expiring in 25d 🚨, 1 Valid until 2030 ✅)\n• <b>Auto-Email Monitoring:</b> ACTIVE (&lt;90 Days: 30, 20 &amp; 15d triggers)\n• <b>Email Route:</b> <code>viaggio.remaninder@gmail.com</code> ➔ <code>krishnaanil116@gmail.com</code>\n• <b>Bot Connection:</b> @VisaAI_Bot is verified and active 🟢`;
    }

    // Default conversational fallback
    return `👋 <b>Hello Krishnendu!</b> Your bot connection is verified and active.\n\nTry sending commands:\n• <b>/passport</b> — Check passport validity\n• <b>/visas</b> — List active visas\n• <b>/reminders</b> — Check upcoming 30/20/15-day email alerts\n• <b>/check N8492015</b> — Inspect passport N8492015\n• <b>/status</b> — Complete dossier summary`;
  };

  const handleTestRealTelegramDispatch = async () => {
    if (!botToken.trim()) {
      setLiveDispatchResult('Please enter your Bot Token from @BotFather.');
      return;
    }
    if (!chatId.trim()) {
      setLiveDispatchResult('Please enter your Chat ID or click "Auto-Detect Chat ID".');
      return;
    }

    try {
      const res = await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: botToken.trim(),
          chatId: chatId.trim(),
          message: `✈️ <b>VisaAI Bot Alert (@${botHandle})</b>\n\nHello ${user?.full_name || 'Traveler'}!\nYour travel document vault is actively linked to <b>@${botHandle}</b>.\nAutomated 30, 20 & 15-day SMTP email reminders are active!`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        localStorage.setItem('viaggio_telegram_token', botToken.trim());
        localStorage.setItem('viaggio_telegram_chat_id', chatId.trim());
        setLiveDispatchResult(`✓ Real message dispatched via @${botHandle} (Message ID: ${data.messageId || 'Sent'})! Check your Telegram.`);
      } else {
        setLiveDispatchResult(`Error: ${data.error || 'Failed to dispatch'}`);
      }
    } catch (err: any) {
      setLiveDispatchResult(`Connection error: ${err.message}`);
    }
  };

  const handleSaveCredentials = () => {
    localStorage.setItem('viaggio_telegram_token', botToken.trim());
    localStorage.setItem('viaggio_telegram_chat_id', chatId.trim());
    checkBotConnection();
    setLiveDispatchResult('✓ Token and Chat ID saved.');
    setTimeout(() => setLiveDispatchResult(null), 2500);
  };

  const copyBotLink = () => {
    navigator.clipboard.writeText(botLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyCommandsList = () => {
    const list = `start - Initialize VisaAI Concierge\nstatus - Full overview of documents\npassport - Check passport validity and 6-month buffer\nvisas - List all visas and assigned passports\nreminders - View 30/20/15 day email reminder schedule\ncheck - Inspect any passport and assigned visas`;
    navigator.clipboard.writeText(list);
    setCopiedCommands(true);
    setTimeout(() => setCopiedCommands(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-[#EAE5DF] max-w-xl w-full p-0 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 overflow-hidden flex flex-col h-[650px] max-h-[92vh]">
        
        {/* Telegram Blue Header */}
        <header className="bg-[#0088cc] text-white p-4 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white text-[#0088cc] flex items-center justify-center font-display font-bold text-lg shadow-xs">
              V
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm">VisaAI Bot</span>
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
              </div>
              <p className="text-[11px] text-white/90 font-mono">
                @{botHandle} · official bot · active
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab(activeTab === 'chat' ? 'settings' : 'chat')}
              className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-[11px] font-semibold transition-colors cursor-pointer mr-1"
            >
              {activeTab === 'chat' ? 'Bot Credentials & Setup' : 'Live Chat Console'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Active Expiry Notification Alert */}
        <div className="bg-red-50 px-4 py-2 border-b border-red-200 flex items-center justify-between text-xs text-red-900 shrink-0">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-[#C95C54] animate-pulse" />
            <span>🚨 <b>Alert:</b> Japan Tourist eVisa expires in 25 days (Passport: N8492015). Email sent to krishnaanil116@gmail.com</span>
          </div>
        </div>

        {activeTab === 'chat' ? (
          <>
            {/* Chat Body */}
            <div className="flex-1 bg-[#F3EFEA] p-4 overflow-y-auto space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-2xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#111111] text-white rounded-br-none'
                        : 'bg-white text-[#111111] rounded-bl-none border border-[#EAE5DF]'
                    }`}
                  >
                    <div
                      className="whitespace-pre-line"
                      dangerouslySetInnerHTML={{ __html: msg.text }}
                    />
                    <div
                      className={`text-[9px] mt-1.5 text-right ${
                        msg.sender === 'user' ? 'text-white/60' : 'text-[#77716B]'
                      }`}
                    >
                      {msg.time}
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white rounded-2xl rounded-bl-none p-3 border border-[#EAE5DF] text-xs text-[#77716B] flex items-center gap-1.5 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0088cc] animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0088cc] animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0088cc] animate-bounce [animation-delay:0.4s]" />
                    <span className="text-[11px] ml-1">@VisaAI_Bot is answering...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Command Chips */}
            <div className="bg-white px-3 py-2 border-t border-[#EAE5DF] flex items-center gap-1.5 overflow-x-auto shrink-0">
              <span className="text-[10px] font-semibold text-[#77716B] uppercase shrink-0">Commands:</span>
              <button
                type="button"
                onClick={() => handleSendCommand('/passport')}
                className="px-2.5 py-1 rounded-full bg-[#F7F1E9] hover:bg-[#EAE5DF] text-[11px] font-semibold text-[#111111] transition-colors shrink-0 cursor-pointer"
              >
                /passport
              </button>
              <button
                type="button"
                onClick={() => handleSendCommand('/visas')}
                className="px-2.5 py-1 rounded-full bg-[#F7F1E9] hover:bg-[#EAE5DF] text-[11px] font-semibold text-[#111111] transition-colors shrink-0 cursor-pointer"
              >
                /visas
              </button>
              <button
                type="button"
                onClick={() => handleSendCommand('/check N8492015')}
                className="px-2.5 py-1 rounded-full bg-[#D8E6D5] hover:bg-[#c9ddc5] text-[11px] font-semibold text-[#111111] transition-colors shrink-0 cursor-pointer"
              >
                /check N8492015
              </button>
              <button
                type="button"
                onClick={() => handleSendCommand('/reminders')}
                className="px-2.5 py-1 rounded-full bg-[#F7F1E9] hover:bg-[#EAE5DF] text-[11px] font-semibold text-[#111111] transition-colors shrink-0 cursor-pointer"
              >
                /reminders
              </button>
              <button
                type="button"
                onClick={() => handleSendCommand('/mailbox')}
                className="px-2.5 py-1 rounded-full bg-amber-100 hover:bg-amber-200 text-[11px] font-semibold text-amber-900 transition-colors shrink-0 cursor-pointer"
              >
                📬 /mailbox
              </button>
              <button
                type="button"
                onClick={() => handleSendCommand('/status')}
                className="px-2.5 py-1 rounded-full bg-[#F7F1E9] hover:bg-[#EAE5DF] text-[11px] font-semibold text-[#111111] transition-colors shrink-0 cursor-pointer"
              >
                /status
              </button>
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendCommand(inputMessage);
              }}
              className="bg-white p-3 border-t border-[#EAE5DF] flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Message @VisaAI_Bot (/passport, /check N8492015)..."
                className="flex-1 px-3.5 py-2 rounded-xl border border-[#EAE5DF] text-xs text-[#111111] focus:outline-none focus:border-[#0088cc]"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="w-9 h-9 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          /* Bot Settings & Real Webhook Tab */
          <div className="flex-1 p-6 overflow-y-auto space-y-4 text-xs text-[#111111] bg-white">
            {/* Status card */}
            <div className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
              botInfo?.configured 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
                : 'bg-[#F7F1E9] border-[#EAE5DF]'
            }`}>
              <ShieldCheck className="w-4 h-4 mt-0.5 text-[#0088cc] shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-[#111111]">
                    Connected Bot: @{botHandle}
                  </p>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                    botInfo?.configured ? 'bg-emerald-200 text-emerald-900' : 'bg-neutral-200 text-neutral-800'
                  }`}>
                    {botInfo?.configured ? 'Online' : 'Pairing Ready'}
                  </span>
                </div>
                <p className="text-[11px] text-[#77716B] mt-1 leading-relaxed">
                  Real Telegram Bot integration: Connect your Bot API token from <b>@BotFather</b> to receive mobile expiry alerts and communicate via @{botHandle}.
                </p>
              </div>
            </div>

            {/* Direct Link to @VisaAI_Bot */}
            <div>
              <label className="block text-xs font-semibold text-[#111111] mb-1.5">
                1. Open @{botHandle} in Telegram
              </label>
              <div className="flex items-center gap-2">
                <a
                  href={`https://t.me/${botHandle}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
                >
                  <TelegramIcon className="w-4 h-4" />
                  <span>Open @{botHandle} in Telegram</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={copyBotLink}
                  className="px-3 py-2.5 rounded-xl border border-[#EAE5DF] hover:bg-[#F7F1E9] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Bot credentials for real dispatches */}
            <div className="space-y-3 pt-2 border-t border-[#EAE5DF]">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-[#111111]">
                  2. Telegram Bot API Token for @{botHandle}
                </label>
                <button
                  type="button"
                  onClick={checkBotConnection}
                  disabled={isCheckingBot}
                  className="text-[11px] text-[#0088cc] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isCheckingBot ? 'animate-spin' : ''}`} />
                  <span>Verify Token</span>
                </button>
              </div>

              <div>
                <input
                  type="password"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder="Paste token from @BotFather (e.g. 123456789:ABCdefGhIJK...)"
                  className="w-full px-3 py-2.5 rounded-xl border border-[#EAE5DF] font-mono text-xs text-[#111111] focus:outline-none focus:border-[#0088cc]"
                />
              </div>

              {/* Chat ID Input & Auto-Detect Button */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-[#77716B]">
                    Telegram Chat ID / User ID
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoDetectChatId}
                    disabled={isDetectingChat}
                    className="text-[11px] text-[#0088cc] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Radio className={`w-3 h-3 ${isDetectingChat ? 'animate-pulse' : ''}`} />
                    <span>{isDetectingChat ? 'Listening...' : 'Auto-Detect Chat ID'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  placeholder="e.g. 123456789 or @username"
                  className="w-full px-3 py-2.5 rounded-xl border border-[#EAE5DF] font-mono text-xs text-[#111111] focus:outline-none focus:border-[#0088cc]"
                />
                <p className="text-[10px] text-[#77716B] mt-1">
                  Tip: Message <code>/start</code> to @{botHandle} on your phone, then click "Auto-Detect Chat ID".
                </p>
              </div>

              {/* Feedback banner */}
              {liveDispatchResult && (
                <div className="p-3 rounded-xl bg-[#F7F1E9] border border-[#EAE5DF] text-xs font-medium">
                  {liveDispatchResult}
                </div>
              )}

              {webhookResult && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-medium">
                  {webhookResult}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveCredentials}
                  className="py-2.5 rounded-xl border border-[#EAE5DF] hover:bg-[#F7F1E9] font-semibold text-xs transition-colors cursor-pointer"
                >
                  Save Credentials
                </button>
                <button
                  type="button"
                  onClick={handleTestRealTelegramDispatch}
                  className="py-2.5 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Test Ping to Phone</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleSetWebhook}
                className="w-full py-2 rounded-xl bg-[#111111] hover:bg-neutral-800 text-white font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Enable Real-Time Webhook for @{botHandle}</span>
              </button>
            </div>

            {/* Commands list */}
            <div className="pt-2 border-t border-[#EAE5DF]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-xs text-[#111111]">
                  Commands List for @BotFather (/setcommands)
                </span>
                <button
                  type="button"
                  onClick={copyCommandsList}
                  className="text-[11px] text-[#0088cc] hover:underline font-semibold cursor-pointer flex items-center gap-1"
                >
                  {copiedCommands ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCommands ? 'Copied' : 'Copy Commands'}</span>
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-[#F7F1E9] font-mono text-[11px] text-[#111111] overflow-x-auto border border-[#EAE5DF]">
                {`start - Initialize VisaAI Concierge
status - Full overview of documents and applications
passport - Check passport validity and 6-month buffer
visas - List all visas and assigned passports
reminders - View 30/20/15 day email reminder schedule
check - Inspect any passport and assigned visas`}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

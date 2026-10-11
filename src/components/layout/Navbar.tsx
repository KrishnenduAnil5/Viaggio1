import React from 'react';
import { useAuth } from '../../lib/authContext';
import { LogOut, Compass, ShieldCheck, Mail } from 'lucide-react';
import { TelegramIcon } from '../common/TelegramAssistantModal';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenSupabaseModal?: () => void;
  onOpenTelegramModal?: () => void;
  onOpenSmtpModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  currentPath, 
  onNavigate, 
  onOpenSupabaseModal,
  onOpenTelegramModal,
  onOpenSmtpModal 
}) => {
  const { user, isAdmin, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    onNavigate('/login');
  };

  const navLinks = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Visa Reminders', path: '/visa-reminders' },
    { label: 'Passport', path: '/passport-reminders' },
    { label: 'Visa Journey', path: '/visa-journey' },
    { label: 'Documents', path: '/my-documents' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#F7F1E9]/90 backdrop-blur-md border-b border-[#EAE5DF]">
      <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between gap-8">
        
        {/* Zone 1: Single Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate(isAdmin ? '/admin' : '/dashboard')}
            className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-[#111111] text-[#FFFFFF] flex items-center justify-center font-display text-lg font-bold transition-transform group-hover:scale-105">
              V
            </div>
            <div>
              <span className="font-display text-2xl font-bold tracking-tight text-[#111111] whitespace-nowrap block leading-none">
                Viaggio
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: 4–5 Clean Single-Line Nav Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#77716B]">
          {isAdmin ? (
            // Admin-specific navigation
            <>
              <button
                onClick={() => onNavigate('/admin')}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-[#111111] cursor-pointer py-1 ${
                  currentPath === '/admin' ? 'text-[#111111] font-semibold border-b-2 border-[#111111]' : ''
                }`}
              >
                Admin Control
              </button>
              <button
                onClick={() => onNavigate('/dashboard')}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-[#111111] cursor-pointer py-1 ${
                  currentPath === '/dashboard' ? 'text-[#111111] font-semibold border-b-2 border-[#111111]' : ''
                }`}
              >
                Traveler Preview
              </button>
            </>
          ) : (
            // Normal User Navigation (Never shows Admin links)
            navLinks.map((item) => {
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  className={`transition-colors whitespace-nowrap shrink-0 hover:text-[#111111] cursor-pointer py-1 text-sm ${
                    isActive ? 'text-[#111111] font-semibold border-b-2 border-[#111111]' : ''
                  }`}
                >
                  {item.label}
                </button>
              );
            })
          )}
        </nav>

        {/* Zone 3: 1 Primary Action & Profile Info */}
        <div className="flex items-center gap-2.5 shrink-0">
          {onOpenSmtpModal && (
            <button
              onClick={onOpenSmtpModal}
              title="Automated 30/20/15-Day SMTP Email Alerts"
              className="p-2 rounded-xl border border-[#EAE5DF] bg-white text-[#111111] hover:bg-[#F7F1E9] transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs group"
              aria-label="SMTP Expiry Reminders"
            >
              <Mail className="w-4 h-4 text-[#111111] transition-transform group-hover:scale-110" />
              <span className="hidden lg:inline text-xs font-semibold text-[#111111]">SMTP Alerts</span>
            </button>
          )}

          {onOpenTelegramModal && (
            <button
              onClick={onOpenTelegramModal}
              title="Telegram Concierge Bot (@VisaAI_Bot)"
              className="p-2 rounded-xl border border-[#EAE5DF] bg-white text-[#0088cc] hover:bg-[#0088cc]/10 hover:border-[#0088cc]/40 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs group"
              aria-label="Telegram Bot Auto-Assistant"
            >
              <TelegramIcon className="w-4 h-4 transition-transform group-hover:scale-110" />
              <span className="hidden lg:inline text-xs font-semibold text-[#111111]">Bot Assistant</span>
            </button>
          )}

          {onOpenSupabaseModal && (
            <button
              onClick={onOpenSupabaseModal}
              title="Database status & SQL schema"
              className="text-xs px-2.5 py-1.5 rounded-md border border-[#EAE5DF] bg-white text-[#77716B] hover:text-[#111111] hover:border-[#111111] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="hidden sm:inline">Supabase</span>
            </button>
          )}

          {user && (
            <div className="flex items-center gap-3 pl-2 border-l border-[#EAE5DF]">
              <div className="text-right hidden sm:block">
                <span className="block text-xs font-semibold text-[#111111] truncate max-w-[130px]">
                  {user.full_name || user.email}
                </span>
                <span className="block text-[11px] text-[#77716B]">
                  {isAdmin ? 'Administrator' : 'Traveler'}
                </span>
              </div>

              <button
                onClick={handleLogout}
                title="Sign out of Viaggio"
                className="w-8 h-8 rounded-full border border-[#EAE5DF] bg-[#FFFFFF] text-[#111111] hover:bg-[#F7F1E9] flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Mobile nav bar */}
      <div className="md:hidden flex items-center overflow-x-auto px-4 py-2 gap-4 border-t border-[#EAE5DF] bg-white text-xs text-[#77716B]">
        {isAdmin ? (
          <>
            <button
              onClick={() => onNavigate('/admin')}
              className={`whitespace-nowrap ${currentPath === '/admin' ? 'font-bold text-[#111111]' : ''}`}
            >
              Admin Portal
            </button>
            <button
              onClick={() => onNavigate('/dashboard')}
              className={`whitespace-nowrap ${currentPath === '/dashboard' ? 'font-bold text-[#111111]' : ''}`}
            >
              Traveler Dashboard
            </button>
          </>
        ) : (
          navLinks.map((item) => (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={`whitespace-nowrap py-1 ${currentPath === item.path ? 'font-bold text-[#111111] border-b border-[#111111]' : ''}`}
            >
              {item.label}
            </button>
          ))
        )}
      </div>
    </header>
  );
};

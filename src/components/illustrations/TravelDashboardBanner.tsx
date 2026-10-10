import React from 'react';
import { TelegramIcon } from '../common/TelegramAssistantModal';
import { Compass, Sparkles } from 'lucide-react';

interface TravelDashboardBannerProps {
  onOpenTelegram: () => void;
  activeDestination?: string;
  totalDaysRemaining?: number | null;
}

export const TravelDashboardBanner: React.FC<TravelDashboardBannerProps> = ({
  onOpenTelegram,
  activeDestination = 'International Transit',
  totalDaysRemaining,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-[#EAE5DF] p-6 sm:p-8 shadow-xs overflow-hidden relative">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Left: Travel Status & Telegram Bot Connector */}
        <div className="lg:col-span-7 space-y-3 z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#77716B] bg-[#F7F1E9] px-2.5 py-1 rounded-md">
              Live Mobility Radar
            </span>
            <button
              onClick={onOpenTelegram}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#0088cc]/10 hover:bg-[#0088cc]/20 text-[#0088cc] text-xs font-semibold transition-colors cursor-pointer"
            >
              <TelegramIcon className="w-3.5 h-3.5" />
              <span>Telegram Auto-Assistant: @ViaggioVisaBot</span>
            </button>
          </div>

          <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#111111] leading-tight">
            Journey Status: Active &amp; Monitored
          </h2>

          <p className="text-xs text-[#77716B] leading-relaxed max-w-lg">
            Continuous consular validity checks, 6-month passport rule safeguards, and instant automated Telegram notifications for upcoming deadlines.
          </p>

          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={onOpenTelegram}
              className="px-4 py-2 rounded-xl bg-[#111111] text-white text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer inline-flex items-center gap-2 shadow-2xs"
            >
              <TelegramIcon className="w-3.5 h-3.5 text-white" />
              <span>Configure Telegram Bot</span>
            </button>
            <span className="text-xs text-[#77716B]">
              {totalDaysRemaining !== null && totalDaysRemaining !== undefined ? (
                <>Next milestone: <strong className="font-mono text-[#111111]">{totalDaysRemaining}d</strong></>
              ) : (
                'All credentials nominal'
              )}
            </span>
          </div>
        </div>

        {/* Right: 2D Animated Route, Compass & Passport Stamp Illustration */}
        <div className="lg:col-span-5 relative flex items-center justify-center min-h-[160px] select-none">
          <svg
            viewBox="0 0 380 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto max-w-[360px]"
            aria-label="2D Travel route animation"
          >
            {/* Animated Flowing Dashed Flight Route */}
            <path
              d="M 40 120 Q 140 30 330 70"
              stroke="#111111"
              strokeWidth="1.8"
              fill="none"
              className="anim-dash-flow"
            />

            {/* Departure Point Marker */}
            <g transform="translate(40, 120)">
              <circle cx="0" cy="0" r="4.5" fill="#111111" />
              <circle cx="0" cy="0" r="9" stroke="#EAE5DF" strokeWidth="1.5" />
              <text x="-16" y="20" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="9" fontWeight="700" fill="#77716B">ORIGIN</text>
            </g>

            {/* Destination Marker */}
            <g transform="translate(330, 70)">
              <circle cx="0" cy="0" r="5" fill="#111111" />
              <circle cx="0" cy="0" r="10" stroke="#D8E6D5" strokeWidth="2" strokeDasharray="3 3" />
              <text x="-24" y="24" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="9" fontWeight="700" fill="#111111">
                {activeDestination.toUpperCase().slice(0, 12)}
              </text>
            </g>

            {/* Gliding Paper Airplane along route */}
            <g className="anim-flight" transform="translate(180, 56) rotate(6)">
              <polygon points="0,0 22,-6 12,12" fill="#FFFFFF" stroke="#111111" strokeWidth="1.6" strokeLinejoin="round" />
              <polygon points="12,12 22,-6 7,2" fill="#F7F1E9" stroke="#111111" strokeWidth="1.4" strokeLinejoin="round" />
              <line x1="0" y1="0" x2="22" y2="-6" stroke="#111111" strokeWidth="1.4" />
            </g>

            {/* Vintage Floating Passport Stamp */}
            <g className="anim-stamp" transform="translate(230, 80) rotate(-6)">
              <rect x="0" y="0" width="105" height="42" rx="6" fill="#F7F1E9" stroke="#111111" strokeWidth="1.5" strokeDasharray="4 2" />
              <text x="8" y="16" fontFamily="Playfair Display, serif" fontSize="8" fontWeight="bold" fill="#111111">VIAGGIO PASS</text>
              <text x="8" y="26" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="7" fontWeight="600" fill="#77716B">BORDER CLEARED</text>
              <text x="8" y="36" fontFamily="JetBrains Mono, monospace" fontSize="6.5" fill="#111111">STATUS: OK-2026</text>
              <circle cx="90" cy="21" r="7" stroke="#111111" strokeWidth="1.2" fill="none" />
              <path d="M 87 21 L 89 23 L 94 18" stroke="#111111" strokeWidth="1.2" fill="none" />
            </g>

            {/* Swaying Minimal Compass in upper left */}
            <g transform="translate(85, 45)">
              <circle cx="0" cy="0" r="22" stroke="#EAE5DF" strokeWidth="1.5" fill="#FFFFFF" />
              <circle cx="0" cy="0" r="18" stroke="#111111" strokeWidth="0.8" strokeDasharray="2 3" fill="none" />
              {/* Compass ticks */}
              <line x1="0" y1="-21" x2="0" y2="-17" stroke="#111111" strokeWidth="1.2" />
              <line x1="0" y1="17" x2="0" y2="21" stroke="#111111" strokeWidth="1.2" />
              <line x1="-21" y1="0" x2="-17" y2="0" stroke="#111111" strokeWidth="1.2" />
              <line x1="17" y1="0" x2="21" y2="0" stroke="#111111" strokeWidth="1.2" />
              {/* Needle */}
              <g className="anim-compass-needle">
                <polygon points="0,-14 3,0 -3,0" fill="#111111" />
                <polygon points="0,14 3,0 -3,0" fill="#77716B" />
                <circle cx="0" cy="0" r="2" fill="#FFFFFF" stroke="#111111" strokeWidth="1" />
              </g>
              <text x="-3" y="-23" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="6" fontWeight="bold" fill="#111111">N</text>
            </g>
          </svg>
        </div>

      </div>
    </div>
  );
};

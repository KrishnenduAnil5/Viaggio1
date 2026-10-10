import React from 'react';
import { Lock, ArrowLeft } from 'lucide-react';

interface ForbiddenPageProps {
  onNavigate: (path: string) => void;
}

export const ForbiddenPage: React.FC<ForbiddenPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl border border-[#EAE5DF] p-8 max-w-md w-full text-center shadow-lg">
        <div className="w-12 h-12 rounded-2xl bg-[#C95C54]/10 text-[#C95C54] flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="font-editorial text-2xl font-bold text-[#111111] mb-2">
          Access Restricted
        </h2>
        <p className="text-xs text-[#77716B] leading-relaxed mb-6">
          This portal is restricted to authorized administrative personnel. Unauthorized route requests are blocked by security policy.
        </p>
        <button
          onClick={() => onNavigate('/dashboard')}
          className="w-full py-2.5 rounded-xl bg-[#111111] text-white text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </button>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { isSupabaseConfigured } from '../../lib/supabase';
import { Check, Copy, Database, ExternalLink, X, ShieldCheck } from 'lucide-react';

interface SupabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseStatusModal: React.FC<SupabaseStatusModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const copySqlInstruction = () => {
    navigator.clipboard.writeText(`-- Run the full SQL setup from /supabase/schema.sql in your Supabase SQL Editor`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-[#EAE5DF] max-w-xl w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#F7F1E9] text-[#77716B] hover:text-[#111111] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#D8E6D5] flex items-center justify-center text-[#111111]">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-[#111111]">Supabase Connection & Database</h3>
            <p className="text-xs text-[#77716B]">Postgres Database, Auth & Private Document Storage</p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-[#111111]">
          {/* Status banner */}
          <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${
            isSupabaseConfigured 
              ? 'bg-[#D8E6D5]/40 border-[#D8E6D5] text-[#111111]' 
              : 'bg-[#F7F1E9] border-[#EAE5DF] text-[#77716B]'
          }`}>
            <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-[#111111]" />
            <div>
              <p className="font-semibold text-[#111111]">
                {isSupabaseConfigured 
                  ? 'Connected to live Supabase project' 
                  : 'Operating in Local High-Fidelity Data Store mode'}
              </p>
              <p className="mt-0.5">
                {isSupabaseConfigured
                  ? 'Live queries, Auth sessions, and Supabase Storage bucket policies are actively synced.'
                  : 'All user isolation, admin role authorization, visa calculators, and document vaults are functional locally and fully prepared to link to your Supabase instance.'}
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-xs text-[#111111] mb-1.5">1. Environment Configuration (.env)</h4>
            <div className="p-3 bg-[#F7F1E9] rounded-lg font-mono text-[11px] space-y-1 text-[#111111] select-all border border-[#EAE5DF]">
              <div>VITE_SUPABASE_URL="https://your-project-id.supabase.co"</div>
              <div>VITE_SUPABASE_ANON_KEY="your-anon-key"</div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-xs text-[#111111] mb-1.5">2. SQL Migration & Schema Setup</h4>
            <p className="text-[#77716B] mb-2 leading-relaxed">
              Execute the complete migrations located in <code className="font-mono bg-[#F7F1E9] px-1 py-0.5 rounded text-[#111111]">/supabase/schema.sql</code>. It configures profiles, visa_applications, passport_details, reminders, journey_steps, user_documents, and strict Row Level Security policies.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={copySqlInstruction}
                className="px-3 py-1.5 rounded-md bg-[#111111] text-white hover:bg-[#333333] transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#D8E6D5]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Schema file: /supabase/schema.sql'}</span>
              </button>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-xs text-[#111111] mb-1">3. Initial Admin Credentials</h4>
            <p className="text-[#77716B] leading-relaxed">
              Email: <code className="font-mono text-[#111111] font-semibold">admin@gmail.com</code> | Password: <code className="font-mono text-[#111111] font-semibold">admin123</code>. The database trigger automatically assigns the <code className="font-mono text-[#111111]">admin</code> role to this account upon sign in.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#111111] text-white text-xs font-medium hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

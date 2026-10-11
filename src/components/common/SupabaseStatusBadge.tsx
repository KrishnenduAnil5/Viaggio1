import React, { useState, useEffect } from 'react';
import { 
  isSupabaseConfigured, 
  getStoredSupabaseConfig, 
  updateSupabaseClient, 
  clearSupabaseClient, 
  testSupabaseConnection 
} from '../../lib/supabase';
import { DataService } from '../../lib/storage';
import { 
  Check, 
  Copy, 
  Database, 
  X, 
  ShieldCheck, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  UploadCloud, 
  ExternalLink 
} from 'lucide-react';

interface SupabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseStatusModal: React.FC<SupabaseStatusModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'connect' | 'schema'>('connect');
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const cfg = getStoredSupabaseConfig();
      setUrl(cfg.url || '');
      setAnonKey(cfg.anonKey || '');
      setTestResult(null);
      setSyncResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection(url, anonKey);
      setTestResult({ success: res.success, message: res.message });
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Connection failed' });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveAndConnect = () => {
    if (!url.trim() || !anonKey.trim()) {
      setTestResult({ success: false, message: 'Please provide both Project URL and Anon Key.' });
      return;
    }
    const configured = updateSupabaseClient(url, anonKey);
    if (configured) {
      setTestResult({ success: true, message: 'Supabase configuration saved! Live client re-initialized.' });
    } else {
      setTestResult({ success: false, message: 'Invalid URL or key format.' });
    }
  };

  const handleDisconnect = () => {
    clearSupabaseClient();
    setUrl('');
    setAnonKey('');
    setTestResult({ success: true, message: 'Disconnected. Switched to high-fidelity local vault storage.' });
  };

  const handleSyncAllData = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await DataService.syncAllDataToSupabase();
      if (res.success) {
        setSyncResult({ 
          success: true, 
          message: `Successfully synchronized ${res.count} records (Profiles, Passports, Visas) directly into your Supabase database!` 
        });
      } else {
        setSyncResult({ success: false, message: res.error || 'Failed to sync data' });
      }
    } catch (err: any) {
      setSyncResult({ success: false, message: err.message || 'Data sync failed' });
    } finally {
      setSyncing(false);
    }
  };

  const copySqlInstruction = () => {
    navigator.clipboard.writeText(`-- Run the full SQL setup from /supabase/schema.sql in your Supabase SQL Editor`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-[#EAE5DF] max-w-xl w-full p-6 sm:p-7 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-[#F7F1E9] text-[#77716B] hover:text-[#111111] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-[#D8E6D5] text-[#111111] flex items-center justify-center shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-editorial text-2xl font-bold text-[#111111]">
              Supabase Connection Manager
            </h3>
            <p className="text-xs text-[#77716B]">
              PostgreSQL Database, Auth & Private Document Vault Synchronization
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-[#EAE5DF] mb-5">
          <button
            onClick={() => setActiveTab('connect')}
            className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'connect' 
                ? 'border-[#111111] text-[#111111]' 
                : 'border-transparent text-[#77716B] hover:text-[#111111]'
            }`}
          >
            Connection & Live Sync
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'schema' 
                ? 'border-[#111111] text-[#111111]' 
                : 'border-transparent text-[#77716B] hover:text-[#111111]'
            }`}
          >
            Database Schema & RLS Setup
          </button>
        </div>

        {activeTab === 'connect' ? (
          <div className="space-y-4 text-xs text-[#111111]">
            {/* Status Indicator */}
            <div className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
              isSupabaseConfigured 
                ? 'bg-[#D8E6D5]/40 border-[#D8E6D5] text-[#111111]' 
                : 'bg-[#F7F1E9] border-[#EAE5DF] text-[#77716B]'
            }`}>
              <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-[#111111]" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-[#111111]">
                    {isSupabaseConfigured 
                      ? 'Connected to Live Supabase Project' 
                      : 'Operating in High-Fidelity Local Vault Mode'}
                  </p>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold ${
                    isSupabaseConfigured ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-700'
                  }`}>
                    {isSupabaseConfigured ? 'Active' : 'Standby'}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed">
                  {isSupabaseConfigured
                    ? 'Real queries, authentication tokens, and remote storage are connected.'
                    : 'All visa reminders, passport expiration checks, and journeys are fully functional right now. Connect your live Supabase project below to persist across devices.'}
                </p>
              </div>
            </div>

            {/* Test / Operation Feedback */}
            {testResult && (
              <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                testResult.success 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />}
                <span>{testResult.message}</span>
              </div>
            )}

            {syncResult && (
              <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                syncResult.success 
                  ? 'bg-[#D8E6D5]/50 border-[#D8E6D5] text-[#111111]' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                {syncResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />}
                <span>{syncResult.message}</span>
              </div>
            )}

            {/* Credential Inputs */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE5DF] bg-[#FFFFFF] text-xs font-mono text-[#111111] placeholder:text-[#77716B]/50 focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1">
                  Supabase Anon (Public) Key
                </label>
                <input
                  type="password"
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE5DF] bg-[#FFFFFF] text-xs font-mono text-[#111111] placeholder:text-[#77716B]/50 focus:outline-none focus:border-[#111111]"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="px-3.5 py-2 rounded-xl border border-[#EAE5DF] hover:bg-[#F7F1E9] text-xs font-semibold text-[#111111] transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                <span>{testing ? 'Testing...' : 'Test Connection'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAndConnect}
                className="px-4 py-2 rounded-xl bg-[#111111] hover:bg-neutral-800 text-xs font-semibold text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save & Connect</span>
              </button>

              {isSupabaseConfigured && (
                <>
                  <button
                    type="button"
                    onClick={handleSyncAllData}
                    disabled={syncing}
                    className="px-3.5 py-2 rounded-xl bg-[#D8E6D5] hover:bg-[#c9ddc5] text-xs font-semibold text-[#111111] transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                    title="Upload local sample passports, visas, and profiles into Supabase"
                  >
                    <UploadCloud className={`w-3.5 h-3.5 ${syncing ? 'animate-bounce' : ''}`} />
                    <span>{syncing ? 'Syncing...' : 'Sync All Data to Supabase'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="px-3 py-2 rounded-xl text-xs text-[#C95C54] hover:underline cursor-pointer ml-auto"
                  >
                    Disconnect
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-xs text-[#111111]">
            <div>
              <h4 className="font-semibold text-xs text-[#111111] mb-1.5">
                Complete SQL Migration File
              </h4>
              <p className="text-[#77716B] leading-relaxed mb-3">
                All database tables, foreign keys, and Row Level Security policies are defined in <code className="font-mono bg-[#F7F1E9] px-1 py-0.5 rounded text-[#111111]">/supabase/schema.sql</code>. Copy and run this once in your Supabase SQL Editor.
              </p>
              
              <div className="p-3 bg-[#F7F1E9] rounded-xl font-mono text-[11px] space-y-1.5 text-[#111111] border border-[#EAE5DF]">
                <div>• profiles (role-based security: traveler vs admin)</div>
                <div>• passport_details (encrypted passport vault)</div>
                <div>• visa_reminders (linked to passport numbers)</div>
                <div>• visa_applications & visa_journey_steps</div>
                <div>• application_updates (consular updates feed)</div>
                <div>• user_documents (storage bucket metadata)</div>
              </div>

              <div className="mt-3">
                <button
                  type="button"
                  onClick={copySqlInstruction}
                  className="px-3.5 py-2 rounded-xl bg-[#111111] text-white hover:bg-neutral-800 transition-colors flex items-center gap-1.5 cursor-pointer font-semibold text-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#D8E6D5]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy /supabase/schema.sql Location'}</span>
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-[#EAE5DF]">
              <h4 className="font-semibold text-xs text-[#111111] mb-1">
                Admin Officer Credentials
              </h4>
              <p className="text-[#77716B] leading-relaxed">
                Email: <code className="font-mono text-[#111111] font-bold">admin@gmail.com</code> | Password: <code className="font-mono text-[#111111] font-bold">admin123</code>. The database trigger automatically elevates this account to the <code className="font-mono text-[#111111]">admin</code> role upon sign-in.
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-[#EAE5DF] flex items-center justify-between text-xs text-[#77716B]">
          <span>Viaggio Visa Intelligence Data Bridge</span>
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

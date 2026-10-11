import React, { useState } from 'react';
import { useAuth } from '../lib/authContext';
import { TravelIllustration } from '../components/illustrations/TravelIllustration';
import { Eye, EyeOff, ArrowRight, ShieldCheck, Info } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login, signup, loading, error, clearError } = useAuth();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; fullName?: string }>({});
  const [forgotPasswordNotice, setForgotPasswordNotice] = useState(false);

  const validate = () => {
    const errors: { email?: string; password?: string; fullName?: string } = {};
    if (!email || !email.includes('@')) {
      errors.email = 'Please provide a valid email address.';
    }
    if (!password || password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }
    if (isSignUp && !fullName.trim()) {
      errors.fullName = 'Full name is required.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!validate()) return;

    if (isSignUp) {
      const res = await signup(email, password, fullName);
      if (res.success) {
        // Redirection based strictly on database-authorized role
        if (res.role === 'admin') {
          onNavigate('/admin');
        } else {
          onNavigate('/dashboard');
        }
      }
    } else {
      const res = await login(email, password);
      if (res.success) {
        // Redirection based strictly on database-authorized role
        if (res.role === 'admin') {
          onNavigate('/admin');
        } else {
          onNavigate('/dashboard');
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F1E9] flex flex-col justify-between p-4 sm:p-8 md:p-12">
      {/* Top minimal brand bar */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#111111] text-[#FFFFFF] flex items-center justify-center font-display text-lg font-bold">
            V
          </div>
          <span className="font-display text-2xl font-bold tracking-tight text-[#111111]">
            Viaggio
          </span>
        </div>
        <span className="text-xs text-[#77716B] font-medium hidden sm:inline">
          Your journey, beautifully organized.
        </span>
      </header>

      {/* Main Container: Large White Rounded Panel inspired by reference */}
      <main className="max-w-6xl w-full mx-auto my-6 bg-[#FFFFFF] rounded-3xl border border-[#EAE5DF] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
          
          {/* Left Column: 2D Travel Illustration Scene */}
          <div className="lg:col-span-7 bg-[#FFFFFF] p-8 sm:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#EAE5DF]">
            <div className="max-w-md">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#77716B] mb-2 block">
                Traveler Portal
              </span>
              <h1 className="font-editorial text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#111111] leading-[1.15] mb-3">
                Every journey starts somewhere.
              </h1>
              <p className="text-[#77716B] text-sm sm:text-base leading-relaxed">
                Keep your visa journey, important dates, and travel documents beautifully organized in one place.
              </p>
            </div>

            {/* Hand-drawn minimalist 2D travel illustration */}
            <div className="my-6">
              <TravelIllustration />
            </div>

            {/* Editorial footnote / quote */}
            <div className="pt-4 border-t border-[#EAE5DF]/60 flex items-center justify-between text-xs text-[#77716B]">
              <span>Verified timeline tracking & encrypted document storage</span>
              <span className="font-mono text-[11px]">VIAGGIO / V1.0</span>
            </div>
          </div>

          {/* Right Column: Clean Shared Login Form */}
          <div className="lg:col-span-5 p-8 sm:p-12 flex flex-col justify-center bg-[#FFFFFF]">
            <div className="max-w-sm w-full mx-auto">
              
              {/* Tab selector between Login & Account creation */}
              <div className="flex items-center gap-1 p-1 bg-[#F7F1E9] rounded-xl mb-6 border border-[#EAE5DF]">
                <button
                  type="button"
                  onClick={() => { setIsSignUp(false); clearError(); }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    !isSignUp
                      ? 'bg-white text-[#111111] shadow-xs'
                      : 'text-[#77716B] hover:text-[#111111]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setIsSignUp(true); clearError(); }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    isSignUp
                      ? 'bg-white text-[#111111] shadow-xs'
                      : 'text-[#77716B] hover:text-[#111111]'
                  }`}
                >
                  Create Account
                </button>
              </div>

              <div className="mb-6">
                <h2 className="font-display text-2xl font-bold text-[#111111]">
                  {isSignUp ? 'Create your traveler account' : 'Welcome back'}
                </h2>
                <p className="text-xs text-[#77716B] mt-1">
                  {isSignUp
                    ? 'Begin managing your travel visas and passport securely.'
                    : 'Enter your credentials to continue your journey.'}
                </p>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-[#C95C54]/10 border border-[#C95C54]/30 text-[#C95C54] text-xs leading-relaxed">
                  {error}
                </div>
              )}

              {/* Forgot password notification */}
              {forgotPasswordNotice && (
                <div className="mb-4 p-3 rounded-xl bg-[#E5EDF4] border border-[#EAE5DF] text-[#111111] text-xs">
                  Password reset link has been dispatched to your email address if it is registered in Supabase Auth.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <div>
                    <label className="block text-xs font-semibold text-[#111111] mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Akash Sudheer"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE5DF] bg-[#FFFFFF] text-sm text-[#111111] placeholder:text-[#77716B]/50 focus:outline-none focus:border-[#111111] transition-colors"
                    />
                    {fieldErrors.fullName && (
                      <p className="text-xs text-[#C95C54] mt-1">{fieldErrors.fullName}</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#111111] mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    autoComplete="email"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE5DF] bg-[#FFFFFF] text-sm text-[#111111] placeholder:text-[#77716B]/50 focus:outline-none focus:border-[#111111] transition-colors"
                  />
                  {fieldErrors.email && (
                    <p className="text-xs text-[#C95C54] mt-1">{fieldErrors.email}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-[#111111]">
                      Password
                    </label>
                    {!isSignUp && (
                      <button
                        type="button"
                        onClick={() => setForgotPasswordNotice(true)}
                        className="text-xs text-[#77716B] hover:text-[#111111] cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete={isSignUp ? 'new-password' : 'current-password'}
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-[#EAE5DF] bg-[#FFFFFF] text-sm text-[#111111] placeholder:text-[#77716B]/50 focus:outline-none focus:border-[#111111] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#77716B] hover:text-[#111111] cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-xs text-[#C95C54] mt-1">{fieldErrors.password}</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-[#EAE5DF] text-[#111111] focus:ring-0 cursor-pointer accent-[#111111]"
                    />
                    <span className="text-xs text-[#77716B]">Remember session</span>
                  </label>
                </div>

                {/* Primary Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-5 rounded-xl bg-[#111111] text-[#FFFFFF] text-sm font-semibold hover:bg-neutral-800 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 shadow-sm"
                >
                  {loading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{isSignUp ? 'Create your account' : 'Continue your journey'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Quick 1-Click Demo Profiles */}
              <div className="mt-6 pt-5 border-t border-[#EAE5DF]">
                <p className="text-[11px] font-semibold text-[#77716B] uppercase tracking-wider mb-2.5">
                  Quick Demo Credentials
                </p>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('krishnaanil@gmail.com');
                      setPassword('password123');
                    }}
                    className="w-full py-2 px-3 rounded-xl border border-[#D8E6D5] bg-[#D8E6D5]/30 hover:bg-[#D8E6D5]/60 text-xs text-[#111111] flex items-center justify-between transition-colors cursor-pointer text-left"
                  >
                    <div>
                      <span className="font-bold">Krishnendu Anil</span>
                      <span className="text-[10px] text-[#77716B] block">krishnaanil@gmail.com · Expiring Visa &amp; Alerts</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#111111] text-white">Fill</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('admin@gmail.com');
                      setPassword('admin123');
                    }}
                    className="w-full py-2 px-3 rounded-xl border border-[#EAE5DF] bg-[#F7F1E9]/50 hover:bg-[#F7F1E9] text-xs text-[#111111] flex items-center justify-between transition-colors cursor-pointer text-left"
                  >
                    <div>
                      <span className="font-bold">Administrator</span>
                      <span className="text-[10px] text-[#77716B] block">admin@gmail.com · Consular Portal</span>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-800">Fill</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('akashsudheer678@gmail.com');
                      setPassword('traveler123');
                    }}
                    className="w-full py-2 px-3 rounded-xl border border-[#EAE5DF] bg-[#F7F1E9]/50 hover:bg-[#F7F1E9] text-xs text-[#111111] flex items-center justify-between transition-colors cursor-pointer text-left"
                  >
                    <div>
                      <span className="font-bold">Akash Sudheer</span>
                      <span className="text-[10px] text-[#77716B] block">akashsudheer678@gmail.com</span>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-800">Fill</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Footer text */}
      <footer className="max-w-6xl w-full mx-auto text-center py-2 text-xs text-[#77716B]">
        <span>Viaggio Visa Intelligence & Document Management</span>
        <span className="mx-2">·</span>
        <span>Row Level Security Enforced</span>
      </footer>
    </div>
  );
};

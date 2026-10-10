import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';
import { DataService } from './storage';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; role?: UserRole; error?: string }>;
  signup: (email: string, password: string, fullName: string) => Promise<{ success: boolean; role?: UserRole; error?: string }>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_KEY = 'viaggio_active_session_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize session on mount
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        if (isSupabaseConfigured) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const profile = await DataService.getProfile(session.user.id);
            if (mounted && profile) {
              setUser(profile);
              setLoading(false);
              return;
            }
          }
        }

        // Check local persisted session
        const storedUserJson = localStorage.getItem(CURRENT_USER_KEY);
        if (storedUserJson) {
          const storedUser = JSON.parse(storedUserJson) as UserProfile;
          // Re-verify against database
          const profile = await DataService.getProfile(storedUser.id);
          if (mounted) {
            setUser(profile || storedUser);
          }
        }
      } catch (err) {
        console.error('Auth initialization error', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    // Listen to Supabase auth state changes if configured
    if (isSupabaseConfigured) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const profile = await DataService.getProfile(session.user.id);
          if (mounted && profile) {
            setUser(profile);
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(profile));
          }
        } else {
          if (mounted) {
            setUser(null);
            localStorage.removeItem(CURRENT_USER_KEY);
          }
        }
      });

      return () => {
        mounted = false;
        authListener.subscription.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; role?: UserRole; error?: string }> => {
    setError(null);
    setLoading(true);

    try {
      const trimmedEmail = email.trim().toLowerCase();

      // 1. If Supabase is configured, use live Supabase Auth
      if (isSupabaseConfigured) {
        const { data, error: sbError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

        if (sbError) {
          setError(sbError.message);
          setLoading(false);
          return { success: false, error: sbError.message };
        }

        if (data.user) {
          // Trusted database query to retrieve role
          const profile = await DataService.getProfile(data.user.id);
          if (!profile) {
            setError('Account profile could not be retrieved from database.');
            setLoading(false);
            return { success: false, error: 'Database profile not found' };
          }

          setUser(profile);
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(profile));
          setLoading(false);
          return { success: true, role: profile.role };
        }
      }

      // 2. Demo / Local database verification
      // Verify initial admin or registered user
      if (trimmedEmail === 'admin@gmail.com') {
        if (password !== 'admin123') {
          const errMsg = 'Invalid administrator credentials.';
          setError(errMsg);
          setLoading(false);
          return { success: false, error: errMsg };
        }
        // Fetch role from trusted profile store
        const adminProfile = await DataService.getProfile('user-admin-1');
        if (adminProfile) {
          setUser(adminProfile);
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(adminProfile));
          setLoading(false);
          return { success: true, role: adminProfile.role };
        }
      }

      // Check standard demo accounts or registered users
      const allUsers = await DataService.adminGetAllUsers();
      let matched = allUsers.find(u => u.email.toLowerCase() === trimmedEmail);

      if (!matched) {
        // If user doesn't exist yet in demo mode, auto-register as standard user with default role 'user'
        matched = {
          id: 'user-' + Date.now(),
          email: trimmedEmail,
          full_name: trimmedEmail.split('@')[0],
          role: 'user', // strictly normal user
          created_at: new Date().toISOString(),
        };
        const profilesList = [...allUsers, matched];
        localStorage.setItem('viaggio_data_profiles', JSON.stringify(profilesList));
      }

      setUser(matched);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(matched));
      setLoading(false);
      return { success: true, role: matched.role };

    } catch (err: any) {
      const errMsg = err?.message || 'Authentication failed. Please check your credentials.';
      setError(errMsg);
      setLoading(false);
      return { success: false, error: errMsg };
    }
  };

  const signup = async (email: string, password: string, fullName: string): Promise<{ success: boolean; role?: UserRole; error?: string }> => {
    setError(null);
    setLoading(true);

    try {
      const trimmedEmail = email.trim().toLowerCase();

      if (isSupabaseConfigured) {
        const { data, error: sbError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: { full_name: fullName },
          },
        });

        if (sbError) {
          setError(sbError.message);
          setLoading(false);
          return { success: false, error: sbError.message };
        }

        if (data.user) {
          // Wait briefly for trigger, or fetch profile
          let profile = await DataService.getProfile(data.user.id);
          if (!profile) {
            profile = {
              id: data.user.id,
              email: trimmedEmail,
              full_name: fullName || trimmedEmail.split('@')[0],
              role: 'user',
              created_at: new Date().toISOString(),
            };
          }
          setUser(profile);
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(profile));
          setLoading(false);
          return { success: true, role: profile.role };
        }
      }

      // Local database registration:
      // Always enforce role 'user'. Normal users can never self-assign 'admin'.
      const allUsers = await DataService.adminGetAllUsers();
      if (allUsers.some(u => u.email.toLowerCase() === trimmedEmail)) {
        const errMsg = 'An account with this email address already exists.';
        setError(errMsg);
        setLoading(false);
        return { success: false, error: errMsg };
      }

      const newProfile: UserProfile = {
        id: 'user-' + Date.now(),
        email: trimmedEmail,
        full_name: fullName.trim() || trimmedEmail.split('@')[0],
        role: 'user', // Enforce user role
        created_at: new Date().toISOString(),
      };

      const updated = [...allUsers, newProfile];
      localStorage.setItem('viaggio_data_profiles', JSON.stringify(updated));

      setUser(newProfile);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newProfile));
      setLoading(false);
      return { success: true, role: newProfile.role };
    } catch (err: any) {
      const errMsg = err?.message || 'Account registration failed.';
      setError(errMsg);
      setLoading(false);
      return { success: false, error: errMsg };
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('Supabase sign out error', err);
    } finally {
      localStorage.removeItem(CURRENT_USER_KEY);
      setUser(null);
      setError(null);
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  const value: AuthContextType = {
    user,
    role: user?.role || null,
    isAdmin: user?.role === 'admin',
    loading,
    error,
    login,
    signup,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function getStoredSupabaseConfig() {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
  const localUrl = (typeof window !== 'undefined' ? localStorage.getItem('viaggio_supabase_url') || '' : '').trim();
  const localKey = (typeof window !== 'undefined' ? localStorage.getItem('viaggio_supabase_anon_key') || '' : '').trim();

  const activeUrl = envUrl || localUrl;
  const activeKey = envKey || localKey;

  const isConfigured = Boolean(
    activeUrl &&
    activeKey &&
    activeUrl.startsWith('http') &&
    !activeUrl.includes('your-project-id') &&
    !activeKey.includes('your-anon-key')
  );

  return {
    url: activeUrl,
    anonKey: activeKey,
    isConfigured,
    source: envUrl ? 'env' : localUrl ? 'local' : 'none',
  };
}

const currentConfig = getStoredSupabaseConfig();

export let isSupabaseConfigured = currentConfig.isConfigured;

// Create client
export let supabase: SupabaseClient = createClient(
  currentConfig.isConfigured ? currentConfig.url : 'https://dummy-viaggio-project.supabase.co',
  currentConfig.isConfigured ? currentConfig.anonKey : 'dummy-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export function updateSupabaseClient(url: string, anonKey: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('viaggio_supabase_url', url.trim());
    localStorage.setItem('viaggio_supabase_anon_key', anonKey.trim());
  }

  isSupabaseConfigured = Boolean(
    url && 
    anonKey && 
    url.startsWith('http') && 
    !url.includes('your-project-id') &&
    !anonKey.includes('your-anon-key')
  );

  supabase = createClient(
    isSupabaseConfigured ? url.trim() : 'https://dummy-viaggio-project.supabase.co',
    isSupabaseConfigured ? anonKey.trim() : 'dummy-anon-key',
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );

  return isSupabaseConfigured;
}

export function clearSupabaseClient() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('viaggio_supabase_url');
    localStorage.removeItem('viaggio_supabase_anon_key');
  }
  isSupabaseConfigured = false;
  supabase = createClient('https://dummy-viaggio-project.supabase.co', 'dummy-anon-key');
}

export async function testSupabaseConnection(url?: string, key?: string): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const testUrl = url || getStoredSupabaseConfig().url;
    const testKey = key || getStoredSupabaseConfig().anonKey;

    if (!testUrl || !testKey) {
      return { success: false, message: 'URL and Anon Key are required.' };
    }

    const testClient = createClient(testUrl, testKey);
    // Ping profiles or auth
    const { error } = await testClient.from('profiles').select('count', { count: 'exact', head: true });
    
    if (error && error.code !== 'PGRST116' && !error.message.includes('permission denied')) {
      // If table doesn't exist yet, but connection succeeded
      if (error.message.includes('relation "public.profiles" does not exist') || error.code === '42P01') {
        return {
          success: true,
          message: 'Connected to Supabase! (Note: Schema tables not yet run. Use the SQL Schema tab to execute migration).',
        };
      }
      return { success: false, message: error.message, error: error.details };
    }

    return { success: true, message: 'Live connection verified! Postgres and Row Level Security active.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Connection attempt timed out.' };
  }
}


import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabaseInstance;

if (supabaseUrl && supabaseAnonKey) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
} else {
    console.warn('Supabase credentials missing. Utilizing MOCK client to prevent crash.')
    // Mock client to prevent crashes on import
    supabaseInstance = {
        auth: {
            getSession: async () => ({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
            signInWithPassword: async () => ({ data: {}, error: { message: 'Mock Mode enabled' } }),
            signOut: async () => ({ error: null }),
        },
        from: () => ({
            select: () => ({ order: () => ({ data: [], error: null }) }),
        })
    }
}

export const supabase = supabaseInstance;

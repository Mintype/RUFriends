import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey,
  {
    auth: {
      persistSession: true,   // saves session in localStorage
      autoRefreshToken: true, // refreshes tokens automatically
    },
    realtime: {
      params: {
        eventsPerSecond: 10, // Limit to prevent overwhelming
      }
    },
    // Enable debug logging in development
    ...(process.env.NODE_ENV === 'development' && {
      global: {
        headers: {
          'X-Client-Info': 'rufriends-chat-debug'
        }
      }
    })
  }
)

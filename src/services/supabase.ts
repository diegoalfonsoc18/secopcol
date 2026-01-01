// src/services/supabase.ts
// Configuración y cliente de Supabase

import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SUPABASE_URL = "https://drwxgdwtlcvgiihwvgxd.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyd3hnZHd0bGN2Z2lpaHd2Z3hkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0OTYxOTksImV4cCI6MjA4MjA3MjE5OX0.UVVYBPdRtVGbsL0ygPW1davfIKxODi9nW9498x_JUB8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export { SUPABASE_URL, SUPABASE_ANON_KEY };

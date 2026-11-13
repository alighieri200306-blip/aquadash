import { createClient } from '@supabase/supabase-js';

// 🔍 DIAGNÓSTICO: Ver qué hay en las variables de entorno
console.log('🔍 Todas las variables VITE:', import.meta.env);
console.log('🔍 URL específica:', import.meta.env.VITE_SUPABASE_URL);
console.log('🔍 Key específica:', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log('🔍 URL final:', supabaseUrl);
console.log('🔍 Key final:', supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
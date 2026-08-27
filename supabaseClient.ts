import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error(
    'SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar definidos em .env. ' +
    'Nunca commitar essas chaves — use .env (git-ignorado) a partir de .env.example.'
  );
}

// Cliente com service role: usado apenas no backend, nunca exposto ao frontend.
// RLS ainda se aplica às policies "authenticated_*"; este client tem bypass
// administrativo — por isso toda escrita passa antes pela authMiddleware.
export const supabaseAdmin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

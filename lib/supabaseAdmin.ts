import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type Database = any;

let client: SupabaseClient<Database> | null = null;

export function getSupabaseAdminClient(): SupabaseClient<Database> | null {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  if (!client) {
    client = createClient<Database>(url, serviceRoleKey, {
      auth: { persistSession: false },
    });
  }

  return client;
}

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "https://fake-url.supabase.co";
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "fake-key";

// Always create a client - if env vars are missing, use fake values
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    // Server-side configuration for longer session management
    autoRefreshToken: false, // Server doesn't need auto refresh
  },
});

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://ksecnwtqykmqfidspuzt.supabase.co';

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzZWNud3RxeWttcWZpZHNwdXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NTQyMjcsImV4cCI6MjEwNjQzMDIyN30.XN70XA3HhhwPA0ObUy0uQ0bxwdsD-AtS3QVAlemZR88';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

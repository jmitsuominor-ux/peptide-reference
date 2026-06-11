import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

export const supabase = createClient(
  'https://etwmtztwtpnwesoljezfe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0d210end0cG53ZXNvbGplemZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMDUzODYsImV4cCI6MjA5Njc4MTM4Nn0.2Louz-2DK2hFYhA0z0z9g-u6lthLaDYIdjBg-CHo-qk'
);

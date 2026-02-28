import { createClient } from '@supabase/supabase-js';

// --- Configuration Complete! ---
// The URL and Key below have been automatically added from your screenshots.
// Your application is now connected to your Supabase project.

const YOUR_SUPABASE_URL = 'https://httnuoxxdhvwzcudwbxz.supabase.co';
const YOUR_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0dG51b3h4ZGh2d3pjdWR3Ynh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MTUyODQsImV4cCI6MjA3NjM5MTI4NH0.K-U7ljfr64IyWdw5nbTAfRXRBHAZlIFGziQyX6m0owI';

export const supabase = createClient(YOUR_SUPABASE_URL, YOUR_SUPABASE_ANON_KEY);

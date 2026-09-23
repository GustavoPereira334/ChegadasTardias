const SUPABASE_URL = 'https://efstmedxszwwlshafafh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmc3RtZWR4c3p3d2xzaGFmYWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxMjYwNzAsImV4cCI6MjA5ODcwMjA3MH0.hvJ0bnHoE8rvXHh8QMliCm4rSFgQW0AJbeg4zg6MsdU';

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);
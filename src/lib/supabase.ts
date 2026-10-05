import { createClient } from '@supabase/supabase-js';

const HARDCODED_URL = 'https://cdeclphtlmclegnmaukl.supabase.co';
const HARDCODED_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkZWNscGh0bG1jbGVnbm1hdWtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2MDA3NzIsImV4cCI6MjEwNjE3Njc3Mn0.SmlwaKVMmddF_dbmBFmqk5rYFCuPwcAvhFs4nD-DPzQ';

function getSupabaseCredentials() {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const validUrl =
    envUrl && envUrl.startsWith('http') ? envUrl.trim() : HARDCODED_URL;
  const validKey =
    envKey && envKey.length > 20 ? envKey.trim() : HARDCODED_KEY;

  return { url: validUrl, key: validKey };
}

const { url, key } = getSupabaseCredentials();

export const supabase = createClient(url, key);
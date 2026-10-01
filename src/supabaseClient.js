import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bzhqwcensgjohapmlmjn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6aHF3Y2Vuc2dqb2hhcG1sbWpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NjQ0NzIsImV4cCI6MjEwNjQ0MDQ3Mn0.bM5Nv05YOWL2IMZ15mjVT2rrJEaBIm_OOREjS5SKTKY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
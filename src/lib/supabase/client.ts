import { createClient } from '@supabase/supabase-js';
import { Database } from '../../types/supabase';

const supabaseUrl = 'https://keyzjvovszrkxoqoxazo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtleXpqdm92c3pya3hvcW94YXpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYxMzkzMjQsImV4cCI6MjA1MTcxNTMyNH0.Ja52p0mUAlOIQl4P0KX_TR6FgcYkvuuZv2VSJQJ_5WQ';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
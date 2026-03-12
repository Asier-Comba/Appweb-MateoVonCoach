import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zymzmrihsgfdixrekhim.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5bXptcmloc2dmZGl4cmVraGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyODE2MzEsImV4cCI6MjA4Mjg1NzYzMX0.gm2Sosrn9RCKEpG9qH3DhhVVDpFAhr6k_u7RBVOOK54';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};

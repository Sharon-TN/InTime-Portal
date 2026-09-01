import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://esztnxvopcbwzzmzfoiv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_u9K0wJDfU9NnZ_zCh8qg7g_iqS2btO-';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

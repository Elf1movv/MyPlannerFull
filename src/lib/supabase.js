import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mahvuymxoddkiquhcngx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_MbWRZ_V-R8BSEa_4GECblg_g7jdegC8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

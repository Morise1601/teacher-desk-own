
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    const { data, error } = await supabase.from('teachers').select('*').limit(1);
    console.log('--- Teacher Record Sample ---');
    console.log(JSON.stringify(data?.[0], null, 2));
    console.log('Error:', error);
}

checkColumns();

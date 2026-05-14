const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://qjobrkzefvheypzlwpex.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_UYSfhDQhHcXM4IQt5t_H2Q_b4yXsEeV';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
    console.log("Starting...");
    try {
        const { data, error } = await supabase.from('events').select('*');
        console.log("Data:", data);
        console.log("Error:", error);
    } catch (e) {
        console.log("Caught:", e.message);
    }
}
run();

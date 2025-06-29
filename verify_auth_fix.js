
const { createClient } = require('@supabase/supabase-js');

// Read from environment or paste values directly for testing
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'PASTE_URL_HERE';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'PASTE_KEY_HERE';

console.log('Testing with:');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey.substring(0, 20) + '...');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
  try {
    // Test basic connection
    const { data, error } = await supabase.auth.getSession();
    console.log('Auth test:', data ? 'Success' : 'No session');
    
    // Test table access
    const { data: tableData, error: tableError } = await supabase
      .from('requirement_decks')
      .select('count(*)')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Table access failed:', tableError.message);
      console.log('💡 This might be an RLS policy issue');
    } else {
      console.log('✅ Table access successful!');
    }
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  }
}

testAuth();

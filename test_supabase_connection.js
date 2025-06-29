
// Test Supabase connection directly
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://epcxoxtxldrjamjtnfvs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwY3hveHR4bGRyamFtanRuZnZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMDc2NTcsImV4cCI6MjA2Njc4MzY1N30.4IPBqxvaLCDJFr6nRC5vFkZHwYTVshHCgFXL305haX0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    const { data, error } = await supabase
      .from('requirement_decks')
      .select('count(*)')
      .limit(1);
    
    if (error) {
      console.error('❌ Database query failed:', error);
    } else {
      console.log('✅ Database connection successful!');
      console.log('Data:', data);
    }
  } catch (err) {
    console.error('❌ Connection test failed:', err);
  }
}

testConnection();

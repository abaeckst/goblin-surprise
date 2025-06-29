import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Real-time subscription setup
export const subscribeToChanges = (
  table: string,
  callback: (payload: any) => void
) => {
  return supabase
    .channel('db-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: table,
      },
      callback
    )
    .subscribe();
};

// Helper functions for common database operations
export class DatabaseService {
  
  // Gathered cards operations
  static async insertGatheredCards(cards: Database['public']['Tables']['gathered_cards']['Insert'][]) {
    const { data, error } = await supabase
      .from('gathered_cards')
      .insert(cards);
    
    if (error) {
      console.error('Error inserting gathered cards:', error);
      throw error;
    }
    
    return data;
  }

  static async getGatheredCards() {
    const { data, error } = await supabase
      .from('gathered_cards')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching gathered cards:', error);
      throw error;
    }
    
    return data || [];
  }

  // Requirement cards operations
  static async getRequirementCards() {
    const { data, error } = await supabase
      .from('requirement_cards')
      .select('*')
      .order('card_name');
    
    if (error) {
      console.error('Error fetching requirement cards:', error);
      throw error;
    }
    
    return data || [];
  }

  static async insertRequirementDeck(deck: Database['public']['Tables']['requirement_decks']['Insert']) {
    console.log('🎯 Attempting to insert requirement deck:', deck);
    
    const { data, error } = await supabase
      .from('requirement_decks')
      .insert(deck)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error inserting requirement deck:', error);
      console.error('   Error details:', JSON.stringify(error, null, 2));
      console.error('   Data being inserted:', JSON.stringify(deck, null, 2));
      throw new Error(`Database error: ${error.message || 'Unknown error'}`);
    }
    
    console.log('✅ Successfully inserted requirement deck:', data);
    return data;
  }

  static async insertRequirementCards(cards: Database['public']['Tables']['requirement_cards']['Insert'][]) {
    const { data, error } = await supabase
      .from('requirement_cards')
      .insert(cards);
    
    if (error) {
      console.error('Error inserting requirement cards:', error);
      throw error;
    }
    
    return data;
  }

  // Get all deck uploads for tracking - Fixed to use distinct instead of group
  static async getDeckUploads() {
    const { data, error } = await supabase
      .from('gathered_cards')
      .select('deck_filename, contributor_name, created_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching deck uploads:', error);
      throw error;
    }
    
    // Client-side deduplication since we can't use SQL GROUP BY easily
    const uniqueUploads = new Map();
    data?.forEach(upload => {
      const key = `${upload.deck_filename}_${upload.contributor_name}`;
      if (!uniqueUploads.has(key)) {
        uniqueUploads.set(key, upload);
      }
    });
    
    return Array.from(uniqueUploads.values());
  }

  // Utility function to test connection
    // Utility function to test connection with detailed debugging
  static async testConnection() {
    console.log('🔍 Starting connection test...');
    
    // First check if environment variables are loaded
    const url = process.env.REACT_APP_SUPABASE_URL;
    const key = process.env.REACT_APP_SUPABASE_ANON_KEY;
    
    console.log('Environment check:');
    console.log('  URL:', url ? 'Loaded' : 'MISSING');
    console.log('  Key:', key ? 'Loaded' : 'MISSING');
    
    if (!url || !key) {
      console.error('❌ Environment variables not loaded');
      return false;
    }
    
    try {
      console.log('🌐 Testing simple select...');
      
      // Try a simpler query first
      const { data, error } = await supabase
        .from('gathered_cards')
        .select('id')
        .limit(1);
      
      if (error) {
        console.error('❌ Supabase query error:', error);
        console.error('   Error details:', JSON.stringify(error, null, 2));
        return false;
      }
      
      console.log('✅ Simple query successful');
      console.log('   Data:', data);
      
      // Now try the count query
      console.log('🔢 Testing count query...');
      const { count, error: countError } = await supabase
        .from('gathered_cards')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error('❌ Count query error:', countError);
        // Don't fail if count doesn't work, simple select worked
        console.log('✅ Connection working despite count issue');
        return true;
      }
      
      console.log('✅ Count query successful, count:', count);
      console.log('✅ Supabase connection fully successful');
      return true;
      
    } catch (error) {
      console.error('❌ Connection test exception:', error);
      console.error('   Error type:', typeof error);
      
      // Properly handle unknown error type
      if (error instanceof Error) {
        console.error('   Error message:', error.message);
      } else {
        console.error('   Error message:', String(error));
      }
      
      try {
        console.error('   Full error:', JSON.stringify(error, null, 2));
      } catch {
        console.error('   Full error: [Unable to stringify]');
      }
      
      return false;
    }
  }

  // Clear all data (for testing)
  static async clearAllData() {
    try {
      await supabase.from('gathered_cards').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('requirement_cards').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('requirement_decks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      console.log('✅ All test data cleared');
      return true;
    } catch (error) {
      console.error('❌ Failed to clear data:', error);
      return false;
    }
  }
}
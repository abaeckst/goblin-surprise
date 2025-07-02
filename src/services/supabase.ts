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
  // Test mode flag - when true, database writes are logged but not executed
  static testMode = false;
  
  // Enable/disable test mode
  static setTestMode(enabled: boolean) {
    this.testMode = enabled;
    console.log(`🧪 Test mode ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }

  // Helper function to list all requirement decks
  static async listAllRequirementDecks() {
    console.log('📋 Fetching all requirement decks...');
    
    const { data, error } = await supabase
      .from('requirement_decks')
      .select('id, deck_name, uploaded_by, created_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching requirement decks:', error);
      throw error;
    }
    
    console.table(data);
    return data;
  }

  // Cleanup function to delete specific requirements (for development use)
  static async deleteRequirementsByDeckName(deckName: string) {
    console.log(`🗑️ Attempting to delete requirements for deck: ${deckName}`);
    
    // First, get the deck ID
    const { data: deck, error: deckError } = await supabase
      .from('requirement_decks')
      .select('id, deck_name')
      .ilike('deck_name', `%${deckName}%`)
      .single();
    
    if (deckError || !deck) {
      console.error('Deck not found:', deckError);
      console.log('💡 Try running: DatabaseService.listAllRequirementDecks() to see all decks');
      throw new Error(`Deck "${deckName}" not found`);
    }
    
    console.log(`📋 Found deck: "${deck.deck_name}" with ID: ${deck.id}`);
    
    // Delete requirement cards first (foreign key constraint)
    const { error: cardsError } = await supabase
      .from('requirement_cards')
      .delete()
      .eq('deck_id', deck.id);
    
    if (cardsError) {
      console.error('Error deleting requirement cards:', cardsError);
      throw cardsError;
    }
    
    // Then delete the deck
    const { error: deckDeleteError } = await supabase
      .from('requirement_decks')
      .delete()
      .eq('id', deck.id);
    
    if (deckDeleteError) {
      console.error('Error deleting requirement deck:', deckDeleteError);
      throw deckDeleteError;
    }
    
    console.log(`✅ Successfully deleted requirements for "${deck.deck_name}"`);
    return deck.id;
  }
  
  // Gathered cards operations
  static async insertGatheredCards(cards: Database['public']['Tables']['gathered_cards']['Insert'][]) {
    if (this.testMode) {
      console.log('\n=== TEST MODE ACTIVE ===');
      console.log('Would insert gathered cards:');
      console.table(cards.map(card => ({
        card_name: card.card_name,
        quantity: card.quantity,
        contributor: card.contributor_name,
        deck: card.deck_filename
      })));
      console.log(`Total cards to insert: ${cards.length}`);
      console.log(`Total quantity: ${cards.reduce((sum, card) => sum + (card.quantity || 0), 0)}`);
      console.log('=== END TEST MODE ===\n');
      return null; // Return null in test mode
    }

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
    if (this.testMode) {
      console.log('\n=== TEST MODE ACTIVE ===');
      console.log('Would insert requirement deck:');
      console.table({
        deck_name: deck.deck_name,
        uploaded_by: deck.uploaded_by
      });
      console.log('=== END TEST MODE ===\n');
      // Return a mock deck with a fake ID for testing
      return { id: 'test-deck-id', ...deck } as any;
    }

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
    if (this.testMode) {
      console.log('\n=== TEST MODE ACTIVE ===');
      console.log('Would insert requirement cards:');
      console.table(cards.map(card => ({
        card_name: card.card_name,
        quantity: card.quantity,
        deck_id: card.deck_id
      })));
      console.log(`Total requirement cards: ${cards.length}`);
      console.log('=== END TEST MODE ===\n');
      return null;
    }

    const { data, error } = await supabase
      .from('requirement_cards')
      .insert(cards);
    
    if (error) {
      console.error('Error inserting requirement cards:', error);
      throw error;
    }
    
    return data;
  }

  static async getRequirementDecks() {
    const { data, error } = await supabase
      .from('requirement_decks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching requirement decks:', error);
      throw error;
    }
    
    return data || [];
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
      await supabase.from('monetary_donations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      console.log('✅ All test data cleared');
      return true;
    } catch (error) {
      console.error('❌ Failed to clear data:', error);
      return false;
    }
  }

  // Monetary donation operations
  static async addMonetaryDonation(donation: {
    contributor_name: string;
    amount: number;
    donation_type: 'tix' | 'usd';
    notes?: string;
  }) {
    if (this.testMode) {
      console.log('🧪 TEST MODE: Would add monetary donation:', donation);
      return { data: { id: 'test-id', ...donation, created_at: new Date().toISOString() }, error: null };
    }

    const { data, error } = await supabase
      .from('monetary_donations')
      .insert([donation])
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to add monetary donation:', error);
      throw error;
    }

    console.log('✅ Monetary donation added successfully:', data);
    return { data, error };
  }

  static async getMonetaryDonations() {
    const { data, error } = await supabase
      .from('monetary_donations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Failed to fetch monetary donations:', error);
      throw error;
    }

    return data || [];
  }

  static async getTotalMonetaryDonations(): Promise<number> {
    const { data, error } = await supabase
      .from('monetary_donations')
      .select('amount');

    if (error) {
      console.error('❌ Failed to fetch monetary donations for total:', error);
      return 0;
    }

    return (data || []).reduce((total, donation) => total + Number(donation.amount), 0);
  }

  static subscribeToMonetaryDonations(callback: () => void) {
    return supabase
      .channel('monetary-donations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'monetary_donations',
        },
        callback
      )
      .subscribe();
  }

  // Debug: List all monetary donations
  static async listAllMonetaryDonations() {
    console.log('💰 Fetching all monetary donations...');
    
    const { data, error } = await supabase
      .from('monetary_donations')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching monetary donations:', error);
      throw error;
    }
    
    console.table(data);
    return data || [];
  }

  // Debug: Delete monetary donation by ID
  static async deleteMonetaryDonation(id: string) {
    console.log(`🗑️ Attempting to delete monetary donation with ID: ${id}`);
    
    // First check if the donation exists
    const { data: existing, error: checkError } = await supabase
      .from('monetary_donations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (checkError || !existing) {
      console.error('❌ Donation not found or error checking:', checkError);
      return false;
    }
    
    console.log('📋 Found donation to delete:', existing);
    
    // Try multiple approaches to delete
    console.log('🔧 Attempting delete with match on multiple fields...');
    
    const { data, error, count } = await supabase
      .from('monetary_donations')
      .delete()
      .match({
        id: id,
        contributor_name: existing.contributor_name,
        amount: existing.amount
      })
      .select();
    
    if (error) {
      console.error('❌ Error deleting monetary donation:', error);
      console.error('Error details:', error.message, error.details, error.hint);
      
      // Try a simpler delete without select
      console.log('🔧 Trying simple delete without select...');
      const { error: simpleError } = await supabase
        .from('monetary_donations')
        .delete()
        .eq('id', id);
      
      if (simpleError) {
        console.error('❌ Simple delete also failed:', simpleError);
        throw simpleError;
      }
    }
    
    console.log('🗑️ Delete response:', { data, count });
    
    // Verify deletion
    const { data: checkDeleted, error: verifyError } = await supabase
      .from('monetary_donations')
      .select('*')
      .eq('id', id);
    
    if (verifyError) {
      console.error('❌ Error verifying deletion:', verifyError);
    } else if (checkDeleted && checkDeleted.length === 0) {
      console.log('✅ Successfully verified deletion of monetary donation');
      return true;
    } else {
      console.error('❌ Donation still exists after delete attempt!');
      console.log('Remaining record:', checkDeleted);
      return false;
    }
    
    return true;
  }

  // Alternative: Update a monetary donation amount (in case deletion is restricted)
  static async updateMonetaryDonation(id: string, newAmount: number) {
    console.log(`📝 Attempting to update donation ${id} to amount: ${newAmount}`);
    
    const { data, error } = await supabase
      .from('monetary_donations')
      .update({ amount: newAmount })
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('❌ Error updating monetary donation:', error);
      throw error;
    }
    
    console.log('✅ Successfully updated donation:', data);
    return data;
  }
}
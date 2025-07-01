// Node.js script to analyze duplicate contributions
// Run with: node scripts/analyzeDuplicates.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeDuplicates() {
  try {
    console.log('🔍 Fetching all gathered cards...\n');

    // Fetch all gathered cards
    const { data: gatheredCards, error } = await supabase
      .from('gathered_cards')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching gathered cards:', error);
      return;
    }

    if (!gatheredCards || gatheredCards.length === 0) {
      console.log('No gathered cards found in the database.');
      return;
    }

    console.log(`Found ${gatheredCards.length} total gathered cards\n`);

    // Group by contributor_name and card_name
    const groupedCards = new Map();

    gatheredCards.forEach((card) => {
      const key = `${card.contributor_name}::${card.card_name}`;
      
      if (!groupedCards.has(key)) {
        groupedCards.set(key, {
          contributor_name: card.contributor_name,
          card_name: card.card_name,
          total_quantity: 0,
          upload_count: 0,
          entries: []
        });
      }

      const group = groupedCards.get(key);
      group.total_quantity += card.quantity;
      group.upload_count += 1;
      group.entries.push({
        id: card.id,
        quantity: card.quantity,
        deck_filename: card.deck_filename,
        created_at: card.created_at
      });
    });

    // Filter to only show duplicates (where upload_count > 1)
    const duplicates = Array.from(groupedCards.values())
      .filter(group => group.upload_count > 1)
      .sort((a, b) => b.upload_count - a.upload_count);

    if (duplicates.length === 0) {
      console.log('✅ No duplicate contributions found!');
      return;
    }

    // Display duplicate analysis
    console.log(`⚠️  Found ${duplicates.length} duplicate contribution sets:\n`);

    duplicates.forEach((dup, index) => {
      console.log(`${index + 1}. ${dup.contributor_name} - ${dup.card_name}`);
      console.log(`   Total uploads: ${dup.upload_count}`);
      console.log(`   Total quantity: ${dup.total_quantity}`);
      console.log('   Entries:');
      
      dup.entries.forEach((entry, i) => {
        const date = new Date(entry.created_at).toLocaleString();
        console.log(`     ${i + 1}. Qty: ${entry.quantity} | Deck: ${entry.deck_filename}`);
        console.log(`        Date: ${date}`);
        console.log(`        ID: ${entry.id}`);
      });
      
      console.log('');
    });

    // Summary statistics
    console.log('📊 Summary Statistics:');
    console.log(`   Total gathered cards: ${gatheredCards.length}`);
    console.log(`   Unique contributor-card combinations: ${groupedCards.size}`);
    console.log(`   Duplicate sets found: ${duplicates.length}`);
    
    const totalDuplicateEntries = duplicates.reduce((sum, dup) => sum + (dup.upload_count - 1), 0);
    console.log(`   Total duplicate entries: ${totalDuplicateEntries}`);

    // Check for exact duplicates (same contributor, card, quantity, and deck)
    console.log('\n🔍 Checking for exact duplicates (same contributor, card, quantity, and deck)...\n');
    
    const exactDuplicates = new Map();
    
    gatheredCards.forEach((card) => {
      const key = `${card.contributor_name}::${card.card_name}::${card.quantity}::${card.deck_filename}`;
      if (!exactDuplicates.has(key)) {
        exactDuplicates.set(key, []);
      }
      exactDuplicates.get(key).push(card);
    });

    const exactDups = Array.from(exactDuplicates.entries())
      .filter(([_, cards]) => cards.length > 1)
      .sort((a, b) => b[1].length - a[1].length);

    if (exactDups.length > 0) {
      console.log(`⚠️  Found ${exactDups.length} sets of exact duplicates:\n`);
      
      exactDups.forEach(([key, cards], index) => {
        const [contributor, cardName, quantity, deck] = key.split('::');
        console.log(`${index + 1}. ${contributor} - ${cardName} (Qty: ${quantity}) from ${deck}`);
        console.log(`   Duplicate count: ${cards.length}`);
        console.log('   Entries:');
        
        cards.forEach((card, i) => {
          const date = new Date(card.created_at).toLocaleString();
          console.log(`     ${i + 1}. Date: ${date} | ID: ${card.id}`);
        });
        
        console.log('');
      });
    } else {
      console.log('✅ No exact duplicates found!');
    }

    // Check for recent duplicates (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const recentDuplicates = duplicates.filter(dup => 
      dup.entries.some(entry => new Date(entry.created_at) > oneDayAgo)
    );

    if (recentDuplicates.length > 0) {
      console.log(`\n🕐 Recent duplicates (last 24 hours): ${recentDuplicates.length}`);
      recentDuplicates.forEach((dup, index) => {
        console.log(`   ${index + 1}. ${dup.contributor_name} - ${dup.card_name} (${dup.upload_count} uploads)`);
      });
    }

  } catch (error) {
    console.error('Error analyzing duplicates:', error);
  }
}

// Run the analysis
console.log('Duplicate Contribution Analyzer\n');
console.log('================================\n');

analyzeDuplicates().then(() => {
  console.log('\nAnalysis complete!');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
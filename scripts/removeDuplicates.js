// Node.js script to remove duplicate contributions
// Run with: node scripts/removeDuplicates.js --dry-run
// Run with: node scripts/removeDuplicates.js --execute (to actually delete)

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Check command line arguments
const args = process.argv.slice(2);
const isDryRun = !args.includes('--execute');

async function removeDuplicates() {
  try {
    console.log(`\n🧹 ${isDryRun ? '[DRY RUN] ' : ''}Removing duplicate entries...\n`);

    // Fetch all gathered cards
    const { data: gatheredCards, error } = await supabase
      .from('gathered_cards')
      .select('*')
      .order('created_at', { ascending: true }); // Keep oldest

    if (error) {
      console.error('Error fetching gathered cards:', error);
      return;
    }

    if (!gatheredCards || gatheredCards.length === 0) {
      console.log('No gathered cards found in the database.');
      return;
    }

    // Find exact duplicates
    const seen = new Map();
    const toDelete = [];

    gatheredCards.forEach((card) => {
      const key = `${card.contributor_name}::${card.card_name}::${card.quantity}::${card.deck_filename}`;
      
      if (seen.has(key)) {
        // This is a duplicate, mark for deletion
        toDelete.push({
          id: card.id,
          card: card,
          original: seen.get(key)
        });
      } else {
        seen.set(key, card);
      }
    });

    if (toDelete.length === 0) {
      console.log('✅ No duplicates to remove!');
      return;
    }

    console.log(`📊 Found ${toDelete.length} duplicate entries to remove:\n`);

    // Show details of what will be deleted
    toDelete.forEach((item, index) => {
      console.log(`${index + 1}. ${item.card.contributor_name} - ${item.card.card_name} (Qty: ${item.card.quantity})`);
      console.log(`   From deck: ${item.card.deck_filename}`);
      console.log(`   Keeping: ${new Date(item.original.created_at).toLocaleString()} (ID: ${item.original.id})`);
      console.log(`   Deleting: ${new Date(item.card.created_at).toLocaleString()} (ID: ${item.card.id})`);
      console.log('');
    });

    if (!isDryRun) {
      console.log('🗑️  Deleting duplicates...\n');
      
      // Delete in batches of 10
      const batchSize = 10;
      let deletedCount = 0;
      
      for (let i = 0; i < toDelete.length; i += batchSize) {
        const batch = toDelete.slice(i, i + batchSize);
        const idsToDelete = batch.map(item => item.id);
        
        const { error: deleteError } = await supabase
          .from('gathered_cards')
          .delete()
          .in('id', idsToDelete);

        if (deleteError) {
          console.error(`Error deleting batch ${Math.floor(i / batchSize) + 1}:`, deleteError);
        } else {
          deletedCount += batch.length;
          console.log(`✅ Deleted batch ${Math.floor(i / batchSize) + 1} (${batch.length} entries)`);
        }
      }

      console.log(`\n✅ Successfully removed ${deletedCount} duplicate entries!`);
    } else {
      console.log('\n💡 This was a dry run. To actually delete duplicates, run:');
      console.log('   node scripts/removeDuplicates.js --execute');
    }

  } catch (error) {
    console.error('Error removing duplicates:', error);
  }
}

// Run the removal
console.log('Duplicate Removal Tool\n');
console.log('======================\n');

if (isDryRun) {
  console.log('🔍 Running in DRY RUN mode - no data will be deleted\n');
} else {
  console.log('⚠️  Running in EXECUTE mode - duplicates will be permanently deleted!\n');
}

removeDuplicates().then(() => {
  console.log('\nOperation complete!');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
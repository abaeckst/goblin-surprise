import React, { useState } from 'react';
import { supabase } from '../../services/supabase';
import ScryfallApiService from '../../services/scryfallApi';

interface MissingMetadataCard {
  card_name: string;
  in_requirements: boolean;
  in_gathered: boolean;
}

export const MetadataFixer: React.FC = () => {
  const [missingCards, setMissingCards] = useState<MissingMetadataCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [processingLog, setProcessingLog] = useState<string[]>([]);

  const fetchMissingMetadata = async () => {
    setLoading(true);
    try {
      // Get all cards from requirements and gathered
      const { data: reqCards } = await supabase
        .from('requirement_cards')
        .select('card_name');
      
      const { data: gathCards } = await supabase
        .from('gathered_cards')
        .select('card_name');

      // Get existing metadata
      const { data: existingMeta } = await supabase
        .from('card_metadata')
        .select('card_name');

      const reqSet = new Set(reqCards?.map(c => c.card_name) || []);
      const gathSet = new Set(gathCards?.map(c => c.card_name) || []);
      const metaSet = new Set(existingMeta?.map(m => m.card_name) || []);

      // Find cards without metadata
      const missing: MissingMetadataCard[] = [];
      const allCards = new Set<string>();
      reqSet.forEach(name => allCards.add(name));
      gathSet.forEach(name => allCards.add(name));

      allCards.forEach(cardName => {
        if (!metaSet.has(cardName)) {
          missing.push({
            card_name: cardName,
            in_requirements: reqSet.has(cardName),
            in_gathered: gathSet.has(cardName)
          });
        }
      });

      missing.sort((a, b) => a.card_name.localeCompare(b.card_name));
      setMissingCards(missing);
    } catch (error) {
      console.error('Error fetching missing metadata:', error);
    } finally {
      setLoading(false);
    }
  };

  const addLog = (message: string) => {
    setProcessingLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const processSelectedCards = async () => {
    if (selectedCards.size === 0) {
      alert('Please select some cards to process');
      return;
    }

    setProcessing(true);
    setProcessingLog([]);
    const cardNames = Array.from(selectedCards);
    let successCount = 0;
    let errorCount = 0;

    try {
      addLog(`Starting to process ${cardNames.length} cards...`);

      for (const cardName of cardNames) {
        try {
          addLog(`Processing: ${cardName}`);
          
          // Try to fetch card data from Scryfall
          const cardData = await ScryfallApiService.fetchCardData(cardName);
          
          if (cardData) {
            // Insert metadata
            const { error } = await supabase
              .from('card_metadata')
              .upsert({
                card_name: cardName,
                set_code: cardData.set,
                mana_cost: cardData.mana_cost || '',
                type_line: cardData.type_line || '',
                rarity: cardData.rarity || '',
                colors: cardData.colors || [],
                price_tix: cardData.prices?.tix ? parseFloat(cardData.prices.tix) : null,
                last_price_update: new Date().toISOString()
              }, {
                onConflict: 'card_name,set_code'
              });

            if (error) {
              addLog(`❌ Database error for ${cardName}: ${error.message}`);
              errorCount++;
            } else {
              const priceInfo = cardData.prices?.tix ? `${cardData.prices.tix} tix` : 'no price';
              addLog(`✅ Successfully processed ${cardName} (${priceInfo})`);
              successCount++;
            }
          } else {
            addLog(`⚠️ ${cardName} not found in Scryfall`);
            
            // Still create a metadata entry so we don't keep trying
            const { error } = await supabase
              .from('card_metadata')
              .upsert({
                card_name: cardName,
                set_code: '',
                mana_cost: '',
                type_line: '',
                rarity: '',
                colors: [],
                price_tix: null,
                last_price_update: new Date().toISOString()
              }, {
                onConflict: 'card_name,set_code'
              });

            if (error) {
              addLog(`❌ Database error for ${cardName}: ${error.message}`);
              errorCount++;
            } else {
              addLog(`⚠️ Created empty metadata for ${cardName}`);
              successCount++;
            }
          }

          // Small delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 110));
          
        } catch (error) {
          addLog(`❌ Error processing ${cardName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          errorCount++;
        }
      }

      addLog(`\n🎉 Processing complete! Success: ${successCount}, Errors: ${errorCount}`);
      
      // Refresh the list
      await fetchMissingMetadata();
      setSelectedCards(new Set());
      
    } finally {
      setProcessing(false);
    }
  };

  const toggleCardSelection = (cardName: string) => {
    const newSelected = new Set(selectedCards);
    if (newSelected.has(cardName)) {
      newSelected.delete(cardName);
    } else {
      newSelected.add(cardName);
    }
    setSelectedCards(newSelected);
  };

  const selectAll = () => {
    setSelectedCards(new Set(missingCards.map(c => c.card_name)));
  };

  const deselectAll = () => {
    setSelectedCards(new Set());
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">Metadata Fixer ({missingCards.length})</h2>
      
      <div className="mb-4 flex gap-2">
        <button
          onClick={fetchMissingMetadata}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
        >
          {loading ? 'Loading...' : 'Refresh Missing Cards'}
        </button>
        <button
          onClick={selectAll}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Select All
        </button>
        <button
          onClick={deselectAll}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Deselect All
        </button>
        <button
          onClick={processSelectedCards}
          disabled={processing || selectedCards.size === 0}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
        >
          {processing ? 'Processing...' : `Process ${selectedCards.size} Selected`}
        </button>
      </div>

      {missingCards.length === 0 && !loading ? (
        <p className="text-green-600">All cards have metadata! 🎉</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card List */}
          <div>
            <h3 className="font-bold mb-2">Cards Missing Metadata</h3>
            <div className="max-h-96 overflow-y-auto border rounded">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-2 py-1 text-left">Select</th>
                    <th className="px-2 py-1 text-left">Card Name</th>
                    <th className="px-2 py-1 text-center">Req</th>
                    <th className="px-2 py-1 text-center">Gath</th>
                  </tr>
                </thead>
                <tbody>
                  {missingCards.map((card, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="px-2 py-1">
                        <input
                          type="checkbox"
                          checked={selectedCards.has(card.card_name)}
                          onChange={() => toggleCardSelection(card.card_name)}
                        />
                      </td>
                      <td className="px-2 py-1 font-medium">{card.card_name}</td>
                      <td className="px-2 py-1 text-center">
                        {card.in_requirements ? '✓' : '-'}
                      </td>
                      <td className="px-2 py-1 text-center">
                        {card.in_gathered ? '✓' : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Processing Log */}
          <div>
            <h3 className="font-bold mb-2">Processing Log</h3>
            <div className="max-h-96 overflow-y-auto bg-gray-100 p-4 rounded font-mono text-sm">
              {processingLog.length === 0 ? (
                <p className="text-gray-500">No processing activity yet...</p>
              ) : (
                processingLog.map((log, index) => (
                  <div key={index} className="mb-1">{log}</div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
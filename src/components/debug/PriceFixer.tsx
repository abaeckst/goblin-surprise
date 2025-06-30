import React, { useState } from 'react';
import { supabase } from '../../services/supabase';
import ScryfallApiService from '../../services/scryfallApi';

interface CardWithoutPrice {
  card_name: string;
  set_code: string;
  last_price_update: string;
}

export const PriceFixer: React.FC = () => {
  const [cardsWithoutPrices, setCardsWithoutPrices] = useState<CardWithoutPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [processingLog, setProcessingLog] = useState<string[]>([]);

  const fetchCardsWithoutPrices = async () => {
    setLoading(true);
    try {
      // Get all cards from requirements and gathered to filter relevant cards
      const { data: reqCards } = await supabase
        .from('requirement_cards')
        .select('card_name');
      
      const { data: gathCards } = await supabase
        .from('gathered_cards')
        .select('card_name');

      const relevantCards = new Set<string>();
      reqCards?.forEach(card => relevantCards.add(card.card_name));
      gathCards?.forEach(card => relevantCards.add(card.card_name));

      // Get cards with metadata but no prices
      const { data: metadataCards, error } = await supabase
        .from('card_metadata')
        .select('card_name, set_code, last_price_update')
        .is('price_tix', null)
        .order('card_name');

      if (error) throw error;

      // Filter to only cards in our collection
      const filteredCards = (metadataCards || []).filter(card => 
        relevantCards.has(card.card_name)
      );

      setCardsWithoutPrices(filteredCards);
    } catch (error) {
      console.error('Error fetching cards without prices:', error);
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
    const selectedCardDetails = cardsWithoutPrices.filter(card => 
      selectedCards.has(card.card_name)
    );
    let successCount = 0;
    let errorCount = 0;

    try {
      addLog(`Starting to process ${selectedCardDetails.length} cards...`);

      for (const card of selectedCardDetails) {
        try {
          addLog(`Processing: ${card.card_name} (set: ${card.set_code})`);
          
          // Enhanced fallback strategy to find MTGO prices
          let cardData = null;
          let searchMethod = '';
          
          // Approach 1: Try with the stored set code (uppercase)
          const upperSetCode = card.set_code.toUpperCase();
          addLog(`  🔍 Approach 1: Trying exact set match (${upperSetCode})`);
          cardData = await ScryfallApiService.fetchCardData(card.card_name, upperSetCode);
          
          // Check if we found a card with MTGO price
          const hasValidPrice = cardData?.prices?.tix && cardData.prices.tix !== '0.00' && !isNaN(parseFloat(cardData.prices.tix));
          
          if (cardData && hasValidPrice) {
            searchMethod = `exact set ${upperSetCode}`;
            addLog(`  ✅ Found MTGO price from exact set match`);
          } else {
            // Approach 2: Search all printings for best MTGO price
            addLog(`  🔍 Approach 2: Searching all printings for MTGO price...`);
            const robustCardData = await ScryfallApiService.findBestMtgoPrintingForCard(card.card_name);
            
            const robustHasValidPrice = robustCardData?.prices?.tix && robustCardData.prices.tix !== '0.00' && !isNaN(parseFloat(robustCardData.prices.tix));
            
            if (robustCardData && robustHasValidPrice) {
              cardData = robustCardData;
              searchMethod = `all printings (found in ${robustCardData.set.toUpperCase()})`;
              addLog(`  ✅ Found MTGO price from ${robustCardData.set.toUpperCase()} printing`);
            } else if (robustCardData) {
              cardData = robustCardData;
              searchMethod = `all printings (no MTGO price found)`;
              addLog(`  ⚠️ Found card metadata but no MTGO price across all printings`);
            } else {
              // Approach 3: Try without set code as final fallback
              addLog(`  🔍 Approach 3: Trying without set restriction...`);
              cardData = await ScryfallApiService.fetchCardData(card.card_name);
              if (cardData) {
                searchMethod = `no set restriction`;
                addLog(`  ⚠️ Found card without set restriction, but likely no MTGO price`);
              }
            }
          }
          
          if (cardData) {
            // Update the metadata with price info and potentially corrected set
            const priceValue = cardData.prices?.tix ? parseFloat(cardData.prices.tix) : null;
            const newSetCode = cardData.set.toUpperCase();
            const setChanged = newSetCode !== card.set_code.toUpperCase();
            
            const { error } = await supabase
              .from('card_metadata')
              .update({
                price_tix: priceValue,
                last_price_update: new Date().toISOString(),
                set_code: newSetCode, // Update to the set where we found the price
                mana_cost: cardData.mana_cost || '',
                type_line: cardData.type_line || '',
                rarity: cardData.rarity || '',
                colors: cardData.colors || []
              })
              .eq('card_name', card.card_name)
              .eq('set_code', card.set_code);

            if (error) {
              addLog(`  ❌ Database error: ${error.message}`);
              errorCount++;
            } else {
              const priceInfo = priceValue ? `${priceValue} tix` : 'no MTGO price';
              const methodInfo = searchMethod ? ` via ${searchMethod}` : '';
              const setInfo = setChanged ? ` (updated set: ${card.set_code} → ${newSetCode})` : '';
              addLog(`  ✅ Updated ${card.card_name} (${priceInfo})${methodInfo}${setInfo}`);
              successCount++;
            }
          } else {
            addLog(`  ⚠️ ${card.card_name} not found in Scryfall (might not be on MTGO)`);
            
            // Update the timestamp so we don't keep trying
            const { error } = await supabase
              .from('card_metadata')
              .update({
                last_price_update: new Date().toISOString()
              })
              .eq('card_name', card.card_name)
              .eq('set_code', card.set_code);

            if (!error) {
              addLog(`  📝 Updated timestamp for ${card.card_name}`);
              successCount++;
            }
          }

          // Rate limiting delay
          await new Promise(resolve => setTimeout(resolve, 110));
          
        } catch (error) {
          addLog(`  ❌ Error processing ${card.card_name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          errorCount++;
        }
      }

      addLog(`\n🎉 Processing complete! Success: ${successCount}, Errors: ${errorCount}`);
      
      // Refresh the list
      await fetchCardsWithoutPrices();
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
    setSelectedCards(new Set(cardsWithoutPrices.map(c => c.card_name)));
  };

  const deselectAll = () => {
    setSelectedCards(new Set());
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">
        Price Fixer - Cards with Metadata but No Prices ({cardsWithoutPrices.length})
      </h2>
      
      <div className="mb-4 flex gap-2">
        <button
          onClick={fetchCardsWithoutPrices}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
        >
          {loading ? 'Loading...' : 'Refresh'}
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
          {processing ? 'Processing...' : `Fix ${selectedCards.size} Selected`}
        </button>
      </div>

      {cardsWithoutPrices.length === 0 && !loading ? (
        <p className="text-green-600">All cards with metadata have prices! 🎉</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card List */}
          <div>
            <h3 className="font-bold mb-2">Cards Without Prices</h3>
            <div className="max-h-96 overflow-y-auto border rounded">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-2 py-1 text-left">Select</th>
                    <th className="px-2 py-1 text-left">Card Name</th>
                    <th className="px-2 py-1 text-center">Set</th>
                    <th className="px-2 py-1 text-left">Last Update</th>
                  </tr>
                </thead>
                <tbody>
                  {cardsWithoutPrices.map((card, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="px-2 py-1">
                        <input
                          type="checkbox"
                          checked={selectedCards.has(card.card_name)}
                          onChange={() => toggleCardSelection(card.card_name)}
                        />
                      </td>
                      <td className="px-2 py-1 font-medium">{card.card_name}</td>
                      <td className="px-2 py-1 text-center font-mono text-xs">
                        {card.set_code}
                      </td>
                      <td className="px-2 py-1 text-xs">
                        {new Date(card.last_price_update).toLocaleString()}
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
                <p className="text-gray-500">Select cards and click "Fix Selected" to start...</p>
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
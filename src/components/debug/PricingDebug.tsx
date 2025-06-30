import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import PriceUpdateService from '../../services/priceUpdateService';

interface CardWithoutPrice {
  card_name: string;
  set_code: string | null;
  last_price_update: string | null;
}

export const PricingDebug: React.FC = () => {
  const [cardsWithoutPrices, setCardsWithoutPrices] = useState<CardWithoutPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [totalUnfilteredCount, setTotalUnfilteredCount] = useState(0);

  useEffect(() => {
    fetchCardsWithoutPrices();
  }, []);

  const fetchCardsWithoutPrices = async () => {
    setLoading(true);
    try {
      // First get all cards that are actually in our collection (requirements or gathered)
      const { data: requiredCards, error: reqError } = await supabase
        .from('requirement_cards')
        .select('card_name')
        .order('card_name');
      
      if (reqError) throw reqError;

      const { data: gatheredCards, error: gathError } = await supabase
        .from('gathered_cards')
        .select('card_name')
        .order('card_name');
      
      if (gathError) throw gathError;

      // Create a set of all cards we actually care about
      const relevantCards = new Set<string>();
      requiredCards?.forEach(card => relevantCards.add(card.card_name));
      gatheredCards?.forEach(card => relevantCards.add(card.card_name));

      // Now get metadata for cards without prices
      const { data: metadataCards, error: metaError } = await supabase
        .from('card_metadata')
        .select('card_name, set_code, last_price_update')
        .is('price_tix', null)
        .order('card_name');

      if (metaError) throw metaError;

      // Store total count before filtering
      setTotalUnfilteredCount((metadataCards || []).length);

      // Filter to only show cards that are in our collection
      const filteredCards = (metadataCards || []).filter(card => 
        relevantCards.has(card.card_name) &&
        !card.card_name.startsWith('A-') && // Filter out Arena rebalanced cards
        !card.card_name.includes('//') // Filter out split cards that might cause issues
      );

      setCardsWithoutPrices(filteredCards);
    } catch (error) {
      console.error('Error fetching cards without prices:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSelectedPrices = async () => {
    if (selectedCards.size === 0) {
      alert('Please select some cards to update');
      return;
    }

    setUpdating(true);
    const cardNames = Array.from(selectedCards);
    
    try {
      console.log('🔄 Updating prices for selected cards:', cardNames);
      const updatedCount = await PriceUpdateService.refreshCardsMetadata(cardNames);
      
      // Refresh the list
      await fetchCardsWithoutPrices();
      setSelectedCards(new Set());
      alert(`Successfully updated ${updatedCount} out of ${cardNames.length} cards`);
    } catch (error) {
      console.error('Error updating prices:', error);
      alert('Error updating prices. Check console for details.');
    } finally {
      setUpdating(false);
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

  if (loading) return <div>Loading cards without prices...</div>;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">
        Cards Without Prices in Your Collection ({cardsWithoutPrices.length})
      </h2>
      {totalUnfilteredCount > cardsWithoutPrices.length && (
        <p className="text-sm text-gray-600 mb-2">
          Filtered out {totalUnfilteredCount - cardsWithoutPrices.length} irrelevant cards (Arena rebalanced, cards not in your collection, etc.)
        </p>
      )}

      {cardsWithoutPrices.length === 0 ? (
        <p className="text-green-600">All cards have prices! 🎉</p>
      ) : (
        <>
          <div className="mb-4 flex gap-2">
            <button
              onClick={selectAll}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
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
              onClick={updateSelectedPrices}
              disabled={updating || selectedCards.size === 0}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
            >
              {updating ? 'Updating...' : `Update ${selectedCards.size} Selected`}
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Select</th>
                  <th className="px-4 py-2 text-left">Card Name</th>
                  <th className="px-4 py-2 text-left">Set Code</th>
                  <th className="px-4 py-2 text-left">Last Update Attempt</th>
                </tr>
              </thead>
              <tbody>
                {cardsWithoutPrices.map((card, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={selectedCards.has(card.card_name)}
                        onChange={() => toggleCardSelection(card.card_name)}
                      />
                    </td>
                    <td className="px-4 py-2">{card.card_name}</td>
                    <td className="px-4 py-2">{card.set_code || 'N/A'}</td>
                    <td className="px-4 py-2">
                      {card.last_price_update 
                        ? new Date(card.last_price_update).toLocaleString()
                        : 'Never'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
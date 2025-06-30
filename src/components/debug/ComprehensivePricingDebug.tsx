import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';

interface CardDebugInfo {
  card_name: string;
  in_requirements: boolean;
  in_gathered: boolean;
  in_metadata: boolean;
  has_price: boolean;
  price_tix: number | null;
  last_price_update: string | null;
  set_code: string | null;
}

export const ComprehensivePricingDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<CardDebugInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'no_price' | 'no_metadata'>('no_price');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDebugInfo();
  }, []);

  const fetchDebugInfo = async () => {
    setLoading(true);
    try {
      // Get all unique cards from requirements
      const { data: reqCards, error: reqError } = await supabase
        .from('requirement_cards')
        .select('card_name');
      
      if (reqError) throw reqError;

      // Get all unique cards from gathered
      const { data: gathCards, error: gathError } = await supabase
        .from('gathered_cards')
        .select('card_name');
      
      if (gathError) throw gathError;

      // Get all metadata
      const { data: metadata, error: metaError } = await supabase
        .from('card_metadata')
        .select('card_name, set_code, price_tix, last_price_update');
      
      if (metaError) throw metaError;

      // Create a map for quick lookup
      const reqSet = new Set(reqCards?.map(c => c.card_name) || []);
      const gathSet = new Set(gathCards?.map(c => c.card_name) || []);
      const metaMap = new Map(metadata?.map(m => [m.card_name, m]) || []);

      // Get all unique card names
      const allCardNames = new Set<string>();
      reqSet.forEach(name => allCardNames.add(name));
      gathSet.forEach(name => allCardNames.add(name));

      // Build debug info for each card
      const debugData: CardDebugInfo[] = [];
      
      allCardNames.forEach(cardName => {
        const meta = metaMap.get(cardName);
        debugData.push({
          card_name: cardName,
          in_requirements: reqSet.has(cardName),
          in_gathered: gathSet.has(cardName),
          in_metadata: !!meta,
          has_price: !!meta?.price_tix,
          price_tix: meta?.price_tix || null,
          last_price_update: meta?.last_price_update || null,
          set_code: meta?.set_code || null
        });
      });

      // Sort by name
      debugData.sort((a, b) => a.card_name.localeCompare(b.card_name));
      
      setDebugInfo(debugData);
    } catch (error) {
      console.error('Error fetching debug info:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = debugInfo.filter(card => {
    // Apply search filter
    if (searchTerm && !card.card_name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Apply type filter
    switch (filter) {
      case 'no_price':
        return !card.has_price;
      case 'no_metadata':
        return !card.in_metadata;
      case 'all':
      default:
        return true;
    }
  });

  const stats = {
    total: debugInfo.length,
    withPrice: debugInfo.filter(c => c.has_price).length,
    withoutPrice: debugInfo.filter(c => !c.has_price).length,
    withoutMetadata: debugInfo.filter(c => !c.in_metadata).length
  };

  if (loading) return <div>Loading comprehensive debug info...</div>;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">Comprehensive Pricing Debug</h2>
      
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-100 p-3 rounded">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Cards</div>
        </div>
        <div className="bg-green-100 p-3 rounded">
          <div className="text-2xl font-bold text-green-700">{stats.withPrice}</div>
          <div className="text-sm text-gray-600">With Prices</div>
        </div>
        <div className="bg-red-100 p-3 rounded">
          <div className="text-2xl font-bold text-red-700">{stats.withoutPrice}</div>
          <div className="text-sm text-gray-600">Without Prices</div>
        </div>
        <div className="bg-yellow-100 p-3 rounded">
          <div className="text-2xl font-bold text-yellow-700">{stats.withoutMetadata}</div>
          <div className="text-sm text-gray-600">No Metadata</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Search card name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-md"
        />
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value as any)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">All Cards</option>
          <option value="no_price">No Price</option>
          <option value="no_metadata">No Metadata</option>
        </select>
      </div>

      {/* Results */}
      <div className="text-sm text-gray-600 mb-2">
        Showing {filteredData.length} cards
      </div>

      <div className="max-h-96 overflow-y-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-4 py-2 text-left">Card Name</th>
              <th className="px-4 py-2 text-center">In Req</th>
              <th className="px-4 py-2 text-center">In Gath</th>
              <th className="px-4 py-2 text-center">Has Meta</th>
              <th className="px-4 py-2 text-center">Has Price</th>
              <th className="px-4 py-2 text-right">Price (tix)</th>
              <th className="px-4 py-2 text-left">Last Update</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((card, index) => (
              <tr key={index} className={`border-b hover:bg-gray-50 ${!card.has_price ? 'bg-red-50' : ''}`}>
                <td className="px-4 py-2 font-medium">{card.card_name}</td>
                <td className="px-4 py-2 text-center">
                  {card.in_requirements ? '✓' : '-'}
                </td>
                <td className="px-4 py-2 text-center">
                  {card.in_gathered ? '✓' : '-'}
                </td>
                <td className="px-4 py-2 text-center">
                  {card.in_metadata ? '✓' : <span className="text-red-600">✗</span>}
                </td>
                <td className="px-4 py-2 text-center">
                  {card.has_price ? '✓' : <span className="text-red-600">✗</span>}
                </td>
                <td className="px-4 py-2 text-right">
                  {card.price_tix ? `${card.price_tix.toFixed(2)}` : '-'}
                </td>
                <td className="px-4 py-2">
                  {card.last_price_update 
                    ? new Date(card.last_price_update).toLocaleDateString()
                    : 'Never'
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
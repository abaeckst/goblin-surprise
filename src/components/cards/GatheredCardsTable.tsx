import React, { useState } from 'react';
import { Package, Users, ChevronDown, ChevronRight } from 'lucide-react';
import type { ProcessedCard } from '../../types/cards';

interface GatheredCardsTableProps {
  cards: ProcessedCard[];
  loading?: boolean;
  className?: string;
}

export const GatheredCardsTable: React.FC<GatheredCardsTableProps> = ({
  cards,
  loading = false,
  className = ''
}) => {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleCardExpansion = (cardName: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(cardName)) {
      newExpanded.delete(cardName);
    } else {
      newExpanded.add(cardName);
    }
    setExpandedCards(newExpanded);
  };

  const getStatusColor = (status: ProcessedCard['status']) => {
    switch (status) {
      case 'needed': return 'bg-red-100 text-red-800';
      case 'exact': return 'bg-blue-100 text-blue-800';
      case 'surplus': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: ProcessedCard['status']) => {
    switch (status) {
      case 'needed': return 'Need More';
      case 'exact': return 'Complete';
      case 'surplus': return 'Surplus';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Package className="h-5 w-5 text-blue-500" />
          Gathered Cards
        </h3>
        <div className="animate-pulse space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Package className="h-5 w-5 text-blue-500" />
          Gathered Cards
        </h3>
        <div className="text-center py-8 text-gray-500">
          <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>No cards gathered yet</p>
          <p className="text-sm">Start uploading .dek files to contribute cards!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Package className="h-5 w-5 text-blue-500" />
        Gathered Cards ({cards.length})
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-700">Card Name</th>
              <th className="text-center py-3 px-4 font-medium text-gray-700">Required</th>
              <th className="text-center py-3 px-4 font-medium text-gray-700">Gathered</th>
              <th className="text-center py-3 px-4 font-medium text-gray-700">Status</th>
              <th className="text-center py-3 px-4 font-medium text-gray-700">Contributors</th>
            </tr>
          </thead>
          <tbody>
            {cards.map((card, index) => (
              <React.Fragment key={card.card_name}>
                <tr 
                  className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                    index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                  }`}
                  onClick={() => toggleCardExpansion(card.card_name)}
                >
                  <td className="py-3 px-4 font-medium text-gray-900 flex items-center gap-2">
                    {card.contributors.length > 0 && (
                      <button className="text-gray-400 hover:text-gray-600">
                        {expandedCards.has(card.card_name) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    )}
                    {card.card_name}
                  </td>
                  <td className="py-3 px-4 text-center text-gray-700">
                    {card.required_quantity}
                  </td>
                  <td className="py-3 px-4 text-center text-gray-700">
                    {card.gathered_quantity}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded-full font-medium text-xs ${getStatusColor(card.status)}`}>
                      {getStatusText(card.status)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">{card.contributors.length}</span>
                    </div>
                  </td>
                </tr>
                
                {/* Expanded contributor details */}
                {expandedCards.has(card.card_name) && card.contributors.length > 0 && (
                  <tr>
                    <td colSpan={5} className="py-2 px-4 bg-gray-50 border-b border-gray-100">
                      <div className="ml-6 space-y-1">
                        <div className="text-xs font-medium text-gray-600 mb-1">Contributors:</div>
                        {card.contributors.map((contributor, idx) => (
                          <div key={idx} className="text-xs text-gray-500 flex items-center gap-2">
                            <span className="font-medium">{contributor.name}</span>
                            <span>•</span>
                            <span>{contributor.quantity} cards</span>
                            <span>•</span>
                            <span className="text-gray-400">{contributor.deck_filename}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {cards.length > 10 && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Showing {cards.length} unique cards with contributions
        </div>
      )}
    </div>
  );
};
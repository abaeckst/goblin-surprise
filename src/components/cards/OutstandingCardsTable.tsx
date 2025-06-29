import React from 'react';
import { AlertCircle, Users } from 'lucide-react';
import type { ProcessedCard } from '../../types/cards';

interface OutstandingCardsTableProps {
  cards: ProcessedCard[];
  loading?: boolean;
  className?: string;
}

export const OutstandingCardsTable: React.FC<OutstandingCardsTableProps> = ({
  cards,
  loading = false,
  className = ''
}) => {
  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          Cards Still Needed
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
          <AlertCircle className="h-5 w-5 text-red-500" />
          Cards Still Needed
        </h3>
        <div className="text-center py-8 text-gray-500">
          <AlertCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>No cards needed!</p>
          <p className="text-sm">Your collection is complete!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-red-500" />
        Cards Still Needed ({cards.length})
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-700">Card Name</th>
              <th className="text-center py-3 px-4 font-medium text-gray-700">Required</th>
              <th className="text-center py-3 px-4 font-medium text-gray-700">Gathered</th>
              <th className="text-center py-3 px-4 font-medium text-gray-700">Still Need</th>
              <th className="text-center py-3 px-4 font-medium text-gray-700">Contributors</th>
            </tr>
          </thead>
          <tbody>
            {cards.map((card, index) => (
              <tr 
                key={card.card_name} 
                className={`border-b border-gray-100 hover:bg-red-50 ${
                  index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                }`}
              >
                <td className="py-3 px-4 font-medium text-gray-900">
                  {card.card_name}
                </td>
                <td className="py-3 px-4 text-center text-gray-700">
                  {card.required_quantity}
                </td>
                <td className="py-3 px-4 text-center text-gray-700">
                  {card.gathered_quantity}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
                    {card.outstanding_quantity}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  {card.contributors.length > 0 ? (
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">{card.contributors.length}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">None</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {cards.length > 10 && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Showing {cards.length} cards that still need contributions
        </div>
      )}
    </div>
  );
};
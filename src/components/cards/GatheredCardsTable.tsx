import React, { useState } from 'react';
import { Package, Users, ChevronDown, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { ProcessedCard } from '../../types/cards';

interface GatheredCardsTableProps {
  cards: ProcessedCard[];
  loading?: boolean;
  className?: string;
}

type SortField = 'card_name' | 'required_quantity' | 'gathered_quantity' | 'status' | 'price' | 'total_value';
type SortDirection = 'asc' | 'desc';

export const GatheredCardsTable: React.FC<GatheredCardsTableProps> = ({
  cards,
  loading = false,
  className = ''
}) => {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('card_name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const toggleCardExpansion = (cardName: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(cardName)) {
      newExpanded.delete(cardName);
    } else {
      newExpanded.add(cardName);
    }
    setExpandedCards(newExpanded);
  };

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedCards = [...cards].sort((a, b) => {
    let aValue: any = a[sortField as keyof ProcessedCard];
    let bValue: any = b[sortField as keyof ProcessedCard];

    // Handle special cases
    if (sortField === 'price') {
      aValue = a.metadata?.price_tix || 0;
      bValue = b.metadata?.price_tix || 0;
    } else if (sortField === 'total_value') {
      aValue = (a.metadata?.price_tix || 0) * a.gathered_quantity;
      bValue = (b.metadata?.price_tix || 0) * b.gathered_quantity;
    } else if (sortField === 'status') {
      // Sort by status priority: needed > exact > surplus
      const statusOrder = { needed: 0, exact: 1, surplus: 2 };
      aValue = statusOrder[a.status];
      bValue = statusOrder[b.status];
    }

    // Handle string vs number comparison
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    // Number comparison
    return sortDirection === 'asc' 
      ? aValue - bValue
      : bValue - aValue;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-3 w-3 text-gray-600" />
      : <ArrowDown className="h-3 w-3 text-gray-600" />;
  };

  const formatPrice = (price: number | null | undefined): string => {
    if (price === null || price === undefined) return '-';
    return `$${price.toFixed(2)}`;
  };

  const calculateTotalValue = (): number => {
    return cards.reduce((total, card) => {
      const price = card.metadata?.price_tix || 0;
      return total + (price * card.gathered_quantity);
    }, 0);
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
              <th 
                className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('card_name')}
              >
                <div className="flex items-center gap-1">
                  Card Name
                  <SortIcon field="card_name" />
                </div>
              </th>
              <th 
                className="text-center py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('required_quantity')}
              >
                <div className="flex items-center justify-center gap-1">
                  Required
                  <SortIcon field="required_quantity" />
                </div>
              </th>
              <th 
                className="text-center py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('gathered_quantity')}
              >
                <div className="flex items-center justify-center gap-1">
                  Gathered
                  <SortIcon field="gathered_quantity" />
                </div>
              </th>
              <th 
                className="text-center py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center justify-center gap-1">
                  Status
                  <SortIcon field="status" />
                </div>
              </th>
              <th 
                className="text-center py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('price')}
              >
                <div className="flex items-center justify-center gap-1">
                  Price
                  <SortIcon field="price" />
                </div>
              </th>
              <th 
                className="text-center py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('total_value')}
              >
                <div className="flex items-center justify-center gap-1">
                  Total Value
                  <SortIcon field="total_value" />
                </div>
              </th>
              <th className="text-center py-3 px-4 font-medium text-gray-700">Contributors</th>
            </tr>
          </thead>
          <tbody>
            {sortedCards.map((card, index) => (
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
                  <td className="py-3 px-4 text-center text-gray-700">
                    {formatPrice(card.metadata?.price_tix)}
                  </td>
                  <td className="py-3 px-4 text-center font-medium text-gray-900">
                    {formatPrice((card.metadata?.price_tix || 0) * card.gathered_quantity)}
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
                    <td colSpan={7} className="py-2 px-4 bg-gray-50 border-b border-gray-100">
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

      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Showing {cards.length} unique cards with contributions
        </div>
        <div className="text-sm font-medium text-gray-900">
          Total Collection Value: {formatPrice(calculateTotalValue())}
        </div>
      </div>
    </div>
  );
};
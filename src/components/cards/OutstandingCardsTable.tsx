import React, { useState } from 'react';
import { AlertCircle, Users, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { ProcessedCard } from '../../types/cards';

interface OutstandingCardsTableProps {
  cards: ProcessedCard[];
  loading?: boolean;
  className?: string;
}

type SortField = 'card_name' | 'required_quantity' | 'gathered_quantity' | 'outstanding_quantity' | 'price' | 'total_value';
type SortDirection = 'asc' | 'desc';

export const OutstandingCardsTable: React.FC<OutstandingCardsTableProps> = ({
  cards,
  loading = false,
  className = ''
}) => {
  const [sortField, setSortField] = useState<SortField>('outstanding_quantity');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
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
      aValue = (a.metadata?.price_tix || 0) * a.outstanding_quantity;
      bValue = (b.metadata?.price_tix || 0) * b.outstanding_quantity;
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
      return total + (price * card.outstanding_quantity);
    }, 0);
  };
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
                onClick={() => handleSort('outstanding_quantity')}
              >
                <div className="flex items-center justify-center gap-1">
                  Still Need
                  <SortIcon field="outstanding_quantity" />
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
                <td className="py-3 px-4 text-center text-gray-700">
                  {formatPrice(card.metadata?.price_tix)}
                </td>
                <td className="py-3 px-4 text-center font-medium text-gray-900">
                  {formatPrice((card.metadata?.price_tix || 0) * card.outstanding_quantity)}
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

      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Showing {cards.length} cards that still need contributions
        </div>
        <div className="text-sm font-medium text-gray-900">
          Total Outstanding Value: {formatPrice(calculateTotalValue())}
        </div>
      </div>
    </div>
  );
};
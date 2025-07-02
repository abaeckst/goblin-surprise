import React, { useState, useMemo } from 'react';
import { AlertCircle, Users, ArrowUpDown, ArrowUp, ArrowDown, Search, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  const itemsPerPage = 20;

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredCards = useMemo(() => {
    if (!searchTerm) return cards;
    const search = searchTerm.toLowerCase();
    return cards.filter(card => 
      card.card_name.toLowerCase().includes(search)
    );
  }, [cards, searchTerm]);

  const sortedCards = [...filteredCards].sort((a, b) => {
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

  const paginatedCards = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedCards.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedCards, currentPage]);

  const totalPages = Math.ceil(sortedCards.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
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
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-lg font-semibold text-gray-800 hover:text-gray-600 transition-colors"
        >
          <AlertCircle className="h-5 w-5 text-red-500" />
          Cards Still Needed ({filteredCards.length}{searchTerm ? ` of ${cards.length}` : ''})
          {isExpanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </button>
        {isExpanded && (
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search cards..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}
      </div>

      {isExpanded && (
        <>
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
                className="text-center py-3 px-2 sm:px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('outstanding_quantity')}
              >
                <div className="flex items-center justify-center gap-1">
                  <span className="hidden sm:inline">Quantity</span>
                  <span className="sm:hidden">Qty</span>
                  <SortIcon field="outstanding_quantity" />
                </div>
              </th>
              <th 
                className="text-center py-3 px-2 sm:px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('total_value')}
              >
                <div className="flex items-center justify-center gap-1">
                  <span className="hidden sm:inline">Value</span>
                  <span className="sm:hidden">$</span>
                  <SortIcon field="total_value" />
                </div>
              </th>
              <th className="text-center py-3 px-2 sm:px-4 font-medium text-gray-700">
                <span className="hidden sm:inline">Contributors</span>
                <Users className="h-4 w-4 sm:hidden inline" />
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedCards.map((card, index) => (
              <tr 
                key={card.card_name} 
                className={`border-b border-gray-100 hover:bg-red-50 ${
                  index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                }`}
              >
                <td className="py-3 px-2 sm:px-4">
                  <div className="font-medium text-gray-900">{card.card_name}</div>
                  <div className="text-xs text-gray-500 sm:hidden">
                    {formatPrice(card.metadata?.price_tix)} each
                  </div>
                </td>
                <td className="py-3 px-2 sm:px-4 text-center">
                  <div className="flex flex-col items-center">
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium text-sm">
                      {card.outstanding_quantity}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      {card.gathered_quantity}/{card.required_quantity}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-2 sm:px-4 text-center">
                  <div className="font-medium text-gray-900">
                    {formatPrice((card.metadata?.price_tix || 0) * card.outstanding_quantity)}
                  </div>
                  <div className="text-xs text-gray-500 hidden sm:block">
                    @ {formatPrice(card.metadata?.price_tix)}
                  </div>
                </td>
                <td className="py-3 px-2 sm:px-4 text-center">
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

          <div className="mt-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div className="text-sm text-gray-500">
            Showing {paginatedCards.length} of {filteredCards.length} cards
          </div>
          <div className="text-sm font-medium text-gray-900">
            Total Outstanding Value: {formatPrice(calculateTotalValue())}
          </div>
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = idx + 1;
                } else if (currentPage <= 3) {
                  pageNum = idx + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + idx;
                } else {
                  pageNum = currentPage - 2 + idx;
                }
                
                if (pageNum < 1 || pageNum > totalPages) return null;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            </div>
          )}
        </div>
      </>
    )}
  </div>
  );
};
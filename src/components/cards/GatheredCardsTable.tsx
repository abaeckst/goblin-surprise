import React, { useState, useMemo } from 'react';
import { Package, Users, ChevronDown, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Search, ChevronLeft, ChevronRight as ChevronRightIcon, ChevronUp } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  const itemsPerPage = 20;

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

  const paginatedCards = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedCards.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedCards, currentPage]);

  const totalPages = Math.ceil(sortedCards.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
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
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-lg font-semibold text-gray-800 hover:text-gray-600 transition-colors"
        >
          <Package className="h-5 w-5 text-blue-500" />
          Gathered Cards ({filteredCards.length}{searchTerm ? ` of ${cards.length}` : ''})
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
                onClick={() => handleSort('gathered_quantity')}
              >
                <div className="flex items-center justify-center gap-1">
                  <span className="hidden sm:inline">Progress</span>
                  <span className="sm:hidden">Prog</span>
                  <SortIcon field="gathered_quantity" />
                </div>
              </th>
              <th 
                className="text-center py-3 px-2 sm:px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center justify-center gap-1">
                  Status
                  <SortIcon field="status" />
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
              <React.Fragment key={card.card_name}>
                <tr 
                  className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                    index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                  }`}
                  onClick={() => toggleCardExpansion(card.card_name)}
                >
                  <td className="py-3 px-2 sm:px-4">
                    <div className="flex items-center gap-2">
                      {card.contributors.length > 0 && (
                        <button className="text-gray-400 hover:text-gray-600">
                          {expandedCards.has(card.card_name) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{card.card_name}</div>
                        <div className="text-xs text-gray-500 sm:hidden">
                          {formatPrice(card.metadata?.price_tix)} each
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2 sm:px-4 text-center">
                    <div className="flex flex-col items-center">
                      <div className="text-sm font-medium">
                        {card.gathered_quantity}/{card.required_quantity}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1 max-w-[60px]">
                        <div 
                          className={`h-1.5 rounded-full ${
                            card.status === 'surplus' ? 'bg-green-600' : 
                            card.status === 'exact' ? 'bg-blue-600' : 'bg-yellow-600'
                          }`}
                          style={{ width: `${Math.min(100, (card.gathered_quantity / card.required_quantity) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2 sm:px-4 text-center">
                    <span className={`px-2 py-1 rounded-full font-medium text-xs ${getStatusColor(card.status)}`}>
                      {getStatusText(card.status)}
                    </span>
                  </td>
                  <td className="py-3 px-2 sm:px-4 text-center">
                    <div className="font-medium text-gray-900">
                      {formatPrice((card.metadata?.price_tix || 0) * card.gathered_quantity)}
                    </div>
                    <div className="text-xs text-gray-500 hidden sm:block">
                      @ {formatPrice(card.metadata?.price_tix)}
                    </div>
                  </td>
                  <td className="py-3 px-2 sm:px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">{card.contributors.length}</span>
                    </div>
                  </td>
                </tr>
                
                {/* Expanded contributor details */}
                {expandedCards.has(card.card_name) && card.contributors.length > 0 && (
                  <tr>
                    <td colSpan={5} className="py-2 px-2 sm:px-4 bg-gray-50 border-b border-gray-100">
                      <div className="ml-6 space-y-1">
                        <div className="text-xs font-medium text-gray-600 mb-1">Contributors:</div>
                        {card.contributors.map((contributor, idx) => (
                          <div key={idx} className="text-xs text-gray-500 flex flex-wrap items-center gap-x-2">
                            <span className="font-medium">{contributor.name}</span>
                            <span className="hidden sm:inline">•</span>
                            <span>{contributor.quantity} cards</span>
                            <span className="hidden sm:inline">•</span>
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

          <div className="mt-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div className="text-sm text-gray-500">
            Showing {paginatedCards.length} of {filteredCards.length} cards
          </div>
          <div className="text-sm font-medium text-gray-900">
            Total Collection Value: {formatPrice(calculateTotalValue())}
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
              <ChevronRightIcon className="h-4 w-4" />
            </button>
            </div>
          )}
        </div>
      </>
    )}
  </div>
  );
};
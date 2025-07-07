import React, { useState, useEffect } from 'react';
import { History, Users, DollarSign, CreditCard, Hash, TrendingUp, Calendar, ArrowUpDown } from 'lucide-react';
import { subscribeToChanges, supabase, DatabaseService } from '../../services/supabase';
import type { MonetaryDonation } from '../../types/database';

interface CardContribution {
  id: string;
  contributor_name: string;
  deck_filename: string;
  created_at: string;
  card_count: number;
  total_value: number;
}

interface ContributorSummary {
  name: string;
  cardValue: number;
  monetaryValue: number;
  totalValue: number;
  cardContributions: number;
  monetaryContributions: number;
}

type SortField = 'contributor' | 'date' | 'value' | 'amount';
type SortDirection = 'asc' | 'desc';

export const DonationsHistory: React.FC = () => {
  const [cardContributions, setCardContributions] = useState<CardContribution[]>([]);
  const [monetaryDonations, setMonetaryDonations] = useState<MonetaryDonation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Sorting states
  const [cardSort, setCardSort] = useState<{ field: SortField; direction: SortDirection }>({ 
    field: 'contributor', 
    direction: 'asc' 
  });
  const [monetarySort, setMonetarySort] = useState<{ field: SortField; direction: SortDirection }>({ 
    field: 'contributor', 
    direction: 'asc' 
  });

  const formatPrice = (price: number): string => {
    return `$${price.toFixed(2)}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get ALL gathered cards with their metadata in one query
      const { data: allGatheredCards, error: cardsError } = await supabase
        .from('gathered_cards')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (cardsError) {
        throw cardsError;
      }
      
      // Get all unique card names to fetch metadata
      const uniqueCardNames = new Set<string>();
      allGatheredCards?.forEach(card => uniqueCardNames.add(card.card_name));
      
      // Fetch metadata for all cards at once
      const { data: metadataRows } = await supabase
        .from('card_metadata')
        .select('card_name, price_tix')
        .in('card_name', Array.from(uniqueCardNames));
      
      // Create metadata lookup map
      const metadataMap = new Map<string, number>();
      metadataRows?.forEach(metadata => {
        if (metadata.price_tix) {
          metadataMap.set(metadata.card_name, metadata.price_tix);
        }
      });
      
      // Process and aggregate card contributions client-side
      const contributionMap = new Map<string, CardContribution>();
      
      allGatheredCards?.forEach(card => {
        const key = `${card.contributor_name}_${card.deck_filename}`;
        
        if (!contributionMap.has(key)) {
          contributionMap.set(key, {
            id: key,
            contributor_name: card.contributor_name,
            deck_filename: card.deck_filename,
            created_at: card.created_at,
            card_count: 0,
            total_value: 0
          });
        }
        
        const contribution = contributionMap.get(key)!;
        contribution.card_count += card.quantity;
        
        // Add value if we have price metadata
        const price = metadataMap.get(card.card_name) || 0;
        contribution.total_value += price * card.quantity;
      });
      
      // Get monetary donations
      const monetaryDonations = await DatabaseService.getMonetaryDonations();
      
      setCardContributions(Array.from(contributionMap.values()));
      setMonetaryDonations(monetaryDonations);
      
      console.log('✅ Loaded all donations history');
      
    } catch (err) {
      console.error('Failed to load donations history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load donations history');
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    loadAllData();
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    console.log('🔔 Setting up real-time subscriptions for history...');
    
    // Subscribe to card contributions
    const cardChannel = subscribeToChanges('gathered_cards', (payload) => {
      console.log('🔔 Card contribution update received:', payload);
      if (payload.eventType === 'INSERT') {
        setTimeout(() => loadAllData(), 500);
      }
    });

    // Subscribe to monetary donations
    const monetaryChannel = DatabaseService.subscribeToMonetaryDonations(() => {
      console.log('🔔 Monetary donation update received');
      setTimeout(() => loadAllData(), 500);
    });

    // Cleanup subscriptions on unmount
    return () => {
      console.log('🔔 Cleaning up real-time subscriptions...');
      cardChannel.unsubscribe();
      monetaryChannel.unsubscribe();
    };
  }, []);

  // Calculate summary statistics
  const getSummaryStats = () => {
    const totalCardValue = cardContributions.reduce((sum, contrib) => sum + contrib.total_value, 0);
    const totalMonetaryValue = monetaryDonations.reduce((sum, donation) => sum + donation.amount, 0);
    const totalCardCount = cardContributions.reduce((sum, contrib) => sum + contrib.card_count, 0);
    
    // Calculate contributor summaries
    const contributorMap = new Map<string, ContributorSummary>();
    
    // Add card contributions
    cardContributions.forEach(contrib => {
      const existing = contributorMap.get(contrib.contributor_name) || {
        name: contrib.contributor_name,
        cardValue: 0,
        monetaryValue: 0,
        totalValue: 0,
        cardContributions: 0,
        monetaryContributions: 0
      };
      existing.cardValue += contrib.total_value;
      existing.cardContributions += 1;
      existing.totalValue = existing.cardValue + existing.monetaryValue;
      contributorMap.set(contrib.contributor_name, existing);
    });
    
    // Add monetary contributions
    monetaryDonations.forEach(donation => {
      const existing = contributorMap.get(donation.contributor_name) || {
        name: donation.contributor_name,
        cardValue: 0,
        monetaryValue: 0,
        totalValue: 0,
        cardContributions: 0,
        monetaryContributions: 0
      };
      existing.monetaryValue += donation.amount;
      existing.monetaryContributions += 1;
      existing.totalValue = existing.cardValue + existing.monetaryValue;
      contributorMap.set(donation.contributor_name, existing);
    });
    
    const topContributors = Array.from(contributorMap.values())
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5);
    
    return {
      totalCardValue,
      totalMonetaryValue,
      totalValue: totalCardValue + totalMonetaryValue,
      totalCardCount,
      totalContributions: cardContributions.length + monetaryDonations.length,
      uniqueContributors: contributorMap.size,
      topContributors
    };
  };

  // Sorting functions
  const sortCardContributions = (contributions: CardContribution[]) => {
    return [...contributions].sort((a, b) => {
      let valueA: any, valueB: any;
      
      switch (cardSort.field) {
        case 'contributor':
          valueA = a.contributor_name.toLowerCase();
          valueB = b.contributor_name.toLowerCase();
          break;
        case 'date':
          valueA = new Date(a.created_at);
          valueB = new Date(b.created_at);
          break;
        case 'value':
          valueA = a.total_value;
          valueB = b.total_value;
          break;
        default:
          return 0;
      }
      
      if (cardSort.direction === 'asc') {
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      } else {
        return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
      }
    });
  };

  const sortMonetaryDonations = (donations: MonetaryDonation[]) => {
    return [...donations].sort((a, b) => {
      let valueA: any, valueB: any;
      
      switch (monetarySort.field) {
        case 'contributor':
          valueA = a.contributor_name.toLowerCase();
          valueB = b.contributor_name.toLowerCase();
          break;
        case 'date':
          valueA = new Date(a.created_at);
          valueB = new Date(b.created_at);
          break;
        case 'amount':
          valueA = a.amount;
          valueB = b.amount;
          break;
        default:
          return 0;
      }
      
      if (monetarySort.direction === 'asc') {
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      } else {
        return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
      }
    });
  };

  const handleCardSort = (field: SortField) => {
    setCardSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleMonetarySort = (field: SortField) => {
    setMonetarySort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const SortButton: React.FC<{ field: SortField; currentSort: { field: SortField; direction: SortDirection }; onClick: (field: SortField) => void }> = ({ field, currentSort, onClick }) => (
    <button
      onClick={() => onClick(field)}
      className="flex items-center gap-1 text-gray-600 hover:text-gray-800"
    >
      <ArrowUpDown className="h-3 w-3" />
      {currentSort.field === field && (
        <span className="text-xs">{currentSort.direction === 'asc' ? '↑' : '↓'}</span>
      )}
    </button>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <History className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Donations History</h1>
        </div>
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-gray-200 rounded-lg h-24"></div>
            ))}
          </div>
          <div className="bg-gray-200 rounded-lg h-64"></div>
          <div className="bg-gray-200 rounded-lg h-64"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <History className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Donations History</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700">Failed to load donations history</p>
          <p className="text-red-500 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const stats = getSummaryStats();
  const sortedCardContributions = sortCardContributions(cardContributions);
  const sortedMonetaryDonations = sortMonetaryDonations(monetaryDonations);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <History className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Donations History</h1>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.totalValue)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <Hash className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Cards</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCardCount.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Contributors</p>
              <p className="text-2xl font-bold text-gray-900">{stats.uniqueContributors}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Total Contributions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalContributions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Contributors */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Contributors</h2>
        <div className="space-y-3">
          {stats.topContributors.map((contributor, index) => (
            <div key={contributor.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">{index + 1}</span>
                </div>
                <span className="font-medium text-gray-900">{contributor.name}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-blue-600">{formatPrice(contributor.cardValue)} cards</span>
                <span className="text-green-600">{formatPrice(contributor.monetaryValue)} cash</span>
                <span className="font-semibold text-gray-900">{formatPrice(contributor.totalValue)} total</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Card Contributions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Hash className="h-5 w-5 text-blue-600" />
            Card Contributions ({cardContributions.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    Contributor
                    <SortButton field="contributor" currentSort={cardSort} onClick={handleCardSort} />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    Date
                    <SortButton field="date" currentSort={cardSort} onClick={handleCardSort} />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deck File
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Card Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    Total Value
                    <SortButton field="value" currentSort={cardSort} onClick={handleCardSort} />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedCardContributions.map((contribution) => (
                <tr key={contribution.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">
                          {contribution.contributor_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{contribution.contributor_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(contribution.created_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {contribution.deck_filename}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {contribution.card_count.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    {formatPrice(contribution.total_value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {cardContributions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No card contributions yet
          </div>
        )}
      </div>

      {/* Monetary Donations Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-green-600" />
            Monetary Donations ({monetaryDonations.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    Contributor
                    <SortButton field="contributor" currentSort={monetarySort} onClick={handleMonetarySort} />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    Date
                    <SortButton field="date" currentSort={monetarySort} onClick={handleMonetarySort} />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    Amount
                    <SortButton field="amount" currentSort={monetarySort} onClick={handleMonetarySort} />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedMonetaryDonations.map((donation) => (
                <tr key={donation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CreditCard className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{donation.contributor_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(donation.created_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    {formatPrice(donation.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      donation.donation_type === 'usd' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {donation.donation_type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {donation.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {monetaryDonations.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No monetary donations yet
          </div>
        )}
      </div>
    </div>
  );
};
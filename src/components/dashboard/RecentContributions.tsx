import React, { useState, useEffect } from 'react';
import { Users, Clock, Hash, Database, DollarSign, CreditCard } from 'lucide-react';
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

type RecentContribution = 
  | { type: 'cards'; data: CardContribution }
  | { type: 'monetary'; data: MonetaryDonation };

interface RecentContributionsProps {
  className?: string;
}

export const RecentContributions: React.FC<RecentContributionsProps> = ({ className = '' }) => {
  const [contributions, setContributions] = useState<RecentContribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'error'>('connecting');

  const formatPrice = (price: number): string => {
    return `$${price.toFixed(2)}`;
  };

  const loadContributions = async () => {
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
        
        // Combine card and monetary contributions
        const allContributions: RecentContribution[] = [
          ...Array.from(contributionMap.values()).map(c => ({ type: 'cards' as const, data: c })),
          ...monetaryDonations.map(d => ({ type: 'monetary' as const, data: d }))
        ];
        
        // Sort by most recent and take top 10
        const sortedContributions = allContributions
          .sort((a, b) => {
            const dateA = new Date(a.data.created_at);
            const dateB = new Date(b.data.created_at);
            return dateB.getTime() - dateA.getTime();
          })
          .slice(0, 10);
        
        setContributions(sortedContributions);
        setConnectionStatus('connected');
        
        console.log('✅ Loaded contributions:', sortedContributions.length);
        console.log('📊 Sample contribution:', sortedContributions[0]);
        
      } catch (err) {
        console.error('Failed to load contributions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load contributions');
        setConnectionStatus('error');
      } finally {
        setLoading(false);
      }
  };

  // Load initial data
  useEffect(() => {
    loadContributions();
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    console.log('🔔 Setting up real-time subscriptions...');
    
    // Subscribe to card contributions
    const cardChannel = subscribeToChanges('gathered_cards', (payload) => {
      console.log('🔔 Card contribution update received:', payload);
      if (payload.eventType === 'INSERT') {
        setTimeout(() => loadContributions(), 500);
      }
    });

    // Subscribe to monetary donations
    const monetaryChannel = DatabaseService.subscribeToMonetaryDonations(() => {
      console.log('🔔 Monetary donation update received');
      setTimeout(() => loadContributions(), 500);
    });

    // Cleanup subscriptions on unmount
    return () => {
      console.log('🔔 Cleaning up real-time subscriptions...');
      cardChannel.unsubscribe();
      monetaryChannel.unsubscribe();
    };
  }, []);

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getConnectionIndicator = () => {
    switch (connectionStatus) {
      case 'connecting':
        return (
          <div className="flex items-center gap-2 text-yellow-600">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-500"></div>
            <span className="text-xs">Connecting...</span>
          </div>
        );
      case 'connected':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs">Live</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-red-600">
            <div className="h-2 w-2 bg-red-500 rounded-full"></div>
            <span className="text-xs">Offline</span>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Recent Contributions
          </h3>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Recent Contributions
          </h3>
          {getConnectionIndicator()}
        </div>
        <div className="text-center py-4">
          <Database className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Failed to load contributions</p>
          <p className="text-gray-400 text-xs mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Recent Contributions
        </h3>
        {getConnectionIndicator()}
      </div>

      {contributions.length === 0 ? (
        <div className="text-center py-8">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No contributions yet</p>
          <p className="text-gray-400 text-sm">Upload a .dek file to get started!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contributions.map((contribution) => {
            const isMonetary = contribution.type === 'monetary';
            const data = contribution.data;
            const contributorName = data.contributor_name;
            const createdAt = data.created_at;
            
            return (
              <div
                key={isMonetary ? data.id : (data as CardContribution).id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className={`h-8 w-8 ${isMonetary ? 'bg-green-100' : 'bg-blue-100'} rounded-full flex items-center justify-center`}>
                  {isMonetary ? (
                    <CreditCard className="h-4 w-4 text-green-600" />
                  ) : (
                    <span className="text-blue-600 font-medium text-sm">
                      {contributorName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-800 truncate">
                      {contributorName}
                    </p>
                    <span className="text-gray-400">•</span>
                    {isMonetary ? (
                      <>
                        <div className="flex items-center gap-1 text-green-600">
                          <DollarSign className="h-3 w-3" />
                          <span className="text-sm font-medium">{formatPrice((data as MonetaryDonation).amount)}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          ({(data as MonetaryDonation).donation_type.toUpperCase()})
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-1 text-gray-600">
                          <Hash className="h-3 w-3" />
                          <span className="text-sm">{(data as CardContribution).card_count}</span>
                        </div>
                        <span className="text-gray-400">•</span>
                        <div className="flex items-center gap-1 text-green-600">
                          <DollarSign className="h-3 w-3" />
                          <span className="text-sm font-medium">{formatPrice((data as CardContribution).total_value)}</span>
                        </div>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {isMonetary ? 
                      ((data as MonetaryDonation).notes || 'Monetary donation') : 
                      (data as CardContribution).deck_filename
                    }
                  </p>
                </div>
                
                <div className="flex items-center gap-1 text-gray-500 text-xs">
                  <Clock className="h-3 w-3" />
                  <span>{formatTimeAgo(createdAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { Users, Clock, Hash, Database, DollarSign } from 'lucide-react';
import { DatabaseService, subscribeToChanges, supabase } from '../../services/supabase';

interface RecentContribution {
  id: string;
  contributor_name: string;
  deck_filename: string;
  created_at: string;
  card_count: number;
  total_value: number;
}

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

  // Load initial data
  useEffect(() => {
    const loadContributions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get recent unique contributions
        const uploads = await DatabaseService.getDeckUploads();
        
        // Process and aggregate the contributions
        const contributionMap = new Map<string, RecentContribution>();
        
        uploads.forEach(upload => {
          const key = `${upload.contributor_name}_${upload.deck_filename}`;
          
          if (!contributionMap.has(key)) {
            contributionMap.set(key, {
              id: key,
              contributor_name: upload.contributor_name,
              deck_filename: upload.deck_filename,
              created_at: upload.created_at,
              card_count: 0,
              total_value: 0
            });
          }
        });
        
        // Count cards and calculate values for each contribution
        for (const contribution of Array.from(contributionMap.values())) {
          try {
            const { data: cardData } = await supabase
              .from('gathered_cards')
              .select(`
                quantity,
                card_name,
                card_metadata(price_tix)
              `)
              .eq('contributor_name', contribution.contributor_name)
              .eq('deck_filename', contribution.deck_filename);
            
            const totalCards = cardData?.reduce((sum, card) => sum + card.quantity, 0) || 0;
            const totalValue = cardData?.reduce((sum, card) => {
              const price = (card as any).card_metadata?.price_tix || 0;
              return sum + (price * card.quantity);
            }, 0) || 0;
            
            contribution.card_count = totalCards;
            contribution.total_value = totalValue;
          } catch (err) {
            console.warn('Failed to count cards for contribution:', contribution.id);
            contribution.card_count = 0;
            contribution.total_value = 0;
          }
        }
        
        const sortedContributions = Array.from(contributionMap.values())
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10); // Show last 10 contributions
        
        setContributions(sortedContributions);
        setConnectionStatus('connected');
        
      } catch (err) {
        console.error('Failed to load contributions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load contributions');
        setConnectionStatus('error');
      } finally {
        setLoading(false);
      }
    };

    loadContributions();
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    console.log('🔔 Setting up real-time subscription for gathered_cards...');
    
    const channel = subscribeToChanges('gathered_cards', (payload) => {
      console.log('🔔 Real-time update received:', payload);
      
      // Reload contributions when new data is inserted
      if (payload.eventType === 'INSERT') {
        console.log('🔔 New card inserted, refreshing contributions...');
        
        // Add a slight delay to ensure data consistency
        setTimeout(async () => {
          try {
            const uploads = await DatabaseService.getDeckUploads();
            
            // Process and update contributions (simplified version)
            const contributionMap = new Map<string, RecentContribution>();
            
            uploads.forEach(upload => {
              const key = `${upload.contributor_name}_${upload.deck_filename}`;
              
              if (!contributionMap.has(key)) {
                contributionMap.set(key, {
                  id: key,
                  contributor_name: upload.contributor_name,
                  deck_filename: upload.deck_filename,
                  created_at: upload.created_at,
                  card_count: 0,
                  total_value: 0
                });
              }
            });
            
            // Count cards and calculate values for each contribution
            for (const contribution of Array.from(contributionMap.values())) {
              try {
                const { data: cardData } = await supabase
                  .from('gathered_cards')
                  .select(`
                    quantity,
                    card_name,
                    card_metadata(price_tix)
                  `)
                  .eq('contributor_name', contribution.contributor_name)
                  .eq('deck_filename', contribution.deck_filename);
                
                const totalCards = cardData?.reduce((sum, card) => sum + card.quantity, 0) || 0;
                const totalValue = cardData?.reduce((sum, card) => {
                  const price = (card as any).card_metadata?.price_tix || 0;
                  return sum + (price * card.quantity);
                }, 0) || 0;
                
                contribution.card_count = totalCards;
                contribution.total_value = totalValue;
              } catch (err) {
                console.warn('Failed to count cards for contribution:', contribution.id);
                contribution.card_count = 0;
                contribution.total_value = 0;
              }
            }
            
            const updatedContributions = Array.from(contributionMap.values())
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 10);
            
            setContributions(updatedContributions);
            console.log('🔔 Contributions updated via real-time subscription');
            
          } catch (err) {
            console.error('Failed to refresh contributions after real-time update:', err);
          }
        }, 500);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      console.log('🔔 Cleaning up real-time subscription...');
      channel.unsubscribe();
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
          {contributions.map((contribution) => (
            <div
              key={contribution.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-medium text-sm">
                  {contribution.contributor_name.charAt(0).toUpperCase()}
                </span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-800 truncate">
                    {contribution.contributor_name}
                  </p>
                  <span className="text-gray-400">•</span>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Hash className="h-3 w-3" />
                    <span className="text-sm">{contribution.card_count}</span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <div className="flex items-center gap-1 text-green-600">
                    <DollarSign className="h-3 w-3" />
                    <span className="text-sm font-medium">{formatPrice(contribution.total_value)}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 truncate">
                  {contribution.deck_filename}
                </p>
              </div>
              
              <div className="flex items-center gap-1 text-gray-500 text-xs">
                <Clock className="h-3 w-3" />
                <span>{formatTimeAgo(contribution.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
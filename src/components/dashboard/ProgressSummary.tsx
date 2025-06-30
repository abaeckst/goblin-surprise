import React, { useState, useEffect } from 'react';
import { BarChart3, Target, Users, Hash, TrendingUp, Database, DollarSign } from 'lucide-react';
import { RequirementsService } from '../../services/requirementsService';
import { subscribeToChanges } from '../../services/supabase';

interface ProgressStats {
  totalCardsGathered: number;
  totalCardsRequired: number;
  uniqueCardsGathered: number;
  uniqueCardsRequired: number;
  totalContributors: number;
  completionPercentage: number;
  totalCollectionValue: number;
  totalOutstandingValue: number;
  topContributors: Array<{
    name: string;
    cardCount: number;
    totalValue: number;
  }>;
}

interface ProgressSummaryProps {
  className?: string;
}

export const ProgressSummary: React.FC<ProgressSummaryProps> = ({ className = '' }) => {
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatPrice = (price: number): string => {
    return `$${price.toFixed(2)}`;
  };

  const loadProgressStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use RequirementsService to get proper progress stats with pricing
      const [outstandingCards, gatheredCards, progressStats] = await Promise.all([
        RequirementsService.getOutstandingCards(),
        RequirementsService.getGatheredCards(),
        RequirementsService.getProgressStats()
      ]);

      // Calculate price statistics
      const totalCollectionValue = gatheredCards.reduce((total, card) => {
        const price = card.metadata?.price_tix || 0;
        return total + (price * card.gathered_quantity);
      }, 0);

      const totalOutstandingValue = outstandingCards.reduce((total, card) => {
        const price = card.metadata?.price_tix || 0;
        return total + (price * card.outstanding_quantity);
      }, 0);

      // Calculate contributor stats with values
      const contributorStats = new Map<string, { cardCount: number; totalValue: number }>();
      
      gatheredCards.forEach(card => {
        if (card.contributors) {
          card.contributors.forEach(contributor => {
            const existing = contributorStats.get(contributor.name) || { cardCount: 0, totalValue: 0 };
            const price = card.metadata?.price_tix || 0;
            existing.cardCount += contributor.quantity;
            existing.totalValue += price * contributor.quantity;
            contributorStats.set(contributor.name, existing);
          });
        }
      });

      // Get top contributors
      const topContributors = Array.from(contributorStats.entries())
        .map(([name, stats]) => ({ 
          name, 
          cardCount: stats.cardCount,
          totalValue: stats.totalValue 
        }))
        .sort((a, b) => b.cardCount - a.cardCount)
        .slice(0, 5);

      const combinedStats: ProgressStats = {
        totalCardsGathered: progressStats.totalGatheredCards,
        totalCardsRequired: progressStats.totalRequiredCards,
        uniqueCardsGathered: progressStats.totalUniqueCards,
        uniqueCardsRequired: progressStats.totalUniqueCards,
        totalContributors: contributorStats.size,
        completionPercentage: progressStats.completionPercentage,
        totalCollectionValue,
        totalOutstandingValue,
        topContributors
      };

      setStats(combinedStats);

    } catch (err) {
      console.error('Failed to load progress stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load progress');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgressStats();

    // Set up real-time updates for both gathered_cards and requirement_cards
    const gatheredChannel = subscribeToChanges('gathered_cards', () => {
      console.log('Progress stats update triggered by gathered_cards change');
      setTimeout(loadProgressStats, 500); // Small delay for data consistency
    });

    const requirementChannel = subscribeToChanges('requirement_cards', () => {
      console.log('Progress stats update triggered by requirement_cards change');
      setTimeout(loadProgressStats, 500);
    });

    return () => {
      gatheredChannel.unsubscribe();
      requirementChannel.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Collection Progress
          </h3>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Collection Progress
          </h3>
        </div>
        <div className="text-center py-8">
          <Database className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Unable to load progress data</p>
          {error && <p className="text-gray-400 text-sm mt-1">{error}</p>}
          <button
            onClick={loadProgressStats}
            className="mt-3 px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Collection Progress
        </h3>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
          Live
        </div>
      </div>

      {/* Main Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm font-bold text-gray-900">{stats.completionPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all duration-500 ${
              stats.completionPercentage >= 100 
                ? 'bg-green-500' 
                : stats.completionPercentage >= 75 
                  ? 'bg-blue-500' 
                  : stats.completionPercentage >= 50 
                    ? 'bg-yellow-500' 
                    : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(stats.completionPercentage, 100)}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{stats.totalCardsGathered} gathered</span>
          <span>{stats.totalCardsRequired} needed</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Hash className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Cards</span>
          </div>
          <p className="text-xl font-bold text-blue-700">
            {stats.totalCardsGathered}
          </p>
          <p className="text-xs text-blue-600">
            {stats.uniqueCardsGathered} unique
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Contributors</span>
          </div>
          <p className="text-xl font-bold text-green-700">
            {stats.totalContributors}
          </p>
          <p className="text-xs text-green-600">helping rebuild</p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-800">Collection Value</span>
          </div>
          <p className="text-xl font-bold text-emerald-700">
            {formatPrice(stats.totalCollectionValue)}
          </p>
          <p className="text-xs text-emerald-600">contributed so far</p>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-800">Still Needed</span>
          </div>
          <p className="text-xl font-bold text-orange-700">
            {formatPrice(stats.totalOutstandingValue)}
          </p>
          <p className="text-xs text-orange-600">cards to find</p>
        </div>
      </div>

      {/* Top Contributors */}
      {stats.topContributors.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Top Contributors
          </h4>
          <div className="space-y-2">
            {stats.topContributors.map((contributor, index) => (
              <div key={contributor.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                    index === 1 ? 'bg-gray-100 text-gray-800' :
                    index === 2 ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {contributor.name}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-600 font-mono">
                    {contributor.cardCount} cards
                  </span>
                  <span className="text-green-600 font-semibold">
                    {formatPrice(contributor.totalValue)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No data state */}
      {stats.totalCardsGathered === 0 && (
        <div className="text-center py-8">
          <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No cards gathered yet</p>
          <p className="text-gray-400 text-xs">Upload some .dek files to get started!</p>
        </div>
      )}
    </div>
  );
};
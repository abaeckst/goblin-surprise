import React, { useState, useEffect } from 'react';
import { BarChart3, Target, Users, Hash, TrendingUp, Database } from 'lucide-react';
import { supabase } from '../../services/supabase';

interface ProgressStats {
  totalCardsGathered: number;
  totalCardsRequired: number;
  uniqueCardsGathered: number;
  uniqueCardsRequired: number;
  totalContributors: number;
  completionPercentage: number;
  topContributors: Array<{
    name: string;
    cardCount: number;
  }>;
}

interface ProgressSummaryProps {
  className?: string;
}

export const ProgressSummary: React.FC<ProgressSummaryProps> = ({ className = '' }) => {
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProgressStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get gathered cards stats
      const { data: gatheredCards, error: gatheredError } = await supabase
        .from('gathered_cards')
        .select('card_name, quantity, contributor_name');

      if (gatheredError) throw gatheredError;

      // For now, we'll work without requirements since the table structure isn't ready
      // This will be implemented in Session 2
      const requiredCards: any[] = [];

      // Calculate stats
      const gatheredStats = new Map<string, number>();
      const contributorStats = new Map<string, number>();
      let totalCardsGathered = 0;

      gatheredCards?.forEach(card => {
        // Sum gathered quantities by card name
        const currentQuantity = gatheredStats.get(card.card_name) || 0;
        gatheredStats.set(card.card_name, currentQuantity + card.quantity);
        totalCardsGathered += card.quantity;

        // Sum contributor stats
        const currentContributions = contributorStats.get(card.contributor_name) || 0;
        contributorStats.set(card.contributor_name, currentContributions + card.quantity);
      });

      const requiredStats = new Map<string, number>();
      let totalCardsRequired = 0;

      requiredCards?.forEach(card => {
        requiredStats.set(card.card_name, card.required_quantity);
        totalCardsRequired += card.required_quantity;
      });

      // Calculate completion percentage
      const completionPercentage = totalCardsRequired > 0 
        ? Math.round((totalCardsGathered / totalCardsRequired) * 100)
        : 0;

      // Get top contributors
      const topContributors = Array.from(contributorStats.entries())
        .map(([name, cardCount]) => ({ name, cardCount }))
        .sort((a, b) => b.cardCount - a.cardCount)
        .slice(0, 5);

      const progressStats: ProgressStats = {
        totalCardsGathered,
        totalCardsRequired,
        uniqueCardsGathered: gatheredStats.size,
        uniqueCardsRequired: requiredStats.size,
        totalContributors: contributorStats.size,
        completionPercentage,
        topContributors
      };

      setStats(progressStats);

    } catch (err) {
      console.error('Failed to load progress stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load progress');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgressStats();

    // Set up real-time updates (only for gathered_cards since requirement_cards may not exist)
    const channel = supabase
      .channel('progress-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gathered_cards',
        },
        () => {
          console.log('Progress stats update triggered by real-time change');
          setTimeout(loadProgressStats, 500); // Small delay for data consistency
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
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
                <span className="text-sm text-gray-600 font-mono">
                  {contributor.cardCount}
                </span>
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
import React, { useState, useEffect } from 'react';
import { RefreshCw, BarChart3, Download, Check, DollarSign } from 'lucide-react';
import { RequirementsService } from '../../services/requirementsService';
import { subscribeToChanges } from '../../services/supabase';
import PriceUpdateService from '../../services/priceUpdateService';
import { ProgressBar } from './ProgressBar';
import { OutstandingCardsTable } from '../cards/OutstandingCardsTable';
import { GatheredCardsTable } from '../cards/GatheredCardsTable';
import type { ProcessedCard } from '../../types/cards';

export const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [outstandingCards, setOutstandingCards] = useState<ProcessedCard[]>([]);
  const [gatheredCards, setGatheredCards] = useState<ProcessedCard[]>([]);
  const [progressStats, setProgressStats] = useState({
    totalRequiredCards: 0,
    totalGatheredCards: 0,
    totalOutstandingCards: 0,
    neededCards: 0,
    exactCards: 0,
    surplusCards: 0,
    completionPercentage: 0,
    totalUniqueCards: 0,
    totalCollectionValue: 0,
    totalOutstandingValue: 0
  });
  const [exportCopied, setExportCopied] = useState(false);
  const [priceUpdateStatus, setPriceUpdateStatus] = useState(PriceUpdateService.getStatus());

  const formatPrice = (price: number): string => {
    return `$${price.toFixed(2)}`;
  };

  const handleRefreshPrices = async () => {
    await PriceUpdateService.updateStaleCards();
    // Reload dashboard data to show updated prices
    loadDashboardData();
  };

  const handleGetPrices = async () => {
    try {
      console.log('🔄 Fetching latest prices...');
      
      // Get all unique card names from the current data
      const cardNamesSet = new Set<string>();
      outstandingCards.forEach(card => cardNamesSet.add(card.card_name));
      gatheredCards.forEach(card => cardNamesSet.add(card.card_name));
      
      if (cardNamesSet.size === 0) {
        alert('No cards found to update prices for');
        return;
      }

      // Convert Set to Array without spread operator
      const cardNamesArray: string[] = [];
      cardNamesSet.forEach(name => cardNamesArray.push(name));
      
      console.log(`📊 Found ${cardNamesArray.length} unique cards, fetching prices...`);
      
      // Use the PriceUpdateService to refresh metadata for these cards
      await PriceUpdateService.refreshCardsMetadata(cardNamesArray);
      
      // Reload dashboard data to show updated prices
      loadDashboardData();
      
      alert(`✅ Prices updated! Refreshed ${cardNamesArray.length} cards.`);
    } catch (error) {
      console.error('❌ Price update failed:', error);
      alert('❌ Price update failed. Check console for details.');
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [outstanding, gathered, stats] = await Promise.all([
        RequirementsService.getOutstandingCards(),
        RequirementsService.getGatheredCards(),
        RequirementsService.getProgressStats()
      ]);

      // Calculate price statistics
      const totalCollectionValue = gathered.reduce((total, card) => {
        const price = card.metadata?.price_tix || 0;
        return total + (price * card.gathered_quantity);
      }, 0);

      const totalOutstandingValue = outstanding.reduce((total, card) => {
        const price = card.metadata?.price_tix || 0;
        return total + (price * card.outstanding_quantity);
      }, 0);

      setOutstandingCards(outstanding);
      setGatheredCards(gathered);
      setProgressStats({
        ...stats,
        totalCollectionValue,
        totalOutstandingValue
      });

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  const handleExportMissingCards = async () => {
    try {
      // Filter cards that are still needed (outstanding_quantity > 0)
      const missingCards = outstandingCards.filter(card => card.outstanding_quantity > 0);
      
      if (missingCards.length === 0) {
        alert('No missing cards to export! Your collection is complete!');
        return;
      }

      // Format as "4 Lightning Bolt" per line
      const exportText = missingCards
        .map(card => `${card.outstanding_quantity} ${card.card_name}`)
        .join('\n');

      // Copy to clipboard
      await navigator.clipboard.writeText(exportText);
      
      setExportCopied(true);
      setTimeout(() => setExportCopied(false), 2000);
    } catch (err) {
      console.error('Failed to export missing cards:', err);
      alert('Failed to copy to clipboard. Please try again.');
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Set up real-time subscriptions for both tables that affect calculations
    const gatheredSubscription = subscribeToChanges('gathered_cards', (payload) => {
      console.log('Real-time update: gathered_cards changed', payload);
      loadDashboardData();
    });

    const requirementCardsSubscription = subscribeToChanges('requirement_cards', (payload) => {
      console.log('Real-time update: requirement_cards changed', payload);
      loadDashboardData();
    });

    const requirementDecksSubscription = subscribeToChanges('requirement_decks', (payload) => {
      console.log('Real-time update: requirement_decks changed', payload);
      loadDashboardData();
    });

    // Subscribe to price update status changes
    const priceUpdateUnsubscribe = PriceUpdateService.onStatusChange((status) => {
      setPriceUpdateStatus(status);
    });

    // Cleanup subscriptions on unmount
    return () => {
      gatheredSubscription.unsubscribe();
      requirementCardsSubscription.unsubscribe();
      requirementDecksSubscription.unsubscribe();
      priceUpdateUnsubscribe();
    };
  }, []);

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Error loading dashboard</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="h-8 w-8 text-blue-600" />
          Collection Dashboard
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportMissingCards}
            disabled={loading || progressStats.neededCards === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Export missing cards list to clipboard"
          >
            {exportCopied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export Missing
              </>
            )}
          </button>
          {/* Show get prices button if there are cards but no collection value */}
          {progressStats.totalUniqueCards > 0 && progressStats.totalCollectionValue === 0 && (
            <button
              onClick={handleGetPrices}
              disabled={loading || priceUpdateStatus.isUpdating}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Fetch prices for all existing cards"
            >
              <DollarSign className={`h-4 w-4 ${priceUpdateStatus.isUpdating ? 'animate-pulse' : ''}`} />
              Get Prices
            </button>
          )}
          <button
            onClick={handleRefreshPrices}
            disabled={loading || priceUpdateStatus.isUpdating}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Refresh card prices from Scryfall"
          >
            <DollarSign className={`h-4 w-4 ${priceUpdateStatus.isUpdating ? 'animate-pulse' : ''}`} />
            {priceUpdateStatus.isUpdating ? 'Updating...' : 'Refresh Prices'}
          </button>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Progress Overview */}
      <ProgressBar
        completionPercentage={progressStats.completionPercentage}
        totalRequiredCards={progressStats.totalRequiredCards}
        totalGatheredCards={progressStats.totalGatheredCards}
        totalOutstandingCards={progressStats.totalOutstandingCards}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{progressStats.neededCards}</div>
          <div className="text-sm text-gray-500">Cards Needed</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{progressStats.exactCards}</div>
          <div className="text-sm text-gray-500">Complete Cards</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{progressStats.surplusCards}</div>
          <div className="text-sm text-gray-500">Surplus Cards</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-gray-800">{progressStats.totalUniqueCards}</div>
          <div className="text-sm text-gray-500">Unique Cards</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-lg font-bold text-green-700">{formatPrice(progressStats.totalCollectionValue)}</div>
          <div className="text-sm text-gray-500">Collection Value</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-lg font-bold text-red-700">{formatPrice(progressStats.totalOutstandingValue)}</div>
          <div className="text-sm text-gray-500">Outstanding Value</div>
        </div>
      </div>

      {/* Cards Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OutstandingCardsTable
          cards={outstandingCards}
          loading={loading}
          className="lg:col-span-1"
        />
        <GatheredCardsTable
          cards={gatheredCards}
          loading={loading}
          className="lg:col-span-1"
        />
      </div>


      {/* No Data State */}
      {!loading && progressStats.totalUniqueCards === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-lg">
          <BarChart3 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No Collection Data</h3>
          <p className="text-gray-500 mb-4">
            Upload requirement decks and contribution files to see your collection progress.
          </p>
          <div className="space-y-2 text-sm text-gray-400">
            <p>1. First, upload target deck requirements to set your goals</p>
            <p>2. Then, upload contribution .dek files to track your progress</p>
            <p>3. Watch your collection rebuild in real-time!</p>
          </div>
        </div>
      )}
    </div>
  );
};
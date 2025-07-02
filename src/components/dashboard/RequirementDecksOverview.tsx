import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Package, Calendar, User, Check, AlertCircle, ChevronUp } from 'lucide-react';
import { DatabaseService } from '../../services/supabase';
import { RequirementsService } from '../../services/requirementsService';
import type { RequirementDeck, RequirementCard } from '../../types/database';
import type { ProcessedCard } from '../../types/cards';

interface DeckWithCards extends RequirementDeck {
  cards: RequirementCard[];
  totalCards: number;
  gatheredCards: number;
  completionPercentage: number;
}

export const RequirementDecksOverview: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [decks, setDecks] = useState<DeckWithCards[]>([]);
  const [expandedDecks, setExpandedDecks] = useState<Set<string>>(new Set());
  const [processedCards, setProcessedCards] = useState<ProcessedCard[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  const loadDecksData = async () => {
    try {
      setLoading(true);
      
      // Get all requirement decks
      const requirementDecks = await DatabaseService.getRequirementDecks();
      
      // Get all requirement cards
      const requirementCards = await DatabaseService.getRequirementCards();
      
      // Get processed cards for status information
      const processed = await RequirementsService.calculateCardStatuses();
      setProcessedCards(processed);
      
      // Group cards by deck and calculate stats
      const decksWithStats: DeckWithCards[] = requirementDecks.map(deck => {
        const deckCards = requirementCards.filter(card => card.deck_id === deck.id);
        const totalCards = deckCards.reduce((sum, card) => sum + card.quantity, 0);
        
        // Calculate gathered cards for this deck
        let gatheredCards = 0;
        deckCards.forEach(card => {
          const processedCard = processed.find(p => p.card_name === card.card_name);
          if (processedCard) {
            gatheredCards += Math.min(card.quantity, processedCard.gathered_quantity);
          }
        });
        
        const completionPercentage = totalCards > 0 ? (gatheredCards / totalCards) * 100 : 0;
        
        return {
          ...deck,
          cards: deckCards,
          totalCards,
          gatheredCards,
          completionPercentage
        };
      });
      
      setDecks(decksWithStats);
    } catch (error) {
      console.error('Error loading requirement decks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDecksData();
  }, []);

  const toggleDeckExpansion = (deckId: string) => {
    const newExpanded = new Set(expandedDecks);
    if (newExpanded.has(deckId)) {
      newExpanded.delete(deckId);
    } else {
      newExpanded.add(deckId);
    }
    setExpandedDecks(newExpanded);
  };

  const getCardStatus = (cardName: string, requiredQuantity: number) => {
    const processedCard = processedCards.find(p => p.card_name === cardName);
    if (!processedCard) return { gathered: 0, status: 'needed' as const };
    
    const gathered = Math.min(processedCard.gathered_quantity, requiredQuantity);
    const status = gathered >= requiredQuantity ? 'complete' : 'needed';
    
    return { gathered, status };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Requirement Decks</h3>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (decks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Requirement Decks</h3>
        <div className="text-center py-8 text-gray-500">
          <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>No requirement decks uploaded yet</p>
          <p className="text-sm">Upload target deck requirements to set your collection goals</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-lg font-semibold text-gray-800 hover:text-gray-600 transition-colors"
        >
          <Package className="h-5 w-5 text-purple-600" />
          Requirement Decks ({decks.length})
          {isExpanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map(deck => (
            <div key={deck.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <div
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => toggleDeckExpansion(deck.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    {expandedDecks.has(deck.id) ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                    {deck.deck_name}
                  </h4>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    deck.completionPercentage === 100 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {deck.completionPercentage.toFixed(1)}%
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {deck.uploaded_by}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(deck.created_at)}
                    </div>
                  </div>

                  <div className="text-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">
                        {deck.gatheredCards}/{deck.totalCards} cards
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          deck.completionPercentage === 100 ? 'bg-green-600' : 'bg-blue-600'
                        }`}
                        style={{ width: `${deck.completionPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {expandedDecks.has(deck.id) && (
                <div className="border-t border-gray-200 p-4 bg-gray-50 max-h-64 overflow-y-auto">
                  <div className="space-y-1">
                    {deck.cards.map(card => {
                      const { gathered, status } = getCardStatus(card.card_name, card.quantity);
                      return (
                        <div
                          key={card.id}
                          className="flex items-center justify-between text-sm py-1"
                        >
                          <span className={`${status === 'complete' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                            {card.quantity}x {card.card_name}
                          </span>
                          <div className="flex items-center gap-2">
                            {status === 'complete' ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <span className="text-xs text-gray-500">{gathered}/{card.quantity}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
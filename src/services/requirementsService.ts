import { DatabaseService, supabase } from './supabase';
import type { ProcessedCard } from '../types/cards';

export class RequirementsService {
  
  static async calculateCardStatuses(): Promise<ProcessedCard[]> {
    try {
      // Get all requirement cards and gathered cards
      const [requirementCards, gatheredCards] = await Promise.all([
        DatabaseService.getRequirementCards(),
        DatabaseService.getGatheredCards()
      ]);

      // Calculate MAX quantity required for each card across all requirement decks
      const requirementMap = new Map<string, number>();
      requirementCards.forEach(card => {
        const currentMax = requirementMap.get(card.card_name) || 0;
        requirementMap.set(card.card_name, Math.max(currentMax, card.quantity));
      });

      // Calculate total gathered quantity for each card
      const gatheredMap = new Map<string, { quantity: number; contributors: Array<{ name: string; quantity: number; deck_filename: string }> }>();
      gatheredCards.forEach(card => {
        const existing = gatheredMap.get(card.card_name) || { quantity: 0, contributors: [] };
        existing.quantity += card.quantity;
        existing.contributors.push({
          name: card.contributor_name,
          quantity: card.quantity,
          deck_filename: card.deck_filename
        });
        gatheredMap.set(card.card_name, existing);
      });

      // Combine all unique card names
      const allCardNames = new Set<string>();
      requirementMap.forEach((_, cardName) => allCardNames.add(cardName));
      gatheredMap.forEach((_, cardName) => allCardNames.add(cardName));

      // Fetch metadata for all cards
      console.log(`🔍 [DEBUG] Fetching metadata for ${allCardNames.size} unique cards...`);
      const { data: metadataRows, error: metadataError } = await supabase
        .from('card_metadata')
        .select('*')
        .in('card_name', Array.from(allCardNames));
      
      if (metadataError) {
        console.error('❌ [DEBUG] Error fetching card metadata:', metadataError);
      } else {
        console.log(`📊 [DEBUG] Found metadata for ${metadataRows?.length || 0} cards:`, 
          metadataRows?.map(m => ({ name: m.card_name, price: m.price_tix })).slice(0, 5)
        );
      }
      
      // Create metadata map for quick lookup
      const metadataMap = new Map();
      metadataRows?.forEach(metadata => {
        metadataMap.set(metadata.card_name, metadata);
      });

      // Calculate status for each card
      const processedCards: ProcessedCard[] = Array.from(allCardNames).map(cardName => {
        const requiredQuantity = requirementMap.get(cardName) || 0;
        const gatheredData = gatheredMap.get(cardName) || { quantity: 0, contributors: [] };
        const gatheredQuantity = gatheredData.quantity;
        const outstandingQuantity = requiredQuantity - gatheredQuantity;

        let status: ProcessedCard['status'];
        if (outstandingQuantity > 0) {
          status = 'needed';
        } else if (outstandingQuantity === 0) {
          status = 'exact';
        } else {
          status = 'surplus';
        }

        const metadata = metadataMap.get(cardName);
        
        return {
          card_name: cardName,
          required_quantity: requiredQuantity,
          gathered_quantity: gatheredQuantity,
          outstanding_quantity: outstandingQuantity,
          status,
          metadata: metadata || undefined,
          contributors: gatheredData.contributors
        };
      });

      // Sort by status priority (needed first, then exact, then surplus) and then by card name
      return processedCards.sort((a, b) => {
        const statusOrder = { needed: 0, exact: 1, surplus: 2 };
        if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status];
        }
        return a.card_name.localeCompare(b.card_name);
      });

    } catch (error) {
      console.error('Error calculating card statuses:', error);
      throw error;
    }
  }

  static async getOutstandingCards(): Promise<ProcessedCard[]> {
    const allCards = await this.calculateCardStatuses();
    return allCards.filter(card => card.status === 'needed');
  }

  static async getGatheredCards(): Promise<ProcessedCard[]> {
    const allCards = await this.calculateCardStatuses();
    return allCards.filter(card => card.gathered_quantity > 0);
  }

  static async getProgressStats() {
    const allCards = await this.calculateCardStatuses();
    
    const totalRequiredCards = allCards.reduce((sum, card) => sum + card.required_quantity, 0);
    const totalGatheredCards = allCards.reduce((sum, card) => sum + card.gathered_quantity, 0);
    const totalOutstandingCards = allCards.reduce((sum, card) => sum + Math.max(0, card.outstanding_quantity), 0);
    
    const neededCards = allCards.filter(card => card.status === 'needed').length;
    const exactCards = allCards.filter(card => card.status === 'exact').length;
    const surplusCards = allCards.filter(card => card.status === 'surplus').length;
    
    const completionPercentage = totalRequiredCards > 0 
      ? Math.round(((totalRequiredCards - totalOutstandingCards) / totalRequiredCards) * 100)
      : 0;

    return {
      totalRequiredCards,
      totalGatheredCards,
      totalOutstandingCards,
      neededCards,
      exactCards,
      surplusCards,
      completionPercentage,
      totalUniqueCards: allCards.length
    };
  }

  static async getRequirementDecks() {
    const { data, error } = await supabase
      .from('requirement_decks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching requirement decks:', error);
      throw error;
    }
    
    return data || [];
  }

  static async deleteRequirementDeck(deckId: string) {
    // Delete requirement cards first (foreign key constraint)
    await supabase
      .from('requirement_cards')
      .delete()
      .eq('deck_id', deckId);

    // Then delete the deck
    const { error } = await supabase
      .from('requirement_decks')
      .delete()
      .eq('id', deckId);
    
    if (error) {
      console.error('Error deleting requirement deck:', error);
      throw error;
    }
  }
}
import { supabase } from './supabase';

interface ScryfallCard {
  object: string;
  id: string;
  name: string;
  set: string;
  prices: {
    usd?: string | null;
    usd_foil?: string | null;
    eur?: string | null;
    tix?: string | null;
  };
}

interface ScryfallSearchResponse {
  object: string;
  total_cards: number;
  has_more: boolean;
  data: ScryfallCard[];
}

interface CardPriceUpdate {
  card_name: string;
  set_code: string;
  price_tix: number | null;
}

class ScryfallPriceService {
  private static readonly BASE_URL = 'https://api.scryfall.com';
  private static readonly RATE_LIMIT_DELAY = 100; // 100ms between requests (10 requests/second)
  private static readonly CACHE_DURATION_HOURS = 24;
  private static lastRequestTime = 0;

  /**
   * Enforces rate limiting by delaying if necessary
   */
  private static async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
      await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_DELAY - timeSinceLastRequest));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Fetches card price from Scryfall API
   */
  static async fetchCardPrice(cardName: string, setCode?: string): Promise<number | null> {
    try {
      await this.enforceRateLimit();

      // Build search query
      let query = `name:"${cardName}"`;
      if (setCode) {
        query += ` set:${setCode}`;
      }

      const url = `${this.BASE_URL}/cards/search?q=${encodeURIComponent(query)}`;
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`Card not found: ${cardName} (${setCode})`);
          return null;
        }
        throw new Error(`Scryfall API error: ${response.status}`);
      }

      const data: ScryfallSearchResponse = await response.json();
      
      if (data.data.length === 0) {
        console.log(`No results for card: ${cardName} (${setCode})`);
        return null;
      }

      // Get the first matching card
      const card = data.data[0];
      
      // Extract tix price and convert to number
      if (card.prices.tix) {
        const price = parseFloat(card.prices.tix);
        return isNaN(price) ? null : price;
      }

      return null;
    } catch (error) {
      console.error(`Error fetching price for ${cardName}:`, error);
      return null;
    }
  }

  /**
   * Fetches prices for multiple cards in batches
   */
  static async fetchBatchPrices(cards: Array<{ card_name: string; set_code?: string }>): Promise<CardPriceUpdate[]> {
    const results: CardPriceUpdate[] = [];

    for (const card of cards) {
      const price = await this.fetchCardPrice(card.card_name, card.set_code);
      results.push({
        card_name: card.card_name,
        set_code: card.set_code || '',
        price_tix: price
      });
    }

    return results;
  }

  /**
   * Checks if prices need updating based on last update time
   */
  static async getStaleCards(limit: number = 100): Promise<Array<{ card_name: string; set_code: string }>> {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - this.CACHE_DURATION_HOURS);

    const { data, error } = await supabase
      .from('card_metadata')
      .select('card_name, set_code')
      .or(`last_price_update.is.null,last_price_update.lt.${cutoffTime.toISOString()}`)
      .limit(limit);

    if (error) {
      console.error('Error fetching stale cards:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Updates card prices in the database
   */
  static async updateCardPrices(priceUpdates: CardPriceUpdate[]): Promise<void> {
    const updates = priceUpdates.map(update => ({
      card_name: update.card_name,
      set_code: update.set_code,
      price_tix: update.price_tix,
      last_price_update: new Date().toISOString()
    }));

    // Update in batches to avoid database limits
    const batchSize = 50;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('card_metadata')
        .upsert(batch, {
          onConflict: 'card_name,set_code',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('Error updating card prices:', error);
      }
    }
  }

  /**
   * Refreshes prices for all stale cards
   */
  static async refreshStalePrices(): Promise<number> {
    let totalUpdated = 0;
    let hasMore = true;

    while (hasMore) {
      const staleCards = await this.getStaleCards(50);
      
      if (staleCards.length === 0) {
        hasMore = false;
        break;
      }

      const priceUpdates = await this.fetchBatchPrices(staleCards);
      await this.updateCardPrices(priceUpdates);
      
      totalUpdated += priceUpdates.length;
      
      // Add a small delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return totalUpdated;
  }

  /**
   * Gets price for a specific card from cache or fetches if needed
   */
  static async getCardPrice(cardName: string, setCode?: string): Promise<number | null> {
    // First check cache
    const { data } = await supabase
      .from('card_metadata')
      .select('price_tix, last_price_update')
      .eq('card_name', cardName)
      .eq('set_code', setCode || '')
      .single();

    if (data && data.price_tix !== null && data.last_price_update) {
      const lastUpdate = new Date(data.last_price_update);
      const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceUpdate < this.CACHE_DURATION_HOURS) {
        return data.price_tix;
      }
    }

    // Fetch fresh price
    const price = await this.fetchCardPrice(cardName, setCode);
    
    // Update cache
    if (price !== null) {
      await this.updateCardPrices([{
        card_name: cardName,
        set_code: setCode || '',
        price_tix: price
      }]);
    }

    return price;
  }
}

export default ScryfallPriceService;
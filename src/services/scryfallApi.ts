import { supabase } from './supabase';
import ScryfallPriceService from './scryfallPriceService';
import type { CardMetadata } from '../types/database';

interface ScryfallCard {
  object: string;
  id: string;
  name: string;
  set: string;
  set_name?: string;
  mana_cost?: string;
  type_line?: string;
  rarity?: string;
  colors?: string[];
  image_uris?: {
    normal?: string;
    small?: string;
    png?: string;
  };
  card_faces?: Array<{
    image_uris?: {
      normal?: string;
      small?: string;
      png?: string;
    };
  }>;
  prices?: {
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

class ScryfallApiService {
  private static readonly BASE_URL = 'https://api.scryfall.com';
  private static readonly RATE_LIMIT_DELAY = 100; // 100ms between requests (10 requests/second)
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
   * Finds the best MTGO printing of a card by searching all printings
   */
  static async findBestMtgoPrintingForCard(cardName: string): Promise<ScryfallCard | null> {
    try {
      console.log(`🔍 [ROBUST] Searching all printings for MTGO price: ${cardName}`);
      await this.enforceRateLimit();

      // Search all printings ordered by MTGO price (cards with prices first)
      const query = `name:"${cardName}"`;
      const params = new URLSearchParams({
        q: query,
        unique: 'prints',
        order: 'tix'
      });

      const url = `${this.BASE_URL}/cards/search?${params.toString()}`;
      console.log(`📡 [ROBUST] API URL: ${url}`);
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`[ROBUST] Card not found: ${cardName}`);
          return null;
        }
        throw new Error(`Scryfall API error: ${response.status}`);
      }

      const data: ScryfallSearchResponse = await response.json();
      console.log(`📊 [ROBUST] Found ${data.total_cards} printings for ${cardName}`);
      
      if (data.data.length === 0) {
        console.log(`[ROBUST] No printings found for: ${cardName}`);
        return null;
      }

      // Look for the first printing with a valid MTGO price
      for (const card of data.data) {
        const tixPrice = card.prices?.tix;
        if (tixPrice && tixPrice !== '0.00' && !isNaN(parseFloat(tixPrice))) {
          console.log(`✅ [ROBUST] Found MTGO price for ${cardName}: ${tixPrice} tix from set ${card.set.toUpperCase()}`);
          return card;
        }
      }

      console.log(`⚠️ [ROBUST] No MTGO prices found across ${data.total_cards} printings of ${cardName}`);
      return data.data[0]; // Return first printing even without price for metadata
    } catch (error) {
      console.error(`[ROBUST] Error searching all printings for ${cardName}:`, error);
      return null;
    }
  }

  /**
   * Fetches card data from Scryfall API including metadata and prices
   */
  static async fetchCardData(cardName: string, setCode?: string): Promise<ScryfallCard | null> {
    try {
      console.log(`🔍 [DEBUG] Fetching card data for: ${cardName} (set: ${setCode || 'any'})`);
      await this.enforceRateLimit();

      // Build search query
      let query = `name:"${cardName}"`;
      if (setCode) {
        query += ` set:${setCode}`;
      }

      const url = `${this.BASE_URL}/cards/search?q=${encodeURIComponent(query)}`;
      console.log(`📡 [DEBUG] API URL: ${url}`);
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`Card not found: ${cardName} (${setCode})`);
          return null;
        }
        throw new Error(`Scryfall API error: ${response.status}`);
      }

      const data: ScryfallSearchResponse = await response.json();
      console.log(`📊 [DEBUG] API Response for ${cardName}:`, {
        total_cards: data.total_cards,
        has_results: data.data.length > 0,
        first_card_name: data.data[0]?.name,
        first_card_prices: data.data[0]?.prices
      });
      
      if (data.data.length === 0) {
        console.log(`No results for card: ${cardName} (${setCode})`);
        return null;
      }

      // Return the first matching card
      return data.data[0];
    } catch (error) {
      console.error(`Error fetching card data for ${cardName}:`, error);
      return null;
    }
  }

  /**
   * Extracts image URI from Scryfall card data
   */
  private static getImageUri(card: ScryfallCard): string {
    // Try regular image_uris first
    if (card.image_uris?.normal) {
      return card.image_uris.normal;
    }
    
    // For double-faced cards, use the first face
    if (card.card_faces && card.card_faces.length > 0 && card.card_faces[0].image_uris?.normal) {
      return card.card_faces[0].image_uris.normal;
    }
    
    // Fallback to a placeholder
    return '';
  }

  /**
   * Converts Scryfall card data to our CardMetadata format
   */
  private static convertToCardMetadata(card: ScryfallCard): Partial<CardMetadata> {
    const price_tix = card.prices?.tix ? parseFloat(card.prices.tix) : null;
    
    console.log(`💰 [DEBUG] Converting ${card.name} prices:`, {
      raw_tix: card.prices?.tix,
      parsed_tix: price_tix,
      is_valid: !isNaN(price_tix!)
    });
    
    const metadata = {
      card_name: card.name,
      mana_cost: card.mana_cost || '',
      type_line: card.type_line || '',
      rarity: card.rarity || 'common',
      colors: card.colors || [],
      set_code: card.set.toUpperCase(),
      scryfall_id: card.id,
      image_uri: this.getImageUri(card),
      price_tix: isNaN(price_tix!) ? null : price_tix,
      last_price_update: new Date().toISOString()
    };
    
    console.log(`📦 [DEBUG] Final metadata for ${card.name}:`, metadata);
    return metadata;
  }

  /**
   * Fetches or updates card metadata including price
   */
  static async fetchOrUpdateCardMetadata(cardName: string, setCode?: string): Promise<CardMetadata | null> {
    // First check if we have cached metadata
    const { data: existingData } = await supabase
      .from('card_metadata')
      .select('*')
      .eq('card_name', cardName)
      .maybeSingle();

    // If we have data and it's recent (less than 24 hours old for price), return it
    if (existingData && existingData.last_price_update) {
      const lastUpdate = new Date(existingData.last_price_update);
      const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceUpdate < 24) {
        return existingData as CardMetadata;
      }
    }

    // Fetch fresh data from Scryfall
    const scryfallCard = await this.fetchCardData(cardName, setCode);
    
    if (!scryfallCard) {
      return null;
    }

    const metadata = this.convertToCardMetadata(scryfallCard);

    // Upsert the metadata
    console.log(`💾 [DEBUG] Upserting metadata for ${cardName}:`, metadata);
    const { data, error } = await supabase
      .from('card_metadata')
      .upsert(metadata as CardMetadata, {
        onConflict: 'card_name,set_code',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('❌ [DEBUG] Error upserting card metadata:', error);
      return null;
    }

    console.log(`✅ [DEBUG] Successfully upserted metadata for ${cardName}:`, data);
    return data as CardMetadata;
  }

  /**
   * Batch fetch metadata for multiple cards
   */
  static async fetchBatchMetadata(cards: Array<{ card_name: string; set_code?: string }>): Promise<CardMetadata[]> {
    const results: CardMetadata[] = [];

    for (const card of cards) {
      const metadata = await this.fetchOrUpdateCardMetadata(card.card_name, card.set_code);
      if (metadata) {
        results.push(metadata);
      }
      
      // Add a small delay between cards to respect rate limits
      if (cards.indexOf(card) < cards.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  /**
   * Refreshes price data for all cards that need updates
   */
  static async refreshAllPrices(): Promise<number> {
    return ScryfallPriceService.refreshStalePrices();
  }
}

export default ScryfallApiService;
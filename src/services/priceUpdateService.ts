import ScryfallApiService from './scryfallApi';
import ScryfallPriceService from './scryfallPriceService';
import { supabase } from './supabase';

interface PriceUpdateStatus {
  isUpdating: boolean;
  lastUpdate: Date | null;
  updatedCount: number;
  totalCount: number;
  errors: string[];
}

class PriceUpdateService {
  private static updateStatus: PriceUpdateStatus = {
    isUpdating: false,
    lastUpdate: null,
    updatedCount: 0,
    totalCount: 0,
    errors: []
  };

  private static listeners: Array<(status: PriceUpdateStatus) => void> = [];

  /**
   * Subscribe to price update status changes
   */
  static onStatusChange(callback: (status: PriceUpdateStatus) => void): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of status changes
   */
  private static notifyListeners() {
    this.listeners.forEach(listener => listener({ ...this.updateStatus }));
  }

  /**
   * Get current update status
   */
  static getStatus(): PriceUpdateStatus {
    return { ...this.updateStatus };
  }

  /**
   * Check if prices need updating and automatically update them
   */
  static async updateStaleCards(): Promise<number> {
    if (this.updateStatus.isUpdating) {
      console.log('Price update already in progress');
      return 0;
    }

    try {
      this.updateStatus.isUpdating = true;
      this.updateStatus.errors = [];
      this.updateStatus.updatedCount = 0;
      this.notifyListeners();

      const updatedCount = await ScryfallPriceService.refreshStalePrices();
      
      this.updateStatus.updatedCount = updatedCount;
      this.updateStatus.lastUpdate = new Date();
      this.updateStatus.isUpdating = false;
      this.notifyListeners();

      if (updatedCount > 0) {
        console.log(`✅ Updated prices for ${updatedCount} cards`);
      } else {
        console.log('✅ All card prices are up to date');
      }

      return updatedCount;
    } catch (error) {
      console.error('❌ Error updating card prices:', error);
      this.updateStatus.errors.push(error instanceof Error ? error.message : 'Unknown error');
      this.updateStatus.isUpdating = false;
      this.notifyListeners();
      return 0;
    }
  }

  /**
   * Force refresh prices for specific cards
   */
  static async refreshCardsMetadata(cardNames: string[]): Promise<number> {
    if (this.updateStatus.isUpdating) {
      console.log('Price update already in progress');
      return 0;
    }

    try {
      this.updateStatus.isUpdating = true;
      this.updateStatus.errors = [];
      this.updateStatus.updatedCount = 0;
      this.updateStatus.totalCount = cardNames.length;
      this.notifyListeners();

      let updatedCount = 0;

      console.log(`🎯 [DEBUG] Starting to process ${cardNames.length} cards:`, cardNames.slice(0, 5));
      
      for (const cardName of cardNames) {
        try {
          console.log(`⚡ [DEBUG] Processing card: ${cardName}`);
          const metadata = await ScryfallApiService.fetchOrUpdateCardMetadata(cardName);
          if (metadata) {
            console.log(`✅ [DEBUG] Got metadata for ${cardName}:`, {
              price_tix: metadata.price_tix,
              last_update: metadata.last_price_update
            });
            updatedCount++;
            this.updateStatus.updatedCount = updatedCount;
            this.notifyListeners();
          } else {
            console.log(`❌ [DEBUG] No metadata returned for ${cardName}`);
          }
          
          // Small delay between requests to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.warn(`❌ [DEBUG] Failed to update metadata for ${cardName}:`, error);
          this.updateStatus.errors.push(`Failed to update ${cardName}`);
        }
      }

      this.updateStatus.lastUpdate = new Date();
      this.updateStatus.isUpdating = false;
      this.notifyListeners();

      console.log(`✅ Updated metadata for ${updatedCount}/${cardNames.length} cards`);
      return updatedCount;
    } catch (error) {
      console.error('❌ Error refreshing card metadata:', error);
      this.updateStatus.errors.push(error instanceof Error ? error.message : 'Unknown error');
      this.updateStatus.isUpdating = false;
      this.notifyListeners();
      return 0;
    }
  }

  /**
   * Auto-update prices on app load if they're stale
   */
  static async initializeAppPrices(): Promise<void> {
    console.log('🔄 Checking for stale card prices...');
    
    try {
      // Check how many cards have stale prices
      const staleCards = await ScryfallPriceService.getStaleCards(10);
      
      if (staleCards.length > 0) {
        console.log(`📊 Found ${staleCards.length} cards with stale prices, updating...`);
        await this.updateStaleCards();
      } else {
        console.log('✅ All card prices are up to date');
      }
    } catch (error) {
      console.error('❌ Error during price initialization:', error);
    }
  }

  /**
   * Update prices for cards when they're first added to the database
   */
  static async updatePricesForNewCards(cardNames: string[]): Promise<void> {
    if (cardNames.length === 0) return;

    console.log(`📊 Fetching prices for ${cardNames.length} new cards...`);
    
    // Filter out cards that already have recent price data
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - 24);

    const { data: existingCards } = await supabase
      .from('card_metadata')
      .select('card_name, last_price_update')
      .in('card_name', cardNames)
      .gte('last_price_update', cutoffTime.toISOString());

    const existingCardNames = new Set(existingCards?.map(c => c.card_name) || []);
    const cardsNeedingPrices = cardNames.filter(name => !existingCardNames.has(name));

    if (cardsNeedingPrices.length > 0) {
      console.log(`📊 Updating prices for ${cardsNeedingPrices.length} cards without recent prices`);
      await this.refreshCardsMetadata(cardsNeedingPrices);
    }
  }

  /**
   * Schedule periodic price updates
   */
  static schedulePeriodicUpdates(): () => void {
    console.log('⏰ Scheduling periodic price updates (every 6 hours)');
    
    const interval = setInterval(async () => {
      console.log('⏰ Running scheduled price update...');
      await this.updateStaleCards();
    }, 6 * 60 * 60 * 1000); // Every 6 hours

    // Return cleanup function
    return () => {
      console.log('⏰ Cleaning up scheduled price updates');
      clearInterval(interval);
    };
  }
}

export default PriceUpdateService;
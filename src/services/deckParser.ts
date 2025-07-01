import { XMLParser } from 'fast-xml-parser';
import { TxtParser } from './txtParser';
import type { ParsedDeck, ParsedDeckCard } from '../types/cards';

export class DeckParser {
  private static xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseTagValue: true,
    parseAttributeValue: true,
    trimValues: true
  });

  /**
   * Parse deck file based on format detection
   */
  static async parseFile(file: File): Promise<ParsedDeck> {
    const extension = file.name.toLowerCase().split('.').pop();
    
    switch (extension) {
      case 'dek':
        return this.parseDekFile(file);
      case 'txt':
        return TxtParser.parseFile(file);
      default:
        throw new Error(`Unsupported file format: .${extension}`);
    }
  }

  /**
   * Validate file before parsing
   */
  static validateFile(file: File): { valid: boolean; error?: string } {
    const extension = file.name.toLowerCase().split('.').pop();
    
    // Check file extension
    if (!['dek', 'txt'].includes(extension || '')) {
      return { valid: false, error: 'File must have .dek or .txt extension' };
    }

    // Check file size (reasonable limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { valid: false, error: 'File too large (max 5MB)' };
    }

    if (file.size === 0) {
      return { valid: false, error: 'File is empty' };
    }

    return { valid: true };
  }

  /**
   * Parse MTGO .dek file content (XML format)
   * 
   * MTGO .dek format structure:
   * <Deck xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
   *   <Cards>
   *     <Card>
   *       <Quantity>4</Quantity>
   *       <Name>Lightning Bolt</Name>
   *     </Card>
   *     <Card>
   *       <Quantity>2</Quantity>
   *       <Name>Counterspell</Name>
   *     </Card>
   *   </Cards>
   * </Deck>
   */
  static parseDekContent(xmlContent: string, filename: string = 'unknown.dek'): ParsedDeck {
    const result: ParsedDeck = {
      cards: [],
      errors: [],
      filename,
      totalCards: 0
    };

    try {
      // Clean up the XML content
      const cleanedXml = xmlContent.trim();
      
      if (!cleanedXml) {
        result.errors.push('File is empty');
        return result;
      }

      // Parse XML
      const parsed = this.xmlParser.parse(cleanedXml);
      
      // Check for basic deck structure
      if (!parsed.Deck) {
        result.errors.push('Invalid .dek file format: No Deck element found');
        return result;
      }

      const deck = parsed.Deck;
      
      // Handle different XML structures
      let cards;
      if (deck.Cards) {
        // Check if Cards is an array (attribute format) or has a Card property (element format)
        if (Array.isArray(deck.Cards)) {
          cards = deck.Cards;
        } else if (deck.Cards.Card) {
          cards = deck.Cards.Card;
        } else {
          // Single card in Cards element
          cards = deck.Cards;
        }
      } else if (deck.Card) {
        // Sometimes cards are directly under Deck
        cards = deck.Card;
      } else {
        result.errors.push('No cards found in deck file');
        return result;
      }

      // Handle both single card and array of cards
      const cardArray = Array.isArray(cards) ? cards : [cards];

      // Process each card
      cardArray.forEach((card: any, index: number) => {
        try {
          const cardResult = this.parseCard(card, index);
          if (cardResult.success) {
            result.cards.push(cardResult.card!);
            result.totalCards += cardResult.card!.quantity;
          } else if (cardResult.error && !cardResult.error.includes('Skipping sideboard card')) {
            // Only add real errors, not sideboard skips
            result.errors.push(cardResult.error!);
          }
        } catch (error) {
          result.errors.push(`Card ${index + 1}: Unexpected error - ${error}`);
        }
      });

      // Consolidate duplicate cards
      const cardMap = new Map<string, number>();
      result.cards.forEach(card => {
        const currentQuantity = cardMap.get(card.name) || 0;
        cardMap.set(card.name, currentQuantity + card.quantity);
      });
      
      // Convert back to array
      result.cards = Array.from(cardMap.entries()).map(([name, quantity]) => ({
        name,
        quantity
      }));
      
      // Recalculate total cards after consolidation
      result.totalCards = result.cards.reduce((sum, card) => sum + card.quantity, 0);
      
      // Sort cards alphabetically
      result.cards.sort((a, b) => a.name.localeCompare(b.name));

    } catch (error) {
      result.errors.push(`XML parse error: ${error}`);
    }

    return result;
  }

  /**
   * Parse individual card from XML structure
   */
  private static parseCard(card: any, index: number): { success: boolean; card?: ParsedDeckCard; error?: string } {
    try {
      // Ensure card object exists
      if (!card || typeof card !== 'object') {
        return { success: false, error: `Card ${index + 1}: Invalid card structure` };
      }

      // Skip sideboard cards if they have a Sideboard attribute set to true
      // Only skip if explicitly true (not false or missing)
      if (card['@_Sideboard'] === true || card['@_Sideboard'] === 'true') {
        return { success: false, error: `Skipping sideboard card` };
      }

      // Handle different XML structures for card data
      let quantity: number;
      let name: string;

      // Try different quantity field names (including attribute format)
      if (card.Quantity !== undefined) {
        quantity = parseInt(String(card.Quantity));
      } else if (card.quantity !== undefined) {
        quantity = parseInt(String(card.quantity));
      } else if (card['@_quantity'] !== undefined) {
        quantity = parseInt(String(card['@_quantity']));
      } else if (card['@_Quantity'] !== undefined) {
        // Capital Q for attribute format
        quantity = parseInt(String(card['@_Quantity']));
      } else {
        return { success: false, error: `Card ${index + 1}: Missing quantity` };
      }

      // Try different name field names (including attribute format)
      if (card.Name !== undefined) {
        name = String(card.Name).trim();
      } else if (card.name !== undefined) {
        name = String(card.name).trim();
      } else if (card.n !== undefined) {
        // Handle <n> tag format
        name = String(card.n).trim();
      } else if (card['@_name'] !== undefined) {
        name = String(card['@_name']).trim();
      } else if (card['@_Name'] !== undefined) {
        // Capital N for attribute format
        name = String(card['@_Name']).trim();
      } else {
        return { success: false, error: `Card ${index + 1}: Missing card name` };
      }

      // Validate data
      if (!name) {
        return { success: false, error: `Card ${index + 1}: Empty card name` };
      }

      if (isNaN(quantity) || quantity <= 0) {
        return { success: false, error: `Card ${index + 1} (${name}): Invalid quantity` };
      }

      // Clean up card name (remove extra whitespace, normalize)
      name = this.cleanCardName(name);

      return {
        success: true,
        card: { name, quantity }
      };

    } catch (error) {
      return { success: false, error: `Card ${index + 1}: Parse error - ${error}` };
    }
  }

  /**
   * Clean and normalize card names
   */
  private static cleanCardName(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, ' ')  // Replace multiple whitespace with single space
      .replace(/[""]/g, '"')   // Normalize quotes
      .replace(/['']/g, "'");  // Normalize apostrophes
  }

  /**
   * Parse a .dek file using the File API
   */
  private static async parseDekFile(file: File): Promise<ParsedDeck> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const result = this.parseDekContent(content, file.name);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to process file: ${error}`));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file, 'utf-8');
    });
  }


  /**
   * Create a sample .dek file content for testing
   */
  static createSampleDek(): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<Deck xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Cards>
    <Card>
      <Quantity>4</Quantity>
      <Name>Lightning Bolt</Name>
    </Card>
    <Card>
      <Quantity>4</Quantity>
      <Name>Counterspell</Name>
    </Card>
    <Card>
      <Quantity>2</Quantity>
      <Name>Force of Will</Name>
    </Card>
    <Card>
      <Quantity>1</Quantity>
      <Name>Black Lotus</Name>
    </Card>
  </Cards>
</Deck>`;
  }

  /**
   * Generate statistics from parsed deck
   */
  static generateStats(deck: ParsedDeck): {
    totalCards: number;
    uniqueCards: number;
    averageQuantity: number;
    hasErrors: boolean;
  } {
    const totalCards = deck.cards.reduce((sum, card) => sum + card.quantity, 0);
    const uniqueCards = deck.cards.length;
    const averageQuantity = uniqueCards > 0 ? Math.round((totalCards / uniqueCards) * 100) / 100 : 0;
    
    return {
      totalCards,
      uniqueCards,
      averageQuantity,
      hasErrors: deck.errors.length > 0
    };
  }
}

// Export with old name for backward compatibility
export const DekParser = DeckParser;
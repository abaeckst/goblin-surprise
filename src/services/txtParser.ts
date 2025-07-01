import type { ParsedDeck, ParsedDeckCard } from '../types/cards';

export class TxtParser {
  /**
   * Parse MTGO .txt file content
   * 
   * Format:
   * <quantity> <card name>
   * 
   * Example:
   * 4 Lightning Bolt
   * 2 Counterspell
   * 
   * Empty line indicates start of sideboard (which we skip)
   */
  static parseTxtContent(txtContent: string, filename: string = 'unknown.txt'): ParsedDeck {
    const result: ParsedDeck = {
      cards: [],
      errors: [],
      filename,
      totalCards: 0
    };

    try {
      const lines = txtContent.split('\n');
      let inSideboard = false;
      let hasSeenEmptyLine = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip empty lines, but track if we've seen one (indicates sideboard)
        if (!line) {
          if (!hasSeenEmptyLine && result.cards.length > 0) {
            hasSeenEmptyLine = true;
            inSideboard = true;
          }
          continue;
        }

        // Skip sideboard cards
        if (inSideboard) {
          continue;
        }

        // Parse the line
        const parseResult = this.parseLine(line, i + 1);
        if (parseResult.success && parseResult.card) {
          result.cards.push(parseResult.card);
          result.totalCards += parseResult.card.quantity;
        } else if (parseResult.error) {
          result.errors.push(parseResult.error);
        }
      }

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

      if (result.cards.length === 0 && result.errors.length === 0) {
        result.errors.push('No valid cards found in file');
      }

    } catch (error) {
      result.errors.push(`Parse error: ${error}`);
    }

    return result;
  }

  /**
   * Parse individual line from .txt file
   */
  private static parseLine(line: string, lineNumber: number): { success: boolean; card?: ParsedDeckCard; error?: string } {
    try {
      // Match pattern: <quantity> <card name>
      const match = line.match(/^(\d+)\s+(.+)$/);
      
      if (!match) {
        // Skip lines that don't match the pattern (could be comments or headers)
        return { success: false };
      }

      const quantity = parseInt(match[1], 10);
      const name = match[2].trim();

      // Validate quantity
      if (isNaN(quantity) || quantity <= 0) {
        return { success: false, error: `Line ${lineNumber}: Invalid quantity "${match[1]}"` };
      }

      // Validate name
      if (!name) {
        return { success: false, error: `Line ${lineNumber}: Empty card name` };
      }

      // Clean up card name
      const cleanedName = this.cleanCardName(name);

      return {
        success: true,
        card: { name: cleanedName, quantity }
      };

    } catch (error) {
      return { success: false, error: `Line ${lineNumber}: Parse error - ${error}` };
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
   * Parse a file using the File API
   */
  static async parseFile(file: File): Promise<ParsedDeck> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const result = this.parseTxtContent(content, file.name);
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
   * Validate file before parsing
   */
  static validateFile(file: File): { valid: boolean; error?: string } {
    // Check file extension
    if (!file.name.toLowerCase().endsWith('.txt')) {
      return { valid: false, error: 'File must have .txt extension' };
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
   * Create a sample .txt file content for testing
   */
  static createSampleTxt(): string {
    return `4 Lightning Bolt
4 Counterspell
2 Force of Will
1 Black Lotus

4 Pyroblast
3 Red Elemental Blast
2 Surgical Extraction`;
  }
}
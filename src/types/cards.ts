import type { CardMetadata } from './database';

export interface ParsedDeckCard {
  name: string;
  quantity: number;
}

export interface ParsedDeck {
  cards: ParsedDeckCard[];
  errors: string[];
  filename: string;
  totalCards: number;
}

export interface ProcessedCard {
  card_name: string;
  required_quantity: number;
  gathered_quantity: number;
  outstanding_quantity: number;
  status: 'needed' | 'exact' | 'surplus';
  metadata?: CardMetadata;
  contributors: Array<{
    name: string;
    quantity: number;
    deck_filename: string;
  }>;
}
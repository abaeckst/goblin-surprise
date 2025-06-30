export interface RequirementDeck {
  id: string;
  deck_name: string;
  uploaded_by: string;
  created_at: string;
}

export interface RequirementCard {
  id: string;
  deck_id: string;
  card_name: string;
  quantity: number;
  created_at: string;
}

export interface GatheredCard {
  id: string;
  card_name: string;
  quantity: number;
  contributor_name: string;
  deck_filename: string;
  created_at: string;
}

export interface CardMetadata {
  card_name: string;
  mana_cost: string;
  type_line: string;
  rarity: string;
  colors: string[];
  set_code: string;
  scryfall_id: string;
  image_uri: string;
  price_tix?: number | null;
  last_price_update?: string | null;
  created_at: string;
}

export interface ChangeLog {
  id: string;
  table_name: string;
  record_id: string;
  field_changed: string;
  old_value: string | null;
  new_value: string | null;
  changed_at: string;
}

// Supabase database type
export interface Database {
  public: {
    Tables: {
      requirement_decks: {
        Row: RequirementDeck;
        Insert: Omit<RequirementDeck, 'id' | 'created_at'>;
        Update: Partial<Omit<RequirementDeck, 'id' | 'created_at'>>;
      };
      requirement_cards: {
        Row: RequirementCard;
        Insert: Omit<RequirementCard, 'id' | 'created_at'>;
        Update: Partial<Omit<RequirementCard, 'id' | 'created_at'>>;
      };
      gathered_cards: {
        Row: GatheredCard;
        Insert: Omit<GatheredCard, 'id' | 'created_at'>;
        Update: Partial<Omit<GatheredCard, 'id' | 'created_at'>>;
      };
      card_metadata: {
        Row: CardMetadata;
        Insert: Omit<CardMetadata, 'created_at'>;
        Update: Partial<Omit<CardMetadata, 'created_at'>>;
      };
      change_log: {
        Row: ChangeLog;
        Insert: Omit<ChangeLog, 'id' | 'changed_at'>;
        Update: Partial<Omit<ChangeLog, 'id' | 'changed_at'>>;
      };
    };
  };
}
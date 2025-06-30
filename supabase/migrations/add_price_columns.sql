-- Add price columns to card_metadata table
ALTER TABLE card_metadata
ADD COLUMN IF NOT EXISTS price_tix DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS last_price_update TIMESTAMP WITH TIME ZONE;

-- Create index for efficient price lookups
CREATE INDEX IF NOT EXISTS idx_card_metadata_price_update 
ON card_metadata(last_price_update) 
WHERE last_price_update IS NOT NULL;

-- Create composite index for card lookups
CREATE INDEX IF NOT EXISTS idx_card_metadata_card_set 
ON card_metadata(card_name, set_code);
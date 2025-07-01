-- Create monetary_donations table for tracking cash and MTGO tix donations
CREATE TABLE IF NOT EXISTS monetary_donations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contributor_name TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    donation_type TEXT NOT NULL CHECK (donation_type IN ('tix', 'usd')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add indexes for common queries
CREATE INDEX idx_monetary_donations_created_at ON monetary_donations(created_at DESC);
CREATE INDEX idx_monetary_donations_contributor ON monetary_donations(contributor_name);

-- Enable Row Level Security
ALTER TABLE monetary_donations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous reads (matching the pattern from other tables)
CREATE POLICY "Allow anonymous read access" ON monetary_donations
    FOR SELECT USING (true);

-- Create policy to allow anonymous inserts (matching the pattern from other tables)
CREATE POLICY "Allow anonymous insert access" ON monetary_donations
    FOR INSERT WITH CHECK (true);

-- Add table comment
COMMENT ON TABLE monetary_donations IS 'Tracks monetary contributions (USD and MTGO tix) to help rebuild the collection';
COMMENT ON COLUMN monetary_donations.amount IS 'Amount in dollars (1:1 conversion for MTGO tix)';
COMMENT ON COLUMN monetary_donations.donation_type IS 'Type of donation: tix (MTGO tickets) or usd (US dollars)';
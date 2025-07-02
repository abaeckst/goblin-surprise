-- Fix duplicate Matt W / Matt Wright donation
-- This script should be run directly in the Supabase SQL editor

-- First, verify we have the duplicate entries
SELECT id, contributor_name, amount, donation_type, created_at 
FROM monetary_donations 
WHERE contributor_name IN ('Matt W', 'Matt Wright') 
AND amount = 100 
AND donation_type = 'usd'
ORDER BY created_at;

-- Delete the specific duplicate entry (Matt W)
-- Since RLS policies don't allow DELETE, we need to run this as admin in Supabase dashboard
DELETE FROM monetary_donations 
WHERE id = 'f1856179-c3e4-4b47-8200-fe66d1853be5';

-- Verify the deletion worked
SELECT id, contributor_name, amount, donation_type, created_at 
FROM monetary_donations 
WHERE contributor_name IN ('Matt W', 'Matt Wright') 
AND amount = 100 
AND donation_type = 'usd'
ORDER BY created_at;

-- Optional: If you want to allow future deletions from the app, add a DELETE policy
-- Only run this if you want to allow deletions (not recommended for production)
-- CREATE POLICY "Allow delete for testing" ON monetary_donations
--     FOR DELETE USING (true);
-- Fix existing payment records that are stored as dollars instead of cents
-- Run this in Supabase SQL Editor

-- Update all payments to be in cents (multiply by 100)
UPDATE payments 
SET amount = amount * 100
WHERE amount < 1000; -- Only update payments that look like they're in dollars

-- Verify the fix
SELECT 
  id,
  amount,
  amount / 100.0 as amount_dollars,
  plan,
  payment_date
FROM payments 
WHERE guest_id = (
  SELECT id FROM guests WHERE email = 'cameron.macke02@gmail.com'
)
ORDER BY payment_date ASC;

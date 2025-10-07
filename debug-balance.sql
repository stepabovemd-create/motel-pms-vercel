-- Debug script to see what's actually in the database
-- Run this in Supabase SQL Editor to see the raw data

-- 1. Check your guest record
SELECT 
  id, 
  email, 
  name, 
  current_plan, 
  first_payment_date, 
  last_payment_date, 
  next_payment_due,
  created_at
FROM guests 
WHERE email = 'cameron.macke02@gmail.com';

-- 2. Check all your payments
SELECT 
  id,
  guest_id,
  amount,
  plan,
  payment_date,
  session_id,
  created_at
FROM payments 
WHERE guest_id = (
  SELECT id FROM guests WHERE email = 'cameron.macke02@gmail.com'
)
ORDER BY payment_date ASC;

-- 3. Check current balance record
SELECT 
  guest_id,
  balance_cents,
  created_at,
  updated_at
FROM account_balances 
WHERE guest_id = (
  SELECT id FROM guests WHERE email = 'cameron.macke02@gmail.com'
);

-- 4. Test the balance calculation manually
SELECT 
  'Total Paid' as description,
  COALESCE(SUM(amount), 0) as amount_cents,
  COALESCE(SUM(amount), 0) / 100.0 as amount_dollars
FROM payments 
WHERE guest_id = (
  SELECT id FROM guests WHERE email = 'cameron.macke02@gmail.com'
)

UNION ALL

SELECT 
  'Payment Count' as description,
  COUNT(*) as amount_cents,
  COUNT(*) as amount_dollars
FROM payments 
WHERE guest_id = (
  SELECT id FROM guests WHERE email = 'cameron.macke02@gmail.com'
)

UNION ALL

SELECT 
  'Expected Total' as description,
  CASE 
    WHEN COUNT(*) = 0 THEN 0
    WHEN COUNT(*) = 1 THEN 35000
    ELSE 35000 + ((COUNT(*) - 1) * 25000)
  END as amount_cents,
  CASE 
    WHEN COUNT(*) = 0 THEN 0
    WHEN COUNT(*) = 1 THEN 350.00
    ELSE 350.00 + ((COUNT(*) - 1) * 250.00)
  END as amount_dollars
FROM payments 
WHERE guest_id = (
  SELECT id FROM guests WHERE email = 'cameron.macke02@gmail.com'
)

UNION ALL

SELECT 
  'Calculated Balance' as description,
  COALESCE(SUM(amount), 0) - CASE 
    WHEN COUNT(*) = 0 THEN 0
    WHEN COUNT(*) = 1 THEN 35000
    ELSE 35000 + ((COUNT(*) - 1) * 25000)
  END as amount_cents,
  (COALESCE(SUM(amount), 0) - CASE 
    WHEN COUNT(*) = 0 THEN 0
    WHEN COUNT(*) = 1 THEN 35000
    ELSE 35000 + ((COUNT(*) - 1) * 25000)
  END) / 100.0 as amount_dollars
FROM payments 
WHERE guest_id = (
  SELECT id FROM guests WHERE email = 'cameron.macke02@gmail.com'
);

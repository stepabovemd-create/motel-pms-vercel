-- Simple debug query to run in Supabase SQL Editor
-- This will show exactly what's in your database

-- 1. Check your guest record
SELECT 
  'GUEST RECORD' as section,
  id,
  email,
  name,
  current_plan,
  first_payment_date,
  last_payment_date,
  next_payment_due,
  updated_at
FROM guests 
WHERE email = 'cameron.macke02@gmail.com';

-- 2. Check all your payments
SELECT 
  'PAYMENT RECORDS' as section,
  id,
  amount,
  amount / 100.0 as amount_dollars,
  plan,
  payment_date,
  session_id,
  created_at
FROM payments 
WHERE guest_id = (
  SELECT id FROM guests WHERE email = 'cameron.macke02@gmail.com'
)
ORDER BY payment_date ASC;

-- 3. Check balance record
SELECT 
  'BALANCE RECORD' as section,
  guest_id,
  balance_cents,
  balance_cents / 100.0 as balance_dollars,
  created_at,
  updated_at
FROM account_balances 
WHERE guest_id = (
  SELECT id FROM guests WHERE email = 'cameron.macke02@gmail.com'
);

-- 4. Manual calculation
SELECT 
  'MANUAL CALCULATION' as section,
  COUNT(*) as payment_count,
  SUM(amount) as total_paid_cents,
  SUM(amount) / 100.0 as total_paid_dollars,
  CASE 
    WHEN COUNT(*) = 0 THEN 0
    WHEN COUNT(*) = 1 THEN 35000
    ELSE 35000 + ((COUNT(*) - 1) * 25000)
  END as expected_total_cents,
  CASE 
    WHEN COUNT(*) = 0 THEN 0.0
    WHEN COUNT(*) = 1 THEN 350.0
    ELSE 350.0 + ((COUNT(*) - 1) * 250.0)
  END as expected_total_dollars,
  SUM(amount) - CASE 
    WHEN COUNT(*) = 0 THEN 0
    WHEN COUNT(*) = 1 THEN 35000
    ELSE 35000 + ((COUNT(*) - 1) * 25000)
  END as balance_cents,
  (SUM(amount) - CASE 
    WHEN COUNT(*) = 0 THEN 0
    WHEN COUNT(*) = 1 THEN 35000
    ELSE 35000 + ((COUNT(*) - 1) * 25000)
  END) / 100.0 as balance_dollars
FROM payments 
WHERE guest_id = (
  SELECT id FROM guests WHERE email = 'cameron.macke02@gmail.com'
);

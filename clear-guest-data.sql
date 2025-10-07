-- Clear all data for cameron.macke02@gmail.com
-- Run this in Supabase SQL Editor

-- 1. Delete all payments for this guest
DELETE FROM payments 
WHERE guest_id = (
  SELECT id FROM guests WHERE email = 'cameron.macke02@gmail.com'
);

-- 2. Delete account balance record
DELETE FROM account_balances 
WHERE guest_id = (
  SELECT id FROM guests WHERE email = 'cameron.macke02@gmail.com'
);

-- 3. Delete the guest record
DELETE FROM guests 
WHERE email = 'cameron.macke02@gmail.com';

-- 4. Verify everything is deleted
SELECT 
  'GUESTS' as table_name,
  COUNT(*) as count
FROM guests 
WHERE email = 'cameron.macke02@gmail.com'

UNION ALL

SELECT 
  'PAYMENTS' as table_name,
  COUNT(*) as count
FROM payments 
WHERE guest_id = (
  SELECT id FROM guests WHERE email = 'cameron.macke02@gmail.com'
)

UNION ALL

SELECT 
  'ACCOUNT_BALANCES' as table_name,
  COUNT(*) as count
FROM account_balances 
WHERE guest_id = (
  SELECT id FROM guests WHERE email = 'cameron.macke02@gmail.com'
);

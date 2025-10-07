-- Fix the balance calculation - the logic is correct, let's simplify and debug
CREATE OR REPLACE FUNCTION calculate_guest_balance_clean(target_guest_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_paid INTEGER := 0;
  total_expected INTEGER := 0;
  balance INTEGER := 0;
  payments_count INTEGER := 0;
BEGIN
  -- Get total paid (should be 120000 cents = $1200)
  SELECT COALESCE(SUM(amount), 0) INTO total_paid 
  FROM payments 
  WHERE guest_id = target_guest_id;
  
  -- Count payments (should be 4)
  SELECT COUNT(*) INTO payments_count 
  FROM payments 
  WHERE guest_id = target_guest_id;
  
  -- Calculate expected based on your scenario:
  -- 4 payments = 1 payment with move-in fee ($350) + 3 regular payments ($250 each)
  -- Expected = $350 + ($250 * 3) = $350 + $750 = $1100 = 110000 cents
  
  total_expected := 35000 + ((payments_count - 1) * 25000); -- 35000 + (3 * 25000) = 110000
  
  -- Balance = paid - expected = 120000 - 110000 = 10000 cents = $100 credit
  balance := total_paid - total_expected;
  
  -- Debug logging (remove after testing)
  RAISE NOTICE 'Guest ID: %, Total Paid: %, Payments Count: %, Expected: %, Balance: %', 
    target_guest_id, total_paid, payments_count, total_expected, balance;
  
  RETURN balance;
END;
$$ LANGUAGE plpgsql;

-- Test the function for your account
SELECT 
  'Test Balance Calculation' as test,
  calculate_guest_balance_clean(
    (SELECT id FROM guests WHERE email = 'cameron.macke02@gmail.com')
  ) as balance_cents,
  calculate_guest_balance_clean(
    (SELECT id FROM guests WHERE email = 'cameron.macke02@gmail.com')
  ) / 100.0 as balance_dollars;

-- Update your balance
SELECT update_guest_balance_clean(
  (SELECT id FROM guests WHERE email = 'cameron.macke02@gmail.com')
);

-- Check the result
SELECT 
  balance_cents,
  balance_cents / 100.0 as balance_dollars
FROM account_balances 
WHERE guest_id = (
  SELECT id FROM guests WHERE email = 'cameron.macke02@gmail.com'
);

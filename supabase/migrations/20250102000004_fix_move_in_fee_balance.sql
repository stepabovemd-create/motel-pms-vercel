-- Fix the balance calculation to account for move-in fees
CREATE OR REPLACE FUNCTION calculate_guest_balance(target_guest_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_paid INTEGER := 0;
  total_expected INTEGER := 0;
  balance INTEGER := 0;
  guest_plan TEXT;
  payments_count INTEGER := 0;
  standard_weekly_rate INTEGER := 25000; -- $250 in cents
  standard_monthly_rate INTEGER := 80000; -- $800 in cents
  move_in_fee INTEGER := 10000; -- $100 in cents
  first_payment_amount INTEGER := 0;
BEGIN
  -- Get the guest's current plan
  SELECT current_plan INTO guest_plan FROM guests WHERE id = target_guest_id;
  
  -- Calculate total paid
  SELECT COALESCE(SUM(amount), 0) INTO total_paid 
  FROM payments 
  WHERE guest_id = target_guest_id;
  
  -- Count how many payments have been made
  SELECT COUNT(*) INTO payments_count 
  FROM payments 
  WHERE guest_id = target_guest_id;
  
  -- Get the first payment amount to check if it included move-in fee
  SELECT amount INTO first_payment_amount 
  FROM payments 
  WHERE guest_id = target_guest_id 
  ORDER BY payment_date ASC 
  LIMIT 1;
  
  -- Calculate expected amount based on plan
  IF guest_plan = 'weekly' THEN
    IF payments_count > 0 THEN
      -- First payment should include move-in fee
      total_expected := standard_weekly_rate + move_in_fee;
      
      -- Add remaining payments (without move-in fee)
      IF payments_count > 1 THEN
        total_expected := total_expected + ((payments_count - 1) * standard_weekly_rate);
      END IF;
    END IF;
  ELSE
    -- Monthly plan - same logic
    IF payments_count > 0 THEN
      -- First payment should include move-in fee
      total_expected := standard_monthly_rate + move_in_fee;
      
      -- Add remaining payments (without move-in fee)
      IF payments_count > 1 THEN
        total_expected := total_expected + ((payments_count - 1) * standard_monthly_rate);
      END IF;
    END IF;
  END IF;
  
  -- Balance = total_paid - total_expected (positive = credit, negative = debt)
  balance := total_paid - total_expected;
  
  RETURN balance;
END;
$$ LANGUAGE plpgsql;

-- Recalculate balances for all existing guests
DO $$
DECLARE
  guest_record RECORD;
BEGIN
  FOR guest_record IN SELECT id FROM guests LOOP
    PERFORM update_guest_balance_and_due_date(guest_record.id);
  END LOOP;
END $$;

-- Drop the problematic trigger and function
DROP TRIGGER IF EXISTS update_account_balance_trigger ON payments;
DROP FUNCTION IF EXISTS update_account_balance();

-- Create a simpler function to calculate balance manually
CREATE OR REPLACE FUNCTION calculate_guest_balance(target_guest_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_paid INTEGER := 0;
  total_expected INTEGER := 0;
  balance INTEGER := 0;
  payment_record RECORD;
  standard_amount INTEGER;
BEGIN
  -- Calculate total paid and expected
  FOR payment_record IN 
    SELECT amount, plan 
    FROM payments 
    WHERE guest_id = target_guest_id
  LOOP
    total_paid := total_paid + payment_record.amount;
    
    -- Calculate expected amount based on plan
    IF payment_record.plan = 'weekly' THEN
      standard_amount := 25000; -- $250.00 in cents
    ELSE
      standard_amount := 80000; -- $800.00 in cents
    END IF;
    
    total_expected := total_expected + standard_amount;
  END LOOP;
  
  -- Balance = total_paid - total_expected (positive = credit, negative = debt)
  balance := total_paid - total_expected;
  
  RETURN balance;
END;
$$ LANGUAGE plpgsql;

-- Create function to update balance for a specific guest
CREATE OR REPLACE FUNCTION update_guest_balance(target_guest_id UUID)
RETURNS VOID AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  -- Calculate the current balance
  new_balance := calculate_guest_balance(target_guest_id);
  
  -- Update or insert the balance
  INSERT INTO account_balances (guest_id, balance_cents)
  VALUES (target_guest_id, new_balance)
  ON CONFLICT (guest_id) 
  DO UPDATE SET 
    balance_cents = new_balance,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Recalculate balances for all existing guests
DO $$
DECLARE
  guest_record RECORD;
BEGIN
  FOR guest_record IN SELECT id FROM guests LOOP
    PERFORM update_guest_balance(guest_record.id);
  END LOOP;
END $$;

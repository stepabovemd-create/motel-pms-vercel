-- Fix the balance calculation to be smarter about payment periods
CREATE OR REPLACE FUNCTION calculate_guest_balance(target_guest_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_paid INTEGER := 0;
  total_expected INTEGER := 0;
  balance INTEGER := 0;
  payment_record RECORD;
  guest_plan TEXT;
  weeks_covered INTEGER := 0;
BEGIN
  -- Get the guest's current plan
  SELECT current_plan INTO guest_plan FROM guests WHERE id = target_guest_id;
  
  -- Calculate total paid
  SELECT COALESCE(SUM(amount), 0) INTO total_paid 
  FROM payments 
  WHERE guest_id = target_guest_id;
  
  -- Calculate how many periods (weeks/months) should be covered
  -- For now, we'll count each payment as covering one period
  -- This is a simplified approach - in reality, you might want more sophisticated logic
  SELECT COUNT(*) INTO weeks_covered 
  FROM payments 
  WHERE guest_id = target_guest_id;
  
  -- Calculate expected amount based on plan and periods covered
  IF guest_plan = 'weekly' THEN
    total_expected := weeks_covered * 25000; -- $250.00 per week in cents
  ELSE
    total_expected := weeks_covered * 80000; -- $800.00 per month in cents
  END IF;
  
  -- Balance = total_paid - total_expected (positive = credit, negative = debt)
  balance := total_paid - total_expected;
  
  RETURN balance;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate next payment due date based on payments made
CREATE OR REPLACE FUNCTION calculate_next_due_date(target_guest_id UUID)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
  guest_plan TEXT;
  last_payment_date TIMESTAMP WITH TIME ZONE;
  weeks_paid INTEGER := 0;
  next_due_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get guest plan and last payment date
  SELECT current_plan, last_payment_date 
  INTO guest_plan, last_payment_date 
  FROM guests 
  WHERE id = target_guest_id;
  
  -- Count how many periods have been paid for
  SELECT COUNT(*) INTO weeks_paid 
  FROM payments 
  WHERE guest_id = target_guest_id;
  
  -- Calculate next due date based on last payment date and periods paid
  IF guest_plan = 'weekly' THEN
    next_due_date := last_payment_date + (weeks_paid || ' weeks')::INTERVAL;
  ELSE
    next_due_date := last_payment_date + (weeks_paid || ' months')::INTERVAL;
  END IF;
  
  RETURN next_due_date;
END;
$$ LANGUAGE plpgsql;

-- Update function to also update next payment due date
CREATE OR REPLACE FUNCTION update_guest_balance_and_due_date(target_guest_id UUID)
RETURNS VOID AS $$
DECLARE
  new_balance INTEGER;
  new_due_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate the current balance
  new_balance := calculate_guest_balance(target_guest_id);
  
  -- Calculate the next due date
  new_due_date := calculate_next_due_date(target_guest_id);
  
  -- Update account balance
  INSERT INTO account_balances (guest_id, balance_cents)
  VALUES (target_guest_id, new_balance)
  ON CONFLICT (guest_id) 
  DO UPDATE SET 
    balance_cents = new_balance,
    updated_at = NOW();
  
  -- Update guest's next payment due date
  UPDATE guests 
  SET next_payment_due = new_due_date
  WHERE id = target_guest_id;
END;
$$ LANGUAGE plpgsql;

-- Recalculate balances and due dates for all existing guests
DO $$
DECLARE
  guest_record RECORD;
BEGIN
  FOR guest_record IN SELECT id FROM guests LOOP
    PERFORM update_guest_balance_and_due_date(guest_record.id);
  END LOOP;
END $$;

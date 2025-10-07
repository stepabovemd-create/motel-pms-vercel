-- Fix the balance calculation with better logic
CREATE OR REPLACE FUNCTION calculate_guest_balance(target_guest_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_paid INTEGER := 0;
  total_expected INTEGER := 0;
  balance INTEGER := 0;
  guest_plan TEXT;
  weeks_paid INTEGER := 0;
  standard_weekly_rate INTEGER := 25000; -- $250 in cents
  standard_monthly_rate INTEGER := 80000; -- $800 in cents
BEGIN
  -- Get the guest's current plan
  SELECT current_plan INTO guest_plan FROM guests WHERE id = target_guest_id;
  
  -- Calculate total paid
  SELECT COALESCE(SUM(amount), 0) INTO total_paid 
  FROM payments 
  WHERE guest_id = target_guest_id;
  
  -- Count how many payments have been made (each payment covers one period)
  SELECT COUNT(*) INTO weeks_paid 
  FROM payments 
  WHERE guest_id = target_guest_id;
  
  -- Calculate expected amount based on plan
  IF guest_plan = 'weekly' THEN
    total_expected := weeks_paid * standard_weekly_rate;
  ELSE
    total_expected := weeks_paid * standard_monthly_rate;
  END IF;
  
  -- Balance = total_paid - total_expected (positive = credit, negative = debt)
  balance := total_paid - total_expected;
  
  RETURN balance;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate next payment amount considering credit
CREATE OR REPLACE FUNCTION calculate_next_payment_amount(target_guest_id UUID)
RETURNS INTEGER AS $$
DECLARE
  guest_plan TEXT;
  current_balance INTEGER;
  standard_rate INTEGER;
  next_payment_amount INTEGER;
BEGIN
  -- Get guest plan
  SELECT current_plan INTO guest_plan FROM guests WHERE id = target_guest_id;
  
  -- Get current balance
  current_balance := calculate_guest_balance(target_guest_id);
  
  -- Set standard rate
  IF guest_plan = 'weekly' THEN
    standard_rate := 25000; -- $250 in cents
  ELSE
    standard_rate := 80000; -- $800 in cents
  END IF;
  
  -- Calculate next payment amount
  -- If balance is positive (credit), subtract from standard rate
  -- If balance is negative (debt), add to standard rate
  next_payment_amount := standard_rate - current_balance;
  
  -- Ensure minimum payment is not negative
  IF next_payment_amount < 0 THEN
    next_payment_amount := 0;
  END IF;
  
  RETURN next_payment_amount;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate next payment due date based on payments made
CREATE OR REPLACE FUNCTION calculate_next_due_date(target_guest_id UUID)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
  guest_plan TEXT;
  last_payment_date_val TIMESTAMP WITH TIME ZONE;
  periods_paid INTEGER := 0;
  next_due_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get guest plan and last payment date
  SELECT current_plan, last_payment_date 
  INTO guest_plan, last_payment_date_val 
  FROM guests 
  WHERE id = target_guest_id;
  
  -- Count how many periods have been paid for
  SELECT COUNT(*) INTO periods_paid 
  FROM payments 
  WHERE guest_id = target_guest_id;
  
  -- Calculate next due date based on last payment date and periods paid
  IF guest_plan = 'weekly' THEN
    next_due_date := last_payment_date_val + (periods_paid || ' weeks')::INTERVAL;
  ELSE
    next_due_date := last_payment_date_val + (periods_paid || ' months')::INTERVAL;
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
  next_payment_amount INTEGER;
BEGIN
  -- Calculate the current balance
  new_balance := calculate_guest_balance(target_guest_id);
  
  -- Calculate the next due date
  new_due_date := calculate_next_due_date(target_guest_id);
  
  -- Calculate next payment amount
  next_payment_amount := calculate_next_payment_amount(target_guest_id);
  
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

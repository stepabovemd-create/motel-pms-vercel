-- Create account_balances table to track credits and debts
CREATE TABLE IF NOT EXISTS account_balances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
  balance_cents INTEGER NOT NULL DEFAULT 0, -- Positive = credit, Negative = debt
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_account_balances_guest_id ON account_balances(guest_id);

-- Enable RLS
ALTER TABLE account_balances ENABLE ROW LEVEL SECURITY;

-- Create policy for service role access
CREATE POLICY "Service role can manage account balances" ON account_balances
  FOR ALL USING (true);

-- Create function to update balance when payments are made
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
DECLARE
  current_balance INTEGER;
  payment_amount INTEGER;
  standard_amount INTEGER;
  balance_change INTEGER;
BEGIN
  -- Get the payment amount from the new payment record
  payment_amount := NEW.amount;
  
  -- Get the standard amount for this plan (from metadata or calculate)
  -- For now, we'll use the plan to determine standard amount
  IF NEW.plan = 'weekly' THEN
    standard_amount := 25000; -- $250.00 in cents
  ELSE
    standard_amount := 80000; -- $800.00 in cents
  END IF;
  
  -- Calculate balance change (positive = overpayment/credit, negative = underpayment/debt)
  balance_change := payment_amount - standard_amount;
  
  -- Get current balance or create new record
  SELECT balance_cents INTO current_balance 
  FROM account_balances 
  WHERE guest_id = NEW.guest_id;
  
  IF current_balance IS NULL THEN
    -- Create new balance record
    INSERT INTO account_balances (guest_id, balance_cents)
    VALUES (NEW.guest_id, balance_change);
  ELSE
    -- Update existing balance
    UPDATE account_balances 
    SET balance_cents = current_balance + balance_change,
        updated_at = NOW()
    WHERE guest_id = NEW.guest_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update balance when payments are made
CREATE TRIGGER update_account_balance_trigger
  AFTER INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_account_balance();

-- Create function to get current balance for a guest
CREATE OR REPLACE FUNCTION get_guest_balance(guest_email TEXT)
RETURNS INTEGER AS $$
DECLARE
  balance INTEGER;
BEGIN
  SELECT COALESCE(ab.balance_cents, 0) INTO balance
  FROM guests g
  LEFT JOIN account_balances ab ON g.id = ab.guest_id
  WHERE g.email = guest_email;
  
  RETURN COALESCE(balance, 0);
END;
$$ LANGUAGE plpgsql;

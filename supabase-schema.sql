-- Miami Motel PMS Database Schema
-- Run this in your Supabase SQL editor

-- Create guests table
CREATE TABLE IF NOT EXISTS guests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  first_payment_date TIMESTAMP WITH TIME ZONE,
  last_payment_date TIMESTAMP WITH TIME ZONE,
  current_plan VARCHAR(20) NOT NULL CHECK (current_plan IN ('weekly', 'monthly')),
  next_payment_due TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  plan VARCHAR(20) NOT NULL CHECK (plan IN ('weekly', 'monthly')),
  session_id VARCHAR(255),
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_guests_email ON guests(email);
CREATE INDEX IF NOT EXISTS idx_payments_guest_id ON payments(guest_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_guests_next_payment ON guests(next_payment_due);

-- Enable Row Level Security (RLS)
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policies for service role access (for API)
CREATE POLICY "Service role can manage guests" ON guests
  FOR ALL USING (true);

CREATE POLICY "Service role can manage payments" ON payments
  FOR ALL USING (true);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_guests_updated_at BEFORE UPDATE ON guests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing (optional)
-- You can remove this section if you don't want sample data
INSERT INTO guests (email, name, first_payment_date, last_payment_date, current_plan, next_payment_due)
VALUES 
  ('test@example.com', 'Test User', NOW(), NOW(), 'weekly', NOW() + INTERVAL '7 days')
ON CONFLICT (email) DO NOTHING;

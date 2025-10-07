-- Clear all customer data to start fresh
-- WARNING: This will delete ALL guest and payment data

-- Delete all payments first (due to foreign key constraints)
DELETE FROM payments;

-- Delete all account balances
DELETE FROM account_balances;

-- Delete all guests
DELETE FROM guests;

-- Reset sequences (optional, but good practice)
-- Note: These might not exist depending on your table structure
-- ALTER SEQUENCE guests_id_seq RESTART WITH 1;
-- ALTER SEQUENCE payments_id_seq RESTART WITH 1;

-- Verify tables are empty
SELECT 'guests' as table_name, COUNT(*) as count FROM guests
UNION ALL
SELECT 'payments' as table_name, COUNT(*) as count FROM payments
UNION ALL
SELECT 'account_balances' as table_name, COUNT(*) as count FROM account_balances;

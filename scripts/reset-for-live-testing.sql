-- Reset user_products table for live testing
-- This will remove all existing product access records

DELETE FROM user_products;

-- Verify the table is empty
SELECT COUNT(*) as remaining_records FROM user_products;
EOF < /dev/null
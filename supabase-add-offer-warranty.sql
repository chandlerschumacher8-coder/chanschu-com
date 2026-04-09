-- Add offer_warranty column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS offer_warranty BOOLEAN;
-- NULL means "use default logic" (based on category/price)
-- true means "always offer warranty prompt"
-- false means "never offer warranty prompt"

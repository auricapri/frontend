-- Migration: Fix categories ID type from UUID to TEXT
-- This allows for custom string IDs like "cat_tailoring"

-- Step 1: Create a temporary column
ALTER TABLE categories ADD COLUMN id_new TEXT;

-- Step 2: Copy data from old column to new column
UPDATE categories SET id_new = id::TEXT;

-- Step 3: Drop foreign key constraints that reference categories.id (if any)
-- Note: You may need to adjust this based on your actual constraints

-- Step 4: Drop the old column and rename the new one
ALTER TABLE categories DROP COLUMN id CASCADE;
ALTER TABLE categories RENAME COLUMN id_new TO id;

-- Step 5: Add primary key constraint
ALTER TABLE categories ADD PRIMARY KEY (id);

-- Step 6: Recreate any foreign key constraints
-- For products table (category_id)
-- ALTER TABLE products ADD CONSTRAINT products_category_id_fkey
--   FOREIGN KEY (category_id) REFERENCES categories(id);

-- Note: If the above doesn't work due to existing constraints, run this SQL manually in Supabase:
/*
-- Alternative approach - simpler but requires no FK constraints:
ALTER TABLE categories ALTER COLUMN id TYPE TEXT USING id::TEXT;
*/

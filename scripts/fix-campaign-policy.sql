-- Fix campaign creation policy for specific user
-- This adds a specific policy to allow your user to create campaigns

-- First, let's check the current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'campaigns';

-- Create a specific policy for your user
CREATE POLICY "Allow specific user to manage campaigns" ON campaigns 
FOR ALL 
USING (brand_id = '136b104e-231e-4f17-93c8-de1d6888f1bd'::uuid OR auth.uid() = '136b104e-231e-4f17-93c8-de1d6888f1bd'::uuid)
WITH CHECK (brand_id = '136b104e-231e-4f17-93c8-de1d6888f1bd'::uuid OR auth.uid() = '136b104e-231e-4f17-93c8-de1d6888f1bd'::uuid);

-- Also create a more permissive policy for brands in general
CREATE POLICY "Brands can manage their campaigns" ON campaigns 
FOR ALL 
USING (
  brand_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.user_type = 'brand'
  )
)
WITH CHECK (
  brand_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.user_type = 'brand'
  )
);

-- List all policies after creation
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'campaigns'; 
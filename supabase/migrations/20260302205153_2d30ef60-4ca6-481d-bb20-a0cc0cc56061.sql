
-- Drop existing restrictive insert policy
DROP POLICY IF EXISTS "Owner/super can insert companies" ON public.companies;

-- Create new insert policy that allows admin and above
CREATE POLICY "Admin+ can insert companies"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_companies
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'super_admin', 'admin')
  )
);

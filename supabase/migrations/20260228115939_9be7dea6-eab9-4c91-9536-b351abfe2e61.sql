
-- Drop and recreate company INSERT policy as PERMISSIVE
DROP POLICY IF EXISTS "Admin can insert companies" ON public.companies;
CREATE POLICY "Admin can insert companies"
ON public.companies FOR INSERT
TO authenticated
WITH CHECK (is_admin_or_above(auth.uid()));

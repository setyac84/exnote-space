
-- Fix profiles SELECT policy: allow users to read own profile even with null company_id
DROP POLICY IF EXISTS "Users can read profiles in same company" ON public.profiles;

CREATE POLICY "Users can read profiles"
ON public.profiles
FOR SELECT
USING (
  id = auth.uid()
  OR is_super_admin(auth.uid())
  OR is_admin_or_above(auth.uid())
  OR (company_id IS NOT NULL AND company_id = get_user_company(auth.uid()))
);

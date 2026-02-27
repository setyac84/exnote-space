
-- Allow admins to read roles of users in their company (needed for member management)
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
CREATE POLICY "Users can read roles" ON public.user_roles
FOR SELECT TO authenticated
USING (
  user_id = auth.uid() 
  OR is_super_admin(auth.uid())
  OR (
    is_admin_or_above(auth.uid()) 
    AND EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = user_roles.user_id 
      AND p.company_id = get_user_company(auth.uid())
    )
  )
);

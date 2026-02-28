
-- Fix user_roles SELECT policy to handle NULL company_id
DROP POLICY IF EXISTS "Users can read roles" ON public.user_roles;
CREATE POLICY "Users can read roles" ON public.user_roles
FOR SELECT
USING (
  (user_id = auth.uid())
  OR is_super_admin(auth.uid())
  OR (
    is_admin_or_above(auth.uid())
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = user_roles.user_id
        AND (
          get_user_company(auth.uid()) IS NULL
          OR p.company_id = get_user_company(auth.uid())
        )
    )
  )
);

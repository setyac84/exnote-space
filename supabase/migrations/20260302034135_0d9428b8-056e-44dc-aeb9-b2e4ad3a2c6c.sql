
-- Fix DELETE policy: allow super_admin holding to delete across all divisions
DROP POLICY IF EXISTS "Admin can delete projects" ON public.projects;
CREATE POLICY "Admin can delete projects" ON public.projects
FOR DELETE
USING (
  (is_super_admin(auth.uid()) AND get_user_company(auth.uid()) IS NULL)
  OR
  (is_admin_or_above(auth.uid()) AND is_in_user_company_group(auth.uid(), company_id) AND division = get_user_division(auth.uid()))
);

-- Fix UPDATE policy: allow super_admin holding to update across all divisions
DROP POLICY IF EXISTS "Admin can update projects" ON public.projects;
CREATE POLICY "Admin can update projects" ON public.projects
FOR UPDATE
USING (
  (is_super_admin(auth.uid()) AND get_user_company(auth.uid()) IS NULL)
  OR
  (is_admin_or_above(auth.uid()) AND is_in_user_company_group(auth.uid(), company_id) AND division = get_user_division(auth.uid()))
);

-- Fix INSERT policy: allow super_admin holding to insert across all divisions
DROP POLICY IF EXISTS "Admin can insert projects" ON public.projects;
CREATE POLICY "Admin can insert projects" ON public.projects
FOR INSERT
WITH CHECK (
  (is_super_admin(auth.uid()) AND get_user_company(auth.uid()) IS NULL)
  OR
  (is_admin_or_above(auth.uid()) AND division = get_user_division(auth.uid()) AND is_in_user_company_group(auth.uid(), company_id))
);

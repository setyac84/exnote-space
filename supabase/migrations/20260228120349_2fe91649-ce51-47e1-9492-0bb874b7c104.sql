
-- Allow admins to see ALL companies (not just their own)
DROP POLICY IF EXISTS "Read companies scoped" ON public.companies;
CREATE POLICY "Read companies scoped"
ON public.companies FOR SELECT
TO authenticated
USING (
  get_user_company(auth.uid()) IS NULL
  OR id = get_user_company(auth.uid())
  OR is_admin_or_above(auth.uid())
);

-- Allow admins to create projects in any visible company
DROP POLICY IF EXISTS "Admin can insert projects" ON public.projects;
CREATE POLICY "Admin can insert projects"
ON public.projects FOR INSERT
TO authenticated
WITH CHECK (
  is_admin_or_above(auth.uid())
  AND division = get_user_division(auth.uid())
);

-- Allow admins to update projects in any visible company
DROP POLICY IF EXISTS "Admin can update projects" ON public.projects;
CREATE POLICY "Admin can update projects"
ON public.projects FOR UPDATE
TO authenticated
USING (
  is_admin_or_above(auth.uid())
  AND (get_user_company(auth.uid()) IS NULL OR company_id = get_user_company(auth.uid()) OR is_admin_or_above(auth.uid()))
  AND division = get_user_division(auth.uid())
);

-- Allow admins to delete projects in any visible company
DROP POLICY IF EXISTS "Admin can delete projects" ON public.projects;
CREATE POLICY "Admin can delete projects"
ON public.projects FOR DELETE
TO authenticated
USING (
  is_admin_or_above(auth.uid())
  AND (get_user_company(auth.uid()) IS NULL OR company_id = get_user_company(auth.uid()) OR is_admin_or_above(auth.uid()))
  AND division = get_user_division(auth.uid())
);

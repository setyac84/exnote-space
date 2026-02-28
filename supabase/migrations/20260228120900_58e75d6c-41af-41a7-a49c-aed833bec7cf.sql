
-- Fix Companies RLS: restore tenant isolation

-- 1. SELECT: remove is_admin_or_above, only holding sees all
DROP POLICY IF EXISTS "Read companies scoped" ON public.companies;
CREATE POLICY "Read companies scoped"
ON public.companies FOR SELECT
TO authenticated
USING (
  get_user_company(auth.uid()) IS NULL
  OR id = get_user_company(auth.uid())
);

-- 2. INSERT: only super_admin can create companies
DROP POLICY IF EXISTS "Admin can insert companies" ON public.companies;
CREATE POLICY "Super admin can insert companies"
ON public.companies FOR INSERT
TO authenticated
WITH CHECK (is_super_admin(auth.uid()));

-- 3. UPDATE: only super_admin, scoped to own company
DROP POLICY IF EXISTS "Admin can update companies" ON public.companies;
CREATE POLICY "Super admin can update companies"
ON public.companies FOR UPDATE
TO authenticated
USING (
  is_super_admin(auth.uid())
  AND (get_user_company(auth.uid()) IS NULL OR id = get_user_company(auth.uid()))
);

-- 4. Fix projects INSERT: scoped admin can only insert for own company
DROP POLICY IF EXISTS "Admin can insert projects" ON public.projects;
CREATE POLICY "Admin can insert projects"
ON public.projects FOR INSERT
TO authenticated
WITH CHECK (
  is_admin_or_above(auth.uid())
  AND division = get_user_division(auth.uid())
  AND (get_user_company(auth.uid()) IS NULL OR company_id = get_user_company(auth.uid()))
);

-- 5. Fix projects UPDATE: remove redundant is_admin_or_above in OR
DROP POLICY IF EXISTS "Admin can update projects" ON public.projects;
CREATE POLICY "Admin can update projects"
ON public.projects FOR UPDATE
TO authenticated
USING (
  is_admin_or_above(auth.uid())
  AND (get_user_company(auth.uid()) IS NULL OR company_id = get_user_company(auth.uid()))
  AND division = get_user_division(auth.uid())
);

-- 6. Fix projects DELETE: same
DROP POLICY IF EXISTS "Admin can delete projects" ON public.projects;
CREATE POLICY "Admin can delete projects"
ON public.projects FOR DELETE
TO authenticated
USING (
  is_admin_or_above(auth.uid())
  AND (get_user_company(auth.uid()) IS NULL OR company_id = get_user_company(auth.uid()))
  AND division = get_user_division(auth.uid())
);

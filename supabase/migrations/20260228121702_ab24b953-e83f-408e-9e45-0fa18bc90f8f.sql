
-- 1. Add parent_id to companies
ALTER TABLE public.companies ADD COLUMN parent_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;

-- 2. Create helper function is_in_user_company_group
CREATE OR REPLACE FUNCTION public.is_in_user_company_group(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    get_user_company(_user_id) IS NULL
    OR _company_id = get_user_company(_user_id)
    OR EXISTS (
      SELECT 1 FROM public.companies
      WHERE id = _company_id
        AND parent_id = get_user_company(_user_id)
    )
$$;

-- 3. Update Companies RLS policies

-- SELECT: global sees all, scoped sees own + sub-companies
DROP POLICY IF EXISTS "Read companies scoped" ON public.companies;
CREATE POLICY "Read companies scoped"
ON public.companies FOR SELECT
TO authenticated
USING (
  get_user_company(auth.uid()) IS NULL
  OR id = get_user_company(auth.uid())
  OR parent_id = get_user_company(auth.uid())
);

-- INSERT: admin+ can insert; scoped must set parent_id = own company
DROP POLICY IF EXISTS "Super admin can insert companies" ON public.companies;
CREATE POLICY "Admin can insert companies"
ON public.companies FOR INSERT
TO authenticated
WITH CHECK (
  is_admin_or_above(auth.uid())
  AND (
    get_user_company(auth.uid()) IS NULL
    OR parent_id = get_user_company(auth.uid())
  )
);

-- UPDATE: super admin, scoped to own group
DROP POLICY IF EXISTS "Super admin can update companies" ON public.companies;
CREATE POLICY "Super admin can update companies"
ON public.companies FOR UPDATE
TO authenticated
USING (
  is_super_admin(auth.uid())
  AND is_in_user_company_group(auth.uid(), id)
);

-- DELETE: keep global-only
-- (no change needed, already restricted to holding global)

-- 4. Update Projects RLS to use is_in_user_company_group

DROP POLICY IF EXISTS "Read projects" ON public.projects;
CREATE POLICY "Read projects"
ON public.projects FOR SELECT
TO authenticated
USING (
  (is_super_admin(auth.uid()) AND get_user_company(auth.uid()) IS NULL)
  OR (is_admin_or_above(auth.uid()) AND is_in_user_company_group(auth.uid(), company_id) AND division = get_user_division(auth.uid()))
  OR user_has_task_in_project(auth.uid(), id)
);

DROP POLICY IF EXISTS "Admin can insert projects" ON public.projects;
CREATE POLICY "Admin can insert projects"
ON public.projects FOR INSERT
TO authenticated
WITH CHECK (
  is_admin_or_above(auth.uid())
  AND division = get_user_division(auth.uid())
  AND is_in_user_company_group(auth.uid(), company_id)
);

DROP POLICY IF EXISTS "Admin can update projects" ON public.projects;
CREATE POLICY "Admin can update projects"
ON public.projects FOR UPDATE
TO authenticated
USING (
  is_admin_or_above(auth.uid())
  AND is_in_user_company_group(auth.uid(), company_id)
  AND division = get_user_division(auth.uid())
);

DROP POLICY IF EXISTS "Admin can delete projects" ON public.projects;
CREATE POLICY "Admin can delete projects"
ON public.projects FOR DELETE
TO authenticated
USING (
  is_admin_or_above(auth.uid())
  AND is_in_user_company_group(auth.uid(), company_id)
  AND division = get_user_division(auth.uid())
);

-- 5. Update Profiles RLS to use is_in_user_company_group
DROP POLICY IF EXISTS "Users can read profiles" ON public.profiles;
CREATE POLICY "Users can read profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR get_user_company(auth.uid()) IS NULL
  OR is_in_user_company_group(auth.uid(), company_id)
);

DROP POLICY IF EXISTS "Super admin can insert profiles" ON public.profiles;
CREATE POLICY "Super admin can insert profiles"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (
  id = auth.uid()
  OR (is_super_admin(auth.uid()) AND is_in_user_company_group(auth.uid(), company_id))
);

DROP POLICY IF EXISTS "Users can update own profile or super admin" ON public.profiles;
CREATE POLICY "Users can update own profile or super admin"
ON public.profiles FOR UPDATE
TO authenticated
USING (
  id = auth.uid()
  OR (is_super_admin(auth.uid()) AND is_in_user_company_group(auth.uid(), company_id))
);

DROP POLICY IF EXISTS "Super admin can delete profiles" ON public.profiles;
CREATE POLICY "Super admin can delete profiles"
ON public.profiles FOR DELETE
TO authenticated
USING (
  is_super_admin(auth.uid()) AND is_in_user_company_group(auth.uid(), company_id)
);

-- 6. Update Tasks RLS
DROP POLICY IF EXISTS "Admin can insert tasks" ON public.tasks;
CREATE POLICY "Admin can insert tasks"
ON public.tasks FOR INSERT
TO authenticated
WITH CHECK (
  is_admin_or_above(auth.uid())
  AND (get_user_company(auth.uid()) IS NULL OR EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = tasks.project_id
      AND is_in_user_company_group(auth.uid(), p.company_id)
      AND p.division = get_user_division(auth.uid())
  ))
);

DROP POLICY IF EXISTS "Admin or assignee can update tasks" ON public.tasks;
CREATE POLICY "Admin or assignee can update tasks"
ON public.tasks FOR UPDATE
TO authenticated
USING (
  assignee_id = auth.uid()
  OR (is_admin_or_above(auth.uid()) AND (get_user_company(auth.uid()) IS NULL OR EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = tasks.project_id
      AND is_in_user_company_group(auth.uid(), p.company_id)
      AND p.division = get_user_division(auth.uid())
  )))
);

DROP POLICY IF EXISTS "Admin can delete tasks" ON public.tasks;
CREATE POLICY "Admin can delete tasks"
ON public.tasks FOR DELETE
TO authenticated
USING (
  is_admin_or_above(auth.uid())
  AND (get_user_company(auth.uid()) IS NULL OR EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = tasks.project_id
      AND is_in_user_company_group(auth.uid(), p.company_id)
      AND p.division = get_user_division(auth.uid())
  ))
);

-- 7. Update user_roles RLS
DROP POLICY IF EXISTS "Users can read roles" ON public.user_roles;
CREATE POLICY "Users can read roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR get_user_company(auth.uid()) IS NULL
  OR (is_admin_or_above(auth.uid()) AND EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = user_roles.user_id
      AND is_in_user_company_group(auth.uid(), p.company_id)
  ))
);

DROP POLICY IF EXISTS "Super admin can manage roles" ON public.user_roles;
CREATE POLICY "Super admin can manage roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (
  is_super_admin(auth.uid())
  AND (get_user_company(auth.uid()) IS NULL OR EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = user_roles.user_id
      AND is_in_user_company_group(auth.uid(), p.company_id)
  ))
);

DROP POLICY IF EXISTS "Super admin can update roles" ON public.user_roles;
CREATE POLICY "Super admin can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (
  is_super_admin(auth.uid())
  AND (get_user_company(auth.uid()) IS NULL OR EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = user_roles.user_id
      AND is_in_user_company_group(auth.uid(), p.company_id)
  ))
);

DROP POLICY IF EXISTS "Super admin can delete roles" ON public.user_roles;
CREATE POLICY "Super admin can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (
  is_super_admin(auth.uid())
  AND (get_user_company(auth.uid()) IS NULL OR EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = user_roles.user_id
      AND is_in_user_company_group(auth.uid(), p.company_id)
  ))
);

-- 8. Update task_assignees RLS
DROP POLICY IF EXISTS "Users can view task assignees" ON public.task_assignees;
CREATE POLICY "Users can view task assignees"
ON public.task_assignees FOR SELECT
TO authenticated
USING (
  get_user_company(auth.uid()) IS NULL
  OR EXISTS (
    SELECT 1 FROM tasks t JOIN projects p ON p.id = t.project_id
    WHERE t.id = task_assignees.task_id
      AND is_in_user_company_group(auth.uid(), p.company_id)
  )
);

DROP POLICY IF EXISTS "Admins can manage task assignees" ON public.task_assignees;
CREATE POLICY "Admins can manage task assignees"
ON public.task_assignees FOR ALL
TO authenticated
USING (
  is_admin_or_above(auth.uid())
  AND (get_user_company(auth.uid()) IS NULL OR EXISTS (
    SELECT 1 FROM tasks t JOIN projects p ON p.id = t.project_id
    WHERE t.id = task_assignees.task_id
      AND is_in_user_company_group(auth.uid(), p.company_id)
  ))
);

-- 9. Update project_in_user_scope to use the new helper
CREATE OR REPLACE FUNCTION public.project_in_user_scope(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = _project_id
      AND is_in_user_company_group(_user_id, company_id)
      AND division = get_user_division(_user_id)
  );
$$;

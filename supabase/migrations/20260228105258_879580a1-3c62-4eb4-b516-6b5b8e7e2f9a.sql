
-- ============================================================
-- Multi-Tenancy with Holding Company: Update RLS Policies
-- Holding super admin (company_id IS NULL) = global access
-- Scoped super admin (company_id = 'xxx') = only their company
-- ============================================================

-- 1. COMPANIES: Holding sees all, scoped sees own company only
DROP POLICY IF EXISTS "Anyone can read companies" ON public.companies;
CREATE POLICY "Read companies scoped"
ON public.companies FOR SELECT
USING (
  get_user_company(auth.uid()) IS NULL
  OR id = get_user_company(auth.uid())
);

DROP POLICY IF EXISTS "Super admin can insert companies" ON public.companies;
CREATE POLICY "Super admin can insert companies"
ON public.companies FOR INSERT
WITH CHECK (
  is_super_admin(auth.uid())
  AND get_user_company(auth.uid()) IS NULL
);

DROP POLICY IF EXISTS "Super admin can update companies" ON public.companies;
CREATE POLICY "Super admin can update companies"
ON public.companies FOR UPDATE
USING (
  is_super_admin(auth.uid())
  AND (
    get_user_company(auth.uid()) IS NULL
    OR id = get_user_company(auth.uid())
  )
);

DROP POLICY IF EXISTS "Super admin can delete companies" ON public.companies;
CREATE POLICY "Super admin can delete companies"
ON public.companies FOR DELETE
USING (
  is_super_admin(auth.uid())
  AND get_user_company(auth.uid()) IS NULL
);

-- 2. PROFILES: Holding sees all, scoped sees same company + self
DROP POLICY IF EXISTS "Users can read profiles" ON public.profiles;
CREATE POLICY "Users can read profiles"
ON public.profiles FOR SELECT
USING (
  id = auth.uid()
  OR get_user_company(auth.uid()) IS NULL
  OR company_id = get_user_company(auth.uid())
);

-- Update profile delete: holding can delete all, scoped only same company
DROP POLICY IF EXISTS "Super admin can delete profiles" ON public.profiles;
CREATE POLICY "Super admin can delete profiles"
ON public.profiles FOR DELETE
USING (
  is_super_admin(auth.uid())
  AND (
    get_user_company(auth.uid()) IS NULL
    OR company_id = get_user_company(auth.uid())
  )
);

-- Update profile insert: holding or same company
DROP POLICY IF EXISTS "Super admin can insert profiles" ON public.profiles;
CREATE POLICY "Super admin can insert profiles"
ON public.profiles FOR INSERT
WITH CHECK (
  id = auth.uid()
  OR (
    is_super_admin(auth.uid())
    AND (
      get_user_company(auth.uid()) IS NULL
      OR company_id = get_user_company(auth.uid())
    )
  )
);

-- Update profile update: self, holding super admin, or scoped super admin for same company
DROP POLICY IF EXISTS "Users can update own profile or super admin" ON public.profiles;
CREATE POLICY "Users can update own profile or super admin"
ON public.profiles FOR UPDATE
USING (
  id = auth.uid()
  OR (
    is_super_admin(auth.uid())
    AND (
      get_user_company(auth.uid()) IS NULL
      OR company_id = get_user_company(auth.uid())
    )
  )
);

-- 3. TASK_ASSIGNEES: Scope via task→project company
DROP POLICY IF EXISTS "Users can view task assignees" ON public.task_assignees;
CREATE POLICY "Users can view task assignees"
ON public.task_assignees FOR SELECT
USING (
  get_user_company(auth.uid()) IS NULL
  OR EXISTS (
    SELECT 1 FROM tasks t
    JOIN projects p ON p.id = t.project_id
    WHERE t.id = task_assignees.task_id
    AND p.company_id = get_user_company(auth.uid())
  )
);

DROP POLICY IF EXISTS "Admins can manage task assignees" ON public.task_assignees;
CREATE POLICY "Admins can manage task assignees"
ON public.task_assignees FOR ALL
USING (
  is_admin_or_above(auth.uid())
  AND (
    get_user_company(auth.uid()) IS NULL
    OR EXISTS (
      SELECT 1 FROM tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE t.id = task_assignees.task_id
      AND p.company_id = get_user_company(auth.uid())
    )
  )
);

-- 4. USER_ROLES: Holding reads all, scoped reads same company
DROP POLICY IF EXISTS "Users can read roles" ON public.user_roles;
CREATE POLICY "Users can read roles"
ON public.user_roles FOR SELECT
USING (
  user_id = auth.uid()
  OR get_user_company(auth.uid()) IS NULL
  OR (
    is_admin_or_above(auth.uid())
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = user_roles.user_id
      AND p.company_id = get_user_company(auth.uid())
    )
  )
);

-- Scoped super admin can manage roles within their company
DROP POLICY IF EXISTS "Super admin can manage roles" ON public.user_roles;
CREATE POLICY "Super admin can manage roles"
ON public.user_roles FOR INSERT
WITH CHECK (
  is_super_admin(auth.uid())
  AND (
    get_user_company(auth.uid()) IS NULL
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = user_roles.user_id
      AND p.company_id = get_user_company(auth.uid())
    )
  )
);

DROP POLICY IF EXISTS "Super admin can update roles" ON public.user_roles;
CREATE POLICY "Super admin can update roles"
ON public.user_roles FOR UPDATE
USING (
  is_super_admin(auth.uid())
  AND (
    get_user_company(auth.uid()) IS NULL
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = user_roles.user_id
      AND p.company_id = get_user_company(auth.uid())
    )
  )
);

DROP POLICY IF EXISTS "Super admin can delete roles" ON public.user_roles;
CREATE POLICY "Super admin can delete roles"
ON public.user_roles FOR DELETE
USING (
  is_super_admin(auth.uid())
  AND (
    get_user_company(auth.uid()) IS NULL
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = user_roles.user_id
      AND p.company_id = get_user_company(auth.uid())
    )
  )
);

-- 5. PROJECTS: Update READ to include company scope for non-holding admins
DROP POLICY IF EXISTS "Read projects" ON public.projects;
CREATE POLICY "Read projects"
ON public.projects FOR SELECT
USING (
  (is_super_admin(auth.uid()) AND get_user_company(auth.uid()) IS NULL)
  OR (
    is_admin_or_above(auth.uid())
    AND (get_user_company(auth.uid()) IS NULL OR company_id = get_user_company(auth.uid()))
    AND division = get_user_division(auth.uid())
  )
  OR user_has_task_in_project(auth.uid(), id)
);

-- Update project INSERT/UPDATE/DELETE to scope by company
DROP POLICY IF EXISTS "Admin can insert projects" ON public.projects;
CREATE POLICY "Admin can insert projects"
ON public.projects FOR INSERT
WITH CHECK (
  is_admin_or_above(auth.uid())
  AND (get_user_company(auth.uid()) IS NULL OR company_id = get_user_company(auth.uid()))
  AND division = get_user_division(auth.uid())
);

DROP POLICY IF EXISTS "Admin can update projects" ON public.projects;
CREATE POLICY "Admin can update projects"
ON public.projects FOR UPDATE
USING (
  is_admin_or_above(auth.uid())
  AND (get_user_company(auth.uid()) IS NULL OR company_id = get_user_company(auth.uid()))
  AND division = get_user_division(auth.uid())
);

DROP POLICY IF EXISTS "Admin can delete projects" ON public.projects;
CREATE POLICY "Admin can delete projects"
ON public.projects FOR DELETE
USING (
  is_admin_or_above(auth.uid())
  AND (get_user_company(auth.uid()) IS NULL OR company_id = get_user_company(auth.uid()))
  AND division = get_user_division(auth.uid())
);

-- 6. TASKS: Update to scope by company via project
DROP POLICY IF EXISTS "Read tasks" ON public.tasks;
CREATE POLICY "Read tasks"
ON public.tasks FOR SELECT
USING (
  (is_super_admin(auth.uid()) AND get_user_company(auth.uid()) IS NULL)
  OR assignee_id = auth.uid()
  OR (
    is_admin_or_above(auth.uid())
    AND project_in_user_scope(auth.uid(), project_id)
  )
);

DROP POLICY IF EXISTS "Admin can insert tasks" ON public.tasks;
CREATE POLICY "Admin can insert tasks"
ON public.tasks FOR INSERT
WITH CHECK (
  is_admin_or_above(auth.uid())
  AND (
    (get_user_company(auth.uid()) IS NULL)
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = tasks.project_id
      AND p.company_id = get_user_company(auth.uid())
      AND p.division = get_user_division(auth.uid())
    )
  )
);

DROP POLICY IF EXISTS "Admin or assignee can update tasks" ON public.tasks;
CREATE POLICY "Admin or assignee can update tasks"
ON public.tasks FOR UPDATE
USING (
  assignee_id = auth.uid()
  OR (
    is_admin_or_above(auth.uid())
    AND (
      get_user_company(auth.uid()) IS NULL
      OR EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = tasks.project_id
        AND p.company_id = get_user_company(auth.uid())
        AND p.division = get_user_division(auth.uid())
      )
    )
  )
);

DROP POLICY IF EXISTS "Admin can delete tasks" ON public.tasks;
CREATE POLICY "Admin can delete tasks"
ON public.tasks FOR DELETE
USING (
  is_admin_or_above(auth.uid())
  AND (
    get_user_company(auth.uid()) IS NULL
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = tasks.project_id
      AND p.company_id = get_user_company(auth.uid())
      AND p.division = get_user_division(auth.uid())
    )
  )
);

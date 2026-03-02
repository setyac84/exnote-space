
-- =============================================
-- PROJECTS: Update 4 RLS policies
-- =============================================

-- 1. SELECT
DROP POLICY IF EXISTS "Read projects" ON public.projects;
CREATE POLICY "Read projects" ON public.projects FOR SELECT USING (
  (is_super_admin(auth.uid()) AND (get_user_company(auth.uid()) IS NULL))
  OR (is_super_admin(auth.uid()) AND is_in_user_company_group(auth.uid(), company_id))
  OR (is_admin_or_above(auth.uid()) AND is_in_user_company_group(auth.uid(), company_id) AND (division = get_user_division(auth.uid())))
  OR user_has_task_in_project(auth.uid(), id)
);

-- 2. INSERT
DROP POLICY IF EXISTS "Admin can insert projects" ON public.projects;
CREATE POLICY "Admin can insert projects" ON public.projects FOR INSERT WITH CHECK (
  (is_super_admin(auth.uid()) AND (get_user_company(auth.uid()) IS NULL))
  OR (is_super_admin(auth.uid()) AND is_in_user_company_group(auth.uid(), company_id))
  OR (is_admin_or_above(auth.uid()) AND (division = get_user_division(auth.uid())) AND is_in_user_company_group(auth.uid(), company_id))
);

-- 3. UPDATE
DROP POLICY IF EXISTS "Admin can update projects" ON public.projects;
CREATE POLICY "Admin can update projects" ON public.projects FOR UPDATE USING (
  (is_super_admin(auth.uid()) AND (get_user_company(auth.uid()) IS NULL))
  OR (is_super_admin(auth.uid()) AND is_in_user_company_group(auth.uid(), company_id))
  OR (is_admin_or_above(auth.uid()) AND is_in_user_company_group(auth.uid(), company_id) AND (division = get_user_division(auth.uid())))
);

-- 4. DELETE
DROP POLICY IF EXISTS "Admin can delete projects" ON public.projects;
CREATE POLICY "Admin can delete projects" ON public.projects FOR DELETE USING (
  (is_super_admin(auth.uid()) AND (get_user_company(auth.uid()) IS NULL))
  OR (is_super_admin(auth.uid()) AND is_in_user_company_group(auth.uid(), company_id))
  OR (is_admin_or_above(auth.uid()) AND is_in_user_company_group(auth.uid(), company_id) AND (division = get_user_division(auth.uid())))
);

-- =============================================
-- TASKS: Update 4 RLS policies
-- =============================================

-- 1. SELECT
DROP POLICY IF EXISTS "Read tasks" ON public.tasks;
CREATE POLICY "Read tasks" ON public.tasks FOR SELECT USING (
  (is_super_admin(auth.uid()) AND (get_user_company(auth.uid()) IS NULL))
  OR (is_super_admin(auth.uid()) AND EXISTS (SELECT 1 FROM projects p WHERE p.id = tasks.project_id AND is_in_user_company_group(auth.uid(), p.company_id)))
  OR (assignee_id = auth.uid())
  OR (is_admin_or_above(auth.uid()) AND project_in_user_scope(auth.uid(), project_id))
);

-- 2. INSERT
DROP POLICY IF EXISTS "Admin can insert tasks" ON public.tasks;
CREATE POLICY "Admin can insert tasks" ON public.tasks FOR INSERT WITH CHECK (
  is_admin_or_above(auth.uid()) AND (
    (get_user_company(auth.uid()) IS NULL)
    OR (is_super_admin(auth.uid()) AND EXISTS (SELECT 1 FROM projects p WHERE p.id = tasks.project_id AND is_in_user_company_group(auth.uid(), p.company_id)))
    OR (EXISTS (SELECT 1 FROM projects p WHERE p.id = tasks.project_id AND is_in_user_company_group(auth.uid(), p.company_id) AND p.division = get_user_division(auth.uid())))
  )
);

-- 3. UPDATE
DROP POLICY IF EXISTS "Admin or assignee can update tasks" ON public.tasks;
CREATE POLICY "Admin or assignee can update tasks" ON public.tasks FOR UPDATE USING (
  (assignee_id = auth.uid())
  OR (is_admin_or_above(auth.uid()) AND (
    (get_user_company(auth.uid()) IS NULL)
    OR (is_super_admin(auth.uid()) AND EXISTS (SELECT 1 FROM projects p WHERE p.id = tasks.project_id AND is_in_user_company_group(auth.uid(), p.company_id)))
    OR (EXISTS (SELECT 1 FROM projects p WHERE p.id = tasks.project_id AND is_in_user_company_group(auth.uid(), p.company_id) AND p.division = get_user_division(auth.uid())))
  ))
);

-- 4. DELETE
DROP POLICY IF EXISTS "Admin can delete tasks" ON public.tasks;
CREATE POLICY "Admin can delete tasks" ON public.tasks FOR DELETE USING (
  is_admin_or_above(auth.uid()) AND (
    (get_user_company(auth.uid()) IS NULL)
    OR (is_super_admin(auth.uid()) AND EXISTS (SELECT 1 FROM projects p WHERE p.id = tasks.project_id AND is_in_user_company_group(auth.uid(), p.company_id)))
    OR (EXISTS (SELECT 1 FROM projects p WHERE p.id = tasks.project_id AND is_in_user_company_group(auth.uid(), p.company_id) AND p.division = get_user_division(auth.uid())))
  )
);


-- Fix infinite recursion: projects SELECT policy references tasks, tasks SELECT references projects

-- Drop problematic policies
DROP POLICY IF EXISTS "Read projects" ON public.projects;
DROP POLICY IF EXISTS "Read tasks" ON public.tasks;

-- Create a security definer function to check if user has tasks in a project
CREATE OR REPLACE FUNCTION public.user_has_task_in_project(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tasks
    WHERE project_id = _project_id AND assignee_id = _user_id
  );
$$;

-- Create a security definer function to check if project belongs to user's division & company
CREATE OR REPLACE FUNCTION public.project_in_user_scope(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = _project_id
      AND company_id = get_user_company(_user_id)
      AND division = get_user_division(_user_id)
  );
$$;

-- Recreate projects READ policy without referencing tasks directly
CREATE POLICY "Read projects" ON public.projects
FOR SELECT USING (
  is_super_admin(auth.uid())
  OR (
    company_id = get_user_company(auth.uid())
    AND (
      (is_admin_or_above(auth.uid()) AND division = get_user_division(auth.uid()))
      OR user_has_task_in_project(auth.uid(), id)
    )
  )
);

-- Recreate tasks READ policy without referencing projects directly
CREATE POLICY "Read tasks" ON public.tasks
FOR SELECT USING (
  is_super_admin(auth.uid())
  OR assignee_id = auth.uid()
  OR (is_admin_or_above(auth.uid()) AND project_in_user_scope(auth.uid(), project_id))
);

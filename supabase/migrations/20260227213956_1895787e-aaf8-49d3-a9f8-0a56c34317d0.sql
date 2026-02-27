
-- Fix: allow members to read projects if they have tasks assigned in that project
-- Remove the company_id requirement for the user_has_task_in_project path
DROP POLICY IF EXISTS "Read projects" ON public.projects;

CREATE POLICY "Read projects"
ON public.projects
FOR SELECT
USING (
  is_super_admin(auth.uid())
  OR (
    is_admin_or_above(auth.uid())
    AND division = get_user_division(auth.uid())
  )
  OR user_has_task_in_project(auth.uid(), id)
);

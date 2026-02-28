-- Fix: Update the RLS policy for task UPDATE to handle NULL company_id for admins
DROP POLICY IF EXISTS "Admin or assignee can update tasks" ON public.tasks;

CREATE POLICY "Admin or assignee can update tasks"
ON public.tasks FOR UPDATE
USING (
  is_super_admin(auth.uid()) 
  OR (assignee_id = auth.uid()) 
  OR (
    is_admin_or_above(auth.uid()) 
    AND EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = tasks.project_id 
        AND (get_user_company(auth.uid()) IS NULL OR p.company_id = get_user_company(auth.uid())) 
        AND p.division = get_user_division(auth.uid())
    )
  )
);
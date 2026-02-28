
-- Fix project_in_user_scope to handle NULL company_id
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
      AND (
        get_user_company(_user_id) IS NULL 
        OR company_id = get_user_company(_user_id)
      )
      AND division = get_user_division(_user_id)
  );
$$;

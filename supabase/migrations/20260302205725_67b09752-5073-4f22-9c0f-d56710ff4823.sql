
CREATE OR REPLACE FUNCTION public.create_company_with_owner(
  _name text,
  _description text DEFAULT ''
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _company_id uuid;
  _user_id uuid := auth.uid();
  _user_role app_role;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check user has admin+ role somewhere
  SELECT role INTO _user_role FROM public.user_companies
  WHERE user_id = _user_id AND role IN ('owner', 'super_admin', 'admin')
  LIMIT 1;

  IF _user_role IS NULL THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  -- Create company
  INSERT INTO public.companies (name, description)
  VALUES (_name, _description)
  RETURNING id INTO _company_id;

  -- Auto-assign creator as owner
  INSERT INTO public.user_companies (user_id, company_id, role)
  VALUES (_user_id, _company_id, 'owner');

  RETURN _company_id;
END;
$$;


-- ================================================================
-- MIGRATION: Reset Data & Rebuild Architecture
-- From holding/sub-company hierarchy to flat SaaS with Owner role
-- ================================================================

-- STEP 1: Delete all existing data
DELETE FROM public.task_assignees;
DELETE FROM public.tasks;
DELETE FROM public.projects;
DELETE FROM public.notes;
DELETE FROM public.user_roles;
DELETE FROM public.profiles;
DELETE FROM public.companies;

-- STEP 2: Drop ALL existing RLS policies
DROP POLICY IF EXISTS "Super admin can delete companies" ON public.companies;
DROP POLICY IF EXISTS "Admin can update companies" ON public.companies;
DROP POLICY IF EXISTS "Read companies scoped" ON public.companies;
DROP POLICY IF EXISTS "Admin can insert companies" ON public.companies;

DROP POLICY IF EXISTS "Users can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admin can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile or super admin" ON public.profiles;
DROP POLICY IF EXISTS "Super admin can delete profiles" ON public.profiles;

DROP POLICY IF EXISTS "Read projects" ON public.projects;
DROP POLICY IF EXISTS "Admin can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Admin can update projects" ON public.projects;
DROP POLICY IF EXISTS "Admin can delete projects" ON public.projects;

DROP POLICY IF EXISTS "Read tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admin can insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admin or assignee can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admin can delete tasks" ON public.tasks;

DROP POLICY IF EXISTS "Users can view task assignees" ON public.task_assignees;
DROP POLICY IF EXISTS "Admins can manage task assignees" ON public.task_assignees;

DROP POLICY IF EXISTS "Users can read roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admin can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admin can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admin can delete roles" ON public.user_roles;

-- STEP 3: Drop old helper functions
DROP FUNCTION IF EXISTS public.project_in_user_scope(uuid, uuid);
DROP FUNCTION IF EXISTS public.is_in_user_company_group(uuid, uuid);
DROP FUNCTION IF EXISTS public.get_user_division(uuid);
DROP FUNCTION IF EXISTS public.get_user_company(uuid);
DROP FUNCTION IF EXISTS public.get_user_role(uuid);
DROP FUNCTION IF EXISTS public.is_super_admin(uuid);
DROP FUNCTION IF EXISTS public.is_admin_or_above(uuid);

-- STEP 4: Update handle_new_user (remove user_roles reference)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- STEP 5: Drop user_roles table
DROP TABLE IF EXISTS public.user_roles;

-- STEP 6: Enum changes - replace app_role (add 'owner')
CREATE TYPE public.app_role_v2 AS ENUM ('owner', 'super_admin', 'admin', 'member');
DROP TYPE public.app_role;
ALTER TYPE public.app_role_v2 RENAME TO app_role;

-- STEP 7: Schema changes

-- Companies: drop parent_id (flat structure)
ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_parent_id_fkey;
ALTER TABLE public.companies DROP COLUMN IF EXISTS parent_id;

-- Create divisions table (GLOBAL)
CREATE TABLE public.divisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;

-- Seed default divisions
INSERT INTO public.divisions (name) VALUES ('Creative'), ('Developer');

-- Create user_companies junction table
CREATE TABLE public.user_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, company_id)
);
ALTER TABLE public.user_companies ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX idx_user_companies_user_id ON public.user_companies(user_id);
CREATE INDEX idx_user_companies_company_id ON public.user_companies(company_id);

-- Projects: replace division enum with division_id UUID
ALTER TABLE public.projects ADD COLUMN division_id UUID REFERENCES public.divisions(id);
ALTER TABLE public.projects DROP COLUMN division;

-- Profiles: replace division enum with division_id UUID (nullable)
ALTER TABLE public.profiles ADD COLUMN division_id UUID REFERENCES public.divisions(id);
ALTER TABLE public.profiles DROP COLUMN division;

-- Drop app_division enum (no longer used)
DROP TYPE IF EXISTS public.app_division;

-- STEP 8: New helper functions

CREATE OR REPLACE FUNCTION public.user_belongs_to_company(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_companies
    WHERE user_id = _user_id AND company_id = _company_id
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_role_in_company(_user_id uuid, _company_id uuid)
RETURNS public.app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_companies
  WHERE user_id = _user_id AND company_id = _company_id
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_highest_role(_user_id uuid)
RETURNS public.app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_companies
  WHERE user_id = _user_id
  ORDER BY CASE role
    WHEN 'owner' THEN 1
    WHEN 'super_admin' THEN 2
    WHEN 'admin' THEN 3
    WHEN 'member' THEN 4
  END
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_owner_or_super(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_companies
    WHERE user_id = _user_id AND role IN ('owner', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_above_in_company(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_companies
    WHERE user_id = _user_id AND company_id = _company_id
    AND role IN ('owner', 'super_admin', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_division_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT division_id FROM public.profiles WHERE id = _user_id LIMIT 1;
$$;

-- STEP 9: New RLS policies

-- DIVISIONS
CREATE POLICY "Authenticated can read divisions"
ON public.divisions FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Owner/super can insert divisions"
ON public.divisions FOR INSERT TO authenticated
WITH CHECK (public.is_owner_or_super(auth.uid()));

CREATE POLICY "Owner/super can update divisions"
ON public.divisions FOR UPDATE TO authenticated
USING (public.is_owner_or_super(auth.uid()));

CREATE POLICY "Owner/super can delete divisions"
ON public.divisions FOR DELETE TO authenticated
USING (public.is_owner_or_super(auth.uid()));

-- USER_COMPANIES
CREATE POLICY "Read user_companies"
ON public.user_companies FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.user_belongs_to_company(auth.uid(), company_id)
);

CREATE POLICY "Owner/super can insert user_companies"
ON public.user_companies FOR INSERT TO authenticated
WITH CHECK (public.is_owner_or_super(auth.uid()));

CREATE POLICY "Owner/super can update user_companies"
ON public.user_companies FOR UPDATE TO authenticated
USING (public.is_owner_or_super(auth.uid()));

CREATE POLICY "Owner/super can delete user_companies"
ON public.user_companies FOR DELETE TO authenticated
USING (public.is_owner_or_super(auth.uid()));

-- COMPANIES
CREATE POLICY "Read companies"
ON public.companies FOR SELECT TO authenticated
USING (public.user_belongs_to_company(auth.uid(), id));

CREATE POLICY "Owner/super can insert companies"
ON public.companies FOR INSERT TO authenticated
WITH CHECK (public.is_owner_or_super(auth.uid()));

CREATE POLICY "Owner/super can update companies"
ON public.companies FOR UPDATE TO authenticated
USING (public.is_owner_or_super(auth.uid()) AND public.user_belongs_to_company(auth.uid(), id));

CREATE POLICY "Owner/super can delete companies"
ON public.companies FOR DELETE TO authenticated
USING (public.is_owner_or_super(auth.uid()) AND public.user_belongs_to_company(auth.uid(), id));

-- PROFILES
CREATE POLICY "Read profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_companies uc1
    INNER JOIN public.user_companies uc2 ON uc1.company_id = uc2.company_id
    WHERE uc1.user_id = auth.uid() AND uc2.user_id = profiles.id
  )
);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid());

CREATE POLICY "Owner/super can update profiles"
ON public.profiles FOR UPDATE TO authenticated
USING (
  public.is_owner_or_super(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.user_companies uc1
    INNER JOIN public.user_companies uc2 ON uc1.company_id = uc2.company_id
    WHERE uc1.user_id = auth.uid() AND uc2.user_id = profiles.id
  )
);

CREATE POLICY "Owner/super can delete profiles"
ON public.profiles FOR DELETE TO authenticated
USING (
  public.is_owner_or_super(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.user_companies uc1
    INNER JOIN public.user_companies uc2 ON uc1.company_id = uc2.company_id
    WHERE uc1.user_id = auth.uid() AND uc2.user_id = profiles.id
  )
);

-- PROJECTS
CREATE POLICY "Read projects"
ON public.projects FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_companies
    WHERE user_id = auth.uid() AND company_id = projects.company_id
    AND role IN ('owner', 'super_admin')
  )
  OR (
    EXISTS (
      SELECT 1 FROM public.user_companies
      WHERE user_id = auth.uid() AND company_id = projects.company_id
      AND role = 'admin'
    )
    AND division_id = public.get_user_division_id(auth.uid())
  )
  OR public.user_has_task_in_project(auth.uid(), id)
);

CREATE POLICY "Admin+ can insert projects"
ON public.projects FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_companies
    WHERE user_id = auth.uid() AND company_id = projects.company_id
    AND role IN ('owner', 'super_admin')
  )
  OR (
    EXISTS (
      SELECT 1 FROM public.user_companies
      WHERE user_id = auth.uid() AND company_id = projects.company_id
      AND role = 'admin'
    )
    AND division_id = public.get_user_division_id(auth.uid())
  )
);

CREATE POLICY "Admin+ can update projects"
ON public.projects FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_companies
    WHERE user_id = auth.uid() AND company_id = projects.company_id
    AND role IN ('owner', 'super_admin')
  )
  OR (
    EXISTS (
      SELECT 1 FROM public.user_companies
      WHERE user_id = auth.uid() AND company_id = projects.company_id
      AND role = 'admin'
    )
    AND division_id = public.get_user_division_id(auth.uid())
  )
);

CREATE POLICY "Admin+ can delete projects"
ON public.projects FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_companies
    WHERE user_id = auth.uid() AND company_id = projects.company_id
    AND role IN ('owner', 'super_admin')
  )
  OR (
    EXISTS (
      SELECT 1 FROM public.user_companies
      WHERE user_id = auth.uid() AND company_id = projects.company_id
      AND role = 'admin'
    )
    AND division_id = public.get_user_division_id(auth.uid())
  )
);

-- TASKS
CREATE POLICY "Read tasks"
ON public.tasks FOR SELECT TO authenticated
USING (
  assignee_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = tasks.project_id
    AND (
      EXISTS (
        SELECT 1 FROM public.user_companies
        WHERE user_id = auth.uid() AND company_id = p.company_id
        AND role IN ('owner', 'super_admin')
      )
      OR (
        EXISTS (
          SELECT 1 FROM public.user_companies
          WHERE user_id = auth.uid() AND company_id = p.company_id
          AND role = 'admin'
        )
        AND p.division_id = public.get_user_division_id(auth.uid())
      )
    )
  )
);

CREATE POLICY "Admin+ can insert tasks"
ON public.tasks FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = tasks.project_id
    AND (
      EXISTS (
        SELECT 1 FROM public.user_companies
        WHERE user_id = auth.uid() AND company_id = p.company_id
        AND role IN ('owner', 'super_admin')
      )
      OR (
        EXISTS (
          SELECT 1 FROM public.user_companies
          WHERE user_id = auth.uid() AND company_id = p.company_id
          AND role = 'admin'
        )
        AND p.division_id = public.get_user_division_id(auth.uid())
      )
    )
  )
);

CREATE POLICY "Admin+ or assignee can update tasks"
ON public.tasks FOR UPDATE TO authenticated
USING (
  assignee_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = tasks.project_id
    AND (
      EXISTS (
        SELECT 1 FROM public.user_companies
        WHERE user_id = auth.uid() AND company_id = p.company_id
        AND role IN ('owner', 'super_admin')
      )
      OR (
        EXISTS (
          SELECT 1 FROM public.user_companies
          WHERE user_id = auth.uid() AND company_id = p.company_id
          AND role = 'admin'
        )
        AND p.division_id = public.get_user_division_id(auth.uid())
      )
    )
  )
);

CREATE POLICY "Admin+ can delete tasks"
ON public.tasks FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = tasks.project_id
    AND (
      EXISTS (
        SELECT 1 FROM public.user_companies
        WHERE user_id = auth.uid() AND company_id = p.company_id
        AND role IN ('owner', 'super_admin')
      )
      OR (
        EXISTS (
          SELECT 1 FROM public.user_companies
          WHERE user_id = auth.uid() AND company_id = p.company_id
          AND role = 'admin'
        )
        AND p.division_id = public.get_user_division_id(auth.uid())
      )
    )
  )
);

-- TASK_ASSIGNEES
CREATE POLICY "Read task_assignees"
ON public.task_assignees FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.projects p ON p.id = t.project_id
    WHERE t.id = task_assignees.task_id
    AND public.user_belongs_to_company(auth.uid(), p.company_id)
  )
);

CREATE POLICY "Admin+ can manage task_assignees"
ON public.task_assignees FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.projects p ON p.id = t.project_id
    WHERE t.id = task_assignees.task_id
    AND public.is_admin_or_above_in_company(auth.uid(), p.company_id)
  )
);

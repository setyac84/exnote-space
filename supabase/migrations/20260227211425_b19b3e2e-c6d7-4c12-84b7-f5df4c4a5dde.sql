
-- Allow super admin to update any profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile or super admin"
ON public.profiles FOR UPDATE
USING (id = auth.uid() OR is_super_admin(auth.uid()));

-- Allow super admin to delete profiles
CREATE POLICY "Super admin can delete profiles"
ON public.profiles FOR DELETE
USING (is_super_admin(auth.uid()));

-- Allow super admin to also delete associated user_roles when deleting member
-- (already handled by user_roles delete policy for super admin)

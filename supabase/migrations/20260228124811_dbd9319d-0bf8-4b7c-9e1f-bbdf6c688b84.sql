
DROP POLICY "Super admin can update companies" ON public.companies;

CREATE POLICY "Admin can update companies"
ON public.companies FOR UPDATE
TO authenticated
USING (
  is_admin_or_above(auth.uid())
  AND is_in_user_company_group(auth.uid(), id)
);

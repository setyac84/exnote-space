

## Analysis

The root cause is the last migration added `OR is_admin_or_above(auth.uid())` to the companies SELECT policy, letting any admin see all companies. This breaks the multi-tenant isolation.

The correct architecture:
- **Holding (company_id=NULL)**: sees all companies, can manage everything
- **Scoped Super Admin (company_id=X)**: sees only their own company, can add companies for their group
- **Scoped Admin (company_id=X)**: sees only their own company, cannot add/manage companies
- **SKOR BOLD!** and **Evindo Global Putra** are isolated from each other

## Plan

### 1. Fix Companies RLS Policies (migration)

**SELECT**: Revert to only `(get_user_company(auth.uid()) IS NULL) OR (id = get_user_company(auth.uid()))` -- remove `is_admin_or_above`

**INSERT**: Change from `is_admin_or_above` to `is_super_admin` -- only super_admin can create companies

**UPDATE**: Keep scoped to own company for super_admin only (change `is_admin_or_above` to `is_super_admin`)

**DELETE**: Keep as-is (already requires holding)

### 2. Fix CompanyPage UI

Change `isAdmin` check to `isSuperAdmin` for showing Add/Edit/Delete buttons, so regular admins cannot manage companies.

### 3. Fix ProjectModal company dropdown

For scoped admins: don't show dropdown, auto-assign their own company. Only holding (company_id=NULL) should see the company selector dropdown.

Change condition from `isEditable && isAdmin` to `isEditable && isHolding` for the company dropdown.


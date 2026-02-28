

## Plan: Multi-Tenancy dengan Holding Company

### Konsep
- **Holding Super Admin** (`company_id = NULL`, yaitu `admin@admin.com` saat ini): bisa lihat **semua** company, project, task, member — tetap seperti sekarang
- **Company Super Admin** (`company_id = 'xxx'`): hanya bisa lihat data **company-nya sendiri**
- Pola ini sudah didukung sebagian oleh RLS yang ada (`company_id IS NULL` = global access)

### Kondisi Saat Ini
- 6 user, semua `company_id = NULL` (global)
- 4 companies: EEX, Monkeysee, Shu Daxia, SKOR
- 7 projects sudah terassign ke berbagai company
- RLS projects/tasks sudah punya pola `get_user_company IS NULL OR company_id = get_user_company`

### Yang Perlu Diubah

#### 1. Migration SQL — Update RLS yang belum scoped
- **companies SELECT**: ubah dari `true` → `get_user_company(auth.uid()) IS NULL OR id = get_user_company(auth.uid())`
- **profiles SELECT**: ubah dari `auth.uid() IS NOT NULL` → `get_user_company(auth.uid()) IS NULL OR company_id = get_user_company(auth.uid()) OR id = auth.uid()`
- **task_assignees SELECT**: ubah dari `true` → scope via task→project company
- **user_roles READ**: pastikan holding bisa baca semua, scoped hanya company-nya
- Companies INSERT/UPDATE/DELETE: holding bisa semua, scoped super admin hanya company sendiri

#### 2. Edge Function: `register-company` (baru)
- Input: `company_name`, `email`, `password`, `name`
- Buat company baru → buat user baru → set `company_id` pada profile → set role `super_admin`
- Hanya bisa dipanggil oleh holding super admin (company_id IS NULL)

#### 3. Update Edge Functions
- **create-member**: auto-assign `company_id` dari caller's company. Holding super admin bisa pilih company mana
- **delete-member**: validasi target member ada di company yang sama (atau caller adalah holding)
- **reset-member-password**: validasi company scope (atau holding)

#### 4. Frontend
- **Halaman Register Company** (`/register-company`): form untuk holding super admin membuat company baru + super admin pertamanya
- **MemberPage.tsx**: tampilkan company filter untuk holding super admin; scoped super admin hanya lihat member company-nya
- **CompanyPage.tsx**: holding lihat semua company; scoped super admin lihat company-nya saja
- **ProjectModal.tsx**: holding bisa pilih company; scoped super admin auto-assign company-nya
- **Sidebar.tsx**: tambah link "Register Company" untuk holding super admin
- **App.tsx**: tambah route `/register-company`

### Flow Demo
1. Login `admin@admin.com` (holding, `company_id = NULL`) → bisa lihat semua data seperti sekarang
2. Buka Register Company → buat "Company X" + super admin baru (misal `admin@companyx.com`)
3. Login `admin@companyx.com` → hanya lihat data Company X (awalnya kosong)
4. Super admin Company X bisa tambah member, project, task — **tidak bisa lihat data company lain**
5. Holding super admin tetap bisa lihat dan kelola semua company

### Files yang Dibuat/Diubah
- 1 migration SQL (update RLS policies)
- `supabase/functions/register-company/index.ts` (baru)
- Update `supabase/functions/create-member/index.ts`
- Update `supabase/functions/delete-member/index.ts`
- Update `supabase/functions/reset-member-password/index.ts`
- `src/pages/RegisterCompany.tsx` (baru)
- `src/pages/MemberPage.tsx` (company filter untuk holding)
- `src/pages/CompanyPage.tsx` (scope untuk non-holding)
- `src/components/ProjectModal.tsx` (auto company untuk non-holding)
- `src/components/Sidebar.tsx` (link register company)
- `src/App.tsx` (route baru)


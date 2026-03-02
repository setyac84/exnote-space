

## Rencana Migrasi: Reset Data & Arsitektur Baru

Migrasi besar dari sistem hierarki holding/sub-company ke flat SaaS-style dengan **Owner** role, **multi-company** per user, dan **dynamic divisions**.

---

### Phase 1: Database Migration (Reset & Rebuild)

**1.1 Hapus semua data existing**
- Delete semua rows dari: `task_assignees`, `tasks`, `projects`, `notes`, `user_roles`, `profiles`, `companies`
- Delete semua auth users via edge function (service role)

**1.2 Update enum `app_role`**
- Tambah value `'owner'` ke enum `app_role`

**1.3 Hapus kolom `parent_id` dari `companies`**
- Drop foreign key `companies_parent_id_fkey`
- Drop kolom `parent_id`

**1.4 Buat tabel `divisions`**
```sql
CREATE TABLE divisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);
-- Enable RLS
-- Seed: Creative, Developer
```

**1.5 Buat tabel `user_companies`**
```sql
CREATE TABLE user_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, company_id)
);
-- Enable RLS
```

**1.6 Update tabel `projects`**
- Ganti kolom `division` (enum) → `division_id` (UUID references `divisions`)

**1.7 Update tabel `profiles`**
- Ganti kolom `division` (enum) → `division_id` (UUID references `divisions`, nullable)
- Kolom `company_id` tetap sebagai "primary company" untuk backward compat

**1.8 Hapus tabel `user_roles`** (diganti `user_companies.role`)

**1.9 Drop helper functions lama & buat yang baru**
- Drop: `is_in_user_company_group`, `get_user_division`, `get_user_company`, `get_user_role`, `is_super_admin`, `is_admin_or_above`, `project_in_user_scope`
- Buat baru:
  - `user_belongs_to_company(uid, cid)` → cek `user_companies`
  - `get_user_role_in_company(uid, cid)` → return role dari junction
  - `get_user_highest_role(uid)` → MAX role across all companies
  - `is_owner_or_super(uid)` → cek role owner/super_admin di any company
  - `is_admin_or_above_in_company(uid, cid)` → cek role >= admin di company
  - `get_user_division_id(uid)` → dari profiles.division_id

**1.10 Rewrite semua RLS policies**

Logika baru yang jauh lebih simpel:

- **companies**: user bisa lihat company yang ada di `user_companies`; owner/super_admin bisa CRUD
- **profiles**: user bisa lihat profiles yang share company via `user_companies`; owner/super_admin bisa manage
- **projects**: 
  - Owner/Super Admin di company → semua divisi
  - Admin di company → hanya `division_id` = user's division
  - Member → hanya jika punya task di project
- **tasks**: ikut scope project + assignee check
- **divisions**: semua authenticated bisa read; owner/super_admin bisa CRUD
- **user_companies**: owner/super_admin bisa manage; user bisa read own

**1.11 Update trigger `handle_new_user`**
- Tetap buat profile, tapi TIDAK buat entry di `user_roles` (sudah dihapus)
- Entry `user_companies` akan dibuat oleh edge function register

---

### Phase 2: Edge Functions

**2.1 Buat `register` (BARU, publik tanpa auth)**
- Input: `name`, `email`, `password`, `company_name`
- Proses: buat user → buat company → buat entry `user_companies` (role=owner) → buat default divisions (Creative, Developer)
- Config: `verify_jwt = false`

**2.2 Update `create-member`**
- Caller harus owner/super_admin/admin (cek via `user_companies`)
- Admin hanya bisa create member
- Input tambahan: `company_ids[]` (assign ke multiple companies), `division_id`
- Buat entry di `user_companies` untuk setiap company

**2.3 Update `delete-member`**
- Owner tidak bisa dihapus
- Cek akses via `user_companies` bukan parent_id

**2.4 Update `reset-member-password`**
- Cek akses via `user_companies`

**2.5 Hapus `register-company`** (diganti `register`)

---

### Phase 3: Frontend

**3.1 Types (`src/types/index.ts`)**
- Hapus static `Division` enum → tambah `Division` interface (`id`, `name`)
- Tambah `'owner'` ke `UserRole`
- Update `Project` interface: `division` → `division_id`
- Tambah `UserCompany` interface

**3.2 AuthContext (`src/contexts/AuthContext.tsx`)**
- Fetch user's companies dari `user_companies` (bukan dari `profiles.company_id`)
- Fetch division dari `profiles.division_id` + `divisions` table
- Tambah `companies[]` state, `activeCompany` state
- `activeDivision` → ambil dari tabel `divisions`
- Hapus logika `company_id === null` (tidak ada lagi global SA)
- Tambah `isOwner` computed property

**3.3 Hooks (`src/hooks/useSupabaseData.ts`)**
- Tambah: `useDivisions()`, `useCreateDivision()`, `useDeleteDivision()`
- Tambah: `useUserCompanies()` — fetch user's company assignments
- Update `useMembers()` → join via `user_companies` bukan `user_roles`
- Update `useCreateCompany()` → flat (tanpa parent_id)
- Hapus `useRegisterCompany()`
- Update semua query yang pakai `division` enum → `division_id`

**3.4 Pages**

- **Buat `Register.tsx`** → halaman publik self-register (nama, email, password, nama company)
- **Update `Login.tsx`** → tambah link ke `/register`
- **Update `App.tsx`** → tambah route `/register`, hapus route `/register-company`
- **Update `Sidebar.tsx`**:
  - Hapus "Register Company" nav item
  - Division switcher ambil dari tabel `divisions`
  - Company switcher jika user punya >1 company
  - Tampilkan "Owner" role label
  - Hapus logika `company_id === null`
- **Update `CompanyPage.tsx`**:
  - Hapus semua logika parent/child (holdings, sub-companies)
  - Flat list companies dari `user_companies`
  - Owner bisa add company baru + assign member ke company
- **Update `MemberPage.tsx`**:
  - Division dropdown ambil dari `divisions` table
  - Role options tambah 'owner' (read-only)
  - Assign member ke multiple companies
  - Hapus logika holding/isHolding
- **Update `Dashboard.tsx`**:
  - Filter berdasarkan `activeCompany` + `division_id`
  - Hapus referensi `parent_id`
- **Update `ProjectModal.tsx`** → division dropdown dari DB
- **Update `TaskModal.tsx`** → sesuaikan division reference
- **Hapus `RegisterCompany.tsx`**

---

### Urutan Implementasi

Karena ini perubahan besar, implementasi akan dilakukan bertahap:

1. Database migration (reset data + schema changes + RLS)
2. Edge functions (register publik + update create-member)
3. Frontend types, context, hooks
4. Frontend pages (Register, Login, Sidebar, Company, Member, Dashboard, dll)
5. Cleanup (hapus file & kode lama)


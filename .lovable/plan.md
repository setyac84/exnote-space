

## Masalah: RLS Policy Membatasi Super Admin Holding Berdasarkan Divisi

### Analisis Akar Masalah

User `admin@evindo.com` adalah **super_admin** dengan `company_id = Evindo Global Putra` dan `division = management`.

Kebijakan RLS saat ini untuk tabel `projects` dan `tasks` memiliki logika:

```text
Kondisi 1: is_super_admin AND company_id IS NULL  → hanya Global Super Admin
Kondisi 2: is_admin_or_above AND is_in_company_group AND division = user_division
Kondisi 3: user_has_task_in_project (tasks only)
```

- Kondisi 1 **gagal** karena `admin@evindo.com` punya `company_id` (bukan NULL).
- Kondisi 2 **gagal** karena divisi user adalah `management`, sedangkan project berdivisi `creative`.
- Akibatnya: **tidak ada data yang muncul**.

### Solusi

Update RLS policies pada tabel **projects** dan **tasks** agar **Holding Super Admin** (super_admin yang punya company_id) bisa melihat dan mengelola **semua divisi** dalam grup perusahaannya, tanpa dibatasi pengecekan divisi.

### Perubahan Detail

**1. Tabel `projects` - 4 policy (SELECT, INSERT, UPDATE, DELETE)**

Tambahkan kondisi baru di setiap policy:
```sql
-- Sebelum (hanya global super admin skip divisi):
is_super_admin(auth.uid()) AND get_user_company(auth.uid()) IS NULL

-- Tambah kondisi untuk Holding Super Admin:
OR (is_super_admin(auth.uid()) AND is_in_user_company_group(auth.uid(), company_id))
```

**2. Tabel `tasks` - 4 policy (SELECT, INSERT, UPDATE, DELETE)**

Sama, tambahkan kondisi Holding Super Admin yang bisa akses semua divisi dalam grup perusahaannya.

### Ringkasan
- Tidak ada perubahan kode frontend
- Hanya update 8 RLS policies di database (4 projects + 4 tasks)
- Holding Super Admin akan bisa melihat semua data lintas divisi dalam grup perusahaannya


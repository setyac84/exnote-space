## Plan: 4 Perubahan UI — Dashboard Width, Dark Mode, Spacing, Profile Edit

### 1. Samakan lebar Dashboard dengan halaman lain

- Dashboard saat ini `max-w-7xl`, halaman lain `max-w-5xl`
- Ubah `max-w-7xl` → `max-w-8xl` di `Dashboard.tsx` line 114

### 2. Tambah spacing antara "Hello, super" dan "Today is"

- Tambah `mt-3` atau `gap-2` pada paragraf "Today is" di `Dashboard.tsx` line 119

### 3. Dark Mode Switch di Sidebar

- Tambah dark mode support menggunakan `next-themes` (sudah terinstall)
- Wrap app dengan `ThemeProvider` di `main.tsx`
- Tambah toggle switch dark/light di Sidebar, di atas section account user (sebelum border-t)
- Tambah CSS variabel dark mode di `index.css`

### 4. Profile Edit Popup di Sidebar

- Buat user name area di sidebar bisa di-klik → buka Dialog/Popover
- Dialog berisi form: avatar/foto (initials saja dulu), nama, position
- Gunakan `useUpdateProfile` yang sudah ada + `refreshProfile` dari AuthContext
- Simpan perubahan ke database

### Files yang Diubah

- `src/pages/Dashboard.tsx` — max-width + spacing
- `src/index.css` — dark mode CSS variables
- `src/main.tsx` — wrap ThemeProvider
- `src/components/Sidebar.tsx` — dark mode toggle + profile edit popup
- `src/contexts/AuthContext.tsx` — pastikan `refreshProfile` tersedia (sudah ada)
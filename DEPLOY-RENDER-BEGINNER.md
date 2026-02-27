# Deploy ke Render (buat yang biasa Netlify)

Netlify itu enak buat website static. Project kamu **bukan cuma static** karena ada:
- API `/api/*` (Express)
- Admin panel `/admin.html`
- Upload gambar + simpan ke Supabase

Jadi paling gampang: **deploy semuanya sebagai 1 Node Web Service di Render**.

---

## 0) Pastikan project ada di GitHub

Render deploy paling gampang dari GitHub.

---

## 1) Setup Supabase (sekali doang)

1. Buka Supabase Dashboard → project kamu
2. SQL Editor → run file `SUPABASE-SCHEMA.sql`
3. Storage → buat bucket:
   - Nama: `portfolio-images`
   - Visibility: **Public**

Kalau bucket tidak public, gambar project bakal susah tampil.

---

## 2) Bikin secret buat admin token (wajib untuk production)

Render butuh env `ADMIN_TOKEN_SECRET`. Bikin yang random panjang.

Paling gampang (jalanin di laptop):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy output-nya, nanti paste di Render.

---

## 3) Deploy di Render (step-by-step)

1. Login Render
2. Klik **New** → **Web Service**
3. Connect ke GitHub → pilih repo portfolio ini
4. Isi konfigurasi:
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm start`

5. Tambahin **Environment Variables** ini:

```
SUPABASE_URL=...
SUPABASE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

ADMIN_USERNAME=admin
ADMIN_PASSWORD=ubah_ini_yang_kuat
ADMIN_TOKEN_SECRET=paste_dari_step_2

SUPABASE_STORAGE_BUCKET=portfolio-images
PROJECT_I18N_OBJECT_PATH=meta/projects.json

NODE_ENV=production
```

6. Klik **Create Web Service**
7. Tunggu build + deploy selesai

Setelah selesai, Render akan kasih URL semacam:
`https://nama-service.onrender.com`

---

## 4) Tes setelah live

1. Buka home:
   - `https://.../`
2. Health check:
   - `https://.../api/health`
3. Admin:
   - `https://.../admin.html`
   - Login pakai `ADMIN_USERNAME/ADMIN_PASSWORD`
4. Coba create project + upload gambar
   - Pastikan `image_url` jadi URL Supabase (bukan `/assets/uploads/...`)

---

## 5) Kalau ada masalah (yang paling sering)

### A) Gambar tidak muncul
- Pastikan bucket `portfolio-images` public
- Pastikan env `SUPABASE_STORAGE_BUCKET=portfolio-images`

### B) Login admin bisa, tapi create/update gagal (401)
- Biasanya token belum kebaca
- Clear localStorage di browser, login ulang
- Pastikan env `ADMIN_TOKEN_SECRET` sudah di-set di Render

### C) Deploy sukses tapi web error
- Buka Logs di Render, cari error message
- Pastikan semua env Supabase lengkap


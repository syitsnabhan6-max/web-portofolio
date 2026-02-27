# Hosting (Production) - Quick Guide

Project ini butuh hosting yang bisa jalanin Node.js karena ada:
- Frontend (static)
- Admin panel
- API `/api/*`

Rekomendasi: deploy sebagai 1 service Node (Render / Railway / Fly.io), lalu semua jalan di 1 domain.

## 1) Supabase (wajib)

Pastikan Supabase sudah siap:
- Tables sudah dibuat (run `SUPABASE-SCHEMA.sql`)
- Bucket Storage ada dan diset **Public**
  - Default bucket yang dipakai code: `portfolio-images`

## 2) Environment Variables (wajib di hosting)

Set env vars ini di dashboard hosting:

```
SUPABASE_URL=...
SUPABASE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

ADMIN_USERNAME=...
ADMIN_PASSWORD=...
ADMIN_TOKEN_SECRET=... (random panjang)

SUPABASE_STORAGE_BUCKET=portfolio-images
PROJECT_I18N_OBJECT_PATH=meta/projects.json

NODE_ENV=production
```

Catatan:
- `SUPABASE_SERVICE_ROLE_KEY` hanya untuk server, jangan pernah dipakai di frontend.
- `ADMIN_TOKEN_SECRET` wajib diganti dari default supaya token admin aman.

## 3) Deploy (Render contoh)

1. New Web Service → connect repo
2. Build command:
   - `npm install`
3. Start command:
   - `npm start`
4. Tambahin semua env vars di atas
5. Deploy

## 4) Checklist setelah live

- Buka `/` pastikan portfolio ke-load dan modal project jalan
- Buka `/admin.html` login, pastikan:
  - Create/update/delete project berhasil
  - Upload image tersimpan (URL-nya mengarah ke Supabase Storage)
  - Translation project tersimpan (server pakai `meta/projects.json` di bucket)


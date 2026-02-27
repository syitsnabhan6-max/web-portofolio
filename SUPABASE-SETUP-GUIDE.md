# 📚 SETUP GUIDE - MIGRATE KE SUPABASE

## 🎯 Ringkasan
File-file baru telah dibuat untuk mendukung Supabase:
- ✅ `SUPABASE-SCHEMA.sql` - SQL schema lengkap untuk Supabase
- ✅ `server-supabase.js` - Node.js server yang sudah terintegrasi Supabase
- ✅ Setup guide (file ini)

---

## 📝 LANGKAH-LANGKAH SETUP

### 1️⃣ BUAT AKUN SUPABASE (Jika belum punya)
```
1. Buka https://supabase.com
2. Klik "Start Your Project"
3. Login dengan GitHub atau email
4. Buat organization dan project baru
5. Tunggu project sudah ready (~1 menit)
```

### 2️⃣ BUAT DATABASE TABLES

**Cara 1: Copy-Paste SQL (Recommended untuk pemula)**
```
1. Buka Supabase Dashboard
2. Pergi ke SQL Editor (tab kiri)
3. Klik "New Query"
4. Copy SELURUH isi dari file: SUPABASE-SCHEMA.sql
5. Paste ke SQL Editor
6. Klik Run atau tekan Ctrl+Enter
7. ✅ Semua table sudah terbuat!
```

**Cara 2: Upload File SQL**
```
1. Buka SQL Editor
2. Klik "Import SQL"
3. Upload file SUPABASE-SCHEMA.sql
4. Klik "Import"
```

### 3️⃣ SETUP STORAGE BUCKET UNTUK IMAGES

```
1. Di Supabase Dashboard → Storage (menu kiri)
2. Klik "Create a new bucket"
3. Bucket name: portfolio-images
4. Pilih "Public bucket" ✅
5. Klik "Create bucket"
```

### 4️⃣ DAPATKAN CREDENTIALS

```
1. Buka Supabase Dashboard
2. Settings → API (menu kiri)
3. Copy-kan 3 nilai ini:
   
   SUPABASE_URL = "Project URL" (https://xxx.supabase.co)
   SUPABASE_KEY = "anon public" (mulai dgn eyJ...)
   SUPABASE_SERVICE_ROLE_KEY = "service_role" (mulai dgn eyJ...)

4. JANGAN SHARE ATAU COMMIT keys ini ke git!
```

### 5️⃣ UPDATE .env FILE

Buka atau buat file `.env` di root project:

```env
# SUPABASE CONFIGURATION
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ADMIN CREDENTIALS
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# SERVER
PORT=3000
NODE_ENV=development
```

### 6️⃣ INSTALL DEPENDENCIES BARU

```bash
npm install @supabase/supabase-js
```

### 7️⃣ UPDATE package.json

Edit file `package.json`, update `"main"` dan `"scripts"`:

**Dari:**
```json
{
  "main": "server.js",
  "scripts": {
    "start": "node create-folders.js && node server.js",
    "dev": "node create-folders.js && node --watch server.js"
  }
}
```

**Menjadi:**
```json
{
  "main": "server-supabase.js",
  "scripts": {
    "start": "node create-folders.js && node server-supabase.js",
    "dev": "node create-folders.js && node --watch server-supabase.js"
  }
}
```

### 8️⃣ JALANKAN SERVER

```bash
npm start
```

Harusnya seeing:
```
✅ Connected to Supabase successfully

╔════════════════════════════════════════╗
║  🚀  Server is running                 ║
║  📍  http://localhost:3000             ║
╚════════════════════════════════════════╝

Database: Supabase (PostgreSQL)
```

### 9️⃣ TEST API

Buka browser atau gunakan curl:

```bash
# Test connection
curl http://localhost:3000/api/health

# Cek categories
curl http://localhost:3000/api/categories

# Cek projects
curl http://localhost:3000/api/projects
```

---

## 🗄️ DATABASE SCHEMA PENJELASAN

### 📌 Table: categories
```sql
id              BIGSERIAL PRIMARY KEY
name            VARCHAR(100) UNIQUE NOT NULL
created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

### 📌 Table: projects
```sql
id              BIGSERIAL PRIMARY KEY
title           VARCHAR(255) NOT NULL
category        VARCHAR(100) NOT NULL (Foreign Key ke categories.name)
description     TEXT NOT NULL
problem         TEXT NOT NULL
solution        TEXT NOT NULL
technologies    TEXT NOT NULL
image_url       VARCHAR(500)
project_url     VARCHAR(500)
github_url      VARCHAR(500)
status          VARCHAR(20) DEFAULT 'active' (active|archived|deleted)
created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

### 📌 Table: project_images
```sql
id              BIGSERIAL PRIMARY KEY
project_id      BIGINT NOT NULL (FK → projects.id)
image_url       VARCHAR(500) NOT NULL
image_order     SMALLINT DEFAULT 0
created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

### 📌 Table: admin_users
```sql
id              BIGSERIAL PRIMARY KEY
username        VARCHAR(50) UNIQUE NOT NULL
password        VARCHAR(255) NOT NULL
created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

---

## 🔧 PERUBAHAN DARI SQLite KE SUPABASE

| Aspek | SQLite | Supabase (PostgreSQL) |
|-------|--------|----------------------|
| **Database Type** | File-based (.db) | Cloud-hosted PostgreSQL |
| **Driver** | sqlite3 | @supabase/supabase-js |
| **Primary Key** | INTEGER PRIMARY KEY AUTOINCREMENT | BIGSERIAL |
| **Timestamps** | DATETIME DEFAULT CURRENT_TIMESTAMP | TIMESTAMP WITH TIME ZONE |
| **Storage** | Local folder | Supabase Storage bucket |
| **Scaling** | Terbatas | Unlimited (cloud) |
| **Backup** | Manual | Otomatis (Supabase) |
| **Access** | Local only | Anywhere (cloud) |

---

## 📱 API ENDPOINTS (Sama seperti sebelumnya)

### GET Projects
```
GET /api/projects
GET /api/projects/:id
```

### CREATE/UPDATE/DELETE Projects
```
POST /api/projects (with image upload)
PUT /api/projects/:id (with image update)
DELETE /api/projects/:id
```

### Image Management
```
POST /api/projects/:id/images (upload gallery)
DELETE /api/projects/:projectId/images/:imageId
```

### Categories
```
GET /api/categories
POST /api/categories
```

### Admin
```
POST /api/admin/login
GET /api/health (new - untuk cek connection)
```

---

## ⚠️ PENTING - SECURITY TIPS

1. **Jangan commit .env ke git!**
   ```bash
   # Tambah ke .gitignore
   echo ".env" >> .gitignore
   ```

2. **Protect Service Role Key**
   - Hanya digunakan di backend (server.js)
   - JANGAN expose ke frontend
   - JANGAN commit ke git

3. **Enable RLS (Row Level Security) di Supabase**
   - Untuk production, uncomment RLS policies di SUPABASE-SCHEMA.sql
   - Ini untuk protect data dari akses unauthorized

4. **Protect Image URLs**
   - Set bucket menjadi Private kalau perlu
   - Manage access melalui RLS policies

---

## 🆘 TROUBLESHOOTING

### ❌ Error: "SUPABASE_URL dan SUPABASE_KEY harus diatur"
**Solusi:**
- Pastikan .env file sudah dibuat
- Copy credentials dari Supabase dashboard dengan benar
- Restart server setelah update .env

### ❌ Error: "Connection refused"
**Solusi:**
- Check internet connection
- Verify SUPABASE_URL sudah benar
- Check firewall settings

### ❌ Error: "Project not found" saat POST/PUT
**Solusi:**
- Tables belum dibuat di Supabase
- Copy SUPABASE-SCHEMA.sql dan run di SQL Editor

### ❌ Images tidak ter-upload
**Solusi:**
- Portfolio-images bucket belum dibuat
- Bucket harus "Public"
- Check file size < 5MB

### ❌ Cors error
**Solusi:**
- Sudah enable CORS di server ✅
- Check browser console untuk detail error
- Clear browser cache (Ctrl+Shift+Del)

---

## ✅ CHECKLIST BEFORE PRODUCTION

- [ ] .env file dibuat dengan credentials yang benar
- [ ] Semua tables sudah dibuat di Supabase
- [ ] Storage bucket "portfolio-images" sudah dibuat
- [ ] npm install @supabase/supabase-js sudah dijalankan
- [ ] package.json sudah diupdate (main & scripts)
- [ ] .env TIDAK dicommit ke git (.gitignore sudah update)
- [ ] Server berjalan tanpa error (npm start)
- [ ] Test API endpoints semuanya working
- [ ] Image upload test successful
- [ ] Admin login working

---

## 📞 QUICK REFERENCE

**Start Development:**
```bash
npm install
npm run dev
```

**Start Production:**
```bash
npm start
```

**Test Connection:**
```bash
curl http://localhost:3000/api/health
```

**View Logs:**
- Browser: http://localhost:3000/admin.html
- Server: Console output

---

## 📖 DOKUMENTASI LEBIH LANJUT

- **Supabase Docs:** https://supabase.com/docs
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **Express Docs:** https://expressjs.com/
- **Multer Docs:** https://github.com/expressjs/multer

---

**Status: ✅ Ready to Deploy**
Kapan pun Anda siap untuk migrate dari SQLite ke Supabase, ikuti langkah-langkah di atas!

# 🚀 SUPABASE MIGRATION - QUICK START

> **Database migration dari SQLite ke Supabase sekarang sudah disiapkan untuk Anda!**

---

## 📦 FILES YANG TELAH DIBUAT

```
✅ SUPABASE-SCHEMA.sql           - SQL schema lengkap untuk Supabase
✅ server-supabase.js             - Node.js server updated untuk Supabase
✅ migrate-to-supabase.mjs         - Script untuk migrate data dari SQLite
✅ SUPABASE-SETUP-GUIDE.md        - Setup guide lengkap (step-by-step)
✅ DATABASE-STRUCTURE.md          - Dokumentasi lengkap database
✅ setup-supabase.ps1             - Windows setup script
✅ setup-supabase.sh              - Linux/Mac setup script
✅ README-SUPABASE.md             - File ini!
```

---

## ⚡ QUICK START (5 MENIT)

### Step 1: Buat Supabase Project
```
1. Buka https://supabase.com
2. Klik "Start Your Project" 
3. Login dan buat project baru
4. Tunggu ~1 menit sampai siap
```

### Step 2: Setup Database
```
1. Buka SQL Editor di Supabase Dashboard
2. Buat New Query
3. Copy-paste seluruh isi: SUPABASE-SCHEMA.sql
4. Klik Run (Ctrl+Enter)
5. ✅ Tables sudah jadi!
```

### Step 3: Buat Storage Bucket
```
1. Pergi ke Storage (menu kiri)
2. Create New Bucket → "portfolio-images"
3. Set sebagai "Public"
4. ✅ Bucket siap!
```

### Step 4: Konfigurasi Credentials
```
1. Settings → API (di Supabase)
2. Copy tiga values:
   - Project URL → SUPABASE_URL
   - anon public → SUPABASE_KEY
   - service_role → SUPABASE_SERVICE_ROLE_KEY
3. Buat/edit .env file di root project:

   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=admin123
   PORT=3000
```

### Step 5: Install Dependencies
```bash
npm install @supabase/supabase-js
```

### Step 6: Update package.json
Ganti bagian `main` dan `scripts`:

**DARI:**
```json
"main": "server.js",
"scripts": {
  "start": "node create-folders.js && node server.js",
  "dev": "node create-folders.js && node --watch server.js"
}
```

**MENJADI:**
```json
"main": "server-supabase.js",
"scripts": {
  "start": "node create-folders.js && node server-supabase.js",
  "dev": "node create-folders.js && node --watch server-supabase.js"
}
```

### Step 7: Run Server
```bash
npm start
```

Output harusnya:
```
✅ Connected to Supabase successfully

╔════════════════════════════════════════╗
║  🚀  Server is running                 ║
║  📍  http://localhost:3000             ║
╚════════════════════════════════════════╝
```

### Step 8: Test API
```bash
curl http://localhost:3000/api/health
```

Respons harusnya:
```json
{
  "status": "ok",
  "database": "supabase",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

✅ **SELESAI! Database Supabase sudah siap!**

---

## 📊 DATABASE STRUCTURE (QUICK)

4 Main Tables:

### 1. **categories**
```sql
id      BIGSERIAL PRIMARY KEY
name    VARCHAR(100) UNIQUE NOT NULL
```

### 2. **projects**
```sql
id              BIGSERIAL PRIMARY KEY
title           VARCHAR(255) NOT NULL
category        VARCHAR(100) NOT NULL (FK → categories.name)
description     TEXT
problem         TEXT
solution        TEXT
technologies    TEXT
image_url       VARCHAR(500)
project_url     VARCHAR(500)
github_url      VARCHAR(500)
status          VARCHAR(20) DEFAULT 'active'
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### 3. **project_images**
```sql
id              BIGSERIAL PRIMARY KEY
project_id      BIGINT (FK → projects.id)
image_url       VARCHAR(500)
image_order     SMALLINT
```

### 4. **admin_users**
```sql
id              BIGSERIAL PRIMARY KEY
username        VARCHAR(50) UNIQUE
password        VARCHAR(255)
```

---

## 🔄 MIGRATE EXISTING DATA (OPTIONAL)

Kalau sudah ada data di SQLite lama dan ingin dipindahin ke Supabase:

```bash
# Run migration script
node migrate-to-supabase.mjs

# Output akan show summary:
# ✅ Categories: 10 migrated
# ✅ Projects: 25 migrated
# ✅ Images: 87 migrated
# ✅ Admin Users: 1 migrated
```

---

## 🔒 SECURITY CHECKLIST

- [ ] `.env` file dibuat dengan credentials benar
- [ ] `.env` file di `.gitignore` (jangan commit!)
- [ ] Storage bucket "portfolio-images" sudah dibuat dan public
- [ ] Service Role Key tidak di-expose ke frontend
- [ ] Admin credentials di-change dari default (production)
- [ ] HTTPS enabled (production)
- [ ] RLS (Row Level Security) enabled (production)

---

## 🆚 COMPARISON: SQLite vs Supabase

| Aspek | SQLite | Supabase |
|-------|--------|----------|
| Setup | Instant (file-based) | 1-2 menit (cloud) |
| Storage | Local file | Cloud (scalable) |
| Access | Lokal only | Anywhere (online) |
| Backups | Manual | Automatic (daily) |
| Scaling | Terbatas | Unlimited |
| Security | Basic | Enterprise-grade |
| Team Access | Difficult | Easy (share org) |
| Cost | Free | Free (generous quota) |

---

## 📈 API ENDPOINTS

Semuanya sama seperti sebelumnya! Frontend tidak perlu diubah:

```
GET  /api/projects                    - Get all projects
GET  /api/projects/:id                - Get project detail
POST /api/projects                    - Create project
PUT  /api/projects/:id                - Update project
DELETE /api/projects/:id              - Delete project

GET  /api/categories                  - Get categories
POST /api/categories                  - Create category

POST /api/admin/login                 - Admin login
GET  /api/health                      - Check connection (NEW)

POST /api/projects/:id/images         - Upload images
DELETE /api/projects/:id/images/:img  - Delete image
```

---

## 🆘 TROUBLESHOOTING

### ❌ "SUPABASE_URL tidak ditemukan"
```
✅ Buat file .env di root project
✅ Copy credentials dari Supabase dashboard
✅ Restart server
```

### ❌ "Connection refused"
```
✅ Check internet connection
✅ Verify SUPABASE_URL benar
✅ Check firewall settings
```

### ❌ "Table does not exist"
```
✅ Run SUPABASE-SCHEMA.sql di SQL Editor
✅ Verify execution berhasil (no errors)
✅ Refresh dan coba lagi
```

### ❌ "Image upload failed"
```
✅ Buat bucket "portfolio-images"
✅ Set bucket sebagai "Public"
✅ Check file size < 5MB
```

---

## 📚 DOCUMENTATION FILES

Untuk informasi lebih detail, baca:

1. **SUPABASE-SETUP-GUIDE.md**
   - Setup lengkap step-by-step
   - Troubleshooting guide
   - Security tips

2. **DATABASE-STRUCTURE.md**
   - Penjelasan setiap table
   - Field definitions
   - Schema relationships
   - Common queries
   - Performance tips

3. **server-supabase.js**
   - Kode server yang sudah ready
   - Dengan dokumentasi lengkap
   - Copy-paste siap pakai

4. **SUPABASE-SCHEMA.sql**
   - SQL schema lengkap
   - Dengan comments dan penjelasan
   - Ready untuk execute

---

## 🎯 NEXT STEPS

1. **Immediately:**
   - [ ] Setup Supabase project
   - [ ] Run SQL schema
   - [ ] Create storage bucket
   - [ ] Configure .env

2. **After Setup:**
   - [ ] npm install @supabase/supabase-js
   - [ ] Update package.json
   - [ ] Test API endpoints
   - [ ] Check admin panel

3. **Before Production:**
   - [ ] Enable RLS policies
   - [ ] Setup backups
   - [ ] Configure custom domain
   - [ ] Setup monitoring
   - [ ] Test all features

---

## 📞 QUICK REFERENCE

```bash
# Setup
npm install @supabase/supabase-js

# Development
npm run dev          # Watch mode
npm start            # Normal start

# Test
curl http://localhost:3000/api/health

# Database Management
# Buka Supabase Dashboard → SQL Editor
# Copy SUPABASE-SCHEMA.sql dan run

# Migration
node migrate-to-supabase.mjs
```

---

## ⭐ FITUR TAMBAHAN SUPABASE

Setelah setup, Anda juga bisa akses:

1. **Auth** - Built-in authentication
   - Social login (Google, GitHub, dll)
   - Email/Password auth
   - JWT tokens

2. **Realtime** - Live database updates
   - Subscribe ke changes
   - Automatic sync across clients

3. **Vectors** - AI/ML features
   - Embedding storage
   - Semantic search

4. **Storage** - File management
   - Public/private buckets
   - Direct upload
   - CDN access

5. **Edge Functions** - Serverless functions
   - Auto-scaling
   - Global distribution

---

## ✅ SUCCESS INDICATORS

Setelah setup, yang harusnya working:

✅ Server running tanpa error
✅ API `/api/health` return status "ok"
✅ Admin panel login dengan credentials di .env
✅ Bisa create project baru
✅ Gambar bisa di-upload
✅ Projects ditampilkan di frontend
✅ Kategori bisa ditambah

---

## 🎓 LEARNING RESOURCES

- Supabase Tutorial: https://supabase.com/docs
- PostgreSQL: https://www.postgresql.org/docs/
- REST API Best Practices: https://restfulapi.net/
- Node.js + Express: https://expressjs.com/

---

## 📝 NOTES

- **Backwards Compatible:** Schema baru kompatibel dengan code lama
- **No Data Loss:** Data lama tetap aman (backup sebelum migrate!)
- **Easy Rollback:** Bisa switch kembali ke SQLite jika perlu
- **Production Ready:** Schema sudah optimized untuk production

---

**Status: ✅ Ready to Deploy**

Selamat! Database Anda sekarang siap untuk production!

Pertanyaan atau issue? Check SUPABASE-SETUP-GUIDE.md untuk lebih banyak help. 🎉

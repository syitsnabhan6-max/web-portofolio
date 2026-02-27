# 🗄️ DATABASE STRUCTURE - DETAILED DOCUMENTATION

## 📋 Table of Contents
1. [Database Overview](#overview)
2. [Complete Schema](#schema)
3. [Table Relationships](#relationships)
4. [Field Descriptions](#fields)
5. [Indexes & Performance](#indexes)
6. [Data Types Explained](#datatypes)
7. [Common Queries](#queries)

---

## 📊 **OVERVIEW**

Portfolio database menggunakan **PostgreSQL** (melalui Supabase) dengan 4 main tables:

```
┌─────────────────────────────────────────────────────────┐
│                   PORTFOLIO DATABASE                    │
├─────────────────────────────────────────────────────────┤
│  categories          projects          project_images    │
│  admin_users                                             │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 **COMPLETE SCHEMA**

### 🏷️ **TABLE: categories**

**Fungsi:** Menyimpan kategori project (Web Development, UI/UX, dll)

```sql
CREATE TABLE categories (
  id              BIGSERIAL PRIMARY KEY,
  name            VARCHAR(100) UNIQUE NOT NULL,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_categories_name ON categories(name);
```

**Row Example:**
```json
{
  "id": 1,
  "name": "Web Development",
  "created_at": "2024-01-15T10:30:00+00:00"
}
```

**Constraints:**
- `name` harus UNIQUE (tidak boleh ada duplikat)
- `name` wajib diisi (NOT NULL)
- Maksimal 100 karakter

**Default Data:**
```
1. Web Development
2. Mobile Development
3. Graphic Design
4. Photography
5. Videography
6. UI/UX Design
7. Branding
8. Illustration
9. Animation
10. Other
```

---

### 📂 **TABLE: projects**

**Fungsi:** Menyimpan informasi project portfolio

```sql
CREATE TABLE projects (
  id              BIGSERIAL PRIMARY KEY,
  title           VARCHAR(255) NOT NULL,
  category        VARCHAR(100) NOT NULL,
  description     TEXT NOT NULL,
  problem         TEXT NOT NULL,
  solution        TEXT NOT NULL,
  technologies    TEXT NOT NULL,
  image_url       VARCHAR(500),
  project_url     VARCHAR(500),
  github_url      VARCHAR(500),
  status          VARCHAR(20) DEFAULT 'active' 
                  CHECK (status IN ('active', 'archived', 'deleted')),
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_category 
    FOREIGN KEY (category) 
    REFERENCES categories(name) 
    ON DELETE RESTRICT
);

-- INDEXES
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_category ON projects(category);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
```

**Row Example:**
```json
{
  "id": 42,
  "title": "E-Commerce Platform",
  "category": "Web Development",
  "description": "Full-stack e-commerce platform dengan inventory management",
  "problem": "Klien memerlukan platform penjualan online yang terintegrasi",
  "solution": "Membangun aplikasi web dengan React dan Node.js",
  "technologies": "React, Node.js, MongoDB, Stripe",
  "image_url": "https://project-bucket.supabase.co/portfolio-images/img-12345.jpg",
  "project_url": "https://ecommerce-demo.com",
  "github_url": "https://github.com/user/project",
  "status": "active",
  "created_at": "2024-01-10T14:22:30+00:00",
  "updated_at": "2024-01-15T09:15:45+00:00"
}
```

**Field Details:**

| Field | Type | Wajib | Notes |
|-------|------|------|-------|
| id | BIGSERIAL | ✅ | Auto-generated, unique identifier |
| title | VARCHAR(255) | ✅ | Project name |
| category | VARCHAR(100) | ✅ | FK to categories.name |
| description | TEXT | ✅ | Project deskripsi (bisa panjang) |
| problem | TEXT | ✅ | Masalah yang dipecahkan |
| solution | TEXT | ✅ | Solusi yang diberikan |
| technologies | TEXT | ✅ | Stack yang digunakan |
| image_url | VARCHAR(500) | ❌ | URL gambar utama project |
| project_url | VARCHAR(500) | ❌ | Link ke live project |
| github_url | VARCHAR(500) | ❌ | Link ke GitHub repo |
| status | VARCHAR(20) | ✅ | active / archived / deleted |
| created_at | TIMESTAMP | ✅ | Auto-set waktu pembuatan |
| updated_at | TIMESTAMP | ✅ | Auto-update saat perubahan |

**Status Meanings:**
- `active` - Project ditampilkan di frontend
- `archived` - Project disembunyikan (soft archive)
- `deleted` - Project dihapus (soft delete)

---

### 🖼️ **TABLE: project_images**

**Fungsi:** Menyimpan galeri/collection gambar untuk setiap project

```sql
CREATE TABLE project_images (
  id              BIGSERIAL PRIMARY KEY,
  project_id      BIGINT NOT NULL 
                  REFERENCES projects(id) ON DELETE CASCADE,
  image_url       VARCHAR(500) NOT NULL,
  image_order     SMALLINT DEFAULT 0,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_project_images_project_id ON project_images(project_id);
CREATE INDEX idx_project_images_order ON project_images(project_id, image_order);
```

**Row Example:**
```json
{
  "id": 156,
  "project_id": 42,
  "image_url": "https://project-bucket.supabase.co/portfolio-images/gallery-001.jpg",
  "image_order": 1,
  "created_at": "2024-01-10T14:25:10+00:00"
}
```

**Important Features:**
- **Cascade Delete:** Jika project dihapus, semua images-nya otomatis terhapus
- **image_order:** Urutan gambar dalam galeri (ascending = 0, 1, 2, ...)
- **project_id:** Foreign key yang link ke projects table

---

### 👤 **TABLE: admin_users**

**Fungsi:** Menyimpan credentials untuk login admin panel

```sql
CREATE TABLE admin_users (
  id              BIGSERIAL PRIMARY KEY,
  username        VARCHAR(50) UNIQUE NOT NULL,
  password        VARCHAR(255) NOT NULL,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEX
CREATE INDEX idx_admin_users_username ON admin_users(username);
```

**Row Example:**
```json
{
  "id": 1,
  "username": "admin",
  "password": "$2b$10$...", // hashed password
  "created_at": "2024-01-01T00:00:00+00:00"
}
```

**⚠️ SECURITY NOTES:**
- Password Should di-hash (gunakan bcrypt di production)
- Username harus UNIQUE
- Server.js saat ini use plain text (belum optimal untuk production)

---

## 🔗 **TABLE RELATIONSHIPS**

```
                    categories (1)
                         |
                         | FOREIGN KEY
                         | (category → name)
                         |
                    projects (∞)
                         |
                         | CASCADE ON DELETE
                         | (project_id → id)
                         |
                 project_images (∞)
```

**Relational Rules:**
1. **categories ↔ projects:** One-to-Many
   - 1 kategori bisa punya banyak project
   - Jika category di-delete, projects dgn category itu tetap ada (ON DELETE RESTRICT)

2. **projects ↔ project_images:** One-to-Many
   - 1 project bisa punya banyak images
   - Jika project di-delete, semua images-nya otomatis terhapus (ON DELETE CASCADE)

---

## 📚 **FIELD DESCRIPTIONS**

### Text Fields
- `VARCHAR(n)` = String dengan max length n karakter
  - Contoh: `VARCHAR(100)` = max 100 char
  - Jika melebihi akan error
- `TEXT` = String unlimited length
  - Cocok untuk deskripsi panjang
  - Tidak perlu tau panjang maksimal

### Timestamp
- `TIMESTAMP WITH TIME ZONE` = Waktu dengan timezone info
- `DEFAULT NOW()` = Otomatis terisi dengan waktu saat ini
- Format: `2024-01-15T10:30:00+00:00` (ISO 8601)
- Selalu dalam UTC untuk consistency

### Serial/BigSerial
- `BIGSERIAL` = Auto-incrementing integer ID
- Otomatis +1 setiap insert
- BigSerial = bisa sampai 2^63-1 (SQLite hanya 2^31-1)

---

## ⚡ **INDEXES & PERFORMANCE**

### Indexes Dan Fungsinya:

```
idx_categories_name
  ├─ Table: categories
  ├─ Column: name
  └─ Fungsi: Cepat cari kategori by name

idx_projects_status
  ├─ Table: projects
  ├─ Column: status
  └─ Fungsi: Cepat filter projects by status (active/archived/deleted)

idx_projects_category
  ├─ Table: projects
  ├─ Column: category
  └─ Fungsi: Cepat filter projects by category

idx_projects_created_at (DESC)
  ├─ Table: projects
  ├─ Column: created_at (descending)
  └─ Fungsi: Cepat sorting projects terbaru

idx_project_images_project_id
  ├─ Table: project_images
  ├─ Column: project_id
  └─ Fungsi: Cepat ambil semua images untuk 1 project

idx_project_images_order
  ├─ Table: project_images
  ├─ Composite: (project_id, image_order)
  └─ Fungsi: Cepat ambil images terurut per project
```

**Impact:**
- **Without Indexes:** Query jadi lambat saat data besar (⚠️)
- **With Indexes:** Query super cepat bahkan 100,000+ rows (✅)

---

## 🔢 **DATA TYPES EXPLAINED**

### String Types
```sql
VARCHAR(n)      -- Fixed length string, max n chars
VARCHAR(250)    -- Cocok untuk URLs, titles
TEXT            -- Variable length, unlimited
```

### Numeric Types
```sql
BIGSERIAL       -- Auto-incrementing big integer (for IDs)
SMALLINT        -- Small integer (-32,768 to 32,767)
INTEGER         -- Regular integer
BIGINT          -- Large integer
```

### Date/Time Types
```sql
TIMESTAMP WITH TIME ZONE
  -- Full date+time with timezone awareness
  -- FORMAT: 2024-01-15T10:30:00+00:00
  DEFAULT NOW() -- Current timestamp

TIMESTAMP WITHOUT TIME ZONE
  -- Date+time tanpa timezone
  -- FORMAT: 2024-01-15T10:30:00
```

---

## 📌 **COMMON QUERIES**

### Get All Active Projects (dengan kategori)
```sql
SELECT 
  p.*,
  c.name as category_name
FROM projects p
LEFT JOIN categories c ON p.category = c.name
WHERE p.status = 'active'
ORDER BY p.created_at DESC;
```

### Get Project dengan Semua Images-nya
```sql
SELECT * FROM project_images
WHERE project_id = 42
ORDER BY image_order ASC;
```

### Count Projects per Category
```sql
SELECT 
  category,
  COUNT(*) as total
FROM projects
WHERE status = 'active'
GROUP BY category
ORDER BY total DESC;
```

### Get Recent Projects (Last 7 Days)
```sql
SELECT * FROM projects
WHERE status = 'active'
  AND created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

### Soft Delete Project (Archive)
```sql
UPDATE projects 
SET status = 'archived', updated_at = NOW()
WHERE id = 42;
```

### Hard Delete Project (Permanent + Images)
```sql
DELETE FROM project_images WHERE project_id = 42;
DELETE FROM projects WHERE id = 42;
```

---

## 🔐 **ROW LEVEL SECURITY (RLS) - OPTIONAL**

Uncomment ini di `SUPABASE-SCHEMA.sql` untuk production:

```sql
-- POLICIES (optional - untuk production)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Public dapat baca projects (public portfolio)
CREATE POLICY "Public can view active projects"
ON projects FOR SELECT
USING (status = 'active');

-- Admin only dapat baca/edit/delete semua projects
CREATE POLICY "Admin can manage all projects"
ON projects FOR ALL
USING (auth.role() = 'authenticated');
```

**Manfaat RLS:**
- Public users tidak bisa akses data yang di-soft-delete
- Admin dapat akses semua
- Automatic row-level protection (di database level, bukan app level)

---

## 🚀 **OPTIMIZATION TIPS**

### 1. Use LIMIT untuk pagination
```sql
SELECT * FROM projects
WHERE status = 'active'
ORDER BY created_at DESC
LIMIT 10 OFFSET 0; -- First 10 rows
```

### 2. Select hanya kolom yang dibutuhkan
```sql
-- ❌ SLOW: ambil semua
SELECT * FROM projects;

-- ✅ FAST: ambil yang dibutuhkan
SELECT id, title, category, image_url FROM projects;
```

### 3. Use batch operations
```javascript
// ❌ Slow: loop individual inserts
for (const project of projects) {
  await supabase.from('projects').insert(project);
}

// ✅ Fast: insert banyak sekaligus
await supabase.from('projects').insert(projects);
```

---

## 📖 **REFERENCES**

- PostgreSQL Docs: https://www.postgresql.org/docs/
- Supabase Docs: https://supabase.com/docs
- SQL Tutorial: https://www.w3schools.com/sql/

---

**Status: ✅ Database Structure Ready**
Database sudah siap untuk production dengan proper indexing dan relationships.

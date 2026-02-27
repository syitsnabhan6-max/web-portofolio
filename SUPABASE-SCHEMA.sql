-- ============================================
-- PORTFOLIO DATABASE SCHEMA FOR SUPABASE
-- ============================================
-- Run semua query ini di Supabase SQL Editor
-- Copy-paste seluruh file ini dan eksekusi

-- ============================================
-- 1. CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Add index untuk performa query
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- ============================================
-- 2. PROJECTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  problem TEXT NOT NULL,
  solution TEXT NOT NULL,
  technologies TEXT NOT NULL,
  image_url VARCHAR(500),
  project_url VARCHAR(500),
  github_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  
  -- Foreign key constraint - opsional jika ingin strict validation
  CONSTRAINT fk_category FOREIGN KEY (category) REFERENCES categories(name) ON DELETE RESTRICT
);

-- Add indexes untuk performa
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- ============================================
-- 3. PROJECT_IMAGES TABLE (Gallery)
-- ============================================
CREATE TABLE IF NOT EXISTS project_images (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL,
  image_order SMALLINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_project_images_project_id ON project_images(project_id);
CREATE INDEX IF NOT EXISTS idx_project_images_order ON project_images(project_id, image_order);

-- ============================================
-- 4. ADMIN_USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admin_users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Add index
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);

-- ============================================
-- 5. RLS (Row Level Security) - OPSIONAL
-- ============================================
-- Uncomment jika ingin enable RLS untuk security

-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE project_images ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Public dapat baca kategori dan projects (but not admin data)
-- CREATE POLICY "Public can view projects" ON projects FOR SELECT USING (status = 'active');
-- CREATE POLICY "Public can view categories" ON categories FOR SELECT USING (true);
-- CREATE POLICY "Public can view project images" ON project_images FOR SELECT USING (true);

-- ============================================
-- 6. DEFAULT DATA - CATEGORIES
-- ============================================
-- Run ini untuk insert kategori default
INSERT INTO categories (name) VALUES
  ('Web Development'),
  ('Mobile Development'),
  ('Graphic Design'),
  ('Photography'),
  ('Videography'),
  ('UI/UX Design'),
  ('Branding'),
  ('Illustration'),
  ('Animation'),
  ('Other')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- NOTES:
-- ============================================
-- 1. Setiap table punya timestamps (created_at, updated_at)
-- 2. Foreign key: projects.category -> categories.name
-- 3. Cascade delete: hapus project otomatis hapus images-nya
-- 4. Status field untuk soft delete (active/archived/deleted)
-- 5. Indexes sudah dibuatkan untuk performa query
-- 6. RLS bisa di-enable untuk security tambahan
-- 7. Semua query sudah otomatis use TIMEZONE UTC

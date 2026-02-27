import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// SUPABASE CONFIGURATION
// ============================================
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY; // anon key untuk client
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // untuk admin operations

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ ERROR: SUPABASE_URL dan SUPABASE_KEY harus diatur di .env file');
  process.exit(1);
}

// Initialize Supabase clients
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_KEY);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const PROJECT_I18N_PATH = path.join(__dirname, 'assets', 'i18n', 'projects.json');
const PROJECT_I18N_LANGS = ['en', 'id', 'zh', 'ja', 'fr', 'ru', 'es'];
const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'portfolio-images';
const PROJECT_I18N_OBJECT_PATH = process.env.PROJECT_I18N_OBJECT_PATH || 'meta/projects.json';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || 'change-me';

function base64UrlEncode(input) {
  return Buffer.from(input).toString('base64url');
}

function base64UrlDecode(input) {
  return Buffer.from(String(input), 'base64url').toString('utf8');
}

function signToken(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const data = `${headerB64}.${payloadB64}`;
  const sig = crypto.createHmac('sha256', ADMIN_TOKEN_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifyToken(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, sig] = parts;
  const data = `${headerB64}.${payloadB64}`;
  const expected = crypto.createHmac('sha256', ADMIN_TOKEN_SECRET).update(data).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  const payload = JSON.parse(base64UrlDecode(payloadB64));
  if (!payload || typeof payload !== 'object') return null;
  if (payload.exp && Date.now() >= payload.exp * 1000) return null;
  return payload;
}

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || '';
  const m = String(auth).match(/^Bearer\s+(.+)$/i);
  if (!m) return res.status(401).json({ error: 'Unauthorized' });
  const payload = verifyToken(m[1]);
  if (!payload || payload.sub !== 'admin') return res.status(401).json({ error: 'Unauthorized' });
  req.admin = payload;
  next();
}

function parseI18nMap(raw) {
  if (raw === undefined || raw === null) return null;
  const text = String(raw).trim();
  if (!text) return null;
  const obj = JSON.parse(text);
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    throw new Error('Invalid i18n payload (must be a JSON object)');
  }
  const cleaned = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string' && v.trim()) cleaned[String(k).toLowerCase()] = v.trim();
  }
  return Object.keys(cleaned).length ? cleaned : null;
}

function loadProjectI18nFile() {
  try {
    if (!fs.existsSync(PROJECT_I18N_PATH)) {
      const init = {};
      for (const l of PROJECT_I18N_LANGS) init[l] = {};
      fs.mkdirSync(path.dirname(PROJECT_I18N_PATH), { recursive: true });
      fs.writeFileSync(PROJECT_I18N_PATH, JSON.stringify(init, null, 2));
      return init;
    }
    const raw = fs.readFileSync(PROJECT_I18N_PATH, 'utf8');
    const json = JSON.parse(raw);
    if (!json || typeof json !== 'object' || Array.isArray(json)) throw new Error('Invalid projects.json');
    for (const l of PROJECT_I18N_LANGS) {
      if (!json[l] || typeof json[l] !== 'object') json[l] = {};
    }
    return json;
  } catch {
    const init = {};
    for (const l of PROJECT_I18N_LANGS) init[l] = {};
    return init;
  }
}

async function loadProjectI18nStorage() {
  try {
    const { data, error } = await supabaseAdmin.storage.from(STORAGE_BUCKET).download(PROJECT_I18N_OBJECT_PATH);
    if (error) throw error;
    const buffer = Buffer.from(await data.arrayBuffer());
    const json = JSON.parse(buffer.toString('utf8'));
    if (!json || typeof json !== 'object' || Array.isArray(json)) throw new Error('Invalid project translations');
    for (const l of PROJECT_I18N_LANGS) {
      if (!json[l] || typeof json[l] !== 'object') json[l] = {};
    }
    return json;
  } catch {
    return null;
  }
}

async function saveProjectI18nStorage(json) {
  const body = Buffer.from(JSON.stringify(json, null, 2));
  const { error } = await supabaseAdmin.storage.from(STORAGE_BUCKET).upload(PROJECT_I18N_OBJECT_PATH, body, {
    contentType: 'application/json',
    upsert: true,
    cacheControl: '0'
  });
  if (error) throw error;
}

async function updateProjectI18nFile(projectId, maps) {
  const pid = String(projectId);
  const file = (await loadProjectI18nStorage()) || loadProjectI18nFile();

  const fields = ['title', 'description', 'problem', 'solution'];
  for (const field of fields) {
    const map = maps[field];
    if (!map) continue;
    for (const [lang, value] of Object.entries(map)) {
      const l = String(lang).toLowerCase();
      if (!file[l] || typeof file[l] !== 'object') file[l] = {};
      if (!file[l][pid] || typeof file[l][pid] !== 'object') file[l][pid] = {};
      file[l][pid][field] = value;
    }
  }

  try {
    await saveProjectI18nStorage(file);
  } catch {
    fs.mkdirSync(path.dirname(PROJECT_I18N_PATH), { recursive: true });
    fs.writeFileSync(PROJECT_I18N_PATH, JSON.stringify(file, null, 2));
  }
}

// ============================================
// MULTER CONFIGURATION - UPLOAD KE SUPABASE STORAGE
// ============================================
const uploadDir = path.join(os.tmpdir(), 'portfolio-uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage, 
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// ============================================
// HELPER FUNCTION - UPLOAD IMAGE
// ============================================
async function uploadToSupabase(file, folder) {
  const safeFolder = folder ? String(folder).replace(/^\/*/, '').replace(/\.\./g, '') : 'uploads';
  const ext = path.extname(file.originalname || '');
  const base = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
  const objectPath = `${safeFolder}/${base}`;
  const buffer = await fs.promises.readFile(file.path);

  const { error } = await supabaseAdmin.storage.from(STORAGE_BUCKET).upload(objectPath, buffer, {
    upsert: false,
    contentType: file.mimetype || 'application/octet-stream',
    cacheControl: '3600'
  });
  if (error) throw error;

  const { data } = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(objectPath);
  const publicUrl = data?.publicUrl;
  if (!publicUrl) throw new Error('Failed to get public URL for uploaded file');

  try {
    await fs.promises.unlink(file.path);
  } catch {
  }

  return publicUrl;
}

// ============================================
// TEST CONNECTION
// ============================================
async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Database connection error:', error.message);
      return false;
    }
    
    console.log('✅ Connected to Supabase successfully');
    return true;
  } catch (err) {
    console.error('❌ Connection test failed:', err);
    return false;
  }
}

// ============================================
// API ROUTES - PROJECTS
// ============================================

app.get('/api/project-translations', async (req, res) => {
  try {
    const json = (await loadProjectI18nStorage()) || loadProjectI18nFile();
    res.setHeader('Cache-Control', 'no-store');
    res.json(json);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all projects
app.get('/api/projects', async (req, res) => {
  try {
    const { data: projects, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get images untuk setiap project
    const projectsWithImages = await Promise.all(
      (projects || []).map(async (project) => {
        const { data: images } = await supabaseAdmin
          .from('project_images')
          .select('*')
          .eq('project_id', project.id)
          .order('image_order', { ascending: true });

        return {
          ...project,
          images: images || []
        };
      })
    );

    res.json(projectsWithImages);
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET single project with images
app.get('/api/projects/:id', async (req, res) => {
  try {
    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;

    if (project) {
      // Get images untuk project
      const { data: images, error: imgError } = await supabaseAdmin
        .from('project_images')
        .select('*')
        .eq('project_id', req.params.id)
        .order('image_order', { ascending: true });

      if (imgError) throw imgError;

      project.images = images || [];
      res.json(project);
    } else {
      res.status(404).json({ error: 'Project not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE project
app.post('/api/projects', requireAdmin, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'gallery_images', maxCount: 5 }]), async (req, res) => {
  try {
    console.log('📥 POST /api/projects received');
    console.log('📋 Form fields:', req.body);
    console.log('📁 Files:', req.files ? Object.keys(req.files) : 'none');

    const { title, category, description, problem, solution, technologies, project_url, github_url, title_i18n, description_i18n, problem_i18n, solution_i18n } = req.body;
    let titleMap = null;
    let descMap = null;
    let probMap = null;
    let solMap = null;
    try {
      titleMap = parseI18nMap(title_i18n);
      descMap = parseI18nMap(description_i18n);
      probMap = parseI18nMap(problem_i18n);
      solMap = parseI18nMap(solution_i18n);
    } catch (e) {
      return res.status(400).json({ error: e.message || 'Invalid i18n payload' });
    }
    
    // Validate required fields
    if (!title || !category || !description || !problem || !solution || !technologies) {
      const missing = [];
      if (!title) missing.push('title');
      if (!category) missing.push('category');
      if (!description) missing.push('description');
      if (!problem) missing.push('problem');
      if (!solution) missing.push('solution');
      if (!technologies) missing.push('technologies');
      
      console.error('❌ Missing required fields:', missing);
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }

    // Upload main image jika ada
    let image_url = null;
    if (req.files && req.files.image && req.files.image.length > 0) {
      image_url = await uploadToSupabase(req.files.image[0], 'projects/main');
      console.log('📸 Main image uploaded:', image_url);
    }

    // Insert project ke Supabase
    console.log('💾 Inserting project to Supabase...');
    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .insert([{
        title,
        category,
        description,
        problem,
        solution,
        technologies,
        image_url,
        project_url: project_url || null,
        github_url: github_url || null,
        status: 'active'
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase insert error:', error);
      throw error;
    }

    console.log('✅ Project created in Supabase, ID:', project.id);
    if (titleMap || descMap || probMap || solMap) {
      await updateProjectI18nFile(project.id, {
        title: titleMap,
        description: descMap,
        problem: probMap,
        solution: solMap
      });
    }

    // Upload gallery images
    if (req.files && req.files.gallery_images && req.files.gallery_images.length > 0) {
      console.log('📸 Uploading', req.files.gallery_images.length, 'gallery images...');
      for (let i = 0; i < req.files.gallery_images.length; i++) {
        const imgUrl = await uploadToSupabase(req.files.gallery_images[i], `projects/${project.id}/gallery`);
        const { error: imgError } = await supabaseAdmin
          .from('project_images')
          .insert({
            project_id: project.id,
            image_url: imgUrl,
            image_order: i + 1
          });

        if (imgError) {
          console.error('⚠️ Error inserting gallery image:', imgError);
        } else {
          console.log('  ✓ Gallery image', i + 1, 'uploaded');
        }
      }
    }

    res.status(201).json({
      id: project.id,
      message: 'Project created successfully'
    });
  } catch (err) {
    console.error('❌ POST /api/projects error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE project
app.put('/api/projects/:id', requireAdmin, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'gallery_images', maxCount: 5 }]), async (req, res) => {
  try {
    const { title, category, description, problem, solution, technologies, project_url, github_url, title_i18n, description_i18n, problem_i18n, solution_i18n } = req.body;
    const projectId = req.params.id;
    let titleMap = null;
    let descMap = null;
    let probMap = null;
    let solMap = null;
    try {
      titleMap = parseI18nMap(title_i18n);
      descMap = parseI18nMap(description_i18n);
      probMap = parseI18nMap(problem_i18n);
      solMap = parseI18nMap(solution_i18n);
    } catch (e) {
      return res.status(400).json({ error: e.message || 'Invalid i18n payload' });
    }

    // Get existing project
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError) throw projectError;
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Upload new image jika ada
    let image_url = project.image_url;
    if (req.files && req.files.image) {
      image_url = await uploadToSupabase(req.files.image[0], 'projects/main');
    }

    // Update project
    const { error } = await supabaseAdmin
      .from('projects')
      .update({
        title: title || project.title,
        category: category || project.category,
        description: description || project.description,
        problem: problem || project.problem,
        solution: solution || project.solution,
        technologies: technologies || project.technologies,
        image_url,
        project_url: project_url || null,
        github_url: github_url || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    if (error) throw error;
    if (titleMap || descMap || probMap || solMap) {
      await updateProjectI18nFile(projectId, {
        title: titleMap,
        description: descMap,
        problem: probMap,
        solution: solMap
      });
    }

    res.json({ message: 'Project updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE project (soft delete)
app.delete('/api/projects/:id', requireAdmin, async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('projects')
      .update({ status: 'deleted', updated_at: new Date().toISOString() })
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload additional images to project
app.post('/api/projects/:id/images', requireAdmin, upload.array('images', 10), async (req, res) => {
  try {
    const projectId = req.params.id;

    // Check project exists
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const uploadedImages = [];
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const imgUrl = await uploadToSupabase(req.files[i], `projects/${projectId}/gallery`);
        
        await supabaseAdmin
          .from('project_images')
          .insert({
            project_id: projectId,
            image_url: imgUrl,
            image_order: i
          });

        uploadedImages.push(imgUrl);
      }
    }

    res.json({ 
      message: 'Images uploaded successfully', 
      images: uploadedImages 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete project image
app.delete('/api/projects/:projectId/images/:imageId', requireAdmin, async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('project_images')
      .delete()
      .eq('id', req.params.imageId);

    if (error) throw error;
    res.json({ message: 'Image deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// API ROUTES - CATEGORIES
// ============================================

// GET all categories
app.get('/api/categories', async (req, res) => {
  try {
    const { data: categories, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    res.json(categories || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE category
app.post('/api/categories', requireAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Category name required' });
    }

    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert([{ name }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({ error: 'Category already exists' });
      }
      throw error;
    }

    res.status(201).json({ message: 'Category created successfully', name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// API ROUTES - ADMIN
// ============================================

// Admin Login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const iat = Math.floor(Date.now() / 1000);
      const exp = iat + 60 * 60 * 24 * 14;
      const token = signToken({ sub: 'admin', iat, exp });
      res.json({ success: true, token });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// HEALTH CHECK
// ============================================
app.get('/api/health', async (req, res) => {
  try {
    const connected = await testConnection();
    if (connected) {
      res.json({ status: 'ok', database: 'supabase', timestamp: new Date().toISOString() });
    } else {
      res.status(503).json({ status: 'error', message: 'Database connection failed' });
    }
  } catch (err) {
    res.status(503).json({ status: 'error', message: err.message });
  }
});

// DEBUG: Check database content
app.get('/api/debug/projects', requireAdmin, async (req, res) => {
  try {
    // Get all projects (including archived)
    const { data: projects, error: pError } = await supabase
      .from('projects')
      .select('*');

    if (pError) throw pError;

    // Get all images
    const { data: images, error: iError } = await supabase
      .from('project_images')
      .select('*');

    if (iError) throw iError;

    // Get categories
    const { data: categories, error: cError } = await supabase
      .from('categories')
      .select('*');

    if (cError) throw cError;

    res.json({
      total_projects: projects?.length || 0,
      projects: projects,
      total_images: images?.length || 0,
      sample_images: images?.slice(0, 5),
      categories: categories
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// START SERVER
// ============================================
async function startServer() {
  if (process.env.NODE_ENV === 'production' && ADMIN_TOKEN_SECRET === 'change-me') {
    throw new Error('ADMIN_TOKEN_SECRET must be set in production');
  }

  // Test connection first
  const connected = await testConnection();
  
  if (!connected) {
    console.error('⚠️  WARNING: Could not connect to Supabase. Make sure your credentials are correct.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔════════════════════════════════════════╗
║  🚀  Server is running                 ║
║  📍  http://localhost:${PORT}          ║
╚════════════════════════════════════════╝

Database: Supabase (PostgreSQL)
URL: ${SUPABASE_URL}

Test connection: GET /api/health
    `);
  });
}

startServer();

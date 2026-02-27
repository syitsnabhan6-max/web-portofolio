import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import crypto from 'crypto';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import serverless from 'serverless-http';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'portfolio-images';
const PROJECT_I18N_OBJECT_PATH = process.env.PROJECT_I18N_OBJECT_PATH || 'meta/projects.json';
const PROJECT_I18N_LANGS = ['en', 'id', 'zh', 'ja', 'fr', 'ru', 'es'];

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || 'change-me';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_KEY must be set');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_KEY);

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
    const init = {};
    for (const l of PROJECT_I18N_LANGS) init[l] = {};
    return init;
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

async function updateProjectI18n(projectId, maps) {
  const pid = String(projectId);
  const file = await loadProjectI18nStorage();
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

  await saveProjectI18nStorage(file);
}

async function uploadToSupabase(buffer, contentType, originalName, folder) {
  const safeFolder = folder ? String(folder).replace(/^\/*/, '').replace(/\.\./g, '') : 'uploads';
  const ext = path.extname(originalName || '');
  const base = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
  const objectPath = `${safeFolder}/${base}`;

  const { error } = await supabaseAdmin.storage.from(STORAGE_BUCKET).upload(objectPath, buffer, {
    upsert: false,
    contentType: contentType || 'application/octet-stream',
    cacheControl: '3600'
  });
  if (error) throw error;

  const { data } = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(objectPath);
  const publicUrl = data?.publicUrl;
  if (!publicUrl) throw new Error('Failed to get public URL for uploaded file');
  return publicUrl;
}

async function testConnection() {
  const { error } = await supabase
    .from('categories')
    .select('count', { count: 'exact', head: true });
  return !error;
}

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

const router = express.Router();

router.get('/health', async (req, res) => {
  try {
    const connected = await testConnection();
    if (connected) res.json({ status: 'ok', database: 'supabase', timestamp: new Date().toISOString() });
    else res.status(503).json({ status: 'error', message: 'Database connection failed' });
  } catch (err) {
    res.status(503).json({ status: 'error', message: err.message });
  }
});

router.get('/project-translations', async (req, res) => {
  try {
    const json = await loadProjectI18nStorage();
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=600');
    res.json(json);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
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

router.get('/categories', async (req, res) => {
  try {
    const { data: categories, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600');
    res.json(categories || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/categories', requireAdmin, async (req, res) => {
  try {
    const { name } = req.body || {};
    if (!name) return res.status(400).json({ error: 'Category name required' });

    const { error } = await supabaseAdmin
      .from('categories')
      .insert([{ name }]);
    if (error) {
      if (error.code === '23505') return res.status(400).json({ error: 'Category already exists' });
      throw error;
    }

    res.status(201).json({ message: 'Category created successfully', name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/projects', async (req, res) => {
  try {
    const { data: projects, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    if (error) throw error;

    const ids = (projects || []).map((p) => p.id).filter(Boolean);
    let imagesByProject = {};
    if (ids.length) {
      const { data: images, error: imagesError } = await supabaseAdmin
        .from('project_images')
        .select('*')
        .in('project_id', ids)
        .order('image_order', { ascending: true });
      if (imagesError) throw imagesError;

      imagesByProject = (images || []).reduce((acc, img) => {
        const pid = img.project_id;
        if (!pid) return acc;
        if (!acc[pid]) acc[pid] = [];
        acc[pid].push(img);
        return acc;
      }, {});
    }

    const projectsWithImages = (projects || []).map((project) => ({
      ...project,
      images: imagesByProject[project.id] || []
    }));

    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
    res.json(projectsWithImages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/projects/:id', async (req, res) => {
  try {
    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const { data: images, error: imgError } = await supabaseAdmin
      .from('project_images')
      .select('*')
      .eq('project_id', req.params.id)
      .order('image_order', { ascending: true });
    if (imgError) throw imgError;

    project.images = images || [];
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/projects', requireAdmin, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'gallery_images', maxCount: 5 }]), async (req, res) => {
  try {
    const { title, category, description, problem, solution, technologies, project_url, github_url, title_i18n, description_i18n, problem_i18n, solution_i18n } = req.body || {};

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

    if (!title || !category || !description || !problem || !solution || !technologies) {
      const missing = [];
      if (!title) missing.push('title');
      if (!category) missing.push('category');
      if (!description) missing.push('description');
      if (!problem) missing.push('problem');
      if (!solution) missing.push('solution');
      if (!technologies) missing.push('technologies');
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }

    let image_url = null;
    const mainImg = req.files?.image?.[0];
    if (mainImg?.buffer) {
      image_url = await uploadToSupabase(mainImg.buffer, mainImg.mimetype, mainImg.originalname, 'projects/main');
    }

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
    if (error) throw error;

    if (titleMap || descMap || probMap || solMap) {
      await updateProjectI18n(project.id, { title: titleMap, description: descMap, problem: probMap, solution: solMap });
    }

    const gallery = req.files?.gallery_images || [];
    for (let i = 0; i < gallery.length; i++) {
      const f = gallery[i];
      if (!f?.buffer) continue;
      const imgUrl = await uploadToSupabase(f.buffer, f.mimetype, f.originalname, `projects/${project.id}/gallery`);
      await supabaseAdmin.from('project_images').insert({
        project_id: project.id,
        image_url: imgUrl,
        image_order: i + 1
      });
    }

    res.status(201).json({ id: project.id, message: 'Project created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/projects/:id', requireAdmin, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'gallery_images', maxCount: 5 }]), async (req, res) => {
  try {
    const projectId = req.params.id;
    const { title, category, description, problem, solution, technologies, project_url, github_url, title_i18n, description_i18n, problem_i18n, solution_i18n } = req.body || {};

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

    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
    if (projectError) throw projectError;
    if (!project) return res.status(404).json({ error: 'Project not found' });

    let image_url = project.image_url;
    const mainImg = req.files?.image?.[0];
    if (mainImg?.buffer) {
      image_url = await uploadToSupabase(mainImg.buffer, mainImg.mimetype, mainImg.originalname, 'projects/main');
    }

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
      await updateProjectI18n(projectId, { title: titleMap, description: descMap, problem: probMap, solution: solMap });
    }

    res.json({ message: 'Project updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/projects/:id', requireAdmin, async (req, res) => {
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

router.post('/projects/:id/images', requireAdmin, upload.array('images', 10), async (req, res) => {
  try {
    const projectId = req.params.id;

    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
    if (projectError || !project) return res.status(404).json({ error: 'Project not found' });

    const uploadedImages = [];
    const files = req.files || [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (!f?.buffer) continue;
      const imgUrl = await uploadToSupabase(f.buffer, f.mimetype, f.originalname, `projects/${projectId}/gallery`);
      await supabaseAdmin
        .from('project_images')
        .insert({
          project_id: projectId,
          image_url: imgUrl,
          image_order: i
        });
      uploadedImages.push(imgUrl);
    }

    res.json({ message: 'Images uploaded successfully', images: uploadedImages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/projects/:projectId/images/:imageId', requireAdmin, async (req, res) => {
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

app.use('/', router);
app.use('/api', router);

export const handler = serverless(app);

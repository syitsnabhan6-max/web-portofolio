import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import multer from 'multer';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Setup multer untuk upload gambar
const uploadDir = path.join(__dirname, 'assets/uploads');
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
    // Accept image files only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Initialize Database
const dbPath = path.join(__dirname, 'portfolio.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Database connected successfully');
    initializeDatabase().catch((e) => console.error('Database init error:', e));
  }
});

// Promisify database methods for easier async handling
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

// Initialize Database Tables
async function initializeDatabase() {
  await dbRun(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      problem TEXT NOT NULL,
      solution TEXT NOT NULL,
      technologies TEXT NOT NULL,
      image_url TEXT,
      project_url TEXT,
      github_url TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('Projects table initialized');

  await dbRun(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('Admin users table initialized');

  await dbRun(`
    CREATE TABLE IF NOT EXISTS project_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      image_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);
  console.log('Project images table initialized');

  await dbRun(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('Categories table initialized');

  await ensureProjectI18nColumns();
}

async function ensureProjectI18nColumns() {
  try {
    const columns = await dbAll('PRAGMA table_info(projects)');
    const existing = new Set(columns.map((c) => c.name));
    const required = ['title_i18n', 'description_i18n', 'problem_i18n', 'solution_i18n'];
    for (const col of required) {
      if (!existing.has(col)) {
        await dbRun(`ALTER TABLE projects ADD COLUMN ${col} TEXT`);
      }
    }
  } catch (err) {
    console.error('Error ensuring i18n columns:', err);
  }
}

function normalizeI18nMap(raw) {
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
  return Object.keys(cleaned).length ? JSON.stringify(cleaned) : null;
}

// Routes

// GET all projects
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await dbAll(
      'SELECT * FROM projects WHERE status = ? ORDER BY created_at DESC',
      ['active']
    );
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single project with images
app.get('/api/projects/:id', async (req, res) => {
  try {
    const project = await dbGet(
      'SELECT * FROM projects WHERE id = ?',
      [req.params.id]
    );
    if (project) {
      // Get all images for this project
      const images = await dbAll(
        'SELECT * FROM project_images WHERE project_id = ? ORDER BY image_order ASC',
        [req.params.id]
      );
      project.images = images;
      res.json(project);
    } else {
      res.status(404).json({ error: 'Project not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE project (admin only)
app.post('/api/projects', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'gallery_images', maxCount: 5 }]), async (req, res) => {
  try {
    const { title, category, description, problem, solution, technologies, project_url, github_url, title_i18n, description_i18n, problem_i18n, solution_i18n } = req.body;
    
    if (!title || !category || !description || !problem || !solution || !technologies) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get main image URL
    let image_url = null;
    if (req.files && req.files.image && req.files.image.length > 0) {
      image_url = `/assets/uploads/${req.files.image[0].filename}`;
    }

    // Insert project
    let titleI18n = null;
    let descriptionI18n = null;
    let problemI18n = null;
    let solutionI18n = null;
    try {
      titleI18n = normalizeI18nMap(title_i18n);
      descriptionI18n = normalizeI18nMap(description_i18n);
      problemI18n = normalizeI18nMap(problem_i18n);
      solutionI18n = normalizeI18nMap(solution_i18n);
    } catch (e) {
      return res.status(400).json({ error: e.message || 'Invalid i18n payload' });
    }

    const result = await dbRun(
      `INSERT INTO projects (
        title, category, description, problem, solution, technologies, image_url, project_url, github_url,
        title_i18n, description_i18n, problem_i18n, solution_i18n
      )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title, category, description, problem, solution, technologies, image_url, project_url || null, github_url || null,
        titleI18n, descriptionI18n, problemI18n, solutionI18n
      ]
    );

    const projectId = result.lastID;

    // Insert gallery images if provided
    if (req.files && req.files.gallery_images) {
      for (let i = 0; i < req.files.gallery_images.length; i++) {
        const galleryImageUrl = `/assets/uploads/${req.files.gallery_images[i].filename}`;
        await dbRun(
          'INSERT INTO project_images (project_id, image_url, image_order) VALUES (?, ?, ?)',
          [projectId, galleryImageUrl, i + 1]
        );
      }
    }

    res.status(201).json({
      id: projectId,
      message: 'Project created successfully'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE project (admin only)
app.put('/api/projects/:id', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'gallery_images', maxCount: 5 }]), async (req, res) => {
  try {
    const { title, category, description, problem, solution, technologies, project_url, github_url, title_i18n, description_i18n, problem_i18n, solution_i18n } = req.body;
    const project = await dbGet('SELECT * FROM projects WHERE id = ?', [req.params.id]);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const image_url = req.files && req.files.image ? `/assets/uploads/${req.files.image[0].filename}` : project.image_url;

    let nextTitleI18n = project.title_i18n;
    let nextDescriptionI18n = project.description_i18n;
    let nextProblemI18n = project.problem_i18n;
    let nextSolutionI18n = project.solution_i18n;
    try {
      if (title_i18n !== undefined) nextTitleI18n = normalizeI18nMap(title_i18n);
      if (description_i18n !== undefined) nextDescriptionI18n = normalizeI18nMap(description_i18n);
      if (problem_i18n !== undefined) nextProblemI18n = normalizeI18nMap(problem_i18n);
      if (solution_i18n !== undefined) nextSolutionI18n = normalizeI18nMap(solution_i18n);
    } catch (e) {
      return res.status(400).json({ error: e.message || 'Invalid i18n payload' });
    }

    await dbRun(
      `UPDATE projects 
       SET title = ?, category = ?, description = ?, problem = ?, solution = ?, 
           technologies = ?, image_url = ?, project_url = ?, github_url = ?,
           title_i18n = ?, description_i18n = ?, problem_i18n = ?, solution_i18n = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        title, category, description, problem, solution,
        technologies, image_url, project_url, github_url,
        nextTitleI18n, nextDescriptionI18n, nextProblemI18n, nextSolutionI18n,
        req.params.id
      ]
    );

    res.json({ message: 'Project updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE project (admin only)
app.delete('/api/projects/:id', async (req, res) => {
  try {
    await dbRun('UPDATE projects SET status = ? WHERE id = ?', ['deleted', req.params.id]);
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload multiple images for project
app.post('/api/projects/:id/images', upload.array('images', 10), async (req, res) => {
  try {
    const projectId = req.params.id;
    const project = await dbGet('SELECT * FROM projects WHERE id = ?', [projectId]);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const maxRow = await dbGet(
      'SELECT COALESCE(MAX(image_order), 0) AS maxOrder FROM project_images WHERE project_id = ?',
      [projectId]
    );
    const baseOrder = Number.isFinite(Number(maxRow?.maxOrder)) ? Number(maxRow.maxOrder) : 0;

    const uploadedImages = [];
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const imageUrl = `/assets/uploads/${req.files[i].filename}`;
        await dbRun(
          'INSERT INTO project_images (project_id, image_url, image_order) VALUES (?, ?, ?)',
          [projectId, imageUrl, baseOrder + i + 1]
        );
        uploadedImages.push(imageUrl);
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
app.delete('/api/projects/:projectId/images/:imageId', async (req, res) => {
  try {
    await dbRun('DELETE FROM project_images WHERE id = ?', [req.params.imageId]);
    res.json({ message: 'Image deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== CATEGORIES ====================

// GET all categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await dbAll('SELECT * FROM categories ORDER BY name ASC');
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE category
app.post('/api/categories', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Category name required' });
    }

    await dbRun('INSERT INTO categories (name) VALUES (?)', [name]);
    res.status(201).json({ message: 'Category created successfully', name });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      res.status(400).json({ error: 'Category already exists' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Admin Login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    res.json({ success: true, token: 'token_' + Date.now() });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Also accessible from: http://192.168.1.4:${PORT}`);
});

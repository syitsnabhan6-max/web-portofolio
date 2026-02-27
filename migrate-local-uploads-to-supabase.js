import fs from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'portofolio-images';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const uploadsDir = path.resolve('assets', 'uploads');
const targetPrefix = 'legacy/uploads';

function guessContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.svg') return 'image/svg+xml';
  return 'application/octet-stream';
}

async function uploadOneFile(filename) {
  const localPath = path.join(uploadsDir, filename);
  const objectPath = `${targetPrefix}/${filename}`;
  const buffer = await fs.readFile(localPath);
  const contentType = guessContentType(filename);

  const { error: uploadError } = await supabaseAdmin.storage.from(STORAGE_BUCKET).upload(objectPath, buffer, {
    upsert: true,
    contentType,
    cacheControl: '3600'
  });
  if (uploadError) throw uploadError;

  const { data } = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(objectPath);
  const publicUrl = data?.publicUrl;
  if (!publicUrl) throw new Error(`Failed to get public URL for ${objectPath}`);

  const variants = [
    `/assets/uploads/${filename}`,
    `assets/uploads/${filename}`,
    `./assets/uploads/${filename}`
  ];

  let updatedProjects = 0;
  for (const oldUrl of variants) {
    const { data: rows, error } = await supabaseAdmin
      .from('projects')
      .update({ image_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('image_url', oldUrl)
      .select('id');
    if (error) throw error;
    updatedProjects += (rows || []).length;
  }

  let updatedImages = 0;
  for (const oldUrl of variants) {
    const { data: rows, error } = await supabaseAdmin
      .from('project_images')
      .update({ image_url: publicUrl })
      .eq('image_url', oldUrl)
      .select('id');
    if (error) throw error;
    updatedImages += (rows || []).length;
  }

  return { filename, publicUrl, updatedProjects, updatedImages };
}

async function main() {
  const entries = await fs.readdir(uploadsDir, { withFileTypes: true });
  const files = entries.filter((e) => e.isFile()).map((e) => e.name);

  if (!files.length) {
    console.log('No files found in assets/uploads');
    return;
  }

  let totalUploaded = 0;
  let totalProjectUpdates = 0;
  let totalImageUpdates = 0;

  for (const filename of files) {
    const result = await uploadOneFile(filename);
    totalUploaded += 1;
    totalProjectUpdates += result.updatedProjects;
    totalImageUpdates += result.updatedImages;
    console.log(`${filename} -> uploaded, projects:${result.updatedProjects}, images:${result.updatedImages}`);
  }

  console.log(`Done. Uploaded:${totalUploaded}, updated projects:${totalProjectUpdates}, updated project_images:${totalImageUpdates}`);
}

main().catch((err) => {
  console.error(err?.message || err);
  process.exitCode = 1;
});

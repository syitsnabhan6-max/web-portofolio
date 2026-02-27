#!/usr/bin/env node

/**
 * MIGRATION SCRIPT - SQLite ke Supabase
 * 
 * Gunakan script ini jika Anda sudah punya data di SQLite dan ingin migrate ke Supabase
 * 
 * USAGE:
 * node migrate-to-supabase.mjs
 * 
 * REQUIREMENTS:
 * - SQLite database sudah ada (portfolio.db)
 * - Supabase project sudah dibuat
 * - .env file sudah dikonfigurasi dengan Supabase credentials
 * - Semua tables Supabase sudah dibuat (run SUPABASE-SCHEMA.sql)
 */

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// CONFIGURATION
// ============================================
const dbPath = path.join(__dirname, 'portfolio.db');

// Check SQLite database exists
if (!fs.existsSync(dbPath)) {
  console.error('❌ ERROR: portfolio.db tidak ditemukan!');
  console.error('   Pastikan Anda menjalankan script ini dari directory root project');
  process.exit(1);
}

// Check Supabase credentials
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ ERROR: Supabase credentials tidak ditemukan di .env!');
  console.error('   Setup .env file dengan SUPABASE_URL dan SUPABASE_KEY');
  process.exit(1);
}

// Initialize clients
const sqliteDb = new sqlite3.Database(dbPath);
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_KEY);

// ============================================
// HELPER FUNCTIONS
// ============================================
const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    sqliteDb.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ============================================
// MIGRATION FUNCTIONS
// ============================================
async function migrateCategories() {
  console.log('\n📚 Migrating Categories...');
  
  try {
    const categories = await dbAll('SELECT * FROM categories');
    
    if (categories.length === 0) {
      console.log('   ⚠️  No categories found in SQLite');
      return { count: 0, skipped: 0 };
    }

    let count = 0;
    let skipped = 0;

    for (const cat of categories) {
      try {
        const { error } = await supabaseAdmin
          .from('categories')
          .insert({ name: cat.name });

        if (error) {
          if (error.code === '23505') { // UNIQUE constraint
            console.log(`   ⏭️  ${cat.name} (already exists)`);
            skipped++;
          } else {
            throw error;
          }
        } else {
          console.log(`   ✅ ${cat.name}`);
          count++;
        }
      } catch (err) {
        console.error(`   ❌ Error migrating ${cat.name}:`, err.message);
      }

      await sleep(100); // Rate limiting
    }

    return { count, skipped };
  } catch (err) {
    console.error('❌ Error migrating categories:', err.message);
    throw err;
  }
}

async function migrateProjects() {
  console.log('\n📂 Migrating Projects...');
  
  try {
    const projects = await dbAll('SELECT * FROM projects WHERE status = ?', ['active']);
    
    if (projects.length === 0) {
      console.log('   ⚠️  No projects found in SQLite');
      return { count: 0, errors: [] };
    }

    let count = 0;
    const errors = [];
    const idMap = new Map();

    for (const project of projects) {
      try {
        const { data: insertedProject, error } = await supabaseAdmin
          .from('projects')
          .insert({
            title: project.title,
            category: project.category,
            description: project.description,
            problem: project.problem,
            solution: project.solution,
            technologies: project.technologies,
            image_url: project.image_url,
            project_url: project.project_url,
            github_url: project.github_url,
            status: 'active',
            created_at: project.created_at,
            updated_at: project.updated_at
          })
          .select()
          .single();

        if (error) throw error;
        if (insertedProject?.id) {
          idMap.set(project.id, insertedProject.id);
        }

        console.log(`   ✅ ${project.title}`);
        count++;
      } catch (err) {
        console.error(`   ❌ Error migrating "${project.title}":`, err.message);
        errors.push({ title: project.title, error: err.message });
      }

      await sleep(100); // Rate limiting
    }

    return { count, errors, idMap };
  } catch (err) {
    console.error('❌ Error migrating projects:', err.message);
    throw err;
  }
}

async function migrateProjectImages(projectIdMap) {
  console.log('\n🖼️  Migrating Project Images...');
  
  try {
    const images = await dbAll('SELECT * FROM project_images ORDER BY project_id, image_order ASC');
    
    if (images.length === 0) {
      console.log('   ⚠️  No images found in SQLite');
      return { count: 0, errors: [] };
    }

    let count = 0;
    const errors = [];

    for (const image of images) {
      try {
        const mappedProjectId = projectIdMap?.get?.(image.project_id);
        if (!mappedProjectId) {
          throw new Error(`Project ID mapping not found for ${image.project_id}`);
        }

        const { error } = await supabaseAdmin
          .from('project_images')
          .insert({
            project_id: mappedProjectId,
            image_url: image.image_url,
            image_order: image.image_order,
            created_at: image.created_at
          });

        if (error) throw error;

        console.log(`   ✅ Image #${image.id} for project ${image.project_id} → ${mappedProjectId}`);
        count++;
      } catch (err) {
        console.error(`   ❌ Error migrating image #${image.id}:`, err.message);
        errors.push({ imageId: image.id, error: err.message });
      }

      await sleep(50); // Rate limiting
    }

    return { count, errors };
  } catch (err) {
    console.error('❌ Error migrating project images:', err.message);
    throw err;
  }
}

async function migrateAdminUsers() {
  console.log('\n👤 Migrating Admin Users...');
  
  try {
    const users = await dbAll('SELECT * FROM admin_users');
    
    if (users.length === 0) {
      console.log('   ⚠️  No admin users found in SQLite');
      console.log('   💡 Tip: Setup admin credentials di .env file');
      return { count: 0, skipped: 0 };
    }

    let count = 0;
    let skipped = 0;

    for (const user of users) {
      try {
        // Check if user already exists
        const { data: existingUser } = await supabase
          .from('admin_users')
          .select('id')
          .eq('username', user.username)
          .single();

        if (existingUser) {
          console.log(`   ⏭️  ${user.username} (already exists)`);
          skipped++;
        } else {
          const { error } = await supabaseAdmin
            .from('admin_users')
            .insert({
              username: user.username,
              password: user.password,
              created_at: user.created_at
            });

          if (error) throw error;

          console.log(`   ✅ ${user.username}`);
          count++;
        }
      } catch (err) {
        console.error(`   ❌ Error migrating user "${user.username}":`, err.message);
      }

      await sleep(100); // Rate limiting
    }

    return { count, skipped };
  } catch (err) {
    console.error('❌ Error migrating admin users:', err.message);
    throw err;
  }
}

async function testConnection() {
  console.log('\n🔌 Testing Supabase Connection...');
  
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('count', { count: 'exact', head: true });
    
    if (error) throw error;
    
    console.log('   ✅ Successfully connected to Supabase');
    return true;
  } catch (err) {
    console.error('   ❌ Connection failed:', err.message);
    return false;
  }
}

// ============================================
// MAIN MIGRATION
// ============================================
async function runMigration() {
  console.log(`
╔════════════════════════════════════════════════════════╗
║     SQLite → Supabase Migration Script                ║
║     Portfolio Database                                ║
╚════════════════════════════════════════════════════════╝
  `);

  try {
    // Step 1: Test connection
    const connected = await testConnection();
    if (!connected) {
      console.error('\n❌ Cannot connect to Supabase. Check your credentials in .env');
      process.exit(1);
    }

    // Step 2: Migrate data
    console.log('\n📊 Starting migration...\n');

    const catResult = await migrateCategories();
    const projResult = await migrateProjects();
    const imgResult = await migrateProjectImages(projResult.idMap);
    const userResult = await migrateAdminUsers();

    // Summary
    console.log(`
╔════════════════════════════════════════════════════════╗
║     ✅ Migration Complete!                             ║
╚════════════════════════════════════════════════════════╝

📊 SUMMARY:
  Categories:      ${catResult.count} migrated, ${catResult.skipped} skipped
  Projects:        ${projResult.count} migrated, ${projResult.errors.length} errors
  Images:          ${imgResult.count} migrated, ${imgResult.errors.length} errors
  Admin Users:     ${userResult.count} migrated, ${userResult.skipped} skipped

${projResult.errors.length > 0 ? '⚠️  ERRORS:\n' + projResult.errors.map(e => `   • ${e.title}: ${e.error}`).join('\n') : ''}
${imgResult.errors.length > 0 ? '⚠️  IMAGE ERRORS:\n' + imgResult.errors.map(e => `   • Image ${e.imageId}: ${e.error}`).join('\n') : ''}

💡 NEXT STEPS:
  1. Pastikan server jalan pakai Supabase
  2. Start ulang server (npm start)

📝 IMPORTANT:
  - Your SQLite database (portfolio.db) is still intact
  - Delete SUPABASE_URL dari .env untuk switch balik ke SQLite

✅ Ready to use Supabase!
    `);

    sqliteDb.close();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Migration failed:', err);
    sqliteDb.close();
    process.exit(1);
  }
}

// ============================================
// START
// ============================================
console.log('\n⚠️  This script will migrate data from SQLite to Supabase');
console.log('   Make sure:');
console.log('   1. SUPABASE-SCHEMA.sql has been executed');
console.log('   2. .env file is configured correctly');
console.log('   3. Supabase database tables are empty (or duplicates will be skipped)\n');

const args = process.argv.slice(2);
if (args.includes('--skip-confirmation')) {
  runMigration();
} else {
  console.log('Starting migration in 3 seconds... (Press Ctrl+C to cancel)\n');
  setTimeout(runMigration, 3000);
}

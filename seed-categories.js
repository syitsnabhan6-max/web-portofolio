// Seed categories
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'portfolio.db');
const db = new sqlite3.Database(dbPath);

const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const defaultCategories = [
  'Web Development',
  'Mobile Development',
  'Graphic Design',
  'Photography',
  'Videography',
  'UI/UX Design',
  'Branding',
  'Illustration',
  'Animation',
  'Other'
];

const seedCategories = async () => {
  try {
    console.log('🌱 Seeding categories...\n');

    let count = 0;
    for (const category of defaultCategories) {
      try {
        await dbRun('INSERT INTO categories (name) VALUES (?)', [category]);
        console.log(`✅ Added: ${category}`);
        count++;
      } catch (err) {
        console.log(`⚠️  Skipped (already exists): ${category}`);
      }
    }

    console.log(`\n✨ Successfully added ${count} categories!`);
    console.log('\n📝 Sekarang kategori ini sudah tersedia di admin panel');
    
    db.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    db.close();
    process.exit(1);
  }
};

seedCategories();

// Script untuk seed sample projects ke database
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'portfolio.db');
const db = new sqlite3.Database(dbPath);

// Promisify untuk async/await
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const sampleProjects = [
  {
    title: 'E-Commerce Platform',
    category: 'Web Development',
    description: 'Full-stack e-commerce platform dengan inventory management, payment gateway integration, dan real-time analytics dashboard.',
    problem: 'Klien membutuhkan platform penjualan online dengan sistem inventory yang terintegrasi dan proses pembayaran yang aman dan mudah dikelola.',
    solution: 'Membangun aplikasi web dengan React frontend dan Node.js backend, mengintegrasikan payment gateway Stripe/Midtrans, dan database relasional untuk inventory management.',
    technologies: 'React, Node.js, Express, MongoDB, Stripe, Redux, Material-UI',
    image_url: null,
    project_url: 'https://ecommerce-demo.com',
    github_url: 'https://github.com/yourusername/ecommerce-platform'
  },
  {
    title: 'Corporate Brand Identity',
    category: 'Graphic Design',
    description: 'Complete brand identity design termasuk logo, color palette, typography guideline, dan brand manual yang comprehensive untuk startup tech.',
    problem: 'Startup teknologi memerlukan identitas visual yang modern dan memorable untuk menarik investor dan target audience millennial.',
    solution: 'Merancang logo dengan konsep minimalis, membuat comprehensive brand guideline dengan color psychology, dan typography yang consistent di semua media.',
    technologies: 'Adobe Illustrator, Figma, Adobe InDesign, Photoshop',
    image_url: null,
    project_url: null,
    github_url: null
  },
  {
    title: 'Wedding Photography Portfolio',
    category: 'Photography',
    description: 'Koleksi 100+ foto pernikahan dengan editing profesional, color grading yang consistent, dan diverse moments dari pre-wedding hingga reception.',
    problem: 'Fotografer profesional memerlukan portfolio yang visually stunning untuk showcase work dan menarik klien baru dengan standar internasional.',
    solution: 'Mengkurasi foto terbaik, melakukan advanced editing dengan Adobe Lightroom dan Photoshop, dan creating consistent visual narrative dalam setiap portfolio.',
    technologies: 'Adobe Lightroom, Photoshop, Capture One, Premiera Pro',
    image_url: null,
    project_url: 'https://instagram.com/photography-portfolio',
    github_url: null
  },
  {
    title: 'Mobile App UI/UX Design',
    category: 'UI/UX Design',
    description: 'End-to-end UI/UX design untuk fitness mobile application dengan user research, wireframing, high-fidelity mockups, dan interactive prototypes.',
    problem: 'Klien membutuhkan mobile app untuk fitness tracking namun user experience design yang intuitif dan engaging masih menjadi tantangan.',
    solution: 'Melakukan user research, creating user personas, designing intuitive user flows, membuat high-fidelity wireframes dan interactive prototypes dengan Figma.',
    technologies: 'Figma, Adobe XD, Sketch, Protopie, Usability Testing Tools',
    image_url: null,
    project_url: null,
    github_url: null
  },
  {
    title: 'Promo Video for Social Media',
    category: 'Videography',
    description: 'High-quality promotional video untuk launching produk fashion baru dengan cinematic shots, smooth transitions, dan engaging visual storytelling.',
    problem: 'Brand fashion memerlukan video promosi yang engaging dan shareable untuk Instagram/TikTok untuk meningkatkan brand awareness dan product sales.',
    solution: 'Melakukan shooting dengan professional equipment, color grading untuk consistency, editing dengan kinetic typography dan smooth transitions menggunakan Premiere Pro.',
    technologies: 'Adobe Premiere Pro, After Effects, DaVinci Resolve, Lightroom',
    image_url: null,
    project_url: 'https://youtube.com/watch?v=example',
    github_url: null
  },
  {
    title: 'Blog Platform with CMS',
    category: 'Web Development',
    description: 'Custom blog platform dengan headless CMS, markdown support, SEO optimization, dan progressive web app capabilities untuk content creators.',
    problem: 'Content creator memerlukan platform blog yang flexible, mudah di-manage, dan SEO-optimized tanpa bergantung pada technical team.',
    solution: 'Building with Next.js untuk performance dan SEO, Strapi sebagai headless CMS, dan implementing PWA features untuk offline access dan fast loading.',
    technologies: 'Next.js, React, Strapi, PostgreSQL, Tailwind CSS, Vercel',
    image_url: null,
    project_url: 'https://blog-platform.com',
    github_url: 'https://github.com/yourusername/blog-platform'
  }
];

const seedDatabase = async () => {
  try {
    console.log('🌱 Seeding sample projects...\n');

    let count = 0;
    for (const project of sampleProjects) {
      try {
        await dbRun(
          `INSERT INTO projects (title, category, description, problem, solution, technologies, image_url, project_url, github_url)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            project.title,
            project.category,
            project.description,
            project.problem,
            project.solution,
            project.technologies,
            project.image_url,
            project.project_url,
            project.github_url
          ]
        );
        console.log(`✅ Added: ${project.title}`);
        count++;
      } catch (err) {
        console.log(`⚠️  Skipped (already exists): ${project.title}`);
      }
    }

    console.log(`\n✨ Successfully added ${count} sample projects!`);
    console.log('\n📝 Sekarang Anda bisa:');
    console.log('   1. Buka http://localhost:3000');
    console.log('   2. Lihat projects muncul di portfolio');
    console.log('   3. Klik projects untuk lihat detail (problem, solution, etc)');
    console.log('   4. Login ke admin: http://localhost:3000/admin.html (admin/admin123)');
    console.log('   5. Edit, hapus, atau tambah projects baru');
    
    db.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    db.close();
    process.exit(1);
  }
};

seedDatabase();

# Portfolio Website - Setup & Documentation

Website portofolio profesional dengan admin panel untuk mengelola projects dan database.

## 🎯 Fitur Utama

✅ **Screen Splash/Loading** - Animasi splash screen yang elegant dengan particle effects
✅ **Admin Panel** - Halaman admin untuk mengelola projects dengan UI yang modern
✅ **Database** - SQLite untuk menyimpan data projects
✅ **Project Details** - Modal dengan informasi lengkap: title, description, problem, solution, technologies
✅ **API Backend** - Express.js REST API untuk CRUD operations
✅ **Responsive Design** - Tampilan yang sempurna di desktop, tablet, dan mobile
✅ **Professional Styling** - Design elegant dengan gradient dan animasi

## 📁 Struktur File

```
web porto personal/
├── index.html                 # Halaman utama portfolio
├── admin.html                 # Halaman admin panel
├── splash.html                # Screen splash/loading
├── server.js                  # Backend Express.js
├── package.json               # Node.js dependencies
├── portfolio.db               # Database (auto-created)
├── assets/
│   ├── css/
│   │   ├── style.css          # Main styles
│   │   └── admin.css          # Admin panel styles
│   ├── js/
│   │   ├── script.js          # Main javascript
│   │   └── admin.js           # Admin panel javascript
│   ├── images/                # Gambar-gambar
│   ├── uploads/               # Folder untuk upload project images
│   └── collaboration/         # Logo kolaborasi
└── README.md                  # File ini
```

## 🚀 Cara Setup & Menjalankan

### 1. Install Dependencies

```bash
cd "c:\Users\syits\OneDrive\Documents\web porto personal"
npm install
```

Ini akan menginstall:
- `express` - Web framework
- `better-sqlite3` - Database
- `cors` - Cross-origin support
- `multer` - File upload handler

### 2. Jalankan Server

```bash
npm start
```

Atau untuk development dengan auto-reload:

```bash
npm run dev
```

Server akan berjalan di `http://localhost:3000`

### 3. Akses Website

- **Halaman Utama** → `http://localhost:3000` atau `http://localhost:3000/index.html`
- **Splash Screen** → `http://localhost:3000/splash.html`
- **Admin Panel** → `http://localhost:3000/admin.html`

## 🔐 Login Admin

**Default Credentials:**
- Username: `admin`
- Password: `admin123`

**⚠️ PENTING**: Ganti password di production! Edit di `server.js`:

```javascript
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
```

Atau gunakan environment variables:

```bash
# Di command line sebelum jalankan server
set ADMIN_USERNAME=username_baru
set ADMIN_PASSWORD=password_baru
npm start
```

## 📋 API Endpoints

### Get All Projects
```
GET /api/projects
```

### Get Single Project
```
GET /api/projects/:id
```

### Create Project (Admin)
```
POST /api/projects
Content-Type: multipart/form-data

Fields:
- title (required)
- category (required)
- description (required)
- problem (required)
- solution (required)
- technologies (required)
- image (optional) - file upload
- project_url (optional)
- github_url (optional)
```

### Update Project (Admin)
```
PUT /api/projects/:id
Content-Type: multipart/form-data

Same fields as Create Project
```

### Delete Project (Admin)
```
DELETE /api/projects/:id
```

### Admin Login
```
POST /api/admin/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

## 💼 Cara Menggunakan Admin Panel

### 1. **Login**
   - Buka `/admin.html`
   - Masukkan username dan password
   - Klik "Login"

### 2. **Manage Projects**
   - Tab "Projects" menampilkan semua projects
   - Gunakan search untuk mencari projects
   - Klik "Edit" untuk mengedit project
   - Klik "Delete" untuk menghapus project

### 3. **Add New Project**
   - Klik tab "Add Project"
   - Isi semua field yang required:
     - **Project Title** - Nama project
     - **Category** - Pilih kategori (Web Development, Mobile App, UI/UX Design, Graphic Design, Other)
     - **Description** - Deskripsi singkat project
     - **Problem/Challenge** - Problem apa yang project ini selesaikan
     - **Solution** - Bagaimana cara Anda menyelesaikannya
     - **Technologies Used** - Comma-separated list (contoh: HTML, CSS, JavaScript, React)
     - **Project Image** - Upload gambar project
     - **Project URL** - Link ke project (optional)
     - **GitHub URL** - Link ke GitHub repo (optional)
   - Klik "Create Project"

### 4. **Edit Project**
   - Klik "Edit" pada project card
   - Modal akan terbuka dengan form edit
   - Ubah data yang diperlukan
   - Klik "Update Project"

### 5. **Settings**
   - Tab "Settings" untuk info database
   - Tombol "Export Data" untuk backup projects ke JSON

## 🎨 Customization

### Edit Warna & Styling

Buka `assets/css/style.css` dan `assets/css/admin.css` untuk mengubah:

**Color Variables** di `:root`:
```css
--primary-color: #6366f1;
--secondary-color: #8b5cf6;
--accent-color-1: #ffc107;
--danger-color: #ef4444;
```

### Edit Profile Info

Edit di `index.html`, section sidebar:
```html
<h1 class="name">Your Name</h1>
<p class="title">Your Title</p>
<a href="mailto:your@email.com">your@email.com</a>
```

### Edit Splash Screen

Ubah teks dan logo di `splash.html`:
```html
<h1>Your Name</h1>
<p class="subtitle">YOUR TITLE</p>
```

## 📊 Database Structure

### Projects Table
```sql
CREATE TABLE projects (
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
);
```

## 🔧 Troubleshooting

### "Module not found" error
```bash
npm install
```

### CORS Error
Server sudah dikonfigurasi dengan CORS. Jika masih error, pastikan:
- Server berjalan di `http://localhost:3000`
- Client mengakses dari `http://localhost:3000`

### Database Error
Database file (`portfolio.db`) akan otomatis dibuat saat server pertama kali run.
Jika ada error, hapus `portfolio.db` dan jalankan server lagi.

### Image Upload Not Working
Pastikan folder `assets/uploads/` sudah ada. Server akan membuat folder ini otomatis.

## 🚀 Deployment

### untuk hosting di Heroku:

1. Buat `Procfile`:
```
web: node server.js
```

2. Push ke Heroku:
```bash
heroku login
git init
git add .
git commit -m "Initial commit"
git push heroku main
```

### Untuk hosting di VPS/Server:

1. Install Node.js di server
2. Clone/upload project
3. Install dependencies: `npm install`
4. Gunakan PM2 untuk keep server running:
```bash
npm install -g pm2
pm2 start server.js
pm2 startup
pm2 save
```

## 📱 File-file Penting

| File | Fungsi |
|------|--------|
| `server.js` | Backend Express.js & API routes |
| `index.html` | Halaman utama portfolio |
| `admin.html` | Halaman admin panel |
| `splash.html` | Screen loading/splash |
| `assets/js/script.js` | Main frontend logic + API integration |
| `assets/js/admin.js` | Admin panel logic |
| `assets/css/style.css` | Main styling + modal project detail |
| `assets/css/admin.css` | Admin panel styling |
| `portfolio.db` | Database (auto-created) |

## ✨ Tips Penggunaan

1. **Backup Regular** - Gunakan export data di admin settings
2. **Gambar Optimal** - Gunakan gambar 800x600px atau lebih besar
3. **SEO** - Edit title dan description di `index.html`
4. **Performance** - Compress gambar sebelum upload ke admin
5. **Social Links** - Update social media links di `index.html`

## 📝 Notes

- Database menggunakan SQLite untuk simplicity
- Untuk production, pertimbangkan PostgreSQL atau MySQL
- Implement proper authentication untuk security lebih baik
- Add input validation di backend untuk security
- Setup SSL/HTTPS untuk production

## 🤝 Support

Jika ada pertanyaan atau error, check:
1. Console browser (F12 → Console tab)
2. Terminal server untuk error logs
3. Pastikan semua dependencies terinstall

---

**Dibuat dengan ❤️ untuk portfolio yang professional dan modern**

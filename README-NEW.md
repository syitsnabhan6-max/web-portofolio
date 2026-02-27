# 🎨 Syits Nabhan - Professional Portfolio Website

Personal portfolio website yang modern, elegant, dan profesional dengan admin panel untuk mengelola projects langsung dari website.

## ✨ Fitur Unggulan

### 🎬 Frontend Features
- ✅ **Splash Screen** - Animated loading screen dengan particle effects
- ✅ **Responsive Design** - Perfect di desktop, tablet, dan mobile
- ✅ **Dark Theme** - Modern dark mode dengan gradient aesthetics
- ✅ **Project Showcase** - Grid layout dengan filter by category
- ✅ **Project Modal** - Detailed view dengan problem, solution, technologies
- ✅ **Smooth Navigation** - Page transitions dan smooth scrolling
- ✅ **Contact Form** - Integrated contact form dengan Formspree
- ✅ **Social Links** - Connected social media profiles

### 🛠️ Admin Panel Features
- ✅ **Project Management** - Create, Read, Update, Delete projects
- ✅ **Image Upload** - Upload project screenshots/images
- ✅ **Category Management** - Organize projects by category
- ✅ **Search Functionality** - Quick search through projects
- ✅ **Database Export** - Backup projects ke JSON format
- ✅ **Authentication** - Secure login dengan credentials

### 💾 Backend & Database
- ✅ **Express.js Server** - RESTful API backend
- ✅ **SQLite Database** - Lightweight, file-based database
- ✅ **File Upload Handler** - Multer untuk gambar projects
- ✅ **CORS Support** - Cross-origin requests enabled
- ✅ **API Endpoints** - Complete CRUD operations

## 🚀 Quick Start

### Windows Users (Termudah)
1. **Double-click `START-SERVER.bat`** - Semua otomatis!
2. Buka browser → `http://localhost:3000`
3. Admin → `http://localhost:3000/admin.html`
4. Login: `admin` / `admin123`

### Manual Setup
```bash
# 1. Install dependencies
npm install

# 2. Start server
npm start

# Server berjalan di http://localhost:3000
```

**Lihat `QUICK-START.md` untuk panduan lengkap!**

## 📁 Project Structure

```
portfolio/
├── 📄 index.html              # Main portfolio page
├── 📄 admin.html              # Admin panel
├── 📄 splash.html             # Loading screen
├── 🖥️ server.js                # Backend Express
├── 📦 package.json            # Dependencies
├── 📚 SETUP.md                # Detailed setup guide
├── 🏃 QUICK-START.md          # Quick start guide
├── 🗂️ assets/
│   ├── 🎨 css/
│   │   ├── style.css          # Main styles
│   │   └── admin.css          # Admin styles
│   ├── 📜 js/
│   │   ├── script.js          # Main JS + API integration
│   │   └── admin.js           # Admin panel JS
│   ├── 🖼️ images/             # Images
│   ├── 📤 uploads/            # Project image uploads
│   └── 🤝 collaboration/      # Collaboration logos
└── 💾 portfolio.db            # Database (auto-created)
```

## 🔐 Default Credentials

```
Username: admin
Password: admin123
```

**⚠️ Change in production!** Edit `.env` atau `server.js`

## 📊 Database Schema

### Projects Table
```sql
- id (Primary Key)
- title (Text)
- category (Text)
- description (Text)
- problem (Text)
- solution (Text)
- technologies (Text)
- image_url (Text)
- project_url (Text)
- github_url (Text)
- status (Text)
- created_at (DateTime)
- updated_at (DateTime)
```

## 🌐 API Endpoints

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get single project
- `POST /api/projects` - Create project (admin)
- `PUT /api/projects/:id` - Update project (admin)
- `DELETE /api/projects/:id` - Delete project (admin)

### Admin
- `POST /api/admin/login` - Admin login

## 🎯 Cara Menambah Project

1. Login ke admin panel (`/admin.html`)
2. Klik tab "Add Project"
3. Isi form dengan lengkap:
   - **Title** - Nama project
   - **Category** - Pilih kategori
   - **Description** - Penjelasan singkat
   - **Problem** - Masalah yang disolve
   - **Solution** - Cara menyelesaikannya
   - **Technologies** - Tech stack (comma-separated)
   - **Image** - Upload screenshot
   - **URLs** - Project & GitHub links (opsional)
4. Klik "Create Project"

**Lihat `QUICK-START.md` untuk contoh project yang lengkap!**

## 🎨 Customization

### Edit Colors
File: `assets/css/style.css` & `assets/css/admin.css`
```css
--primary-color: #6366f1;
--secondary-color: #8b5cf6;
--accent-color-1: #ffc107;
```

### Edit Profile
File: `index.html` - Section sidebar
```html
<h1 class="name">Your Name</h1>
<p class="title">Your Title</p>
```

### Edit Admin Password
File: `server.js`
```javascript
const ADMIN_PASSWORD = 'your-new-password';
```

## 🚢 Deployment

### Heroku
```bash
heroku create
git push heroku main
```

### VPS/Server
```bash
npm install -g pm2
pm2 start server.js
pm2 startup
pm2 save
```

## 📝 Requirements

- **Node.js** v14+
- **NPM** v6+
- Modern browser dengan JavaScript enabled

## 📦 Dependencies

- `express` - Web framework
- `better-sqlite3` - Database
- `multer` - File uploads
- `cors` - Cross-origin support

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 3000 in use | Ubah port di `server.js` |
| Module not found | Jalankan `npm install` |
| Database error | Hapus `portfolio.db` & restart |
| Image upload error | Check `assets/uploads` folder exists |
| Admin login failed | Default: admin/admin123 |

## 📚 Documentation

- **QUICK-START.md** - Panduan cepat (5 menit setup)
- **SETUP.md** - Dokumentasi lengkap & detailed guide

## 🤝 Contributing

Feel free to fork, modify, dan improve!

## 📄 License

MIT License - Free for personal & commercial use

## 📞 Contact

📧 Email: fasyanabhan6@gmail.com
📱 Phone: +62 856-2467-0968
📍 Location: Cianjur, Jawa Barat, Indonesia

---

**Built with ❤️ for a professional portfolio presence**

**Last Updated:** February 2026

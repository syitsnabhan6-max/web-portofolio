# 📸 ADMIN PANEL - GALLERY MANAGEMENT GUIDE

Fitur baru untuk mengelola multiple images per project dengan cara yang lebih mudah dan intuitif!

---

## ✨ FITUR BARU

### 1. **Drag & Drop Image Upload** 
- Upload multiple files dengan drag-drop
- Click zone untuk browse files
- Image preview before submit
- Max 5 images per upload

### 2. **Gallery Management (Edit Project)**
- Lihat semua gallery images yang sudah ada
- Delete individual images dengan hover → click delete
- Upload more images ke existing project
- Real-time preview with delete option

### 3. **Status Notifications**
- Loading indicator saat upload
- Success/error messages
- Auto-disappear after 3 detik

---

## 🎯 HOW TO USE

### **Adding Project dengan Gallery Images**

**Step 1: Klik "Add Project" tab**
```
Sidebar → "+ Add Project"
```

**Step 2: Fill in project details**
```
Title, Category, Description, Problem, Solution, Technologies
```

**Step 3: Upload main image (required)**
```
Click atau drag-drop pada "Project Images (Main + Gallery)"
- Main image: minimal 800x600px
- Format: JPG, PNG, WebP
```

**Step 4: Upload gallery images (optional)**
```
Drag-drop atau click pada "Additional Gallery Images"
- Pilih 1-5 images
- Bisa lihat preview sebelum upload
- Click tanda ❌ untuk remove dari list
```

**Step 5: Submit form**
```
Klik "Create Project"
- Main image akan sebagai cover project
- Gallery images otomatis ter-upload
```

---

### **Editing Project & Managing Gallery**

**Step 1: Go to Projects tab**
```
Sidebar → "Projects"
```

**Step 2: Click "Edit" button pada project**
```
Akan buka edit modal dengan current data
```

**Step 3: Upload additional gallery images**
```
Di section "Gallery Management":
1. Drag-drop atau browse images
2. Lihat preview sebelum upload
3. Klik "Upload Selected Images" button
```

**Step 4: Manage existing gallery**
```
Di section "Current Gallery Images":
- Hover pada image
- Click icon 🗑️ untuk delete
- Confirm deletion
- Gallery otomatis refresh
```

**Step 5: Update project**
```
Klik "Update Project" button
- Images yang di-upload akan ter-simpan
- Perubahan data lainnya juga saved
```

---

## 🎨 UI/UX IMPROVEMENTS

### **Drag & Drop Zone**
```
┌──────────────────────────────────┐
│  ☁️ Drag and drop images here    │
│     or click to browse           │
│     Up to 5 additional images    │
└──────────────────────────────────┘
```

**Behavior:**
- Hover → color change
- Drag over → green highlight
- Click → file browser opens
- Drop → files loaded instantly

### **Image Preview Grid**
```
┌────┬────┬────┬────┐
│ ✓  │ ✓  │ ✓  │    │  (showing 3 of 5)
│    │    │    │    │
│ ❌ │ ❌ │ ❌ │    │  (hover over image = red delete button)
└────┴────┴────┴────┘
```

**Features:**
- Thumbnail preview
- Delete button on hover
- Max showing 5 preview
- Same grid layout

### **Gallery Management Section**
```
┌─────────────────────────────────────┐
│  Project Gallery                    │
├─────────────────────────────────────┤
│ Add More Images to Gallery          │
│ [Drag & Drop Zone]                  │
│ [Upload Selected Images]            │
│                                     │
│ Current Gallery Images              │
│ [🖼️] [🖼️] [🖼️] [🖼️]  ← Hover shows delete │
└─────────────────────────────────────┘
```

---

## 📱 Image Upload Best Practices

### **Image Size Recommendations**
```
Main Image:
- Minimum: 800 x 600 px
- Recommended: 1200 x 800 px
- Aspect ratio: 1.5:1 (3:2)
- Format: JPG (best) > PNG > WebP
- Size: < 2 MB

Gallery Images:
- Minimum: 600 x 400 px
- Can be any size/aspect ratio
- Format: JPG/PNG/WebP
- Size: < 5 MB each (max 5 images)
```

### **File Format Guidelines**
```
✅ DO:
- JPG untuk foto real/detail rich (smaller size)
- PNG untuk graphics/transparency (larger size)
- WebP untuk modern browsers (best compression)
- Optimize images sebelum upload

❌ DON'T:
- Upload BMP atau GIF (tidak efficient)
- Oversized images (> 5MB)
- Screenshot resolution (pixelated)
- Different aspect ratios mix (looks messy)
```

### **Folder Structure (Server)**
```
assets/
├─ uploads/
│  ├─ 1704067200000-123456789.jpg  (Main image)
│  ├─ 1704067205000-987654321.jpg  (Gallery 1)
│  ├─ 1704067210000-555666777.jpg  (Gallery 2)
│  └─ ...
└─ ...
```

---

## 🛠️ TECHNICAL DETAILS

### **Database Schema**
```sql
-- projects table
image_url VARCHAR(500)  -- Main/cover image
project_url VARCHAR(500)
github_url VARCHAR(500)

-- project_images table (NEW - for gallery)
project_id BIGINT (FK)
image_url VARCHAR(500)  -- Gallery images
image_order SMALLINT    -- Sort order (0, 1, 2...)
```

### **API Endpoints (Gallery Related)**
```
GET  /api/projects/:id
└─ Returns: project + ALL gallery images

POST /api/projects/:id/images
├─ Body: FormData with 'images' files
└─ Creates: Multiple project_images records

DELETE /api/projects/:projectId/images/:imageId
└─ Deletes: Single project_images record
```

### **FileList Management (JavaScript)**
```javascript
// Preview before Upload
const files = fileInput.files;  // FileList object
Array.from(files).forEach(file => {
  // Read and display preview
  const reader = new FileReader();
  reader.readAsDataURL(file);
});

// Remove file from input
const dt = new DataTransfer();
for (let i = 0; i < files.length; i++) {
  if (i !== indexToRemove) {
    dt.items.add(files[i]);  // Add back except removed
  }
}
fileInput.files = dt.files;  // Update input
```

---

## 💡 TIPS & TRICKS

### **Efficient Workflow**
```
1️⃣ Create project dengan semua info dan main image
2️⃣ Tambah 2-3 gallery images saat create (optional)
3️⃣ Edit project kemudian untuk add/remove images lebih detail
4️⃣ Reorder images dengan delete & re-upload (simple solution)
```

### **Desktop vs Mobile**
```
Desktop:
- Drag & drop sangat smooth
- Banyak preview visible
- Easy to manage multiple files

Mobile (jika support):
- Click untuk browse
- One file at a time (limitation)
- Still preview before upload
```

### **Performance Optimization**
```
✅ DO:
- Compress images (80-90% quality)
- Resize ke target dimensions
- Use JPG for photos
- Batch upload (3-5 at once)

❌ DON'T:
- Upload original DSLR images (10MB+)
- Use PNG untuk foto (bigger file)
- Upload 10+ images at once (slow)
- Skip drag-drop (manual slower)
```

---

## 🐛 TROUBLESHOOTING

### ❌ Image upload fails
```
✅ Solution:
- Check file size < 5MB
- Check format (JPG/PNG/WebP)
- Check internet connection
- Refresh page and try again
- Check browser console for error
```

### ❌ Images appear with broken image icon
```
✅ Solution:
- Images might still uploading
- Refresh page after waiting 2 seconds
- Check server logs
- Try delete and re-upload

URL Format should be:
https://project-bucket.supabase.co/portfolio-images/xyz.jpg
```

### ❌ Can't delete image
```
✅ Solution:
- Refresh page first
- Check internet connection
- Make sure you clicked delete button
- Check console for JS errors
- Try different image first (test)
```

### ❌ Drag & drop not working
```
✅ Solution:
- Try clicking on the zone (should open browser)
- Check if files are valid images
- Try different browser
- Clear cache (Ctrl+Shift+Del)
- Check for browser extensions blocking drag
```

---

## 📊 FILE UPLOAD STATISTICS

### **Typical Upload Times**
```
Main Image (800x600, 150KB JPG):
- Network: 1-2 seconds
- Total: ~2-3 seconds

Gallery Images (5 x 1MB each):
- Each image: ~3-4 seconds
- All 5: ~15-20 seconds total
- With preview generation: +2-3 sec

Total workflow (create + 5 images):
- Form fill + upload: ~5-10 minutes
- Just update gallery: ~1-2 minutes
```

### **Storage Limits**
```
Per Project:
- Main image: 1 file (500KB recommended)
- Gallery: 5 files (5MB each)
- Max per project: ~30MB total

Global (Supabase Free):
- 1GB storage included
- Can store ~30-35 full projects

Upgrade untuk lebih storage jika diperlukan
```

---

## 🎓 LEARNING & REFERENCE

**Related Docs:**
- [DATABASE-STRUCTURE.md](DATABASE-STRUCTURE.md) - DB schema details
- [SUPABASE-SETUP-GUIDE.md](SUPABASE-SETUP-GUIDE.md) - Supabase setup
- [admin.html](../admin.html) - HTML structure
- [admin.js](../assets/js/admin.js) - JavaScript code

**Key Functions in Code:**
```javascript
setupDragDrop()              // Initialize drag-drop zones
showImagePreview()           // Show image thumbnails
removeFileAtIndex()          // Remove file from input
loadProjectGallery()         // Load gallery from server
uploadAdditionalGalleryImages()  // Upload new images
deleteGalleryImage()         // Delete single image
showStatusMessage()          // Show notifications
```

---

## ✅ CHECKLIST - BEFORE PRODUCTION

- [ ] Test drag & drop on main image
- [ ] Test drag & drop on gallery
- [ ] Create project dengan 5 gallery images
- [ ] Edit project dan add 3 more images
- [ ] Delete individual gallery images
- [ ] Test on different browsers (Chrome, Firefox, Safari)
- [ ] Test image formats (JPG, PNG, WebP)
- [ ] Test error: delete image yang tidak ada
- [ ] Test error: upload file bukan image
- [ ] Test mobile device (Android/iOS jika support)

---

**Status: ✅ Gallery Management Ready to Use!**

Enjoy mengelola project gallery dengan cara yang lebih mudah dan intuitif! 🎉

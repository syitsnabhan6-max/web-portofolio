# 📊 ADMIN PANEL - ARCHITECTURE & FLOW DIAGRAMS

Visual representation dari admin panel dengan gallery management features

---

## 🏗️ ADMIN PANEL ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN PANEL                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Projects   │  │ Add Project  │  │  Settings    │      │
│  │   (Browse)   │  │  (Create)    │  │  (Config)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│       ▲                  ▲                   ▲              │
│       │                  │                   │              │
│       └──────────────────┼───────────────────┘              │
│                          │                                  │
│                   ┌──────┴──────┐                           │
│                   │ Image Upload │                          │
│                   └──────┬──────┘                           │
│                          │                                  │
│          ┌───────────────┼───────────────┐                  │
│          ▼               ▼               ▼                  │
│      [Drag-Drop]   [Preview]      [Upload Status]          │
│      Zone UI       Thumbnails      Toast Message           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 IMAGE UPLOAD FLOW

### **Adding New Project with Gallery**

```
START: Add Project Tab
   │
   ├─ Fill in:
   │  ├─ Title
   │  ├─ Category
   │  ├─ Description
   │  ├─ Problem
   │  ├─ Solution
   │  └─ Technologies
   │
   ├─ Upload Main Image
   │  ├─ Drag or Click
   │  ├─ Show Preview
   │  └─ Ready to submit
   │
   ├─ Upload Gallery Images (OPTIONAL)
   │  ├─ Drag 1-5 images
   │  ├─ Show Previews Grid
   │  ├─ Allow remove individual
   │  └─ Ready to submit
   │
   └─ Submit Form
      ├─ POST /api/projects
      │  ├─ Create project record
      │  └─ Return project.id
      │
      ├─ POST /api/projects/:id/images
      │  ├─ Upload all gallery images
      │  ├─ Create project_images records
      │  └─ Return image URLs
      │
      ├─ Show: "✅ Project created successfully!"
      │
      └─ Redirect: Projects Tab → Show new project in list
```

---

## ✏️ EDITING PROJECT & MANAGING GALLERY

### **Edit Existing Project**

```
START: Edit Button (on project card)
   │
   ├─ GET /api/projects/:id
   │  └─ Fetch project + all gallery images
   │
   ├─ Open Edit Modal
   │  ├─ Show form fields (pre-filled)
   │  └─ Show "Project Gallery" section
   │
   ├─ VIEW: Current Gallery Images
   │  ├─ Grid of thumbnails
   │  ├─ DELETE button on hover
   │  └─ Confirm before delete
   │
   ├─ ACTION: Upload More Images
   │  ├─ Drag-drop or click
   │  ├─ Show preview grid
   │  ├─ Click "Upload Selected Images"
   │  └─ POST /api/projects/:id/images
   │
   ├─ ACTION: Delete Gallery Image
   │  ├─ Hover on image → show button
   │  ├─ Click DELETE button
   │  ├─ Confirm dialog
   │  ├─ DELETE /api/projects/:id/images/:imageId
   │  └─ Gallery auto-refresh
   │
   ├─ ACTION: Update Project Fields
   │  ├─ Edit title/description/etc
   │  ├─ Optional: upload new main image
   │  ├─ Click "Update Project"
   │  └─ PUT /api/projects/:id
   │
   └─ Close Modal & Refresh List
```

---

## 🗂️ COMPONENT HIERARCHY

```
AdminPanel
│
├── LoginSection
│   ├── LoginForm
│   └── ErrorMessage
│
└── AdminSection
    │
    ├── Navbar
    │   ├── Title
    │   └── UserInfo + Logout
    │
    ├── Sidebar
    │   ├── Projects Tab Button
    │   ├── Add Project Tab Button
    │   └── Settings Tab Button
    │
    └── MainContent
        │
        ├── ProjectsTab
        │   ├── SearchInput
        │   └── ProjectsGrid
        │       └── ProjectCard (repeating)
        │           ├── Image
        │           ├── Title + Info
        │           └── Edit/Delete Buttons
        │
        ├── AddProjectTab
        │   └── ProjectForm
        │       ├── TextInputs (title, urls)
        │       ├── Textareas (description, problem, solution)
        │       ├── MainImageUpload (required)
        │       │   └── DragDropZone + Preview
        │       ├── GalleryImageUpload (optional)
        │       │   ├── DragDropZone
        │       │   └── PreviewGrid
        │       │       └── ImagePreviewItem (repeating)
        │       │           ├── Thumbnail
        │       │           └── RemoveButton
        │       └── SubmitButtons
        │
        ├── SettingsTab
        │   ├── CategoryManager
        │   │   ├── AddCategoryForm
        │   │   └── CategoriesGrid
        │   ├── ProfileInfo (read-only)
        │   └── DatabaseInfo
        │
        └── EditModal
            └── EditProjectForm
                ├── form fields (pre-filled)
                ├── MainImageUpload
                └── GalleryManagementSection
                    ├── AddGalleryImages
                    │   ├── DragDropZone
                    │   ├── PreviewGrid
                    │   └── UploadButton
                    └── CurrentGalleryImages
                        └── GalleryImageItem (repeating)
                            ├── Image
                            └── DeleteButton (hover overlay)
```

---

## 📡 API FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                    BROWSER (Admin UI)                       │
└────────────────────┬────────────────────────────────────────┘
                     │
     ┌───────────────┼───────────────┐
     │               │               │
     ▼               ▼               ▼
┌─────────┐     ┌─────────┐     ┌─────────┐
│   GET   │     │  POST   │     │ DELETE  │
│Projects │     │Projects │     │Project  │
└────┬────┘     └────┬────┘     └────┬────┘
     │               │               │
     └───────────────┼───────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │   Node.js Express      │
        │      Server            │
        └────┬───────────────┬───┘
             │               │
         ┌───▼───┐      ┌────▼────┐
         │ Multer │      │  Supabase │
         │ Upload │      │  Client   │
         └───┬───┘      └────┬────┘
             │               │
         ┌───▼───┐      ┌────▼──────┐
         │ Local │      │ PostgreSQL │
         │ Files │      │ Database   │
         └───────┘      └─────┬──────┘
                              │
                    ┌─────────┴────────┐
                    │                  │
              ┌─────▼────┐      ┌──────▼────┐
              │ projects │      │ project   │
              │  table   │      │  _images  │
              │          │      │   table   │
              └──────────┘      └───────────┘
```

---

## 🔀 GALLERY IMAGE LIFECYCLE

```
┌──────────────────────────────────────────────────────────────┐
│        IMAGE LIFECYCLE (From Upload to Display)              │
└──────────────────────────────────────────────────────────────┘

1. USER SELECTS IMAGE
   ┌────────────────────┐
   │ User drags/clicks  │
   │ to select image    │
   └────────┬───────────┘
            │
            ▼
   ┌────────────────────┐
   │ JavaScript reads   │
   │ FileList object    │
   └────────┬───────────┘
            │
            ▼
   ┌────────────────────┐
   │ FileReader API     │
   │ readAsDataURL()    │
   └────────┬───────────┘
            │
            ▼

2. PREVIEW SHOWN
   ┌────────────────────┐
   │ DataURL as <img>   │
   │ src attribute      │
   │ (Base64 preview)   │
   └────────┬───────────┘
            │
            ▼

3. USER CONFIRMS (→ Submit)
   ┌────────────────────┐
   │ FormData object    │
   │ append(file)       │
   └────────┬───────────┘
            │
            ▼
   ┌────────────────────┐
   │ POST to /api/...   │
   │ with FormData      │
   └────────┬───────────┘
            │
            ▼

4. SERVER PROCESSES
   ┌────────────────────┐
   │ Multer middleware  │
   │ Saves to disk      │
   │ /assets/uploads/   │
   └────────┬───────────┘
            │
            ▼
   ┌────────────────────┐
   │ Get filename       │
   │ from fs.stats      │
   └────────┬───────────┘
            │
            ▼

5. DATABASE RECORD
   ┌────────────────────┐
   │ INSERT into        │
   │ project_images:    │
   │ - project_id       │
   │ - image_url        │
   │ - image_order      │
   └────────┬───────────┘
            │
            ▼

6. CLIENT RECEIVES
   ┌────────────────────┐
   │ 200 OK response    │
   │ with image URL     │
   └────────┬───────────┘
            │
            ▼

7. DISPLAY IN GALLERY
   ┌────────────────────┐
   │ Add to DOM         │
   │ <img src="URL">    │
   │ with delete button │
   └────────┬───────────┘
            │
            ▼
   ┌────────────────────┐
   │ Image visible in   │
   │ Gallery grid       │
   └────────────────────┘
```

---

## 🎛️ STATE MANAGEMENT

```
┌──────────────────────────────────────────────────────────┐
│              ADMIN PANEL STATE                           │
└──────────────────────────────────────────────────────────┘

Global State:
├─ currentEditId: number (which project being edited)
└─ localStorage:
   ├─ adminToken: string (session)
   └─ adminUsername: string (display)

Component State (managed by browser):
├─ ProjectForm
│  ├─ title: string
│  ├─ category: string
│  ├─ description: string
│  ├─ problem: string
│  ├─ solution: string
│  ├─ technologies: string
│  ├─ image: FileList (main image)
│  └─ gallery_images: FileList (gallery)
│
├─ EditForm
│  ├─ [same as ProjectForm]
│  └─ id: number (project ID)
│
├─ FileInputs
│  ├─ files: FileList (currently selected)
│  └─ preview: DataURL[] (for UI display)
│
├─ UploadStatus
│  ├─ isLoading: boolean
│  ├─ message: string
│  ├─ type: 'success' | 'error' | 'loading'
│  └─ visible: boolean (auto-hide after 3s)
│
└─ Gallery
   ├─ currentGallery: ProjectImage[] (existing images)
   └─ selectedImages: File[] (to be uploaded)
```

---

## 📱 RESPONSIVE LAYOUT

```
DESKTOP (1200px+):
┌────────────────────────────────────────┐
│  Navbar                                │
├──────┬──────────────────────────────────┤
│ Side │                                  │
│ bar  │     Main Content Area            │
│      │     (Projects grid 4 columns)    │
│      │                                  │
│      │     Modal (if editing)           │
│      │     ┌─────────────────────────┐  │
│      │     │ Edit Project            │  │
│      │     │ - Form fields           │  │
│      │     │ - Gallery section       │  │
│      │     │   [Images Grid]         │  │
│      │     └─────────────────────────┘  │
└──────┴──────────────────────────────────┘

TABLET (768px-1199px):
┌──────────────────────────────────────┐
│  Navbar                              │
├─────┬────────────────────────────────┤
│Side │ Main Content                   │
│bar  │ (Projects grid 2-3 columns)    │
│ ⋮   │ Modal full-screen overlay      │
└─────┴────────────────────────────────┘

MOBILE (< 768px):
┌──────────────────────────────────┐
│  Navbar (hamburger menu)         │
├──────────────────────────────────┤
│ Main Content                     │
│ (Projects grid 1 column)         │
│                                  │
│ Modal (full-screen)              │
│ with scrollable content          │
└──────────────────────────────────┘
```

---

## 🔐 DATA FLOW SECURITY

```
User Input (Browser)
    │
    ├─ HTML5 File Input validation
    │  └─ Accept only images (accept="image/*")
    │
    ├─ JavaScript validation
    │  ├─ Check file type (MIME type)
    │  ├─ Check file size (< 5MB)
    │  └─ Check image dimensions
    │
    └─ FormData (HTTP Request)
       └─ Multipart/form-data encoding
          │
          ▼
Server (Node.js + Multer)
    │
    ├─ Multer middleware
    │  ├─ Re-validate file type
    │  ├─ Re-validate file size
    │  ├─ Check MIME type
    │  └─ Generate unique filename
    │
    ├─ File system storage
    │  └─ Save to /assets/uploads/
    │
    └─ Database record
       ├─ Insert into project_images
       ├─ Store URL path
       └─ Link to project_id (FK)
          │
          ▼
Database (PostgreSQL)
    │
    └─ Row Level Security (optional)
       ├─ Public: Can read active projects
       ├─ Public: Can read project images
       └─ Admin: Can create/update/delete
```

---

**Architecture Version: 2.0**
**Last Updated: 2024**
**Status: ✅ Production Ready**

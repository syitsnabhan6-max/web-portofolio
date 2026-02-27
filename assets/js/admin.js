// Admin Panel JavaScript

const API_URL = '/api';
let currentEditId = null;

function withAuth(options) {
  const token = localStorage.getItem('adminToken');
  if (!token) return options || {};
  const headers = new Headers((options && options.headers) || {});
  headers.set('Authorization', `Bearer ${token}`);
  return { ...(options || {}), headers };
}

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (res.status === 401) {
    logout();
    throw new Error('Unauthorized');
  }
  return { res, data };
}

// ==================== LOGIN ====================
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch(`${API_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminUsername', username);
      showAdminPanel();
    } else {
      document.getElementById('loginError').textContent = data.error || 'Login failed';
    }
  } catch (err) {
    console.error('Login error:', err);
    document.getElementById('loginError').textContent = 'Connection error';
  }
});

function showAdminPanel() {
  document.getElementById('loginSection').style.display = 'none';
  document.getElementById('adminSection').style.display = 'block';
  document.getElementById('adminUsername').textContent = localStorage.getItem('adminUsername');
  loadProjects();
  loadCategories();
  setupDragDrop('dropZone', 'projectGalleryImages', 'imagePreviewContainer');
  setupProjectI18nEditor('');
  setTimeout(() => {
    setupDragDrop('editDropZone', 'editProjectGalleryImages', 'editImagePreviewContainer');
    setupProjectI18nEditor('edit');
  }, 0);
}

function logout() {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUsername');
  document.getElementById('loginSection').style.display = 'block';
  document.getElementById('adminSection').style.display = 'none';
  document.getElementById('loginForm').reset();
}

// ==================== TAB SWITCHING ====================
function switchTab(tabName, evt) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });

  // Remove active class from all buttons
  document.querySelectorAll('.sidebar-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  // Show selected tab
  const tabMap = {
    'projects': 'projectsTab',
    'add-project': 'addProjectTab',
    'settings': 'settingsTab'
  };

  if (tabMap[tabName]) {
    document.getElementById(tabMap[tabName]).classList.add('active');
  }

  const clickEvent = evt || (typeof window !== 'undefined' ? window.event : undefined);
  const btn = clickEvent?.target?.closest('.sidebar-btn');
  if (btn) {
    btn.classList.add('active');
  }
}

// ==================== LOAD PROJECTS ====================
async function loadProjects() {
  try {
    const { data } = await fetchJson(`${API_URL}/projects`, withAuth());
    const projects = Array.isArray(data) ? data : [];

    const projectsList = document.getElementById('projectsList');
    projectsList.innerHTML = '';

    if (projects.length === 0) {
      projectsList.innerHTML = '<p class="no-projects">No projects yet. Create your first project!</p>';
      return;
    }

    projects.forEach(project => {
      const card = createProjectCard(project);
      projectsList.appendChild(card);
    });

    document.getElementById('totalProjects').textContent = projects.length;
  } catch (err) {
    console.error('Error loading projects:', err);
  }
}

function createProjectCard(project) {
  const card = document.createElement('div');
  card.className = 'project-card';

  const title = typeof project?.title === 'string' ? project.title : 'Untitled';
  const category = typeof project?.category === 'string' ? project.category : 'Uncategorized';
  const description = typeof project?.description === 'string' ? project.description : '';
  const technologies = typeof project?.technologies === 'string' ? project.technologies : '';

  const imageHtml = project.image_url
    ? `<img src="${project.image_url}" alt="${title}" class="project-image">`
    : '<div class="project-image-placeholder">No Image</div>';

  card.innerHTML = `
    <div class="project-image-container">
      ${imageHtml}
    </div>
    <div class="project-info">
      <h3>${title}</h3>
      <p class="category"><span class="badge">${category}</span></p>
      <p class="description">${description ? `${description.substring(0, 80)}${description.length > 80 ? '...' : ''}` : ''}</p>
      <div class="project-tech">
        ${technologies
          .split(',')
          .map(tech => tech.trim())
          .filter(Boolean)
          .map(tech => `<span class="tech-tag">${tech}</span>`)
          .join('')}
      </div>
      <div class="project-actions">
        <button class="btn-edit" onclick="editProject(${project.id})">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="btn-delete" onclick="confirmDelete(${project.id})">
          <i class="fas fa-trash"></i> Delete
        </button>
      </div>
    </div>
  `;

  return card;
}

// ==================== ADD PROJECT ====================
document.getElementById('projectForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  saveProjectI18nCurrentLang('');
  const formData = new FormData(document.getElementById('projectForm'));
  
  // Log what we're sending
  console.log('📤 Submitting project form...');
  for (let [key, value] of formData.entries()) {
    if (value instanceof File) {
      console.log(`  ${key}: [File] ${value.name}`);
    } else {
      console.log(`  ${key}: ${value}`);
    }
  }
  
  try {
    // Create project first
    console.log(`🚀 POST to ${API_URL}/projects`);
    const { res, data } = await fetchJson(`${API_URL}/projects`, withAuth({
      method: 'POST',
      body: formData
    }));

    console.log('📊 Response status:', res.status);
    console.log('📨 Response data:', data);

    if (res.ok) {
      console.log('✅ Project created! ID:', data.id);
      
      // If gallery images provided, upload them
      const galleryInput = document.getElementById('projectGalleryImages');
      if (galleryInput && galleryInput.files.length > 0) {
        console.log('📸 Uploading', galleryInput.files.length, 'gallery images...');
        const galleryFormData = new FormData();
        for (let i = 0; i < galleryInput.files.length; i++) {
          galleryFormData.append('images', galleryInput.files[i]);
        }

        const galleryResponse = await fetch(`${API_URL}/projects/${data.id}/images`, withAuth({
          method: 'POST',
          body: galleryFormData
        }));

        console.log('📊 Gallery upload response:', galleryResponse.status);
        if (!galleryResponse.ok) {
          console.warn('⚠️ Gallery images upload had issues');
        }
      }

      alert('✅ Project created successfully!');
      document.getElementById('projectForm').reset();
      loadProjects();
      switchTab('projects');
    } else {
      const errorMsg = data.error || 'Failed to create project';
      console.error('❌ Error:', errorMsg);
      alert('❌ Error: ' + errorMsg);
    }
  } catch (err) {
    console.error('❌ Connection error:', err);
    alert('❌ Connection error: ' + err.message);
  }
});

// ==================== EDIT PROJECT ====================
async function editProject(id) {
  try {
    const { data: project } = await fetchJson(`${API_URL}/projects/${id}`, withAuth());

    currentEditId = id;

    document.getElementById('editProjectId').value = project.id;
    document.getElementById('editProjectTitle').value = project.title;
    document.getElementById('editProjectCategory').value = project.category;
    document.getElementById('editProjectDescription').value = project.description;
    document.getElementById('editProjectProblem').value = project.problem;
    document.getElementById('editProjectSolution').value = project.solution;
    document.getElementById('editProjectTechnologies').value = project.technologies;
    document.getElementById('editProjectUrl').value = project.project_url || '';
    document.getElementById('editProjectGithub').value = project.github_url || '';

    const titleI18n = document.getElementById('editTitleI18n');
    const descriptionI18n = document.getElementById('editDescriptionI18n');
    const problemI18n = document.getElementById('editProblemI18n');
    const solutionI18n = document.getElementById('editSolutionI18n');
    if (titleI18n) titleI18n.value = project.title_i18n || '';
    if (descriptionI18n) descriptionI18n.value = project.description_i18n || '';
    if (problemI18n) problemI18n.value = project.problem_i18n || '';
    if (solutionI18n) solutionI18n.value = project.solution_i18n || '';
    loadProjectI18nFromHidden('edit');
    renderProjectI18nSaved('edit');
    loadProjectI18nLang('edit');

    // Load gallery images
    loadProjectGallery(id);

    document.getElementById('editModal').style.display = 'block';
  } catch (err) {
    console.error('Error loading project:', err);
  }
}

const projectI18nDraft = {
  '': { title: {}, description: {}, problem: {}, solution: {} },
  edit: { title: {}, description: {}, problem: {}, solution: {} }
};

function safeJsonParse(value) {
  if (!value) return null;
  if (typeof value !== 'string') return null;
  try {
    const obj = JSON.parse(value);
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) return obj;
  } catch (e) {
  }
  return null;
}

function getProjectI18nEls(prefix) {
  const p = prefix === 'edit' ? 'edit' : '';
  return {
    lang: document.getElementById(`${p ? 'editI18nLang' : 'i18nLang'}`),
    saved: document.getElementById(`${p ? 'editI18nSaved' : 'i18nSaved'}`),
    title: document.getElementById(`${p ? 'editI18nTitle' : 'i18nTitle'}`),
    description: document.getElementById(`${p ? 'editI18nDescription' : 'i18nDescription'}`),
    problem: document.getElementById(`${p ? 'editI18nProblem' : 'i18nProblem'}`),
    solution: document.getElementById(`${p ? 'editI18nSolution' : 'i18nSolution'}`),
    saveBtn: document.getElementById(`${p ? 'editI18nSaveBtn' : 'i18nSaveBtn'}`),
    hidden: {
      title: document.getElementById(`${p ? 'editTitleI18n' : 'titleI18n'}`),
      description: document.getElementById(`${p ? 'editDescriptionI18n' : 'descriptionI18n'}`),
      problem: document.getElementById(`${p ? 'editProblemI18n' : 'problemI18n'}`),
      solution: document.getElementById(`${p ? 'editSolutionI18n' : 'solutionI18n'}`)
    }
  };
}

function loadProjectI18nFromHidden(prefix) {
  const key = prefix === 'edit' ? 'edit' : '';
  const els = getProjectI18nEls(prefix);
  const draft = projectI18nDraft[key];
  for (const field of ['title', 'description', 'problem', 'solution']) {
    const parsed = safeJsonParse(els.hidden[field]?.value);
    draft[field] = parsed || {};
  }
}

function syncProjectI18nHidden(prefix) {
  const key = prefix === 'edit' ? 'edit' : '';
  const els = getProjectI18nEls(prefix);
  const draft = projectI18nDraft[key];
  for (const field of ['title', 'description', 'problem', 'solution']) {
    const obj = draft[field] || {};
    const cleaned = {};
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'string' && v.trim()) cleaned[String(k).toLowerCase()] = v.trim();
    }
    els.hidden[field].value = Object.keys(cleaned).length ? JSON.stringify(cleaned) : '';
  }
}

function renderProjectI18nSaved(prefix) {
  const key = prefix === 'edit' ? 'edit' : '';
  const els = getProjectI18nEls(prefix);
  if (!els.saved) return;
  const draft = projectI18nDraft[key];
  const langs = new Set();
  for (const field of ['title', 'description', 'problem', 'solution']) {
    for (const k of Object.keys(draft[field] || {})) langs.add(k);
  }
  const list = Array.from(langs).sort().map((l) => l.toUpperCase()).join(', ');
  els.saved.value = list || '-';
}

function loadProjectI18nLang(prefix) {
  const key = prefix === 'edit' ? 'edit' : '';
  const els = getProjectI18nEls(prefix);
  if (!els.lang) return;
  const lang = String(els.lang.value || 'en').toLowerCase();
  const draft = projectI18nDraft[key];

  if (els.title) els.title.value = draft.title?.[lang] || '';
  if (els.description) els.description.value = draft.description?.[lang] || '';
  if (els.problem) els.problem.value = draft.problem?.[lang] || '';
  if (els.solution) els.solution.value = draft.solution?.[lang] || '';
}

function saveProjectI18nCurrentLang(prefix) {
  const key = prefix === 'edit' ? 'edit' : '';
  const els = getProjectI18nEls(prefix);
  if (!els.lang) return;
  const lang = String(els.lang.value || 'en').toLowerCase();
  const draft = projectI18nDraft[key];

  const fields = [
    ['title', els.title?.value],
    ['description', els.description?.value],
    ['problem', els.problem?.value],
    ['solution', els.solution?.value]
  ];

  for (const [field, value] of fields) {
    const text = String(value || '').trim();
    if (text) {
      draft[field][lang] = text;
    } else if (draft[field] && draft[field][lang] !== undefined) {
      delete draft[field][lang];
    }
  }

  syncProjectI18nHidden(prefix);
  renderProjectI18nSaved(prefix);
}

function setupProjectI18nEditor(prefix) {
  const els = getProjectI18nEls(prefix);
  if (!els.lang || !els.saveBtn || !els.hidden.title) return;
  if (els.lang.dataset.bound === 'true') return;
  els.lang.dataset.bound = 'true';

  loadProjectI18nFromHidden(prefix);
  renderProjectI18nSaved(prefix);
  loadProjectI18nLang(prefix);

  els.lang.addEventListener('change', () => {
    saveProjectI18nCurrentLang(prefix);
    loadProjectI18nLang(prefix);
  });

  els.saveBtn.addEventListener('click', () => {
    saveProjectI18nCurrentLang(prefix);
  });
}

function closeEditModal() {
  document.getElementById('editModal').style.display = 'none';
  currentEditId = null;
}

document.getElementById('editProjectForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!currentEditId) return;

  saveProjectI18nCurrentLang('edit');
  const formData = new FormData(document.getElementById('editProjectForm'));

  try {
    const { res, data } = await fetchJson(`${API_URL}/projects/${currentEditId}`, withAuth({
      method: 'PUT',
      body: formData
    }));

    if (res.ok) {
      alert('Project updated successfully!');
      closeEditModal();
      loadProjects();
    } else {
      alert('Error: ' + (data.error || 'Failed to update project'));
    }
  } catch (err) {
    console.error('Error updating project:', err);
    alert('Connection error');
  }
});

// ==================== DELETE PROJECT ====================
function confirmDelete(id) {
  if (confirm('Are you sure you want to delete this project?')) {
    deleteProjectConfirmed(id);
  }
}

async function deleteProject() {
  if (!currentEditId) return;

  if (confirm('Are you sure you want to delete this project?')) {
    try {
      const { res, data } = await fetchJson(`${API_URL}/projects/${currentEditId}`, withAuth({
        method: 'DELETE'
      }));

      if (res.ok) {
        alert('Project deleted successfully!');
        closeEditModal();
        loadProjects();
      } else {
        alert('Error: ' + (data.error || 'Failed to delete project'));
      }
    } catch (err) {
      console.error('Error deleting project:', err);
      alert('Connection error');
    }
  }
}

async function deleteProjectConfirmed(id) {
  try {
    const { res } = await fetchJson(`${API_URL}/projects/${id}`, withAuth({
      method: 'DELETE'
    }));

    if (res.ok) {
      alert('Project deleted successfully!');
      loadProjects();
    } else {
      alert('Failed to delete project');
    }
  } catch (err) {
    console.error('Error deleting project:', err);
    alert('Connection error');
  }
}

// ==================== SEARCH ====================
document.getElementById('searchInput')?.addEventListener('input', (e) => {
  const searchTerm = e.target.value.toLowerCase();
  const cards = document.querySelectorAll('.project-card');

  cards.forEach(card => {
    const title = card.querySelector('h3').textContent.toLowerCase();
    const category = card.querySelector('.category').textContent.toLowerCase();

    if (title.includes(searchTerm) || category.includes(searchTerm)) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
});

// ==================== EXPORT DATA ====================
async function exportDatabase() {
  try {
    const { data } = await fetchJson(`${API_URL}/projects`, withAuth());
    const projects = Array.isArray(data) ? data : [];

    const dataStr = JSON.stringify(projects, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `portfolio-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Error exporting data:', err);
    alert('Failed to export data');
  }
}

// ==================== MODAL CLOSE ====================
window.onclick = function(event) {
  const modal = document.getElementById('editModal');
  if (event.target === modal) {
    closeEditModal();
  }
};

// ==================== CATEGORY MANAGEMENT ====================

async function loadCategories() {
  try {
    const { data } = await fetchJson(`${API_URL}/categories`, withAuth());
    const categories = Array.isArray(data) ? data : [];
    displayCategories(categories);
    updateCategoryDropdown(categories);
  } catch (err) {
    console.error('Error loading categories:', err);
  }
}

function displayCategories(categories) {
  const categoriesList = document.getElementById('categoriesList');
  if (!categoriesList) return;

  if (categories.length === 0) {
    categoriesList.innerHTML = '<p style="color: var(--text-gray);">No categories yet. Add one below!</p>';
    return;
  }

  categoriesList.innerHTML = categories.map(cat => 
    `<div class="category-item">
      <span>${cat.name}</span>
    </div>`
  ).join('');
}

function updateCategoryDropdown(categories) {
  const categoryInputs = document.querySelectorAll('[name="category"]');
  categoryInputs.forEach(input => {
    const currentValue = input.value;
    input.innerHTML = '<option value="">Select a category</option>' + 
      categories.map(cat => 
        `<option value="${cat.name}" ${cat.name === currentValue ? 'selected' : ''}>${cat.name}</option>`
      ).join('');
  });
}

document.getElementById('categoryForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const categoryName = document.getElementById('newCategoryName').value.trim();

  if (!categoryName) {
    alert('Please enter a category name');
    return;
  }

  try {
    const { res, data } = await fetchJson(`${API_URL}/categories`, withAuth({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: categoryName })
    }));

    if (res.ok) {
      alert('Category added successfully!');
      document.getElementById('categoryForm').reset();
      loadCategories();
    } else {
      alert('Error: ' + (data.error || 'Failed to add category'));
    }
  } catch (err) {
    console.error('Error adding category:', err);
    alert('Connection error');
  }
});

// ==================== GALLERY MANAGEMENT ==================== 

// Setup drag-drop for file inputs
function setupDragDrop(dropZoneId, fileInputId, previewContainerId) {
  const dropZone = document.getElementById(dropZoneId);
  const fileInput = document.getElementById(fileInputId);
  
  if (!dropZone || !fileInput) return;
  if (dropZone.dataset.dragDropBound === 'true') return;
  dropZone.dataset.dragDropBound = 'true';

  // Click to browse
  dropZone.addEventListener('click', () => fileInput.click());

  // Drag events
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    fileInput.files = files;
    
    // Show preview
    showImagePreview(fileInput, previewContainerId);
  });

  // File input change
  fileInput.addEventListener('change', () => {
    showImagePreview(fileInput, previewContainerId);
  });
}

// Show preview of selected images
function showImagePreview(fileInput, previewContainerId) {
  const previewContainer = document.getElementById(previewContainerId);
  if (!previewContainer) return;

  previewContainer.innerHTML = '';
  const files = fileInput.files;

  // Show upload button if there are files (for edit form only)
  const uploadBtn = document.getElementById('uploadGalleryBtn');
  if (uploadBtn) {
    uploadBtn.style.display = files.length > 0 ? 'block' : 'none';
  }

  Array.from(files).slice(0, 5).forEach((file, index) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const item = document.createElement('div');
      item.className = 'image-preview-item';
      item.innerHTML = `
        <img src="${e.target.result}" alt="Preview ${index + 1}">
        <button type="button" class="image-preview-remove" data-index="${index}" title="Remove">
          <i class="fas fa-times"></i>
        </button>
      `;

      const removeBtn = item.querySelector('.image-preview-remove');
      removeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Remove from preview
        item.remove();
        // Update file input (remove file at index)
        removeFileAtIndex(fileInput, index);
        
        // Update button visibility
        if (uploadBtn && fileInput.files.length === 0) {
          uploadBtn.style.display = 'none';
        }
      });

      previewContainer.appendChild(item);
    };
    
    reader.readAsDataURL(file);
  });
}

// Remove file at specific index from FileList (create new DataTransfer)
function removeFileAtIndex(fileInput, indexToRemove) {
  const dt = new DataTransfer();
  const files = fileInput.files;
  
  for (let i = 0; i < files.length; i++) {
    if (i !== indexToRemove) {
      dt.items.add(files[i]);
    }
  }
  
  fileInput.files = dt.files;
}

// Load existing gallery images for project
async function loadProjectGallery(projectId) {
  try {
    const { data: project } = await fetchJson(`${API_URL}/projects/${projectId}`, withAuth());
    
    const container = document.getElementById('currentGalleryContainer');
    if (!container) return;

    if (!project.images || project.images.length === 0) {
      container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-gray);">No images in gallery yet</p>';
      return;
    }

    container.innerHTML = '';
    project.images.forEach((image, index) => {
      const item = document.createElement('div');
      item.className = 'gallery-image-item';
      item.innerHTML = `
        <img src="${image.image_url}" alt="Gallery ${index + 1}" onerror="this.src='./assets/images/project-1.jpg'">
        <div class="gallery-image-overlay">
          <button type="button" class="gallery-delete-btn" onclick="deleteGalleryImage(${image.id}, ${projectId})" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      container.appendChild(item);
    });
  } catch (err) {
    console.error('Error loading gallery:', err);
  }
}

// Delete gallery image
async function deleteGalleryImage(imageId, projectId) {
  if (!confirm('Delete this image?')) return;

  try {
    showStatusMessage('Deleting image...', 'loading');
    
    const response = await fetch(`${API_URL}/projects/${projectId}/images/${imageId}`, withAuth({
      method: 'DELETE'
    }));

    if (response.ok) {
      showStatusMessage('Image deleted successfully!', 'success');
      loadProjectGallery(projectId);
    } else {
      showStatusMessage('Failed to delete image', 'error');
    }
  } catch (err) {
    console.error('Error deleting image:', err);
    showStatusMessage('Connection error', 'error');
  }
}

// Upload additional images for existing project
async function uploadAdditionalGalleryImages(projectId) {
  const fileInput = document.getElementById('editProjectGalleryImages');
  if (!fileInput || fileInput.files.length === 0) {
    showStatusMessage('No images selected', 'error');
    return;
  }

  try {
    showStatusMessage(`Uploading ${fileInput.files.length} image(s)...`, 'loading');
    
    const formData = new FormData();
    for (let i = 0; i < fileInput.files.length; i++) {
      formData.append('images', fileInput.files[i]);
    }

    const { res, data } = await fetchJson(`${API_URL}/projects/${projectId}/images`, withAuth({
      method: 'POST',
      body: formData
    }));

    if (res.ok) {
      showStatusMessage('Images uploaded successfully!', 'success');
      fileInput.value = '';
      document.getElementById('editImagePreviewContainer').innerHTML = '';
      document.getElementById('uploadGalleryBtn').style.display = 'none';
      loadProjectGallery(projectId);
    } else {
      showStatusMessage(data.error || 'Upload failed', 'error');
    }
  } catch (err) {
    console.error('Error uploading images:', err);
    showStatusMessage('Connection error', 'error');
  }
}

// Handler function for upload button
function uploadAdditionalGalleryImagesHandler(event) {
  event.preventDefault();
  if (currentEditId) {
    uploadAdditionalGalleryImages(currentEditId);
  }
}

// Show status message notification
function showStatusMessage(message, type = 'loading') {
  const existing = document.querySelector('.upload-status');
  if (existing) existing.remove();

  const status = document.createElement('div');
  status.className = `upload-status ${type}`;
  status.innerHTML = `
    ${type === 'loading' ? '<i class="fas fa-spinner" style="animation: spin 1s linear infinite;"></i> ' : ''}
    ${type === 'success' ? '<i class="fas fa-check"></i> ' : ''}
    ${type === 'error' ? '<i class="fas fa-exclamation-circle"></i> ' : ''}
    ${message}
  `;
  
  document.body.appendChild(status);

  if (type !== 'loading') {
    setTimeout(() => status.remove(), 3000);
  }
}

// Update categories dynamically
const originalEditProject = editProject;

// Setup drag-drop zones on page load
window.addEventListener('load', () => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    showAdminPanel();
    loadCategories();
    
    // Setup add project form drag-drop
    setupDragDrop('dropZone', 'projectGalleryImages', 'imagePreviewContainer');
    
    // Setup edit form drag-drop (setup when modal opens)
    setTimeout(() => {
      setupDragDrop('editDropZone', 'editProjectGalleryImages', 'editImagePreviewContainer');
    }, 500);
  }
});

// Gallery management is now integrated into the admin panel
// Drag-drop and image upload features are ready to use

/**
 * Portfolio Project Manager - SIMPLIFIED VERSION
 * Handles dynamic project loading, filtering, and gallery display
 */

let allProjects = [];
let allCategories = [];
let selectedCategory = 'all';

const projectDetailsCache = new Map();
const projectDetailsInFlight = new Map();

// API Configuration
const API_BASE = window.location.origin;
const PROJECT_I18N_URL = `${API_BASE}/api/project-translations`;
let projectI18n = null;

const tt = (key, fallback, vars) => {
  if (window.i18n && typeof window.i18n.t === 'function') {
    return window.i18n.t(key, { defaultText: fallback, vars });
  }
  if (fallback !== undefined) return fallback;
  return key;
};

const tCategory = (name) => {
  if (window.i18n && typeof window.i18n.tCategory === 'function') {
    return window.i18n.tCategory(name);
  }
  return String(name || '');
};

const getLang = () => {
  if (window.i18n && typeof window.i18n.getLanguage === 'function') {
    return window.i18n.getLanguage();
  }
  return 'en';
};

const safeParseObject = (value) => {
  if (!value) return null;
  if (typeof value === 'object' && !Array.isArray(value)) return value;
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!text || !(text.startsWith('{') && text.endsWith('}'))) return null;
  try {
    const obj = JSON.parse(text);
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) return obj;
  } catch {
  }
  return null;
};

const pickProjectText = (project, field, fallback) => {
  const lang = String(getLang() || 'en').toLowerCase();
  const base = lang.includes('-') ? lang.split('-')[0] : lang;

  const pid = project?.id !== undefined && project?.id !== null ? String(project.id) : null;
  const fromFile = pid && projectI18n && projectI18n[base] && projectI18n[base][pid] && projectI18n[base][pid][field];
  if (typeof fromFile === 'string' && fromFile.trim()) return fromFile;

  const direct = project?.[`${field}_${lang}`] ?? project?.[`${field}_${base}`];
  if (typeof direct === 'string' && direct.trim()) return direct;

  const map = safeParseObject(project?.[`${field}_i18n`]);
  if (map) {
    const value = map[lang] ?? map[base] ?? map.en ?? map.id;
    if (typeof value === 'string' && value.trim()) return value;
  }

  const raw = project?.[field];
  if (typeof raw === 'string' && raw.trim()) return raw;
  return fallback;
};

async function ensureProjectI18nLoaded() {
  if (projectI18n) return;
  try {
    const res = await fetch(PROJECT_I18N_URL, { cache: 'no-cache' });
    if (!res.ok) {
      projectI18n = {};
      return;
    }
    const json = await res.json();
    projectI18n = json && typeof json === 'object' ? json : {};
  } catch {
    projectI18n = {};
  }
}

console.log('🚀 Portfolio Manager initialized. API_BASE:', API_BASE);

/**
 * Initialize portfolio on page load
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOM Content Loaded');
  ensureProjectI18nLoaded();
  loadProjects();
  loadCategories();
  setupFilterListeners();
  document.addEventListener('i18n:change', async () => {
    await ensureProjectI18nLoaded();
    renderCategoryFilters();
    filterProjectsByCategory(selectedCategory);
  });
  
  // Test: Add click to body to debug
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-project-id]')) {
      console.log('🖱️ Clicked on project item');
    }
  });
});

/**
 * Fetch all projects from API
 */
async function loadProjects() {
  try {
    console.log('📥 Fetching projects from:', `${API_BASE}/api/projects`);
    
    const response = await fetch(`${API_BASE}/api/projects`);
    console.log('📊 Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    allProjects = await response.json();
    console.log('✅ Projects loaded:', allProjects.length, 'projects');
    console.log('📋 Sample project:', allProjects[0]);
    
    renderProjects(allProjects);
    setTimeout(() => warmProjectDetailsCache(allProjects), 250);
  } catch (error) {
    console.error('❌ Error loading projects:', error);
    showProjectsError(tt('portfolio.loadError', 'Failed to load projects: {message}', { message: error.message }));
  }
}

/**
 * Fetch all categories from API
 */
async function loadCategories() {
  try {
    console.log('📥 Fetching categories from:', `${API_BASE}/api/categories`);
    
    const response = await fetch(`${API_BASE}/api/categories`);
    if (!response.ok) {
      console.warn('⚠️ Categories endpoint failed, extracting from projects');
      extractCategoriesFromProjects();
      return;
    }
    
    allCategories = await response.json();
    console.log('✅ Categories loaded:', allCategories.length);
    renderCategoryFilters();
  } catch (error) {
    console.error('❌ Error loading categories:', error);
    extractCategoriesFromProjects();
  }
}

/**
 * Extract unique categories from projects (fallback method)
 */
function extractCategoriesFromProjects() {
  if (!allProjects || allProjects.length === 0) {
    console.warn('⚠️ No projects to extract categories from');
    allCategories = [];
    return;
  }
  
  const categories = [...new Set(allProjects.map(p => p.category).filter(Boolean))];
  allCategories = categories.map(name => ({ id: name, name }));
  console.log('📋 Categories extracted from projects:', allCategories);
  renderCategoryFilters();
}

/**
 * Render category filter buttons dynamically
 */
function renderCategoryFilters() {
  const selectList = document.querySelector('.select-list');
  if (!selectList) {
    console.error('❌ .select-list element not found');
    return;
  }

  // Clear existing filters except "All"
  const existingItems = selectList.querySelectorAll('.select-item:not(:first-child)');
  existingItems.forEach(item => item.remove());
  console.log('🗑️ Cleared old category buttons');

  // Add category buttons
  if (allCategories.length > 0) {
    allCategories.forEach(category => {
      const li = document.createElement('li');
      li.className = 'select-item';
      
      const button = document.createElement('button');
      button.className = 'select-button';
      button.dataset.selectItem = category.name.toLowerCase().replace(/\s+/g, '-');
      button.textContent = tCategory(category.name);
      
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🔂 Filter clicked:', category.name);
        filterProjectsByCategory(category.name);
      });

      li.appendChild(button);
      selectList.appendChild(li);
    });
    console.log('✅ Category buttons created:', allCategories.length);
  }
}

function updateSelectUI(selectedText) {
  const selectValue = document.querySelector('[data-select-value]');
  if (selectValue) {
    selectValue.textContent = selectedText;
  }

  const select = document.querySelector('[data-select]');
  if (select) {
    select.classList.remove('active');
  }
}

/**
 * Setup filter button listeners
 */
function setupFilterListeners() {
  const allButton = document.querySelector('[data-select-item="all"]');
  if (allButton) {
    allButton.classList.add('select-button', 'active');
    allButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('🔂 All projects filter clicked');
      filterProjectsByCategory('all');
    });
  }
}

/**
 * Filter projects by category
 */
function filterProjectsByCategory(category) {
  console.log('🔎 Filtering by category:', category);
  
  selectedCategory = category;

  if (category === 'all') {
    updateSelectUI(tt('filters.all', 'All'));
  } else {
    updateSelectUI(tCategory(category));
  }
  
  // Update active button styling
  document.querySelectorAll('.select-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const activeBtn = document.querySelector(`[data-select-item="${category.toLowerCase().replace(/\s+/g, '-')}"]`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }

  // Filter and render
  if (category === 'all') {
    renderProjects(allProjects);
  } else {
    const filtered = allProjects.filter(p => p.category && p.category.toLowerCase() === category.toLowerCase());
    console.log('Filtered projects:', filtered.length);
    renderProjects(filtered);
  }
}

/**
 * Render projects list with gallery support
 */
function renderProjects(projects) {
  const projectList = document.getElementById('projectList');
  if (!projectList) {
    console.error('❌ #projectList element not found');
    return;
  }

  console.log('🎨 Rendering', projects.length, 'projects');

  if (!projects || projects.length === 0) {
    projectList.innerHTML = `
      <li style="grid-column: 1/-1; text-align: center; padding: 40px 20px; color: #888;">
        <p>${escapeHtml(tt('portfolio.noProjects', 'No projects found.'))}</p>
      </li>
    `;
    return;
  }

  projectList.innerHTML = projects.map(project => createProjectElement(project)).join('');
  console.log('✅', projects.length, 'projects rendered');

  if (!projectList.dataset.clickBound) {
    projectList.addEventListener('click', async (e) => {
      const projectItem = e.target.closest('[data-project-id]');
      if (!projectItem) return;

      e.preventDefault();
      e.stopPropagation();

      const projectId = projectItem.getAttribute('data-project-id');
      console.log('🖱️ Project item clicked, ID:', projectId);

      if (projectItem.dataset.opening === 'true') return;
      projectItem.dataset.opening = 'true';
      projectItem.classList.add('is-opening');
      try {
        await openProjectDetails(projectId);
      } finally {
        window.setTimeout(() => {
          projectItem.dataset.opening = 'false';
          projectItem.classList.remove('is-opening');
        }, 250);
      }
    });
    projectList.dataset.clickBound = 'true';
  }

  if (!projectList.dataset.prefetchBound) {
    projectList.addEventListener('pointerover', (e) => {
      const projectItem = e.target.closest('[data-project-id]');
      if (!projectItem) return;
      const projectId = projectItem.getAttribute('data-project-id');
      if (!projectId) return;
      fetchProjectDetails(projectId);
    });
    projectList.dataset.prefetchBound = 'true';
  }
}

async function openProjectDetails(projectId) {
  if (!projectId) return;

  const detailed = await fetchProjectDetails(projectId);
  if (detailed) {
    showProjectGallery(detailed);
    return;
  }

  const fallback = allProjects.find(p => String(p.id) === String(projectId));
  if (fallback) {
    showProjectGallery(fallback);
    return;
  }

  console.error('❌ Project not found:', projectId);
}

async function fetchProjectDetails(projectId) {
  const key = String(projectId);
  const cached = projectDetailsCache.get(key);
  if (cached) return cached;

  const inFlight = projectDetailsInFlight.get(key);
  if (inFlight) return inFlight;

  const promise = (async () => {
    try {
      const response = await fetch(`${API_BASE}/api/projects/${encodeURIComponent(projectId)}`);
      if (!response.ok) return null;
      const project = await response.json();
      if (!project) return null;
      projectDetailsCache.set(key, project);
      return project;
    } catch {
      return null;
    }
  })().finally(() => {
    projectDetailsInFlight.delete(key);
  });

  projectDetailsInFlight.set(key, promise);
  return promise;
}

async function warmProjectDetailsCache(projects) {
  if (!Array.isArray(projects) || projects.length === 0) return;

  const ids = projects
    .map(p => p?.id)
    .filter(Boolean)
    .slice(0, 12);

  let idx = 0;
  const concurrency = 2;

  const worker = async () => {
    while (idx < ids.length) {
      const id = ids[idx++];
      await fetchProjectDetails(id);
    }
  };

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
}

/**
 * Create HTML for a single project item
 */
function createProjectElement(project) {
  if (!project) {
    console.warn('⚠️ Empty project object');
    return '';
  }
  
  const mainImage = project.image_url || 
                   (project.images && project.images.length > 0 ? project.images[0].image_url : './assets/images/project-1.jpg');
  
  const galleryCount = project.images ? project.images.length : 0;
  const title = pickProjectText(project, 'title', tt('portfolio.untitled', 'Untitled'));

  return `
    <li class="project-item active" 
        data-filter-item 
        data-category="${escapeHtml(project.category || '')}" 
        data-project-id="${project.id}" 
        style="cursor: pointer;">
      <a href="#" style="display: block;">
        <figure class="project-img">
          <div class="project-item-icon-box">
            <ion-icon name="eye-outline"></ion-icon>
            ${galleryCount > 1 ? `<span class="gallery-count">${galleryCount}</span>` : ''}
          </div>
          <img src="${escapeHtml(mainImage)}" 
               alt="${escapeHtml(title || tt('portfolio.projectAlt', 'Project'))}" 
               loading="lazy"
               onerror="this.src='./assets/images/project-1.jpg'">
        </figure>

        <h3 class="project-title">${escapeHtml(title)}</h3>
        <p class="project-category">${escapeHtml(project.category ? tCategory(project.category) : tt('categories.other', 'Other'))}</p>
      </a>
    </li>
  `;
}

/**
 * Show project gallery modal
 */
function showProjectGallery(project) {
  console.log('🖼️ Opening gallery for project:', project.title);
  
  const modal = createProjectModal(project);
  document.body.appendChild(modal);
  console.log('✅ Modal appended to DOM');

  // Close on backdrop click
  const backdrop = modal.querySelector('.modal-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', () => {
      console.log('🚫 Closing modal (backdrop)');
      modal.remove();
    });
  }

  // Close on X button
  const closeBtn = modal.querySelector('.modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      console.log('🚫 Closing modal (close button)');
      modal.remove();
    });
  }

  // Setup gallery navigation
  setupGalleryNavigation(modal, project.images || []);
}

/**
 * Create project detail modal
 */
function createProjectModal(project) {
  const images = project.images || [];
  const mainImage = project.image_url || (images.length > 0 ? images[0].image_url : '');

  const modal = document.createElement('div');
  modal.className = 'project-modal-overlay';
  
  const gallery = images.length > 0 ? images.map(img => img.image_url) : [mainImage];

  const title = pickProjectText(project, 'title', tt('portfolio.projectAlt', 'Project'));
  const description = pickProjectText(project, 'description', '');
  const problem = pickProjectText(project, 'problem', '');
  const solution = pickProjectText(project, 'solution', '');

  const technologiesHTML = project.technologies ? 
    project.technologies.split(',').map(tech => `<span class="tech-tag">${escapeHtml(tech.trim())}</span>`).join('') : '';

  modal.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="project-modal">
      <button class="modal-close" aria-label="${escapeHtml(tt('projectModal.close', 'Close'))}">
        <ion-icon name="close-outline"></ion-icon>
      </button>

      <div class="modal-content">
        <div class="gallery-section">
          <div class="gallery-viewer">
            <div class="gallery-main">
              <img id="mainImage" src="${escapeHtml(gallery[0] || mainImage)}" alt="${escapeHtml(project.title || 'Project')}">
              ${gallery.length > 1 ? '<span class="gallery-counter"><span id="currentImage">1</span> / <span id="totalImages">' + gallery.length + '</span></span>' : ''}
            </div>

            ${gallery.length > 1 ? `
              <div class="gallery-controls">
                <button class="gallery-prev" aria-label="${escapeHtml(tt('projectModal.previousImage', 'Previous image'))}">
                  <ion-icon name="chevron-back-outline"></ion-icon>
                </button>
                <button class="gallery-next" aria-label="${escapeHtml(tt('projectModal.nextImage', 'Next image'))}">
                  <ion-icon name="chevron-forward-outline"></ion-icon>
                </button>
              </div>

              <div class="gallery-thumbnails">
                ${gallery.map((img, idx) => `
                  <img 
                    class="thumbnail ${idx === 0 ? 'active' : ''}" 
                    src="${escapeHtml(img)}" 
                    alt="${escapeHtml(tt('projectModal.galleryImageAlt', 'Gallery image {n}', { n: idx + 1 }))}"
                    data-index="${idx}"
                    onerror="this.src='./assets/images/project-1.jpg'"
                  >
                `).join('')}
              </div>
            ` : ''}
          </div>
        </div>

        <div class="project-details">
          <h2>${escapeHtml(title)}</h2>
          <p class="project-category">${escapeHtml(project.category ? tCategory(project.category) : tt('categories.other', 'Other'))}</p>

          ${description ? `<p class="project-desc">${escapeHtml(description)}</p>` : ''}

          ${problem ? `
            <div class="detail-section">
              <h4>${escapeHtml(tt('projectModal.problem', 'Problem'))}</h4>
              <p>${escapeHtml(problem)}</p>
            </div>
          ` : ''}

          ${solution ? `
            <div class="detail-section">
              <h4>${escapeHtml(tt('projectModal.solution', 'Solution'))}</h4>
              <p>${escapeHtml(solution)}</p>
            </div>
          ` : ''}

          ${technologiesHTML ? `
            <div class="detail-section">
              <h4>${escapeHtml(tt('projectModal.technologies', 'Technologies'))}</h4>
              <div class="tech-tags">
                ${technologiesHTML}
              </div>
            </div>
          ` : ''}

          <div class="project-links">
            ${project.project_url ? `
              <a href="${escapeHtml(project.project_url)}" target="_blank" rel="noopener noreferrer" class="link-btn">
                <ion-icon name="open-outline"></ion-icon>
                ${escapeHtml(tt('projectModal.viewProject', 'View Project'))}
              </a>
            ` : ''}
            ${project.github_url ? `
              <a href="${escapeHtml(project.github_url)}" target="_blank" rel="noopener noreferrer" class="link-btn">
                <ion-icon name="logo-github"></ion-icon>
                ${escapeHtml(tt('projectModal.github', 'GitHub'))}
              </a>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
  `;

  return modal;
}

/**
 * Setup gallery navigation
 */
function setupGalleryNavigation(modal, images) {
  if (!images || images.length <= 1) {
    console.log('ℹ️ Single image or no images, skipping navigation');
    return;
  }

  const gallery = images.map(img => img.image_url).filter(Boolean);
  if (gallery.length === 0) return;
  
  let currentIndex = 0;

  const mainImage = modal.querySelector('#mainImage');
  const currentImageSpan = modal.querySelector('#currentImage');
  const prevBtn = modal.querySelector('.gallery-prev');
  const nextBtn = modal.querySelector('.gallery-next');
  const thumbnails = modal.querySelectorAll('.thumbnail');

  const updateGallery = (index) => {
    currentIndex = ((index % gallery.length) + gallery.length) % gallery.length;
    mainImage.src = gallery[currentIndex];
    if (currentImageSpan) {
      currentImageSpan.textContent = currentIndex + 1;
    }

    thumbnails.forEach((thumb, idx) => {
      if (idx === currentIndex) {
        thumb.classList.add('active');
      } else {
        thumb.classList.remove('active');
      }
    });
    
    console.log('🖼️ Showing image', currentIndex + 1, 'of', gallery.length);
  };

  if (prevBtn) prevBtn.addEventListener('click', () => updateGallery(currentIndex - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => updateGallery(currentIndex + 1));

  thumbnails.forEach((thumb, idx) => {
    thumb.addEventListener('click', () => updateGallery(idx));
  });

  // Keyboard navigation
  const handleKeyboard = (e) => {
    if (e.key === 'ArrowLeft') updateGallery(currentIndex - 1);
    if (e.key === 'ArrowRight') updateGallery(currentIndex + 1);
  };
  
  document.addEventListener('keydown', handleKeyboard);
  
  // Cleanup on modal close
  const observer = new MutationObserver(() => {
    if (!document.body.contains(modal)) {
      document.removeEventListener('keydown', handleKeyboard);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true });
}

/**
 * Show error message
 */
function showProjectsError(message) {
  const projectList = document.getElementById('projectList');
  if (projectList) {
    projectList.innerHTML = `
      <li style="grid-column: 1/-1; text-align: center; padding: 40px 20px; color: #e74c3c;">
        <p>❌ ${escapeHtml(message)}</p>
      </li>
    `;
  }
  console.error('Error:', message);
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

'use strict';

const API_URL = '/api';

// element toggle function
const elementToggleFunc = function (elem) { if (elem) elem.classList.toggle("active"); }

try {
  // sidebar variables
  const sidebar = document.querySelector("[data-sidebar]");
  const sidebarBtn = document.querySelector("[data-sidebar-btn]");

  // sidebar toggle functionality for mobile
  if (sidebarBtn && sidebar) {
    sidebarBtn.addEventListener("click", function () { elementToggleFunc(sidebar); });
  }

  // testimonials variables
  const testimonialsItem = document.querySelectorAll("[data-testimonials-item]");
  const modalContainer = document.querySelector("[data-modal-container]");
  const modalCloseBtn = document.querySelector("[data-modal-close-btn]");
  const overlay = document.querySelector("[data-overlay]");

  // modal variable
  const modalImg = document.querySelector("[data-modal-img]");
  const modalTitle = document.querySelector("[data-modal-title]");
  const modalText = document.querySelector("[data-modal-text]");

  // modal toggle function
  const testimonialsModalFunc = function () {
    if (modalContainer) modalContainer.classList.toggle("active");
    if (overlay) overlay.classList.toggle("active");
  }

  // add click event to all modal items
  if (testimonialsItem && testimonialsItem.length > 0) {
    for (let i = 0; i < testimonialsItem.length; i++) {
      testimonialsItem[i].addEventListener("click", function () {
        if (modalImg) modalImg.src = this.querySelector("[data-testimonials-avatar]").src;
        if (modalImg) modalImg.alt = this.querySelector("[data-testimonials-avatar]").alt;
        if (modalTitle) modalTitle.innerHTML = this.querySelector("[data-testimonials-title]").innerHTML;
        if (modalText) modalText.innerHTML = this.querySelector("[data-testimonials-text]").innerHTML;

        testimonialsModalFunc();
      });
    }
  }

  // add click event to modal close button
  if (modalCloseBtn) modalCloseBtn.addEventListener("click", testimonialsModalFunc);
  if (overlay) overlay.addEventListener("click", testimonialsModalFunc);

} catch (err) {
  console.error('Error in sidebar/modal setup:', err);
}

try {
  // custom select variables
  const select = document.querySelector("[data-select]");
  const selectItems = document.querySelectorAll("[data-select-item]");
  const selectValue = document.querySelector("[data-select-value]");
  const filterBtn = document.querySelectorAll("[data-filter-btn]");

  const slugify = (value) => {
    return String(value || '')
      .toLowerCase()
      .trim()
      .replace(/&/g, 'and')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  // === APPLY FILTER FUNCTION ===
  window.applyFilter = function(filterValue) {
    try {
      const normalizedFilter = slugify(filterValue || 'all');
      const projectItems = document.querySelectorAll("[data-filter-item]");
      
      if (projectItems.length === 0) {
        return; // No projects to filter
      }
      
      let itemsShown = 0;
      projectItems.forEach(item => {
        const itemCategory = slugify(item.getAttribute('data-category') || '');
        
        // Show item if filter is "all" or if category matches
        if (normalizedFilter === 'all' || itemCategory === normalizedFilter) {
          item.classList.add('active');
          itemsShown++;
        } else {
          item.classList.remove('active');
        }
      });
      
    } catch (error) {
    }
  };

  // === SELECT DROPDOWN TOGGLE ===
  if (select) {
    select.addEventListener("click", function(e) {
      e.preventDefault();
      e.stopPropagation();
      this.classList.toggle("active");
    });
  }

  // === SELECT ITEM CLICK HANDLERS ===
  selectItems.forEach((item) => {
    item.addEventListener("click", function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const selectedText = this.textContent.trim();
      const filterValue = this.dataset.selectItem || slugify(selectedText);
      
      // Update display text
      if (selectValue) {
        selectValue.textContent = selectedText;
      }
      
      // Close dropdown
      if (select) {
        select.classList.remove("active");
      }
      
      // Apply filter
      window.applyFilter(filterValue);
    });
  });

  // === FILTER BUTTON CLICK HANDLERS ===
  let lastActiveBtn = filterBtn[0];
  filterBtn.forEach((btn) => {
    btn.addEventListener("click", function(e) {
      e.preventDefault();
      
      const buttonText = this.textContent.trim();
      const filterValue = this.dataset.filterValue || slugify(buttonText);
      
      // Update select display
      if (selectValue) {
        selectValue.textContent = buttonText;
      }
      
      // Update active button
      if (lastActiveBtn) {
        lastActiveBtn.classList.remove('active');
      }
      this.classList.add('active');
      lastActiveBtn = this;
      
      // Apply filter
      window.applyFilter(filterValue);
    });
  });

  // === CLOSE DROPDOWN WHEN CLICKING OUTSIDE ===
  if (select) {
    document.addEventListener("click", function(e) {
      const selectList = document.querySelector(".select-list");
      if (selectList && !select.contains(e.target) && !selectList.contains(e.target)) {
        select.classList.remove("active");
      }
    });
  }

  // === INITIALIZE FILTERS ===
  // Apply "All" filter on page load
  setTimeout(() => {
    window.applyFilter('all');
  }, 100);



// contact form variables
const form = document.querySelector("[data-form]");
const formInputs = document.querySelectorAll("[data-form-input]");
const formBtn = document.querySelector("[data-form-btn]");

// add event to all form input field
if (form && formInputs && formBtn) {
  for (let i = 0; i < formInputs.length; i++) {
    formInputs[i].addEventListener("input", function () {
      // check form validation
      if (form.checkValidity()) {
        formBtn.removeAttribute("disabled");
      } else {
        formBtn.setAttribute("disabled", "");
      }
    });
  }
  
  // Also check on form submit
  form.addEventListener("submit", function(e) {
    if (!form.checkValidity()) {
      e.preventDefault();
      alert('Please fill in all required fields correctly');
    }
  });
} else {
  console.warn('Contact form elements not found');
}



// page navigation variables
const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

console.log('Pages available:', Array.from(pages).map(p => p.dataset.page));

// add event to all nav link
navigationLinks.forEach((link, linkIndex) => {
  link.addEventListener("click", function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const targetPageName = String(this.dataset.pageTarget || this.textContent || '').toLowerCase().trim();
    console.log('Nav clicked - Target page:', targetPageName);
    
    // Remove active from all pages and links first
    pages.forEach((page) => page.classList.remove("active"));
    navigationLinks.forEach((navLink) => navLink.classList.remove("active"));
    
    // Find the matching page and activate it
    let foundPage = false;
    pages.forEach((page) => {
      const pageName = page.dataset.page.toLowerCase().trim();
      
      if (pageName === targetPageName) {
        console.log('Match found! Setting page active:', pageName);
        page.classList.add("active");
        this.classList.add("active");
        foundPage = true;
        window.scrollTo(0, 0);
      }
    });
    
    if (!foundPage) {
      console.warn('No matching page found for:', targetPageName);
    }
  });
});

} catch (err) {
  console.error('Error in custom select/filter/form/navigation setup:', err);
}

// === AVATAR MODAL FUNCTIONS ===
function openAvatarModal() {
  const avatarModal = document.getElementById('avatar-modal-container');
  const avatarOverlay = document.getElementById('avatar-overlay');
  if (!avatarModal) return;

  avatarModal.classList.add('active');
  if (avatarOverlay) avatarOverlay.classList.add('active');

  const imgEl = document.getElementById('profileViewerImage');
  const nameEl = document.getElementById('profileViewerName');
  const roleEl = document.getElementById('profileViewerRole');
  const mediaEl = document.getElementById('profileViewerMedia');

  const avatarImg = document.getElementById('profile-avatar');
  if (imgEl && avatarImg && avatarImg.getAttribute('src')) {
    imgEl.src = avatarImg.getAttribute('src');
  }

  const nameSrc = document.querySelector('.info-content .name');
  if (nameEl && nameSrc) nameEl.textContent = nameSrc.textContent || '';

  const roleSrc = document.querySelector('.info-content .title');
  if (roleEl && roleSrc) roleEl.textContent = roleSrc.textContent || '';

  const previousOverflow = document.body.dataset.prevOverflow;
  if (previousOverflow === undefined) {
    document.body.dataset.prevOverflow = document.body.style.overflow || '';
  }
  document.body.style.overflow = 'hidden';

  if (mediaEl && imgEl && !mediaEl.dataset.viewerBound) {
    let scale = 1;
    let tx = 0;
    let ty = 0;
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let startTx = 0;
    let startTy = 0;
    let lastTap = 0;

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    const getMaxOffset = () => {
      const rect = mediaEl.getBoundingClientRect();
      return (rect.width * (scale - 1)) / 2;
    };
    const applyTransform = () => {
      imgEl.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
    };
    const reset = () => {
      scale = 1;
      tx = 0;
      ty = 0;
      mediaEl.classList.remove('is-zoomed', 'is-dragging');
      applyTransform();
    };
    const toggleZoom = () => {
      if (scale === 1) {
        scale = 2.2;
        mediaEl.classList.add('is-zoomed');
        applyTransform();
        return;
      }
      reset();
    };

    const onPointerDown = (e) => {
      if (scale === 1) return;
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startTx = tx;
      startTy = ty;
      mediaEl.classList.add('is-dragging');
      mediaEl.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const maxOffset = getMaxOffset();
      tx = clamp(startTx + dx, -maxOffset, maxOffset);
      ty = clamp(startTy + dy, -maxOffset, maxOffset);
      applyTransform();
    };

    const onPointerUp = (e) => {
      if (!dragging) return;
      dragging = false;
      mediaEl.classList.remove('is-dragging');
      try {
        mediaEl.releasePointerCapture(e.pointerId);
      } catch {
      }
    };

    const onDoubleClick = (e) => {
      e.preventDefault();
      toggleZoom();
    };

    const onTouchEnd = () => {
      const now = Date.now();
      if (now - lastTap < 300) toggleZoom();
      lastTap = now;
    };

    mediaEl.addEventListener('dblclick', onDoubleClick);
    mediaEl.addEventListener('pointerdown', onPointerDown);
    mediaEl.addEventListener('pointermove', onPointerMove);
    mediaEl.addEventListener('pointerup', onPointerUp);
    mediaEl.addEventListener('pointercancel', onPointerUp);
    mediaEl.addEventListener('touchend', onTouchEnd, { passive: true });

    avatarModal.addEventListener('click', (e) => {
      if (e.target && e.target.id === 'avatar-overlay') reset();
    });

    mediaEl.dataset.viewerBound = 'true';
    mediaEl.dataset.viewerReset = 'true';
    mediaEl.dataset.viewerState = 'ready';
    mediaEl.resetViewer = reset;
  }

  if (mediaEl && mediaEl.resetViewer) {
    mediaEl.resetViewer();
  }

  if (!avatarModal.dataset.escBound) {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeAvatarModal();
    };
    avatarModal.dataset.escBound = 'true';
    document.addEventListener('keydown', onKeyDown);
    avatarModal.dataset.escHandler = 'true';
    avatarModal._escHandler = onKeyDown;
  }
}

function closeAvatarModal() {
  const avatarModal = document.getElementById('avatar-modal-container');
  const avatarOverlay = document.getElementById('avatar-overlay');
  if (avatarModal) avatarModal.classList.remove('active');
  if (avatarOverlay) avatarOverlay.classList.remove('active');

  const mediaEl = document.getElementById('profileViewerMedia');
  if (mediaEl && mediaEl.resetViewer) mediaEl.resetViewer();

  const prevOverflow = document.body.dataset.prevOverflow;
  if (prevOverflow !== undefined) {
    document.body.style.overflow = prevOverflow;
    delete document.body.dataset.prevOverflow;
  }

  if (avatarModal && avatarModal._escHandler) {
    document.removeEventListener('keydown', avatarModal._escHandler);
    delete avatarModal._escHandler;
    delete avatarModal.dataset.escBound;
  }
}

function openFullAvatarModal() {
  openAvatarModal();
}

function closeFullAvatarModal() {
  closeAvatarModal();
}

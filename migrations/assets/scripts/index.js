function scrollToTop() {
  // If already at top, show the logo overlay (user engaged scroll-top while at top)
  if ((window.scrollY || window.pageYOffset) === 0) {
    showLogoOverlay();
    return;
  }

  // Smooth scroll to top and show overlay once reached
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });

  // Wait until we reach the top then show overlay
  const onScrollHandler = () => {
    if ((window.scrollY || window.pageYOffset) === 0) {
      showLogoOverlay();
      window.removeEventListener('scroll', onScrollHandler);
    }
  };
  window.addEventListener('scroll', onScrollHandler, { passive: true });
}

function scrollToBottom() {
  const scrollTarget = Math.max(
    document.documentElement.scrollHeight,
    document.body.scrollHeight
  );

  window.scrollTo({
    top: scrollTarget,
    behavior: 'smooth'
  });
}

async function loadFragment(selector, url){
  try{
    const resp = await fetch(url);
    const text = await resp.text();
    const el = document.querySelector(selector);
    if(el) el.innerHTML = text;
    return text;
  }catch(e){ console.warn('Failed loading fragment', url, e); }
}

async function fetchIntoElement(element, url) {
  try {
    console.log('Fetching:', url, 'into element:', element.id);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const html = await response.text();
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    const fetchedMain = template.content.querySelector('main');

    if (fetchedMain && fetchedMain.id && fetchedMain.id === element.id) {
      Array.from(fetchedMain.attributes).forEach(attr => {
        if (attr.name.startsWith('data-') && !element.hasAttribute(attr.name)) {
          element.setAttribute(attr.name, attr.value);
        }
      });

      const fragment = document.createDocumentFragment();
      while (fetchedMain.firstChild) {
        fragment.appendChild(fetchedMain.firstChild);
      }

      element.replaceChildren(fragment);
    } else {
      element.innerHTML = html;
    }
    console.log('Successfully loaded:', url);
    return html;
  } catch (error) {
    console.error('Failed to fetch into element:', url, error);
    element.innerHTML = '<p>Error loading content</p>';
    throw error;
  }
}

// Map content sections to the stylesheets they require.
const CONTENT_STYLE_MAP = {
  'main-index': ['../../assets/styles/index.css'],
  'main-events': ['../../assets/styles/events.css', '../../assets/styles/calendar.css'],
  'main-billets': ['../../assets/styles/events.css'],
  'main-location': ['../../assets/styles/location.css'],
  'main-maps': ['../../assets/styles/location.css'],
  'container-strategies': ['../../assets/styles/strategies.css'],
  'main-calendar': ['../../assets/styles/calendar.css'],
  'main-mission': ['../../assets/styles/propos.css'],
  'main-equipe': ['../../assets/styles/propos.css'],
  'main-contact': ['../../assets/styles/propos.css'],
  'main-cpa': ['../../assets/styles/slideshow.css'],
  'main-familles': ['../../assets/styles/slideshow.css'],
  'main-feminin': ['../../assets/styles/slideshow.css'],
  'main-reservation': ['../../assets/styles/reservation.css'],
  'main-restaurant': ['../../assets/styles/restaurant.css']
};

function ensureStylesheet(href) {
  if (!href) return null;

  const absoluteHref = new URL(href, document.baseURI).href;
  const existing = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    .find(link => link.href === absoluteHref);

  if (existing) {
    return existing;
  }

  const linkEl = document.createElement('link');
  linkEl.rel = 'stylesheet';
  linkEl.href = href;
  linkEl.dataset.dynamicStyle = 'true';
  document.head.appendChild(linkEl);
  return linkEl;
}

function ensureContentStyles(contentId) {
  const styles = CONTENT_STYLE_MAP[contentId];
  if (!styles) return;
  styles.forEach(ensureStylesheet);
}

// Consolidated theme management - removed duplicate function

function setupLangToggle(){
  const btn = document.getElementById('langToggle');
  if(!btn) return;
  btn.addEventListener('click', ()=>{
    const doc = document.documentElement;
    const current = doc.getAttribute('data-current-language') || 'fr_CA';
    const next = current === 'fr_CA' ? 'en_US' : 'fr_CA';
    doc.setAttribute('data-current-language', next);
    // Swap visible texts by data-i18n attributes
    document.querySelectorAll('[data-i18n]').forEach(el=>{
      const key = el.getAttribute('data-i18n');
      const translations = JSON.parse(el.getAttribute('data-i18n-json')||'{}');
      if(translations[next]) el.innerHTML = translations[next];
    });

    const label = btn.querySelector('.lang-label');
    if (label) {
      label.textContent = next === 'fr_CA' ? 'FR' : 'EN';
    } else {
      btn.textContent = next === 'fr_CA' ? 'FR' : 'EN';
    }

    setLanguage(next);
  });
}

function initLanguage() {
    const savedLang = localStorage.getItem('language') || 'fr_CA';
    setLanguage(savedLang);

    // Note: Language toggle event listener is handled in navbar.js
}

function setLanguage(lang) {
    document.documentElement.setAttribute('data-current-language', lang);
    
    // Update all translatable elements
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const translations = JSON.parse(element.getAttribute('data-i18n-json') || '{}');
        if (translations[lang]) {
            element.textContent = translations[lang];
        }
    });
    
    // Update language toggle button
    const langToggle = document.getElementById('langToggle');
    if (langToggle) {
      const label = langToggle.querySelector('.lang-label');
      if (label) {
        label.textContent = lang === 'fr_CA' ? 'FR' : 'EN';
      } else {
        langToggle.textContent = lang === 'fr_CA' ? 'FR' : 'EN';
      }
    }
    
    localStorage.setItem('language', lang);
}

// Expose globally for navbar
window.setLanguage = setLanguage;

function initTheme() {
    // Default to dark theme if no saved preference
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);

    // Note: Theme toggle event listener is handled in navbar.js
}

function setTheme(theme) {
    // Set theme on document root
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
    
    // Update all theme-dependent elements
    updateLogo();
    updateNavbarLogo(theme);
    updateThemeIcons(theme);
    
    // Dispatch custom event for other components to react
    document.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
}

function updateNavbarLogo(theme) {
    const logoImg = document.querySelector('.site-logo .logo-image');
    if (logoImg) {
        const lightSrc = logoImg.getAttribute('data-light-src');
        const darkSrc = logoImg.getAttribute('data-dark-src');
        logoImg.src = theme === 'light' ? lightSrc : darkSrc;
    }
}

// Expose globally for navbar
window.setTheme = setTheme;

function updateThemeIcons(theme) {
    // Wait for navbar to be loaded before updating icons
    const updateIcons = () => {
        const lightIcons = document.querySelectorAll('.theme-icon.light');
        const darkIcons = document.querySelectorAll('.theme-icon.dark');

        if (theme === 'dark') {
            // In dark theme, show sun icon (to switch to light)
            lightIcons.forEach(icon => icon.style.display = 'inline');
            darkIcons.forEach(icon => icon.style.display = 'none');
        } else {
            // In light theme, show moon icon (to switch to dark)
            lightIcons.forEach(icon => icon.style.display = 'none');
            darkIcons.forEach(icon => icon.style.display = 'inline');
        }
    };

    // If navbar is already loaded, update immediately
    if (document.querySelector('.theme-icon')) {
        updateIcons();
    } else {
        // Wait for navbar to load
        document.addEventListener('global:loaded', updateIcons, { once: true });
    }
}

function updateLogoOverlays(theme) {
    const overlays = document.querySelectorAll('.logo-overlay');
    overlays.forEach(overlay => {
        const overlayTheme = overlay.getAttribute('data-theme');
        if (overlayTheme === theme) {
            overlay.style.display = '';
        } else {
            overlay.style.display = 'none';
        }
    });
}

function getOverlayElement() {
  return document.getElementById('main-overlay') || document.querySelector('.adv-overlay');
}

function markOverlayClosed() {
  localStorage.setItem('overlay-last-closed', new Date().toDateString());
}

function shouldDisplayOverlay(force = false) {
  if (force) return true;
  const today = new Date().toDateString();
  const lastClosed = localStorage.getItem('overlay-last-closed');
  return !lastClosed || lastClosed !== today;
}

function showAdOverlay(options = {}){
  const { force = false } = options;
  if (!shouldDisplayOverlay(force)) {
    console.log('Overlay skipped – already dismissed today');
    return;
  }

  const overlay = getOverlayElement();
  if(!overlay) return;

  overlay.classList.remove('inactive', 'hidden');
  overlay.classList.add('active');
  overlay.setAttribute('aria-hidden', 'false');
}

function hideAdOverlay(recordClose = false){
  const overlay = getOverlayElement();
  if(!overlay) return;

  overlay.classList.remove('active');
  overlay.classList.add('inactive');
  overlay.setAttribute('aria-hidden', 'true');

  if (recordClose) {
    markOverlayClosed();
  }

  // Activate container-index when ad overlay is closed
  const containerIndex = document.getElementById('container-index') || document.querySelector('.container-index');
  if (containerIndex) {
    containerIndex.classList.remove('inactive');
    containerIndex.classList.add('active');
  }
}

// Make overlay controls available globally for inline handlers or debugging
if (typeof window !== 'undefined') {
  window.showAdOverlay = showAdOverlay;
  window.hideAdOverlay = hideAdOverlay;
}

// Fallback delegated handlers to ensure overlay can close even if setup misses
document.addEventListener('click', (event) => {
  const closeButton = event.target.closest('.close-ad');
  if (closeButton) {
    event.preventDefault();
    hideAdOverlay(true);
    return;
  }

  if (event.target.classList.contains('backdrop') && event.target.closest('.adv-overlay')) {
    hideAdOverlay(true);
    return;
  }

  if (event.target.classList.contains('adv-overlay')) {
    hideAdOverlay(true);
  }
});

function setupAdOverlay(){
  const overlay = getOverlayElement();
  if (!overlay) return;

  const close = overlay.querySelector('.close-ad');
  const backdrop = overlay.querySelector('.backdrop');
  const adCard = overlay.querySelector('.ad-card');
  const adImage = overlay.querySelector('img');

  const safeHide = () => hideAdOverlay(true);

  if (adCard) {
    adCard.addEventListener('click', (e) => e.stopPropagation());
  }

  if(close) {
    close.addEventListener('click', (e) => {
      e.stopPropagation();
      safeHide();
    });
  }

  if(backdrop) {
    backdrop.addEventListener('click', safeHide);
  }

  if(overlay) {
    overlay.addEventListener('click', (e) => {
      if(e.target === overlay) {
        safeHide();
      }
    });
  }

  // ESC key to close overlay
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      safeHide();
    }
  });

}

// Get current theme
function getCurrentTheme() {
  return document.documentElement.getAttribute('data-theme') || 'light';
}

// Update logo based on theme
function updateLogo() {
  const theme = getCurrentTheme();
  const logoImg = document.querySelector('.site-logo img.theme-sensitive-logo');
  if (logoImg) {
    logoImg.src = theme === 'dark' 
      ? './assets/images/logos/arena-dark.png' 
      : './assets/images/logos/arena-light.png';
  }
}

// Full-screen logo on over-scroll
function setupLogoOverScroll() {
  let lastScrollY = window.scrollY;
  let scrollAttempts = 0;
  let overScrollTimer = null;

  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    
    // Check if user is at top and trying to scroll up
    if (currentScrollY === 0 && lastScrollY === 0) {
      scrollAttempts++;
      
      if (scrollAttempts >= 1) {
        showLogoOverlay();
        scrollAttempts = 0;
      }
      
      // Reset counter after a delay
      clearTimeout(overScrollTimer);
      overScrollTimer = setTimeout(() => {
        scrollAttempts = 0;
      }, 1000);
    } else {
      scrollAttempts = 0;
    }
    
    lastScrollY = currentScrollY;
  }, { passive: true });

  // Also detect wheel events at scroll top
  window.addEventListener('wheel', (e) => {
    if (window.scrollY === 0 && e.deltaY < 0) {
      showLogoOverlay();
    }
  }, { passive: true });

  // Touch events for mobile
  let touchStartY = 0;
  window.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (window.scrollY === 0) {
      const touchY = e.touches[0].clientY;
      if (touchY > touchStartY + 50) {
        showLogoOverlay();
      }
    }
  }, { passive: true });
}

// Idle timer: show logo overlay after user is inactive for 2 minutes
const IdleLogo = (function(){
  let idleTimeout = null;
  const IDLE_MS = 2 * 60 * 1000; // 2 minutes

  function showIfIdle() {
    showLogoOverlay();
  }

  function reset() {
    if (idleTimeout) clearTimeout(idleTimeout);
    idleTimeout = setTimeout(showIfIdle, IDLE_MS);
  }

  function start() {
    reset();
    // user interactions that cancel idle state
    ['mousemove','mousedown','keydown','touchstart','scroll'].forEach(evt => {
      window.addEventListener(evt, reset, { passive: true });
    });
  }

  function stop() {
    if (idleTimeout) clearTimeout(idleTimeout);
    idleTimeout = null;
  }

  return { start, stop, reset };
})();

function showLogoOverlay() {
  const theme = getCurrentTheme();
  const overlay = document.querySelector('.logo-overlay.theme-' + theme);
  if (overlay && !overlay.classList.contains('active')) {
    // Hide other theme overlay
    document.querySelectorAll('.logo-overlay').forEach(o => o.classList.remove('active'));
    
    overlay.classList.add('active');
    window.scrollLock.lock('logo-overlay');
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      hideLogoOverlay();
    }, 3000);
  }
}

// Expose globally for scroll system
window.showLogoOverlay = showLogoOverlay;

function hideLogoOverlay() {
  document.querySelectorAll('.logo-overlay').forEach(overlay => {
    overlay.classList.remove('active');
  });
  window.scrollLock.unlock('logo-overlay');
}

function setupLogoOverlayInteraction() {
  // Setup click handlers for logo overlays
  document.querySelectorAll('.logo-overlay').forEach(overlay => {
    const backdrop = overlay.querySelector('.logo-overlay-backdrop');
    const logoImage = overlay.querySelector('.logo-overlay-image');
    
    // Click on backdrop to close
    if (backdrop) {
      backdrop.addEventListener('click', hideLogoOverlay);
    }
    
    // Click on logo to navigate to bourse.html
    if (logoImage) {
      logoImage.addEventListener('click', (e) => {
        e.stopPropagation();
        window.open('https://blewup.github.io/arena-lareau/bourse.html', '_blank');
        hideLogoOverlay();
      });
    }
    
    // Click anywhere on overlay container to close
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        hideLogoOverlay();
      }
    });
  });
  
  // ESC key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideLogoOverlay();
    }
  });
}

// Navigation manager
class NavigationManager {
    constructor() {
        this.activeContent = null;
        this.init();
    }

    init() {
        // Handle navigation clicks
        document.addEventListener('click', (e) => {
            const navLink = e.target.closest('.nav-links a');
            if (navLink) {
                e.preventDefault();
                const target = navLink.getAttribute('data-target');
                const isNewTab = navLink.hasAttribute('data-new-tab');
                
                if (isNewTab) {
                    window.open(navLink.href, '_blank');
                } else if (target) {
                  this.activateContent(target);
                }
            }
        });
    }

    activateContent(contentId) {
        // Deactivate all content sections (except navbar and footer)
        document.querySelectorAll('.main:not(.main-navbar):not(.main-footer)').forEach(section => {
            section.classList.remove('active');
            section.classList.add('inactive');
        });

        // Activate new content
        const newContent = document.getElementById(contentId);
        if (newContent && !newContent.classList.contains('main-navbar') && !newContent.classList.contains('main-footer')) {
            newContent.classList.remove('inactive');
            newContent.classList.add('active');
            this.activeContent = newContent;
            ensureContentStyles(contentId);
            this.setActiveNavLinks(contentId);

            // Scroll to top
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });

            // Check if we should show footer map (when content is empty or minimal)
            this.updateFooterMapVisibility();

            // Dispatch content changed event for components that need to reinitialize
            document.dispatchEvent(new CustomEvent('contentChanged', { 
                detail: { contentId: contentId, element: newContent } 
            }));
        }
    }

    updateFooterMapVisibility() {
        const footer = document.querySelector('.main-footer');
        const activeContent = document.querySelector('.main.active:not(.main-navbar):not(.main-footer)');
        
        // Show map only if no active content or content is very small
        if (!activeContent || activeContent.offsetHeight < 100) {
            footer?.classList.add('show-map');
        } else {
            footer?.classList.remove('show-map');
        }
    }

    setActiveNavLinks(contentId) {
        const selectors = [
            '.nav-links a',
            '.dropdown-item',
            '.mobile-dropdown-item',
            '.sidebar-link'
        ];

        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(link => {
                const target = link.getAttribute('data-target');
                const isActive = target === contentId;
                link.classList.toggle('active', isActive);
            });
        });

        const aboutTargets = ['main-mission', 'main-equipe', 'main-contact'];
        const dropdownTrigger = document.querySelector('.dropdown-trigger');
        if (dropdownTrigger) {
            dropdownTrigger.classList.toggle('active', aboutTargets.includes(contentId));
        }
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM Content Loaded - Starting initialization');

  // Initialize navigation manager
  window.navManager = new NavigationManager();

  // Load all main content sections with src attribute
  const loadPromises = [];

  const scrollTopBtn = document.getElementById('scrollTopBtn');
  const scrollBottomBtn = document.getElementById('scrollBottomBtn');
  if (scrollTopBtn && scrollBottomBtn) {

    // Show/hide buttons based on scroll position
    window.onscroll = () => {
        // Show "scroll to top" button if not at the top
        if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
            scrollTopBtn.style.display = "flex";
        } else {
            scrollTopBtn.style.display = "none";
        }

        // Show "scroll to bottom" button if not at the bottom
        // (Calculates if scroll position is near the bottom)
        if ((window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 200)) {
            scrollBottomBtn.style.display = "none";
        } else {
            scrollBottomBtn.style.display = "flex";
        }
    };
    // Click event for "Scroll to Top"
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    // Click event for "Scroll to Bottom"
    scrollBottomBtn.addEventListener('click', () => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    });
  }

  // Load navbar and footer (always active)
  const navbarEl = document.querySelector('main.main-navbar[src]');
  console.log('Navbar element:', navbarEl);
  if (navbarEl) {
    const src = navbarEl.getAttribute('src');
    console.log('Loading navbar from:', src);
    navbarEl.removeAttribute('src');
    loadPromises.push(
      fetchIntoElement(navbarEl, new URL(src, location.href).href)
    );
  }

  const footerEl = document.querySelector('main.main-footer[src]');
  console.log('Footer element:', footerEl);
  if (footerEl) {
    const src = footerEl.getAttribute('src');
    console.log('Loading footer from:', src);
    footerEl.removeAttribute('src');
    loadPromises.push(
      fetchIntoElement(footerEl, new URL(src, location.href).href)
    );
  }

  // Load all other main content sections
  const contentSections = document.querySelectorAll('main.main:not(.main-navbar):not(.main-footer)[src]');
  console.log('Found content sections:', contentSections.length);
  contentSections.forEach(mainEl => {
    const src = mainEl.getAttribute('src');
    if (src) {
      console.log('Loading content from:', src, 'into', mainEl.id);
      mainEl.removeAttribute('src');
      loadPromises.push(
        fetchIntoElement(mainEl, new URL(src, location.href).href)
      );
    }
  });

  // Wait for all content to load
  console.log('Waiting for', loadPromises.length, 'content sections to load');
  await Promise.all(loadPromises);
  console.log('All content loaded');

  // Ensure navbar and footer are always active
  const navbar = document.querySelector('.main-navbar');
  const footer = document.querySelector('.main-footer');
  if (navbar) {
    navbar.classList.add('active');
    navbar.classList.remove('inactive');
  }
  if (footer) {
    footer.classList.add('active');
    footer.classList.remove('inactive');
  }

  // Ensure only main-index is active initially (excluding navbar and footer)
  document.querySelectorAll('.main:not(.main-navbar):not(.main-footer)').forEach(section => {
    if (section.id === 'main-index') {
      section.classList.add('active');
      section.classList.remove('inactive');
    } else {
      section.classList.remove('active');
      section.classList.add('inactive');
    }
  });

  ensureContentStyles('main-index');

  // Update footer map visibility
  if (window.navManager) {
    window.navManager.setActiveNavLinks('main-index');
    window.navManager.updateFooterMapVisibility();
  }

  const navigateToTarget = (targetId) => {
    if (!targetId) return;
    if (window.navManager && typeof window.navManager.activateContent === 'function') {
      window.navManager.activateContent(targetId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const targetEl = document.getElementById(targetId);
    if (!targetEl) return;

    const contentSections = document.querySelectorAll('.main:not(.main-navbar):not(.main-footer)');
    contentSections.forEach(section => {
      if (section === targetEl) {
        section.classList.add('active');
        section.classList.remove('inactive');
      } else {
        section.classList.remove('active');
        section.classList.add('inactive');
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Setup navigation for any element with data-target
  document.addEventListener('click', (e) => {
    const activator = e.target.closest('[data-target]');
    if (!activator) return;

    const targetId = activator.getAttribute('data-target');
    if (!targetId) return;

    // Avoid default navigation if activator is a link
    if (activator.tagName === 'A') {
      e.preventDefault();
    }

    navigateToTarget(targetId);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const activator = e.target.closest('[data-target]');
    if (!activator) return;

    const targetId = activator.getAttribute('data-target');
    if (!targetId) return;

    e.preventDefault();
    navigateToTarget(targetId);
  });

  // Signal that global includes are loaded
  try { 
    document.dispatchEvent(new Event('global:loaded')); 
  } catch(e) { 
    console.warn('Event dispatch failed:', e); 
  }

  // Update theme icons after navbar loads
  const currentTheme = getCurrentTheme();
  updateThemeIcons(currentTheme);

  // Initialize theme FIRST before any UI rendering
  initTheme();
  initLanguage();
  
  // Initialize UI components
  setupLangToggle();
  setupAdOverlay();

  // Setup logo over-scroll and idle behavior
  try { setupLogoOverScroll(); } catch(e){ console.warn('setupLogoOverScroll failed', e); }
  try { IdleLogo.start(); } catch(e){ console.warn('IdleLogo failed to start', e); }
  try { setupLogoOverlayInteraction(); } catch(e){ console.warn('setupLogoOverlayInteraction failed', e); }
  
  // Update logo after content loads
  updateLogo();
  
  // Show ad overlay immediately (no cache, always display)
  setTimeout(() => {
    showAdOverlay();
  }, 500);
});

// Initialize footer calendars for ice rental dates
function initFooterCalendars() {
  const locationDateElement = document.getElementById('location');
  if (locationDateElement) {
    locationDateElement.addEventListener('click', () => {
      showIceRentalCalendars();
    });
  }
}

// Show ice rental calendars modal
function showIceRentalCalendars() {
  // Create modal overlay
  const modal = document.createElement('div');
  modal.className = 'calendar-modal-overlay';
  modal.innerHTML = `
    <div class="calendar-modal">
      <button class="calendar-modal-close" aria-label="Fermer">&times;</button>
      <h2>Disponibilit\u00e9 de location de glace</h2>
      <div class="calendar-grid">
        <div class="calendar-container">
          <div id="calendar-month-1"></div>
        </div>
        <div class="calendar-container">
          <div id="calendar-month-2"></div>
        </div>
      </div>
      <div class="calendar-legend">
        <div class="legend-item">
          <span class="legend-box vacant"></span>
          <span>Disponible (9h-16h)</span>
        </div>
        <div class="legend-item">
          <span class="legend-box taken"></span>
          <span>R\u00e9serv\u00e9 (7h-9h, 16h-00h)</span>
        </div>
        <div class="legend-item">
          <span class="legend-box weekend"></span>
          <span>Fin de semaine (r\u00e9serv\u00e9)</span>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Close modal handlers
  const closeBtn = modal.querySelector('.calendar-modal-close');
  closeBtn.addEventListener('click', () => {
    modal.remove();
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });

  // Initialize calendars
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  
  new IceRentalCalendar('calendar-month-1', today);
  new IceRentalCalendar('calendar-month-2', nextMonth);
}

// Ice Rental Calendar Class
class IceRentalCalendar {
  constructor(containerId, date) {
    this.container = document.getElementById(containerId);
    this.currentDate = new Date(date);
    this.init();
  }

  init() {
    this.render();
  }

  render() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let html = `
      <div class="calendar-header">
        <h3>${this.getMonthYearString()}</h3>
      </div>
      <div class="calendar-weekdays">
        <div>Dim</div><div>Lun</div><div>Mar</div><div>Mer</div>
        <div>Jeu</div><div>Ven</div><div>Sam</div>
      </div>
      <div class="calendar-days">
    `;

    // Add blank days before first day of month
    for (let i = 0; i < firstDay.getDay(); i++) {
      html += '<div class="calendar-day blank"></div>';
    }

    // Add days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      const availability = this.getAvailability(date);
      
      html += `
        <div class="calendar-day ${availability.class}" title="${availability.title}">
          <div class="day-number">${day}</div>
          <div class="time-windows">
            ${availability.windows.map(w => `
              <div class="time-window ${w.type}">${w.time}</div>
            `).join('')}
          </div>
        </div>
      `;
    }

    html += '</div>';
    this.container.innerHTML = html;
  }

  getAvailability(date) {
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (isWeekend) {
      return {
        class: 'weekend',
        title: 'Fin de semaine - R\u00e9serv\u00e9 (7h-00h)',
        windows: [
          { type: 'taken', time: '7h-00h' }
        ]
      };
    }

    // Weekday schedule
    return {
      class: 'weekday',
      title: 'Semaine - Voir cr\u00e9neaux',
      windows: [
        { type: 'taken', time: '7h-9h' },
        { type: 'vacant', time: '9h-16h' },
        { type: 'taken', time: '16h-00h' }
      ]
    };
  }

  getMonthYearString() {
    return this.currentDate.toLocaleDateString('fr-CA', {
      month: 'long',
      year: 'numeric'
    });
  }
}

// Form Data Cache Management
class FormDataCache {
  constructor() {
    this.prefix = 'form_cache_';
  }

  // Save form data to localStorage
  saveFormData(formId, data) {
    try {
      const key = this.prefix + formId;
      localStorage.setItem(key, JSON.stringify({
        data: data,
        timestamp: Date.now()
      }));
      console.log(`Form data saved for: ${formId}`);
    } catch (e) {
      console.warn('Failed to save form data:', e);
    }
  }

  // Load form data from localStorage
  loadFormData(formId) {
    try {
      const key = this.prefix + formId;
      const cached = localStorage.getItem(key);
      if (cached) {
        const parsed = JSON.parse(cached);
        console.log(`Form data loaded for: ${formId}`);
        return parsed.data;
      }
    } catch (e) {
      console.warn('Failed to load form data:', e);
    }
    return null;
  }

  // Clear specific form data
  clearFormData(formId) {
    try {
      const key = this.prefix + formId;
      localStorage.removeItem(key);
      console.log(`Form data cleared for: ${formId}`);
    } catch (e) {
      console.warn('Failed to clear form data:', e);
    }
  }

  // Auto-save form on input change
  setupAutoSave(formElement, formId) {
    if (!formElement) return;

    const saveData = () => {
      const formData = new FormData(formElement);
      const data = {};
      for (let [key, value] of formData.entries()) {
        data[key] = value;
      }
      this.saveFormData(formId, data);
    };

    // Save on input/change events
    formElement.addEventListener('input', saveData);
    formElement.addEventListener('change', saveData);

    // Load saved data on initialization
    const savedData = this.loadFormData(formId);
    if (savedData) {
      Object.keys(savedData).forEach(key => {
        const field = formElement.elements[key];
        if (field) {
          if (field.type === 'checkbox' || field.type === 'radio') {
            field.checked = savedData[key] === 'on' || savedData[key] === field.value;
          } else {
            field.value = savedData[key];
          }
        }
      });
    }
  }

  // Clear all form caches (useful for logout/reset)
  clearAllFormData() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
      console.log('All form data cleared');
    } catch (e) {
      console.warn('Failed to clear all form data:', e);
    }
  }
}

// Initialize global form cache manager
window.formCache = new FormDataCache();

// Auto-setup form caching for all forms with data-cache-form attribute
function initializeFormCaching() {
  const forms = document.querySelectorAll('form[data-cache-form]');
  forms.forEach(form => {
    const formId = form.id || form.getAttribute('data-cache-form');
    if (formId) {
      window.formCache.setupAutoSave(form, formId);
      console.log(`Auto-save enabled for form: ${formId}`);
    }
  });
  
  // Also setup forms without data-cache-form but with IDs
  const formsWithIds = document.querySelectorAll('form[id]:not([data-cache-form])');
  formsWithIds.forEach(form => {
    const formId = form.id;
    if (formId) {
      window.formCache.setupAutoSave(form, formId);
      console.log(`Auto-save enabled for form: ${formId}`);
    }
  });
}

// Global function to refresh form caching setup
window.refreshFormCaching = initializeFormCaching;

// Initialize form caching when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Wait a bit for forms to be loaded via AJAX
  setTimeout(initializeFormCaching, 1000);
});

// Re-initialize when new content is loaded
document.addEventListener('contentLoaded', initializeFormCaching);
document.addEventListener('global:loaded', initializeFormCaching);

console.log('index.js loaded - Theme system and form cache initialized');
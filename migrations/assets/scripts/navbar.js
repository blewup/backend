document.addEventListener('global:loaded', () => {
  // --- 1. Element Selectors ---
  const body = document.body;

  // Sidebar elements
  const sidebarToggle = document.querySelector('.sidebar-toggle-btn');
  const mainSidebar = document.getElementById('main-sidebar');
  const sidebarLabel = document.getElementById('sidebar-icon');
  const sidebarLinks = document.querySelectorAll('.sidebar-link');

  // Dropdown elements
  const dropdownTrigger = document.querySelector('.dropdown-trigger');
  const dropdownContent = document.querySelector('.dropdown-content');
  const dropdownItems = document.querySelectorAll('.dropdown-item');

  // Mobile elements
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const mobileDropdownContent = document.querySelector('.mobile-dropdown-content');
  const mobileDropdownItems = document.querySelectorAll('.mobile-dropdown-item');

  // Toggles
  const langToggle = document.getElementById('langToggle');
  const themeToggle = document.getElementById('themeToggle');

  // State tracking
  let activeSidebarItem = null;
  let sidebarOpen = false;
  let dropdownOpen = false;
  let autoCloseTimer = null;

  const slideshowTargets = new Set(['main-cpa', 'main-familles', 'main-feminin']);

  // Auto-close timer functions
  const resetAutoCloseTimer = () => {
    clearTimeout(autoCloseTimer);
    if (!sidebarOpen && !dropdownOpen) {
      return;
    }
    autoCloseTimer = setTimeout(() => {
      closeSidebar();
      closeDropdown();
    }, 60000); // 60s
  };

  const stopAutoCloseTimerIfIdle = () => {
    if (!sidebarOpen && !dropdownOpen) {
      clearTimeout(autoCloseTimer);
      autoCloseTimer = null;
    }
  };

  // --- 2. Sidebar Logic ---
  const applySidebarState = (isOpen) => {
    sidebarOpen = isOpen;
    if (mainSidebar) {
      mainSidebar.classList.toggle('active', isOpen);
      mainSidebar.classList.toggle('inactive', !isOpen);
      mainSidebar.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    }
    if (sidebarToggle) {
      sidebarToggle.classList.toggle('active', isOpen);
      sidebarToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }
    if (sidebarLabel) {
      sidebarLabel.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }
  };

  const positionSidebar = () => {
    if (!mainSidebar) {
      return;
    }
    mainSidebar.style.setProperty('--sidebar-top', '16vh');
    const navbar = document.querySelector('.navbar');
    if (navbar) {
      const rect = navbar.getBoundingClientRect();
      const leftOffset = Math.max(rect.left, 12);
      mainSidebar.style.setProperty('--sidebar-left', `${leftOffset}px`);
    } else {
      mainSidebar.style.setProperty('--sidebar-left', '8vw');
    }
  };

  const openSidebar = () => {
    if (sidebarOpen) {
      resetAutoCloseTimer();
      return;
    }
    if (dropdownOpen) {
      closeDropdown();
    }
    positionSidebar();
    applySidebarState(true);
    resetAutoCloseTimer();
  };

  const closeSidebar = () => {
    if (!sidebarOpen) {
      return;
    }
    applySidebarState(false);
    stopAutoCloseTimerIfIdle();
  };

  const toggleSidebar = () => {
    if (sidebarOpen) {
      closeSidebar();
    } else {
      openSidebar();
    }
  };

  if (mainSidebar) {
    const sidebarParent = mainSidebar.parentElement;
    if (sidebarParent && sidebarParent !== document.body) {
      const placeholder = document.createElement('aside');
      placeholder.className = 'sidebar-anchor-placeholder';
      placeholder.setAttribute('aria-hidden', 'true');
      sidebarParent.replaceChild(placeholder, mainSidebar);
      document.body.appendChild(mainSidebar);
      mainSidebar.classList.add('sidebar-portal');
      mainSidebar.setAttribute('data-portal', 'true');
    }

    applySidebarState(false);
    positionSidebar();
  }

  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSidebar();
    });
  }

  // Handle sidebar link clicks
  sidebarLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();

      // Update active state
      sidebarLinks.forEach(l => l.classList.remove('active'));
      this.classList.add('active');
      activeSidebarItem = this;

      // Handle navigation
      const targetId = this.getAttribute('data-target');
      navigateToSection(targetId);

      resetAutoCloseTimer();

      // Keep sidebar open if item is active
      // Sidebar stays open when item is selected
    });
  });

  // --- 3. Dropdown Logic ---
  const positionDropdown = () => {
    if (!dropdownContent) {
      return;
    }
    dropdownContent.style.setProperty('--dropdown-top', '16vh');
    const navbar = document.querySelector('.navbar');
    if (navbar) {
      const rect = navbar.getBoundingClientRect();
      const rightOffset = Math.max(window.innerWidth - rect.right, 12);
      dropdownContent.style.setProperty('--dropdown-right', `${rightOffset}px`);
    } else {
      dropdownContent.style.setProperty('--dropdown-right', '8vw');
    }
    dropdownContent.style.setProperty('--dropdown-width', 'max-content');
  };

  const applyDropdownState = (isOpen) => {
    dropdownOpen = isOpen;
    if (dropdownContent) {
      dropdownContent.classList.toggle('active', isOpen);
      dropdownContent.classList.toggle('inactive', !isOpen);
      dropdownContent.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    }
    if (dropdownTrigger) {
      dropdownTrigger.classList.toggle('active', isOpen);
      dropdownTrigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }
  };

  const openDropdown = () => {
    if (dropdownOpen) {
      resetAutoCloseTimer();
      return;
    }
    closeSidebar();
    positionDropdown();
    applyDropdownState(true);
    resetAutoCloseTimer();
  };

  const closeDropdown = () => {
    if (!dropdownOpen) {
      return;
    }
    applyDropdownState(false);
    stopAutoCloseTimerIfIdle();
  };

  const toggleDropdown = () => {
    if (dropdownOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  };

  if (dropdownContent) {
    const dropdownParent = dropdownContent.parentElement;
    if (dropdownParent && dropdownParent !== document.body) {
      const placeholder = document.createElement('div');
      placeholder.className = 'dropdown-anchor-placeholder';
      dropdownParent.replaceChild(placeholder, dropdownContent);
      document.body.appendChild(dropdownContent);
      dropdownContent.classList.add('dropdown-portal');
      dropdownContent.setAttribute('data-portal', 'true');
    }

    applyDropdownState(false);
    positionDropdown();
  }

  if (dropdownTrigger) {
    dropdownTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDropdown();
      resetAutoCloseTimer();
    });

    dropdownTrigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleDropdown();
        resetAutoCloseTimer();
      }
    });
  }

  if (dropdownContent) {
    dropdownContent.addEventListener('mouseenter', resetAutoCloseTimer);
    dropdownContent.addEventListener('mouseleave', resetAutoCloseTimer);
  }

  const handleViewportChange = () => {
    positionDropdown();
    positionSidebar();
  };

  window.addEventListener('resize', handleViewportChange);
  window.addEventListener('scroll', handleViewportChange, { passive: true });

  // --- 4. Mobile Menu Logic ---
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      // Close other menus
      if (sidebarOpen) {
        closeSidebar();
      }
      if (dropdownOpen) {
        closeDropdown();
      }

      // Toggle mobile menu
      mobileMenuToggle.classList.toggle('active');
      if (mobileDropdownContent) {
        mobileDropdownContent.classList.toggle('active');
      }
    });
  }

  // Handle mobile dropdown item clicks
  mobileDropdownItems.forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();

      // Update active state
      mobileDropdownItems.forEach(i => i.classList.remove('active'));
      this.classList.add('active');

      // Handle navigation
      const targetId = this.getAttribute('data-target');
      navigateToSection(targetId);

      // Close mobile menu
      mobileMenuToggle.classList.remove('active');
      if (mobileDropdownContent) {
        mobileDropdownContent.classList.remove('active');
      }
    });
  });

  const highlightSidebarItem = (targetId) => {
    let matchedLink = null;
    sidebarLinks.forEach(link => {
      const isMatch = link.getAttribute('data-target') === targetId;
      link.classList.toggle('active', isMatch);
      if (isMatch) {
        matchedLink = link;
      }
    });
    if (matchedLink) {
      activeSidebarItem = matchedLink;
    }
  };

  const handleSlideshowActivation = (targetId) => {
    if (!slideshowTargets.has(targetId)) {
      return;
    }
    openSidebar();
    highlightSidebarItem(targetId);
  };

  // --- 5. Navigation Function ---
  const navigateToSection = (targetId) => {
    console.log('navigateToSection called with:', targetId);

    // Use the main navigation manager if available
    if (window.navManager && window.navManager.activateContent) {
      console.log('Using navManager.activateContent');
      window.navManager.activateContent(targetId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      console.log('Using fallback direct manipulation');
      // Fallback to direct manipulation
      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        console.log('Found target section:', targetSection);
        // Hide all main sections
        document.querySelectorAll('.main:not(.main-navbar):not(.main-footer)').forEach(section => {
          section.classList.remove('active');
          section.classList.add('inactive');
        });

        // Show target section
        targetSection.classList.remove('inactive');
        targetSection.classList.add('active');
        console.log('Active class added to:', targetId, 'Classes now:', targetSection.className);

        if (typeof ensureContentStyles === 'function') {
          ensureContentStyles(targetId);
        }

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        console.log('Target section not found:', targetId);
      }
    }

    handleSlideshowActivation(targetId);
    return false;
  };

  // --- 6. Language Toggle Logic ---
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      const currentLang = document.documentElement.getAttribute('data-current-language') || 'fr_CA';
      const newLang = currentLang === 'fr_CA' ? 'en_US' : 'fr_CA';

      // Toggle all fr_CA elements
      document.querySelectorAll('.fr_CA').forEach(el => {
        if (newLang === 'fr_CA') {
          el.classList.remove('inactive');
          el.classList.add('active');
        } else {
          el.classList.remove('active');
          el.classList.add('inactive');
        }
      });

      // Toggle all en_US elements
      document.querySelectorAll('.en_US').forEach(el => {
        if (newLang === 'en_US') {
          el.classList.remove('inactive');
          el.classList.add('active');
        } else {
          el.classList.remove('active');
          el.classList.add('inactive');
        }
      });

      if (window.setLanguage) {
        window.setLanguage(newLang);
      } else {
        // Fallback if global function not available
        document.documentElement.setAttribute('data-current-language', newLang);
        body.setAttribute('data-language', newLang);
        const label = langToggle.querySelector('.lang-label');
        if (label) {
          label.textContent = newLang === 'fr_CA' ? 'FR' : 'EN';
        } else {
          langToggle.textContent = newLang === 'fr_CA' ? 'FR' : 'EN';
        }
        translatePage(newLang);
        localStorage.setItem('language', newLang);
      }

      // Dispatch event for other scripts to update
      window.dispatchEvent(new CustomEvent('languageChange', { detail: { language: newLang } }));
    });
  }

  // --- 7. Theme Toggle Logic ---
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';

      // Use the global theme system from index.js
      if (window.setTheme) {
        window.setTheme(newTheme);
      } else {
        // Fallback if global function not available
        document.documentElement.setAttribute('data-theme', newTheme);
        body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
      }

      // Dispatch event for other scripts
      window.dispatchEvent(new CustomEvent('themeChange', { detail: { theme: newTheme } }));
    });
  }

  // --- 8. Translation Function ---
  function translatePage(lang) {
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const jsonData = element.getAttribute('data-i18n-json');

      if (jsonData) {
        try {
          const translations = JSON.parse(jsonData);
          if (translations[lang]) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
              element.placeholder = translations[lang];
            } else {
              element.textContent = translations[lang];
            }
          }
        } catch (e) {
          console.warn('Translation parse error:', e);
        }
      }
    });
  }

  // --- 9. Load Saved Preferences ---
  const currentLang = document.documentElement.getAttribute('data-current-language') || 'fr_CA';
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';

  if (langToggle) {
    const label = langToggle.querySelector('.lang-label');
    if (label) {
      label.textContent = currentLang === 'fr_CA' ? 'FR' : 'EN';
    } else {
      langToggle.textContent = currentLang === 'fr_CA' ? 'FR' : 'EN';
    }
  }

  // Initialize language classes on page load
  document.querySelectorAll('.fr_CA').forEach(el => {
    if (currentLang === 'fr_CA') {
      el.classList.remove('inactive');
      el.classList.add('active');
    } else {
      el.classList.remove('active');
      el.classList.add('inactive');
    }
  });

  document.querySelectorAll('.en_US').forEach(el => {
    if (currentLang === 'en_US') {
      el.classList.remove('inactive');
      el.classList.add('active');
    } else {
      el.classList.remove('active');
      el.classList.add('inactive');
    }
  });

  // Ensure page translation matches current language
  translatePage(currentLang);

  // --- 10. Initialize Default Menu States ---
  // Menus start closed, open on click or hover
  // Set first sidebar item (Galeries) as active by default
  const firstSidebarLink = document.querySelector('.sidebar-link[data-target="main-cpa"]');
  if (firstSidebarLink && !activeSidebarItem) {
    sidebarLinks.forEach(l => l.classList.remove('active'));
    firstSidebarLink.classList.add('active');
    activeSidebarItem = firstSidebarLink;
  }

  // Start auto-close timer (but since menus are closed, it will close nothing)
  resetAutoCloseTimer();

  // --- 11. Click Outside to Close Menus ---
  window.addEventListener('click', (e) => {
    const clickedOutsideMenus = (!mainSidebar?.contains(e.target) && !sidebarToggle?.contains(e.target) &&
                                !dropdownContent?.contains(e.target) && !dropdownTrigger?.contains(e.target));

    if (clickedOutsideMenus) {
      closeSidebar();
      closeDropdown();
    }
  });

  // Track user interaction with navbar
  const trackUserInteraction = () => {
    localStorage.setItem('navbar_user_interacted', 'true');
  };

  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', trackUserInteraction);
  }
  if (dropdownTrigger) {
    dropdownTrigger.addEventListener('click', trackUserInteraction);
  }
  sidebarLinks.forEach(link => {
    link.addEventListener('click', trackUserInteraction);
  });
  dropdownItems.forEach(item => {
    item.addEventListener('click', trackUserInteraction);
  });

  // --- 12. Handle Main Navigation Links ---
  document.querySelectorAll('.menuitem a[data-target]').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();

      // Clear active states
      sidebarLinks.forEach(l => l.classList.remove('active'));
      dropdownItems.forEach(i => i.classList.remove('active'));
      mobileDropdownItems.forEach(i => i.classList.remove('active'));
      activeSidebarItem = null;

      // Close menus
      closeSidebar();
      closeDropdown();

      const targetId = this.getAttribute('data-target');
      navigateToSection(targetId);
    });
  });

  // --- 13. Expose functions globally ---
  window.toggleSidebar = toggleSidebar;
  window.toggleDropdown = toggleDropdown;
  window.navigateToSection = navigateToSection;
});
/**
 * ========================================
 * OVERLAY.JS - Complete Overlay Management System
 * Manages all overlays: ad overlay, scroll-to-top logo overlay
 * ========================================
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        scrollThreshold: 300,
        adDisplayDelay: 3000,
        adShowInterval: 60000,
        lastAdShown: null
    };

    // Store timeout and interval references for cleanup
    let adDisplayTimeout = null;
    let logoAutoHideTimeout = null;
    let scrollTimeout = null;
    let isScrollingUp = false;

    function init() {
        console.log('Initializing overlay system...');

        // Initialize ad overlay
        initAdOverlay();

        // Initialize scroll-to-top logo overlay
        initScrollLogoOverlay();

        // Initialize scroll buttons
        initScrollButtons();

        console.log('Overlay system initialized');
    }

    /**
     * Initialize advertisement overlay
     */
    function initAdOverlay() {
        const overlay = document.querySelector('.adv-overlay');
        const closeBtn = overlay?.querySelector('.close-ad');

        if (!overlay) {
            console.warn('Ad overlay element not found');
            return;
        }

        // Show ad after delay (only once on page load)
        adDisplayTimeout = setTimeout(() => {
            showAdOverlay();
        }, CONFIG.adDisplayDelay);

        // Close button handler
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                hideAdOverlay();
            });
        }

        // Close on backdrop click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay || e.target.classList.contains('backdrop')) {
                hideAdOverlay();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && overlay.classList.contains('active')) {
                hideAdOverlay();
            }
        });

        console.log('Ad overlay initialized');
    }

    /**
     * Show ad overlay
     */
    function showAdOverlay() {
        const overlay = document.querySelector('.adv-overlay');
        if (!overlay) return;

        overlay.classList.remove('inactive', 'hidden');
        overlay.classList.add('active', 'visible');
        document.body.style.overflow = 'hidden';

        CONFIG.lastAdShown = Date.now();

        console.log('Ad overlay shown');
    }

    /**
     * Hide ad overlay
     */
    function hideAdOverlay() {
        const overlay = document.querySelector('.adv-overlay');
        if (!overlay) return;

        // Clear any pending timeouts
        if (adDisplayTimeout) {
            clearTimeout(adDisplayTimeout);
            adDisplayTimeout = null;
        }

        overlay.classList.remove('active', 'visible');
        overlay.classList.add('inactive', 'hidden');
        document.body.style.overflow = '';

        console.log('Ad overlay hidden');
    }

    /**
     * Initialize scroll-to-top logo overlay
     */
    function initScrollLogoOverlay() {
        const lightOverlay = document.querySelector('.logo-overlay.light');
        const darkOverlay = document.querySelector('.logo-overlay.dark');

        if (!lightOverlay && !darkOverlay) {
            console.warn('Logo overlay elements not found');
            return;
        }

        // Add click handlers
        [lightOverlay, darkOverlay].forEach(overlay => {
            if (!overlay) return;

            const image = overlay.querySelector('.logo-overlay-image');
            if (image) {
                image.addEventListener('click', scrollToTop);
            }

            // Close on backdrop click
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay || e.target.classList.contains('logo-overlay-backdrop')) {
                    hideLogoOverlay();
                }
            });
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const activeOverlay = document.querySelector('.logo-overlay.active');
                if (activeOverlay) {
                    hideLogoOverlay();
                }
            }
        });

        // Monitor scroll position
        window.addEventListener('scroll', () => {
            if (scrollTimeout) {
                clearTimeout(scrollTimeout);
            }
            scrollTimeout = setTimeout(() => {
                handleScrollPosition();
            }, 100);
        });

        // Detect scroll-up attempt at top to show logo overlay
        let lastScrollTop = 0;
        let isScrollingUp = false;

        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            isScrollingUp = scrollTop < lastScrollTop;
            lastScrollTop = scrollTop;
        }, { passive: true });

        window.addEventListener('wheel', (e) => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

            // Only show logo if at absolute top (0) and trying to scroll up
            if (scrollTop === 0 && e.deltaY < 0) {
                showLogoOverlay();
                // Auto-hide after 3 seconds
                if (logoAutoHideTimeout) {
                    clearTimeout(logoAutoHideTimeout);
                }
                logoAutoHideTimeout = setTimeout(() => {
                    hideLogoOverlay();
                }, 3000);
            }
        }, { passive: true });

        console.log('Scroll logo overlay initialized');
    }

    /**
     * Handle scroll position to show/hide logo overlay
     * Logo shows only when attempting to scroll beyond top (over-scroll at position 0)
     */
    function handleScrollPosition() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // Hide logo overlay if user scrolls down from top
        if (scrollTop > 0) {
            hideLogoOverlay();
        }
        // Show logo overlay if at top and scrolling up
        else if (scrollTop === 0 && isScrollingUp) {
            showLogoOverlay();
            // Auto-hide after 3 seconds
            if (logoAutoHideTimeout) {
                clearTimeout(logoAutoHideTimeout);
            }
            logoAutoHideTimeout = setTimeout(() => {
                hideLogoOverlay();
            }, 10000);
        }
        // Don't auto-show when at top, only wheel event with deltaY < 0 triggers it
    }

    /**
     * Show logo overlay based on current theme
     */
    function showLogoOverlay() {
        const theme = document.documentElement.getAttribute('data-theme') || 'dark';
        const lightOverlay = document.querySelector('.logo-overlay.light');
        const darkOverlay = document.querySelector('.logo-overlay.dark');

        if (lightOverlay) {
            lightOverlay.classList.remove('active', 'visible');
            lightOverlay.classList.add('inactive', 'hidden');
        }

        if (darkOverlay) {
            darkOverlay.classList.remove('active', 'visible');
            darkOverlay.classList.add('inactive', 'hidden');
        }

        const activeOverlay = theme === 'light' ? lightOverlay : darkOverlay;
        if (activeOverlay) {
            activeOverlay.classList.remove('inactive', 'hidden');
            activeOverlay.classList.add('active', 'visible');
        }
    }

    /**
     * Hide logo overlay
     */
    function hideLogoOverlay() {
        const lightOverlay = document.querySelector('.logo-overlay.light');
        const darkOverlay = document.querySelector('.logo-overlay.dark');
        
        // Clear any pending auto-hide timeout
        if (logoAutoHideTimeout) {
            clearTimeout(logoAutoHideTimeout);
            logoAutoHideTimeout = null;
        }
        
        [lightOverlay, darkOverlay].forEach(overlay => {
            if (overlay) {
                overlay.classList.remove('active', 'visible');
                overlay.classList.add('inactive', 'hidden');
            }
        });
    }

    /**
     * Watch for theme changes to update logo overlay
     */
    function watchThemeChanges() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                    const activeOverlay = document.querySelector('.logo-overlay.active');
                    if (activeOverlay) {
                        // Re-show with correct theme
                        showLogoOverlay();
                    }
                }
            });
        });
        
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });
    }

    /**
     * Initialize scroll buttons
     */
    function initScrollButtons() {
        const scrollTopBtn = document.querySelector('.scroll-top');
        const scrollBottomBtn = document.querySelector('.scroll-bottom');

        if (scrollTopBtn) {
            scrollTopBtn.parentElement.addEventListener('click', (e) => {
                e.preventDefault();
                scrollToTop();
            });
        }

        if (scrollBottomBtn) {
            scrollBottomBtn.parentElement.addEventListener('click', (e) => {
                e.preventDefault();
                scrollToBottom();
            });
        }
    }

    /**
     * Scroll to top of page
     */
    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    /**
     * Scroll to bottom of page
     */
    function scrollToBottom() {
        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
        });
    }

    /**
     * Public API
     */
    window.OverlaySystem = {
        init: init,
        showAd: showAdOverlay,
        hideAd: hideAdOverlay,
        showLogo: showLogoOverlay,
        hideLogo: hideLogoOverlay,
        scrollToTop: scrollToTop,
        scrollToBottom: scrollToBottom
    };

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            init();
            watchThemeChanges();
        });
    } else {
        init();
        watchThemeChanges();
    }

    // Also run when global wrapper has been inserted
    document.addEventListener('global:loaded', () => {
        init();
        watchThemeChanges();
    });

})();

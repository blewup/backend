/**
 * Language Management System for Calendar
 * Synchronizes language changes across all calendar text elements
 */

(function() {
    // Monitor language changes
    function setupLanguageManager() {
        const htmlElement = document.documentElement;

        // Check current language
        function getCurrentLanguage() {
            const lang = htmlElement.getAttribute('data-current-language') || 'fr_CA';
            return lang.includes('en') ? 'en' : 'fr';
        }

        // Update visibility of language elements
        function updateLanguageDisplay() {
            const currentLang = getCurrentLanguage();
            
            // Update all .text-fr and .text-en elements
            document.querySelectorAll('.text-fr, .text-en').forEach(el => {
                if (currentLang === 'fr') {
                    el.style.display = el.classList.contains('text-fr') ? '' : 'none';
                } else {
                    el.style.display = el.classList.contains('text-en') ? '' : 'none';
                }
            });

            // Fire custom event for calendar to re-render
            window.dispatchEvent(new CustomEvent('languageChange', { 
                detail: { language: currentLang } 
            }));
        }

        // Watch for language attribute changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-current-language') {
                    updateLanguageDisplay();
                }
            });
        });

        observer.observe(htmlElement, {
            attributes: true,
            attributeFilter: ['data-current-language']
        });

        // Initial setup
        updateLanguageDisplay();
    }

    // Wait for DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupLanguageManager);
    } else {
        setupLanguageManager();
    }
})();

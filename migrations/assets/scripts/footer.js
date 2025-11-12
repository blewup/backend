function initFooter(){
    // Initialize i18n for footer elements
    function translateFooter() {
        const currentLang = document.body.getAttribute('data-language') || 'fr';

        // Handle all elements with data-i18n-json attribute
        document.querySelectorAll('[data-i18n-json]').forEach(element => {
            try {
                const translations = JSON.parse(element.getAttribute('data-i18n-json'));
                if (translations[currentLang]) {
                    element.textContent = translations[currentLang];
                }
            } catch (e) {
                console.error('Error parsing i18n JSON:', e);
            }
        });
    }

    // Watch for language changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'data-language') {
                translateFooter();
            }
        });
    });

    observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['data-language']
    });

    // Initial translation
    translateFooter();
    
    // Initialize Footer Calendar Modal
    initFooterCalendar();

    // Make clickable date element interactive if it exists
    const clickableDate = document.getElementById('location');
    if (clickableDate) {
        clickableDate.style.cursor = 'pointer';
        clickableDate.style.textDecoration = 'underline';
        clickableDate.addEventListener('click', () => {
            // Scroll to calendar or open booking modal
            const calendarSection = document.querySelector('.calendar-section');
            if (calendarSection) {
                calendarSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    // Ensure map iframe is responsive
    const mapIframe = document.querySelector('.map-full iframe');
    if (mapIframe) {
        // Set proper attributes for accessibility
        mapIframe.setAttribute('loading', 'lazy');
        mapIframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    }
}

// ========================================
// FOOTER CALENDAR MODAL SYSTEM
// ========================================

function initFooterCalendar() {
    const modal = document.getElementById('footer-preview-modal');
    const toggleBtn = document.getElementById('footer-calendar-toggle');
    const closeBtn = document.getElementById('footer-preview-close');
    const calendarContainer = document.getElementById('footer-calendar-container');
    const legendContainer = document.getElementById('footer-legend-container');
    
    if (!modal || !toggleBtn || !closeBtn || !calendarContainer) {
        console.warn('Footer calendar modal elements not found');
        return;
    }
    
    // Parse calendar data from pages/calendar.html structure
    const calendarData = parseCalendarFromHTML();
    
    // Current month index (0-11 where 0=September)
    // Get real current month and map to calendar index
    const realMonth = new Date().getMonth() + 1; // 1-12 (Nov = 11)
    let currentMonthIndex = 0;
    
    // Map real month to calendar index (Sept=0, Oct=1, Nov=2, Dec=3, Jan=4...)
    if (realMonth >= 9) {
        currentMonthIndex = realMonth - 9; // Sept(9)=0, Oct(10)=1, Nov(11)=2, Dec(12)=3
    } else {
        currentMonthIndex = realMonth + 3; // Jan(1)=4, Feb(2)=5...Aug(8)=11
    }
    
    // Month names in French
    const monthNames = [
        'Septembre', 'Octobre', 'Novembre', 'Décembre',
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août'
    ];
    
    // Day names in French
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    
    // Theme colors based on data-theme
    function getThemeColors() {
        const theme = document.documentElement.getAttribute('data-theme') || 'dark';
        if (theme === 'dark') {
            return {
                bg: '#000000',
                text: '#e5e7eb',
                separator: '#d1d5db'
            };
        } else {
            return {
                bg: '#ffffff',
                text: '#1b1b1d',
                separator: '#1b1b1d'
            };
        }
    }
    
    // Open modal
    function openModal() {
        modal.classList.remove('hidden');
        modal.classList.add('visible');
        renderCalendar();
        renderLegend();
    }
    
    // Close modal
    function closeModal() {
        modal.classList.remove('visible');
        modal.classList.add('hidden');
    }
    
    // Toggle modal
    toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (modal.classList.contains('hidden')) {
            openModal();
        } else {
            closeModal();
        }
    });
    
    closeBtn.addEventListener('click', closeModal);
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Render calendar for current month
    function renderCalendar() {
        const colors = getThemeColors();
        const monthData = calendarData[currentMonthIndex];
        
        if (!monthData) {
            calendarContainer.innerHTML = '<p>Données de calendrier non disponibles</p>';
            return;
        }
        
        // Create navigation and calendar structure
        calendarContainer.innerHTML = `
            <div class="footer-calendar-nav">
                <button id="footer-prev-month" ${currentMonthIndex === 0 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left"></i> Précédent
                </button>
                <h4>${monthData.name} ${monthData.year}</h4>
                <button id="footer-next-month" ${currentMonthIndex === 11 ? 'disabled' : ''}>
                    Suivant <i class="fas fa-chevron-right"></i>
                </button>
            </div>
            <div class="footer-calendar-month">
                <div class="footer-calendar-grid-days">
                    ${dayNames.map(day => `<div class="footer-calendar-day-header">${day}</div>`).join('')}
                    ${renderMonthDays(monthData, colors)}
                </div>
            </div>
        `;
        
        // Add navigation event listeners
        const prevBtn = document.getElementById('footer-prev-month');
        const nextBtn = document.getElementById('footer-next-month');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (currentMonthIndex > 0) {
                    currentMonthIndex--;
                    renderCalendar();
                }
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (currentMonthIndex < 11) {
                    currentMonthIndex++;
                    renderCalendar();
                }
            });
        }
        
        // Add click handlers for day cells
        addDayCellHandlers();
    }
    
    // Render days of the month in proper grid positions
    function renderMonthDays(monthData, colors) {
        const days = monthData.days;
        const firstDayColumn = getFirstDayColumn(days);
        
        let html = '';
        let dayIndex = 0;
        
        // Calculate total rows needed (max 6 weeks)
        const totalCells = 42; // 6 rows × 7 columns
        
        for (let i = 0; i < totalCells; i++) {
            const columnIndex = i % 7;
            
            // Check if we should place a day here
            if (dayIndex < days.length && columnIndex === getDayColumnIndex(days[dayIndex].dayOfWeek)) {
                const day = days[dayIndex];
                const cellStyle = getDayCellStyle(day, colors);
                const cellClass = getDayCellClass(day);
                
                html += `
                    <div class="footer-calendar-day-cell ${cellClass}" 
                         style="${cellStyle}" 
                         data-date="${day.date}"
                         data-month="${monthData.name}"
                         data-year="${monthData.year}">
                        <span>${day.number}</span>
                    </div>
                `;
                dayIndex++;
            } else if (i < firstDayColumn || dayIndex >= days.length) {
                // Empty cell before first day or after last day
                html += '<div class="footer-calendar-day-cell" style="opacity: 0; cursor: default;"></div>';
            }
        }
        
        return html;
    }
    
    // Get column index for first day of month
    function getFirstDayColumn(days) {
        if (days.length === 0) return 0;
        return getDayColumnIndex(days[0].dayOfWeek);
    }
    
    // Get column index from day name
    function getDayColumnIndex(dayName) {
        const dayMap = {
            'dimanche': 0,
            'lundi': 1,
            'mardi': 2,
            'mercredi': 3,
            'jeudi': 4,
            'vendredi': 5,
            'samedi': 6
        };
        return dayMap[dayName.toLowerCase()] || 0;
    }
    
    // Determine cell styling based on day status
    function getDayCellStyle(day, colors) {
        const baseStyle = `color: ${colors.text};`;
        
        // Multi-color striped patterns
        if (day.colors && day.colors.length > 1) {
            const color1 = day.colors[0];
            const color2 = day.colors[1];
            return `${baseStyle} background: repeating-linear-gradient(45deg, ${color1} 0px, ${color1} 8px, ${color2} 8px, ${color2} 16px);`;
        }
        
        // Single color
        if (day.colors && day.colors.length === 1) {
            return `${baseStyle} background-color: ${day.colors[0]};`;
        }
        
        // Default color
        return `${baseStyle} background-color: ${colors.bg};`;
    }
    
    // Get CSS class for cell
    function getDayCellClass(day) {
        const classes = [];
        
        if (day.selectable) {
            classes.push('selectable');
        } else {
            classes.push('non-selectable');
        }
        
        if (day.isPast) {
            classes.push('past');
        }
        
        return classes.join(' ');
    }
    
    // Add click handlers for day cells
    function addDayCellHandlers() {
        const cells = calendarContainer.querySelectorAll('.footer-calendar-day-cell.selectable');
        
        cells.forEach(cell => {
            cell.addEventListener('click', () => {
                // Toggle selected state
                cell.classList.toggle('selected');
                
                // Invert colors when selected
                if (cell.classList.contains('selected')) {
                    const currentBg = cell.style.backgroundColor;
                    const colors = getThemeColors();
                    
                    // Invert: bg becomes text color, text becomes bg color
                    cell.style.backgroundColor = colors.text;
                    cell.style.color = currentBg || colors.bg;
                } else {
                    // Restore original colors
                    const day = findDayByDate(cell.dataset.date);
                    if (day) {
                        const colors = getThemeColors();
                        const style = getDayCellStyle(day, colors);
                        cell.setAttribute('style', style);
                    }
                }
            });
        });
    }
    
    // Find day data by date string
    function findDayByDate(dateStr) {
        for (const month of calendarData) {
            const day = month.days.find(d => d.date === dateStr);
            if (day) return day;
        }
        return null;
    }
    
    // Render legend based on calendar data
    function renderLegend() {
        const colors = getThemeColors();
        
        legendContainer.innerHTML = `
            <h4>Légende</h4>
            <div class="footer-legend-item">
                <div class="footer-legend-color" style="background-color: #059669;"></div>
                <span class="footer-legend-label">Disponible (Semaine)</span>
            </div>
            <div class="footer-legend-item">
                <div class="footer-legend-color" style="background-color: #f97316;"></div>
                <span class="footer-legend-label">Disponible (Weekend)</span>
            </div>
            <div class="footer-legend-item">
                <div class="footer-legend-color" style="background: repeating-linear-gradient(45deg, #dc2626, #dc2626 4px, #fbbf24 4px, #fbbf24 8px);"></div>
                <span class="footer-legend-label">Weekend (Lointain)</span>
            </div>
            <div class="footer-legend-item">
                <div class="footer-legend-color" style="background-color: #dc2626; opacity: 0.8;"></div>
                <span class="footer-legend-label">Indisponible / Passé</span>
            </div>
            <div class="footer-legend-item">
                <div class="footer-legend-color" style="background: repeating-linear-gradient(45deg, #f97316, #f97316 4px, #fbbf24 4px, #fbbf24 8px);"></div>
                <span class="footer-legend-label">Événement en cours</span>
            </div>
            <div class="footer-legend-item">
                <div class="footer-legend-color" style="background-color: #9f7aea;"></div>
                <span class="footer-legend-label">Fin d'événement</span>
            </div>
            <div class="footer-legend-item">
                <div class="footer-legend-color" style="background: repeating-linear-gradient(45deg, #dc2626, #dc2626 4px, #059669 4px, #059669 8px);"></div>
                <span class="footer-legend-label">Période des Fêtes</span>
            </div>
            <div class="footer-legend-item">
                <div class="footer-legend-color" style="background: repeating-linear-gradient(45deg, #059669, #059669 4px, #3b82f6 4px, #3b82f6 8px);"></div>
                <span class="footer-legend-label">Semaine de Relâche</span>
            </div>
            <div class="footer-legend-item">
                <div class="footer-legend-color" style="background: repeating-linear-gradient(45deg, #ffd700, #ffd700 4px, #c0c0c0 4px, #c0c0c0 8px);"></div>
                <span class="footer-legend-label">Jour Férié Spécial</span>
            </div>
        `;
    }
    
    // Parse calendar data from existing HTML structure
    function parseCalendarFromHTML() {
        const months = [];
        
        // Month order: Sept, Oct, Nov, Dec, Jan, Feb, Mar, Apr, May, Jun, Jul, Aug
        const monthOrder = [
            'septembre', 'octobre', 'novembre', 'decembre',
            'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout'
        ];
        
        const monthNames = [
            'Septembre', 'Octobre', 'Novembre', 'Décembre',
            'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août'
        ];
        
        monthOrder.forEach((monthKey, index) => {
            const monthEl = document.querySelector(`#footer-${monthKey}-2025`);
            if (!monthEl) {
                console.warn(`Month element not found: footer-${monthKey}-2025`);
                return;
            }
            
            // Determine month number (Sept=9, Oct=10, Nov=11, Dec=12, Jan=1...)
            const monthNumber = index < 4 ? index + 9 : index - 3;
            const year = index < 4 ? 2025 : 2026; // Sept-Dec 2025, Jan-Aug 2026
            
            const days = [];
            const dayLists = monthEl.querySelectorAll('ul[class*="-2025-"]');
            
            dayLists.forEach(dayList => {
                const classMatch = dayList.className.match(/footer-\w+-2025-(\w+)/);
                if (!classMatch) return;
                const dayOfWeek = classMatch[1]; // dimanche, lundi, etc.
                const dayItems = dayList.querySelectorAll('li');
                
                dayItems.forEach(dayItem => {
                    const dayNumber = parseInt(dayItem.textContent.trim());
                    if (isNaN(dayNumber)) return;
                    
                    const date = `${year}-${String(monthNumber).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
                    
                    // Determine day status and colors
                    const dayData = {
                        number: dayNumber,
                        dayOfWeek: dayOfWeek,
                        date: date,
                        colors: getDayColors(monthNumber, dayNumber, year),
                        selectable: isSelectable(monthNumber, dayNumber, year),
                        isPast: isPast(monthNumber, dayNumber, year)
                    };
                    
                    days.push(dayData);
                });
            });
            
            // Sort days by number
            days.sort((a, b) => a.number - b.number);
            
            months.push({
                name: monthNames[index],
                number: monthNumber,
                year: year,
                days: days
            });
        });
        
        console.log('Parsed calendar data:', months);
        return months;
    }
    
    // Determine colors for a specific day
    function getDayColors(month, day, year) {
        const today = new Date();
        const dateObj = new Date(year, month - 1, day);
        
        // Check if past
        if (dateObj < today) {
            return ['#fecaca']; // Red for past dates
        }
        
        // Check holidays
        if (isChristmasHoliday(month, day, year)) {
            return ['#dc2626', '#059669']; // Red and green stripes
        }
        
        if (isSpringBreak(month, day, year)) {
            return ['#059669', '#3b82f6']; // Green and blue stripes
        }
        
        if (isHalloween(month, day)) {
            return ['#ffd700', '#c0c0c0']; // Gold and silver stripes
        }
        
        // Check events (Nov 1-21)
        if (month === 11 && day >= 1 && day <= 21) {
            return ['#f97316', '#fbbf24']; // Orange and yellow stripes
        }
        
        // Check weekends
        const dayOfWeek = dateObj.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            // Weekend more than 2 weeks away
            const twoWeeksLater = new Date(today);
            twoWeeksLater.setDate(today.getDate() + 14);
            
            if (dateObj > twoWeeksLater) {
                return ['#dc2626', '#fbbf24']; // Red and yellow stripes (distant weekend)
            } else {
                return ['#f97316']; // Orange (near weekend)
            }
        }
        
        // Regular weekday
        return ['#059669']; // Green (available)
    }
    
    // Check if date is selectable
    function isSelectable(month, day, year) {
        const today = new Date();
        const dateObj = new Date(year, month - 1, day);
        
        // Can't select past dates
        if (dateObj < today) {
            return false;
        }
        
        return true;
    }
    
    // Check if date is in the past
    function isPast(month, day, year) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dateObj = new Date(year, month - 1, day);
        dateObj.setHours(0, 0, 0, 0);
        
        return dateObj < today;
    }
    
    // Holiday check functions
    function isChristmasHoliday(month, day, year) {
        // Dec 22 - Jan 9
        if (year === 2025 && month === 12 && day >= 22) return true;
        if (year === 2026 && month === 1 && day <= 9) return true;
        return false;
    }
    
    function isSpringBreak(month, day, year) {
        // March 2-6
        return month === 3 && day >= 2 && day <= 6;
    }
    
    function isHalloween(month, day) {
        return month === 10 && day === 31;
    }
    
    // Initialize calendar on first load
    renderCalendar();
    renderLegend();
}
(function () {
  const PAGE_ID = 'main-events';
  const PAGE_SELECTOR = `#${PAGE_ID}`;
  const FOOTER_OPEN_ATTR = 'data-events-modal-open';

  const BASE_DATE = new Date(2025, 10, 1); // November 1st 2025
  const TODAY = new Date(BASE_DATE.getFullYear(), BASE_DATE.getMonth(), BASE_DATE.getDate());
  const TWO_WEEKS_FROM_NOW = new Date(BASE_DATE.getFullYear(), BASE_DATE.getMonth(), BASE_DATE.getDate() + 14);
  const TWO_MONTHS_FROM_NOW = new Date(BASE_DATE.getFullYear(), BASE_DATE.getMonth() + 2, BASE_DATE.getDate());

  const SUMMER_START = new Date(2026, 5, 1); // June 1st 2026
  const SUMMER_END = new Date(2026, 7, 31); // August 31st 2026

  const BOURSE_EVENT_RANGE = {
    start: new Date(2025, 10, 1),
    end: new Date(2025, 10, 21)
  };

  const HOME_MONTH_COUNT = ((SUMMER_END.getFullYear() - BASE_DATE.getFullYear()) * 12)
    + (SUMMER_END.getMonth() - BASE_DATE.getMonth()) + 1;

  const PREVIEW_EVENTS = [
    {
      date: '2025-11-03',
      translations: {
        fr: {
          title: 'Orientation des boursiers',
          description: 'Séance de bienvenue pour les athlètes inscrits au programme de bourses.',
          meta: ['18 h – 20 h', 'Salle des médias']
        },
        en: {
          title: 'Scholarship Orientation',
          description: 'Welcome session for athletes enrolled in the scholarship program.',
          meta: ['6 PM – 8 PM', 'Media room']
        }
      }
    },
    {
      date: '2025-11-16',
      translations: {
        fr: {
          title: 'Tournoi régional U18',
          description: 'Phase de groupes du tournoi régional avec six formations invitées.',
          meta: ['Dès 9 h', 'Catégorie U18']
        },
        en: {
          title: 'U18 Regional Tournament',
          description: 'Group-stage games featuring six invited teams from the region.',
          meta: ['From 9 AM', 'U18 division']
        }
      }
    },
    {
      date: '2025-12-02',
      translations: {
        fr: {
          title: 'Cliniques techniques',
          description: 'Bloc intensif animé par nos entraîneurs élite pour les joueurs midget.',
          meta: ['17 h – 21 h', 'Session technique']
        },
        en: {
          title: 'Skills Development Clinic',
          description: 'High-intensity session led by elite coaches for midget players.',
          meta: ['5 PM – 9 PM', 'Skills intensive']
        }
      }
    },
    {
      date: '2025-12-20',
      translations: {
        fr: {
          title: 'Classique hivernale',
          description: 'Événement familial avec patinage libre, chorales et activités sur glace.',
          meta: ['13 h – 18 h', 'Édition spéciale']
        },
        en: {
          title: 'Winter Classic',
          description: 'Family afternoon featuring free skate, choirs, and on-ice activities.',
          meta: ['1 PM – 6 PM', 'Special edition']
        }
      }
    }
  ];

  const UI_STRINGS = {
    fr: {
      locale: 'fr-CA',
      dayNames: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
      pageTitle: '2025 – 2026',
      pageIntro: "Aperçu dynamique des événements programmés à l'aréna pour les deux prochains mois.",
      previewTitle: 'Aperçu des événements (60 jours)',
      previewSubtitle: "Les cartes sont regroupées par mois et présentent les activités principales annoncées à l'aréna.",
      calendarTitle: 'Calendrier complet',
      calendarSubtitle: 'Consultez les disponibilités et périodes clés. Les codes couleur indiquent la nature de chaque journée.',
      legendTitle: 'Légende',
      legend: {
        available: 'Disponible (semaine)',
        weekend_soon: 'Fin de semaine (achalandée)',
        event: 'Événement/programme en cours',
        holiday_period: 'Congé des Fêtes',
        spring_break: 'Relâche scolaire',
        summer: 'Programmation estivale',
        after_june: 'Après le 1er juin',
        holiday: 'Journée spéciale',
        unavailable: 'Passé / indisponible'
      },
      footerButton: 'Calendrier : Aperçu',
      footerModalTitle: 'Aperçu du calendrier',
      footerLegend: {
        available: 'Disponible',
        weekend_soon: 'Fin de semaine',
        event: 'Événement',
        unavailable: 'Indisponible'
      },
      homePrevLabel: 'Mois précédent',
      homeNextLabel: 'Mois suivant'
    },
    en: {
      locale: 'en-CA',
      dayNames: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      pageTitle: '2025 – 2026',
      pageIntro: 'Dynamic snapshot of scheduled arena programming over the next sixty days.',
      previewTitle: 'Events Preview (Next 60 days)',
      previewSubtitle: 'Cards are grouped by month and highlight the arena’s headline programming.',
      calendarTitle: 'Full calendar',
      calendarSubtitle: 'Browse availability and key periods. Colour codes indicate each day’s status.',
      legendTitle: 'Legend',
      legend: {
        available: 'Available (weekday)',
        weekend_soon: 'Weekend (high demand)',
        event: 'Event / active program',
        holiday_period: 'Holiday break',
        spring_break: 'Spring break',
        summer: 'Summer programming',
        after_june: 'After June 1',
        holiday: 'Special day',
        unavailable: 'Past / unavailable'
      },
      footerButton: 'Calendar: Preview',
      footerModalTitle: 'Calendar preview',
      footerLegend: {
        available: 'Available',
        weekend_soon: 'Weekend',
        event: 'Event',
        unavailable: 'Unavailable'
      },
      homePrevLabel: 'Previous month',
      homeNextLabel: 'Next month'
    }
  };

  const LEGEND_STYLES = {
    available: 'var(--success-color)',
    weekend_soon: 'var(--high-demand-color)',
    event: 'var(--warning-color)',
    holiday_period: 'repeating-linear-gradient(-45deg, var(--success-color), var(--success-color) 8px, var(--error-color) 8px, var(--error-color) 16px)',
    spring_break: 'repeating-linear-gradient(-45deg, var(--calendar-hover-bg), var(--calendar-hover-bg) 8px, rgba(15, 23, 42, 0.65) 8px, rgba(15, 23, 42, 0.65) 16px)',
    summer: 'repeating-linear-gradient(-45deg, var(--calendar-hover-bg), var(--calendar-hover-bg) 8px, var(--success-color) 8px, var(--success-color) 16px)',
    after_june: 'var(--calendar-hover-bg)',
    holiday: 'repeating-linear-gradient(-45deg, var(--high-demand-color), var(--high-demand-color) 8px, var(--text-muted) 8px, var(--text-muted) 16px)',
    unavailable: '#a1a1aa'
  };

  const FOOTER_LEGEND_STYLES = {
    available: 'var(--success-color)',
    weekend_soon: 'var(--high-demand-color)',
    event: 'var(--warning-color)',
    unavailable: '#a1a1aa'
  };

  const EVENT_DATE_MAP = buildEventDateMap();
  let cachedElements = null;
  let currentLang = normaliseLanguage(document.documentElement.getAttribute('data-current-language'));
  let homeMonthIndex = 0;

  function normaliseLanguage(code) {
    if (!code) return 'fr';
    return code.startsWith('fr') ? 'fr' : 'en';
  }

  function buildEventDateMap() {
    const map = new Map();

    // Scholarship campaign range
    for (let date = new Date(BOURSE_EVENT_RANGE.start); date <= BOURSE_EVENT_RANGE.end; date.setDate(date.getDate() + 1)) {
      map.set(formatDateKey(date), 'event');
    }

    // Preview events (single-day markers)
    PREVIEW_EVENTS.forEach((item) => {
      const eventDate = parseISODate(item.date);
      map.set(formatDateKey(eventDate), 'event');
    });

    // Additional special days
    map.set(formatDateKey(new Date(2025, 9, 31)), 'holiday'); // Halloween

    return map;
  }

  function parseISODate(value) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  function formatDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function cacheElements() {
    const root = document.querySelector(PAGE_SELECTOR);
    const query = (selector) => (root ? root.querySelector(selector) : null);

    cachedElements = {
      root,
      title: query('[data-events-title]'),
      intro: query('[data-events-intro]'),
      previewTitle: query('#events-preview-title'),
      previewSubtitle: query('[data-events-preview-subtitle]'),
      previewContainer: query('#events-preview-months'),
      calendarTitle: query('#events-calendar-title'),
      calendarSubtitle: query('[data-events-calendar-subtitle]'),
      calendarGrid: query('#events-calendar-grid'),
      legend: query('#events-legend'),
      legendTitle: query('#events-legend .events-legend-title'),
      legendGrid: query('#events-legend .events-legend-grid'),
      footerButton: query('#events-footer-toggle'),
      footerLabel: query('.events-footer-label'),
      footerModal: query('#events-footer-modal'),
      footerModalTitle: query('#events-footer-modal-title'),
      footerModalClose: query('#events-footer-modal-close'),
      footerMiniGrids: query('#events-footer-mini-grids'),
      footerLegend: query('#events-footer-legend'),
      homeCalendarContainer: document.getElementById('home-calendar-container'),
      homeCalendarMonth: document.getElementById('home-calendar-month'),
      homeCalendarPrev: document.getElementById('home-calendar-prev'),
      homeCalendarNext: document.getElementById('home-calendar-next')
    };

    return cachedElements;
  }

  function ensureElements() {
    return cacheElements();
  }

  function bindOnce(element, eventName, handler, token) {
    if (!element) return;
    const key = token || `bound${eventName.charAt(0).toUpperCase()}${eventName.slice(1)}`;
    if (element.dataset && element.dataset[key] === 'true') return;
    element.addEventListener(eventName, handler);
    if (element.dataset) {
      element.dataset[key] = 'true';
    }
  }

  function renderPage() {
    const els = ensureElements();
    if (!els) return;

    const strings = UI_STRINGS[currentLang];

    if (els.title) {
      els.title.textContent = strings.pageTitle;
    }
    if (els.intro) {
      els.intro.textContent = strings.pageIntro;
    }
    if (els.previewTitle) {
      els.previewTitle.textContent = strings.previewTitle;
    }
    if (els.previewSubtitle) {
      els.previewSubtitle.textContent = strings.previewSubtitle;
    }
    if (els.calendarTitle) {
      els.calendarTitle.textContent = strings.calendarTitle;
    }
    if (els.calendarSubtitle) {
      els.calendarSubtitle.textContent = strings.calendarSubtitle;
    }
    if (els.legendTitle) {
      els.legendTitle.textContent = strings.legendTitle;
    }
    if (els.footerLabel) {
      els.footerLabel.textContent = strings.footerButton;
    }
    if (els.footerModalTitle) {
      els.footerModalTitle.textContent = strings.footerModalTitle;
    }

    renderPreview(strings, els.previewContainer);
    renderCalendars(strings, els.calendarGrid);
    renderLegend(strings, els.legendGrid);
    renderFooterCalendars(strings, els.footerMiniGrids);
    renderFooterLegend(strings, els.footerLegend);
    renderHomeCalendar(strings);
  }

  function renderPreview(strings, container) {
    if (!container) return;
    container.replaceChildren();

    const grouped = groupEventsByMonth();
    const fragment = document.createDocumentFragment();

    Array.from(grouped.values()).forEach(({ date, events }) => {
      const monthBlock = document.createElement('article');
      monthBlock.className = 'events-month-block';

      const titleRow = document.createElement('div');
      titleRow.className = 'events-month-title';

      const heading = document.createElement('h3');
      heading.textContent = capitalise(date.toLocaleString(strings.locale, { month: 'long', year: 'numeric' }));

      const count = document.createElement('p');
      count.className = 'events-month-count';
      count.textContent = new Intl.NumberFormat(strings.locale).format(events.length);

      titleRow.appendChild(heading);
      titleRow.appendChild(count);

      const cards = document.createElement('div');
      cards.className = 'events-month-cards';

      events.forEach((event) => {
        const translation = event.translations[currentLang];
        const eventDate = parseISODate(event.date);

        const card = document.createElement('article');
        card.className = 'events-month-card';

        const badge = document.createElement('div');
        badge.className = 'event-badge';
        badge.appendChild(createBadgeLine(eventDate.getDate()));
        badge.appendChild(createBadgeLine(eventDate.toLocaleString(strings.locale, { month: 'short' }).toUpperCase()));

        const content = document.createElement('div');
        content.className = 'event-content';

        const title = document.createElement('h4');
        title.textContent = translation.title;

        const description = document.createElement('p');
        description.className = 'event-description';
        description.textContent = translation.description;

        content.appendChild(title);
        content.appendChild(description);

        if (Array.isArray(translation.meta) && translation.meta.length > 0) {
          const meta = document.createElement('div');
          meta.className = 'event-meta';
          translation.meta.forEach((line) => {
            const span = document.createElement('span');
            span.textContent = line;
            meta.appendChild(span);
          });
          content.appendChild(meta);
        }

        card.appendChild(badge);
        card.appendChild(content);
        cards.appendChild(card);
      });

      monthBlock.appendChild(titleRow);
      monthBlock.appendChild(cards);
      fragment.appendChild(monthBlock);
    });

    container.appendChild(fragment);
  }

  function createBadgeLine(text) {
    const span = document.createElement('span');
    span.textContent = text;
    return span;
  }

  function groupEventsByMonth() {
    const map = new Map();

    PREVIEW_EVENTS
      .map((item) => ({
        ...item,
        sortKey: item.date,
        dateObj: parseISODate(item.date)
      }))
      .sort((a, b) => (a.sortKey < b.sortKey ? -1 : 1))
      .forEach((item) => {
        const key = `${item.dateObj.getFullYear()}-${item.dateObj.getMonth()}`;
        if (!map.has(key)) {
          map.set(key, { date: new Date(item.dateObj.getFullYear(), item.dateObj.getMonth(), 1), events: [] });
        }
        map.get(key).events.push(item);
      });

    return map;
  }

  function renderCalendars(strings, container) {
    if (!container) return;
    container.replaceChildren();

    const fragment = document.createDocumentFragment();
    const startMonth = new Date(BASE_DATE.getFullYear(), BASE_DATE.getMonth(), 1);

    for (let i = 0; i < 2; i += 1) {
      const monthDate = new Date(startMonth.getFullYear(), startMonth.getMonth() + i, 1);
      fragment.appendChild(createMonthCalendar(monthDate, strings, 'main'));
    }

    container.appendChild(fragment);
  }

  function renderFooterCalendars(strings, container) {
    if (!container) return;
    container.replaceChildren();

    const fragment = document.createDocumentFragment();
    const startMonth = new Date(BASE_DATE.getFullYear(), BASE_DATE.getMonth(), 1);

    for (let i = 0; i < 2; i += 1) {
      const monthDate = new Date(startMonth.getFullYear(), startMonth.getMonth() + i, 1);
      fragment.appendChild(createMonthCalendar(monthDate, strings, 'footer'));
    }

    container.appendChild(fragment);
  }

  function renderHomeCalendar(strings) {
    const els = ensureElements();
    if (!els || !els.homeCalendarContainer) return;

    const maxIndex = Math.max(HOME_MONTH_COUNT - 1, 0);
    if (homeMonthIndex > maxIndex) {
      homeMonthIndex = maxIndex;
    }
    if (homeMonthIndex < 0) {
      homeMonthIndex = 0;
    }

    const monthDate = new Date(BASE_DATE.getFullYear(), BASE_DATE.getMonth() + homeMonthIndex, 1);
    const calendarEl = createMonthCalendar(monthDate, strings, 'home');

    els.homeCalendarContainer.replaceChildren(calendarEl);

    if (els.homeCalendarMonth) {
      els.homeCalendarMonth.textContent = capitalise(monthDate.toLocaleString(strings.locale, { month: 'long', year: 'numeric' }));
    }

    const isAtStart = homeMonthIndex === 0;
    const isAtEnd = homeMonthIndex === maxIndex;

    if (els.homeCalendarPrev) {
      els.homeCalendarPrev.disabled = isAtStart;
      els.homeCalendarPrev.setAttribute('aria-label', strings.homePrevLabel);
      els.homeCalendarPrev.classList.toggle('is-disabled', isAtStart);
    }

    if (els.homeCalendarNext) {
      els.homeCalendarNext.disabled = isAtEnd;
      els.homeCalendarNext.setAttribute('aria-label', strings.homeNextLabel);
      els.homeCalendarNext.classList.toggle('is-disabled', isAtEnd);
    }
  }

  function adjustHomeMonth(offset) {
    const maxIndex = Math.max(HOME_MONTH_COUNT - 1, 0);
    homeMonthIndex = Math.min(Math.max(homeMonthIndex + offset, 0), maxIndex);
    renderHomeCalendar(getStrings());
  }

  function createMonthCalendar(date, strings, context) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const monthLabel = capitalise(date.toLocaleString(strings.locale, { month: 'long', year: 'numeric' }));

    const wrapper = context === 'home' ? document.createElement('div') : document.createElement('article');
    if (context === 'main') {
      wrapper.className = 'calendar-month';
    } else if (context === 'footer') {
      wrapper.className = 'footer-calendar';
    } else if (context === 'home') {
      wrapper.className = 'calendar-month calendar-month--home';
    }

    if (context !== 'home') {
      const heading = document.createElement('h3');
      heading.textContent = monthLabel;
      wrapper.appendChild(heading);
    }

    const grid = document.createElement('div');
    if (context === 'home') {
      grid.className = 'calendar-month__grid';
    } else {
      grid.className = 'calendar-grid';
    }

    strings.dayNames.forEach((dayName) => {
      const headerCell = document.createElement('div');
      if (context === 'home') {
        headerCell.className = 'calendar-month__day day-header';
      } else {
        headerCell.className = 'day-header';
      }
      headerCell.textContent = dayName;
      grid.appendChild(headerCell);
    });

    const firstDay = new Date(year, month, 1).getDay();
    for (let i = 0; i < firstDay; i += 1) {
      if (context === 'home') {
        const placeholder = document.createElement('div');
        placeholder.className = 'calendar-month__cell is-empty';
        grid.appendChild(placeholder);
      } else {
        grid.appendChild(document.createElement('div'));
      }
    }

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day += 1) {
      const currentDate = new Date(year, month, day);
      const dateKey = formatDateKey(currentDate);
      const dayInfo = getSpecialDayInfo(currentDate, dateKey);

      const cell = document.createElement('div');
      if (context === 'home') {
        cell.className = 'calendar-month__cell day-cell';
      } else {
        cell.className = 'day-cell';
      }
      cell.textContent = day;
      cell.dataset.date = dateKey;

      if (dayInfo.className) {
        cell.classList.add(dayInfo.className);
      }

      if (dayInfo.cssVar) {
        cell.style.setProperty('--cell-color', dayInfo.cssVar);
      }

      if (dayInfo.stamp) {
        const stamp = document.createElement('span');
        stamp.className = 'stamp-m';
        stamp.textContent = dayInfo.stamp;
        cell.appendChild(stamp);
      }

      if (dayInfo.type === 'unavailable') {
        cell.classList.add('unavailable');
      }

      grid.appendChild(cell);
    }

    wrapper.appendChild(grid);
    return wrapper;
  }

  function getSpecialDayInfo(date, dateKey) {
    const info = { type: 'available', className: 'available', cssVar: 'var(--success-color)', stamp: null };

    if (date < TODAY) {
      return { type: 'unavailable', className: 'unavailable', cssVar: 'var(--error-color)', stamp: null };
    }

    if (date >= BOURSE_EVENT_RANGE.start && date <= BOURSE_EVENT_RANGE.end) {
      return { type: 'event', className: 'bg-event', cssVar: 'var(--warning-color)', stamp: null };
    }

    if (EVENT_DATE_MAP.get(dateKey) === 'event') {
      return { type: 'event', className: 'bg-event', cssVar: 'var(--warning-color)', stamp: null };
    }

    if (date.getMonth() === 9 && date.getDate() === 31) {
      return { type: 'holiday', className: 'bg-striped-halloween', cssVar: 'var(--high-demand-color)', stamp: null };
    }

    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    const inHolidayBreak = (year === 2025 && month === 11 && day >= 22) || (year === 2026 && month === 0 && day <= 9);
    if (inHolidayBreak) {
      return { type: 'holiday_period', className: 'bg-striped-holiday', cssVar: 'var(--error-color)', stamp: null };
    }

    if (year === 2026 && month === 2 && day >= 2 && day <= 6) {
      return { type: 'spring_break', className: 'bg-striped-spring-break', cssVar: 'var(--calendar-hover-bg)', stamp: null };
    }

    if (date >= SUMMER_START) {
      if (date >= SUMMER_START && date <= SUMMER_END) {
        return { type: 'summer', className: 'bg-striped-summer', cssVar: 'var(--success-color)', stamp: null };
      }
      return { type: 'after_june', className: 'bg-after-june', cssVar: 'var(--calendar-hover-bg)', stamp: 'M' };
    }

    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      if (date < TWO_WEEKS_FROM_NOW) {
        return { type: 'unavailable', className: 'unavailable', cssVar: 'var(--error-color)', stamp: null };
      }
      if (date >= TWO_WEEKS_FROM_NOW && date <= TWO_MONTHS_FROM_NOW) {
        return { type: 'weekend_soon', className: 'bg-high-demand', cssVar: 'var(--high-demand-color)', stamp: null };
      }
      return { type: 'unavailable', className: 'unavailable', cssVar: 'var(--error-color)', stamp: null };
    }

    return info;
  }

  function renderLegend(strings, container) {
    if (!container) return;
    container.replaceChildren();

    const fragment = document.createDocumentFragment();

    Object.entries(strings.legend).forEach(([key, label]) => {
      const item = document.createElement('div');
      item.className = 'legend-item';

      const swatch = document.createElement('span');
      swatch.className = 'legend-color-box';
      applyLegendStyle(swatch, key, LEGEND_STYLES);

      const text = document.createElement('span');
      text.textContent = label;

      item.appendChild(swatch);
      item.appendChild(text);
      fragment.appendChild(item);
    });

    container.appendChild(fragment);
  }

  function renderFooterLegend(strings, container) {
    if (!container) return;
    container.replaceChildren();

    const fragment = document.createDocumentFragment();

    Object.entries(strings.footerLegend).forEach(([key, label]) => {
      const item = document.createElement('div');
      item.className = 'legend-item';

      const swatch = document.createElement('span');
      swatch.className = 'legend-color-box';
      applyLegendStyle(swatch, key, FOOTER_LEGEND_STYLES);

      const text = document.createElement('span');
      text.textContent = label;

      item.appendChild(swatch);
      item.appendChild(text);
      fragment.appendChild(item);
    });

    container.appendChild(fragment);
  }

  function applyLegendStyle(element, key, styleMap) {
    const styleValue = styleMap[key];
    if (!styleValue) {
      element.style.background = 'var(--border-color)';
      return;
    }

    if (styleValue.startsWith('repeating-linear-gradient')) {
      element.style.backgroundImage = styleValue;
    } else {
      element.style.background = styleValue;
    }
  }

  function capitalise(value) {
    if (!value) return value;
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function toggleFooterModal(show) {
    const els = ensureElements();
    if (!els || !els.footerModal) return;

    if (show) {
      els.footerModal.removeAttribute('hidden');
      document.body.setAttribute(FOOTER_OPEN_ATTR, 'true');
    } else {
      els.footerModal.setAttribute('hidden', '');
      document.body.removeAttribute(FOOTER_OPEN_ATTR);
    }
  }

  function setupEventListeners() {
    const els = ensureElements();
    if (!els) return;

    bindOnce(els.footerButton, 'click', () => toggleFooterModal(true), 'eventsFooterOpen');
    bindOnce(els.footerModalClose, 'click', () => toggleFooterModal(false), 'eventsFooterClose');

    if (els.footerModal && (!els.footerModal.dataset || els.footerModal.dataset.eventsBackdropBound !== 'true')) {
      els.footerModal.addEventListener('click', (event) => {
        if (event.target === els.footerModal) {
          toggleFooterModal(false);
        }
      });
      if (els.footerModal.dataset) {
        els.footerModal.dataset.eventsBackdropBound = 'true';
      }
    }

    bindOnce(els.homeCalendarPrev, 'click', () => adjustHomeMonth(-1), 'homeCalendarPrev');
    bindOnce(els.homeCalendarNext, 'click', () => adjustHomeMonth(1), 'homeCalendarNext');

    if (document.body && document.body.dataset.eventsEscapeBound !== 'true') {
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && document.body.hasAttribute(FOOTER_OPEN_ATTR)) {
          toggleFooterModal(false);
        }
      });
      document.body.dataset.eventsEscapeBound = 'true';
    }
  }

  function handleLanguageChange(event) {
    currentLang = normaliseLanguage(event.detail.language);
    renderPage();
  }

  function init() {
    if (!ensureElements()) return;
    setupEventListeners();
    renderPage();
  }

  document.addEventListener('global:loaded', init);
  window.addEventListener('languageChange', handleLanguageChange);

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  }
})();

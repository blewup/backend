# Aréna Régional Lareau — Dynamic SPA with Localization & Layout Management

This is a **Single Page Application (SPA)** scaffold for static hosting (GitHub Pages) featuring dynamic content loading, dual-language support (French Canadian / English US), and sophisticated layout management.

## 🎯 Recent Updates (November 2025)

### ✅ Completed Improvements
1. **Language Migration**: All `fr`/`en` codes migrated to `fr_CA`/`en_US`
2. **Calendar Merge**: `calendarfull.js` merged into `calendar.js` (single file)
3. **Layout Fixes**: Fixed positioning with single scrollbar in main content
4. **State Management**: Proper active/inactive container switching
5. **Footer Logos**: City logos reduced to `clamp(18px, 2.2vh, 24px)` for better fit
6. **Dual Map Display**: Google Maps + Street View side-by-side at 172vh
7. **Ad Overlay**: Fixed close button, image sizing, and container-index activation

## Project Structure

```
index.html                          # Main SPA shell with grid layout
pages/
  ├── index.html                   # Home/main content (default active)
  ├── events.html                  # Events page
  ├── location.html                # Ice rink booking & location info
  ├── billets.html                 # Ticketing page
  ├── content/
  │   ├── navbar.html              # Navigation (always active)
  │   ├── footer.html              # Footer with city logos (always active)
  │   ├── maps.html                # Dual map/street view (always active)
  │   └── calendar.html            # Calendar modal for bookings
  ├── galeries/                    # Gallery pages (photo collections)
  │   ├── cpa.html
  │   ├── famille.html
  │   └── feminin.html
  └── propos/                      # About section pages
      ├── equipe.html
      ├── mission.html
      └── contact.html

assets/
  ├── styles/
  │   ├── index.css                # Main grid layout & container styling
  │   ├── navbar.css               # Navigation bar
  │   ├── footer.css               # Footer layout & logo sizing
  │   ├── events.css               # Events page styling
  │   ├── location.css             # Location page styling
  │   ├── galeries.css             # Gallery styling
  │   ├── fonts.css                # Font face declarations
  │   └── menu.css                 # Mobile menu
  ├── scripts/
  │   ├── index.js                 # Language/theme management & globals
  │   ├── layout.js                # Container switching logic (active/inactive)
  │   ├── navbar.js                # Navigation with language toggle
  │   ├── footer.js                # Footer calendar preview & locale observer
  │   ├── overlay-handler.js       # Advertisement overlay management
  │   ├── location.js              # Location page: calendar, booking, ice viz
  │   ├── events.js                # Events page with calendar integration
  │   ├── calendar.js              # Full calendar modal
  │   ├── calendarfull.js          # Extended calendar utilities
  │   ├── maps.js                  # Map/StreetView dual embed
  │   ├── billets.js               # Ticketing logic
  │   ├── scroll.js                # Scroll button handlers
  │   ├── galeries.js              # Gallery interaction
  │   └── setup.js                 # Fragment loading & initialization
  └── images/
      ├── hyperlink.png            # Overlay advertisement image
      ├── logos/                   # Branding logos
      └── villes/                  # City partner logos
```

## Key Features

### 1. Single Scrollbar in Active Content
**Implementation:**
- All `.main` containers positioned `fixed` with:
  - `top: 12vh` (below navbar)
  - `bottom: 8vh` (above footer)
  - `left: 4vw`, `right: 4vw` (horizontal padding)
  - `width: 92vw`, `height: 80vh`
  - `overflow-y: auto` (internal scrolling only)
- Body has `overflow: hidden` to prevent page-level scroll
- Only the active container is visible and scrollable
- Footer remains fixed at `bottom: 0`, navbar at `top: 0`

### 2. Active/Inactive Container Switching
The layout uses a state-machine approach for content display:

**Static (Always Active) Elements:**
- `.main-navbar` — Navigation bar (fixed at top: 0)
- `.main-footer` — Footer with city logos (fixed at bottom: 0)
- `.container-maps` — Dual map/StreetView display (fixed at top: 172vh)

**Dynamic (Switchable) Content:**
- `#container-index` or `.container-index` — Home page (active by default)
- `#container-location` — Ice rink booking
- `#container-calendar` — Calendar for reservations
- `#main-events`, `#main-billets` — Other pages

**Switching Logic (layout.js):**
```javascript
// On navigation click or button action:
1. Find current active container (except navbar/footer/maps)
2. Remove 'active' class, add 'inactive' class
3. On target container: remove 'inactive', add 'active'
4. Reset scrollTop to 0 on newly active container
5. Navbar, footer, and maps remain untouched (always active)
```

**Special Cases:**
- **Ad Overlay Close**: When `.adv-overlay` closes → activates `#container-index`
- **Location → Calendar**: Ice rink button click → deactivates `#container-location`, activates `#container-calendar`

### 3. Dual Language Support (fr_CA / en_US)
**Migration Complete:** All `fr` → `fr_CA`, `en` → `en_US` across entire project.

**HTML Element Configuration:**
```html
<html lang="fr-CA" id="html" 
      data-i18n="fr_CA" 
      data-i18n-json="fr_CA" 
      data-default-language="fr_CA" 
      data-current-language="fr_CA" 
      data-theme="dark">
```

**Files Updated:**
- `index.html` — HTML element attributes
- `navbar.css` — CSS selectors `[data-current-language="fr_CA"]` / `[data-current-language="en_US"]`
- `navbar.js` — Default language and toggle logic
- `index.js` — Language initialization
- `galeries.js` — Gallery language switcher
- `calendar.js` — Date formatting with `fr_CA` locale

**Usage in HTML:**
```html
<span class="french-active" data-i18n="welcome" 
      data-i18n-json='{"fr_CA":"Bienvenue","en_US":"Welcome"}'>Bienvenue</span>
```

**CSS Control:**
```css
[data-current-language="fr_CA"] .french-active { display: block; }
[data-current-language="fr_CA"] .english-active { display: none; }
[data-current-language="en_US"] .english-active { display: block; }
[data-current-language="en_US"] .french-active { display: none; }
```

### 4. Calendar System (Merged)
**Major Change:** `calendarfull.js` merged into `calendar.js` for single-file management

**Features Now in calendar.js:**
1. **ResponsiveMonthlyCalendar Class**: Dynamic grid layout (4×3, adapts to container size)
2. **Footer Calendar Preview**: 2-month mini view with event indicators
3. **Full Booking Overlay**: 12-month calendar with date selection and time input
4. **Event Status System**: Holidays, ongoing events (bourse), upcoming events
5. **Reservation Modal**: Email-based booking with selected dates/times

**Script Tag:** Only `calendar.js` loaded in index.html (calendarfull.js removed)

**Global Functions Exposed:**
- `window.showCalendarOverlay()` — Opens full calendar modal
- `window.hideCalendarOverlay()` — Closes calendar modal
- `window.responsiveCalendar` — Access to calendar instance

### 5. Advertisement Overlay
**Display:** Shown on page load after 2 seconds with `hyperlink.png` image

**Fixed Issues:**
- Close button now visible (repositioned to `top: 10px, right: 10px` inside card)
- Image constrained to `max-height: min(65vh, 550px)` with `object-fit: contain`
- Ad card limited to `max-width: min(90vw, 700px)`, `max-height: min(85vh, 650px)`
- ESC key handler works (already implemented in index.html)
- Backdrop click closes overlay
- On close: activates `#container-index` automatically

**Behavior:** Once closed, won't show again same day (localStorage tracking)

### 5. Footer System
**Layout:** Fixed footer (8vh) with three-column grid

**Structure:**
- **Left**: Social/external logos (Facebook, Instagram, etc.)
- **Center**: Contact info + 2-month calendar preview
- **Right**: City partner logos (reduced sizing for better fit)

**Logo Sizing:**
```css
.footer-logo-link img {
    max-height: clamp(18px, 2.2vh, 24px);  /* Reduced from 24px-32px */
    width: auto;
}
```

**Calendar Preview:** Shows current month + next month with event highlights (holidays, ongoing bourse)

### 6. Dual Map Display
**Location:** Fixed at `top: 172vh` (below main content scroll area)

**Layout:** Grid with 2 columns (side-by-side)
- **Left Panel**: Google Maps embed (interactive map)
- **Right Panel**: Google Street View embed

**File:** `/pages/content/maps.html` contains both iframes with proper titles and styling

**Positioning:**
```css
.container-maps {
    position: fixed !important;
    top: 172vh;
    left: 4vw;
    right: 4vw;
    width: 92vw;
    min-height: 70vh;
}
```

**Responsive:** Stacks vertically on screens < 768px width

## How to Modify Content

### Add New Page

1. Create `/pages/my-page.html` with main structure
2. Add container in `index.html`: `<main class="main main-content container-mypage inactive" id="main-mypage" src="/pages/my-page.html"></main>`
3. Create navbar link in `/pages/content/navbar.html` with `data-nav-target="main-mypage"`
4. Add locale strings using `.french-active` and `.english-active` classes

### Update Footer Logos
Edit `/pages/content/footer.html` and adjust logo sizing in `/assets/styles/footer.css`:
```css
.footer-logo-link img {
    max-height: clamp(18px, 2.2vh, 24px);
    width: auto;
}
```

### Merge Calendar Files
`calendar.js` now includes all features from `calendarfull.js`. The unified file handles:
- Full year calendar view (12 months)
- Booking modal with time selection
- Email generation for reservations
- Footer mini-preview (2 months)
- Language-aware date formatting (fr_CA / en_US locales)

### Active/Inactive State Management

**Rules:**
1. Only ONE `.main-content` can have `active` class at a time
2. Navbar (`#main-navbar`), footer (`#main-footer`), and map (`#main-map`) are ALWAYS active
3. Ad overlay (`#main-overlay`) starts active, becomes inactive on close
4. When ad closes, ensure `#main-index` gets `active` class

**Implementation in `layout.js`:**
```javascript
function switchContainer(targetId) {
  // Remove active from all switchable mains
  document.querySelectorAll('.main-content').forEach(el => {
    el.classList.remove('active');
    el.classList.add('inactive');
  });
  
  // Activate target
  const target = document.getElementById(targetId);
  if (target) {
    target.classList.remove('inactive');
    target.classList.add('active');
  }
}
```

**Triggering Container Switch:**
- Navbar link click: `data-nav-target="main-location"`
- Location page ice button: triggers `#main-calendar`
- Ad overlay close: ensures `#main-index` active

### Language Code Updates (fr_CA / en_US)

**Files requiring language code changes:**
- `index.html` — `data-current-language="fr_CA"`
- `index.js` — Default language: `'fr_CA'`, toggle to `'en_US'`
- `navbar.js` — Language toggle: `fr_CA` ↔ `en_US`
- `location.js` — Calendar locale: `new Intl.DateTimeFormat('fr-CA', ...)`
- `events.js` — Date formatting with correct locale
- `calendar.js` — All locale references
- `footer.js` — Footer calendar preview locale
- All CSS files — Selectors: `[data-current-language="fr_CA"]` and `[data-current-language="en_US"]`

**CSS Selector Pattern:**
```css
.french-active {
  display: block;
  opacity: 1;
}

.english-active {
  display: none;
  opacity: 0;
}

[data-current-language="en_US"] .french-active {
  display: none;
  opacity: 0;
}

[data-current-language="en_US"] .english-active {
  display: block;
  opacity: 1;
}
```

### Map Display Configuration

The map container (`#main-map`) displays both Google Maps embed AND Street View side-by-side:

**Structure in `/pages/content/maps.html`:**
```html
<section class="global-map-section">
  <div class="map-dual-container">
    <div class="map-frame">
      <iframe src="...embed"></iframe>
      <div class="map-overlay">
        <!-- CTA overlay -->
      </div>
    </div>
    <div class="streetview-frame">
      <iframe src="...svembed"></iframe>
    </div>
  </div>
</section>
```

**CSS Grid Layout (`index.css`):**
```css
.map-dual-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  height: 100%;
}

@media (max-width: 768px) {
  .map-dual-container {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr;
  }
}
```

### Scrollbar Configuration

**Main Page Scroll:**
```css
body {
  overflow-y: hidden; /* Disable body scroll */
}

.main-content {
  position: fixed;
  top: 12vh;
  left: 0;
  right: 0;
  height: calc(100vh - 12vh - 8vh);
  overflow-y: auto; /* Only active container scrolls */
  overflow-x: hidden;
}

.main-content.inactive {
  display: none;
}
```

**Nested Scroll Boxes:**
Small content areas (event cards, ice rink options) can have internal scroll:
```css
.scrollable-content-box {
  max-height: 35vh;
  overflow-y: auto;
  scrollbar-width: thin;
}
```

### Ad Overlay Management

**Initialization (`overlay-handler.js`):**
- Overlay starts with `active` class
- Shows `hyperlink.png` in modal
- On close (button/ESC/backdrop): remove `active`, add `inactive`
- Simultaneously ensure `#main-index` gets `active`

**Close Handler:**
```javascript
function closeAdOverlay() {
  const overlay = document.getElementById('main-overlay');
  overlay.classList.remove('active');
  overlay.classList.add('inactive');
  
  // Ensure home is active
  const homeContainer = document.getElementById('main-index');
  homeContainer.classList.add('active');
  homeContainer.classList.remove('inactive');
}
```

### Footer Always Visible

Footer is fixed at bottom via CSS:
```css
.site-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 8vh;
  z-index: 1000;
}
```

Content containers account for footer height:
```css
.main-content {
  height: calc(100vh - 12vh - 8vh);
  /* 12vh navbar, 8vh footer */
}
```

### Location Page Ice Rink Display

The location page should show:
1. **Ice Rink Visualization** — SVG/Canvas with NHL regulation lines
2. **Booking Options** — Full ice vs. half ice
3. **Pricing Table** — Hourly rates for different time slots
4. **Operating Hours** — Weekly schedule

Ensure `location.js` initializes when `#main-location` becomes active.

### Events & Calendar Integration

- **Events page** (`/pages/events.html`) displays upcoming events
- Clicking event date/CTA opens calendar modal
- **Calendar modal** (`/pages/content/calendar.html`) overlays on any page
- Calendar integrated in location page for ice booking
- Footer shows 2-month mini preview (non-interactive display)

### Development Checklist

- [x] Merge `calendarfull.js` into `calendar.js` ✅
- [x] Remove `calendarfull.js` script tag from `index.html` ✅
- [x] Update all `fr` → `fr_CA` and `en` → `en_US` in JS files ✅
- [x] Update CSS selectors for `[data-current-language="fr_CA"]` / `[data-current-language="en_US"]` ✅
- [x] Fix map dual display (map + street view) ✅
- [x] Ensure ad overlay closes properly and activates home ✅
- [x] Fixed layout positioning: top 12vh, bottom 8vh, left/right 4vw ✅
- [x] Implement container switching in layout.js ✅
- [x] Single scrollbar in active main container ✅
- [x] Footer always visible at fixed bottom ✅
- [x] Reduce city logo sizes in footer (18px-24px) ✅
- [x] Location page booking button switches to calendar container ✅
- [ ] Test location page: ice viz, pricing display, opening hours
- [ ] Test events page: calendar modal integration
- [ ] Validate language toggle updates all visible text
- [ ] Test all navigation links and container switches

### Troubleshooting

**Multiple scrollbars appearing:**
- Check body doesn't have `overflow-y: auto`
- Verify only `.main-content.active` has scroll
- Ensure inactive containers have `display: none`

**Footer scrolling with content:**
- Footer must be `position: fixed`, not `absolute`
- Check z-index stack order
- Content height should account for footer

**Container not switching:**
- Verify `data-nav-target` matches container `id`
- Check `layout.js` is loaded and event listeners attached
- Ensure target container exists in DOM

**Language not switching:**
- Confirm `data-current-language` updates on `<html>` element
- Check CSS selectors match exact locale codes
- Verify `.french-active` / `.english-active` classes present

**Map not loading:**
- Check iframe `src` URLs are correct
- Verify `container-maps` has `data-static-main="true"`
- Ensure `map.js` initializes on load

### Update Footer Logos (Corrected)

Edit `/pages/content/footer.html` and adjust sizes in `/assets/styles/footer.css`:
```css
.footer-logo-link img {
  max-height: clamp(18px, 2.2vh, 24px);
}
```

### Modify Main Layout

Edit `/assets/styles/index.css` for grid adjustments:
- `.site-grid` — Top-level layout
- `.main-content` — Scrollable content area
- `.main-footer` — Footer styling

## Testing Locally

```bash
cd "/var/home/shurukn/Documents/Bourses Sportive/arena-lareau"
python3 -m http.server 8000
# http://localhost:8000
```

## Locale Normalization

All languages normalized to:
- **French:** `fr_CA` (not `fr`, `fr-ca`)
- **English:** `en_US` (not `en`, `en-us`)

Use `window.normalizeLanguage()` to convert any format to standard.

## Deployment (GitHub Pages)

Push to repo → Settings → Pages → Select `main` branch → Published at `https://username.github.io/repo-name`

---

**Version:** 2.0 | **Updated:** November 1, 2025

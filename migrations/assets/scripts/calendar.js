(function () {
    'use strict';

    const OVERLAY_ID = 'main-calendar';
    const BODY_OVERLAY_ATTR = 'data-calendar-overlay';
    const START_MONTH = new Date(2025, 10, 1);
    const TOTAL_MONTHS = 10;
    const BASE_TODAY = new Date(2025, 10, 1);
    const BOURSE_RANGE = { start: new Date(2025, 10, 1), end: new Date(2025, 10, 21) };
    const HOLIDAY_RANGE = { start: new Date(2025, 11, 22), end: new Date(2026, 0, 9) };
    const SPRING_BREAK_RANGE = { start: new Date(2026, 2, 2), end: new Date(2026, 2, 6) };
    const SUMMER_START = new Date(2026, 5, 1);
    const SUMMER_END = new Date(2026, 7, 31);
    const HALLOWEEN = new Date(2025, 9, 31);
    const TWO_WEEKS_FROM_BASE = new Date(BASE_TODAY.getFullYear(), BASE_TODAY.getMonth(), BASE_TODAY.getDate() + 14);
    const TWO_MONTHS_FROM_BASE = new Date(BASE_TODAY.getFullYear(), BASE_TODAY.getMonth() + 2, BASE_TODAY.getDate());

    const SLOT_TYPES = {
        add: { key: 'add', range: [9, 16], increments: 30, allowEmpty: false },
        hold: { key: 'hold', range: [16, 22], increments: 30, allowEmpty: false },
        cancel: { key: 'cancel', range: [9, 22], increments: 30, allowEmpty: true }
    };

    const UI_STRINGS = {
        fr: {
            locale: 'fr-CA',
            dayNames: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
            slotTypeLabels: {
                add: 'Ajout (9 h – 16 h)',
                hold: 'Période achalandée (16 h – 22 h)',
                cancel: 'Requête spéciale / annulation'
            },
            slotTypeShort: {
                add: 'Ajout',
                hold: 'Achalandé',
                cancel: 'Spécial'
            },
            slotNotePlaceholder: 'Ajoutez une précision ou une contrainte (optionnel).',
            slotNotePlaceholderCancel: 'Décrivez la requête spéciale (obligatoire).',
            slotErrorMissingTime: 'Veuillez choisir une heure de début et de fin.',
            slotErrorInvalidRange: "L'heure de fin doit suivre l'heure de début.",
            slotErrorPartialTime: 'Veuillez compléter la plage horaire.',
            slotErrorMissingNote: 'Veuillez ajouter un commentaire pour cette requête.',
            selectionRemove: 'Retirer',
            selectionEmpty: "Aucune plage n'est sélectionnée pour le moment.",
            toastSlotAdded: 'Plage ajoutée à votre demande.',
            toastSlotRemoved: 'Plage retirée.',
            toastCleared: 'Sélection réinitialisée.',
            toastCopied: 'Contenu copié dans le presse-papiers.',
            toastRequestReady: 'Résumé prêt à être envoyé.',
            submitMissingName: 'Veuillez entrer le nom du responsable.',
            submitMissingContact: 'Veuillez fournir un téléphone ou un courriel.',
            submitMissingSelections: 'Veuillez sélectionner au moins une plage horaire.',
            shareHeader: 'Demande de réservation – Aréna Lareau',
            shareContact: {
                name: 'Responsable',
                organization: 'Organisation',
                phone: 'Téléphone',
                email: 'Courriel',
                notes: 'Note'
            },
            shareNotProvided: 'Non fourni',
            shareRequestTitle: 'Plages demandées',
            shareSlotLine: ({ dateLabel, typeLabel, timeLabel, note }) => {
                const parts = [`• ${dateLabel}`, typeLabel];
                if (timeLabel) parts.push(timeLabel);
                const base = parts.join(' · ');
                return note ? `${base} — ${note}` : base;
            },
            shareFooter: 'Merci de confirmer la disponibilité au plus vite.',
            slotTimeLabel: (start, end) => `${start} – ${end}`,
            slotTimeAny: 'Non précisé',
            cellStatuses: {
                available: 'Disponible',
                tentative: 'En attente',
                blocked: 'Indisponible'
            }
        },
        en: {
            locale: 'en-CA',
            dayNames: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            slotTypeLabels: {
                add: 'Weekday ice (9 AM – 4 PM)',
                hold: 'High-demand / weekend (4 PM – 10 PM)',
                cancel: 'Special request / cancellation'
            },
            slotTypeShort: {
                add: 'Weekday',
                hold: 'Weekend',
                cancel: 'Special'
            },
            slotNotePlaceholder: 'Add any notes or constraints (optional).',
            slotNotePlaceholderCancel: 'Describe the special request (required).',
            slotErrorMissingTime: 'Please pick a start and end time.',
            slotErrorInvalidRange: 'End time must be after the start time.',
            slotErrorPartialTime: 'Please complete the time range.',
            slotErrorMissingNote: 'Please describe this special request.',
            selectionRemove: 'Remove',
            selectionEmpty: 'No time slots selected yet.',
            toastSlotAdded: 'Slot added to your request.',
            toastSlotRemoved: 'Slot removed.',
            toastCleared: 'Selection cleared.',
            toastCopied: 'Copied to clipboard.',
            toastRequestReady: 'Summary ready to send.',
            submitMissingName: 'Please enter the primary contact.',
            submitMissingContact: 'Please provide a phone number or email.',
            submitMissingSelections: 'Please select at least one time slot.',
            shareHeader: 'Ice time request – Aréna Lareau',
            shareContact: {
                name: 'Contact',
                organization: 'Organization',
                phone: 'Phone',
                email: 'Email',
                notes: 'Notes'
            },
            shareNotProvided: 'Not provided',
            shareRequestTitle: 'Requested slots',
            shareSlotLine: ({ dateLabel, typeLabel, timeLabel, note }) => {
                const parts = [`• ${dateLabel}`, typeLabel];
                if (timeLabel) parts.push(timeLabel);
                const base = parts.join(' · ');
                return note ? `${base} — ${note}` : base;
            },
            shareFooter: 'Thanks for confirming availability at your earliest convenience.',
            slotTimeLabel: (start, end) => `${start} to ${end}`,
            slotTimeAny: 'Not specified',
            cellStatuses: {
                available: 'Available',
                tentative: 'Pending',
                blocked: 'Unavailable'
            }
        }
    };

    let cached = null;
    let initialised = false;
    let currentLang = normaliseLanguage(document.documentElement.getAttribute('data-current-language'));
    const selections = new Map();
    let activeModal = null;
    let lastTrigger = null;
    let toastTimer = null;
    let previousBodyOverflow = '';

    function cacheElements() {
        const root = document.getElementById(OVERLAY_ID);
        if (!root) {
            cached = null;
            return null;
        }

        cached = {
            root,
            monthGrid: root.querySelector('#calendar-month-grid'),
            selectedList: root.querySelector('#calendar-selected-list'),
            selectionEmpty: root.querySelector('#calendar-selection-empty'),
            submitButton: root.querySelector('[data-calendar-submit]'),
            clearButton: root.querySelector('[data-calendar-clear]'),
            sidebarForm: root.querySelector('.calendar-form'),
            contactName: root.querySelector('#calendar-requester'),
            contactOrg: root.querySelector('#calendar-organization'),
            contactPhone: root.querySelector('#calendar-phone'),
            contactEmail: root.querySelector('#calendar-email'),
            contactNotes: root.querySelector('#calendar-notes'),
            slotModal: document.getElementById('calendar-slot-modal'),
            slotForm: document.querySelector('#calendar-slot-modal .calendar-slot-form'),
            slotDate: document.getElementById('calendar-slot-date'),
            slotType: document.getElementById('calendar-slot-type'),
            slotStart: document.getElementById('calendar-slot-start'),
            slotEnd: document.getElementById('calendar-slot-end'),
            slotNotes: document.getElementById('calendar-slot-notes'),
            slotError: document.getElementById('calendar-slot-error'),
            shareModal: document.getElementById('calendar-share-modal'),
            shareOutput: document.getElementById('calendar-share-output'),
            shareCopy: document.querySelector('[data-share-copy]'),
            toast: document.getElementById('calendar-toast')
        };

        return cached;
    }

    function ensureElements() {
        return cached || cacheElements();
    }

    function normaliseLanguage(code) {
        if (!code) return 'fr';
        return code.toLowerCase().startsWith('en') ? 'en' : 'fr';
    }

    function getStrings() {
        return UI_STRINGS[currentLang] || UI_STRINGS.fr;
    }

    function bindOpeners() {
        document.querySelectorAll('[data-calendar-open]').forEach((trigger) => {
            if (trigger.dataset.calendarBound === 'true') return;
            trigger.addEventListener('click', (event) => {
                event.preventDefault();
                openOverlay(trigger);
            });
            trigger.dataset.calendarBound = 'true';
        });
    }

    function openOverlay(trigger) {
        const els = ensureElements();
        if (!els || !els.root) return;

        if (trigger) {
            lastTrigger = trigger;
        }

        if (els.root.classList.contains('active')) return;

        previousBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.body.setAttribute(BODY_OVERLAY_ATTR, 'true');

        els.root.classList.add('active');
        els.root.classList.remove('inactive');
        els.root.setAttribute('aria-hidden', 'false');

        const closeBtn = els.root.querySelector('.calendar-overlay__close');
        if (closeBtn) {
            closeBtn.focus();
        }
    }

    function closeOverlay() {
        const els = ensureElements();
        if (!els || !els.root || !els.root.classList.contains('active')) return;

        closeSlotModal();
        closeShareModal();
        clearToast();

        els.root.classList.remove('active');
        els.root.classList.add('inactive');
        els.root.setAttribute('aria-hidden', 'true');

        document.body.style.overflow = previousBodyOverflow;
        document.body.removeAttribute(BODY_OVERLAY_ATTR);
        previousBodyOverflow = '';

        if (lastTrigger && typeof lastTrigger.focus === 'function') {
            lastTrigger.focus();
        }
        lastTrigger = null;
    }

    function handleOverlayClick(event) {
        if (!cached || !cached.root) return;
        const dismissTrigger = event.target.closest('[data-calendar-dismiss]');
        if (dismissTrigger && cached.root.contains(dismissTrigger)) {
            event.preventDefault();
            closeOverlay();
        }
    }

    function isOverlayOpen() {
        return Boolean(cached && cached.root && cached.root.classList.contains('active'));
    }

    function renderCalendar() {
        const els = ensureElements();
        if (!els || !els.monthGrid) return;

        const strings = getStrings();
        const fragment = document.createDocumentFragment();

        for (let index = 0; index < TOTAL_MONTHS; index += 1) {
            const monthDate = new Date(START_MONTH.getFullYear(), START_MONTH.getMonth() + index, 1);
            fragment.appendChild(buildMonth(monthDate, strings));
        }

        els.monthGrid.replaceChildren(fragment);
        updateCalendarSelections();
    }

    function buildMonth(date, strings) {
        const wrapper = document.createElement('article');
        wrapper.className = 'calendar-month';

        const heading = document.createElement('h3');
        heading.className = 'calendar-month__title';
        heading.textContent = capitalise(date.toLocaleString(strings.locale, { month: 'long', year: 'numeric' }));
        wrapper.appendChild(heading);

        const grid = document.createElement('div');
        grid.className = 'calendar-month__grid';

        strings.dayNames.forEach((dayName) => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-month__day';
            dayHeader.textContent = dayName;
            grid.appendChild(dayHeader);
        });

        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
        for (let pad = 0; pad < firstDay; pad += 1) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-month__cell is-empty';
            grid.appendChild(emptyCell);
        }

        const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day += 1) {
            const current = new Date(date.getFullYear(), date.getMonth(), day);
            const meta = getDayMeta(current);
            const state = mapMetaToStatus(meta);
            const cell = document.createElement('div');
            cell.className = 'calendar-month__cell';
            cell.textContent = String(day);
            const dateKey = formatDateKey(current);
            cell.dataset.date = dateKey;
            cell.dataset.defaultType = state.defaultType;
            cell.dataset.status = state.state;

            if (state.state === 'available') {
                cell.classList.add('is-available');
            } else if (state.state === 'tentative') {
                cell.classList.add('is-pending');
            } else {
                cell.classList.add('is-blocked');
            }

            if (state.interactive) {
                cell.tabIndex = 0;
                cell.setAttribute('role', 'button');
                cell.setAttribute('aria-pressed', selections.has(dateKey) ? 'true' : 'false');
            } else {
                cell.tabIndex = -1;
                cell.setAttribute('aria-disabled', 'true');
            }

            cell.setAttribute('aria-label', `${formatAriaDate(current, strings)}, ${strings.cellStatuses[state.state]}`);
            grid.appendChild(cell);
        }

        wrapper.appendChild(grid);
        return wrapper;
    }

    function getDayMeta(date) {
        const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        if (day < BASE_TODAY) return 'unavailable';
        if (day >= BOURSE_RANGE.start && day <= BOURSE_RANGE.end) return 'event';
        if (day.getTime() === HALLOWEEN.getTime()) return 'holiday';
        if (day >= HOLIDAY_RANGE.start && day <= HOLIDAY_RANGE.end) return 'holiday_period';
        if (day >= SPRING_BREAK_RANGE.start && day <= SPRING_BREAK_RANGE.end) return 'spring_break';

        if (day >= SUMMER_START) {
            if (day <= SUMMER_END) {
                return 'summer';
            }
            return 'after_june';
        }

        const weekDay = day.getDay();
        if (weekDay === 0 || weekDay === 6) {
            if (day < TWO_WEEKS_FROM_BASE) return 'unavailable';
            if (day <= TWO_MONTHS_FROM_BASE) return 'weekend_soon';
            return 'unavailable';
        }

        return 'available';
    }

    function mapMetaToStatus(meta) {
        switch (meta) {
            case 'available':
                return { state: 'available', interactive: true, defaultType: 'add' };
            case 'weekend_soon':
            case 'summer':
            case 'after_june':
                return { state: 'tentative', interactive: true, defaultType: 'hold' };
            default:
                return { state: 'blocked', interactive: false, defaultType: 'add' };
        }
    }

    function handleMonthGridClick(event) {
        if (!cached || !cached.monthGrid) return;
        const cell = event.target.closest('.calendar-month__cell');
        if (!cell || !cached.monthGrid.contains(cell)) return;
        if (!cell.dataset.date || cell.dataset.status === 'blocked') return;

        event.preventDefault();
        openSlotModal(cell.dataset.date, cell.dataset.defaultType);
    }

    function handleMonthGridKeydown(event) {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        handleMonthGridClick(event);
    }

    function openSlotModal(dateKey, defaultType) {
        const els = ensureElements();
        if (!els || !els.slotModal || !els.slotForm || !els.slotType) return;

        activeModal = { dateKey, defaultType: defaultType || 'add' };
        els.slotForm.reset();
        hideSlotError();

        const typeToUse = defaultType || 'add';
        els.slotType.value = typeToUse;
        updateSlotNotesPlaceholder(typeToUse);
        populateTimeControls(typeToUse);
        updateActiveModalLabels();

        els.slotModal.classList.add('active');
        els.slotModal.setAttribute('aria-hidden', 'false');

        const closeBtn = els.slotModal.querySelector('[data-slot-dismiss]');
        if (closeBtn) {
            closeBtn.focus();
        }
    }

    function closeSlotModal() {
        if (!cached || !cached.slotModal) return;
        cached.slotModal.classList.remove('active');
        cached.slotModal.setAttribute('aria-hidden', 'true');
        if (cached.slotForm) {
            cached.slotForm.reset();
        }
        hideSlotError();
        activeModal = null;
    }

    function isSlotModalOpen() {
        return Boolean(cached && cached.slotModal && cached.slotModal.classList.contains('active'));
    }

    function handleSlotModalClick(event) {
        if (!cached || !cached.slotModal) return;
        const dismissTrigger = event.target.closest('[data-slot-dismiss]');
        if (dismissTrigger && cached.slotModal.contains(dismissTrigger)) {
            event.preventDefault();
            closeSlotModal();
        }
    }

    function populateTimeControls(type) {
        if (!cached || !cached.slotStart || !cached.slotEnd) return;
        const config = SLOT_TYPES[type] || SLOT_TYPES.add;
        const strings = getStrings();
        const previousStart = cached.slotStart.value;
        const previousEnd = cached.slotEnd.value;

        cached.slotStart.replaceChildren();
        cached.slotEnd.replaceChildren();

        if (config.allowEmpty) {
            const startEmpty = document.createElement('option');
            startEmpty.value = '';
            startEmpty.textContent = strings.slotTimeAny;
            cached.slotStart.appendChild(startEmpty);

            const endEmpty = document.createElement('option');
            endEmpty.value = '';
            endEmpty.textContent = strings.slotTimeAny;
            cached.slotEnd.appendChild(endEmpty);
        }

        const startMinutes = config.range[0] * 60;
        const endMinutes = config.range[1] * 60;

        for (let minutes = startMinutes; minutes < endMinutes; minutes += config.increments) {
            const value = minutesToLabel(minutes);
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            cached.slotStart.appendChild(option);
        }

        for (let minutes = startMinutes + config.increments; minutes <= endMinutes; minutes += config.increments) {
            const value = minutesToLabel(minutes);
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            cached.slotEnd.appendChild(option);
        }

        if (config.allowEmpty) {
            cached.slotStart.value = '';
            cached.slotEnd.value = '';
        } else {
            const startOption = cached.slotStart.querySelector(`option[value="${previousStart}"]`);
            cached.slotStart.value = startOption ? previousStart : cached.slotStart.options[0]?.value || '';

            const endOption = cached.slotEnd.querySelector(`option[value="${previousEnd}"]`);
            if (endOption) {
                cached.slotEnd.value = previousEnd;
            } else if (cached.slotEnd.options.length > 0) {
                cached.slotEnd.value = cached.slotEnd.options[0].value;
            }
        }
    }

    function updateSlotTypeTexts() {
        if (!cached || !cached.slotType) return;
        const strings = getStrings();
        Array.from(cached.slotType.options).forEach((option) => {
            if (strings.slotTypeLabels[option.value]) {
                option.textContent = strings.slotTypeLabels[option.value];
            }
        });
    }

    function updateSlotNotesPlaceholder(type) {
        if (!cached || !cached.slotNotes) return;
        const strings = getStrings();
        cached.slotNotes.placeholder = type === 'cancel'
            ? strings.slotNotePlaceholderCancel
            : strings.slotNotePlaceholder;
    }

    function handleSlotTypeChange() {
        if (!cached || !cached.slotType) return;
        const selectedType = cached.slotType.value || 'add';
        updateSlotNotesPlaceholder(selectedType);
        populateTimeControls(selectedType);
        hideSlotError();
    }

    function hideSlotError() {
        if (!cached || !cached.slotError) return;
        cached.slotError.hidden = true;
        cached.slotError.textContent = '';
    }

    function showSlotError(message) {
        if (!cached || !cached.slotError) return;
        cached.slotError.hidden = false;
        cached.slotError.textContent = message;
    }

    function handleSlotFormSubmit(event) {
        event.preventDefault();
        if (!cached || !cached.slotType || !activeModal) return;

        const strings = getStrings();
        const type = cached.slotType.value || 'add';
        const start = cached.slotStart ? cached.slotStart.value : '';
        const end = cached.slotEnd ? cached.slotEnd.value : '';
        const note = cached.slotNotes ? cached.slotNotes.value.trim() : '';

        if (type !== 'cancel') {
            if (!start || !end) {
                showSlotError(strings.slotErrorMissingTime);
                return;
            }
            if (labelToMinutes(end) <= labelToMinutes(start)) {
                showSlotError(strings.slotErrorInvalidRange);
                return;
            }
        } else {
            if ((start && !end) || (!start && end)) {
                showSlotError(strings.slotErrorPartialTime);
                return;
            }
            if (start && end && labelToMinutes(end) <= labelToMinutes(start)) {
                showSlotError(strings.slotErrorInvalidRange);
                return;
            }
            if (!note) {
                showSlotError(strings.slotErrorMissingNote);
                if (cached.slotNotes) cached.slotNotes.focus();
                return;
            }
        }

        hideSlotError();

        const slot = {
            type,
            start: start || null,
            end: end || null,
            note
        };

        const existing = selections.get(activeModal.dateKey) || [];
        existing.push(slot);
        selections.set(activeModal.dateKey, existing);

        updateSelectionsList();
        closeSlotModal();
        showToast(strings.toastSlotAdded);
    }

    function updateActiveModalLabels() {
        if (!activeModal || !cached || !cached.slotDate) return;
        const strings = getStrings();
        const dateObj = parseDateKey(activeModal.dateKey);
        cached.slotDate.textContent = capitalise(dateObj.toLocaleDateString(strings.locale, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }));
    }

    function updateCalendarSelections() {
        const els = ensureElements();
        if (!els || !els.monthGrid) return;

        els.monthGrid.querySelectorAll('.calendar-month__cell').forEach((cell) => {
            if (!cell.dataset.date) return;
            if (selections.has(cell.dataset.date) && selections.get(cell.dataset.date).length > 0) {
                cell.classList.add('is-selected');
                cell.setAttribute('aria-pressed', 'true');
            } else {
                cell.classList.remove('is-selected');
                cell.setAttribute('aria-pressed', 'false');
            }
        });
    }

    function updateSelectionsList() {
        const els = ensureElements();
        if (!els || !els.selectedList || !els.selectionEmpty) return;

        const strings = getStrings();
        const entries = Array.from(selections.entries())
            .filter(([, slots]) => Array.isArray(slots) && slots.length > 0)
            .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

        els.selectedList.replaceChildren();
        let count = 0;

        entries.forEach(([dateKey, slots]) => {
            const dateObj = parseDateKey(dateKey);
            slots.forEach((slot, index) => {
                const item = document.createElement('li');

                const summary = document.createElement('span');
                summary.className = 'calendar-selection__slot';
                summary.textContent = formatSelectionLine(dateObj, slot, strings);
                item.appendChild(summary);

                if (slot.note) {
                    const note = document.createElement('span');
                    note.className = 'calendar-selection__note';
                    note.textContent = slot.note;
                    item.appendChild(note);
                }

                const remove = document.createElement('button');
                remove.type = 'button';
                remove.className = 'calendar-selection__remove';
                remove.setAttribute('data-selection-remove', 'true');
                remove.dataset.date = dateKey;
                remove.dataset.index = String(index);
                remove.textContent = strings.selectionRemove;
                item.appendChild(remove);

                els.selectedList.appendChild(item);
                count += 1;
            });
        });

        els.selectionEmpty.hidden = count > 0;
        updateCalendarSelections();
    }

    function handleSelectionListClick(event) {
        const button = event.target.closest('[data-selection-remove]');
        if (!button) return;

        const dateKey = button.dataset.date;
        const index = Number(button.dataset.index);
        const strings = getStrings();

        if (!selections.has(dateKey)) return;
        const slots = selections.get(dateKey);
        if (!Array.isArray(slots) || Number.isNaN(index) || index < 0 || index >= slots.length) return;

        slots.splice(index, 1);
        if (slots.length === 0) {
            selections.delete(dateKey);
        } else {
            selections.set(dateKey, slots);
        }

        updateSelectionsList();
        showToast(strings.toastSlotRemoved);
    }

    function handleClearSelections(event) {
        event.preventDefault();
        const els = ensureElements();
        if (!els) return;

        selections.clear();
        if (els.sidebarForm) {
            els.sidebarForm.reset();
        }

        updateSelectionsList();
        showToast(getStrings().toastCleared);
    }

    function getSelectionCount() {
        let total = 0;
        selections.forEach((slots) => {
            if (Array.isArray(slots)) {
                total += slots.length;
            }
        });
        return total;
    }

    function handleRequestSubmit(event) {
        event.preventDefault();
        const els = ensureElements();
        if (!els) return;

        const strings = getStrings();
        const name = (els.contactName?.value || '').trim();
        const phone = (els.contactPhone?.value || '').trim();
        const email = (els.contactEmail?.value || '').trim();

        if (!name) {
            showToast(strings.submitMissingName);
            if (els.contactName) els.contactName.focus();
            return;
        }

        if (!phone && !email) {
            showToast(strings.submitMissingContact);
            if (els.contactPhone) els.contactPhone.focus();
            return;
        }

        if (getSelectionCount() === 0) {
            showToast(strings.submitMissingSelections);
            return;
        }

        if (els.shareOutput) {
            els.shareOutput.value = buildShareSummary(strings);
        }

        openShareModal();
        showToast(strings.toastRequestReady);
    }

    function buildShareSummary(strings) {
        const els = ensureElements();
        if (!els) return '';

        const name = (els.contactName?.value || '').trim();
        const org = (els.contactOrg?.value || '').trim();
        const phone = (els.contactPhone?.value || '').trim();
        const email = (els.contactEmail?.value || '').trim();
        const notes = (els.contactNotes?.value || '').trim();

        const lines = [
            strings.shareHeader,
            '',
            `${strings.shareContact.name}: ${name || strings.shareNotProvided}`,
            `${strings.shareContact.organization}: ${org || strings.shareNotProvided}`,
            `${strings.shareContact.phone}: ${phone || strings.shareNotProvided}`,
            `${strings.shareContact.email}: ${email || strings.shareNotProvided}`,
            `${strings.shareContact.notes}: ${notes || strings.shareNotProvided}`,
            '',
            `${strings.shareRequestTitle}:`
        ];

        const entries = Array.from(selections.entries())
            .filter(([, slots]) => Array.isArray(slots) && slots.length > 0)
            .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

        entries.forEach(([dateKey, slots]) => {
            const dateObj = parseDateKey(dateKey);
            const dateLabel = capitalise(dateObj.toLocaleDateString(strings.locale, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }));

            slots.forEach((slot) => {
                const typeLabel = strings.slotTypeShort[slot.type] || slot.type;
                const timeLabel = slot.start && slot.end ? strings.slotTimeLabel(slot.start, slot.end) : '';
                lines.push(strings.shareSlotLine({
                    dateLabel,
                    typeLabel,
                    timeLabel,
                    note: slot.note || ''
                }));
            });
        });

        lines.push('', strings.shareFooter);
        return lines.join('\n');
    }

    function openShareModal() {
        const els = ensureElements();
        if (!els || !els.shareModal) return;

        els.shareModal.classList.add('active');
        els.shareModal.setAttribute('aria-hidden', 'false');

        const focusTarget = els.shareModal.querySelector('[data-share-copy]');
        if (focusTarget) {
            focusTarget.focus();
        }
    }

    function closeShareModal() {
        if (!cached || !cached.shareModal) return;
        cached.shareModal.classList.remove('active');
        cached.shareModal.setAttribute('aria-hidden', 'true');
    }

    function isShareModalOpen() {
        return Boolean(cached && cached.shareModal && cached.shareModal.classList.contains('active'));
    }

    function handleShareModalClick(event) {
        if (!cached || !cached.shareModal) return;
        const dismissTrigger = event.target.closest('[data-share-dismiss]');
        if (dismissTrigger && cached.shareModal.contains(dismissTrigger)) {
            event.preventDefault();
            closeShareModal();
        }
    }

    function handleShareCopy(event) {
        event.preventDefault();
        const els = ensureElements();
        if (!els || !els.shareOutput) return;

        const strings = getStrings();
        const text = els.shareOutput.value;
        if (!text) return;

        const fallbackCopy = () => {
            els.shareOutput.focus();
            els.shareOutput.select();
            document.execCommand('copy');
            showToast(strings.toastCopied);
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text)
                .then(() => showToast(strings.toastCopied))
                .catch(fallbackCopy);
        } else {
            fallbackCopy();
        }
    }

    function showToast(message) {
        if (!cached || !cached.toast || !message) return;

        cached.toast.textContent = message;
        cached.toast.classList.add('is-visible');

        if (toastTimer) {
            clearTimeout(toastTimer);
        }

        toastTimer = setTimeout(() => {
            if (cached && cached.toast) {
                cached.toast.classList.remove('is-visible');
            }
        }, 3200);
    }

    function clearToast() {
        if (!cached || !cached.toast) return;
        cached.toast.classList.remove('is-visible');
        cached.toast.textContent = '';
        if (toastTimer) {
            clearTimeout(toastTimer);
            toastTimer = null;
        }
    }

    function handleGlobalKeyDown(event) {
        if (event.key !== 'Escape') return;

        if (isShareModalOpen()) {
            event.preventDefault();
            closeShareModal();
            return;
        }

        if (isSlotModalOpen()) {
            event.preventDefault();
            closeSlotModal();
            return;
        }

        if (isOverlayOpen()) {
            event.preventDefault();
            closeOverlay();
        }
    }

    function refreshUI() {
        const els = ensureElements();
        if (!els) return;

        updateSlotTypeTexts();
        renderCalendar();
        updateSelectionsList();
        updateSlotNotesPlaceholder(els.slotType ? els.slotType.value : 'add');

        if (activeModal) {
            updateActiveModalLabels();
            populateTimeControls(els.slotType ? els.slotType.value : activeModal.defaultType);
        }

        if (isShareModalOpen() && els.shareOutput) {
            els.shareOutput.value = buildShareSummary(getStrings());
        }
    }

    function formatSelectionLine(dateObj, slot, strings) {
        const parts = [capitalise(dateObj.toLocaleDateString(strings.locale, { weekday: 'short', month: 'short', day: 'numeric' }))];
        parts.push(strings.slotTypeShort[slot.type] || slot.type);
        if (slot.start && slot.end) {
            parts.push(strings.slotTimeLabel(slot.start, slot.end));
        } else if (slot.start || slot.end) {
            parts.push(slot.start || slot.end);
        }
        return parts.join(' · ');
    }

    function minutesToLabel(totalMinutes) {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    function labelToMinutes(label) {
        if (!label) return 0;
        const [hours, minutes] = label.split(':').map(Number);
        return (Number.isNaN(hours) ? 0 : hours) * 60 + (Number.isNaN(minutes) ? 0 : minutes);
    }

    function parseDateKey(key) {
        const [year, month, day] = key.split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    function formatDateKey(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function formatAriaDate(date, strings) {
        return capitalise(date.toLocaleDateString(strings.locale, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }));
    }

    function capitalise(value) {
        if (!value) return value;
        return value.charAt(0).toUpperCase() + value.slice(1);
    }

    function init() {
        const els = ensureElements();
        bindOpeners();
        if (!els) return;

        if (!initialised) {
            if (els.monthGrid) {
                els.monthGrid.addEventListener('click', handleMonthGridClick);
                els.monthGrid.addEventListener('keydown', handleMonthGridKeydown);
            }
            if (els.slotForm) {
                els.slotForm.addEventListener('submit', handleSlotFormSubmit);
            }
            if (els.slotType) {
                els.slotType.addEventListener('change', handleSlotTypeChange);
            }
            if (els.selectedList) {
                els.selectedList.addEventListener('click', handleSelectionListClick);
            }
            if (els.clearButton) {
                els.clearButton.addEventListener('click', handleClearSelections);
            }
            if (els.submitButton) {
                els.submitButton.addEventListener('click', handleRequestSubmit);
            }
            if (els.shareCopy) {
                els.shareCopy.addEventListener('click', handleShareCopy);
            }
            if (els.slotModal) {
                els.slotModal.addEventListener('click', handleSlotModalClick);
            }
            if (els.shareModal) {
                els.shareModal.addEventListener('click', handleShareModalClick);
            }
            if (els.root && !els.root.hasAttribute('data-calendar-handled')) {
                els.root.addEventListener('click', handleOverlayClick);
                els.root.setAttribute('data-calendar-handled', 'true');
            }

            document.addEventListener('keydown', handleGlobalKeyDown);
            initialised = true;
        }

        updateSlotTypeTexts();
        updateSlotNotesPlaceholder(els.slotType ? els.slotType.value : 'add');
        renderCalendar();
        updateSelectionsList();
    }

    function handleLanguageChange(event) {
        currentLang = normaliseLanguage(event?.detail?.language);
        refreshUI();
    }

    document.addEventListener('global:loaded', init);
    document.addEventListener('DOMContentLoaded', init);
    window.addEventListener('languageChange', handleLanguageChange);
})();
document.addEventListener('DOMContentLoaded', () => {
    const calendarContainer = document.getElementById('calendar-container');
    const modal = document.getElementById('selection-modal');
    const modalDateDisplay = document.getElementById('modal-date-display');
    const modalTimeInput = document.getElementById('modal-time-input');
    const modalCancel = document.getElementById('modal-cancel');
    const modalConfirm = document.getElementById('modal-confirm');

    let selectedDate = null;
    let selectedTimes = [];

    // Generate months from September 2025 to August 2026
    const months = [];
    for (let year = 2025; year <= 2026; year++) {
        for (let month = 0; month < 12; month++) {
            if (year === 2025 && month < 8) continue; // Start from September 2025
            if (year === 2026 && month > 7) continue; // End at August 2026
            months.push({ year, month });
        }
    }

    // Generate calendar for each month
    months.forEach(({ year, month }) => {
        const monthDiv = document.createElement('div');
        monthDiv.className = 'bg-white rounded-lg shadow-md p-4';

        const monthName = new Date(year, month).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        monthDiv.innerHTML = `<h3 class="text-xl font-semibold mb-4 text-center">${monthName}</h3>`;

        const calendarGrid = document.createElement('div');
        calendarGrid.className = 'grid grid-cols-7 gap-1';

        // Days of week
        const daysOfWeek = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        daysOfWeek.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'text-center font-medium text-gray-600 py-2';
            dayHeader.textContent = day;
            calendarGrid.appendChild(dayHeader);
        });

        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Empty cells for days before first day
        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'py-2';
            calendarGrid.appendChild(emptyCell);
        }

        // Days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'text-center py-2 cursor-pointer hover:bg-blue-100 rounded';
            dayCell.textContent = day;

            const currentDate = new Date(year, month, day);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (currentDate >= today) {
                dayCell.addEventListener('click', () => {
                    selectedDate = currentDate;
                    modalDateDisplay.textContent = `Date: ${currentDate.toLocaleDateString('fr-FR')}`;
                    modalTimeInput.value = '';
                    modal.classList.remove('hidden');
                });
            } else {
                dayCell.classList.add('text-gray-400', 'cursor-not-allowed');
            }

            calendarGrid.appendChild(dayCell);
        }

        monthDiv.appendChild(calendarGrid);
        calendarContainer.appendChild(monthDiv);
    });

    // Modal events
    modalCancel.addEventListener('click', () => {
        modal.classList.add('hidden');
        selectedDate = null;
    });

    modalConfirm.addEventListener('click', () => {
        const timeInput = modalTimeInput.value.trim();
        if (!timeInput) {
            alert('Veuillez entrer une plage horaire.');
            return;
        }

        // Validate time format (simple check)
        const timeRegex = /^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/;
        const match = timeInput.match(timeRegex);
        if (!match) {
            alert('Format invalide. Utilisez ex: 9:00 - 11:30');
            return;
        }

        const startTime = match[1];
        const endTime = match[2];

        // Check if times are between 9:00 and 16:00
        const startHour = parseInt(startTime.split(':')[0]);
        const endHour = parseInt(endTime.split(':')[0]);
        if (startHour < 9 || endHour > 16 || startHour >= endHour) {
            alert('Les heures doivent être entre 9h00 et 16h00, et l\'heure de fin après l\'heure de début.');
            return;
        }

        // Generate mailto
        const subject = encodeURIComponent('Demande de réservation de glace');
        const body = encodeURIComponent(`Bonjour,

Je souhaite réserver du temps de glace pour la date suivante :

Date: ${selectedDate.toLocaleDateString('fr-FR')}
Plage horaire: ${timeInput}

Veuillez me contacter pour confirmer la disponibilité et procéder à la réservation.

Cordialement,
[Votre nom]`);

        const mailtoLink = `mailto:reservation@arena-lareau.com?subject=${subject}&body=${body}`;
        window.location.href = mailtoLink;

        modal.classList.add('hidden');
        selectedDate = null;
    });

    // Close modal on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
            selectedDate = null;
        }
    });
}); 
 
        document.addEventListener('DOMContentLoaded', () => {
            // === DOM Elements ===
            const calendarGrid = document.getElementById('calendar-grid');
            const calendarTitle = document.getElementById('calendar-title');
            const prevBtn = document.getElementById('prev-month');
            const nextBtn = document.getElementById('next-month');
            
            // State for overlay calendar
            let currentMonth = new Date.now();
            const today = new Date.now();
            
            // Generate calendar for one month
            function generateMonthCalendar() {
                if (!calendarGrid || !calendarTitle) return;
                
                const year = currentMonth.getFullYear();
                const month = currentMonth.getMonth();
                const monthName = currentMonth.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
                
                calendarTitle.textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);
                
                // Clear grid
                calendarGrid.innerHTML = '';
                
                // Day headers
                const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
                dayNames.forEach(day => {
                    const header = document.createElement('div');
                    header.className = 'text-center font-semibold p-2 text-gray-600';
                    header.textContent = day;
                    calendarGrid.appendChild(header);
                });
                
                // Calendar grid setup
                calendarGrid.style.display = 'grid';
                calendarGrid.style.gridTemplateColumns = 'repeat(7, 1fr)';
                calendarGrid.style.gap = '4px';
                
                // Get first day of month and days in month
                const firstDay = new Date(year, month, 1).getDay();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                
                // Empty cells before first day
                for (let i = 0; i < firstDay; i++) {
                    calendarGrid.appendChild(document.createElement('div'));
                }
                
                // Day cells
                for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(year, month, day);
                    const dayCell = document.createElement('div');
                    dayCell.textContent = day;
                    dayCell.className = 'p-3 text-center rounded-md transition-all';
                    
                    // Determine day status and styling
                    const isPast = date < today;
                    const isEvent = (year === 2025 && month === 10 && day <= 21); // Event until Nov 21
                    const isWeekend = (date.getDay() === 0 || date.getDay() === 6);
                    const isHoliday = isHolidayDate(date);
                    const twoWeeksOut = new Date(today);
                    twoWeeksOut.setDate(today.getDate() + 14);
                    const isReservableWeekend = isWeekend && date >= twoWeeksOut;
                    
                    if (isPast) {
                        dayCell.style.cssText = 'background-color: #fecaca; color: #9ca3af; cursor: not-allowed;';
                    } else if (isEvent) {
                        dayCell.style.cssText = 'background-color: #f59e0b; color: #1f2937; cursor: default; font-weight: 600;';
                    } else if (isHoliday) {
                        dayCell.style.cssText = 'background: repeating-linear-gradient(-45deg, #dc2626, #dc2626 8px, #059669 8px, #059669 16px); color: white; font-weight: 600; text-decoration: underline;';
                    } else if (isReservableWeekend) {
                        dayCell.style.cssText = 'background-color: #f97316; color: white; cursor: pointer;';
                    } else if (isWeekend) {
                        dayCell.style.cssText = 'background-color: #fecaca; color: #9ca3af; cursor: not-allowed;';
                    } else {
                        dayCell.style.cssText = 'background-color: #059669; color: white; cursor: pointer;';
                    }
                    
                    calendarGrid.appendChild(dayCell);
                }
            }
            
            // Check if date is a holiday
            function isHolidayDate(date) {
                const y = date.getFullYear();
                const m = date.getMonth();
                const d = date.getDate();
                
                // Christmas period (Dec 22 - Jan 9)
                if ((y === 2025 && m === 11 && d >= 22) || (y === 2026 && m === 0 && d <= 9)) return true;
                // Spring break (March 2-6, 2026)
                if (y === 2026 && m === 2 && d >= 2 && d <= 6) return true;
                // Halloween
                if (m === 9 && d === 31) return true;
                
                return false;
            }
            
            // Navigation handlers
            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    currentMonth.setMonth(currentMonth.getMonth() - 1);
                    generateMonthCalendar();
                });
            }
            
            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    currentMonth.setMonth(currentMonth.getMonth() + 1);
                    generateMonthCalendar();
                });
            }
            
            // Initial render
            generateMonthCalendar();
            
            // Footer
            const footerToggle = document.getElementById('footer-calendar-toggle');
            const footerPreviewModal = document.getElementById('footer-preview-modal');
            const footerPreviewClose = document.getElementById('footer-preview-close');
            const footerCalendarContainer = document.getElementById('container-footer-calendar');
            const footerLegendContainer = document.getElementById('container-footer-legend');
            const mainLegendContainer = document.querySelector('#main-legend .grid');

            // Modales
            const modal = document.getElementById('selection-modal');
            const modalDateDisplay = document.getElementById('modal-date-display');
            const modalRequestType = document.getElementById('modal-request-type');
            const modalTimeWrapper = document.getElementById('modal-time-wrapper');
            const modalTimeStart = document.getElementById('modal-time-start');
            const modalTimeEnd = document.getElementById('modal-time-end');
            const modalTimeError = document.getElementById('modal-time-error');
            const modalReasonWrapper = document.getElementById('modal-reason-wrapper');
            const modalReason = document.getElementById('modal-reason');
            const modalConfirm = document.getElementById('modal-confirm');
            const modalCancel = document.getElementById('modal-cancel');
            
            // Mailto
            const mailtoModal = document.getElementById('mailto-modal');
            const mailtoModalLink = document.getElementById('mailto-modal-link');
            const mailtoFallbackBody = document.getElementById('mailto-fallback-body');
            const mailtoHtmlBody = document.getElementById('mailto-html-body');
            const mailtoModalClose = document.getElementById('mailto-modal-close');
            
            // Infos
            const confirmReservationBtn = document.getElementById('confirm-reservation-btn');
            const requesterName = document.getElementById('requester-name');
            const requesterPhone = document.getElementById('requester-phone');
            const requesterAvailability = document.getElementById('requester-availability');
            const messageBox = document.getElementById('message-box');
            const langToggle = document.getElementById('lang-toggle');
            
            
            const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const twoWeeksFromNow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 14);
            const twoMonthsFromNow = new Date(today.getFullYear(), today.getMonth() + 2, today.getDate());

            let selectedCell = null;
            let selectedDateInfo = null;
            const selections = {}; 
            let currentLang = 'fr';
            
            // === Traductions (uiStrings) ===
            const uiStrings = {
                fr: {
                    dayNames: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
                    infoTitle: 'Vos informations',
                    infoName: 'Nom complet',
                    infoNamePlaceholder: 'Votre nom',
                    infoPhone: 'Téléphone',
                    infoPhonePlaceholder: 'Votre numéro',
                    infoAvail: 'Fenêtre de disponibilité (optionnel)',
                    infoAvailPlaceholder: 'ex: Je suis aussi disponible les mardis après-midi...',
                    confirmBtn: 'Confirmer et Envoyer la Réservation',
                    modalTitle: 'Faire une réservation',
                    modalDate: 'Date: ',
                    modalReqType: 'Type de demande',
                    modalReqAdd: 'Ajout (9h-16h)',
                    modalReqAddHigh: 'Ajout - Période achalandée (16h-22h)',
                    modalReqRemove: 'Requête spéciale (Retrait, etc.)',
                    modalTime: 'Plage horaire',
                    modalTimeError: "L'heure de fin doit être après l'heure de début.",
                    modalReason: 'Motif de la requête spéciale',
                    modalReasonPlaceholder: 'ex: Demande de retrait 10h-11h',
                    modalReasonError: "Veuillez entrer un motif.",
                    modalCancel: 'Annuler',
                    modalConfirm: 'Confirmer',
                    mailModalTitle: 'Confirmez votre envoi',
                    mailModalOpt1: 'Option 1 : Cliquez pour ouvrir votre client de messagerie (texte simple seulement).',
                    mailModalLink: 'Ouvrir mon client de messagerie (Fallback)',
                    mailModalOpt2: 'Option 2 (Recommandée) : Copiez le contenu formaté ci-dessous et collez-le dans un nouvel e-mail adressé à :',
                    mailModalClose: 'Fermer',
                    errorNoName: 'Veuillez entrer votre nom et votre numéro de téléphone.',
                    errorNoSelection: 'Veuillez sélectionner au moins une plage horaire.',
                    locale: 'fr-FR',
                    weekDay: 'long',
                    receptionTimeConnector: "à",
                    emailDate: "Date",
                    emailType: "+/-",
                    emailContent: "Plage Horaire / Requête",
                    emailDesiredDates: "DATES SOUHAITÉES",
                    emailThanks: "Merci.",
                    toggleLang: 'EN',
                    legendTitle: 'Légende',
                    footerLink: 'Calendrier :',
                    footerLinkView: 'Aperçu',
                    footerPreviewTitle: 'Aperçu du Calendrier',
                    legend: {
                        "available": "Disponible (Semaine)",
                        "weekend_soon": "Disponible (FDS / Sur-demande)",
                        "selected": "Votre sélection",
                        "event": "Événement (Bourse)",
                        "holiday_period": "Congé des Fêtes (Souligné)",
                        "spring_break": "Relâche (Bleu/Gris)",
                        "summer": "Estival (Bleu/Vert)",
                        "after_june": "Après 1er Juin (Bleu 'M')",
                        "unavailable": "Passé / Indisponible"
                    },
                    footerLegend: {
                        "available": "Disponible",
                        "selected": "Sélection",
                        "holiday_period": "Congés",
                        "unavailable": "Indisponible"
                    }
                },
                en: {
                    dayNames: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                    infoTitle: 'Your Information',
                    infoName: 'Full Name',
                    infoNamePlaceholder: 'Your name',
                    infoPhone: 'Phone',
                    infoPhonePlaceholder: 'Your number',
                    infoAvail: 'Availability window (optional)',
                    infoAvailPlaceholder: 'ex: I am also available Tuesday afternoons...',
                    confirmBtn: 'Confirm and Send Reservation',
                    modalTitle: 'Make a Reservation',
                    modalDate: 'Date: ',
                    modalReqType: 'Request Type',
                    modalReqAdd: 'Add (9am-4pm)',
                    modalReqAddHigh: 'Add - High-demand period (4pm-10pm)',
                    modalReqRemove: 'Special Request (Removal, etc.)',
                    modalTime: 'Time Slot',
                    modalTimeError: 'End time must be after start time.',
                    modalReason: 'Reason for special request',
                    modalReasonPlaceholder: 'ex: Request removal 10am-11am',
                    modalReasonError: "Please enter a reason.",
                    modalCancel: 'Cancel',
                    modalConfirm: 'Confirm',
                    mailModalTitle: 'Confirm Your Submission',
                    mailModalOpt1: 'Option 1: Click to open your email client (plain text only).',
                    mailModalLink: 'Open My Email Client (Fallback)',
                    mailModalOpt2: 'Option 2 (Recommended): Copy the formatted content below and paste it into a new email addressed to:',
                    mailModalClose: 'Close',
                    errorNoName: 'Please enter your name and phone number.',
                    errorNoSelection: 'Please select at least one time slot.',
                    locale: 'en-US',
                    weekDay: 'long',
                    receptionTimeConnector: "at",
                    emailDate: "Date",
                    emailType: "+/-",
                    emailContent: "Time Slot / Request",
                    emailDesiredDates: "DESIRED DATES",
                    emailThanks: "Thank you.",
                    toggleLang: 'FR',
                    legendTitle: 'Legend',
                    footerLink: 'Calendar:',
                    footerLinkView: 'Preview',
                    footerPreviewTitle: 'Calendar Preview',
                    legend: {
                        "available": "Available (Weekday)",
                        "weekend_soon": "Available (Weekend / High-demand)",
                        "selected": "Your Selection",
                        "event": "Event (Bourse)",
                        "holiday_period": "Holidays (Underlined)",
                        "spring_break": "Spring Break (Blue/Grey)",
                        "summer": "Summer (Blue/Green)",
                        "after_june": "After June 1st (Blue 'M')",
                        "unavailable": "Past / Unavailable"
                    },
                    footerLegend: {
                        "available": "Available",
                        "selected": "Selection",
                        "holiday_period": "Holidays",
                        "unavailable": "Unavailable"
                    }
                }
            };

            // === Fonctions de Validation ===
            
            function validateName() {
                const name = requesterName.value.trim();
                if (name !== '') {
                    requesterName.style.borderColor = 'var(--success-color)';
                    requesterName.style.borderWidth = '2px';
                } else {
                    requesterName.style.borderColor = '#d1d5db';
                    requesterName.style.borderWidth = '1px';
                }
            }
            function formatAndValidatePhone(e) {
                let cleanVal = e.target.value.replace(/\D/g, ''); 
                if (cleanVal.length > 10) cleanVal = cleanVal.substring(0, 10);
                let finalVal = '';
                if (cleanVal.length > 6) finalVal = `${cleanVal.substring(0, 3)}-${cleanVal.substring(3, 6)}-${cleanVal.substring(6)}`;
                else if (cleanVal.length > 3) finalVal = `${cleanVal.substring(0, 3)}-${cleanVal.substring(3)}`;
                else finalVal = cleanVal;
                e.target.value = finalVal;
                const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
                if (phoneRegex.test(finalVal)) {
                    requesterPhone.style.borderColor = 'var(--success-color)';
                    requesterPhone.style.borderWidth = '2px';
                } else {
                    requesterPhone.style.borderColor = '#d1d5db';
                    requesterPhone.style.borderWidth = '1px';
                }
            }

            // === Fonction de Traduction ===
            
            function setLanguage(lang) {
                currentLang = lang;
                const s = uiStrings[lang];
                document.documentElement.lang = lang;
                
                // Traduction des éléments statiques
                document.querySelectorAll('[data-lang]').forEach(el => {
                    const key = el.dataset.lang;
                    if (s[key]) el.textContent = s[key];
                });
                document.querySelectorAll('[data-lang-placeholder]').forEach(el => {
                    const key = el.dataset.langPlaceholder;
                    if (s[key]) el.placeholder = s[key];
                });
                
                // Mettre à jour les labels
                langToggle.textContent = s.toggleLang;
                document.querySelector('label[for="requester-name"]').textContent = s.infoName;
                document.querySelector('label[for="requester-phone"]').textContent = s.infoPhone;
                document.querySelector('label[for="requester-availability"]').textContent = s.infoAvail;
                confirmReservationBtn.textContent = s.confirmBtn;
                document.querySelector('label[for="modal-request-type"]').textContent = s.modalReqType;
                modalTimeWrapper.querySelector('label').textContent = s.modalTime;
                modalReasonWrapper.querySelector('label').textContent = s.modalReason;
                mailtoModal.querySelectorAll('p')[1].innerHTML = `${s.mailModalOpt2} <strong style="color: var(--text-color);">glaplante@csrlc.ca</strong>`;

                // Recréer les éléments dynamiques
                generateCalendars(); // Grille principale (12 mois)
                generateFooterCalendars(); // Aperçu footer (2 mois)
                populateLegends(); // Les deux légendes
            }

            // === Fonctions Logiques (Couleurs, Dates) ===
            
            function getSpecialDayInfo(date) {
                const y = date.getFullYear();
                const m = date.getMonth(); // 0-11
                const d = date.getDate();
                const dayOfWeek = date.getDay();
 
                // 1. Jours passés
                if (date < todayDateOnly) {
                    return { type: 'unavailable', class: 'unavailable', cssVar: 'var(--error-color)', stamp: null };
                }
 
                // 2. Événement "Bourse" (jusqu'au 21 Nov 2025)
                if (y === 2025 && m === 10 && d <= 21) {
                    return { type: 'event', class: 'bg-event', cssVar: 'var(--warning-color)', stamp: null };
                }
                
                // 3. Après le 1er Juin 2026
                if (date >= new Date(2026, 5, 1)) {
                     return { type: 'after_june', class: 'bg-after-june', cssVar: 'var(--calendar-hover-bg)', stamp: 'M' };
                }
                
                // 4. Période estivale (Juin, Juillet, Août 2026)
                if (y === 2026 && m >= 5 && m <= 7) {
                    return { type: 'summer', class: 'bg-striped-summer', cssVar: 'var(--success-color)', stamp: null };
                }

                // 5. Halloween
                if (m === 9 && d === 31) {
                    return { type: 'holiday', class: 'bg-striped-halloween', cssVar: 'var(--high-demand-color)', stamp: null };
                }
                
                // 6. Période des Fêtes (22 Déc au 9 Jan)
                if ((y === 2025 && m === 11 && d >= 22) || (y === 2026 && m === 0 && d <= 9)) {
                    return { type: 'holiday_period', class: 'bg-striped-holiday', cssVar: 'var(--error-color)', stamp: null };
                }
                
                // 7. Semaine de relâche (Semaine du 2 Mars 2026)
                if (y === 2026 && m === 2 && d >= 2 && d <= 6) {
                    return { type: 'spring_break', class: 'bg-striped-spring-break', cssVar: 'var(--calendar-hover-bg)', stamp: null };
                }
                
                // 8. Logique des Week-ends
                if (dayOfWeek === 0 || dayOfWeek === 6) {
                    if (date < twoWeeksFromNow) return { type: 'unavailable', class: 'unavailable', cssVar: 'var(--error-color)', stamp: null };
                    if (date >= twoWeeksFromNow && date <= twoMonthsFromNow) return { type: 'weekend_soon', class: 'bg-high-demand', cssVar: 'var(--high-demand-color)', stamp: null };
                    else return { type: 'unavailable', class: 'unavailable', cssVar: 'var(--error-color)', stamp: null };
                }
                
                // 9. Jours de semaine normaux
                return { type: 'available', class: 'available', cssVar: 'var(--success-color)', stamp: null };
            }
 
            function populateTimeDropdowns(type = 'add') {
                modalTimeStart.innerHTML = '';
                modalTimeEnd.innerHTML = '';
                let startHour, endHour;
                if (type === 'add_high') { startHour = 16; endHour = 22; }
                else { startHour = 9; endHour = 16; }
                for (let h = startHour; h <= endHour; h++) {
                    if (h < endHour) {
                        modalTimeStart.add(new Option(`${h}:00`, `${h}:00`));
                        modalTimeStart.add(new Option(`${h}:30`, `${h}:30`));
                    }
                    if (h > startHour) {
                        if(h < endHour || (h === endHour && type === 'add')) modalTimeEnd.add(new Option(`${h}:00`, `${h}:00`));
                        if(h <= endHour && h > startHour) modalTimeEnd.add(new Option(`${h}:30`, `${h}:30`));
                    }
                }
                // Ajustements manuels pour les bornes
                if(type === 'add') {
                    if(modalTimeEnd.options[0].value !== "9:30") modalTimeEnd.add(new Option("9:30", "9:30"), 0);
                    if(modalTimeEnd.options[modalTimeEnd.options.length-1].value !== "16:00") modalTimeEnd.add(new Option("16:00", "16:00"));
                }
                if(type === 'add_high') {
                    if(modalTimeEnd.options[0].value !== "16:30") modalTimeEnd.add(new Option("16:30", "16:30"), 0);
                    if(modalTimeEnd.options[modalTimeEnd.options.length-1].value !== "22:00") modalTimeEnd.add(new Option("22:00", "22:00"));
                }
            }
            
            // === Fonctions de Rendu ===

            /**
             * Crée UN calendrier pour un mois donné
             */
            function createMonthCalendar(date, context = 'main') {
                const s = uiStrings[currentLang];
                const dayNames = s.dayNames;
                const year = date.getFullYear();
                const month = date.getMonth();
                const monthName = date.toLocaleString(s.locale, { month: 'long' });
                const monthNumber = month + 1;

                // Conteneur principal
                const monthWrapper = document.createElement('div');
                if (context === 'main') {
                    monthWrapper.className = 'calendar-month-grid';
                } else { // 'footer'
                    monthWrapper.className = 'footer-calendar';
                }

                const title = document.createElement('h2');
                title.className = 'text-center mb-4';
                title.textContent = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} - ${monthNumber}`;
                if(context === 'main') title.className += ' text-2xl font-semibold';
                else title.className += ' text-lg font-semibold';
                monthWrapper.appendChild(title);

                const daysGrid = document.createElement('div');
                daysGrid.className = 'calendar-grid';

                dayNames.forEach(day => {
                    const dayHeader = document.createElement('div');
                    dayHeader.className = (context === 'main') ? 'day-header' : 'day-header text-center';
                    dayHeader.textContent = day;
                    daysGrid.appendChild(dayHeader);
                });

                const firstDayOfMonth = new Date(year, month, 1).getDay();
                const daysInMonth = new Date(year, month + 1, 0).getDate();

                for (let j = 0; j < firstDayOfMonth; j++) {
                    daysGrid.appendChild(document.createElement('div'));
                }

                for (let day = 1; day <= daysInMonth; day++) {
                    const dayCell = document.createElement('div');
                    const dayDate = new Date(year, month, day);
                    const dateString = dayDate.toISOString().split('T')[0];
                    const dayInfo = getSpecialDayInfo(dayDate);

                    dayCell.textContent = day;
                    dayCell.className = 'day-cell rounded-md';
                    dayCell.dataset.date = dateString;
                    dayCell.classList.add(dayInfo.class);
                    dayCell.style.setProperty('--cell-color', dayInfo.cssVar);

                    if (dayInfo.stamp === 'M') {
                        const stamp = document.createElement('span');
                        stamp.className = 'stamp-m';
                        stamp.textContent = 'M';
                        dayCell.appendChild(stamp);
                    }
                    
                    if (selections[dateString] && selections[dateString].length > 0) {
                        dayCell.classList.remove('available', dayInfo.class);
                        dayCell.classList.add('selected');
                    } else if (dayInfo.type === 'past' || dayInfo.type === 'unavailable') {
                         dayCell.classList.add('unavailable');
                         dayCell.classList.remove('available');
                    }
                    
                    daysGrid.appendChild(dayCell);
                }
                
                monthWrapper.appendChild(daysGrid);
                return monthWrapper;
            }
            
            /**
             * Génère les 12 calendriers pour la grille principale
             */
            function generateCalendars() {
                calendarContainer.innerHTML = '';
                // Commence en Septembre 2025
                const startMonth = new Date(2025, 8, 1); // 8 = Septembre
                const totalMonths = 12;
                
                for (let i = 0; i < totalMonths; i++) {
                    const currentMonth = new Date(startMonth.getFullYear(), startMonth.getMonth() + i, 1);
                    const calendarEl = createMonthCalendar(currentMonth, 'main');
                    calendarContainer.appendChild(calendarEl);
                }
            }

            /**
             * Génère les 2 calendriers (prochains mois) pour l'aperçu du footer
             */
            function generateFooterCalendars() {
                footerCalendarContainer.innerHTML = '';
                // Utilise la date 'today' (Nov 2025)
                const startMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                const totalMonths = 2;
                
                for (let i = 0; i < totalMonths; i++) {
                    const currentMonth = new Date(startMonth.getFullYear(), startMonth.getMonth() + i, 1);
                    const calendarEl = createMonthCalendar(currentMonth, 'footer');
                    footerCalendarContainer.appendChild(calendarEl);
                }

                const homeCalendarContainer = document.getElementById('home-calendar-container');
                if (homeCalendarContainer) {
                    homeCalendarContainer.innerHTML = '';
                    const firstFooterCalendar = footerCalendarContainer.querySelector('.footer-calendar');
                    if (firstFooterCalendar) {
                        homeCalendarContainer.appendChild(firstFooterCalendar.cloneNode(true));
                    }
                }
            }

            /**
             * Remplit les deux légendes (principale et footer)
             */
            function populateLegends() {
                const s = uiStrings[currentLang];
                mainLegendContainer.innerHTML = '';
                footerLegendContainer.innerHTML = '';
                
                // Définition des couleurs pour les légendes
                const legendColors = {
                    "available": "var(--success-color)",
                    "weekend_soon": "var(--high-demand-color)",
                    "selected": "var(--calendar-hover-bg)",
                    "event": "var(--warning-color)",
                    "holiday_period": "var(--error-color)", 
                    "spring_break": "var(--calendar-hover-bg)",
                    "summer": "var(--success-color)",
                    "after_june": "var(--calendar-hover-bg)",
                    "unavailable": "#fecaca" // bg-red-200
                };
                
                // 1. Légende Principale (détaillée)
                for (const key in s.legend) {
                    const item = document.createElement('div');
                    item.className = 'legend-item';
                    
                    const colorBox = document.createElement('div');
                    colorBox.className = 'legend-color-box';
                    colorBox.style.backgroundColor = legendColors[key];
                    if(key === 'holiday_period') colorBox.style.background = 'repeating-linear-gradient(-45deg, var(--success-color), var(--success-color) 4px, var(--error-color) 4px, var(--error-color) 8px)';
                    if(key === 'spring_break') colorBox.style.background = 'repeating-linear-gradient(-45deg, var(--calendar-hover-bg), var(--calendar-hover-bg) 4px, var(--dark-gray-color) 4px, var(--dark-gray-color) 8px)';
                    if(key === 'summer') colorBox.style.background = 'repeating-linear-gradient(-45deg, var(--calendar-hover-bg), var(--calendar-hover-bg) 4px, var(--success-color) 4px, var(--success-color) 8px)';
                    
                    const text = document.createElement('span');
                    text.className = 'text-sm';
                    text.textContent = s.legend[key];
                    
                    item.appendChild(colorBox);
                    item.appendChild(text);
                    mainLegendContainer.appendChild(item);
                }

                // 2. Légende Footer (simplifiée)
                 for (const key in s.footerLegend) {
                    const item = document.createElement('div');
                    item.className = 'legend-item';
                    
                    const colorBox = document.createElement('div');
                    colorBox.className = 'legend-color-box';
                    colorBox.style.backgroundColor = legendColors[key];
                    
                    const text = document.createElement('span');
                    text.className = 'text-sm';
                    text.textContent = s.footerLegend[key];
                    
                    item.appendChild(colorBox);
                    item.appendChild(text);
                    footerLegendContainer.appendChild(item);
                }
            }


            // === Logique des Modales (Clics) ===

            // Clic sur un jour (délégué à la grille)
            calendarContainer.addEventListener('click', (e) => {
                const cell = e.target.closest('.day-cell');
                if (cell && !cell.classList.contains('unavailable')) {
                    selectedCell = cell;
                    const date = cell.dataset.date;
                    selectedDateInfo = getSpecialDayInfo(new Date(date + 'T12:00:00')); 
                    
                    const s = uiStrings[currentLang];
                    const displayDate = new Date(date + 'T12:00:00').toLocaleDateString(s.locale, { weekday: s.weekDay, year: 'numeric', month: 'long', day: 'numeric' });
                    modalDateDisplay.textContent = `${s.modalDate}${displayDate}`;
                    
                    modalRequestType.value = 'add';
                    modalTimeWrapper.classList.remove('hidden');
                    modalReasonWrapper.classList.add('hidden');
                    modalTimeError.classList.add('hidden');
                    modalReason.value = '';
                    populateTimeDropdowns('add');
                    
                    modal.classList.remove('hidden');
                }
            });

            function closeModal() {
                modal.classList.add('hidden');
                selectedCell = null;
                selectedDateInfo = null;
            }

            modalCancel.addEventListener('click', closeModal);
            
            // Click-away to close main modal
            if(modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        closeModal();
                    }
                });
            }

            modalConfirm.addEventListener('click', () => {
                if (selectedCell) {
                    const date = selectedCell.dataset.date;
                    const type = modalRequestType.value;
                    let selectionData = {};
                    const s = uiStrings[currentLang];

                    if (type === 'remove') {
                        const reason = modalReason.value.trim();
                        if (!reason) {
                            modalTimeError.textContent = s.modalReasonError;
                            modalTimeError.classList.remove('hidden');
                            return;
                        }
                        modalTimeError.classList.add('hidden');
                        selectionData = { type: 'remove', reason: reason };
                    } else {
                        const startTime = modalTimeStart.value;
                        const endTime = modalTimeEnd.value;
                        const startValue = parseFloat(startTime.replace(':', '.5'));
                        const endValue = parseFloat(endTime.replace(':', '.5'));

                        if (endValue <= startValue) {
                            modalTimeError.textContent = s.modalTimeError;
                            modalTimeError.classList.remove('hidden');
                            return;
                        }
                        modalTimeError.classList.add('hidden');
                        selectionData = { type: type, start: startTime, end: endTime };
                    }

                    if (!selections[date]) selections[date] = [];
                    selections[date].push(selectionData);
                    
                    // Mettre à jour TOUTES les cellules pour cette date
                    document.querySelectorAll(`.day-cell[data-date="${date}"]`).forEach(cell => {
                        cell.className = 'day-cell rounded-md selected';
                        cell.style.cssText = ''; 
                    });
                    
                    closeModal();
                }
            });
            
            modalRequestType.addEventListener('change', (e) => {
                const type = e.target.value;
                if (type === 'remove') {
                    modalTimeWrapper.classList.add('hidden');
                    modalReasonWrapper.classList.remove('hidden');
                    modalTimeError.classList.add('hidden');
                    modalReason.focus();
                } else {
                    modalTimeWrapper.classList.remove('hidden');
                    modalReasonWrapper.classList.add('hidden');
                    modalTimeError.classList.add('hidden');
                    populateTimeDropdowns(type);
                }
            });
            
            // Clics pour l'aperçu du footer
            function toggleFooterPreview(show = true) {
                if(show) footerPreviewModal.classList.remove('hidden');
                else footerPreviewModal.classList.add('hidden');
            }
            if(footerToggle) footerToggle.addEventListener('click', () => toggleFooterPreview(true));
            if(footerPreviewClose) footerPreviewClose.addEventListener('click', () => toggleFooterPreview(false));
            
            // Clics pour le Mailto
            if(mailtoModalClose) {
                mailtoModalClose.addEventListener('click', () => {
                    mailtoModal.classList.add('hidden');
                });
            }
            
            // Click-away to close mailto modal
            if(mailtoModal) {
                mailtoModal.addEventListener('click', (e) => {
                    if (e.target === mailtoModal) {
                        mailtoModal.classList.add('hidden');
                    }
                });
            } 
            
            if (e.target === footerPreviewModal) {
                        toggleFooterPreview(false);
            }
               


            // Clics pour le Mailto
            mailtoModalClose.addEventListener('click', () => {
                mailtoModal.classList.add('hidden');
            });
            
            // Clics pour les champs d'info
            requesterName.addEventListener('input', validateName);
            requesterPhone.addEventListener('input', formatAndValidatePhone);
            langToggle.addEventListener('click', () => {
                setLanguage(currentLang === 'fr' ? 'en' : 'fr');
            });

            // === Logique d'Envoi Mailto ===
            
            function formatPhoneNumber(phoneStr) {
                /* Formate le numéro de téléphone (pour l'e-mail) */
                const cleaned = ('' + phoneStr).replace(/\D/g, '');
                const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
                if (match) return `${match[1]}-${match[2]}-${match[3]}`;
                return phoneStr; 
            }
            
            function getReceptionTimestamp() {
                 const now = new Date();
                 const s = uiStrings[currentLang];
                 const optionsDate = { weekday: s.weekDay, year: 'numeric', month: '2-digit', day: '2-digit' };
                 const datePart = new Intl.DateTimeFormat(s.locale, optionsDate).format(now);
                 const timePart = now.toLocaleTimeString(s.locale, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
                 return `${datePart}, \n ${s.receptionTimeConnector} ${timePart}`;
            }
            
            function getEmailColor(slot, dayInfo) {
                if (slot.type === 'remove') return 'var(--special-color)';
                if (dayInfo.type === 'holiday' || dayInfo.type === 'holiday_period') return 'var(--error-color)';
                if (slot.type === 'add_high' || dayInfo.type === 'weekend_soon') return 'var(--error-color)';
                return 'var(--success-color)';
            }

            confirmReservationBtn.addEventListener('click', () => {
                const name = requesterName.value.trim();
                const phone = requesterPhone.value.trim();
                const availability = requesterAvailability.value.trim();
                const s = uiStrings[currentLang];
                
                messageBox.classList.add('hidden');
                validateName();
                formatAndValidatePhone({ target: requesterPhone });
                const isPhoneValid = /^\d{3}-\d{3}-\d{4}$/.test(phone);

                if (!name || !isPhoneValid) {
                    showMessage(s.errorNoName, true);
                    return;
                }
                if (Object.keys(selections).length === 0) {
                    showMessage(s.errorNoSelection, true);
                    return;
                }

                // 1. Construction du corps HTML
                const formattedPhone = formatPhoneNumber(phone);
                const receptionTime = getReceptionTimestamp().replace('\n', '');
                let htmlBody = `<table style="width: 100%; border-collapse: collapse; font-family: 'Raleway', sans-serif; color: #333;">`;
                htmlBody += `<tr><td colspan="5" class="email-divider" style="border: none; text-align: center; padding: 5px 0;">=================================================</td></tr>`;
                htmlBody += `<tr><td colspan="5" class="email-header" style="font-family: 'Black Ops One', system-ui; font-size: 20px; text-align: center; border: none; padding-bottom: 10px;">Reservations - ${name}</td></tr>`;
                htmlBody += `<tr><td colspan="5" class="email-divider" style="border: none; text-align: center; padding: 5px 0;">=================================================</td></tr>`;
                htmlBody += `<tr><td colspan="5" class="email-subheader" style="font-family: 'Raleway', sans-serif; font-size: 14px; text-align: center; border: none; padding-bottom: 5px;">Téléphone : ${formattedPhone}</td></tr>`;
                if(availability) htmlBody += `<tr><td colspan="5" class="email-subheader" style="font-family: 'Raleway', sans-serif; font-size: 14px; text-align: center; border: none; padding-bottom: 5px;">Disponibilité : ${availability}</td></tr>`;
                htmlBody += `<tr><td colspan="5" class="email-subheader" style="font-family: 'Raleway', sans-serif; font-size: 14px; text-align: center; border: none; padding-bottom: 15px;"><i>Réception : ${receptionTime}</i></td></tr>`;
                htmlBody += `<tr style="background-color: #f9f9f9;"><th style="border: 1px solid #ddd; padding: 8px; text-align: left; width: 5%;"></th><th style="border: 1px solid #ddd; padding: 8px; text-align: center;">${s.emailDate}</th><th style="border: 1px solid #ddd; padding: 8px; text-align: center; width: 5%;">${s.emailType}</th><th style="border: 1px solid #ddd; padding: 8px; text-align: center;">${s.emailContent}</th><th style="border: 1px solid #ddd; padding: 8px; text-align: left; width: 5%;"></th></tr>`;
                
                const sortedDates = Object.keys(selections).sort();
                sortedDates.forEach(date => {
                    const dayInfo = getSpecialDayInfo(new Date(date + 'T12:00:00'));
                    const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString(s.locale, { weekday: s.weekDay, day: '2-digit', month: 'long', year: 'numeric' });
                    selections[date].forEach(slot => {
                         const color = getEmailColor(slot, dayInfo);
                         const symbol = (slot.type === 'remove') ? '-' : '+';
                         const content = (slot.type === 'remove') ? slot.reason : `${slot.start} - ${slot.end}`;
                         htmlBody += `<tr style="color: ${color};"><td style="border: 1px solid #ddd; padding: 8px;"></td><td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${formattedDate}</td><td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold; font-size: 1.2rem;">${symbol}</td><td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${content}</td><td style="border: 1px solid #ddd; padding: 8px;"></td></tr>`;
                    });
                });
                htmlBody += `</table>`;
                
                // 2. Construction du corps Texte
                let plainTextBody = `=================================================\nReservations - ${name}\n=================================================\n\n`;
                plainTextBody += `Téléphone : ${formattedPhone}\n`;
                if (availability) plainTextBody += `Disponibilité : ${availability}\n`;
                plainTextBody += `Réception : ${receptionTime}\n\n${s.emailDesiredDates}:\n\n`;
                sortedDates.forEach(date => {
                    const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString(s.locale, { weekday: s.weekDay, day: '2-digit', month: 'long', year: 'numeric' });
                    plainTextBody += `--- ${formattedDate} ---\n`;
                    selections[date].forEach(slot => {
                        const symbol = (slot.type === 'remove') ? '-' : '+';
                        const content = (slot.type === 'remove') ? slot.reason : `${slot.start} - ${slot.end}`;
                        plainTextBody += ` ${symbol} ${content}\n`;
                    });
                    plainTextBody += `\n`;
                });
                plainTextBody += `\n${s.emailThanks}`;

                // 3. Afficher la modale Mailto
                mailtoModalLink.href = `mailto:glaplante@csrlc.ca?subject=${encodeURIComponent('Reservation')}&body=${encodeURIComponent(plainTextBody)}`;
                mailtoFallbackBody.value = plainTextBody; 
                mailtoHtmlBody.innerHTML = htmlBody; 
                mailtoModal.classList.remove('hidden');
            });
            
            function showMessage(message, isError = false) {
                messageBox.textContent = message;
                messageBox.classList.remove('hidden');
                if (isError) {
                    messageBox.className = 'block max-w-3xl mx-auto mb-4 p-4 rounded-md text-white';
                    messageBox.style.backgroundColor = 'var(--error-color)';
                } else {
                    messageBox.className = 'block max-w-3xl mx-auto mb-4 p-4 rounded-md text-white';
                    messageBox.style.backgroundColor = 'var(--success-color)';
                }
            }
            
            // === Initialisation ===
            populateTimeDropdowns('add');
            setLanguage('fr'); // Appel initial
        });
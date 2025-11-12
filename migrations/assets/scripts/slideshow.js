(() => {
    'use strict';

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    const ASPECT_PRESETS = [
        { name: '16-10', ratio: 16 / 10 },
        { name: '4-3', ratio: 4 / 3 },
        { name: '3-4', ratio: 3 / 4 },
        { name: '10-16', ratio: 10 / 16 },
    ];

    const pickAspectToken = (ratio) => {
        if (!Number.isFinite(ratio) || ratio <= 0) {
            return '16-10';
        }
        let closest = ASPECT_PRESETS[0];
        let smallestDiff = Math.abs(ratio - closest.ratio);
        for (let index = 1; index < ASPECT_PRESETS.length; index += 1) {
            const entry = ASPECT_PRESETS[index];
            const diff = Math.abs(ratio - entry.ratio);
            if (diff < smallestDiff) {
                smallestDiff = diff;
                closest = entry;
            }
        }
        return closest.name;
    };

    class Gallery {
        constructor(container, overlay) {
            this.container = container;
            this.overlay = overlay;
            this.root = container.querySelector('[data-slideshow]');
            this.stage = this.root?.querySelector('.slideshow-stage');
            this.stageImage = this.root?.querySelector('.slideshow-stage-image');
            this.caption = this.root?.querySelector('.slideshow-caption');
            this.prevBtn = this.root?.querySelector('[data-action="prev"]');
            this.nextBtn = this.root?.querySelector('[data-action="next"]');
            this.speedSlider = this.root?.querySelector('.speed-slider');
            this.speedButtons = Array.from(this.root?.querySelectorAll('.speed-step') ?? []);
            this.speedReadout = this.root?.querySelector('.speed-readout');
            this.thumbs = Array.from(this.root?.querySelectorAll('.thumb') ?? []);

            this.images = this.thumbs
                .map((button, index) => {
                    const img = button.querySelector('img');
                    const src = img?.getAttribute('src');
                    const alt = img?.getAttribute('alt') || `Diapositive ${index + 1}`;
                    return src ? { src, alt, aspect: '16-10', ratio: 1.6 } : null;
                })
                .filter(Boolean);

            if (!this.root || !this.stage || !this.stageImage || this.images.length === 0) {
                return;
            }

            this.minSpeed = parseFloat(this.speedSlider?.min ?? '2');
            this.maxSpeed = parseFloat(this.speedSlider?.max ?? '10');
            this.speedStep = parseFloat(this.speedSlider?.step ?? '0.5');
            this.speed = clamp(parseFloat(this.speedSlider?.value ?? '4'), this.minSpeed, this.maxSpeed);
            this.currentIndex = 0;
            this.interval = null;
            this.active = false;
            this.changeListeners = new Set();

            this.thumbs.forEach((thumb) => {
                thumb.dataset.aspect = '16-10';
            });

            this.images.forEach((image, index) => this.loadImageMeta(image, index));

            this.updateStage(0, { announce: false });
            this.updateSpeedUI();
            this.bindEvents();
            this.observeVisibility();
        }

        loadImageMeta(image, index) {
            if (!image || image.metaLoading) {
                return;
            }
            image.metaLoading = true;
            const loader = new Image();
            loader.decoding = 'async';
            loader.loading = 'eager';
            loader.src = image.src;

            const assignMeta = () => {
                const { naturalWidth, naturalHeight } = loader;
                if (naturalWidth && naturalHeight) {
                    image.ratio = naturalWidth / naturalHeight;
                    image.aspect = pickAspectToken(image.ratio);
                    const thumb = this.thumbs[index];
                    if (thumb) {
                        thumb.dataset.aspect = image.aspect;
                    }
                    if (index === this.currentIndex) {
                        this.applyAspect(image.aspect);
                        this.notifyChange();
                    }
                }
            };

            if (loader.complete) {
                assignMeta();
                return;
            }

            loader.addEventListener('load', assignMeta, { once: true });
        }

        applyAspect(aspect) {
            const token = aspect || '16-10';
            if (this.stage) {
                this.stage.dataset.aspect = token;
            }
        }

        bindEvents() {
            this.prevBtn?.addEventListener('click', () => {
                this.showPrevious();
            });

            this.nextBtn?.addEventListener('click', () => {
                this.showNext();
            });

            this.stage.addEventListener('click', () => {
                this.openOverlay();
            });

            this.stage.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    this.openOverlay();
                }
            });

            this.thumbs.forEach((button, index) => {
                button.addEventListener('click', () => {
                    this.updateStage(index);
                    this.restartAutoplay();
                });
            });

            this.speedSlider?.addEventListener('input', (event) => {
                const value = parseFloat(event.target.value);
                this.setSpeed(value, { fromSlider: true });
            });

            this.speedButtons.forEach((button) => {
                button.addEventListener('click', () => {
                    const delta = parseFloat(button.dataset.speedDelta ?? '0');
                    this.setSpeed(this.speed + delta);
                });
            });
        }

        observeVisibility() {
            const updateActiveState = () => {
                const nowActive = !this.container.classList.contains('inactive');
                if (nowActive === this.active) {
                    return;
                }
                this.active = nowActive;
                if (this.active) {
                    this.restartAutoplay();
                } else {
                    this.stopAutoplay();
                }
            };

            this.visibilityObserver = new MutationObserver(updateActiveState);
            this.visibilityObserver.observe(this.container, { attributes: true, attributeFilter: ['class'] });
            updateActiveState();
        }

        updateStage(index, options = {}) {
            if (this.images.length === 0) {
                return;
            }

            const safeIndex = ((index % this.images.length) + this.images.length) % this.images.length;
            this.currentIndex = safeIndex;
            const current = this.images[safeIndex];

            if (this.stageImage.getAttribute('src') !== current.src) {
                this.stageImage.setAttribute('src', current.src);
            }
            this.stageImage.setAttribute('alt', current.alt);
            this.applyAspect(current.aspect);
            if (this.caption) {
                this.caption.textContent = current.alt;
            }

            this.thumbs.forEach((button, thumbIndex) => {
                const isActive = thumbIndex === safeIndex;
                button.classList.toggle('active', isActive);
                button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            });

            if (options.announce !== false) {
                this.notifyChange();
            }
        }

        showNext(options = {}) {
            this.updateStage(this.currentIndex + 1);
            if (!options.fromAutoplay) {
                this.restartAutoplay();
            }
        }

        showPrevious() {
            this.updateStage(this.currentIndex - 1);
            this.restartAutoplay();
        }

        shouldAutoplay() {
            return this.active && this.images.length > 1;
        }

        startAutoplay() {
            if (this.interval || !this.shouldAutoplay()) {
                return;
            }
            this.interval = window.setInterval(() => {
                this.showNext({ fromAutoplay: true });
            }, this.speed * 1000);
        }

        stopAutoplay() {
            if (this.interval) {
                clearInterval(this.interval);
                this.interval = null;
            }
        }

        restartAutoplay() {
            this.stopAutoplay();
            this.startAutoplay();
        }

        setSpeed(value, { fromSlider = false } = {}) {
            const nextSpeed = clamp(value, this.minSpeed, this.maxSpeed);
            if (Number.isNaN(nextSpeed)) {
                return;
            }

            this.speed = nextSpeed;
            if (this.speedSlider && !fromSlider) {
                this.speedSlider.value = String(nextSpeed);
            }
            this.updateSpeedUI();
            this.notifyChange();
            if (this.shouldAutoplay()) {
                this.restartAutoplay();
            }
        }

        updateSpeedUI() {
            if (this.speedReadout) {
                this.speedReadout.textContent = `${this.speed.toFixed(1)} s`;
            }
        }

        openOverlay() {
            if (this.overlay) {
                this.overlay.open(this);
            }
        }

        onChange(listener) {
            this.changeListeners.add(listener);
            return () => {
                this.changeListeners.delete(listener);
            };
        }

        notifyChange() {
            const state = this.getCurrentState();
            this.changeListeners.forEach((listener) => listener(state));
        }

        getCurrentState() {
            const total = this.images.length || 1;
            const safeIndex = Math.min(Math.max(this.currentIndex, 0), total - 1);
            const current = this.images[safeIndex];
            return {
                index: safeIndex,
                total,
                src: current?.src ?? '',
                alt: current?.alt ?? '',
                speed: this.speed,
                aspect: current?.aspect ?? '16-10',
            };
        }
    }

    class FullscreenOverlay {
        constructor() {
            this.el = this.createOverlay();
            this.image = this.el.querySelector('.overlay-image');
            this.caption = this.el.querySelector('.overlay-caption');
            this.counter = this.el.querySelector('.overlay-counter');
            this.closeBtn = this.el.querySelector('.overlay-close');
            this.prevBtn = this.el.querySelector('.overlay-nav.prev');
            this.nextBtn = this.el.querySelector('.overlay-nav.next');
            this.backdrop = this.el.querySelector('.overlay-backdrop');
            this.speedSlider = this.el.querySelector('.overlay-speed-slider');
            this.speedButtons = Array.from(this.el.querySelectorAll('.overlay-speed-step'));
            this.speedReadout = this.el.querySelector('.overlay-speed-readout');
             this.stageWrapper = this.el.querySelector('.overlay-stage');
            this.boundGallery = null;
            this.unsubscribe = null;
            this.keyHandler = (event) => this.handleKeydown(event);

            this.wireEvents();
        }

        createOverlay() {
            let overlay = document.querySelector('.slideshow-overlay');
            if (overlay) {
                return overlay;
            }

            overlay = document.createElement('div');
            overlay.className = 'slideshow-overlay';
            overlay.setAttribute('aria-hidden', 'true');
            overlay.innerHTML = `
                <div class="overlay-backdrop" data-overlay-close></div>
                <div class="overlay-content" role="dialog" aria-modal="true">
                    <button type="button" class="overlay-close" aria-label="Fermer">&times;</button>
                    <button type="button" class="overlay-nav prev" aria-label="Image précédente">&lsaquo;</button>
                    <figure class="overlay-stage">
                        <img class="overlay-image" alt="">
                        <figcaption class="overlay-caption"></figcaption>
                    </figure>
                    <button type="button" class="overlay-nav next" aria-label="Image suivante">&rsaquo;</button>
                    <div class="overlay-controls" aria-label="Contrôle plein écran du diaporama">
                        <button type="button" class="overlay-speed-step" data-speed-delta="-0.5" aria-label="Ralentir">-</button>
                        <label class="overlay-speed-label">
                            <span>Vitesse</span>
                            <input type="range" class="overlay-speed-slider" min="2" max="10" step="0.5" value="4">
                        </label>
                        <button type="button" class="overlay-speed-step" data-speed-delta="0.5" aria-label="Accélérer">+</button>
                        <span class="overlay-speed-readout">4.0 s</span>
                        <span class="overlay-counter">1 / 1</span>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            return overlay;
        }

        wireEvents() {
            this.backdrop?.addEventListener('click', () => this.close());
            this.closeBtn?.addEventListener('click', () => this.close());
            this.prevBtn?.addEventListener('click', () => this.boundGallery?.showPrevious());
            this.nextBtn?.addEventListener('click', () => this.boundGallery?.showNext());

            this.speedSlider?.addEventListener('input', (event) => {
                const value = parseFloat(event.target.value);
                this.boundGallery?.setSpeed(value, { fromSlider: true });
            });

            this.speedButtons.forEach((button) => {
                button.addEventListener('click', () => {
                    if (!this.boundGallery) {
                        return;
                    }
                    const delta = parseFloat(button.dataset.speedDelta ?? '0');
                    this.boundGallery.setSpeed(this.boundGallery.speed + delta);
                });
            });
        }

        handleKeydown(event) {
            if (!this.boundGallery) {
                return;
            }

            if (event.key === 'Escape') {
                event.preventDefault();
                this.close();
            } else if (event.key === 'ArrowLeft') {
                event.preventDefault();
                this.boundGallery.showPrevious();
            } else if (event.key === 'ArrowRight') {
                event.preventDefault();
                this.boundGallery.showNext();
            }
        }

        open(gallery) {
            if (this.boundGallery !== gallery) {
                this.unsubscribe?.();
                this.boundGallery = gallery;
                this.unsubscribe = gallery.onChange((state) => this.sync(state));
            }

            this.sync(gallery.getCurrentState());
            this.el.classList.add('active');
            this.el.setAttribute('aria-hidden', 'false');
            document.body.classList.add('slideshow-locked');
            window.addEventListener('keydown', this.keyHandler);
        }

        close() {
            if (!this.el.classList.contains('active')) {
                return;
            }

            this.el.classList.remove('active');
            this.el.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('slideshow-locked');
            window.removeEventListener('keydown', this.keyHandler);
            this.unsubscribe?.();
            this.unsubscribe = null;
            this.boundGallery = null;
        }

        sync(state) {
            if (!state) {
                return;
            }

            if (this.image && this.image.getAttribute('src') !== state.src) {
                this.image.setAttribute('src', state.src);
            }
            if (this.image) {
                this.image.setAttribute('alt', state.alt);
            }
            if (this.caption) {
                this.caption.textContent = state.alt;
            }
            if (this.counter) {
                this.counter.textContent = `${state.index + 1} / ${state.total}`;
            }
            if (this.speedReadout) {
                this.speedReadout.textContent = `${state.speed.toFixed(1)} s`;
            }
            if (this.speedSlider) {
                const currentValue = parseFloat(this.speedSlider.value);
                if (Math.abs(currentValue - state.speed) > 0.01) {
                    this.speedSlider.value = String(state.speed);
                }
            }
            if (this.stageWrapper) {
                this.stageWrapper.dataset.aspect = state.aspect ?? '16-10';
            }
        }
    }

    let initialized = false;

    const initSlideshows = () => {
        if (initialized) {
            return;
        }
        initialized = true;

        const containers = document.querySelectorAll('.container-slideshow[data-gallery]');
        if (!containers.length) {
            return;
        }

        const overlay = new FullscreenOverlay();
        containers.forEach((container) => {
            try {
                new Gallery(container, overlay);
            } catch (error) {
                console.warn('Slideshow initialization failed', error);
            }
        });
    };

    const scheduleInit = () => {
        window.requestAnimationFrame(initSlideshows);
    };

    if (document.readyState !== 'loading') {
        scheduleInit();
    }

    document.addEventListener('global:loaded', scheduleInit, { once: true });
    window.addEventListener('load', scheduleInit, { once: true });
})();
/* ============================================
   AURRA HOME — Frame-by-Frame Scroll Animation
   195 frames: hero/ezgif-frame-001.jpg to 195.jpg
   ============================================ */

(function () {

  // ── Preloader ──────────────────────────────
  const preloader = document.getElementById('preloader');
  const bar       = document.getElementById('load-progress');
  const pct       = document.getElementById('load-pct');

  // ── Config ─────────────────────────────────
  const TOTAL_FRAMES  = 195;
  const FRAME_FOLDER  = 'hero';
  const FRAME_PREFIX  = 'ezgif-frame-';
  const FRAME_EXT     = '.jpg';
  const PRELOAD_FIRST = 10;

  function frameName(n) {
    return `${FRAME_FOLDER}/${FRAME_PREFIX}${String(n).padStart(3, '0')}${FRAME_EXT}`;
  }

  // ── State ──────────────────────────────────
  const images      = new Array(TOTAL_FRAMES + 1);
  let   loadedCount = 0;
  let   currentFrame= 1;
  let   rafId       = null;
  let   targetFrame = 1;

  // ── Canvas ─────────────────────────────────
  const canvas = document.getElementById('animation-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    drawFrame(currentFrame);
  }

  // ── Draw one frame ─────────────────────────
  function drawFrame(n) {
    const img = images[n];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const cw = canvas.width,  ch = canvas.height;
    const iw = img.naturalWidth, ih = img.naturalHeight;

    const scale = Math.max(cw / iw, ch / ih);
    const dw    = iw * scale;
    const dh    = ih * scale;
    const dx    = (cw - dw) / 2;
    const dy    = (ch - dh) / 2;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  // ── Smooth RAF interpolation ────────────────
  function animateTo(target) {
    targetFrame = Math.max(1, Math.min(TOTAL_FRAMES, target));
    if (rafId) return;
    function step() {
      if (currentFrame === targetFrame) { rafId = null; return; }
      const diff = targetFrame - currentFrame;
      currentFrame += diff > 0 ? Math.min(diff, 3) : Math.max(diff, -3);
      drawFrame(currentFrame);
      rafId = requestAnimationFrame(step);
    }
    rafId = requestAnimationFrame(step);
  }

  // ── Load image ─────────────────────────────
  function loadImage(n) {
    return new Promise(resolve => {
      const img = new Image();
      img.src = frameName(n);
      img.onload  = () => { images[n] = img; loadedCount++; resolve(); };
      img.onerror = () => { images[n] = null; loadedCount++; resolve(); };
      images[n] = img;
    });
  }

  // ── Phase 1: first 10 frames fast ──────────
  async function preloadInitial() {
    const firstBatch = [];
    for (let i = 1; i <= Math.min(PRELOAD_FIRST, TOTAL_FRAMES); i++) {
      firstBatch.push(loadImage(i));
    }
    await Promise.all(firstBatch);

    if (preloader) preloader.classList.add('hidden');
    drawFrame(1);
    loadRemaining();
  }

  // ── Phase 2: rest in background ────────────
  function loadRemaining() {
    const total = TOTAL_FRAMES;

    function loadNext(n) {
      if (n > total) return;
      loadImage(n).then(() => {
        const p = Math.round((loadedCount / total) * 100);
        if (bar) bar.style.width = p + '%';
        if (pct) pct.textContent = p;
        loadNext(n + 1);
      });
    }

    for (let start = PRELOAD_FIRST + 1; start <= Math.min(PRELOAD_FIRST + 4, total); start++) {
      loadNext(start);
    }
  }

  // ── Slides ─────────────────────────────────
  const slides          = document.querySelectorAll('.overlay-slide');
  const slideThresholds = [0, 0.25, 0.5, 0.75];

  function showSlide(index) {
    slides.forEach((s, i) => s.classList.toggle('active', i === index));
  }

  // ── Scroll ─────────────────────────────────
  const container  = document.getElementById('sequence');
  const scrollHint = document.getElementById('scroll-hint');

  function onScroll() {
    if (!container) return;
    const rect     = container.getBoundingClientRect();
    const scrolled = -rect.top;
    const total    = container.offsetHeight - window.innerHeight;
    const progress = Math.max(0, Math.min(1, scrolled / total));

    const frame = Math.round(1 + progress * (TOTAL_FRAMES - 1));
    animateTo(frame);

    let slideIndex = 0;
    for (let i = slideThresholds.length - 1; i >= 0; i--) {
      if (progress >= slideThresholds[i]) { slideIndex = i; break; }
    }
    showSlide(slideIndex);

    if (scrollHint) scrollHint.classList.toggle('hidden', progress > 0.04);
  }

  // ── Init ───────────────────────────────────
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', resizeCanvas);

  resizeCanvas();
  showSlide(0);
  preloadInitial();

})();

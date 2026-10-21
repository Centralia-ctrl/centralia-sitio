(() => {
  const video = document.getElementById('factoraje-film');
  if (!video) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const firstMessage = document.querySelector('[data-film-message="first"]');
  const secondMessage = document.querySelector('[data-film-message="second"]');
  let visible = false;
  let failed = false;
  let frameRequest = null;
  const smooth = (value) => {
    const p = Math.max(0, Math.min(1, value));
    return p * p * (3 - 2 * p);
  };
  // Type stays in the DOM, so browser zoom never enlarges encoded letter pixels.
  // Read the video's clock to keep both messages aligned with the approved loop.
  const syncCopy = (time = video.currentTime) => {
    if (!firstMessage || !secondMessage) return;
    const t = time % 12;
    const first = t < 10 ? 1 - smooth((t - 4.75) / .45) : smooth((t - 10.45) / .55);
    const second = t < 10 ? smooth((t - 5.20) / .55) : 1 - smooth((t - 10) / .45);
    firstMessage.style.opacity = first;
    secondMessage.style.opacity = second;
  };
  // Draw the decoded frame at the screen's pixel density. This also keeps
  // embedded browser video compositing from reducing the illustration detail.
  const canvas = document.createElement('canvas');
  canvas.className = 'film-artwork-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const context = 'requestVideoFrameCallback' in video ? canvas.getContext('2d', {alpha:false}) : null;
  if (context) video.after(canvas);
  const drawArtwork = () => {
    syncCopy();
    if (!context || failed || video.readyState < 2 || !video.videoWidth) return;
    if (video.paused && video.currentTime === 0) return;
    const rect = video.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const density = Math.min(window.devicePixelRatio || 1, video.videoWidth / rect.width);
    const width = Math.round(rect.width * density);
    const height = Math.round(rect.height * density);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(video, 0, 0, width, height);
    canvas.classList.add('is-ready');
  };
  const followFrames = () => {
    drawArtwork();
    if ('requestVideoFrameCallback' in video && !video.paused && frameRequest === null) {
      frameRequest = video.requestVideoFrameCallback(() => {
        frameRequest = null;
        followFrames();
      });
    }
  };
  video.controls = false;
  video.muted = true;
  const update = () => {
    if (visible && !document.hidden && !reducedMotion.matches && !failed) {
      video.play().catch(() => {});
    } else video.pause();
  };
  video.addEventListener('play', followFrames);
  video.addEventListener('timeupdate', drawArtwork);
  video.addEventListener('loadeddata', drawArtwork);
  video.addEventListener('seeked', drawArtwork);
  const fallback = () => {
    failed = true;
    canvas.classList.remove('is-ready');
    video.pause();
    video.controls = false;
    syncCopy(0);
  };
  video.addEventListener('error', fallback);
  video.addEventListener('loadeddata', update);
  if (context && 'ResizeObserver' in window) new ResizeObserver(drawArtwork).observe(video);
  document.addEventListener('visibilitychange', update);
  reducedMotion.addEventListener('change', update);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio >= 0.15;
      update();
    }, {threshold:[0, .15]}).observe(video);
  } else { visible = true; update(); }
})();

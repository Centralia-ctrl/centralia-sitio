(() => {
  const video = document.getElementById('business-video');
  const button = document.querySelector('.business-video-toggle');
  if (!video || !button) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false;
  let userPaused = false;
  let explicitPlay = false;
  let failed = false;
  video.muted = true;
  video.controls = false;
  button.hidden = false;

  const reflectPlayback = () => {
    const playing = !video.paused;
    button.classList.toggle('is-playing', playing);
    button.setAttribute('aria-label', `${playing ? 'Pausar' : 'Reproducir'} video del almacén`);
    button.querySelector('span').textContent = playing ? 'Pausar' : 'Reproducir';
  };
  const updatePlayback = () => {
    const shouldPlay = visible && !document.hidden && !userPaused &&
      (!reducedMotion.matches || explicitPlay) && !failed;
    if (shouldPlay) {
      video.play().catch(reflectPlayback);
    } else {
      video.pause();
    }
    reflectPlayback();
  };

  button.addEventListener('click', () => {
    userPaused = !video.paused;
    explicitPlay = !userPaused;
    updatePlayback();
  });
  video.addEventListener('play', reflectPlayback);
  video.addEventListener('pause', reflectPlayback);
  const showPoster = () => {
    failed = true;
    video.pause();
    button.hidden = true;
  };
  video.addEventListener('error', showPoster);
  video.querySelector('source').addEventListener('error', showPoster);
  document.addEventListener('visibilitychange', updatePlayback);
  reducedMotion.addEventListener('change', () => {
    explicitPlay = false;
    updatePlayback();
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio >= 0.2;
      updatePlayback();
    }, {threshold: [0, 0.2]}).observe(video);
  } else {
    // Browsers without visibility observation retain manual playback.
    visible = true;
    userPaused = true;
  }
  reflectPlayback();
})();

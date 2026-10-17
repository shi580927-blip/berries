/* Own-site viewport/fullscreen controls; no Yandex Games or GamePush SDK. */
(() => {
  'use strict';
  const shell = document.getElementById('game-shell');
  const toggle = document.getElementById('web-fullscreen-toggle');
  const help = document.getElementById('web-fullscreen-help');
  const dismiss = document.getElementById('web-fullscreen-dismiss');
  if (!shell || !toggle || !help || !dismiss) return;

  let refreshQueued = false;
  function refreshGame() {
    if (refreshQueued) return;
    refreshQueued = true;
    requestAnimationFrame(() => {
      refreshQueued = false;
      try { window.__berriesGame?.scale?.refresh?.(); } catch (error) {
        console.warn('[berries web] scale refresh failed', error);
      }
    });
  }

  function isStandalone() {
    return window.matchMedia?.('(display-mode: standalone)')?.matches === true ||
      window.navigator.standalone === true;
  }

  function isFullscreen() {
    return document.fullscreenElement === shell;
  }

  function canFullscreen() {
    return Boolean(document.fullscreenEnabled && typeof shell.requestFullscreen === 'function');
  }

  function updateLabel() {
    const label = isFullscreen() ? 'Выйти из полного экрана' :
      canFullscreen() ? 'На весь экран' : 'Как открыть без панелей браузера';
    toggle.title = label;
    toggle.setAttribute('aria-label', label);
    toggle.textContent = isFullscreen() ? '↙' : '⛶';
    toggle.hidden = isStandalone() && !canFullscreen();
  }

  function showHelp() {
    help.hidden = false;
    dismiss.focus();
  }

  function hideHelp() {
    help.hidden = true;
    toggle.focus();
  }

  toggle.addEventListener('click', () => {
    if (isFullscreen()) {
      document.exitFullscreen?.().catch(() => showHelp());
      return;
    }
    if (!canFullscreen()) {
      showHelp();
      return;
    }
    // Must be invoked directly from the click, before awaiting anything.
    try {
      const pending = shell.requestFullscreen({ navigationUI: 'hide' });
      Promise.resolve(pending).catch(() => showHelp());
    } catch (_) {
      showHelp();
    }
  });

  dismiss.addEventListener('click', hideHelp);
  help.addEventListener('click', event => {
    if (event.target === help) hideHelp();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !help.hidden) hideHelp();
  });

  document.addEventListener('fullscreenchange', () => {
    updateLabel();
    refreshGame();
  });
  document.addEventListener('fullscreenerror', () => {
    updateLabel();
    showHelp();
  });
  window.addEventListener('resize', refreshGame, { passive: true });
  window.addEventListener('orientationchange', refreshGame, { passive: true });
  window.visualViewport?.addEventListener('resize', refreshGame, { passive: true });
  window.visualViewport?.addEventListener('scroll', refreshGame, { passive: true });
  updateLabel();
})();

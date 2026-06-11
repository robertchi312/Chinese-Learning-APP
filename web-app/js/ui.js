// UI helpers: panda mascot, night-ink theme toggle, confetti, count-up tween.

const UI = (() => {
  /* ---------- mascot ---------- */
  // One hand-drawn panda; eyes/mouth/arms swap per expression.
  // Expressions: 'happy' | 'cheering' | 'thinking' | 'sleepy'
  function mascot(expression = 'happy', size = 84) {
    const INK = '#2f2a25';
    const WHITE = '#fdfaf4';
    const BLUSH = '#f0b9ad';

    const eyes = {
      happy: `
        <circle cx="38" cy="40" r="4.2" fill="${WHITE}"/><circle cx="62" cy="40" r="4.2" fill="${WHITE}"/>
        <circle cx="38.8" cy="40.5" r="2.4" fill="${INK}"/><circle cx="61.2" cy="40.5" r="2.4" fill="${INK}"/>
        <circle cx="39.7" cy="39.5" r="0.9" fill="${WHITE}"/><circle cx="62.1" cy="39.5" r="0.9" fill="${WHITE}"/>`,
      cheering: `
        <path d="M34 41 Q38 36 42 41" stroke="${WHITE}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        <path d="M58 41 Q62 36 66 41" stroke="${WHITE}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
      thinking: `
        <circle cx="38" cy="40" r="4.2" fill="${WHITE}"/><circle cx="62" cy="40" r="4.2" fill="${WHITE}"/>
        <circle cx="36.6" cy="38.8" r="2.2" fill="${INK}"/><circle cx="60" cy="38.8" r="2.2" fill="${INK}"/>`,
      sleepy: `
        <path d="M34 41 Q38 43.5 42 41" stroke="${WHITE}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        <path d="M58 41 Q62 43.5 66 41" stroke="${WHITE}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
    }[expression];

    const mouth = {
      happy: `<path d="M45 55 Q50 59 55 55" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/>`,
      cheering: `<path d="M44 54 Q50 62 56 54 Z" fill="${INK}"/><path d="M46.5 57.5 Q50 60.5 53.5 57.5 Z" fill="${BLUSH}"/>`,
      thinking: `<path d="M46 56 Q50 54.5 54 56" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/>`,
      sleepy: `<ellipse cx="50" cy="56.5" rx="2.6" ry="3.4" fill="${INK}"/>`,
    }[expression];

    const arms = {
      happy: `
        <ellipse cx="30" cy="80" rx="8" ry="6" fill="${INK}" transform="rotate(20 30 80)"/>
        <ellipse cx="70" cy="80" rx="8" ry="6" fill="${INK}" transform="rotate(-20 70 80)"/>`,
      cheering: `
        <ellipse cx="22" cy="66" rx="6.5" ry="9" fill="${INK}" transform="rotate(35 22 66)"/>
        <ellipse cx="78" cy="66" rx="6.5" ry="9" fill="${INK}" transform="rotate(-35 78 66)"/>`,
      thinking: `
        <ellipse cx="30" cy="80" rx="8" ry="6" fill="${INK}" transform="rotate(20 30 80)"/>
        <ellipse cx="64" cy="62" rx="6" ry="8" fill="${INK}" transform="rotate(-30 64 62)"/>`,
      sleepy: `
        <ellipse cx="32" cy="82" rx="8.5" ry="5.5" fill="${INK}"/>
        <ellipse cx="68" cy="82" rx="8.5" ry="5.5" fill="${INK}"/>`,
    }[expression];

    const extras = {
      happy: `<circle cx="31" cy="49" r="3.4" fill="${BLUSH}" opacity="0.8"/><circle cx="69" cy="49" r="3.4" fill="${BLUSH}" opacity="0.8"/>`,
      cheering: `
        <circle cx="31" cy="49" r="3.6" fill="${BLUSH}"/><circle cx="69" cy="49" r="3.6" fill="${BLUSH}"/>
        <path d="M14 30 l3 -6 l3 6 M80 24 l3 -6 l3 6" stroke="#c9962e" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
      thinking: `<text x="76" y="26" font-size="13" fill="${INK}" opacity="0.65" font-family="sans-serif">?</text>`,
      sleepy: `<text x="72" y="22" font-size="11" fill="${INK}" opacity="0.6" font-family="sans-serif" font-style="italic">z z</text>`,
    }[expression];

    return `
<svg width="${size}" height="${size}" viewBox="0 0 100 100" role="img" aria-label="panda mascot (${expression})">
  <g class="mascot-breathe">
    <!-- ears -->
    <circle cx="27" cy="20" r="11" fill="${INK}"/>
    <circle cx="73" cy="20" r="11" fill="${INK}"/>
    <!-- body -->
    <ellipse cx="50" cy="78" rx="26" ry="18" fill="${WHITE}" stroke="${INK}" stroke-width="2.5"/>
    ${arms}
    <!-- head -->
    <ellipse cx="50" cy="42" rx="31" ry="27" fill="${WHITE}" stroke="${INK}" stroke-width="2.5"/>
    <!-- eye patches -->
    <ellipse cx="38" cy="40" rx="8" ry="10" fill="${INK}" transform="rotate(-12 38 40)"/>
    <ellipse cx="62" cy="40" rx="8" ry="10" fill="${INK}" transform="rotate(12 62 40)"/>
    ${eyes}
    <!-- nose -->
    <ellipse cx="50" cy="50" rx="3.2" ry="2.4" fill="${INK}"/>
    ${mouth}
    ${extras}
  </g>
</svg>`;
  }

  /* ---------- theme ---------- */
  function applyTheme(pref) {
    const dark = pref === 'dark' || (pref === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) document.documentElement.dataset.theme = 'dark';
    else delete document.documentElement.dataset.theme;
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = dark ? '☀️' : '🌙';
  }

  /* ---------- confetti (lazy CDN load, no-op offline) ---------- */
  let confettiLoading = null;
  function loadConfetti() {
    if (window.confetti) return Promise.resolve(window.confetti);
    if (confettiLoading) return confettiLoading;
    confettiLoading = new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js';
      s.onload = () => resolve(window.confetti);
      s.onerror = () => { confettiLoading = null; resolve(null); };
      document.head.appendChild(s);
    });
    return confettiLoading;
  }

  async function confetti() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const fire = await loadConfetti();
    if (!fire) return;
    fire({ particleCount: 90, spread: 75, origin: { y: 0.65 }, colors: ['#c0392b', '#c9962e', '#3e7a5e', '#fdf9ef'] });
    setTimeout(() => fire({ particleCount: 45, spread: 110, origin: { y: 0.6 }, scalar: 0.8 }), 250);
  }

  /* ---------- count-up tween for stat numbers ---------- */
  function countUp(el, target, duration = 600) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = target;
      return;
    }
    const start = parseInt(el.textContent, 10) || 0;
    if (start === target) { el.textContent = target; return; }
    const t0 = performance.now();
    function tick(t) {
      const k = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(start + (target - start) * eased);
      if (k < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  return { mascot, applyTheme, confetti, countUp };
})();

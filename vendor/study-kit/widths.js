// The width checks, for any app's Playwright suite: require('study-kit/test/widths.js') or copy at a pinned tag.
//
// Origin: Inspect & Adapt test.js overflow() and page wrapper; Going Concern tools/test.js overflow(); Critical
// Path test/ui_test.js. Differences resolved in docs/DECISIONS.md (W1 to W4).
'use strict';

const WIDTHS = [360, 390, 414];
const SCHEMES = ['light', 'dark'];

// Wraps a page body the way claude.ai serves an artifact: doctype, viewport meta and a small reset. Without the
// viewport meta a phone lays the page out at 980 px and the width checks mean nothing (Critical Path, Nov 19).
// Google Fonts are unreachable in the test browser, so the display and body faces map to DejaVu Sans, which is
// wider: a stress proxy, not the real fonts.
const RESET = ':root{color-scheme:light dark;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif}img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}';
const FONTS = '<style>@font-face{font-family:"Archivo";src:local("DejaVu Sans Bold"),local("DejaVuSans-Bold");font-weight:600 900}@font-face{font-family:"Archivo";src:local("DejaVu Sans");font-weight:100 599}@font-face{font-family:"Atkinson Hyperlegible";src:local("DejaVu Sans");font-weight:400}@font-face{font-family:"Atkinson Hyperlegible";src:local("DejaVu Sans Bold"),local("DejaVuSans-Bold");font-weight:700}</style>';
function shell(body) {
  return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>' + RESET + '</style></head><body>' + FONTS + body + '</body></html>';
}

// Every element that sticks out past the viewport, unless it sits inside its own horizontal scroller
// (overflow-x auto or scroll), where it scrolls in place and cannot widen the page. A parent with overflow
// hidden does not excuse it: hidden content is clipped content. Fixed toasts are ignored.
async function overflow(page) {
  const r = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth, bad = [];
    const inScroller = el => { for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { const ox = getComputedStyle(p).overflowX; if (ox === 'auto' || ox === 'scroll') return true; } return false; };
    document.querySelectorAll('body *').forEach(el => {
      const cs = getComputedStyle(el);
      if (cs.position === 'fixed' && el.classList.contains('toast')) return;
      const b = el.getBoundingClientRect();
      if (b.width === 0 && b.height === 0) return;
      if ((b.right > vw + 1 || b.left < -1) && !inScroller(el)) bad.push((el.className || el.tagName) + ' ' + Math.round(b.left) + '..' + Math.round(b.right));
    });
    return { sw: document.documentElement.scrollWidth, vw, bad: bad.slice(0, 6) };
  });
  r.ok = r.sw <= r.vw + 1 && !r.bad.length;
  return r;
}

module.exports = { WIDTHS, SCHEMES, shell, overflow, RESET, FONTS };

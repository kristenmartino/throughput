// Lesson figures, drawn at build time as SVG from the checked numbers (math/numbers.js). Colors are CSS variables,
// so the figures follow the light and dark themes. Each figure has a text alternative and a caption that states
// the reading in words, so nothing depends on seeing the chart.
'use strict';
const W = 360, H = 210, L = 44, R = 10, T = 12, B = 30;
const f = (v, d) => (+v).toFixed(d);
function frame(xmin, xmax, ymin, ymax) {
  const x = v => L + (W - L - R) * (v - xmin) / (xmax - xmin), y = v => T + (H - T - B) * (1 - (v - ymin) / (ymax - ymin));
  return { x, y };
}
const txt = (x, y, s, a, extra) => '<text x="' + f(x, 1) + '" y="' + f(y, 1) + '" font-size="10" fill="var(--muted)" text-anchor="' + (a || 'middle') + '"' + (extra || '') + '>' + s + '</text>';
const line = (x1, y1, x2, y2, col, w, dash) => '<line x1="' + f(x1, 1) + '" y1="' + f(y1, 1) + '" x2="' + f(x2, 1) + '" y2="' + f(y2, 1) + '" stroke="' + col + '" stroke-width="' + (w || 1) + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + '/>';
const dot = (x, y, col, r) => '<circle cx="' + f(x, 1) + '" cy="' + f(y, 1) + '" r="' + (r || 3) + '" fill="' + col + '"/>';
const poly = (pts, col, w, dash) => '<polyline fill="none" stroke="' + col + '" stroke-width="' + (w || 2) + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + ' stroke-linejoin="round" points="' + pts.map(p => f(p[0], 1) + ',' + f(p[1], 1)).join(' ') + '"/>';
const svg = (label, body) => '<svg class="fig" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + label.replace(/"/g, '&quot;') + '">' + body + '</svg>';
const yAxis = (fr, ticks, d) => ticks.map(v => line(L, fr.y(v), W - R, fr.y(v), 'var(--rule)') + txt(L - 4, fr.y(v) + 3, f(v, d), 'end')).join('');

function multivari(N) {
  const data = JSON.parse(N.an1.data), hours = JSON.parse(N.an1.hours), all = [].concat(...data.map(h => [].concat(...h)));
  const ymin = 25.000, ymax = 25.090, fr = frame(0, 12, ymin, ymax);
  let body = yAxis(fr, [25.00, 25.03, 25.06, 25.09], 2);
  const means = [];
  data.forEach((hr, h) => {
    hr.forEach((pc, k) => {
      const xc = h * 3 + k + 0.5, xs = [xc - 0.25, xc, xc + 0.25];
      body += line(fr.x(xc), fr.y(Math.min(...pc)), fr.x(xc), fr.y(Math.max(...pc)), 'var(--c1)', 2);
      pc.forEach((v, j) => { body += dot(fr.x(xs[j]), fr.y(v), 'var(--c1)', 2.2); });
    });
    const m = hr.reduce((a, p) => a + p.reduce((x, y) => x + y, 0), 0) / 9; means.push([fr.x(h * 3 + 1.5), fr.y(m)]);
    body += txt(fr.x(h * 3 + 1.5), H - 10, hours[h]);
    if (h) body += line(fr.x(h * 3), T, fr.x(h * 3), H - B, 'var(--rule)', 1, '2 3');
  });
  body += poly(means, 'var(--c2)', 2, '5 3');
  void all;
  return { svg: svg('Multi-vari chart of shaft diameter: three positions on each of three consecutive shafts at four sample times. The hour means climb from ' + f(N.an1.hourLo, 3) + ' to ' + f(N.an1.hourHi, 3) + ' mm; spreads within a shaft and between shafts are small.', body),
    legend: [['--c1', 'Each shaft: three positions, joined by a bar'], ['--c2', 'Mean of the hour']] };
}
function scatter(N) {
  const x = N.an2.x.split(', ').map(Number), y = N.an2.y.split(', ').map(Number), fr = frame(145, 190, 40, 54);
  let body = yAxis(fr, [40, 44, 48, 52], 0);
  [150, 160, 170, 180, 190].forEach(v => { body += txt(fr.x(v), H - 10, v + ' °C'); });
  body += line(fr.x(145), fr.y(N.an3.b0 + N.an3.b1 * 145), fr.x(190), fr.y(N.an3.b0 + N.an3.b1 * 190), 'var(--c2)', 2);
  x.forEach((v, i) => { body += dot(fr.x(v), fr.y(y[i]), 'var(--c1)', 3.2); });
  return { svg: svg('Scatter of bond strength against cure temperature with the least-squares line rising ' + f(N.an3.b1, 3) + ' N per degree; the points lie close to the line.', body),
    legend: [['--c1', 'Run (temperature, strength)'], ['--c2', 'Least-squares line']] };
}
function effects(N) {
  const g = N.im2, fr = frame(0, 4.6, 60, 90);
  let body = yAxis(fr, [60, 70, 80, 90], 0);
  body += poly([[fr.x(0.4), fr.y(g.aLo)], [fr.x(1.8), fr.y(g.aHi)]], 'var(--c1)', 2.5) + dot(fr.x(0.4), fr.y(g.aLo), 'var(--c1)') + dot(fr.x(1.8), fr.y(g.aHi), 'var(--c1)');
  body += poly([[fr.x(2.8), fr.y(g.bLo)], [fr.x(4.2), fr.y(g.bHi)]], 'var(--c3)', 2.5) + dot(fr.x(2.8), fr.y(g.bLo), 'var(--c3)') + dot(fr.x(4.2), fr.y(g.bHi), 'var(--c3)');
  body += line(L, fr.y(g.grand), W - R, fr.y(g.grand), 'var(--muted)', 1, '4 3');
  body += txt(fr.x(0.4), H - 10, 'A low') + txt(fr.x(1.8), H - 10, 'A high') + txt(fr.x(2.8), H - 10, 'B low') + txt(fr.x(4.2), H - 10, 'B high');
  return { svg: svg('Main-effects plot: seal strength rises from ' + g.aLo + ' to ' + g.aHi + ' as temperature A goes from low to high, and from ' + g.bLo + ' to ' + g.bHi + ' as pressure B goes from low to high. The steeper line is A.', body),
    legend: [['--c1', 'Temperature (A): mean at low and high'], ['--c3', 'Pressure (B): mean at low and high'], ['--muted', 'Grand mean']] };
}
function interaction(N) {
  const g = N.im2, fr = frame(0, 1, 60, 90);
  let body = yAxis(fr, [60, 70, 80, 90], 0);
  body += poly([[fr.x(0.15), fr.y(g.mmm)], [fr.x(0.85), fr.y(g.pm)]], 'var(--c1)', 2.5) + dot(fr.x(0.15), fr.y(g.mmm), 'var(--c1)') + dot(fr.x(0.85), fr.y(g.pm), 'var(--c1)');
  body += poly([[fr.x(0.15), fr.y(g.mp)], [fr.x(0.85), fr.y(g.pp)]], 'var(--c3)', 2.5) + dot(fr.x(0.15), fr.y(g.mp), 'var(--c3)') + dot(fr.x(0.85), fr.y(g.pp), 'var(--c3)');
  body += txt(fr.x(0.15), H - 10, 'Temperature low') + txt(fr.x(0.85), H - 10, 'Temperature high');
  return { svg: svg('Interaction plot: at low pressure, raising temperature adds ' + g.aAtBlo + '; at high pressure it adds ' + g.aAtBhi + '. The lines are not parallel, so the factors interact.', body),
    legend: [['--c1', 'Pressure low'], ['--c3', 'Pressure high']] };
}
function xbar(N) {
  const xs = JSON.parse(N.co1.xs), c = N.co3, fr = frame(0.5, 20.5, 48.9, 51.5);
  let body = '';
  [[c.uclX, 'UCL ' + f(c.uclX, 2)], [c.xbb, 'CL ' + f(c.xbb, 2)], [c.lclX, 'LCL ' + f(c.lclX, 2)]].forEach(([v, s], i) => {
    body += line(L, fr.y(v), W - R, fr.y(v), i === 1 ? 'var(--muted)' : 'var(--c2)', 1.5, i === 1 ? '' : '5 3') + txt(L - 4, fr.y(v) + 3, s.split(' ')[1], 'end');
  });
  body += poly(xs.map((v, i) => [fr.x(i + 1), fr.y(v)]), 'var(--c1)', 1.8);
  xs.forEach((v, i) => { const inRun = i + 1 >= N.co1.runFrom && i + 1 <= N.co1.runTo; body += dot(fr.x(i + 1), fr.y(v), inRun ? 'var(--c3)' : 'var(--c1)', inRun ? 3.6 : 2.8); });
  [1, 5, 10, 15, 20].forEach(t => { body += txt(fr.x(t), H - 10, t); });
  return { svg: svg('X-bar chart of 20 subgroup means with UCL ' + f(c.uclX, 2) + ', center ' + f(c.xbb, 2) + ' and LCL ' + f(c.lclX, 2) + '. No point is outside the limits; subgroups ' + N.co1.runFrom + ' to ' + N.co1.runTo + ' are all above the center line.', body),
    legend: [['--c1', 'Subgroup mean'], ['--c3', 'Run above the center line'], ['--c2', 'Control limits']] };
}
const DRAW = { multivari, scatter, effects, interaction, xbar };
function draw(kind, N) { if (!DRAW[kind]) throw new Error('unknown figure ' + kind); return DRAW[kind](N); }
module.exports = { draw, kinds: Object.keys(DRAW) };

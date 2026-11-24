/* study-kit 0.2.0 (kristenmartino/study-kit). Built by tools/bundle.js; do not edit. */
(function (root) {
"use strict";
const M = {}, C = {};
function req(n) { n = n.replace(/^\.\//, ""); if (!(n in C)) { const m = { exports: {} }; M[n](m, m.exports); C[n] = m.exports; } return C[n]; }
M["version.js"] = function (module, exports) {
'use strict';
module.exports = '0.2.0';

};
M["save.js"] = function (module, exports) {
// Saving: a per-user document mirrored to localStorage, merged by entry timestamp, written back only when the
// merged copy differs from the database's.
//
// Origin: Inspect & Adapt V32 (crFlush / initCraftStore and smFlush / initSimsStore, two near-identical copies),
// and Going Concern V26 (fxFlush / initCraftStore). All three compared copies key-order-free since Nov 22, 2026:
// the database returns fields in its own order, and comparing plain JSON.stringify output made every snapshot
// look changed, so the page rewrote its document about once a second while open.
'use strict';

// Key-order-free JSON. Arrays keep their order; object keys are sorted at every depth.
function canonJSON(v) {
  return JSON.stringify(v, (k, x) => x && typeof x === 'object' && !Array.isArray(x)
    ? Object.keys(x).sort().reduce((o, key) => { o[key] = x[key]; return o; }, {})
    : x);
}

// Later entry wins, entry by entry, on its `ts`.
function mergeByTs(a, b) {
  const out = Object.assign({}, a);
  for (const k in b) if (!out[k] || (b[k].ts || 0) > (out[k].ts || 0)) out[k] = b[k];
  return out;
}

// opts:
//   localKey   localStorage key, e.g. 'blast-radius:craft:v1'
//   doc        document name under data/users/<uid>/, e.g. 'craft' or 'sims'
//   field      field holding the entries in the document, e.g. 'stages' or 'sims'
//   normalize  (raw) => entries; drops unknown ids and bad shapes
//   onRemote   () => void; called after a snapshot changed the local copy
//   onStatus   () => void; called whenever the saved/saving state may have changed
//   delayMs    debounce before a write (900)
//   retryMs    wait after a failed write (5000)
//   maxFails   stop retrying after this many failures in a row (3)
//   storage    localStorage stand-in for tests
function createStore(opts) {
  const o = Object.assign({ delayMs: 900, retryMs: 5000, maxFails: 3, normalize: x => x || {}, onRemote() {}, onStatus() {} }, opts);
  const storage = o.storage !== undefined ? o.storage : (typeof window !== 'undefined' ? window.localStorage : null);
  let data = {}, ref = null, saving = false, dirty = false, timer = null, fails = 0;

  function loadLocal() {
    try { const raw = storage && storage.getItem(o.localKey); data = raw ? o.normalize(JSON.parse(raw)) : {}; }
    catch (e) { data = {}; }
    return data;
  }
  function saveLocal() { try { if (storage) storage.setItem(o.localKey, JSON.stringify(data)); } catch (e) { /* storage unavailable */ } }
  function later(ms) { clearTimeout(timer); timer = setTimeout(flush, ms); }
  function schedule() { saveLocal(); o.onStatus(); if (!ref) return; dirty = true; later(o.delayMs); }
  async function flush() {
    if (!ref || saving || !dirty) return;
    saving = true; dirty = false;
    try { await ref.set({ v: 1, ts: Date.now(), [o.field]: JSON.parse(JSON.stringify(data)) }); fails = 0; }
    catch (e) { dirty = true; fails++; }
    saving = false;
    if (dirty && fails < o.maxFails) later(fails ? o.retryMs : o.delayMs);
    o.onStatus();
  }
  function attach(db, uid) {
    let r;
    try { r = db.doc('data/users/' + uid + '/' + o.doc); } catch (e) { return false; }
    if (!r || typeof r.onSnapshot !== 'function') return false;
    ref = r;
    try {
      r.onSnapshot(snap => {
        const remote = snap.exists ? o.normalize((snap.data() || {})[o.field]) : {};
        const before = canonJSON(data);
        data = mergeByTs(data, remote);
        const now = canonJSON(data);
        if (now !== before) { saveLocal(); o.onRemote(); }
        // Write back only what the database lacks. Compared key-order-free: see the note at the top.
        if (now !== canonJSON(remote) && Object.keys(data).length) { dirty = true; later(o.delayMs); }
        o.onStatus();
      }, () => { ref = null; o.onStatus(); });
    } catch (e) { ref = null; return false; }
    return true;
  }
  return {
    loadLocal, attach, flush,
    get: k => data[k],
    put(k, v) { data[k] = v; schedule(); },
    // Change an entry without saving yet (typing); call touch() to save.
    set(k, v) { data[k] = v; },
    touch: schedule,
    saveLocal,
    all: () => data,
    replaceAll(x) { data = o.normalize(x); schedule(); },
    online: () => !!ref,
    busy: () => dirty || saving,
    statusText: () => ref ? (dirty || saving ? 'Saving to your account…' : 'Saved to your account') : 'Saved on this device'
  };
}

module.exports = { canonJSON, mergeByTs, createStore };

};
M["roleplay.js"] = function (module, exports) {
// Role-play prompts and scoring: Claude plays a counterpart with private facts and a walk-away limit for up to 8
// messages, then scores four rubric points 1 to 4.
//
// Origin: Inspect & Adapt V32 (rpPrompt, rpScorePrompt, rpEnd) is the base. Critical Path (build/template.html at
// 9fb1d70: rpSystem, rpClean, rpNorm, rpVerified, rpEnd) runs the same format with extra counterpart and scorer
// rules. Those rules are in RULES and SCORING below, each OFF unless an app turns it on, so that adopting one is
// a one-line config change and a version bump, not a code change.
'use strict';

// Counterpart rules. {learner} is replaced by the learner's role (e.g. 'Product Owner', 'project manager').
// The wording is Critical Path's, word for word, so an app that turns all three on sends the same rules sentence
// Critical Path sends (checked in test/unit.js).
const RULES = {
  guarded: 'a blunt, dismissive or hostile question is not earning a fact; answer it guardedly and reveal nothing private until the {learner} shows respect, acknowledges your position or makes a fair offer.',
  noCoaching: 'Never tell the {learner} what to ask, propose or do next, never list example questions or name the kinds of question you would answer, and never suggest the solution yourself.',
  noUnpromptedOffer: 'Never improve your own offer or position unless the {learner} asks you to or makes a counter-offer.'
};
// Scorer options:
//   outcomeAgreesWithScore  "good outcome reached" only when the scorer says reached AND the overall is 3 or more,
//                           and the scorer is told reached means the transcript ends at or near the strong resolution
//   verifiedQuotes          the scorer must quote the counterpart's own words for each uncovered fact; the page keeps
//                           a fact only if that quote (8+ characters after normalizing) appears in the counterpart's replies
const SCORING = ['outcomeAgreesWithScore', 'verifiedQuotes'];

const DEFAULTS = { learner: 'Product Owner', rules: [], scoring: [], plainText: true, overall: 'claude' };

function fill(t, learner) { return t.replace(/\{learner\}/g, learner); }
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function transcript(turns, me, them) { return turns.map(t => (t.role === 'me' ? me : them) + ': ' + t.text).join('\n'); }

// The counterpart's instructions, without the conversation.
function counterpartRules(x, cfg) {
  const c = Object.assign({}, DEFAULTS, cfg), L = c.learner;
  const on = c.rules.filter(r => RULES[r]);
  let rules = '';
  if (on.length) rules = '\nRules: ' + on.map((r, i) => { const t = fill(RULES[r], L); return i === 0 ? t : cap(t); }).join(' ');
  return 'Role-play for a ' + L + '\'s interview practice. You are ' + x.role + '. Persona: ' + x.persona +
    '\nPrivate facts you know (reveal one only when the ' + L + ' earns it with a good question, empathy or a fair offer; never list them): ' + x.hidden.join(' | ') +
    '\nYour walk-away limit: ' + x.walkaway +
    rules +
    (on.length ? ' Stay' : '\nStay') + ' in character, reply in 1 to 4 sentences of natural speech' +
    (c.plainText ? ' as plain text, with no quotation marks around the reply and no speaker label' : '') +
    ', never coach the ' + L + ' or mention scoring.';
}
function counterpartPrompt(x, turns, cfg) {
  const L = Object.assign({}, DEFAULTS, cfg).learner;
  return counterpartRules(x, cfg) + '\n\nConversation so far:\n' + transcript(turns, cap(L), 'You') + '\n\nReply as yourself with your next line only.';
}

// Tidies a counterpart reply: drops a leading speaker label and one pair of wrapping quotation marks.
// Critical Path's rpClean, with Inspect & Adapt's "You:" strip folded in.
function cleanReply(t) {
  t = String(t || '').trim().replace(/^(You|Counterpart):\s*/, '');
  const m = t.match(/^["“]([\s\S]*)["”]$/);
  return m ? m[1].trim() : t;
}

function scorePrompt(x, turns, cfg) {
  const c = Object.assign({}, DEFAULTS, cfg), L = c.learner;
  const agree = c.scoring.indexOf('outcomeAgreesWithScore') !== -1, quotes = c.scoring.indexOf('verifiedQuotes') !== -1;
  return 'Score a ' + L + '\'s role-play. Counterpart: ' + x.role + '. Private facts the ' + L + ' could uncover: ' + x.hidden.join(' | ') + '. Counterpart\'s walk-away: ' + x.walkaway + '. A strong resolution: ' + x.goodOutcome +
    '\nRubric:\n' + x.rubric.map((p, i) => (i + 1) + '. ' + p).join('\n') + '\n\nTranscript:\n' + transcript(turns, cap(L), 'Counterpart') +
    '\n\nReturn JSON only: {"points": [{"point": "<rubric point, short>", "score": 1-4, "comment": "<one sentence citing what the ' + L + ' said>"}], "overall": 1-4, "reached": true|false' +
    (agree ? ' (true only if the transcript ends at or near the strong resolution)' : '') +
    ', "uncovered": ' + (quotes ? '[{"fact": "<private fact, short>", "quote": "<the counterpart\'s own words stating it, copied exactly from the transcript>"}]' : '["<private facts the ' + L + ' actually drew out>"]') +
    ', "tip": "<one sentence>"}. Scale: 1 Strong No Hire, 2 No Hire, 3 Hire, 4 Strong Hire.' +
    (quotes ? ' List a private fact in uncovered only if the counterpart stated it in the transcript; leave out facts the ' + L + ' said first, facts the counterpart refused, and hints.' : '') +
    ' Judge only the transcript.';
}

const norm = t => String(t || '').toLowerCase().replace(/[‘’]/g, '\'').replace(/[“”]/g, '"').replace(/[^a-z0-9$']+/g, ' ').trim();
// Keeps an uncovered fact only if its quote is in the counterpart's own replies. Critical Path's rpVerified.
function verifyUncovered(list, turns) {
  const said = norm(turns.filter(t => t.role === 'them').map(t => t.text).join(' '));
  return (Array.isArray(list) ? list : []).filter(u => u && typeof u === 'object' && typeof u.fact === 'string' && norm(u.quote).length >= 8 && said.includes(norm(u.quote)))
    .map(u => u.fact + ' (“' + String(u.quote).trim() + '”)');
}

const clamp = v => Math.max(1, Math.min(4, Math.round(Number(v) || 1)));
// Reads a scorer reply into a fixed shape.
function readScore(v, turns, cfg) {
  const c = Object.assign({}, DEFAULTS, cfg);
  const points = (Array.isArray(v.points) ? v.points : []).slice(0, 4).map(p => ({ point: String(p.point || ''), score: clamp(p.score), comment: String(p.comment || '') }));
  // overall: 'claude' keeps the scorer's own overall (Inspect & Adapt and Critical Path today);
  // 'mean' uses the rounded mean of the points, so the overall cannot disagree with them (open decision 18).
  const overall = c.overall === 'mean' && points.length ? clamp(points.reduce((a, p) => a + p.score, 0) / points.length) : clamp(v.overall);
  const agree = c.scoring.indexOf('outcomeAgreesWithScore') !== -1, quotes = c.scoring.indexOf('verifiedQuotes') !== -1;
  return {
    points, overall,
    reached: !!v.reached && (!agree || overall >= 3),
    uncovered: quotes ? verifyUncovered(v.uncovered, turns) : (Array.isArray(v.uncovered) ? v.uncovered : []).map(u => typeof u === 'string' ? u : String((u && u.fact) || '')).filter(Boolean),
    tip: String(v.tip || '')
  };
}

module.exports = { RULES, SCORING, DEFAULTS, counterpartRules, counterpartPrompt, cleanReply, scorePrompt, verifyUncovered, readScore, transcript, norm };

};
M["craft.js"] = function (module, exports) {
// Craft: written practice. A packet (brief, data, stakeholder notes) handed back one stage at a time; Claude grades
// each stage against a fixed checklist (Meets / Partly / Misses) with a "Change to" line, and the worked answer and
// checklist always work without Claude. A "set" is a packet of short drafts, fixed one item at a time.
//
// Origin: Inspect & Adapt V32 index.src.html, "craft packets" section (base). Going Concern V27 carries a port
// (fx* names); its differences are resolved here and listed in docs/DECISIONS.md.
'use strict';
const { createStore } = req('./save.js');

const PERMANENT = ['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'];
const ERR_COPY = {
  rate_limited: 'Claude is busy or your usage limit was reached. Try again later.',
  session_expired: 'Sign in to Claude again, then retry.',
  refused: 'Claude declined this request. Edit your answer and try again.',
  empty_completion: 'No feedback came back. Try again.',
  prompt_too_large: 'Your answer is too long to review. Shorten it and try again.'
};

const slug = id => String(id).toLowerCase().replace(/\./g, '-');

// ---------------------------------------------------------------- pure helpers (no page needed)
function blocksText(blocks) {
  return (blocks || []).map(b => {
    if (b.p) return b.p;
    if (b.ul) return b.ul.map(x => '- ' + x).join('\n');
    if (b.ol) return b.ol.map((x, i) => (i + 1) + '. ' + x).join('\n');
    if (b.quote) return b.quote;
    if (b.table) return b.table.head.join(' | ') + '\n' + b.table.rows.map(r => r.join(' | ')).join('\n');
    return '';
  }).join('\n');
}
function sectionsText(secs) { return secs.map(s => s.h.toUpperCase() + '\n' + blocksText(s.blocks)).join('\n\n'); }
function briefSections(p, s) { return s && s.brief && s.brief.length ? p.sections.filter(x => s.brief.indexOf(x.h) !== -1) : p.sections; }
function packetText(p, s) { return blocksText(p.lead) + '\n\n' + sectionsText(briefSections(p, s)) + '\n\nTASK\n' + p.taskLead + '\n' + p.taskList.map((t, i) => (i + 1) + '. ' + t).join('\n'); }
function keyText(p, s) { return sectionsText(s && s.keyFor && s.keyFor.length ? p.key.filter(x => s.keyFor.indexOf(x.h) !== -1) : p.key); }
function modelText(s) { return s.model.map(m => m.h + '\n' + blocksText(m.blocks)).join('\n\n'); }
function selfMark(text) { return text.length + ':' + text.slice(0, 40); }

// Reads a grader reply into a fixed shape; throws { code: 'bad_reply' } when it has no items.
function parseFeedback(v, n) {
  if (!v || !Array.isArray(v.items)) throw { code: 'bad_reply' };
  const items = v.items.slice(0, n).map(it => {
    let st = String((it && it.status) || '').toLowerCase();
    st = st.indexOf('meet') === 0 ? 'meets' : st.indexOf('part') === 0 ? 'partly' : 'misses';
    return { status: st, why: String((it && it.why) || '').slice(0, 300), rewrite: st === 'meets' ? '' : String((it && it.rewrite) || '').slice(0, 1200) };
  });
  while (items.length < n) items.push({ status: 'misses', why: 'Not graded; ask again.', rewrite: '' });
  return { items, works: String(v.works || '').slice(0, 400), optional: String(v.optional || '').slice(0, 400), changed_mind: String(v.changed_mind || '').slice(0, 500) };
}

// The grader prompt. `domain` names the field ('product management'); `factsSubject` names what an answer may not
// invent ('product, people or data'). Everything else is Inspect & Adapt's wording, unchanged.
function gradePrompt(p, s, text, prev, cfg) {
  const c = Object.assign({ domain: 'product management', factsSubject: 'product, people or data', maxChars: 12000 }, cfg);
  let q = 'You grade a ' + c.domain + ' writing exercise against a fixed checklist. You are consistent: the same answer always gets the same grades, and you never ask for changes the checklist does not require.\n\n' +
    'EXERCISE BRIEF:\nPACKET GIVEN TO THE LEARNER (' + p.title + '). ' + (s.brief && s.brief.length ? 'The learner fixes one draft at a time. This is item ' + s.n + ' of ' + p.stages.length + ': ' + s.title + '. Only this item is shown below.' : 'The learner is the ' + p.role + ' and hands back working notes one stage at a time. This is stage ' + s.n + ' of ' + p.stages.length + ': ' + s.title + '.') + '\n\n' + packetText(p, s) +
    '\n\nPLANTED ITEMS KEY (for grading only; the learner has not seen it; ids like G1 or C1 in the checklist refer to it):\n' + keyText(p, s) +
    '\n\nNOTES ON THE WHOLE PACKET (context only; the checklist below is the only grading standard):\n' + p.grading.map(g => '- ' + g).join('\n') +
    '\n\nTASK FOR THIS STAGE:\n' + s.task +
    '\n\nCHECKLIST (the only grading standard):\n' + s.checklist.map((x, i) => (i + 1) + '. ' + x).join('\n') +
    (s.optional.length ? '\n\nOPTIONAL (never required; never lowers a grade):\n- ' + s.optional.join('\n- ') : '') +
    '\n\nONE ACCEPTABLE REFERENCE ANSWER (for calibration only; many wordings pass, and differing from it is never a reason to lower a grade):\n' + modelText(s) +
    '\n\nTHE LEARNER\'S ANSWER:\n' + text.slice(0, c.maxChars);
  if (prev) q += '\n\nYOUR PREVIOUS ROUND (on their earlier draft):\nEarlier draft:\n' + prev.text.slice(0, 8000) + '\nYour grades then: ' + prev.fb.items.map((it, i) => (i + 1) + '=' + it.status + (it.rewrite ? ' (you suggested: ' + it.rewrite + ')' : '')).join('; ');
  q += '\n\nRULES:\n' +
    '- Grade each checklist point literally: "meets" if the answer satisfies it in substance, even if worded differently from the reference; "partly" if it is attempted but incomplete; "misses" if absent or wrong.\n' +
    '- Give a rewrite ONLY for points graded partly or misses. The rewrite is the exact replacement line(s) for their answer that would make that point meet, changing nothing else.\n' +
    '- For the point about facts tracing to the packet: proposals, recommendations, questions and arithmetic on the packet\'s figures are not facts that need a label. Lower that point only when the answer states as fact something about the company, ' + c.factsSubject + ' that the packet does not say, and quote that statement in "why".\n' +
    '- Style preferences, extra detail, and anything not in the checklist never lower a grade. You may mention at most one such idea under "optional", or leave it empty.\n' +
    (prev ? '- Stay consistent with your previous round. A point you graded meets stays meets unless the learner changed the text it depends on or you find a definite error. If the learner applied your suggested rewrite, that point meets unless the rewrite itself was wrong. Whenever you change a grade without the learner changing the related text, or now advise against something you suggested before, explain it plainly in "changed_mind"; otherwise leave changed_mind empty.\n' : '- Leave changed_mind empty.\n') +
    '\nReturn JSON only: {"items":[{"status":"meets|partly|misses","why":"under 20 words","rewrite":"<only when not meets, else empty>"} x' + s.checklist.length + ' in checklist order], "works":"one sentence on what is strong", "optional":"<one optional idea or empty>", "changed_mind":"<see rules>"}';
  return q;
}

// A stage's progress label.
function stageStatusOf(c, s) {
  const text = (c.text || '').trim(), last = c.rounds[c.rounds.length - 1];
  if (!text) return { k: 'none', label: '' };
  if (last) {
    const met = last.fb.items.filter(i => i.status === 'meets').length, n = s.checklist.length, same = last.text.trim() === text;
    if (met === n && same) return { k: 'done', label: 'Completed' };
    if (same) return { k: 'fb', label: 'Feedback: ' + met + ' of ' + n };
  }
  if (c.self && c.self === selfMark(text)) return { k: 'self', label: 'Self-checked' };
  return last ? { k: 'fb', label: 'Edited since feedback' } : { k: 'draft', label: 'Drafted' };
}

// ---------------------------------------------------------------- the engine on a page
// cfg:
//   packets     from build/craft-parse.js
//   appKey      localStorage prefix: answers live under '<appKey>:craft:v1'
//   keyStyle    'slug' (Inspect & Adapt: entries keyed 'cf-1-1') or 'id' (Going Concern: 'FX-1.1'). Keep an app's
//               existing style, or its saved answers will not be found.
//   domain, factsSubject   grader wording (see gradePrompt)
//   minChars    shortest answer sent for grading (20)
//   maxChars, rounds       12000 characters, 4 rounds kept
//   act         prefix for data-act names, so an app with its own "packet" action can avoid a clash ('')
//   ids         element id prefix ('craft')
//   modelTier   passed to the sampler when set (Going Concern passes 'complex')
//   host        the app's side; see README "Host interface"
function create(cfg) {
  const C = Object.assign({ appKey: 'study-kit', keyStyle: 'slug', minChars: 20, maxChars: 12000, rounds: 4, act: '', ids: 'craft', modelTier: null }, cfg);
  const H = C.host, esc = H.esc;
  const PACKETS = C.packets, PK = new Map(), ST = new Map(), STK = new Map();
  const keyOf = id => C.keyStyle === 'id' ? String(id) : slug(id);
  PACKETS.forEach(p => { PK.set(p.id, p); p.stages.forEach(s => { s.packet = p.id; ST.set(s.id, s); STK.set(keyOf(s.id), s); }); });
  const A = n => C.act + n, I = n => C.ids + '-' + n;

  function roundOf(r) {
    if (!r || typeof r !== 'object' || typeof r.ts !== 'number' || !r.fb || !Array.isArray(r.fb.items)) return null;
    return { ts: r.ts, text: String(r.text || '').slice(0, C.maxChars), fb: parseFeedback(r.fb, r.fb.items.length) };
  }
  function normalize(x) {
    const o = {};
    if (!x || typeof x !== 'object') return o;
    for (const k in x) {
      const r = x[k];
      if (!STK.has(k) || !r || typeof r !== 'object') continue;
      o[k] = { text: String(r.text || '').slice(0, C.maxChars), ts: Number(r.ts) || 0, self: String(r.self || '').slice(0, 80), rounds: (Array.isArray(r.rounds) ? r.rounds : []).map(roundOf).filter(Boolean).slice(-C.rounds) };
    }
    return o;
  }
  const store = createStore({
    localKey: C.appKey + ':craft:v1', doc: 'craft', field: 'stages', normalize, storage: C.storage,
    // A remote change redraws the list or packet page, but never the screen being typed on.
    onRemote() { const sc = H.screen(); if ((sc === 'craft' || sc === 'packet') && !typing()) H.render(); },
    onStatus: paintSaved
  });
  function typing() { if (typeof document === 'undefined') return false; const el = document.activeElement; return !!(el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT')); }

  const get = s => store.get(keyOf(s.id)) || { text: '', ts: 0, self: '', rounds: [] };
  const put = (s, patch) => { const k = keyOf(s.id); store.put(k, Object.assign({ text: '', self: '', rounds: [] }, store.get(k), patch, { ts: Date.now() })); };
  const status = s => stageStatusOf(get(s), s);
  const packetDone = p => p.stages.filter(s => { const k = status(s).k; return k === 'done' || k === 'self'; }).length;

  // -------------------------------------------------- rendering
  const chip = st => st.k === 'none' ? '' : '<span class="cchip ' + (st.k === 'done' ? 'ok' : st.k === 'self' ? 'self' : 'draft') + '">' + esc(st.label) + '</span>';
  const draftChip = p => p.status ? '<span class="cchip draft">' + esc(p.status) + '</span>' : '';
  // A two-column table stays a table. Wider ones become stacked rows, which fit a phone without sideways scrolling.
  function blocksHTML(blocks) {
    return (blocks || []).map(b => {
      if (b.p) return '<p>' + esc(b.p) + '</p>';
      if (b.ul) return '<ul>' + b.ul.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>';
      if (b.ol) return '<ol>' + b.ol.map(x => '<li>' + esc(x) + '</li>').join('') + '</ol>';
      if (b.quote) return '<blockquote>' + b.quote.split('\n').map(l => l ? '<p>' + esc(l) + '</p>' : '').join('') + '</blockquote>';
      if (b.table) {
        const t = b.table;
        if (t.head.length === 2 && t.rows.every(r => String(r[1]).length <= 24)) return '<table class="pktbl"><thead><tr>' + t.head.map(h => '<th scope="col">' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' + t.rows.map(r => '<tr><th scope="row">' + esc(r[0]) + '</th><td>' + esc(r[1]) + '</td></tr>').join('') + '</tbody></table>';
        return '<div class="srows">' + t.rows.map(r => '<div class="srow"><p class="srow-h">' + esc(r[0]) + '</p><dl>' + r.slice(1).map((c, j) => '<div><dt>' + esc(t.head[j + 1]) + '</dt><dd>' + esc(c) + '</dd></div>').join('') + '</dl></div>').join('') + '</div>';
      }
      return '';
    }).join('');
  }
  const sectionsHTML = (secs, tag) => secs.map(s => '<' + tag + '>' + esc(s.h) + '</' + tag + '>' + blocksHTML(s.blocks)).join('');
  const packetHTML = (p, tag) => '<div class="pk">' + blocksHTML(p.lead) + sectionsHTML(p.sections, tag) + '</div>';
  const keyHTML = p => sectionsHTML(p.key, 'h3') + '<h3>What a strong hand-back does</h3><ul>' + p.grading.map(g => '<li>' + esc(g) + '</li>').join('') + '</ul>';
  const savedText = () => store.statusText();
  function paintSaved() { if (typeof document === 'undefined') return; const el = document.getElementById(I('saved')); if (el) el.textContent = savedText(); }
  const draftNote = '<p class="note"><b>Draft</b> means you have not reviewed the packet, its key or its checklists yet. Craft work does not count toward Readiness or the daily review.</p>';

  function renderList() {
    const rows = PACKETS.map(p => {
      const d = packetDone(p);
      return '<div class="trow"><div class="top"><b>' + esc(p.title) + '</b>' + draftChip(p) + '</div>' +
        '<div class="qmeta"><span>' + esc(p.kind) + (p.stageWord === 'Stage' ? ' · you are the ' + esc(p.role) : '') + '</span><span class="qid">' + d + ' of ' + p.stages.length + ' ' + p.stageWord.toLowerCase() + 's done</span></div>' +
        '<p class="note">' + esc(p.blurb) + '</p>' +
        '<div class="row"><button class="btn btn-small btn-primary" data-act="' + A('packet') + '" data-id="' + p.id + '">Open the packet</button></div></div>';
    }).join('');
    H.paint(H.listHeader('Craft') + '<main class="wrap">' +
      '<p class="note">Written practice. A packet is a brief with data and notes from stakeholders who do not agree; you hand back your working notes one stage at a time. A set is a group of short drafts to fix, one item at a time. Each stage or item is checked against a fixed checklist.</p>' +
      '<section aria-labelledby="' + I('ch') + '"><div class="section-h"><h2 id="' + I('ch') + '">Packets and sets</h2><span class="hint">' + PACKETS.length + ' in all</span></div><div class="stack">' + rows + '</div></section>' +
      (PACKETS.some(p => p.status) ? draftNote : '') + '</main>');
  }
  function renderPacket() {
    const p = PK.get(H.view().packet); if (!p) { H.go('craft', {}); return; }
    const stages = p.stages.map(s => '<button class="strow" data-act="' + A('stage') + '" data-id="' + s.id + '"><span class="n">' + s.n + '</span><span class="nm">' + esc(s.title) + '</span>' + chip(status(s)) + '</button>').join('');
    H.paint(H.header(p.title, A('craft'), '', 'Back to Craft', '') + '<main class="wrap">' +
      '<article class="card pkcard"><div class="qmeta"><span class="cchip kind">' + esc(p.kind) + '</span>' + draftChip(p) + '<span class="qid">' + p.id + '</span></div>' +
      '<h2>' + esc(p.title) + '</h2><p>' + esc(p.blurb) + '</p>' +
      '<div class="fbblock"><h3>Your task</h3><p>' + esc(p.taskLead) + '</p><ol class="tasklist">' + p.taskList.map(t => '<li>' + esc(t) + '</li>').join('') + '</ol></div>' +
      '<p class="note"><b>Planted in this packet:</b> ' + esc(p.planted) + '</p></article>' +
      '<section aria-labelledby="' + I('sh') + '"><div class="section-h"><h2 id="' + I('sh') + '">' + p.stageWord + 's</h2><span class="hint">' + packetDone(p) + ' of ' + p.stages.length + ' done · each gets its own feedback</span></div><div class="strows">' + stages + '</div></section>' +
      '<section aria-labelledby="' + I('ph') + '"><div class="section-h"><h2 id="' + I('ph') + '">The packet</h2></div><article class="card">' + packetHTML(p, 'h3') + '</article></section>' +
      '<section aria-labelledby="' + I('kh') + '"><div class="section-h"><h2 id="' + I('kh') + '">Key</h2></div>' +
      (H.view().key ? '<article class="card"><div class="pk">' + keyHTML(p) + '</div></article>' :
        '<p class="note">The key lists every planted contradiction, gap and trap, with the arithmetic. Open it after your last stage.</p><div class="row"><button class="btn" data-act="' + A('pk-key') + '">Show the key</button></div>') + '</section>' +
      (H.linkBase !== undefined ? '<div class="row"><button class="btn btn-small" data-act="' + A('copy-packet-link') + '" data-id="' + p.id + '">Copy link to this packet</button></div>' : '') +
      (p.status ? draftNote : '') +
      '</main>');
  }

  let FB = { busy: false, id: null, err: '', ctrl: null };
  function fbStop() { if (FB.ctrl) { try { FB.ctrl.abort(); } catch (e) { /* already settled */ } } }
  function fbPanelHTML(s) {
    const c = get(s), rounds = c.rounds, last = rounds[rounds.length - 1], n = s.checklist.length;
    if (FB.busy && FB.id === s.id) return '<section class="fbx" aria-live="polite"><p class="eyebrow">Claude’s feedback</p><p>Checking your answer against the ' + n + '-point checklist…</p></section>';
    let h = '';
    if (FB.err && FB.id === s.id) h += '<p class="note" role="status">' + esc(FB.err) + '</p>';
    if (!last) return h;
    const r = last.fb, met = r.items.filter(i => i.status === 'meets').length, done = met === n;
    h += '<section class="fbx' + (done ? ' done' : '') + '" aria-live="polite"><p class="eyebrow">Claude’s feedback · round ' + rounds.length + ' · ' + esc(H.fmtDate(last.ts)) + '</p>' +
      '<p><b>' + (done ? 'Done. Your answer meets all ' + n + ' checklist points.' : met + ' of ' + n + ' checklist points met.') + '</b>' + (done ? ' No changes are needed. Anything marked optional is a matter of taste.' : ' Fix only the points marked Partly or Misses; the rest already pass.') + '</p>';
    if ((c.text || '').trim() && c.text.trim() !== last.text.trim()) h += '<p class="note">You have edited your answer since this round. Ask again to grade the new version.</p>';
    if (r.changed_mind) h += '<p class="note"><b>Change from last round:</b> ' + esc(r.changed_mind) + '</p>';
    h += '<ol class="fblist">' + r.items.map((it, i) => {
      const lab = it.status === 'meets' ? 'Meets' : it.status === 'partly' ? 'Partly' : 'Misses';
      return '<li class="' + it.status + '"><span class="fbst">' + lab + '</span><span class="fbck">' + esc(s.checklist[i] || '') + '</span>' +
        (it.why ? '<span class="fbwhy">' + esc(it.why) + '</span>' : '') + (it.status !== 'meets' && it.rewrite ? '<span class="fbrw"><b>Change to:</b> ' + esc(it.rewrite) + '</span>' : '') + '</li>';
    }).join('') + '</ol>';
    if (r.works) h += '<p><b>What works:</b> ' + esc(r.works) + '</p>';
    if (r.optional) h += '<p class="note"><b>Optional, not required:</b> ' + esc(r.optional) + '</p>';
    h += '<p class="note">Written by Claude from the packet, its key and this checklist. The grades are a second opinion: compare with the worked answer.</p>' +
      '<div class="row"><button class="btn btn-small btn-quiet" data-act="' + A('fb-reset') + '">Clear feedback history</button></div></section>';
    return h;
  }
  function actionsHTML(s) {
    const busy = FB.busy && FB.id === s.id, can = !!H.sampler();
    let h = '<div class="row">';
    if (busy) h += '<button class="btn" data-act="' + A('fb-stop') + '">Stop</button>';
    else if (can) h += '<button class="btn btn-primary" data-act="' + A('fb-ask') + '">Get Claude’s feedback</button>';
    if (!H.view().reveal) h += '<button class="btn" data-act="' + A('stage-reveal') + '">Show worked answer and checklist</button>';
    h += '</div>';
    if (!can) h += '<p class="note">Claude’s feedback appears when this page is open in Claude and you allow it to ask Claude. The worked answer and checklist always work.</p>';
    return h;
  }
  function paintStageParts() {
    if (H.screen() !== 'stage' || typeof document === 'undefined') return;
    const s = ST.get(H.view().stage); if (!s) return;
    const a = document.getElementById(I('actions')), f = document.getElementById(I('fb'));
    if (a) a.innerHTML = actionsHTML(s);
    if (f) f.innerHTML = fbPanelHTML(s);
  }
  function renderStage() {
    const V = H.view(), s = ST.get(V.stage); if (!s) { H.go('craft', {}); return; }
    const p = PK.get(s.packet), c = get(s), st = status(s);
    const prev = p.stages[s.n - 2], next = p.stages[s.n];
    let h = '<article class="card stagecard"><div class="qmeta"><span class="cchip kind">' + p.stageWord + ' ' + s.n + ' of ' + p.stages.length + '</span>' + draftChip(p) + '<span class="qid">' + s.id + '</span></div>' +
      '<h2 id="' + I('stage-h') + '" tabindex="-1">' + esc(s.title) + '</h2>' +
      '<p><b>Your task' + (s.parts.length > 1 ? ' (parts ' + s.parts.join(' and ') + ' of ' + p.taskList.length + ')' : ' (part ' + s.parts[0] + ' of ' + p.taskList.length + ')') + ':</b> ' + esc(s.task) + '</p>' +
      (s.brief && s.brief.length ? '<div class="pk">' + blocksHTML(p.lead) + sectionsHTML(briefSections(p, s), 'h3') + '</div>' :
        '<details class="more" data-pk' + (V.pkOpen ? ' open' : '') + '><summary>The packet: brief, data and notes</summary>' + packetHTML(p, 'h3') + '</details>');
    const lessons = (s.lessons || []).map(id => { const t = H.lessonTitle && H.lessonTitle(id); return t ? '<button class="btn btn-small" data-act="lesson" data-id="' + esc(id) + '" data-from="stage:' + s.id + '">' + esc(t) + '</button>' : ''; }).join('');
    if (lessons) h += '<div class="fbblock"><h3>Lessons on this</h3><div class="row">' + lessons + '</div></div>';
    h += '</article>';
    h += '<section class="answer"><label for="' + I('text') + '" class="eyebrow">Your answer</label><textarea id="' + I('text') + '" class="sk-answer" rows="14" maxlength="' + C.maxChars + '" spellcheck="true">' + esc(c.text || '') + '</textarea>' +
      '<p class="saved" id="' + I('saved') + '" role="status">' + savedText() + '</p></section>';
    h += '<div id="' + I('actions') + '" class="stackgap">' + actionsHTML(s) + '</div>';
    h += '<div id="' + I('fb') + '" class="stackgap">' + fbPanelHTML(s) + '</div>';
    if (V.reveal) {
      h += '<section aria-labelledby="' + I('wh') + '"><div class="section-h"><h2 id="' + I('wh') + '">Worked answer</h2><span class="hint">One answer that passes; yours can differ</span></div><article class="card"><div class="pk">' + sectionsHTML(s.model, 'h3') + '</div></article></section>' +
        '<section aria-labelledby="' + I('clh') + '"><div class="section-h"><h2 id="' + I('clh') + '">Checklist</h2><span class="hint">' + s.checklist.length + ' points</span></div><article class="card"><ol class="checklist">' + s.checklist.map(x => '<li>' + esc(x) + '</li>').join('') + '</ol>' +
        (s.optional.length ? '<div class="fbblock"><h3>Optional (does not affect the grade)</h3><ul class="plain">' + s.optional.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul></div>' : '') + '</article>';
      if (st.k === 'draft' || st.k === 'self') h += '<div class="row"><button class="btn btn-small" data-act="' + A('stage-self') + '" aria-pressed="' + (st.k === 'self') + '">' + (st.k === 'self' ? 'Undo self-check' : 'I checked my answer against this list') + '</button></div>';
      h += '</section>';
    }
    h += '<div class="row">' + (prev ? '<button class="btn" data-act="' + A('stage') + '" data-id="' + prev.id + '">← ' + p.stageWord + ' ' + prev.n + '</button>' : '') +
      (next ? '<button class="btn" data-act="' + A('stage') + '" data-id="' + next.id + '">' + p.stageWord + ' ' + next.n + ' →</button>' : '') +
      '<button class="btn btn-quiet" data-act="' + A('packet') + '" data-id="' + p.id + '">Back to the packet</button></div>';
    H.paint(H.header(p.title, A('packet'), p.id, 'Back to the packet', s.n + '/' + p.stages.length) + '<main class="wrap">' + h + '</main>');
  }

  async function fbAsk() {
    const s = ST.get(H.view().stage), fn = H.sampler(); if (!s || !fn || FB.busy) return;
    const text = (get(s).text || '').trim();
    const say = msg => { FB = { busy: false, id: s.id, err: msg, ctrl: null }; paintStageParts(); };
    if (text.length < C.minChars) { say('Write your answer first.'); return; }
    const rounds = get(s).rounds, prev = rounds[rounds.length - 1] || null;
    if (prev && prev.text.trim() === text) { say('No changes since the last round, so the grades would be the same.'); return; }
    const prompt = gradePrompt(PK.get(s.packet), s, text, prev, C), ctrl = new AbortController();
    FB = { busy: true, id: s.id, err: '', ctrl }; paintStageParts();
    try {
      const opts = { cache: false, signal: ctrl.signal };
      if (C.modelTier) opts.modelTier = C.modelTier;
      let v;
      if (typeof fn.json === 'function') v = await fn.json(prompt, opts);
      else { const r = await fn(prompt, opts), t = String((r && r.text) || ''); v = JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1)); }
      const fb = parseFeedback(v, s.checklist.length);
      put(s, { rounds: get(s).rounds.concat([{ ts: Date.now(), text: text.slice(0, C.maxChars), fb }]).slice(-C.rounds) });
      FB = { busy: false, id: s.id, err: '', ctrl: null };
    } catch (e) {
      const code = e && e.code;
      let err;
      if (PERMANENT.indexOf(code) !== -1) { H.samplerGone(); err = ''; H.toast('Claude’s feedback is not available here. The worked answer still is.'); }
      else if (code === 'aborted' || code === 'cancelled' || (e && e.name === 'AbortError')) err = 'Stopped.';
      else err = code === 'bad_reply' || e instanceof SyntaxError ? 'The feedback came back in a form the app could not read. Try again.' : (ERR_COPY[code] || 'Feedback did not finish. Try again.');
      FB = { busy: false, id: s.id, err, ctrl: null };
    }
    paintStageParts();
  }

  function focusHeading() { if (typeof document === 'undefined') return; const h = document.getElementById(I('stage-h')); if (h) { try { h.focus({ preventScroll: true }); } catch (e) { h.focus(); } } }
  function openList() { fbStop(); H.go('craft', {}); return true; }
  function openPacket(id) { if (!PK.has(id)) return false; fbStop(); H.go('packet', { packet: id }); return true; }
  function openStage(id) { if (!ST.has(id)) return false; fbStop(); H.go('stage', { stage: id }); focusHeading(); return true; }
  const keepPkOpen = () => { if (typeof document === 'undefined') return; const d = document.querySelector('details[data-pk]'); H.view().pkOpen = !!(d && d.open); };

  const actions = {
    [A('craft')]() { openList(); },
    [A('packet')](el) { openPacket(el.dataset.id); },
    [A('stage')](el) { openStage(el.dataset.id); },
    [A('pk-key')]() { H.view().key = true; H.keepScroll(); },
    [A('copy-packet-link')](el) { const p = PK.get(el.dataset.id); if (p) H.copy(link('packet', p.id), 'Link copied.'); },
    [A('stage-reveal')]() { keepPkOpen(); H.view().reveal = true; H.keepScroll(); },
    [A('stage-self')]() {
      const s = ST.get(H.view().stage); if (!s) return;
      const c = get(s), t = (c.text || '').trim();
      if (!t) { H.toast('Write your answer first.'); return; }
      put(s, { self: c.self === selfMark(t) ? '' : selfMark(t) }); keepPkOpen(); H.keepScroll();
    },
    [A('fb-ask')]() { fbAsk(); },
    [A('fb-stop')]() { fbStop(); },
    [A('fb-reset')]() { const s = ST.get(H.view().stage); if (s) H.confirm('Clear feedback history?', 'Your answer is kept. The earlier rounds of feedback for this stage are removed.', 'Clear', () => { put(s, { rounds: [] }); FB.err = ''; paintStageParts(); }); }
  };
  // Typing updates the answer at once and saves 1.2 s after the last keystroke.
  let draftT = null;
  function onInput(e) {
    if (!e.target || e.target.id !== I('text') || H.screen() !== 'stage') return false;
    const s = ST.get(H.view().stage); if (!s) return false;
    const k = keyOf(s.id);
    store.set(k, Object.assign({ self: '', rounds: [] }, store.get(k), { text: e.target.value.slice(0, C.maxChars), ts: Date.now() }));
    clearTimeout(draftT); draftT = setTimeout(() => { store.touch(); paintSaved(); paintStageParts(); }, 1200);
    return true;
  }
  function onToggle(e) { if (e.target && e.target.matches && e.target.matches('details[data-pk]')) { H.view().pkOpen = e.target.open; return true; } return false; }
  function onPageHide() { if (Object.keys(store.all()).length) store.saveLocal(); }
  // Links: #craft, #packet-<slug>, #stage-<slug>, matched without regard to case.
  function link(kind, id) { return (H.linkBase || '') + '#' + kind + (id ? '-' + slug(id) : ''); }
  function route(hash) {
    const h = String(hash || '').replace(/^#/, '').toLowerCase();
    if (h === 'craft') return openList();
    let m;
    if ((m = /^packet-(.+)$/.exec(h))) { const p = PACKETS.find(x => slug(x.id) === m[1]); return p ? openPacket(p.id) : false; }
    if ((m = /^stage-(.+)$/.exec(h))) { const s = Array.from(ST.values()).find(x => slug(x.id) === m[1]); return s ? openStage(s.id) : false; }
    return false;
  }
  // Every id this engine publishes as a link target, for the app's published-ids.json.
  const linkIds = () => PACKETS.reduce((a, p) => a.concat([p.id], p.stages.map(s => s.id)), []);

  return {
    screens: { craft: renderList, packet: renderPacket, stage: renderStage },
    actions, onInput, onToggle, onPageHide, route, link, linkIds,
    start() { store.loadLocal(); },
    attach: (db, uid) => store.attach(db, uid),
    store, status, packetDone, get, put,
    stop: fbStop, _fb: () => FB
  };
}

module.exports = { create, slug, parseFeedback, gradePrompt, stageStatusOf, selfMark, blocksText, sectionsText, packetText, keyText, modelText, PERMANENT, ERR_COPY };

};
M["sims.js"] = function (module, exports) {
// Simulations: a stepped run (choices move four meters, set flags that come back later as knock-ons, and add to
// planned and achieved business value) and live role-plays (see roleplay.js).
//
// Origin: Inspect & Adapt V32 index.src.html, "simulations" section, unchanged in behaviour except where
// docs/DECISIONS.md says otherwise. Run and role-play state share one document, data/users/<id>/sims.
'use strict';
const { createStore, mergeByTs } = req('./save.js');
const RP = req('./roleplay.js');

// ---------------------------------------------------------------- run engine (pure)
function runFresh(r) { const m = {}; r.meters.forEach(k => { m[k] = 70; }); return { ts: 0, i: 0, picks: {}, meters: m, pv: { planned: r.start.planned, actual: r.start.actual }, flags: [], missed: [] }; }
function runAvg(r, x) { return Math.round(r.meters.reduce((a, k) => a + x.meters[k], 0) / r.meters.length); }
// Predictability: business value achieved ÷ planned, as a percentage to one decimal.
function runPred(x) { return x.pv.planned ? Math.round(1000 * x.pv.actual / x.pv.planned) / 10 : 0; }
// Applies choice j at the current step to x (mutates and returns x). A step already answered is left alone.
function runApply(r, x, j) {
  const s = r.steps[x.i];
  if (!s || x.picks[s.id] !== undefined) return x;
  const before = Object.assign({}, x.meters), e = s.effects[j] || {};
  r.meters.forEach(k => { x.meters[k] = Math.max(0, Math.min(100, x.meters[k] + (e[k] || 0))); });
  const pv = { planned: 0, actual: 0 }, add = d => { if (d) { pv.planned += d.planned || 0; pv.actual += d.actual || 0; } };
  add((s.pv || {})[j]);
  for (const f in (s.pvIf || {})) if (x.flags.indexOf(f) !== -1) add(s.pvIf[f][j]);
  x.pv.planned += pv.planned; x.pv.actual += pv.actual;
  const f = (s.sets || {})[j]; if (f && x.flags.indexOf(f) === -1) x.flags.push(f);
  if (j !== s.answer) x.missed.push(s.id);
  x.picks[s.id] = j; x.last = { before, pv };
  return x;
}
function runEnding(r, x) { const avg = runAvg(r, x); return { avg, ending: r.endings.find(e => avg >= e.min) }; }

// ---------------------------------------------------------------- the engine on a page
// cfg:
//   runs, roleplays   from build/sims-validate.js
//   appKey            localStorage prefix: state lives under '<appKey>:sims:v1'
//   intro             note at the top of the list
//   runNoun           label for a run on the list ('PI run')
//   per run (optional): blurb (list note), predNote (after the predictability line), endLabel (last Next button)
//   rpHeading         heading over the role-plays ('Product Owner role-plays')
//   roleplay          { learner, rules, scoring, plainText, overall }, see roleplay.js
//   act               data-act prefix ('')
//   host              see README "Host interface"
function create(cfg) {
  const C = Object.assign({ appKey: 'study-kit', runNoun: 'Run', rpHeading: 'Role-plays', act: '', roleplay: {} }, cfg);
  const H = C.host, esc = H.esc, A = n => C.act + n;
  const RUNS = C.runs || [], RPS = C.roleplays || [], R = Object.assign({}, RP.DEFAULTS, C.roleplay);
  const ids = new Set(RUNS.map(r => r.id).concat(RPS.map(x => x.id)));
  function normalize(x) {
    const o = {};
    if (!x || typeof x !== 'object') return o;
    for (const k in x) { const v = x[k]; if (ids.has(k) && v && typeof v === 'object' && typeof v.ts === 'number') o[k] = JSON.parse(JSON.stringify(v)); }
    return o;
  }
  const store = createStore({
    localKey: C.appKey + ':sims:v1', doc: 'sims', field: 'sims', normalize, storage: C.storage,
    onRemote() { const sc = H.screen(); if (sc === 'sims' || sc === 'run') H.render(); },
    onStatus() { if (typeof document === 'undefined') return; const el = document.getElementById('sims-saved'); if (el) el.textContent = store.statusText(); }
  });
  const runGet = r => { const x = store.get(r.id); return x && x.meters ? x : runFresh(r); };
  const runPut = (r, x) => { x.ts = Date.now(); store.put(r.id, x); };
  const draft = o => o.status ? '<span class="cchip draft">' + esc(o.status) + '</span>' : '';

  function meterRow(r, m, before) {
    return '<div class="smeters">' + r.meters.map(k => {
      const v = m[k], d = before ? v - before[k] : 0, cls = v >= 60 ? 'ok' : v >= 40 ? 'warn' : 'bad';
      return '<div class="smeter"><span class="mlab">' + esc(r.meterLabels[k]) + '</span><span class="mval">' + v + (d ? ' <em class="' + (d > 0 ? 'up' : 'down') + '">' + (d > 0 ? '+' : '') + d + '</em>' : '') + '</span>' +
        '<span class="mbar" aria-hidden="true"><i class="' + cls + '" style="width:' + v + '%"></i></span></div>';
    }).join('') + '</div>';
  }
  function renderList() {
    const runs = RUNS.map(r => {
      const x = runGet(r), done = x.i >= r.steps.length;
      return '<div class="trow"><div class="top"><b>' + esc(r.title) + '</b>' + draft(r) + '</div>' +
        '<div class="qmeta"><span>' + esc(C.runNoun) + ' · you are the ' + esc(r.role) + '</span><span class="qid">' + (done ? 'Finished · predictability ' + runPred(x) + '%' : x.i ? 'Step ' + (x.i + 1) + ' of ' + r.steps.length : r.steps.length + ' steps') + '</span></div>' +
        (r.blurb ? '<p class="note">' + esc(r.blurb) + '</p>' : '') +
        '<div class="row"><button class="btn btn-small btn-primary" data-act="' + A('run') + '" data-id="' + r.id + '">' + (done ? 'See the result' : x.i ? 'Continue' : 'Start the run') + '</button></div></div>';
    }).join('');
    const rps = RPS.map(x => {
      const s = store.get(x.id);
      return '<div class="trow"><div class="top"><b>' + esc(x.title) + '</b>' + draft(x) + '</div>' +
        '<div class="qmeta"><span>Role-play · ' + esc(x.role) + '</span><span class="qid">' + (s && s.best ? 'Best ' + s.best + ' of 4' : '') + '</span></div>' +
        '<div class="row"><button class="btn btn-small btn-primary" data-act="' + A('rp') + '" data-id="' + x.id + '">Open</button></div></div>';
    }).join('');
    H.paint(H.listHeader('Simulations') + '<main class="wrap">' +
      '<p class="note">' + esc(C.intro || 'Practice that runs over time. A run is a sequence of steps, where earlier choices come back later. In a role-play, Claude plays a stakeholder with facts and limits you have to uncover; you have up to 8 messages, then a score.') + '</p>' +
      (RUNS.length ? '<section aria-labelledby="srh"><div class="section-h"><h2 id="srh">' + esc(C.runNoun) + '</h2></div><div class="stack">' + runs + '</div></section>' : '') +
      (RPS.length ? '<section aria-labelledby="sph"><div class="section-h"><h2 id="sph">' + esc(C.rpHeading) + '</h2><span class="hint">Needs Claude</span></div><div class="stack">' + rps + '</div></section>' : '') +
      '<p class="note"><b>Draft</b> means you have not reviewed the scenario, its key or its rubric yet. Simulations do not count toward Readiness or the daily review. <span id="sims-saved">' + store.statusText() + '</span>.</p>' +
      '</main>');
  }
  function renderRun() {
    const r = RUNS.find(x => x.id === H.view().run); if (!r) { H.go('sims', {}); return; }
    const x = runGet(r);
    let h = '<details class="more"' + (x.i === 0 && x.picks[r.steps[0].id] === undefined ? ' open' : '') + '><summary>The briefing</summary><p>' + esc(r.briefing) + '</p></details>';
    if (x.i >= r.steps.length) {
      const { avg, ending } = runEnding(r, x), pred = runPred(x);
      const missed = r.steps.filter(s => x.missed.indexOf(s.id) !== -1);
      h += '<article class="card"><div class="qmeta"><span class="cchip kind">Ending · average meter ' + avg + '</span>' + draft(r) + '</div><h2 id="stem" tabindex="-1">' + esc(ending.title) + '</h2>' + meterRow(r, x.meters) + '<p>' + esc(ending.text) + '</p>' +
        '<div class="fbblock"><h3>Predictability</h3><p><b>' + pred + '%</b>: business value achieved ' + x.pv.actual + ' ÷ planned ' + x.pv.planned + ' for committed objectives.' + (r.predNote ? ' ' + esc(r.predNote) : '') + '</p></div></article>' +
        '<section aria-labelledby="llh"><div class="section-h"><h2 id="llh">Lessons-learned register</h2><span class="hint">' + (missed.length ? missed.length + ' to revisit' : 'Every step on the key') + '</span></div><article class="card">' +
        (missed.length ? '<ol class="checklist">' + missed.map(s => '<li><b>' + esc(s.phase) + ':</b> ' + esc(s.lesson) + '</li>').join('') + '</ol>' : '<p>You chose the keyed option at every step.</p>') + '</article></section>' +
        '<div class="row"><button class="btn" data-act="' + A('run-replay') + '" data-id="' + r.id + '">Play again from the start</button><button class="btn btn-quiet" data-act="' + A('sims') + '">Back to Simulations</button></div>';
      H.paint(H.header(r.title, A('sims'), '', 'Back to Simulations', 'Done') + '<main class="wrap">' + h + '</main>');
      return;
    }
    const s = r.steps[x.i], picked = x.picks[s.id], ans = picked !== undefined;
    const knock = Object.keys(s.updateIf || {}).filter(f => x.flags.indexOf(f) !== -1).map(f => '<p class="note"><b>Knock-on:</b> ' + esc(s.updateIf[f]) + '</p>').join('');
    h += meterRow(r, x.meters, ans && x.last ? x.last.before : null);
    h += '<article class="card"><div class="qmeta"><span class="cchip kind">' + esc(s.phase) + '</span>' + draft(r) + '<span class="qid">' + s.id + '</span></div>' +
      (s.update ? '<p class="note">' + esc(s.update) + '</p>' : '') + knock +
      '<h2 id="stem" class="stem" tabindex="-1">' + esc(s.stem) + '</h2>' +
      '<div class="opts" role="group" aria-label="Your choice">' + s.options.map((o, j) => {
        const cls = ans ? (j === s.answer ? ' is-correct' : j === picked ? ' is-wrong' : '') : '';
        return '<button class="opt' + cls + '" data-act="' + A('run-pick') + '" data-j="' + j + '"' + (ans ? ' disabled' : '') + '><span class="key" aria-hidden="true">' + 'ABCD'[j] + '</span><span>' + esc(o) +
          (ans && j === s.answer ? '<span class="tag">Keyed choice</span>' : ans && j === picked ? '<span class="tag">Your choice</span>' : '') + '</span></button>';
      }).join('') + '</div>';
    if (ans) {
      const ok = picked === s.answer, pv = x.last && x.last.pv, icon = H.icon || {};
      h += '<div class="fb"><p class="verdict ' + (ok ? 'ok' : 'bad') + '">' + (ok ? (icon.ok || '') + 'The keyed choice' : (icon.bad || '') + 'Not the keyed choice') + '</p>' +
        (pv && (pv.planned || pv.actual) ? '<p class="note">Business value: ' + (pv.planned ? 'planned ' + (pv.planned > 0 ? '+' : '') + pv.planned + ' ' : '') + (pv.actual ? 'delivered ' + (pv.actual > 0 ? '+' : '') + pv.actual : '') + '.</p>' : '') +
        ((s.sets || {})[picked] ? '<p class="note">This choice comes back later in the run.</p>' : '') +
        '<div class="fbblock"><h3>Why</h3><p>' + esc(s.why) + '</p></div>' +
        (!ok ? '<div class="fbblock"><h3>Why your choice falls short</h3><p>' + esc(s.whyNot[picked]) + '</p></div>' : '') +
        '<div class="fbblock"><h3>Lesson</h3><p>' + esc(s.lesson) + '</p></div></div>';
    }
    h += '</article>';
    if (ans) h += '<div class="row"><button class="btn btn-primary" data-act="' + A('run-next') + '" data-id="' + r.id + '">' + (x.i + 1 < r.steps.length ? 'Next step' : esc(r.endLabel || 'See how it ended')) + '</button></div>';
    h += '<p class="note">' + store.statusText() + '. One choice per step; play again from the start to try other paths.</p>';
    H.paint(H.header(r.title, A('sims'), '', 'Back to Simulations', (x.i + 1) + '/' + r.steps.length) + '<main class="wrap">' + h + '</main>');
  }

  // Role-play state lives in memory; only the best and last score are saved.
  let T = { turns: [], busy: false, err: '', score: null, draft: '' };
  const who = x => String(x.role).split(/[,(]/)[0].trim();
  function rpErr(e) {
    const c = e && e.code;
    if (c === 'not_granted' || c === 'sampling_disabled' || c === 'not_declared' || c === 'capability_disabled' || c === 'capability_removed') { H.samplerGone(); return 'Asking Claude is not available here.'; }
    return c === 'rate_limited' ? 'Claude is busy or your usage limit was reached. Try again in a minute.' : 'Couldn’t reach Claude just now. Try again.';
  }
  const repaint = () => { if (H.screen() === 'rp') H.keepScroll(); };
  async function rpSay() {
    const x = RPS.find(q => q.id === H.view().rp), fn = H.sampler(), el = typeof document !== 'undefined' && document.getElementById('rp-input'), msg = (el ? el.value : T.draft || '').trim();
    if (!x || !msg || T.busy || !fn) return;
    T.turns.push({ role: 'me', text: msg }); T.draft = ''; T.busy = true; T.err = ''; H.keepScroll();
    try { const r = await fn(RP.counterpartPrompt(x, T.turns, R), { cache: false }); T.turns.push({ role: 'them', text: RP.cleanReply(r && r.text) }); }
    catch (e) { T.err = rpErr(e); T.turns.pop(); T.draft = msg; }
    T.busy = false; repaint();
  }
  async function rpEnd() {
    const x = RPS.find(q => q.id === H.view().rp), fn = H.sampler(); if (!x || T.busy || !fn) return;
    T.busy = true; T.scoring = true; T.err = ''; H.keepScroll();
    try {
      const p = RP.scorePrompt(x, T.turns, R);
      let v;
      if (typeof fn.json === 'function') v = await fn.json(p, { cache: false });
      else { const r = await fn(p, { cache: false }), t = String((r && r.text) || ''); v = JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1)); }
      T.score = RP.readScore(v, T.turns, R);
      const n = T.score.overall, s = store.get(x.id) || { best: 0 };
      store.put(x.id, { ts: Date.now(), best: Math.max(s.best || 0, n), last: n, at: Date.now() });
    } catch (e) { T.err = e && e.code ? rpErr(e) : 'The score did not come back in a usable form. Try again.'; }
    T.busy = false; T.scoring = false; repaint();
  }
  function renderRp() {
    const x = RPS.find(q => q.id === H.view().rp); if (!x) { H.go('sims', {}); return; }
    const w = who(x), mine = T.turns.filter(t => t.role === 'me').length;
    const lessons = (x.lessons || []).map(id => { const t = H.lessonTitle && H.lessonTitle(id); return t ? '<button class="btn btn-small" data-act="lesson" data-id="' + esc(id) + '">' + esc(t) + '</button>' : ''; }).join('');
    let h = '<article class="card"><div class="qmeta"><span class="cchip kind">Role-play</span>' + draft(x) + '<span class="qid">' + x.id + '</span></div><h2>' + esc(x.title) + '</h2>' +
      '<p class="note">' + esc(x.role) + '</p><p>' + esc(x.brief) + '</p>' +
      (lessons ? '<div class="fbblock"><h3>Lessons on this</h3><div class="row">' + lessons + '</div></div>' : '') + '</article>';
    if (!H.sampler()) {
      h += '<p class="note">The live role-play uses Claude, which works when this page is open in Claude and you allow it to ask Claude. You can still practise: say your reply to the opening line out loud, then compare with the rubric.</p>' +
        '<article class="card"><div class="fbblock"><h3>' + esc(w) + ' opens with</h3><p>' + esc(x.opening) + '</p></div><div class="fbblock"><h3>You are scored on</h3><ol class="checklist">' + x.rubric.map(p => '<li>' + esc(p) + '</li>').join('') + '</ol></div>' +
        '<details class="more"><summary>What a strong resolution looks like</summary><p>' + esc(x.goodOutcome) + '</p></details></article>';
    } else {
      h += '<div class="chat" aria-live="polite">' + T.turns.map(t => '<div class="bubble ' + (t.role === 'me' ? 'me' : 'them') + '"><span class="who">' + (t.role === 'me' ? 'You' : esc(w)) + '</span>' + esc(t.text) + '</div>').join('') +
        (T.busy && !T.scoring ? '<div class="bubble them"><span class="who">' + esc(w) + '</span>…</div>' : '') + '</div>';
      if (T.score) {
        const sc = T.score;
        h += '<section class="fbx" aria-live="polite"><p class="eyebrow">Claude’s score</p><p><b>' + sc.overall + ' of 4 · ' + (sc.reached ? 'good outcome reached' : 'good outcome not reached') + '</b></p>' +
          '<ol class="fblist">' + sc.points.map(p => '<li class="' + (p.score >= 3 ? 'meets' : p.score === 2 ? 'partly' : 'misses') + '"><span class="fbst">' + p.score + ' of 4</span><span class="fbck">' + esc(p.point) + '</span>' + (p.comment ? '<span class="fbwhy">' + esc(p.comment) + '</span>' : '') + '</li>').join('') + '</ol>' +
          (sc.uncovered.length ? '<p class="note"><b>You uncovered:</b> ' + sc.uncovered.map(esc).join('; ') + '</p>' : '') + (sc.tip ? '<p class="note"><b>Tip:</b> ' + esc(sc.tip) + '</p>' : '') +
          '<details class="more"><summary>What ' + esc(w) + ' was holding back</summary><ul class="plain">' + x.hidden.map(f => '<li>' + esc(f) + '</li>').join('') + '</ul><p><b>Walk-away:</b> ' + esc(x.walkaway) + '</p><p><b>A strong resolution:</b> ' + esc(x.goodOutcome) + '</p></details>' +
          '<p class="note">Scored by Claude from the transcript and the rubric; a second opinion, not a verdict.</p></section>' +
          '<div class="row"><button class="btn btn-primary" data-act="' + A('rp') + '" data-id="' + x.id + '">Try again</button><button class="btn btn-quiet" data-act="' + A('sims') + '">Back to Simulations</button></div>';
      } else if (T.scoring) h += '<p class="note" role="status">Scoring…</p>';
      else {
        h += '<section class="answer"><label for="rp-input" class="eyebrow">Your reply · ' + (8 - mine) + ' left</label><textarea id="rp-input" rows="4" maxlength="1500"' + (T.busy ? ' disabled' : '') + '>' + esc(T.draft || '') + '</textarea></section>' +
          '<div class="row"><button class="btn btn-primary" data-act="' + A('rp-say') + '"' + (T.busy || mine >= 8 ? ' disabled' : '') + '>Send</button><button class="btn" data-act="' + A('rp-end') + '"' + (T.busy || !mine ? ' disabled' : '') + '>End and score</button></div>' +
          '<details class="more"><summary>You are scored on</summary><ol class="checklist">' + x.rubric.map(p => '<li>' + esc(p) + '</li>').join('') + '</ol></details>';
      }
      if (T.err) h += '<p class="note" role="status">' + esc(T.err) + '</p>';
    }
    H.paint(H.header(x.title, A('sims'), '', 'Back to Simulations', mine + '/8') + '<main class="wrap">' + h + '</main>');
  }

  function openList() { H.go('sims', {}); return true; }
  function openRun(id) { if (!RUNS.find(x => x.id === id)) return false; H.go('run', { run: id }); return true; }
  function openRp(id) { const x = RPS.find(q => q.id === id); if (!x) return false; T = { turns: [{ role: 'them', text: x.opening }], busy: false, err: '', score: null, draft: '' }; H.go('rp', { rp: id }); return true; }
  const focusStem = () => { if (typeof document === 'undefined') return; const st = document.getElementById('stem'); if (st) st.focus(); };
  const actions = {
    [A('sims')]() { openList(); },
    [A('run')](el) { openRun(el.dataset.id); },
    [A('run-pick')](el) { const r = RUNS.find(x => x.id === H.view().run); if (!r) return; const x = runApply(r, runGet(r), Number(el.dataset.j)); runPut(r, x); H.keepScroll(); },
    [A('run-next')](el) { const r = RUNS.find(x => x.id === el.dataset.id); if (!r) return; const x = runGet(r); x.i++; x.last = null; runPut(r, x); H.render(); if (typeof window !== 'undefined') window.scrollTo(0, 0); focusStem(); },
    [A('run-replay')](el) { const r = RUNS.find(x => x.id === el.dataset.id); if (!r) return; runPut(r, runFresh(r)); H.render(); if (typeof window !== 'undefined') window.scrollTo(0, 0); },
    [A('rp')](el) { openRp(el.dataset.id); },
    [A('rp-say')]() { rpSay(); },
    [A('rp-end')]() { rpEnd(); }
  };
  function onInput(e) { if (e.target && e.target.id === 'rp-input') { T.draft = e.target.value; return true; } return false; }
  // Links: #sims, #run-<id>, #rp-<id>, matched without regard to case.
  function route(hash) {
    const h = String(hash || '').replace(/^#/, '').toLowerCase();
    if (h === 'sims') return openList();
    let m;
    if ((m = /^run-(.+)$/.exec(h))) { const r = RUNS.find(x => x.id.toLowerCase() === m[1]); return r ? openRun(r.id) : false; }
    if ((m = /^rp-(.+)$/.exec(h))) { const x = RPS.find(q => q.id.toLowerCase() === m[1]); return x ? openRp(x.id) : false; }
    return false;
  }
  const linkIds = () => RUNS.reduce((a, r) => a.concat([r.id], r.steps.map(s => s.id)), []).concat(RPS.map(x => x.id));
  return {
    screens: { sims: renderList, run: renderRun, rp: renderRp },
    actions, onInput, route, linkIds,
    start() { store.loadLocal(); },
    attach: (db, uid) => store.attach(db, uid),
    store, runGet, _rp: () => T
  };
}

module.exports = { create, runFresh, runAvg, runPred, runApply, runEnding, mergeByTs };

};
M["index.js"] = function (module, exports) {
// Browser entry: window.StudyKit = { version, save, craft, sims, roleplay }.
'use strict';
module.exports = {
  version: req('./version.js'),
  save: req('./save.js'),
  craft: req('./craft.js'),
  sims: req('./sims.js'),
  roleplay: req('./roleplay.js')
};

};
root.StudyKit = req("index.js");
})(typeof window !== "undefined" ? window : globalThis);

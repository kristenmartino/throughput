// Build-time reader for Craft packets: markdown files plus stage definitions, returned in the shape the page uses.
// Node only; not part of the browser bundle.
//
// Origin: Inspect & Adapt craft-build.js (V32). Going Concern's tools/build_craft.py is a Python port of the same
// markdown subset; on Nov 23, 2026 both parsers gave identical output for all nine packets (CF-1..8, FX-1).
// Going Concern's extra checks (a required facts point, an allowed-parts list) are options here.
//
// Markdown subset: "# " title, "## " part (Packet, Key, Model answer, Grading notes), "### " section, paragraphs,
// "- " bullets, "1. " numbered lists, pipe tables and "> " quotes (a bare ">" is a blank line inside a quote).
// Anything else is an error, so a typo cannot slip through as a paragraph.
'use strict';
const fs = require('fs');
const path = require('path');

const PARTS = ['Packet', 'Key', 'Model answer', 'Grading notes'];

function parseBlocks(lines, where, errors) {
  const blocks = [];
  let i = 0;
  const cells = l => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    if (/^- /.test(l)) { const ul = []; while (i < lines.length && /^- /.test(lines[i])) ul.push(lines[i++].slice(2).trim()); blocks.push({ ul }); continue; }
    if (/^\d+\. /.test(l)) {
      const ol = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        const m = /^(\d+)\. (.*)$/.exec(lines[i++]);
        if (Number(m[1]) !== ol.length + 1) errors.push(where + ': numbered list out of order at "' + m[0].slice(0, 30) + '"');
        ol.push(m[2].trim());
      }
      blocks.push({ ol }); continue;
    }
    if (/^\|/.test(l)) {
      const rows = []; while (i < lines.length && /^\|/.test(lines[i])) rows.push(cells(lines[i++]));
      if (rows.length < 3 || !rows[1].every(c => /^-+$/.test(c))) { errors.push(where + ': bad table'); continue; }
      const head = rows[0], body = rows.slice(2);
      for (const r of body) if (r.length !== head.length) errors.push(where + ': table row has ' + r.length + ' cells, expected ' + head.length + ': ' + r[0]);
      blocks.push({ table: { head, rows: body } }); continue;
    }
    if (/^> /.test(l)) { const q = []; while (i < lines.length && /^>( |$)/.test(lines[i])) q.push(lines[i++].slice(2).trim()); blocks.push({ quote: q.join('\n') }); continue; }
    if (/^[#*`]/.test(l) || /^\s/.test(l)) { errors.push(where + ': unexpected line "' + l.slice(0, 40) + '"'); i++; continue; }
    blocks.push({ p: l.trim() }); i++;
  }
  return blocks;
}

function parsePacket(text, where, errors, opts) {
  const strictParts = !!(opts && opts.strictParts);
  const lines = text.split(/\r?\n/);
  const out = { title: '', lead: [], parts: {} };
  let part = null, sec = null, buf = [];
  const flush = () => {
    const blocks = parseBlocks(buf, where + (part ? ' / ' + part : '') + (sec ? ' / ' + sec.h : ''), errors); buf = [];
    if (sec) sec.blocks = blocks; else if (part) out.parts[part].lead = blocks; else out.lead = blocks;
  };
  for (const l of lines) {
    let m;
    if ((m = /^# (.+)$/.exec(l))) { out.title = m[1].trim(); continue; }
    if ((m = /^## (.+)$/.exec(l))) {
      flush(); part = m[1].trim(); sec = null;
      if (out.parts[part]) errors.push(where + ': duplicate part ' + part);
      if (strictParts && PARTS.indexOf(part) === -1) errors.push(where + ': unknown part ' + part);
      out.parts[part] = { lead: [], sections: [] }; continue;
    }
    if ((m = /^### (.+)$/.exec(l))) { flush(); if (!part) { errors.push(where + ': section before any part'); continue; } sec = { h: m[1].trim(), blocks: [] }; out.parts[part].sections.push(sec); continue; }
    buf.push(l);
  }
  flush();
  return out;
}

// defs: the app's stage definitions (array of packets, each with id, file, status, kind, title, role, stageWord?,
//       stages: [{ id, title, parts, model, checklist, optional?, lessons?, brief?, keyFor? }]).
// opts:
//   dir          folder holding the packet markdown files
//   idPrefix     packet id prefix, e.g. 'CF' (ids look like CF-1, stages CF-1.1)
//   lessonIds    Set of lesson ids stage links may use (empty Set: no lesson links allowed)
//   takenIds     Set of ids already used elsewhere in the app
//   factsPoint   optional { token: 'FACTS', text: '...' }: the token in a checklist is replaced by the text,
//                and every stage must carry the point (Going Concern's rule)
//   strictParts  refuse any "## " part other than the four (Going Concern's rule)
function loadCraft(defs, opts) {
  const o = Object.assign({ idPrefix: 'CF', lessonIds: new Set(), takenIds: new Set(), factsPoint: null, strictParts: false }, opts);
  const errors = [];
  const packets = [], ids = new Set();
  const idRe = new RegExp('^' + o.idPrefix + '-\\d+$');
  const claim = id => { if (ids.has(id) || o.takenIds.has(id)) errors.push('craft id ' + id + ' is already in use'); ids.add(id); };
  for (const d of defs) {
    const w = 'craft ' + d.id;
    if (!idRe.test(d.id || '')) errors.push(w + ': packet ids look like ' + o.idPrefix + '-1');
    claim(d.id);
    const file = path.join(o.dir, d.file || '');
    if (!d.file || !fs.existsSync(file)) { errors.push(w + ': missing file ' + (d.file || '(none)')); continue; }
    const before = errors.length;
    const md = parsePacket(fs.readFileSync(file, 'utf8'), w, errors, o);
    for (const p of PARTS) if (!md.parts[p]) errors.push(w + ': the file needs a "## ' + p + '" part');
    if (errors.length > before) continue;
    const pk = md.parts.Packet, taskSec = pk.sections.find(s => s.h === 'Task');
    if (!taskSec) { errors.push(w + ': the packet needs a Task section'); continue; }
    const taskList = (taskSec.blocks.find(b => b.ol) || {}).ol || [];
    const planted = taskSec.blocks.map(b => b.p || '').find(p => /^Planted: /.test(p));
    const taskLead = taskSec.blocks.map(b => b.p || '').find(p => p && !/^Planted: /.test(p));
    if (!taskList.length || !planted || !taskLead) errors.push(w + ': Task needs a lead line, a numbered list and a "Planted:" line');
    const grading = (md.parts['Grading notes'].lead.find(b => b.ul) || {}).ul || [];
    if (!grading.length) errors.push(w + ': grading notes missing');
    if (d.status !== 'Draft' && d.status !== '' && d.status !== undefined) errors.push(w + ': status must be Draft or empty');
    const find = h => md.parts['Model answer'].sections.find(s => s.h === h) || md.parts.Key.sections.find(s => s.h === h);
    const covered = [];
    const stages = (d.stages || []).map((s, k) => {
      const sw = 'craft ' + s.id;
      if (s.id !== d.id + '.' + (k + 1)) errors.push(sw + ': stage ids run ' + d.id + '.1, ' + d.id + '.2, ...');
      claim(s.id);
      if (!s.title) errors.push(sw + ': title missing');
      let checklist = Array.isArray(s.checklist) ? s.checklist.slice() : [];
      if (o.factsPoint) {
        checklist = checklist.map(c => c === o.factsPoint.token ? o.factsPoint.text : c);
        if (checklist.indexOf(o.factsPoint.text) === -1) errors.push(sw + ': checklist needs the facts point');
      }
      if (checklist.length < 5 || checklist.length > 10) errors.push(sw + ': checklist needs 5 to 10 points');
      if (new Set(checklist).size !== checklist.length) errors.push(sw + ': duplicate checklist point');
      for (const l of s.lessons || []) if (!o.lessonIds.has(l)) errors.push(sw + ': unknown lesson ' + l);
      for (const n of s.parts || []) { if (!taskList[n - 1]) errors.push(sw + ': no task part ' + n); covered.push(n); }
      const model = (s.model || []).map(h => { const sec = find(h); if (!sec) errors.push(sw + ': no section "' + h + '" in the model answer or key'); return sec; }).filter(Boolean);
      // A stage of a set shows only its own item of the packet, and its grader sees only its own part of the key.
      const brief = (s.brief || []).map(h => { if (!pk.sections.find(x => x.h === h)) errors.push(sw + ': no packet section "' + h + '"'); return h; });
      const keyFor = (s.keyFor || []).map(h => { if (!md.parts.Key.sections.find(x => x.h === h)) errors.push(sw + ': no key section "' + h + '"'); return h; });
      if (!model.length) errors.push(sw + ': worked answer missing');
      return { id: s.id, n: k + 1, title: s.title, parts: s.parts || [], task: (s.parts || []).map(n => taskList[n - 1]).join(' '), checklist, optional: s.optional || [], model, lessons: s.lessons || [], brief, keyFor };
    });
    if (covered.slice().sort((a, b) => a - b).join() !== taskList.map((_, k) => k + 1).join()) errors.push(w + ': stages must cover each task part once; got ' + covered.join());
    packets.push({
      id: d.id, status: d.status || '', kind: d.kind, stageWord: d.stageWord || 'Stage', title: d.title, role: d.role, blurb: md.lead.map(b => b.p || '').join(' '),
      lead: pk.lead, sections: pk.sections.filter(s => s.h !== 'Task'), taskLead, taskList, planted: (planted || '').replace(/^Planted: /, ''),
      key: md.parts.Key.sections, grading, stages
    });
  }
  return { packets, ids: Array.from(ids), errors };
}

module.exports = { loadCraft, parsePacket, parseBlocks, PARTS };

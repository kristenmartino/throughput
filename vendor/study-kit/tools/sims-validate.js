// Build-time checks for runs and role-plays. Node only; not part of the browser bundle.
// Origin: Inspect & Adapt sims-build.js (V32), with the id prefixes as options.
'use strict';

// opts: runs, roleplays (arrays), runPrefix ('RN'), rpPrefix ('RL'), lessonIds (Set), takenIds (Set)
function validateSims(opts) {
  const o = Object.assign({ runs: [], roleplays: [], runPrefix: 'RN', rpPrefix: 'RL', lessonIds: new Set(), takenIds: new Set() }, opts);
  const runs = o.runs, rps = o.roleplays, ids = [], errors = [], lids = o.lessonIds, takenIds = o.takenIds;
  const runRe = new RegExp('^' + o.runPrefix + '-\\d+$'), rpRe = new RegExp('^' + o.rpPrefix + '-\\d+$');
  const words = s => String(s || '').trim().split(/\s+/).filter(Boolean).length;
  const seen = new Set();
  const claim = (id, w) => { if (seen.has(id) || takenIds.has(id)) errors.push(w + ': id ' + id + ' is taken'); seen.add(id); ids.push(id); };
  for (const r of runs) {
    const w = 'run ' + r.id;
    if (!runRe.test(r.id)) errors.push(w + ': bad id');
    claim(r.id, w);
    if (!r.title || !r.briefing || !r.role) errors.push(w + ': title, role and briefing required');
    if (!Array.isArray(r.meters) || r.meters.length !== 4 || r.meters.some(m => !r.meterLabels[m])) errors.push(w + ': four meters with labels');
    if (!r.start || !(r.start.planned > 0) || r.start.actual !== r.start.planned) errors.push(w + ': start needs planned > 0 and actual = planned');
    const flagsSet = new Set();
    (r.steps || []).forEach((s, k) => {
      const sw = w + ' step ' + s.id;
      if (s.id !== r.id + '-' + String(k + 1).padStart(2, '0')) errors.push(sw + ': ids must run in order');
      claim(s.id, sw);
      if (!s.phase || !s.stem || words(s.stem) > 110) errors.push(sw + ': phase and stem (110 words max) required');
      if (!Array.isArray(s.options) || s.options.length !== 4) errors.push(sw + ': four options');
      if (!(s.answer >= 0 && s.answer < 4)) errors.push(sw + ': answer out of range');
      for (let j = 0; j < 4; j++) {
        const wrong = j !== s.answer;
        if (wrong && !(s.whyNot && s.whyNot[j])) errors.push(sw + ': option ' + j + ' needs a whyNot');
        if (!wrong && s.whyNot && s.whyNot[j]) errors.push(sw + ': the answer has a whyNot');
        if (!s.effects || !s.effects[j]) errors.push(sw + ': option ' + j + ' needs effects');
        else for (const m in s.effects[j]) if (r.meters.indexOf(m) === -1) errors.push(sw + ': unknown meter ' + m);
      }
      if (!s.why || !s.lesson || words(s.lesson) > 20) errors.push(sw + ': why and a lesson of 20 words or fewer');
      // The best choice should never lower a meter or cost business value.
      const best = s.effects && s.effects[s.answer];
      if (best && Object.values(best).some(v => v < 0)) errors.push(sw + ': the answer lowers a meter');
      for (const f of Object.values(s.sets || {})) flagsSet.add(f);
      for (const f of Object.keys(s.updateIf || {}).concat(Object.keys(s.pvIf || {}))) if (!flagsSet.has(f)) errors.push(sw + ': flag ' + f + ' is used before any step sets it');
    });
    if (!Array.isArray(r.endings) || !r.endings.length || r.endings[r.endings.length - 1].min !== 0) errors.push(w + ': endings must end with min 0');
  }
  for (const x of rps) {
    const w = 'role-play ' + x.id;
    if (!rpRe.test(x.id)) errors.push(w + ': bad id');
    claim(x.id, w);
    for (const k of ['title', 'role', 'brief', 'persona', 'walkaway', 'opening', 'goodOutcome']) if (!x[k]) errors.push(w + ': ' + k + ' required');
    if (words(x.brief) < 50 || words(x.brief) > 110) errors.push(w + ': brief should be 50-110 words (' + words(x.brief) + ')');
    if (!Array.isArray(x.hidden) || x.hidden.length < 2 || x.hidden.length > 4) errors.push(w + ': 2-4 hidden facts');
    if (!Array.isArray(x.rubric) || x.rubric.length !== 4) errors.push(w + ': four rubric points');
    for (const l of x.lessons || []) if (!lids.has(l)) errors.push(w + ': unknown lesson ' + l);
  }
  return { runs, roleplays: rps, ids, errors };
}

module.exports = { validateSims };

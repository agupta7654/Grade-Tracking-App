// All grade math lives here.
//
// A course has groups (e.g. "Homework", weight 30) and assignments that belong to a group.
// - If any group has a weight, the grade is weighted by group (Canvas-style: groups with
//   nothing graded yet are left out and the remaining weights are rescaled).
// - Otherwise the grade is simply total points earned / total points possible.

export const uid = () => Math.random().toString(36).slice(2, 10);

export const DEFAULT_SCALE = { A: 90, B: 80, C: 70, D: 60 };

export function newCourse(name) {
  return {
    id: uid(),
    name,
    scale: { ...DEFAULT_SCALE },
    groups: [{ id: uid(), name: 'Assignments', weight: null }],
    assignments: [],
  };
}

export function letterFor(pct, scale = DEFAULT_SCALE) {
  if (pct == null) return '–';
  for (const l of ['A', 'B', 'C', 'D']) if (pct >= scale[l]) return l;
  return 'F';
}

export function num(s) {
  if (s === null || s === undefined) return null;
  const t = String(s).trim();
  if (t === '') return null;
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : null;
}

export function fmt(n, digits = 2) {
  if (n === null || n === undefined || Number.isNaN(n)) return '–';
  return String(Math.round(n * 10 ** digits) / 10 ** digits);
}

export function fmtPct(p) {
  return p == null ? '–' : `${fmt(p, 1)}%`;
}

/**
 * mode 'actual'    -> only entered scores count
 * mode 'projected' -> entered scores, and where there is none, the predicted score
 */
export function computeGrade(course, mode = 'actual') {
  const stats = {};
  let counted = 0;
  for (const a of course.assignments) {
    const v = mode === 'projected' ? a.earned ?? a.predicted : a.earned;
    if (v === null || v === undefined) continue;
    const s = (stats[a.groupId] ||= { earned: 0, possible: 0 });
    s.earned += v;
    s.possible += a.possible || 0;
    counted++;
  }
  if (!counted) return { pct: null, counted: 0 };

  const weighted = course.groups.some((g) => g.weight > 0);
  if (weighted) {
    let num_ = 0;
    let den = 0;
    for (const g of course.groups) {
      const w = g.weight || 0;
      const s = stats[g.id];
      if (!w || !s || s.possible <= 0) continue;
      num_ += w * (s.earned / s.possible);
      den += w;
    }
    return { pct: den ? (num_ / den) * 100 : null, counted };
  }

  let e = 0;
  let p = 0;
  for (const s of Object.values(stats)) {
    e += s.earned;
    p += s.possible;
  }
  return { pct: p > 0 ? (e / p) * 100 : null, counted };
}

export function groupSummary(course, groupId) {
  let earned = 0;
  let possible = 0;
  let graded = 0;
  let total = 0;
  for (const a of course.assignments) {
    if (a.groupId !== groupId) continue;
    total++;
    if (a.earned !== null && a.earned !== undefined) {
      earned += a.earned;
      possible += a.possible || 0;
      graded++;
    }
  }
  return { earned, possible, graded, total, pct: possible > 0 ? (earned / possible) * 100 : null };
}

/** Share of the course's total points that have been graded so far (0-100). */
export function gradedShare(course) {
  let done = 0;
  let all = 0;
  for (const a of course.assignments) {
    all += a.possible || 0;
    if (a.earned !== null && a.earned !== undefined) done += a.possible || 0;
  }
  return all > 0 ? (done / all) * 100 : 0;
}

export function hasPredictions(course) {
  return course.assignments.some((a) => (a.earned == null) && a.predicted != null);
}

/** Merge parsed import text into a course (mutates the course). */
export function applyImport(course, parsed) {
  const find = (name) => course.groups.find((g) => g.name.toLowerCase() === name.toLowerCase());

  for (const pg of parsed.groups) {
    const g = find(pg.name);
    if (!g) course.groups.push({ id: uid(), name: pg.name, weight: pg.weight });
    else if (g.weight == null && pg.weight != null) g.weight = pg.weight;
  }
  for (const a of parsed.assignments) {
    const g = find(a.group);
    course.assignments.push({
      id: uid(),
      groupId: g.id,
      name: a.name,
      possible: a.possible,
      earned: a.earned ?? null,
      predicted: null,
    });
  }
  // Drop empty, unweighted groups (like the default "Assignments" group) that ended up unused.
  const keep = course.groups.filter(
    (g) => g.weight != null || course.assignments.some((a) => a.groupId === g.id)
  );
  course.groups = keep.length ? keep : course.groups.slice(0, 1);
}

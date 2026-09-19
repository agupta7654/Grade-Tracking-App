// Turns raw syllabus text into a simple, editable text format, and parses that format.
//
// Import format (one item per line):
//   [Homework 30%]        <- a group, with an optional weight
//   Homework 1 | 20       <- assignment name | points possible
//   Midterm | 100 | 87    <- optional third value = score you already earned
// Lines starting with # are ignored.

const BULLET = /^\s*(?:[•●○▪·*\-–—]|\d{1,2}[.)])\s+/;

function cleanName(s) {
  return s
    .replace(BULLET, '')
    .replace(/\b(?:is|are)?\s*worth\b/gi, '')
    .replace(/[\s:;,.\-–—|(=…_]+$/g, '')
    .replace(/^[\s:;,.\-–—|)=…_]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function looksLikeName(n) {
  if (n.length < 3 || n.length > 60) return false;
  if (!/^[A-Za-z]/.test(n)) return false;
  if (n.split(' ').length > 8) return false;
  if (/^[A-F][+-]?\s+\d/.test(n)) return false; // grade scale rows like "A 900"
  if (/^(total|grand total|max|maximum|overall|course|semester|final grade|grade)\b/i.test(n)) return false;
  return true;
}

function looksLikeGroupName(n) {
  if (!looksLikeName(n)) return false;
  if (n.split(' ').length > 5) return false;
  if (/^(total|sum|grade|grading|scale|percent|percentage)\b/i.test(n)) return false;
  if (/\b(must|should|will|would|can|need|needs|required|at least|minimum|below|above|pass|passing|fail|drop|dropped|late)\b/i.test(n)) return false;
  return true;
}

function singular(w) {
  return w
    .replace(/ies$/i, 'y')
    .replace(/zzes$/i, 'z')
    .replace(/(ss|x|ch|sh)es$/i, '$1')
    .replace(/([^s])s$/i, '$1');
}

const stem = (s) => s.toLowerCase().replace(/[^a-z ]/g, '').trim().replace(/(?:es|s)$/, '');

export function buildImportText(lines) {
  const weights = []; // {name, weight}
  const items = []; // {name, possible}
  const seenW = new Set();
  const seenA = new Set();

  const addItem = (name, possible) => {
    const key = name.toLowerCase();
    if (seenA.has(key)) return;
    seenA.add(key);
    items.push({ name, possible });
  };

  for (const raw of lines) {
    const line = raw.replace(/\s+/g, ' ').trim();
    if (!line) continue;

    // --- Category weights: "Homework 30%", "Exams (40%)", "25% Final exam"
    let m = line.match(/^(.{2,60}?)\s*[:\-–—.…|(]*\s*(\d{1,3}(?:\.\d+)?)\s?%/);
    if (m) {
      const name = cleanName(m[1]);
      const w = parseFloat(m[2]);
      if (looksLikeGroupName(name) && w > 0 && w <= 100 && !seenW.has(name.toLowerCase())) {
        seenW.add(name.toLowerCase());
        weights.push({ name, weight: w });
        continue;
      }
    }
    m = line.match(/^(\d{1,3}(?:\.\d+)?)\s?%\s*[:\-–—]?\s*(.{2,60})$/);
    if (m) {
      const name = cleanName(m[2]);
      const w = parseFloat(m[1]);
      if (looksLikeGroupName(name) && w > 0 && w <= 100 && !seenW.has(name.toLowerCase())) {
        seenW.add(name.toLowerCase());
        weights.push({ name, weight: w });
        continue;
      }
    }

    // --- "5 quizzes, 10 points each"
    m = line.match(/(\d{1,2})\s+([A-Za-z][A-Za-z &/]{2,30}?)[\s,:\-–—(]+(\d{1,4}(?:\.\d+)?)\s*(?:points?|pts?)\.?\s*(?:each|apiece|per)/i);
    if (m) {
      const count = parseInt(m[1], 10);
      const base = singular(cleanName(m[2]));
      if (count > 0 && count <= 30 && looksLikeName(base)) {
        const label = base.charAt(0).toUpperCase() + base.slice(1);
        for (let i = 1; i <= count; i++) addItem(`${label} ${i}`, parseFloat(m[3]));
        continue;
      }
    }

    // --- "Quizzes (10 x 10 points)"
    m = line.match(/^(.{2,50}?)\s*\(?\s*(\d{1,2})\s*[x×]\s*(\d{1,4}(?:\.\d+)?)\s*(?:points?|pts?)/i);
    if (m) {
      const base = singular(cleanName(m[1]));
      const count = parseInt(m[2], 10);
      if (count > 0 && count <= 30 && looksLikeName(base)) {
        for (let i = 1; i <= count; i++) addItem(`${base} ${i}`, parseFloat(m[3]));
        continue;
      }
    }

    // --- "Homework 1 (20 points)", "Midterm - 100 pts", "Final exam is worth 200 points"
    m = line.match(/^(.{2,70}?)\s*[:\-–—.…|(]*\s*(\d{1,4}(?:\.\d+)?)\s*(?:points?|pts?)\b/i);
    if (m) {
      const name = cleanName(m[1]);
      if (looksLikeName(name)) addItem(name, parseFloat(m[2]));
    }
  }

  // Put assignments into the weight group whose name they mention.
  const groups = weights.map((w) => ({ ...w, items: [] }));
  const loose = [];
  for (const it of items) {
    const lname = stem(it.name);
    const g = groups.find((g) => {
      const gs = stem(g.name);
      return gs.length >= 3 && (lname.includes(gs) || gs.includes(lname.split(' ')[0]) && lname.split(' ')[0].length >= 4);
    });
    (g ? g.items : loose).push(it);
  }

  const out = [];
  for (const g of groups) {
    out.push(`[${g.name} ${g.weight}%]`);
    for (const it of g.items) out.push(`${it.name} | ${it.possible}`);
    out.push('');
  }
  if (loose.length) {
    if (groups.length) out.push('[Assignments]');
    for (const it of loose) out.push(`${it.name} | ${it.possible}`);
  }
  return out.join('\n').trim();
}

export function parseImportText(text) {
  const groups = [];
  const assignments = [];
  const bad = [];
  let cur = null;

  const ensure = (name, weight) => {
    let g = groups.find((x) => x.name.toLowerCase() === name.toLowerCase());
    if (!g) {
      g = { name, weight: weight ?? null };
      groups.push(g);
    } else if (weight != null && g.weight == null) g.weight = weight;
    return g;
  };

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const gm = line.match(/^\[(.+)\]$/);
    if (gm) {
      const inner = gm[1].trim();
      const wm = inner.match(/^(.*?)\s*(\d+(?:\.\d+)?)\s*%$/);
      cur = wm && wm[1].trim() ? ensure(wm[1].trim(), parseFloat(wm[2])) : ensure(inner);
      continue;
    }

    let name;
    let possible;
    let earned = null;
    const delim = line.includes('|') ? '|' : line.includes('\t') ? '\t' : null;
    if (delim) {
      const parts = line.split(delim).map((s) => s.trim());
      name = parts[0];
      possible = parseFloat(parts[1]);
      if (parts[2] !== undefined && parts[2] !== '') earned = parseFloat(parts[2]);
    } else {
      const m = line.match(/^(.*?)[\s:,\-–—]+(\d+(?:\.\d+)?)$/);
      if (m) {
        name = m[1].trim();
        possible = parseFloat(m[2]);
      }
    }
    if (!name || !Number.isFinite(possible) || possible < 0 || (earned !== null && !Number.isFinite(earned))) {
      bad.push(line);
      continue;
    }
    if (!cur) cur = ensure('Assignments');
    assignments.push({ group: cur.name, name, possible, earned });
  }
  return { groups, assignments, bad };
}

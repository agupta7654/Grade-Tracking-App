import { useState } from 'react';
import { DEFAULT_SCALE, fmt, num, uid } from '../lib/grades';
import { go } from '../lib/route';
import Sheet from './Sheet';

export default function CourseSettingsSheet({ course, update, onClose }) {
  const [name, setName] = useState(course.name);
  const [scale, setScale] = useState(() => Object.fromEntries(Object.entries(course.scale).map(([k, v]) => [k, String(v)])));
  const [groups, setGroups] = useState(course.groups.map((g) => ({ ...g, weight: g.weight == null ? '' : String(g.weight) })));
  const [error, setError] = useState('');

  const total = groups.reduce((s, g) => s + (num(g.weight) || 0), 0);
  const anyWeight = total > 0;

  const setGroup = (id, patch) => setGroups((gs) => gs.map((g) => (g.id === id ? { ...g, ...patch } : g)));

  const save = () => {
    if (!name.trim()) return setError('The course needs a name.');
    if (groups.some((g) => !g.name.trim())) return setError('Every category needs a name.');
    const nextScale = {};
    for (const k of ['A', 'B', 'C', 'D']) nextScale[k] = num(scale[k]) ?? DEFAULT_SCALE[k];
    const cleaned = groups.map((g) => ({ id: g.id, name: g.name.trim(), weight: num(g.weight) > 0 ? num(g.weight) : null }));
    update((d) => {
      const c = d.courses.find((x) => x.id === course.id);
      c.name = name.trim();
      c.scale = nextScale;
      c.groups = cleaned;
      const ids = new Set(cleaned.map((g) => g.id));
      for (const a of c.assignments) if (!ids.has(a.groupId)) a.groupId = cleaned[0].id;
    });
    onClose();
  };

  const deleteCourse = () => {
    if (!window.confirm(`Delete ${course.name} and all its assignments?`)) return;
    update((d) => {
      d.courses = d.courses.filter((c) => c.id !== course.id);
    });
    onClose();
    go('/');
  };

  return (
    <Sheet title="Edit course" onClose={onClose}>
      <div className="field">
        <label htmlFor="cn">Course name</label>
        <input id="cn" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <h3 className="subhead">Categories and weights</h3>
      <p className="hint">
        Add a weight (like 30) to each category if your syllabus weights them. Leave every weight empty to grade by total points.
      </p>
      {groups.map((g) => (
        <div className="group-edit" key={g.id}>
          <input aria-label="Category name" value={g.name} onChange={(e) => setGroup(g.id, { name: e.target.value })} />
          <input
            aria-label={`Weight for ${g.name}`}
            className="weight-input"
            inputMode="decimal"
            placeholder="%"
            value={g.weight}
            onChange={(e) => setGroup(g.id, { weight: e.target.value })}
          />
          <button
            className="link danger-text"
            disabled={groups.length === 1}
            onClick={() => setGroups((gs) => gs.filter((x) => x.id !== g.id))}
            aria-label={`Remove ${g.name}`}
          >
            Remove
          </button>
        </div>
      ))}
      <button className="link" onClick={() => setGroups((gs) => [...gs, { id: uid(), name: 'New category', weight: '' }])}>
        Add category
      </button>
      {anyWeight && Math.abs(total - 100) > 0.01 && (
        <p className="hint">Weights add up to {fmt(total, 1)}%. That's fine if some categories are still missing.</p>
      )}

      <h3 className="subhead">Letter grade cutoffs</h3>
      <div className="scale">
        {['A', 'B', 'C', 'D'].map((k) => (
          <label key={k}>
            <span>{k} at</span>
            <input inputMode="decimal" value={scale[k]} onChange={(e) => setScale((s) => ({ ...s, [k]: e.target.value }))} />
          </label>
        ))}
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="stack">
        <button className="btn primary" onClick={save}>
          Save changes
        </button>
        <button className="btn danger" onClick={deleteCourse}>
          Delete course
        </button>
      </div>
    </Sheet>
  );
}

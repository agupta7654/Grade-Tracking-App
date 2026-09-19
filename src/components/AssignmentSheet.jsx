import { useState } from 'react';
import { computeGrade, fmt, fmtPct, letterFor, num } from '../lib/grades';
import Sheet from './Sheet';

export default function AssignmentSheet({ course, assignment, onClose, onSave, onDelete }) {
  const isNew = !assignment;
  const [name, setName] = useState(assignment?.name ?? '');
  const [possible, setPossible] = useState(assignment ? String(assignment.possible) : '');
  const [earned, setEarned] = useState(assignment?.earned != null ? String(assignment.earned) : '');
  const [predicted, setPredicted] = useState(assignment?.predicted != null ? String(assignment.predicted) : '');
  const [groupId, setGroupId] = useState(assignment?.groupId ?? course.groups[0].id);
  const [error, setError] = useState('');

  const e = num(earned);
  const p = num(predicted);
  const pts = num(possible);

  // What-if: the whole course with this assignment's typed values plugged in.
  const draft = {
    ...(assignment ?? { id: '__new__' }),
    name,
    possible: pts ?? 0,
    earned: e,
    predicted: p,
    groupId,
  };
  const assignments = isNew ? [...course.assignments, draft] : course.assignments.map((a) => (a.id === draft.id ? draft : a));
  const preview = computeGrade({ ...course, assignments }, 'projected');
  const now = computeGrade(course, 'actual');
  const showPreview = e != null || p != null;
  const delta = preview.pct != null && now.pct != null ? preview.pct - now.pct : null;

  const submit = () => {
    if (!name.trim()) return setError('Give the assignment a name.');
    if (pts == null || pts < 0) return setError('Enter how many points it is worth.');
    if (earned.trim() !== '' && e === null) return setError('Points earned must be a number.');
    if (predicted.trim() !== '' && p === null) return setError('Predicted points must be a number.');
    onSave({ name: name.trim(), possible: pts, earned: e, predicted: p, groupId });
  };

  return (
    <Sheet title={isNew ? 'Add assignment' : 'Assignment'} onClose={onClose}>
      <div className="field">
        <label htmlFor="aname">Name</label>
        <input id="aname" value={name} onChange={(x) => setName(x.target.value)} placeholder="Homework 4" autoFocus={isNew} />
      </div>

      <div className="two">
        <div className="field">
          <label htmlFor="apts">Points possible</label>
          <input id="apts" inputMode="decimal" value={possible} onChange={(x) => setPossible(x.target.value)} placeholder="20" />
        </div>
        <div className="field">
          <label htmlFor="aearn">Points earned</label>
          <input id="aearn" inputMode="decimal" value={earned} onChange={(x) => setEarned(x.target.value)} placeholder="Not graded" />
        </div>
      </div>

      {course.groups.length > 1 && (
        <div className="field">
          <label htmlFor="agroup">Category</label>
          <select id="agroup" value={groupId} onChange={(x) => setGroupId(x.target.value)}>
            {course.groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
                {g.weight > 0 ? ` (${fmt(g.weight, 1)}%)` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="field">
        <label htmlFor="apred">Predicted points</label>
        <input
          id="apred"
          inputMode="decimal"
          value={predicted}
          onChange={(x) => setPredicted(x.target.value)}
          placeholder="What do you expect to get?"
          disabled={e != null}
        />
        {e != null && <span className="hint">This is already graded, so the prediction isn't used.</span>}
      </div>

      {showPreview && (
        <div className="whatif" aria-live="polite">
          <span>{e != null ? 'Your course grade with this score' : `If you score ${fmt(p)}, your course grade would be`}</span>
          <mark className="whatif-num">
            {fmtPct(preview.pct)} {preview.pct != null ? letterFor(preview.pct, course.scale) : ''}
          </mark>
          {delta != null && Math.abs(delta) >= 0.05 && (
            <span className="hint">
              {delta > 0 ? 'Up' : 'Down'} {fmt(Math.abs(delta), 1)} points from {fmtPct(now.pct)} now.
            </span>
          )}
        </div>
      )}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <div className="stack">
        <button className="btn primary" onClick={submit}>
          Save assignment
        </button>
        {onDelete && (
          <button className="btn danger" onClick={() => window.confirm(`Delete "${assignment.name}"?`) && onDelete()}>
            Delete assignment
          </button>
        )}
      </div>
    </Sheet>
  );
}

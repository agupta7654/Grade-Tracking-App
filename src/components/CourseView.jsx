import { useState } from 'react';
import { computeGrade, fmt, fmtPct, gradedShare, groupSummary, hasPredictions, letterFor, num, uid } from '../lib/grades';
import TopBar from './TopBar';
import AssignmentSheet from './AssignmentSheet';
import CourseSettingsSheet from './CourseSettingsSheet';

export default function CourseView({ course, update }) {
  const [editing, setEditing] = useState(null); // assignment id, 'new', or null
  const [settings, setSettings] = useState(false);

  const cur = computeGrade(course, 'actual');
  const proj = computeGrade(course, 'projected');
  const showProj = hasPredictions(course) && proj.pct != null;
  const share = gradedShare(course);
  const weighted = course.groups.some((g) => g.weight > 0);

  const mutate = (fn) =>
    update((d) => {
      fn(d.courses.find((c) => c.id === course.id));
    });

  const setEarned = (id, raw) => {
    const v = num(raw);
    const a = course.assignments.find((x) => x.id === id);
    if (a.earned === v) return;
    mutate((c) => {
      c.assignments.find((x) => x.id === id).earned = v;
    });
  };

  const save = (vals, id) =>
    mutate((c) => {
      if (id) Object.assign(c.assignments.find((a) => a.id === id), vals);
      else c.assignments.push({ id: uid(), ...vals });
    });

  const remove = (id) =>
    mutate((c) => {
      c.assignments = c.assignments.filter((a) => a.id !== id);
    });

  const visibleGroups = course.groups.filter((g) => course.assignments.some((a) => a.groupId === g.id) || g.weight > 0);
  const editingAssignment = editing && editing !== 'new' ? course.assignments.find((a) => a.id === editing) : null;

  return (
    <main className="page">
      <TopBar
        back="#/"
        backLabel="Courses"
        title={course.name}
        right={
          <button className="link" onClick={() => setSettings(true)}>
            Edit
          </button>
        }
      />

      <section className="hero" aria-label="Current grade">
        <div className="hero-grade">
          <span className="hero-letter">{letterFor(cur.pct, course.scale)}</span>
          <span className="hero-pct">{fmtPct(cur.pct)}</span>
        </div>
        <div className="coverage">
          <div className="bar" role="img" aria-label={`${fmt(share, 0)} percent of course points graded`}>
            <div className="bar-fill" style={{ width: `${Math.min(100, share)}%` }} />
          </div>
          <span className="sub">{fmt(share, 0)}% of course points graded</span>
        </div>
        {showProj && (
          <p className="projected">
            <mark>
              Projected {fmtPct(proj.pct)} ({letterFor(proj.pct, course.scale)})
            </mark>{' '}
            if your predictions hold
          </p>
        )}
      </section>

      <div className="actions">
        <button className="btn primary" onClick={() => setEditing('new')}>
          Add assignment
        </button>
        <a className="btn" href={`#/import/${course.id}`}>
          Import syllabus
        </a>
      </div>

      {course.assignments.length === 0 && (
        <p className="empty">No assignments yet. Import your syllabus or add them one at a time.</p>
      )}

      {visibleGroups.map((g) => {
        const s = groupSummary(course, g.id);
        const list = course.assignments.filter((a) => a.groupId === g.id);
        const uncounted = weighted && !(g.weight > 0) && list.length > 0;
        return (
          <section className="group" key={g.id}>
            <header className="group-head">
              <h2>{g.name}</h2>
              <span className="group-meta">
                {g.weight > 0 ? `${fmt(g.weight, 1)}% of grade` : uncounted ? 'No weight, not counted' : ''}
              </span>
              <span className="group-sum">{s.graded ? `${fmt(s.earned)} / ${fmt(s.possible)}  (${fmtPct(s.pct)})` : ''}</span>
            </header>
            <ul className="rows">
              {list.map((a) => (
                <li className="row" key={a.id}>
                  <button className="row-name" onClick={() => setEditing(a.id)}>
                    <span>{a.name}</span>
                    {a.earned == null && a.predicted != null && (
                      <span className="pred">
                        <mark>Predicted {fmt(a.predicted)}</mark>
                      </span>
                    )}
                  </button>
                  <label className="score">
                    <input
                      className="score-input"
                      inputMode="decimal"
                      placeholder="–"
                      defaultValue={a.earned ?? ''}
                      key={`${a.id}-${a.earned ?? ''}`}
                      aria-label={`Points earned on ${a.name}`}
                      onBlur={(e) => setEarned(a.id, e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    />
                    <span className="of">/ {fmt(a.possible)}</span>
                  </label>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {editing && (
        <AssignmentSheet
          course={course}
          assignment={editingAssignment}
          onClose={() => setEditing(null)}
          onSave={(vals) => {
            save(vals, editingAssignment?.id);
            setEditing(null);
          }}
          onDelete={
            editingAssignment
              ? () => {
                  remove(editingAssignment.id);
                  setEditing(null);
                }
              : null
          }
        />
      )}
      {settings && <CourseSettingsSheet course={course} update={update} onClose={() => setSettings(false)} />}
    </main>
  );
}

import { useState } from 'react';
import { computeGrade, fmtPct, letterFor, newCourse } from '../lib/grades';
import { go } from '../lib/route';
import Sheet from './Sheet';

export default function Home({ courses, update }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  const create = (thenImport) => {
    const n = name.trim();
    if (!n) return;
    const c = newCourse(n);
    update((d) => d.courses.push(c));
    setAdding(false);
    setName('');
    go(thenImport ? `/import/${c.id}` : `/course/${c.id}`);
  };

  return (
    <main className="page">
      <header className="home-head">
        <h1 className="wordmark">Tally</h1>
        <a className="link" href="#/settings">
          Backup
        </a>
      </header>

      {courses.length === 0 ? (
        <p className="empty">No courses yet. Add one, then import its syllabus to fill in the assignments.</p>
      ) : (
        <ul className="courses">
          {courses.map((c) => {
            const g = computeGrade(c, 'actual');
            const graded = c.assignments.filter((a) => a.earned != null).length;
            return (
              <li key={c.id}>
                <a className="course-row" href={`#/course/${c.id}`}>
                  <span className={`stamp${g.pct == null ? ' stamp-empty' : ''}`}>{letterFor(g.pct, c.scale)}</span>
                  <span className="course-main">
                    <strong>{c.name}</strong>
                    <span className="sub">
                      {c.assignments.length ? `${graded} of ${c.assignments.length} graded` : 'No assignments yet'}
                    </span>
                  </span>
                  <span className="course-pct">{fmtPct(g.pct)}</span>
                </a>
              </li>
            );
          })}
        </ul>
      )}

      <button className="btn primary wide" onClick={() => setAdding(true)}>
        Add course
      </button>

      {adding && (
        <Sheet title="Add course" onClose={() => setAdding(false)}>
          <div className="field">
            <label htmlFor="cname">Course name</label>
            <input id="cname" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. MATH 1552 Integral Calculus" />
          </div>
          <div className="stack">
            <button className="btn primary" disabled={!name.trim()} onClick={() => create(true)}>
              Create and import syllabus
            </button>
            <button className="btn" disabled={!name.trim()} onClick={() => create(false)}>
              Create empty course
            </button>
          </div>
        </Sheet>
      )}
    </main>
  );
}

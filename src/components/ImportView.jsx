import { useMemo, useState } from 'react';
import { applyImport } from '../lib/grades';
import { buildImportText, parseImportText } from '../lib/parseSyllabus';
import { go } from '../lib/route';
import TopBar from './TopBar';

const EXAMPLE = `[Homework 30%]
Homework 1 | 20
Homework 2 | 20
[Exams 40%]
Midterm | 100
Final | 150`;

export default function ImportView({ course, update }) {
  const [text, setText] = useState('');
  const [raw, setRaw] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [copied, setCopied] = useState(false);

  const parsed = useMemo(() => parseImportText(text), [text]);

  const onFile = async (ev) => {
    const file = ev.target.files?.[0];
    ev.target.value = '';
    if (!file) return;
    setBusy(true);
    setNote('');
    try {
      const { extractLines } = await import('../lib/pdfText.js');
      const lines = await extractLines(file);
      const rawText = lines.join('\n');
      setRaw(rawText);
      if (rawText.replace(/\s/g, '').length < 20) {
        setNote('This PDF has no readable text, so it may be a scan. Type or paste the assignments below instead.');
      } else {
        const built = buildImportText(lines);
        setText(built);
        setNote(
          built
            ? 'Here is what was found. Check every line, fix anything that looks off, then add it to your course.'
            : 'The PDF was read, but no point values were found. Open the extracted text below to see what it says, then type the assignments in.'
        );
      }
    } catch {
      setNote('That PDF could not be read. Try another file, or type the assignments below.');
    } finally {
      setBusy(false);
    }
  };

  const copyRaw = async () => {
    try {
      await navigator.clipboard.writeText(raw);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked */
    }
  };

  const add = () => {
    update((d) => applyImport(d.courses.find((c) => c.id === course.id), parsed));
    go(`/course/${course.id}`);
  };

  const n = parsed.assignments.length;

  return (
    <main className="page">
      <TopBar back={`#/course/${course.id}`} backLabel="Back" title="Import syllabus" />

      <section className="block">
        <h2 className="subhead">1. Read a syllabus PDF</h2>
        <p className="hint">The PDF is read on your phone. Nothing is uploaded.</p>
        <label className={`btn primary filebtn${busy ? ' is-busy' : ''}`}>
          {busy ? 'Reading PDF…' : 'Choose PDF'}
          <input type="file" accept="application/pdf" onChange={onFile} disabled={busy} hidden />
        </label>
        {note && <p className="note">{note}</p>}
      </section>

      <section className="block">
        <h2 className="subhead">2. Check the assignment list</h2>
        <textarea
          className="import-box"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={EXAMPLE}
          rows={12}
          spellCheck={false}
          autoCapitalize="off"
          aria-label="Assignment list"
        />
        <details>
          <summary>How to write the list</summary>
          <p className="hint">
            One assignment per line as name | points. Put a category on its own line in square brackets, with its weight if it has one. Add a
            third value if you already have the score, like Quiz 1 | 10 | 9.
          </p>
          <pre className="example">{EXAMPLE}</pre>
        </details>
        {parsed.bad.length > 0 && (
          <p className="error">
            {parsed.bad.length} line{parsed.bad.length > 1 ? 's' : ''} can't be read and will be skipped: {parsed.bad.slice(0, 3).join('; ')}
            {parsed.bad.length > 3 ? '…' : ''}
          </p>
        )}
      </section>

      <button className="btn primary wide" disabled={n === 0} onClick={add}>
        {n === 0 ? 'Add to course' : `Add ${n} assignment${n > 1 ? 's' : ''}`}
      </button>

      {raw && (
        <details className="block">
          <summary>Extracted PDF text</summary>
          <p className="hint">If the list above missed things, copy this text and paste it to Claude to get a clean list back.</p>
          <button className="btn" onClick={copyRaw}>
            {copied ? 'Copied' : 'Copy extracted text'}
          </button>
          <textarea className="import-box raw" readOnly value={raw} rows={10} aria-label="Extracted PDF text" />
        </details>
      )}
    </main>
  );
}

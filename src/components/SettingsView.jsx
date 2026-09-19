import { useState } from 'react';
import { validBackup } from '../lib/store';
import TopBar from './TopBar';

export default function SettingsView({ data, replaceAll }) {
  const [paste, setPaste] = useState('');
  const [msg, setMsg] = useState('');

  const json = JSON.stringify(data, null, 2);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setMsg('Backup copied. Paste it somewhere safe, like a note to yourself.');
    } catch {
      setMsg('Copying was blocked. Use Download backup instead.');
    }
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tally-backup.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const restore = (text) => {
    try {
      const d = JSON.parse(text);
      if (!validBackup(d)) throw new Error('bad');
      if (!window.confirm(`Replace everything here with this backup (${d.courses.length} course${d.courses.length === 1 ? '' : 's'})?`)) return;
      replaceAll(d);
      setPaste('');
      setMsg('Backup restored.');
    } catch {
      setMsg("That doesn't look like a Tally backup.");
    }
  };

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (f) restore(await f.text());
  };

  const erase = () => {
    if (window.confirm('Erase all courses and grades from this device? This cannot be undone.')) {
      replaceAll({ courses: [] });
      setMsg('Everything was erased.');
    }
  };

  return (
    <main className="page">
      <TopBar back="#/" backLabel="Courses" title="Backup" />

      <section className="block">
        <p>
          Your courses and grades are stored only on this device. The Home Screen app and the browser keep separate copies, so enter
          everything in the Home Screen app, and back it up here now and then.
        </p>
      </section>

      <section className="block">
        <h2 className="subhead">Save a backup</h2>
        <div className="stack">
          <button className="btn primary" onClick={copy}>
            Copy backup
          </button>
          <button className="btn" onClick={download}>
            Download backup
          </button>
        </div>
      </section>

      <section className="block">
        <h2 className="subhead">Restore a backup</h2>
        <textarea
          className="import-box"
          rows={5}
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          placeholder="Paste a copied backup here"
          spellCheck={false}
          aria-label="Backup text"
        />
        <div className="stack">
          <button className="btn" disabled={!paste.trim()} onClick={() => restore(paste)}>
            Restore from pasted text
          </button>
          <label className="btn">
            Restore from file
            <input type="file" accept="application/json,.json" onChange={onFile} hidden />
          </label>
        </div>
      </section>

      {msg && (
        <p className="note" role="status">
          {msg}
        </p>
      )}

      <section className="block">
        <h2 className="subhead">Add to your Home Screen</h2>
        <p>On iPhone, open this site in Safari, tap Share, then Add to Home Screen. On Android, open the browser menu and tap Install app.</p>
      </section>

      <section className="block">
        <button className="btn danger" onClick={erase}>
          Erase all data
        </button>
      </section>
    </main>
  );
}

import { useState } from 'react';
import { validBackup } from '../lib/store';
import TopBar from './TopBar';

function SyncSection({ sync }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [verifying, setVerifying] = useState(false);

  if (!sync.enabled) {
    return (
      <section className="block">
        <h2 className="subhead">Sync across devices</h2>
        <p>Sync isn't set up for this deploy yet.</p>
      </section>
    );
  }

  if (sync.user) {
    return (
      <section className="block">
        <h2 className="subhead">Sync across devices</h2>
        <p>
          Signed in as {sync.user.email}.{' '}
          {sync.status === 'syncing' ? 'Syncing…' : sync.status === 'error' ? 'Could not reach the sync server.' : 'Up to date.'}
        </p>
        <button className="btn" onClick={sync.signOut}>
          Sign out
        </button>
      </section>
    );
  }

  const send = async (e) => {
    e.preventDefault();
    setErr('');
    const { error } = await sync.signIn(email.trim());
    if (error) setErr(error.message);
    else setSent(true);
  };

  const verify = async (e) => {
    e.preventDefault();
    setErr('');
    setVerifying(true);
    const { error } = await sync.verifyCode(email.trim(), code.trim());
    setVerifying(false);
    if (error) setErr(error.message);
    // On success, sign-in state updates on its own and this section re-renders.
  };

  return (
    <section className="block">
      <h2 className="subhead">Sync across devices</h2>
      <p>Sign in with your email once on your phone and once on your laptop, and this data stays in sync between them.</p>
      {sent ? (
        <form className="stack" onSubmit={verify}>
          <p className="note" role="status">
            We sent a 6-digit code to {email}. Enter it below.
          </p>
          <input
            className="import-box"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            aria-label="6-digit code"
          />
          <button className="btn primary" type="submit" disabled={verifying}>
            {verifying ? 'Checking…' : 'Verify'}
          </button>
          <button
            className="btn"
            type="button"
            onClick={() => {
              setSent(false);
              setCode('');
              setErr('');
            }}
          >
            Use a different email
          </button>
          {err && (
            <p className="note" role="status">
              {err}
            </p>
          )}
        </form>
      ) : (
        <form className="stack" onSubmit={send}>
          <input
            className="import-box"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Email address"
          />
          <button className="btn primary" type="submit">
            Send sign-in code
          </button>
          {err && (
            <p className="note" role="status">
              {err}
            </p>
          )}
        </form>
      )}
    </section>
  );
}

export default function SettingsView({ data, replaceAll, sync }) {
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
          Your courses and grades are stored on this device. Sign in below to keep them in sync with your other devices too — or use
          the backup tools to move data over by hand.
        </p>
      </section>

      <SyncSection sync={sync} />

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

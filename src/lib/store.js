import { useCallback, useEffect, useState } from 'react';

const KEY = 'tally:v1';
const STAMP_KEY = 'tally:v1:updatedAt';

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (d && Array.isArray(d.courses)) return d;
    }
  } catch {
    /* ignore */
  }
  return { courses: [] };
}

function loadStamp() {
  const n = Number(localStorage.getItem(STAMP_KEY));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function useStore() {
  const [data, setData] = useState(load);
  // Tracks when this device last changed the data, so cloud sync can tell
  // whether this device or another one has the newer copy.
  const [updatedAt, setUpdatedAt] = useState(loadStamp);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* storage full or blocked */
    }
  }, [data]);

  useEffect(() => {
    try {
      localStorage.setItem(STAMP_KEY, String(updatedAt));
    } catch {
      /* storage full or blocked */
    }
  }, [updatedAt]);

  // update(draft => { ...mutate draft... })
  const update = useCallback((fn) => {
    setData((prev) => {
      const draft = JSON.parse(JSON.stringify(prev));
      fn(draft);
      return draft;
    });
    setUpdatedAt(Date.now());
  }, []);

  const replaceAll = useCallback((next) => {
    setData(next);
    setUpdatedAt(Date.now());
  }, []);

  // Used only by cloud sync when adopting data from another device, so we
  // keep that device's timestamp instead of stamping it as a new local edit.
  const adoptRemote = useCallback((next, remoteUpdatedAt) => {
    setData(next);
    setUpdatedAt(remoteUpdatedAt);
  }, []);

  return { data, update, replaceAll, updatedAt, adoptRemote };
}

export function validBackup(d) {
  return !!d && Array.isArray(d.courses) && d.courses.every((c) => c && c.id && Array.isArray(c.groups) && Array.isArray(c.assignments));
}

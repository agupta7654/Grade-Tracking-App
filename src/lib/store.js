import { useCallback, useEffect, useState } from 'react';

const KEY = 'tally:v1';

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

export function useStore() {
  const [data, setData] = useState(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* storage full or blocked */
    }
  }, [data]);

  // update(draft => { ...mutate draft... })
  const update = useCallback((fn) => {
    setData((prev) => {
      const draft = JSON.parse(JSON.stringify(prev));
      fn(draft);
      return draft;
    });
  }, []);

  const replaceAll = useCallback((next) => setData(next), []);

  return { data, update, replaceAll };
}

export function validBackup(d) {
  return !!d && Array.isArray(d.courses) && d.courses.every((c) => c && c.id && Array.isArray(c.groups) && Array.isArray(c.assignments));
}

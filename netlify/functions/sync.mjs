import { getStore } from '@netlify/blobs';

// A code is what pairs your devices. It doesn't need to be secret from
// Netlify, just hard for a stranger to guess: letters/numbers, 4-64 chars.
const CODE_PATTERN = /^[A-Za-z0-9-]{4,64}$/;

export default async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get('code') || '';

  if (!CODE_PATTERN.test(code)) {
    return new Response(JSON.stringify({ error: 'Missing or invalid code' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const store = getStore('tally-sync');

  if (req.method === 'GET') {
    const entry = await store.get(code, { type: 'json' });
    return new Response(JSON.stringify(entry ?? null), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (req.method === 'POST') {
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (!body || typeof body !== 'object' || !body.data || typeof body.updatedAt !== 'number') {
      return new Response(JSON.stringify({ error: 'Body must be { data, updatedAt }' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }
    await store.setJSON(code, body);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  return new Response('Method not allowed', { status: 405 });
};

export const config = { path: '/api/sync' };

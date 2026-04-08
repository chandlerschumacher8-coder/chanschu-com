// api/health.js — System health check for Supabase, Redis, and Anthropic AI
import { Redis } from '@upstash/redis';
import { getSupabase, useSupabase } from './_supabase.js';
import { setCorsHeaders } from './_auth.js';

export const config = { maxDuration: 15 };

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const status = { supabase: 'unknown', redis: 'unknown', ai: 'unknown', timestamp: new Date().toISOString() };

  // Check Supabase
  try {
    if (useSupabase()) {
      const sb = getSupabase();
      const start = Date.now();
      const { error } = await sb.from('stores').select('id').limit(1);
      status.supabase = error ? 'down' : 'ok';
      status.supabase_ms = Date.now() - start;
    } else {
      status.supabase = 'disabled';
    }
  } catch (e) {
    status.supabase = 'down';
    status.supabase_error = e.message;
  }

  // Check Redis
  try {
    const redis = Redis.fromEnv();
    const start = Date.now();
    await redis.ping();
    status.redis = 'ok';
    status.redis_ms = Date.now() - start;
  } catch (e) {
    status.redis = 'down';
    status.redis_error = e.message;
  }

  // Check Anthropic AI
  try {
    const key = process.env.ANTHROPIC_KEY;
    if (!key) { status.ai = 'no_key'; }
    else {
      const start = Date.now();
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 5000);
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1, messages: [{ role: 'user', content: 'ping' }] }),
        signal: ctrl.signal,
      });
      clearTimeout(tid);
      status.ai = resp.ok ? 'ok' : 'degraded';
      status.ai_ms = Date.now() - start;
      if (!resp.ok) status.ai_status = resp.status;
    }
  } catch (e) {
    status.ai = e.name === 'AbortError' ? 'timeout' : 'down';
    status.ai_error = e.message;
  }

  const allOk = status.supabase === 'ok' && status.redis === 'ok' && (status.ai === 'ok' || status.ai === 'no_key');
  return res.status(allOk ? 200 : 503).json({ ok: allOk, ...status });
}

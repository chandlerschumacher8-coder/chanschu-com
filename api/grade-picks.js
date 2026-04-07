// api/grade-picks.js
// Manually trigger grading of yesterday's picks without generating new ones
// Visit /api/grade-picks in browser to run anytime

import { validateSession, unauthorized, handlePreflight } from './_auth.js';
import { Redis } from '@upstash/redis';
const redis = Redis.fromEnv();
 
async function callClaude(prompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw new Error('Claude ' + res.status);
  const data = await res.json();
  return data.content[0].text.trim();
}
 
async function fetchScores(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - (daysAgo || 1));
  const dateStr = d.toISOString().slice(0, 10).replace(/-/g, '');
 
  const endpoints = [
    'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=' + dateStr,
    'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard?dates=' + dateStr,
    'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=' + dateStr,
    'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?dates=' + dateStr,
    'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?dates=' + dateStr,
  ];
 
  const results = await Promise.allSettled(endpoints.map(u => fetch(u).then(r => r.json())));
  const lines = [];
  results.forEach(r => {
    if (r.status !== 'fulfilled') return;
    (r.value.events || []).forEach(ev => {
      const comp = ev.competitions?.[0];
      if (!comp?.status?.type?.completed) return;
      const home = comp.competitors?.find(c => c.homeAway === 'home');
      const away = comp.competitors?.find(c => c.homeAway === 'away');
      if (home && away) lines.push(away.team.displayName + ' ' + away.score + ' @ ' + home.team.displayName + ' ' + home.score + ' (FINAL)');
    });
  });
  return lines;
}
 
export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  res.setHeader('Cache-Control', 'no-store');
  const session = await validateSession(req);
  if (!session) return unauthorized(res);

  try {
    // Support ?days=2 to grade 2 days ago etc
    const daysAgo = parseInt(req.query?.days || '1');
 
    const raw = await redis.get('yesterday-picks');
    if (!raw) return res.status(200).json({ ok: false, message: 'No picks found to grade' });
 
    const picksData = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!picksData.picks?.length) return res.status(200).json({ ok: false, message: 'No picks in record' });
 
    const scores = await fetchScores(daysAgo);
    if (scores.length === 0) return res.status(200).json({ ok: false, message: 'No completed game scores found yet — try again later' });
 
    const picksText = picksData.picks.map(p =>
      'Pick ' + p.rank + ': ' + p.pick + ' (Game: ' + p.game + ', Odds: ' + p.odds + ')'
    ).join('\n');
 
    const prompt = 'Grade these sports betting picks against actual results. Mark each win, loss, push, or pending (if game not found).\n\nPICKS:\n' + picksText + '\n\nRESULTS:\n' + scores.join('\n') + '\n\nRespond ONLY in this JSON:\n{"grades":[{"rank":1,"result":"win"},{"rank":2,"result":"loss"}]}';
 
    const reply = await callClaude(prompt);
    const match = reply.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in Claude response');
    const gradeData = JSON.parse(match[0]);
 
    const existingRaw = await redis.get('pick-results');
    const results = existingRaw ? (typeof existingRaw === 'string' ? JSON.parse(existingRaw) : existingRaw) : {};
 
    const dated = picksData.date || '';
    const graded = [];
    gradeData.grades.forEach(grade => {
      if (grade.result === 'pending') return;
      const pick = picksData.picks.find(p => p.rank === grade.rank);
      if (!pick) return;
      const pickId = 'pick-' + pick.rank + '-' + dated.replace(/[^a-z0-9]/gi, '');
      results[pickId] = grade.result;
      graded.push({ rank: pick.rank, pick: pick.pick, result: grade.result });
    });
 
    await redis.set('pick-results', JSON.stringify(results));
 
    return res.status(200).json({
      ok: true,
      picksDate: dated,
      scoresFound: scores.length,
      graded,
      totals: {
        wins:   Object.values(results).filter(v => v === 'win').length,
        losses: Object.values(results).filter(v => v === 'loss').length,
        pushes: Object.values(results).filter(v => v === 'push').length,
      }
    });
 
  } catch (err) {
    console.error('grade-picks error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}

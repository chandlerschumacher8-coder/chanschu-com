// api/daily-picks.js
// 1. Grades yesterday's picks automatically using Claude + live scores
// 2. Generates today's new picks
// Runs daily at 9AM CT via Vercel cron (see vercel.json)

import { Redis } from '@upstash/redis';
import { validateSession, unauthorized, handlePreflight } from './_auth.js';
 
const redis = Redis.fromEnv();
 
async function callClaude(prompt, maxTokens) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens || 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw new Error('Claude ' + res.status + ': ' + await res.text());
  const data = await res.json();
  return data.content[0].text.trim();
}
 
async function fetchScores() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().slice(0, 10).replace(/-/g, '');
 
  const endpoints = [
    'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=' + dateStr,
    'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard?dates=' + dateStr,
    'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=' + dateStr,
    'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?dates=' + dateStr,
    'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?dates=' + dateStr,
  ];
 
  const results = await Promise.allSettled(endpoints.map(url => fetch(url).then(r => r.json())));
 
  const scoreLines = [];
  results.forEach(r => {
    if (r.status !== 'fulfilled') return;
    (r.value.events || []).forEach(ev => {
      const comp = ev.competitions?.[0];
      if (!comp || !comp.status?.type?.completed) return;
      const home = comp.competitors?.find(c => c.homeAway === 'home');
      const away = comp.competitors?.find(c => c.homeAway === 'away');
      if (home && away) {
        scoreLines.push(away.team.displayName + ' ' + away.score + ' @ ' + home.team.displayName + ' ' + home.score + ' (FINAL)');
      }
    });
  });
 
  return scoreLines;
}
 
async function gradeYesterdaysPicks() {
  try {
    const raw = await redis.get('yesterday-picks');
    if (!raw) return;
    const yesterdayData = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!yesterdayData.picks || yesterdayData.picks.length === 0) return;
 
    const scores = await fetchScores();
    if (scores.length === 0) return;
 
    const picksText = yesterdayData.picks.map(p =>
      'Pick ' + p.rank + ': ' + p.pick + ' (Game: ' + p.game + ', Odds: ' + p.odds + ')'
    ).join('\n');
 
    const prompt = 'You are grading sports betting picks against actual results.\n\nYESTERDAY\'S PICKS:\n' + picksText + '\n\nACTUAL RESULTS:\n' + scores.join('\n') + '\n\nGrade each pick as win, loss, push, or pending (if game not found).\n\nRespond ONLY in this JSON:\n{"grades":[{"rank":1,"result":"win"},{"rank":2,"result":"loss"},{"rank":3,"result":"push"},{"rank":4,"result":"pending"},{"rank":5,"result":"win"}]}';
 
    const response = await callClaude(prompt, 400);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return;
    const gradeData = JSON.parse(jsonMatch[0]);
 
    const existingRaw = await redis.get('pick-results');
    const results = existingRaw ? (typeof existingRaw === 'string' ? JSON.parse(existingRaw) : existingRaw) : {};
 
    gradeData.grades.forEach(grade => {
      if (grade.result === 'pending') return;
      const pick = yesterdayData.picks.find(p => p.rank === grade.rank);
      if (!pick) return;
      const pickId = 'pick-' + pick.rank + '-' + (yesterdayData.date || '').replace(/[^a-z0-9]/gi, '');
      results[pickId] = grade.result;
    });
 
    await redis.set('pick-results', JSON.stringify(results));
    console.log('Auto-graded picks:', gradeData.grades.length);
  } catch (err) {
    console.error('Grading error:', err.message);
  }
}
 
export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  res.setHeader('Cache-Control', 'no-store');
  const session = await validateSession(req);
  if (!session) return unauthorized(res);

  const ODDS_KEY      = process.env.ODDS_API_KEY;
  const ANTHROPIC_KEY = process.env.ANTHROPIC_KEY;
  if (!ODDS_KEY || !ANTHROPIC_KEY) {
    return res.status(500).json({ ok: false, error: 'Missing API keys' });
  }
 
  try {
    // Step 1 — grade yesterday
    await gradeYesterdaysPicks();
 
    // Step 2 — fetch odds
    const sports = ['americanfootball_nfl','baseball_mlb','basketball_nba','americanfootball_ncaaf','basketball_ncaab'];
    const oddsResults = await Promise.allSettled(
      sports.map(sport =>
        fetch('https://api.the-odds-api.com/v4/sports/' + sport + '/odds/?apiKey=' + ODDS_KEY + '&regions=us&markets=spreads,totals,h2h&oddsFormat=american&daysFrom=2')
          .then(r => r.json()).then(data => ({ sport, games: data }))
      )
    );
 
    const allGames = [];
    oddsResults.forEach(r => {
      if (r.status !== 'fulfilled') return;
      const { sport, games } = r.value;
      if (!Array.isArray(games)) return;
      games.forEach(game => {
        allGames.push({ sport, home: game.home_team, away: game.away_team, time: game.commence_time, books: game.bookmakers?.slice(0,3) || [] });
      });
    });
 
    const today = new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' });
 
    if (allGames.length === 0) {
      const payload = { picks: [], date: today, generatedAt: new Date().toISOString(), noGames: true };
      await redis.set('daily-picks', JSON.stringify(payload), { ex: 86400 });
      await redis.set('yesterday-picks', JSON.stringify(payload), { ex: 172800 });
      return res.status(200).json({ ok: true, message: 'No games today', data: payload });
    }
 
    // Step 3 — format games
    const gamesText = allGames.slice(0, 30).map(g => {
      const book = g.books[0];
      if (!book) return null;
      const spread = book.markets?.find(m => m.key === 'spreads');
      const total  = book.markets?.find(m => m.key === 'totals');
      const h2h    = book.markets?.find(m => m.key === 'h2h');
      const spreadStr = spread?.outcomes?.map(o => o.name + ' ' + (o.point > 0 ? '+' : '') + o.point).join(' / ') || 'N/A';
      const totalStr  = total?.outcomes?.find(o => o.name === 'Over')?.point || 'N/A';
      const mlStr     = h2h?.outcomes?.map(o => o.name + ' ' + (o.price > 0 ? '+' : '') + o.price).join(' / ') || 'N/A';
      const gameTime  = new Date(g.time).toLocaleString('en-US', { weekday:'short', month:'short', day:'numeric', hour:'numeric', minute:'2-digit', timeZone:'America/Chicago', timeZoneName:'short' });
      const label     = g.sport.replace('americanfootball_','').replace('basketball_','').replace('baseball_','').toUpperCase();
      return label + ': ' + g.away + ' @ ' + g.home + ' — ' + gameTime + ' | Spread: ' + spreadStr + ' | O/U: ' + totalStr + ' | ML: ' + mlStr;
    }).filter(Boolean).join('\n');
 
    // Step 4 — Claude picks
    const prompt = 'You are a sharp sports bettor. Today is ' + today + '.\n\nGames:\n' + gamesText + '\n\nGive me TOP 5 BEST BETS. Respond ONLY in this JSON:\n{"picks":[{"rank":1,"game":"Away @ Home","sport":"NFL","pick":"Chiefs -3.5","odds":"-110","confidence":"High","reasoning":"2-3 sentences."}],"disclaimer":"AI picks for entertainment only."}';
 
    const responseText = await callClaude(prompt, 1500);
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Claude did not return valid JSON');
    const picksData = JSON.parse(jsonMatch[0]);
 
    const payload = {
      picks: picksData.picks || [],
      disclaimer: picksData.disclaimer || '',
      date: today,
      generatedAt: new Date().toISOString(),
      gamesAnalyzed: allGames.length,
    };
 
    await redis.set('daily-picks',     JSON.stringify(payload), { ex: 100800 });
    await redis.set('yesterday-picks', JSON.stringify(payload), { ex: 172800 });
 
    return res.status(200).json({ ok: true, data: payload });
 
  } catch (err) {
    console.error('daily-picks error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}

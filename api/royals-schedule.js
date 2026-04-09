// api/royals-schedule.js — Proxy for MLB Stats API (avoids CORS issues)
// Public endpoint — no auth required

import { handlePreflight, setCorsHeaders } from './_auth.js';

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  setCorsHeaders(res);
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

  try {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 7);
    const end = new Date(today);
    end.setDate(end.getDate() + 30);
    const fmt = d => d.toISOString().slice(0, 10);

    const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&teamId=118&startDate=${fmt(start)}&endDate=${fmt(end)}&hydrate=team,linescore,broadcasts&gameType=R`;
    const mlbRes = await fetch(url);
    if (!mlbRes.ok) throw new Error('MLB API ' + mlbRes.status);
    const data = await mlbRes.json();

    const games = [];
    (data.dates || []).forEach(d => {
      (d.games || []).forEach(g => {
        const status = g.status.abstractGameState;
        const kcHome = g.teams.home.team.id === 118;
        const kcScore = kcHome ? (g.teams.home.score || 0) : (g.teams.away.score || 0);
        const oppScore = kcHome ? (g.teams.away.score || 0) : (g.teams.home.score || 0);

        // Extract TV broadcast
        let tv = null;
        if (g.broadcasts) {
          const tvBroadcast = g.broadcasts.find(b => b.type === 'TV' && b.homeAway === (kcHome ? 'home' : 'away'));
          if (tvBroadcast) tv = tvBroadcast.name;
          if (!tv) {
            const anyTv = g.broadcasts.find(b => b.type === 'TV');
            if (anyTv) tv = anyTv.name;
          }
        }

        games.push({
          commence_time: g.gameDate,
          home_team: g.teams.home.team.name,
          away_team: g.teams.away.team.name,
          home_team_id: g.teams.home.team.id,
          away_team_id: g.teams.away.team.id,
          status,
          kcScore,
          oppScore,
          won: status === 'Final' && kcScore > oppScore,
          lost: status === 'Final' && kcScore < oppScore,
          tv,
        });
      });
    });

    games.sort((a, b) => new Date(a.commence_time) - new Date(b.commence_time));

    return res.status(200).json({ ok: true, games });
  } catch (err) {
    console.error('[royals-schedule] Error:', err.message);
    return res.status(500).json({ ok: false, error: err.message, games: [] });
  }
}

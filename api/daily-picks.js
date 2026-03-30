// api/daily-picks.js
// Vercel Serverless Function — fetches today's odds, sends to Claude, stores top 5 picks
// Set up a Vercel Cron Job to call this daily at 9AM CT:
// In vercel.json: { "crons": [{ "path": "/api/daily-picks", "schedule": "0 14 * * *" }] }
 
import { Redis } from '@upstash/redis';
 
const redis = Redis.fromEnv();
 
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
 
  // Allow manual trigger via GET, or cron trigger
  const ODDS_KEY      = process.env.ODDS_API_KEY;
  const ANTHROPIC_KEY = process.env.ANTHROPIC_KEY;
 
  if (!ODDS_KEY || !ANTHROPIC_KEY) {
    return res.status(500).json({ ok: false, error: 'Missing API keys' });
  }
 
  try {
    // ── 1. FETCH TODAY'S ODDS ──
    // Get games for NFL, MLB, NBA, NCAAF, NCAAB with spreads + totals
    const sports = [
      'americanfootball_nfl',
      'baseball_mlb',
      'basketball_nba',
      'americanfootball_ncaaf',
      'basketball_ncaab',
    ];
 
    const oddsResults = await Promise.allSettled(
      sports.map(sport =>
        fetch(
          `https://api.the-odds-api.com/v4/sports/${sport}/odds/` +
          `?apiKey=${ODDS_KEY}&regions=us&markets=spreads,totals,h2h` +
          `&oddsFormat=american&daysFrom=2`
        ).then(r => r.json()).then(data => ({ sport, games: data }))
      )
    );
 
    // Flatten all games
    const allGames = [];
    oddsResults.forEach(r => {
      if (r.status !== 'fulfilled') return;
      const { sport, games } = r.value;
      if (!Array.isArray(games)) return;
      games.forEach(game => {
        allGames.push({
          sport,
          id: game.id,
          home: game.home_team,
          away: game.away_team,
          time: game.commence_time,
          books: game.bookmakers?.slice(0, 3) || [],
        });
      });
    });
 
    if (allGames.length === 0) {
      // No games today — store empty state
      await redis.set('daily-picks', JSON.stringify({
        picks: [],
        date: new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' }),
        generatedAt: new Date().toISOString(),
        noGames: true,
      }), { ex: 86400 });
      return res.status(200).json({ ok: true, message: 'No games today' });
    }
 
    // Format games for Claude
    const gamesText = allGames.slice(0, 30).map(g => {
      const book = g.books[0];
      if (!book) return null;
      const spread  = book.markets?.find(m => m.key === 'spreads');
      const total   = book.markets?.find(m => m.key === 'totals');
      const h2h     = book.markets?.find(m => m.key === 'h2h');
 
      const spreadStr = spread?.outcomes?.map(o => `${o.name} ${o.point > 0 ? '+' : ''}${o.point}`).join(' / ') || 'N/A';
      const totalStr  = total?.outcomes?.find(o => o.name === 'Over')?.point || 'N/A';
      const mlStr     = h2h?.outcomes?.map(o => `${o.name} ${o.price > 0 ? '+' : ''}${o.price}`).join(' / ') || 'N/A';
 
      const gameTime = new Date(g.time).toLocaleString('en-US', { weekday:'short', month:'short', day:'numeric', hour:'numeric', minute:'2-digit', timeZone:'America/Chicago', timeZoneName:'short' });
 
      return `${g.sport.replace('americanfootball_','').replace('basketball_','').replace('baseball_','').toUpperCase()}: ${g.away} @ ${g.home} — ${gameTime} | Spread: ${spreadStr} | O/U: ${totalStr} | ML: ${mlStr}`;
    }).filter(Boolean).join('\n');
 
    // ── 2. CALL CLAUDE FOR PICKS ──
    const today = new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' });
 
    const prompt = `You are a sharp sports bettor and analyst. Today is ${today}.
 
Here are today's available games with betting lines:
 
${gamesText}
 
Analyze these matchups and give me your TOP 5 BEST BETS for today. For each pick consider:
- Line value (is the spread too high or too low?)
- Recent team form and trends
- Home/away advantages
- Over/under tendencies
- Any notable situational edges
 
Respond in this EXACT JSON format with no other text:
{
  "picks": [
    {
      "rank": 1,
      "game": "Away Team @ Home Team",
      "sport": "NFL/MLB/NBA/etc",
      "pick": "Exact pick (e.g. Chiefs -3.5, Over 47.5, Royals ML)",
      "odds": "+110 or -115 etc",
      "confidence": "High/Medium",
      "reasoning": "2-3 sentence explanation of why this is a strong bet"
    }
  ],
  "disclaimer": "These are AI-generated picks for entertainment only. Please gamble responsibly."
}`;
 
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
 
    if (!claudeRes.ok) {
      const err = await claudeRes.text();
      throw new Error(`Claude API error: ${claudeRes.status} — ${err}`);
    }
 
    const claudeData = await claudeRes.json();
    const rawText = claudeData.content[0].text.trim();
 
    // Parse JSON from Claude response
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Claude did not return valid JSON');
    const picksData = JSON.parse(jsonMatch[0]);
 
    // ── 3. STORE IN REDIS ──
    const payload = {
      picks: picksData.picks || [],
      disclaimer: picksData.disclaimer || '',
      date: today,
      generatedAt: new Date().toISOString(),
      gamesAnalyzed: allGames.length,
    };
 
    // Store for 28 hours (refreshes daily but stays available overnight)
    await redis.set('daily-picks', JSON.stringify(payload), { ex: 100800 });
 
    return res.status(200).json({ ok: true, data: payload });
 
  } catch (err) {
    console.error('daily-picks error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}

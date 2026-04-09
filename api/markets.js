// api/markets.js — Vercel Serverless Function
// Fetches stock/commodity data from Yahoo Finance server-side (no CORS issues)
// Public endpoint — no auth required (markets.html is a public page)

import { setCorsHeaders } from './_auth.js';

export const config = { maxDuration: 15 };

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');

  const symbols = [
    { sym: '^GSPC',  id: 'sp'     },
    { sym: '^DJI',   id: 'dow'    },
    { sym: '^IXIC',  id: 'nas'    },
    { sym: '^RUT',   id: 'rut'    },
    { sym: '^VIX',   id: 'vix'    },
    { sym: 'GC=F',   id: 'gold'   },
    { sym: 'SI=F',   id: 'silver' },
    { sym: 'CL=F',   id: 'oil'    },
  ];

  async function fetchQuote(symbol) {
    // Try Yahoo Finance v8 chart endpoint
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
    });
    if (!response.ok) {
      // Fallback to query2
      const url2 = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`;
      const res2 = await fetch(url2, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
      });
      if (!res2.ok) throw new Error(`Yahoo ${symbol} ${res2.status}`);
      const data2 = await res2.json();
      return parseYahooChart(data2, symbol);
    }
    const data = await response.json();
    return parseYahooChart(data, symbol);
  }

  function parseYahooChart(data, symbol) {
    const result = data?.chart?.result?.[0];
    if (!result) throw new Error(`No data for ${symbol}`);
    const m = result.meta;
    const prev = m.chartPreviousClose || m.previousClose || m.regularMarketPreviousClose;
    const price = m.regularMarketPrice || prev;
    if (!price || isNaN(price)) throw new Error(`No price for ${symbol}`);
    const chg = prev ? price - prev : 0;
    const pct = prev ? (chg / prev) * 100 : 0;
    return {
      price: +price.toFixed(4),
      prev:  prev ? +prev.toFixed(4) : null,
      open:  m.regularMarketOpen   ? +m.regularMarketOpen.toFixed(4)   : null,
      high:  m.regularMarketDayHigh ? +m.regularMarketDayHigh.toFixed(4) : null,
      low:   m.regularMarketDayLow  ? +m.regularMarketDayLow.toFixed(4)  : null,
      chg:   +chg.toFixed(4),
      pct:   +pct.toFixed(4),
    };
  }

  try {
    const results = await Promise.allSettled(
      symbols.map(({ sym, id }) =>
        fetchQuote(sym).then(data => ({ id, data }))
      )
    );

    const output = {};
    results.forEach(r => {
      if (r.status === 'fulfilled') {
        output[r.value.id] = r.value.data;
      }
    });

    res.status(200).json({ ok: true, data: output, timestamp: Date.now() });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

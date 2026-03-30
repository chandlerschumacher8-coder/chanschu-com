// api/markets.js — Vercel Serverless Function
// Fetches stock/commodity data from Yahoo Finance server-side (no CORS issues)
// Deployed automatically by Vercel when this file is in your /api folder
 
export default async function handler(req, res) {
  // Allow requests from your domain
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
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
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; chanschu-markets/1.0)',
        'Accept': 'application/json',
      },
    });
    if (!response.ok) throw new Error(`Yahoo ${symbol} ${response.status}`);
    const data = await response.json();
    const m = data.chart.result[0].meta;
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
      } else {
        output[r.value?.id || 'unknown'] = null;
      }
    });
 
    res.status(200).json({ ok: true, data: output, timestamp: Date.now() });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

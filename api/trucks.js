// api/trucks.js — Fetch live vehicle locations from Verizon Connect

const APP_ID = 'fleetmatics-p-us-sxlNeoNGn9hZhauSStPN1OR9yVXmp4G8iDpsUFj8';
const TOKEN_URL = 'https://fim.api.us.fleetmatics.com/token';
const VEHICLES_URL = 'https://fim.api.us.fleetmatics.com/cmd/v1/vehicles';
const TOKEN_TTL_MS = 55 * 60 * 1000; // 55 minutes

let cachedToken = null;
let tokenExpiresAt = 0;

async function getToken(username, password) {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

  const b64 = Buffer.from(`${username}:${password}`).toString('base64');
  const res = await fetch(TOKEN_URL, {
    headers: {
      'Authorization': `Basic ${b64}`,
      'Accept': 'text/plain'
    }
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error('Token request failed: ' + res.status + ' ' + body);
  }
  const token = await res.text();
  if (!token || token.trim() === '') throw new Error('No token in response');

  cachedToken = token.trim();
  tokenExpiresAt = Date.now() + TOKEN_TTL_MS;
  return cachedToken;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  const username = process.env.VERIZON_USERNAME;
  const password = process.env.VERIZON_PASSWORD;
  if (!username || !password) {
    return res.status(200).json({ ok: true, source: 'mock', trucks: mockTrucks() });
  }

  try {
    const token = await getToken(username, password);

    const vRes = await fetch(VEHICLES_URL, {
      headers: {
        'Authorization': `Atmosphere atmosphere_app_id=${APP_ID}, Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    // If 401, token may have been revoked — clear cache and retry once
    if (vRes.status === 401) {
      cachedToken = null;
      tokenExpiresAt = 0;
      const token2 = await getToken(username, password);
      const vRes2 = await fetch(VEHICLES_URL, {
        headers: {
          'Authorization': `Atmosphere atmosphere_app_id=${APP_ID}, Bearer ${token2}`,
          'Accept': 'application/json'
        }
      });
      if (!vRes2.ok) throw new Error('Vehicles API error after retry: ' + vRes2.status);
      const data2 = await vRes2.json();
      return res.status(200).json({ ok: true, source: 'live', trucks: mapVehicles(data2) });
    }

    if (!vRes.ok) throw new Error('Vehicles API error: ' + vRes.status);
    const data = await vRes.json();
    return res.status(200).json({ ok: true, source: 'live', trucks: mapVehicles(data) });

  } catch (e) {
    return res.status(200).json({ ok: true, source: 'mock', error: e.message, trucks: mockTrucks() });
  }
}

function mapVehicles(data) {
  const list = data.Vehicles || data.vehicles || data || [];
  return list.map(v => ({
    name: v.Description || v.description || v.VehicleId || 'Truck',
    driver: v.DriverName || v.driverName || '',
    lat: parseFloat(v.Latitude || v.latitude || 0),
    lng: parseFloat(v.Longitude || v.longitude || 0),
    speed: parseFloat(v.Speed || v.speed || 0),
    heading: parseFloat(v.Heading || v.heading || 0),
    lastUpdated: v.LastUpdated || v.lastUpdated || null
  }));
}

function mockTrucks() {
  return [
    { name: 'Truck 1 - DC Appliance', driver: 'Jeff', lat: 37.753, lng: -100.017, speed: 0, heading: 0, lastUpdated: null },
    { name: 'Truck 2 - DC Appliance', driver: 'Justin', lat: 37.748, lng: -100.005, speed: 0, heading: 0, lastUpdated: null }
  ];
}

// api/trucks.js — Fetch live vehicle locations from Verizon Connect

const APP_ID = 'fleetmatics-p-us-sxlNeoNGn9hZhauSStPN1OR9yVXmp4G8iDpsUFj8';
const TOKEN_URL = 'https://fim.us.fleetmatics.com/token';
const VEHICLES_URL = 'https://fim.api.us.fleetmatics.com/cmd/v1/vehicles';
const TOKEN_TTL_MS = 55 * 60 * 1000; // 55 minutes

let cachedToken = null;
let tokenExpiresAt = 0;

async function getToken(secret) {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `client_id=${APP_ID}&client_secret=${encodeURIComponent(secret)}&grant_type=client_credentials`
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error('Token request failed: ' + res.status + ' ' + body);
  }
  const data = await res.json();
  if (!data.access_token) throw new Error('No access_token in response');

  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + TOKEN_TTL_MS;
  return cachedToken;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  const secret = process.env.VERIZON_CLIENT_SECRET;
  if (!secret) {
    return res.status(200).json({ ok: true, source: 'mock', trucks: mockTrucks() });
  }

  try {
    const token = await getToken(secret);

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
      const freshToken = await getToken(secret);
      const retry = await fetch(VEHICLES_URL, {
        headers: {
          'Authorization': `Atmosphere atmosphere_app_id=${APP_ID}, Bearer ${freshToken}`,
          'Accept': 'application/json'
        }
      });
      if (!retry.ok) throw new Error('Vehicles request failed after token refresh: ' + retry.status);
      return res.status(200).json({ ok: true, source: 'live', trucks: parseVehicles(await retry.json()) });
    }

    if (!vRes.ok) throw new Error('Vehicles request failed: ' + vRes.status);
    return res.status(200).json({ ok: true, source: 'live', trucks: parseVehicles(await vRes.json()) });
  } catch (err) {
    return res.status(200).json({ ok: true, source: 'mock', error: err.message, trucks: mockTrucks() });
  }
}

function parseVehicles(vehicles) {
  return (Array.isArray(vehicles) ? vehicles : vehicles.VehicleList || vehicles.vehicles || []).map(v => ({
    name: v.VehicleName || v.Name || v.vehicleName || 'Unknown',
    driver: v.DriverName || v.Driver || v.driverName || '',
    lat: parseFloat(v.Latitude || v.latitude || (v.Position && v.Position.Latitude) || 0),
    lng: parseFloat(v.Longitude || v.longitude || (v.Position && v.Position.Longitude) || 0),
    speed: v.Speed || v.speed || 0,
    heading: v.Heading || v.heading || 0,
    lastUpdated: v.LastUpdatedUTC || v.lastUpdated || v.TimeStamp || null
  })).filter(t => t.lat !== 0 && t.lng !== 0);
}

function mockTrucks() {
  return [
    { name: 'Truck 1 - DC Appliance', driver: 'Jeff', lat: 37.7530, lng: -100.0170, speed: 0, heading: 0, lastUpdated: null },
    { name: 'Truck 2 - DC Appliance', driver: 'Justin', lat: 37.7480, lng: -100.0050, speed: 0, heading: 0, lastUpdated: null }
  ];
}

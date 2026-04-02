// api/trucks.js - Fetch live vehicle locations from Verizon Connect

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
    const authHeader = `Atmosphere atmosphere_app_id=${APP_ID}, Bearer ${token}`;
    const headers = { 'Authorization': authHeader, 'Accept': 'application/json' };

    // Fetch vehicle list
    let vRes = await fetch(VEHICLES_URL, { headers });
    if (vRes.status === 401) {
      cachedToken = null; tokenExpiresAt = 0;
      const t2 = await getToken(username, password);
      vRes = await fetch(VEHICLES_URL, { headers: { 'Authorization': `Atmosphere atmosphere_app_id=${APP_ID}, Bearer ${t2}`, 'Accept': 'application/json' } });
    }
    if (!vRes.ok) throw new Error('Vehicles API error: ' + vRes.status);
    const vehicleData = await vRes.json();
    const vehicles = vehicleData.Vehicles || vehicleData.vehicles || (Array.isArray(vehicleData) ? vehicleData : []);

    // Probe multiple location endpoint formats
    const locDebug = {};
    const testUrls = [
      'https://fim.api.us.fleetmatics.com/cmd/v3/vehiclelocations',
      'https://fim.api.us.fleetmatics.com/cmd/v1/VehicleLocations',
      'https://fim.api.us.fleetmatics.com/cmd/v3/VehicleLocations',
      'https://fim.api.us.fleetmatics.com/v1/vehiclelocations',
      'https://fim.api.us.fleetmatics.com/v1/locations',
      'https://fim.api.us.fleetmatics.com/cmd/v1/locations',
    ];

    for (const url of testUrls) {
      try {
        const r = await fetch(url, { headers });
        const body = await r.text();
        locDebug[url] = { status: r.status, body: body.substring(0, 200) };
      } catch(err) {
        locDebug[url] = { error: err.message };
      }
    }

    const trucks = vehicles.map(v => ({
      name: v.Name || v.Description || v.VehicleNumber || String(v.VehicleId),
      driver: '',
      lat: 0,
      lng: 0,
      speed: 0,
      heading: 0,
      lastUpdated: null
    }));

    return res.status(200).json({ ok: true, source: 'live', trucks, locDebug });

  } catch (e) {
    return res.status(200).json({ ok: true, source: 'mock', error: e.message, trucks: mockTrucks() });
  }
}

function mockTrucks() {
  return [
    { name: 'Truck 1 - DC Appliance', driver: 'Jeff', lat: 37.753, lng: -100.017, speed: 0, heading: 0, lastUpdated: null },
    { name: 'Truck 2 - DC Appliance', driver: 'Justin', lat: 37.748, lng: -100.005, speed: 0, heading: 0, lastUpdated: null }
  ];
}

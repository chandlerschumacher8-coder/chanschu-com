// api/trucks.js - Fetch live vehicle locations from Verizon Connect

const APP_ID = 'fleetmatics-p-us-sxlNeoNGn9hZhauSStPN1OR9yVXmp4G8iDpsUFj8';
const TOKEN_URL = 'https://fim.api.us.fleetmatics.com/token';
const VEHICLES_URL = 'https://fim.api.us.fleetmatics.com/cmd/v1/vehicles';
const LOCATIONS_URL = 'https://fim.api.us.fleetmatics.com/v1/vehicle-locations';
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

async function fetchWithRetry(url, headers, getTokenFn) {
  let res = await fetch(url, { headers });
  if (res.status === 401) {
    cachedToken = null;
    tokenExpiresAt = 0;
    const newToken = await getTokenFn();
    headers['Authorization'] = headers['Authorization'].replace(/Bearer .+$/, `Bearer ${newToken}`);
    res = await fetch(url, { headers });
  }
  return res;
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

    // Fetch vehicle list (names, IDs)
    const vRes = await fetchWithRetry(
      VEHICLES_URL,
      { 'Authorization': authHeader, 'Accept': 'application/json' },
      () => getToken(username, password)
    );
    if (!vRes.ok) throw new Error('Vehicles API error: ' + vRes.status);
    const vehicleData = await vRes.json();
    const vehicles = vehicleData.Vehicles || vehicleData.vehicles || vehicleData || [];

    // Try to fetch vehicle locations (GPS positions)
    let locationMap = {};
    try {
      const lRes = await fetchWithRetry(
        LOCATIONS_URL,
        { 'Authorization': authHeader, 'Accept': 'application/json' },
        () => getToken(username, password)
      );
      if (lRes.ok) {
        const locData = await lRes.json();
        const locs = locData.Locations || locData.locations || locData || [];
        locs.forEach(l => {
          locationMap[l.VehicleId] = l;
        });
      }
    } catch (locErr) {
      // Locations endpoint failed - will use 0,0 for positions
    }

    const trucks = vehicles.map(v => {
      const loc = locationMap[v.VehicleId] || {};
      return {
        name: v.Name || v.Description || v.VehicleNumber || String(v.VehicleId),
        driver: loc.DriverName || loc.driverName || v.DriverName || '',
        lat: parseFloat(loc.Latitude || loc.latitude || 0),
        lng: parseFloat(loc.Longitude || loc.longitude || 0),
        speed: parseFloat(loc.Speed || loc.speed || 0),
        heading: parseFloat(loc.Heading || loc.heading || 0),
        lastUpdated: loc.LastUpdated || loc.lastUpdated || null
      };
    });

    return res.status(200).json({ ok: true, source: 'live', trucks });

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

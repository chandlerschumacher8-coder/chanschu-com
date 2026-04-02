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

    // Fetch vehicle list (names, IDs)
    const vRes = await fetch(VEHICLES_URL, { headers });
    if (!vRes.ok) {
      // On 401, clear cache and retry
      if (vRes.status === 401) {
        cachedToken = null; tokenExpiresAt = 0;
        const t2 = await getToken(username, password);
        const h2 = { 'Authorization': `Atmosphere atmosphere_app_id=${APP_ID}, Bearer ${t2}`, 'Accept': 'application/json' };
        const vRes2 = await fetch(VEHICLES_URL, { headers: h2 });
        if (!vRes2.ok) throw new Error('Vehicles API error: ' + vRes2.status);
        const vehicleData2 = await vRes2.json();
        return buildResponse(res, vehicleData2, h2, username, password);
      }
      throw new Error('Vehicles API error: ' + vRes.status);
    }
    const vehicleData = await vRes.json();
    return buildResponse(res, vehicleData, headers, username, password);

  } catch (e) {
    return res.status(200).json({ ok: true, source: 'mock', error: e.message, trucks: mockTrucks() });
  }
}

async function buildResponse(res, vehicleData, headers, username, password) {
  const vehicles = vehicleData.Vehicles || vehicleData.vehicles || vehicleData || [];

  // Try to get GPS positions from vehiclelocations endpoint
  let locationMap = {};
  const locEndpoints = [
    'https://fim.api.us.fleetmatics.com/cmd/v1/vehiclelocations',
    'https://fim.api.us.fleetmatics.com/cmd/v1/vehicles/locations',
  ];
  let locDebug = {};
  for (const url of locEndpoints) {
    try {
      const lRes = await fetch(url, { headers });
      const bodyText = await lRes.text();
      locDebug[url] = { status: lRes.status, body: bodyText.substring(0, 500) };
      if (lRes.ok) {
        try {
          const locData = JSON.parse(bodyText);
          const locs = locData.Locations || locData.locations || locData || [];
          if (Array.isArray(locs)) {
            locs.forEach(l => { locationMap[l.VehicleId] = l; });
            break;
          }
        } catch(e) {}
      }
    } catch (err) {
      locDebug[url] = { error: err.message };
    }
  }

  const trucks = vehicles.map(v => {
    const loc = locationMap[v.VehicleId] || {};
    return {
      name: v.Name || v.Description || v.VehicleNumber || String(v.VehicleId),
      driver: loc.DriverName || loc.driverName || '',
      lat: parseFloat(loc.Latitude || loc.latitude || 0),
      lng: parseFloat(loc.Longitude || loc.longitude || 0),
      speed: parseFloat(loc.Speed || loc.speed || 0),
      heading: parseFloat(loc.Heading || loc.heading || 0),
      lastUpdated: loc.LastUpdated || loc.lastUpdated || null
    };
  });

  return res.status(200).json({ ok: true, source: 'live', trucks, locDebug });
}

function mockTrucks() {
  return [
    { name: 'Truck 1 - DC Appliance', driver: 'Jeff', lat: 37.753, lng: -100.017, speed: 0, heading: 0, lastUpdated: null },
    { name: 'Truck 2 - DC Appliance', driver: 'Justin', lat: 37.748, lng: -100.005, speed: 0, heading: 0, lastUpdated: null }
  ];
}

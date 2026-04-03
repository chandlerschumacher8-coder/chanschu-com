// api/trucks.js - Fetch live vehicle locations from Verizon Connect

const APP_ID = 'fleetmatics-p-us-sxlNeoNGn9hZhauSStPN1OR9yVXmp4G8iDpsUFj8';
const TOKEN_URL = 'https://fim.api.us.fleetmatics.com/token';
const VEHICLES_URL = 'https://fim.api.us.fleetmatics.com/cmd/v1/vehicles';
const RAD_BASE = 'https://fim.api.us.fleetmatics.com:443/rad/v1';
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

    // 1. Fetch vehicle metadata
    let vRes = await fetch(VEHICLES_URL, { headers });
    if (vRes.status === 401) {
      cachedToken = null; tokenExpiresAt = 0;
      const t2 = await getToken(username, password);
      vRes = await fetch(VEHICLES_URL, { headers: { 'Authorization': `Atmosphere atmosphere_app_id=${APP_ID}, Bearer ${t2}`, 'Accept': 'application/json' } });
    }
    if (!vRes.ok) throw new Error('Vehicles API error: ' + vRes.status);
    const vehicleData = await vRes.json();
    const vehicles = vehicleData.Vehicles || vehicleData.vehicles || (Array.isArray(vehicleData) ? vehicleData : []);

    // 2. Try multiple vehicle number formats for RAD API
    // Build candidate lists: try VehicleNumber, then Name, then VehicleId string
    const locationMap = {};
    const debug = {};

    // Try POST /vehicles/locations with all candidates
    const candidates = [
      vehicles.map(v => v.VehicleNumber).filter(Boolean),           // original VehicleNumber
      vehicles.map(v => v.Name).filter(Boolean),                    // vehicle Name
      vehicles.map(v => String(v.VehicleId)),                       // VehicleId as string
    ];

    for (const nums of candidates) {
      if (nums.length === 0) continue;
      const radRes = await fetch(`${RAD_BASE}/vehicles/locations`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(nums)
      });
      if (radRes.ok) {
        const radData = await radRes.json();
        debug['POST_' + nums[0]] = radData.map(e => e.VehicleNumber + ':' + e.StatusCode).join(',');
        const working = radData.filter(e => e.StatusCode === 200 && e.ContentResource?.Value);
        if (working.length > 0) {
          working.forEach(entry => {
            locationMap[entry.VehicleNumber] = entry.ContentResource.Value;
          });
          // Map back to vehicles by finding which vehicle has this identifier
          break;
        }
      }
    }

    // Also try GET per-vehicle with vehicle Name
    if (Object.keys(locationMap).length === 0) {
      for (const v of vehicles.slice(0, 1)) { // test just first vehicle
        const testNums = [v.Name, String(v.VehicleId), v.VehicleNumber].filter(Boolean);
        for (const num of testNums) {
          try {
            const r = await fetch(`${RAD_BASE}/vehicles/${encodeURIComponent(num)}/location`, { headers });
            const body = await r.text();
            debug['GET_' + num] = r.status + ':' + body.substring(0, 100);
            if (r.ok) {
              const locData = JSON.parse(body);
              locationMap[num] = locData;
              break;
            }
          } catch(e) {}
        }
        if (Object.keys(locationMap).length > 0) break;
      }
    }

    const trucks = vehicles.map(v => {
      const candidates = [v.VehicleNumber, v.Name, String(v.VehicleId)].filter(Boolean);
      const loc = candidates.map(k => locationMap[k]).find(Boolean) || {};
      return {
        name: v.Name || v.VehicleNumber || String(v.VehicleId),
        driver: loc.DriverNumber || '',
        lat: parseFloat(loc.Latitude || 0),
        lng: parseFloat(loc.Longitude || 0),
        speed: parseFloat(loc.Speed || 0),
        heading: loc.Heading || '',
        lastUpdated: loc.UpdateUTC || null
      };
    });

    return res.status(200).json({ ok: true, source: 'live', trucks, debug });

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

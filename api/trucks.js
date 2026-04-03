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
                cachedToken = null;
                tokenExpiresAt = 0;
                const t2 = await getToken(username, password);
                vRes = await fetch(VEHICLES_URL, { headers: {
                          'Authorization': `Atmosphere atmosphere_app_id=${APP_ID}, Bearer ${t2}`,
                          'Accept': 'application/json'
                }});
        }
        if (!vRes.ok) throw new Error('Vehicles API error: ' + vRes.status);

      const vehicleData = await vRes.json();
        const vehicles = vehicleData.Vehicles || vehicleData.vehicles || (Array.isArray(vehicleData) ? vehicleData : []);

      const debug = {
              vehicleCount: vehicles.length,
              vehicleSample: vehicles.slice(0, 3).map(v => ({
                        VehicleNumber: v.VehicleNumber,
                        Name: v.Name,
                        VehicleId: v.VehicleId
              }))
      };

      // 2. POST /vehicles/locations with VehicleNumber list
      // RAD API StatusCode 200 = found, 404 = not found for that vehicle
      const locationMap = {};

      // Build candidate ID arrays: VehicleNumber first, then Name, then VehicleId
      const candidateSets = [
              vehicles.map(v => v.VehicleNumber).filter(Boolean),
              vehicles.map(v => v.Name).filter(Boolean),
              vehicles.map(v => String(v.VehicleId)).filter(Boolean),
            ];

      for (const nums of candidateSets) {
              if (nums.length === 0) continue;

          const radRes = await fetch(`${RAD_BASE}/vehicles/locations`, {
                    method: 'POST',
                    headers: { ...headers, 'Content-Type': 'application/json' },
                    body: JSON.stringify(nums)
          });

          debug['POST_attempt_' + nums[0]] = radRes.status;

          if (radRes.ok) {
                    const radData = await radRes.json();
                    debug['POST_result_' + nums[0]] = radData.slice(0, 3).map(e =>
                                `${e.VehicleNumber}:SC${e.StatusCode}`
                                                                                      ).join(',');

                // StatusCode 200 means location found (integer or string)
                const working = radData.filter(e =>
                            (e.StatusCode === 200 || e.StatusCode === '200') &&
                            e.ContentResource && e.ContentResource.Value
                                                       );
                    if (working.length > 0) {
                                working.forEach(entry => {
                                              locationMap[entry.VehicleNumber] = entry.ContentResource.Value;
                                });
                                debug.locationSource = 'POST_' + nums[0];
                                break;
                    }

                // Also check StatusCode 100 (some Verizon Connect versions use 100 for success)
                const working100 = radData.filter(e =>
                            (e.StatusCode === 100 || e.StatusCode === '100') &&
                            e.ContentResource && e.ContentResource.Value
                                                          );
                    if (working100.length > 0) {
                                working100.forEach(entry => {
                                              locationMap[entry.VehicleNumber] = entry.ContentResource.Value;
                                });
                                debug.locationSource = 'POST_100_' + nums[0];
                                break;
                    }
          }
      }

      // 3. If bulk POST didn't work, try GET per vehicle for the first 3
      if (Object.keys(locationMap).length === 0) {
              for (const v of vehicles.slice(0, 3)) {
                        const tryNums = [v.VehicleNumber, v.Name, String(v.VehicleId)].filter(Boolean);
                        for (const num of tryNums) {
                                    try {
                                                  const r = await fetch(`${RAD_BASE}/vehicles/${encodeURIComponent(num)}/location`, { headers });
                                                  const body = await r.text();
                                                  debug['GET_' + num] = r.status + ':' + body.substring(0, 120);
                                                  if (r.ok) {
                                                                  const locData = JSON.parse(body);
                                                                  // GET endpoint returns VehicleLocation directly or wrapped
                                                    const loc = locData.Value || locData;
                                                                  if (loc && (loc.Latitude || loc.latitude)) {
                                                                                    locationMap[num] = loc;
                                                                                    break;
                                                                  }
                                                  }
                                    } catch(e) {
                                                  debug['GET_err_' + num] = e.message;
                                    }
                        }
              }
      }

      // 4. Map vehicles to truck objects
      const trucks = vehicles.map(v => {
              const keys = [v.VehicleNumber, v.Name, String(v.VehicleId)].filter(Boolean);
              const loc = keys.map(k => locationMap[k]).find(Boolean) || {};
              return {
                        name: v.Name || v.VehicleNumber || String(v.VehicleId),
                        vehicleNumber: v.VehicleNumber || '',
                        driver: loc.DriverNumber || loc.driverNumber || '',
                        lat: parseFloat(loc.Latitude || loc.latitude || 0),
                        lng: parseFloat(loc.Longitude || loc.longitude || 0),
                        speed: parseFloat(loc.Speed || loc.speed || 0),
                        heading: loc.Heading || loc.heading || '',
                        lastUpdated: loc.UpdateUTC || loc.updateUTC || null
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
      { name: 'Truck 2 - DC Appliance', driver: 'Justin', lat: 37.748, lng: -100.005, speed: 0, heading: 0, lastUpdated: null },
      { name: 'Truck 3 - DC Appliance', driver: '', lat: 37.745, lng: -99.998, speed: 0, heading: 0, lastUpdated: null }
        ];
}

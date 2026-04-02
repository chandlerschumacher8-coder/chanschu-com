// api/trucks.js — Fetch live vehicle locations from Verizon Connect
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  const appId = 'fleetmatics-p-us-sxlNeoNGn9hZhauSStPN1OR9yVXmp4G8iDpsUFj8';
  const secret = process.env.VERIZON_CLIENT_SECRET;

  if (!secret) {
    return res.status(200).json({ ok: true, source: 'mock', trucks: mockTrucks() });
  }

  try {
    // Step 1: Get bearer token
    const tokenRes = await fetch('https://fim.api.us.fleetmatics.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `client_id=${appId}&client_secret=${encodeURIComponent(secret)}&grant_type=client_credentials`
    });
    if (!tokenRes.ok) throw new Error('Token request failed: ' + tokenRes.status);
    const tokenData = await tokenRes.json();
    const token = tokenData.access_token;
    if (!token) throw new Error('No access_token in response');

    // Step 2: Fetch vehicles
    const vRes = await fetch('https://fim.api.us.fleetmatics.com/cmd/v1/vehicles', {
      headers: {
        'Authorization': `Atmosphere atmosphere_app_id=${appId}, Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    if (!vRes.ok) throw new Error('Vehicles request failed: ' + vRes.status);
    const vehicles = await vRes.json();

    const trucks = (Array.isArray(vehicles) ? vehicles : vehicles.VehicleList || vehicles.vehicles || []).map(v => ({
      name: v.VehicleName || v.Name || v.vehicleName || 'Unknown',
      driver: v.DriverName || v.Driver || v.driverName || '',
      lat: parseFloat(v.Latitude || v.latitude || (v.Position && v.Position.Latitude) || 0),
      lng: parseFloat(v.Longitude || v.longitude || (v.Position && v.Position.Longitude) || 0),
      speed: v.Speed || v.speed || 0,
      heading: v.Heading || v.heading || 0,
      lastUpdated: v.LastUpdatedUTC || v.lastUpdated || v.TimeStamp || null
    })).filter(t => t.lat !== 0 && t.lng !== 0);

    return res.status(200).json({ ok: true, source: 'live', trucks });
  } catch (err) {
    // Fallback to mock data if API fails
    return res.status(200).json({ ok: true, source: 'mock', error: err.message, trucks: mockTrucks() });
  }
}

function mockTrucks() {
  return [
    { name: 'Truck 1 - DC Appliance', driver: 'Jeff', lat: 37.7530, lng: -100.0170, speed: 0, heading: 0, lastUpdated: null },
    { name: 'Truck 2 - DC Appliance', driver: 'Justin', lat: 37.7480, lng: -100.0050, speed: 0, heading: 0, lastUpdated: null }
  ];
}

// api/live.js
// Deploy on Vercel (Node 18+). Simple caching in memory (works reasonably for serverless warm instances).
// Query params: ?body=Mars&time=now
const fetch = globalThis.fetch; // Vercel Node supports fetch

// Simple in-memory cache. Key -> { ts, data }
// Note: ephemeral, per instance; good for short caching (60s).
const CACHE = {};
const CACHE_TTL = 60; // seconds cache for each planet

// Map friendly names -> Horizons COMMAND codes (common ones)
const HORIZONS_CMD = {
  Mercury: '199',
  Venus: '299',
  Earth: '399',
  Moon: '301',       // sometimes Moon is 301
  Mars: '499',
  Jupiter: '599',
  Saturn: '699',
  Uranus: '799',
  Neptune: '899'
};

function nowIso() {
  return new Date().toISOString();
}

/**
 * Robustly extracts X, Y, Z vector data from various JPL API response formats.
 * @param {object} json The parsed JSON response from the JPL Horizons API.
 * @returns {object|null} Position object { x_km, y_km, z_km } or null if parsing fails.
 */
function extractVector(json) {
  let vec = null;

  // Priority 1: Check standard 'vectors' array and 'data' array
  if (json.vectors?.length > 0) {
    vec = json.vectors[0];
  } else if (json.data?.length > 0) {
    // Check if the data array items have position or x/y/z fields
    vec = json.data.find(item => item.position || (item.x && item.y && item.z));
  }

  // If we found a potential vector object, try to extract fields
  if (vec) {
    // Use Number() cast and || operator for robustness
    const x = Number(vec.x || vec.X || vec.position?.[0]);
    const y = Number(vec.y || vec.Y || vec.position?.[1]);
    const z = Number(vec.z || vec.Z || vec.position?.[2]);

    // Validate we actually got numbers
    if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
      return { x_km: x, y_km: y, z_km: z };
    }
  } 
  
  // Priority 2: Fallback for parsing complex string 'result' (less reliable)
  if (typeof json.result === 'string') {
    const match = json.result.match(/X =\s*([-\d.eE+]+).*?Y =\s*([-\d.eE+]+).*?Z =\s*([-\d.eE+]+)/s);
    if (match) {
      return { x_km: +match[1], y_km: +match[2], z_km: +match[3] };
    }
  }

  return null;
}

export default async function handler(req, res) {
  try {
    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    const body = (urlObj.searchParams.get('body') || 'Earth').trim();
    let time = (urlObj.searchParams.get('time') || 'now').trim();

    // validate body -> canonical name
    const canonical = Object.keys(HORIZONS_CMD).find(k => 
      k.toLowerCase() === body.toLowerCase()
    ) || null;

    if(!canonical) {
      return res.status(400).json({ error: 'Invalid body. Example: ?body=Mars' });
    }

    const cmd = HORIZONS_CMD[canonical];

    // Determine start time and cache key
    let start = new Date();
    if(time === 'now') {
      // Round to minute to leverage both in-memory and CDN caching
      start.setSeconds(0,0);
      start.setMilliseconds(0);
    } else {
      // Validate custom time input
      start = new Date(time);
      if (isNaN(start.getTime())) {
        return res.status(400).json({ error: "Invalid time format. Use ISO string or 'now'." });
      }
    }

    // Consistent ISO string for API request and cache key
    const startStr = start.toISOString();
    const cacheKey = `${cmd}:${startStr}`;

    // If cached & fresh, return from memory cache
    const cached = CACHE[cacheKey];
    const nowTs = Math.floor(Date.now()/1000);
    if(cached && (nowTs - cached.ts) < CACHE_TTL) {
      return res.status(200).json({ 
        cached_instance: true, 
        from_cache_at: new Date(cached.ts*1000).toISOString(), 
        ...cached.data 
      });
    }

    // Build Horizons REST query for vectors (pos in solar system barycenter or sun center)
    // We'll request VECTORS with CENTER='500@0' (heliocentric? Here we use @0 for solar system barycenter).
    // NOTE: you might want CENTER='@sun' or CENTER='500@0' depending reference; adjust as needed.
    // Using format=json output of SSD API
    // Example: https://ssd.jpl.nasa.gov/api/horizons.api?format=json&COMMAND='599'&EPHEM_TYPE='VECTORS'&CENTER='@0'&START_TIME='2025-12-07T00:00'&STOP_TIME='2025-12-07T00:00'&STEP_SIZE='1d'
    // Build Horizons REST query
    const stop = new Date(start.getTime() + 60 * 1000); // +1 minute window to ensure we get a data point
    const stopStr = stop.toISOString();


    const params = new URLSearchParams({
      format: 'json',
      COMMAND: `'${cmd}'`,
      EPHEM_TYPE: 'VECTORS',
      CENTER: `'500@10'`, // Explicitly set center to SOL (Sun)
      START_TIME: `'${startStr}'`,
      STOP_TIME: `'${stopStr}'`,
      STEP_SIZE: `'1 m'`, // single epoch
      VEC_TABLE: '1', // request vector table
      OUT_UNITS: "'KM-S'" // Can add this if velocities are also desired
    });

    const horizonsUrl = `https://ssd.jpl.nasa.gov/api/horizons.api?${params.toString()}`;

    // Call JPL
    const resp = await fetch(horizonsUrl, { method: 'GET' });
    if(!resp.ok) {
      const txt = await resp.text();
      console.error('Horizons error', resp.status, txt);
      return res.status(502).json({ error: 'Horizons request failed', status: resp.status, body: txt });
    }

    const json = await resp.json();

    // Use unified extraction function
    const position = extractVector(json);

    if(!position) {
      console.error('Could not parse vectors from Horizons response', json);
      return res.status(500).json({ error: 'Could not parse Horizons response', raw: json });
    }

    if(!position) {
      console.error('Could not parse vectors from Horizons response', json);
      return res.status(500).json({ error: 'Could not parse Horizons response', raw: json });
    }

    const out = {
      body: canonical,
      time: startStr,
      position,
      meta: {
        generated_at: nowIso(),
        source: 'JPL Horizons / ssd-api.jpl.nasa.gov'
      }
    };

    // Save to cache
    CACHE[cacheKey] = { ts: Math.floor(Date.now()/1000), data: out };

    // Set caching headers for CDN
    res.setHeader('Cache-Control', `s-maxage=${CACHE_TTL}, stale-while-revalidate=30`);
    return res.status(200).json({ cached: false, ...out });

  } catch (err) {
    console.error('handler error', err);
    return res.status(500).json({ error: 'internal', details: String(err) });
  }
}

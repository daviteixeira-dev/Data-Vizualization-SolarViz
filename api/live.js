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

    // Use cache key body+timeWindow (we normalize "now" to rounded minute)
    let cacheKey;
    if(time === 'now') {
      // Round to minute to avoid many unique queries for "now"
      const d = new Date();
      d.setSeconds(0,0);
      cacheKey = `${cmd}:${d.toISOString()}`;
      // We'll still ask the Horizons for a fresh value if cache expired,
      // but rounding reduces micro-requests.
    } else {
      cacheKey = `${cmd}:${time}`;
    }

    // If cached & fresh, return
    const cached = CACHE[cacheKey];
    const nowTs = Math.floor(Date.now()/1000);
    if(cached && (nowTs - cached.ts) < CACHE_TTL) {
      return res.status(200).json({ cached: true, from_cache_at: new Date(cached.ts*1000).toISOString(), ...cached.data });
    }

    // Build Horizons REST query for vectors (pos in solar system barycenter or sun center)
    // We'll request VECTORS with CENTER='500@0' (heliocentric? Here we use @0 for solar system barycenter).
    // NOTE: you might want CENTER='@sun' or CENTER='500@0' depending reference; adjust as needed.
    // Using format=json output of SSD API
    // Example: https://ssd-api.jpl.nasa.gov/horizons.api?format=json&COMMAND='599'&EPHEM_TYPE='VECTORS'&CENTER='@0'&START_TIME='2025-12-07T00:00'&STOP_TIME='2025-12-07T00:00'&STEP_SIZE='1d'
    let startTimeParam = time;
    if(time === 'now') startTimeParam = new Date().toISOString();

    const params = new URLSearchParams({
      format: 'json',
      COMMAND: `'${cmd}'`,
      EPHEM_TYPE: `'VECTORS'`,
      CENTER: `@sun`, // center can be '@sun' or '@0' (SSB); adjust if you want planet-relative moons
      START_TIME: `'${startTimeParam}'`,
      STOP_TIME: `'${startTimeParam}'`,
      STEP_SIZE: `'1 d'`, // single epoch
      VEC_TABLE: `'1'` // request vector table
    });

    const horizonsUrl = `https://ssd-api.jpl.nasa.gov/horizons.api?${params.toString()}`;

    // Call JPL
    const resp = await fetch(horizonsUrl, { method: 'GET' });
    if(!resp.ok) {
      const txt = await resp.text();
      console.error('Horizons error', resp.status, txt);
      return res.status(502).json({ error: 'Horizons request failed', status: resp.status, body: txt });
    }

    const json = await resp.json();

    // Parse the vector result
    // The API returns .result (text) or .data/vectors; check structure
    const content = json.result || json.data || json;
    // Sometimes the API packs the vector table inside `vector` field or `data` — let's attempt robust parsing:
    // We'll search in textual result for the VECTOR table if necessary.
    let vec;
    if(json.vectors && json.vectors.length) {
      vec = json.vectors[0];
    } else if(json.data && json.data.length && json.data[0].position) {
      vec = json.data[0]; // fallback
    } else if(json.result && typeof json.result === 'string') {
      // Try to extract lines like: " X = 1.234567... Y = ... Z = ..."
      const m = json.result.match(/X =\s*([-\d.eE+]+)\s*Y =\s*([-\d.eE+]+)\s*Z =\s*([-\d.eE+]+)/);
      if(m) {
        vec = { x: parseFloat(m[1]), y: parseFloat(m[2]), z: parseFloat(m[3]) };
      }
    }

    // If json.vectors present, adapt fields (API format can vary)
    let position = null;
    if(vec) {
      if(vec.x && vec.y && vec.z) {
        position = {
          x_km: Number(vec.x),
          y_km: Number(vec.y),
          z_km: Number(vec.z)
        };
      } else if(vec['x'] && vec['y'] && vec['z']) {
        position = { x_km: +vec.x, y_km: +vec.y, z_km: +vec.z };
      } else if(vec.position) {
        // some variants: vec.position = [x,y,z]
        const p = vec.position;
        position = { x_km: +p[0], y_km: +p[1], z_km: +p[2] };
      } else if(vec.data && vec.data.length) {
        // fallback parse first data entry if present
        const d = vec.data[0];
        if(d && d.position) {
          position = { x_km: +d.position[0], y_km: +d.position[1], z_km: +d.position[2] };
        }
      }
    }

    // As a super fallback, attempt to parse numbers inside json.result
    if(!position && json.result && typeof json.result === 'string') {
      const match = json.result.match(/X =\s*([-\d.eE+]+).*?Y =\s*([-\d.eE+]+).*?Z =\s*([-\d.eE+]+)/s);
      if(match) {
        position = { x_km: +match[1], y_km: +match[2], z_km: +match[3] };
      }
    }

    if(!position) {
      console.error('Could not parse vectors from Horizons response', json);
      return res.status(500).json({ error: 'Could not parse Horizons response', raw: json });
    }

    const out = {
      body: canonical,
      time: startTimeParam,
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

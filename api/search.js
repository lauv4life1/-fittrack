import crypto from 'crypto';

function oauthSignature(method, url, params, consumerSecret) {
  const sorted = Object.keys(params).sort().map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join('&');
  const base = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(sorted)}`;
  return crypto.createHmac('sha1', `${encodeURIComponent(consumerSecret)}&`).update(base).digest('base64');
}

function buildAuthHeaders(method, url, consumerKey, consumerSecret) {
  const oauthParams = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_version: '1.0',
  };
  oauthParams.oauth_signature = oauthSignature(method, url, oauthParams, consumerSecret);
  return 'OAuth ' + Object.keys(oauthParams).sort().map(k => `${encodeURIComponent(k)}="${encodeURIComponent(oauthParams[k])}"`).join(', ');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { query, page = 0 } = req.body;
    if (!query) return res.status(400).json({ error: 'Query required' });

    const key = process.env.FATSECRET_CLIENT_ID;
    const secret = process.env.FATSECRET_CLIENT_SECRET;
    if (!key || !secret) return res.status(500).json({ error: 'Missing FatSecret credentials' });

    const apiUrl = 'https://platform.fatsecret.com/rest/server.api';
    const params = { method: 'foods.search', search_expression: query, page_number: page.toString(), max_results: '10', format: 'json' };
    const auth = buildAuthHeaders('POST', apiUrl, key, secret);

    const body = new URLSearchParams(params).toString();
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Authorization': auth, 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const data = await response.json();
    if (data.error) return res.status(400).json({ error: data.error.message });

    const foods = data.foods?.food || [];
    const foodsArray = Array.isArray(foods) ? foods : [foods];

    res.json({
      results: foodsArray.map(food => ({
        id: food.food_id,
        name: food.food_name,
        description: food.food_description,
        type: food.food_type,
        url: food.food_url,
      })),
      totalResults: parseInt(data.foods?.total_results || 0),
    });
  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ error: error.message });
  }
}

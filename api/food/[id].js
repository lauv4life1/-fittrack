import crypto from 'crypto';

function percentEncode(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

function buildSignature(method, url, params, consumerSecret) {
  const sorted = Object.keys(params).sort()
    .map(k => `${percentEncode(k)}=${percentEncode(params[k])}`)
    .join('&');
  const base = `${method.toUpperCase()}&${percentEncode(url)}&${percentEncode(sorted)}`;
  return crypto.createHmac('sha1', `${percentEncode(consumerSecret)}&`).update(base).digest('base64');
}

function makeAuth(method, url, params, consumerKey, consumerSecret) {
  const oauthParams = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_version: '1.0',
  };
  oauthParams.oauth_signature = buildSignature(method, url, oauthParams, consumerSecret);
  return 'OAuth ' + Object.keys(oauthParams).sort()
    .map(k => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
    .join(', ');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Food ID required' });

    const key = process.env.FATSECRET_CLIENT_ID;
    const secret = process.env.FATSECRET_CLIENT_SECRET;
    if (!key || !secret) return res.status(500).json({ error: 'Missing credentials' });

    const apiUrl = 'https://platform.fatsecret.com/rest/server.api';
    const bodyParams = {
      method: 'food.get.v5',
      food_id: String(id),
      format: 'json',
    };
    const auth = makeAuth('POST', apiUrl, bodyParams, key, secret);

    const body = new URLSearchParams(bodyParams).toString();
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Authorization': auth, 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const data = await response.json();
    if (data.error) return res.status(400).json({ error: data.error.message });

    const food = data.food;
    const serving = food.servings?.serving;
    const servings = Array.isArray(serving) ? serving : [serving];

    res.json({
      id: food.food_id,
      name: food.food_name,
      description: food.food_description,
      servings: servings.map(s => ({
        servingId: s.serving_id,
        description: s.serving_description,
        calories: parseFloat(s.calories) || 0,
        protein: parseFloat(s.protein) || 0,
        carbs: parseFloat(s.carbohydrate) || 0,
        fat: parseFloat(s.fat) || 0,
      })),
    });
  } catch (error) {
    console.error('Food detail error:', error.message);
    res.status(500).json({ error: error.message });
  }
}

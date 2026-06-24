import crypto from 'crypto';

function percentEncode(str) {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
}

function makeSignature(method, url, allParams, consumerSecret) {
  const sorted = Object.keys(allParams).sort()
    .map(k => `${percentEncode(k)}=${percentEncode(allParams[k])}`)
    .join('&');
  const base = `${method}&${percentEncode(url)}&${percentEncode(sorted)}`;
  return crypto.createHmac('sha1', percentEncode(consumerSecret) + '&').update(base).digest('base64');
}

function fatsecretRequest(bodyParams, consumerKey, consumerSecret) {
  const url = 'https://platform.fatsecret.com/rest/server.api';
  const oauthParams = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_version: '1.0',
  };
  const allParams = { ...bodyParams, ...oauthParams };
  const signature = makeSignature('POST', url, allParams, consumerSecret);
  const authHeader = 'OAuth ' + Object.keys(oauthParams).sort()
    .map(k => `${k}="${percentEncode(oauthParams[k])}"`)
    .join(', ') + `, oauth_signature="${percentEncode(signature)}"`;
  return { url, authHeader, body: new URLSearchParams(bodyParams).toString() };
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

    const { url, authHeader, body } = fatsecretRequest({
      method: 'food.get.v5',
      food_id: String(id),
      format: 'json',
    }, key, secret);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': authHeader, 'Content-Type': 'application/x-www-form-urlencoded' },
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

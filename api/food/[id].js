let accessToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpiry) return accessToken;

  const credentials = btoa(
    `${process.env.FATSECRET_CLIENT_ID}:${process.env.FATSECRET_CLIENT_SECRET}`
  );

  const response = await fetch('https://oauth.fatsecret.com/connect/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=basic',
  });

  const data = await response.json();
  accessToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return accessToken;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Food ID required' });

    const token = await getAccessToken();

    const url = `https://platform.fatsecret.com/rest/server.api?method=food.get.v5&food_id=${id}&format=json`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
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
    res.status(500).json({ error: 'Failed to get food details' });
  }
}

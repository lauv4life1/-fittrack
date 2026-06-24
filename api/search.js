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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { query, page = 0 } = req.body;
    if (!query) return res.status(400).json({ error: 'Query required' });

    const token = await getAccessToken();

    const url = `https://platform.fatsecret.com/rest/server.api?method=foods.search&search_expression=${encodeURIComponent(query)}&page_number=${page}&max_results=10&format=json`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
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
    res.status(500).json({ error: 'Failed to search foods' });
  }
}

import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

let accessToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  try {
    const credentials = Buffer.from(
      `${process.env.FATSECRET_CLIENT_ID}:${process.env.FATSECRET_CLIENT_SECRET}`
    ).toString('base64');

    const response = await axios.post(
      'https://oauth.fatsecret.com/connect/token',
      'grant_type=client_credentials&scope=basic',
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    accessToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;
    console.log('FatSecret token obtained successfully');
    return accessToken;
  } catch (error) {
    console.error('Failed to get FatSecret token:', error.response?.data || error.message);
    throw error;
  }
}

app.post('/api/search', async (req, res) => {
  try {
    const { query, page = 0 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const token = await getAccessToken();

    const response = await axios.get('https://platform.fatsecret.com/rest/server.api', {
      params: {
        method: 'foods.search',
        search_expression: query,
        page_number: page,
        max_results: 10,
        format: 'json',
      },
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = response.data;
    
    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }

    const foods = data.foods?.food || [];
    const foodsArray = Array.isArray(foods) ? foods : [foods];

    const results = foodsArray.map(food => ({
      id: food.food_id,
      name: food.food_name,
      description: food.food_description,
      type: food.food_type,
      url: food.food_url,
    }));

    res.json({
      results,
      totalPages: parseInt(data.foods?.max_results || 0) > 0 ? Math.ceil(parseInt(data.foods?.total_results || 0) / 10) : 0,
      currentPage: parseInt(data.foods?.page_number || 0),
      totalResults: parseInt(data.foods?.total_results || 0),
    });
  } catch (error) {
    console.error('Search error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to search foods' });
  }
});

app.post('/api/food/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const token = await getAccessToken();

    const response = await axios.get('https://platform.fatsecret.com/rest/server.api', {
      params: {
        method: 'food.get.v5',
        food_id: id,
        format: 'json',
      },
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = response.data;
    
    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }

    const food = data.food;
    const serving = food.servings?.serving;
    const servings = Array.isArray(serving) ? serving : [serving];
    const defaultServing = servings[0] || {};

    res.json({
      id: food.food_id,
      name: food.food_name,
      description: food.food_description,
      servings: servings.map(s => ({
        servingId: s.serving_id,
        description: s.serving_description,
        metricAmount: s.metric_serving_amount,
        metricUnit: s.metric_serving_unit,
        calories: parseFloat(s.calories) || 0,
        protein: parseFloat(s.protein) || 0,
        carbs: parseFloat(s.carbohydrate) || 0,
        fat: parseFloat(s.fat) || 0,
        saturatedFat: parseFloat(s.saturated_fat) || 0,
        fiber: parseFloat(s.fiber) || 0,
        sugar: parseFloat(s.sugar) || 0,
        sodium: parseFloat(s.sodium) || 0,
      })),
    });
  } catch (error) {
    console.error('Food detail error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get food details' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`FatSecret proxy server running on http://localhost:${PORT}`);
});

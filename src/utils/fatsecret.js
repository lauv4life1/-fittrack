const API_BASE = '/api';

export const searchFoods = async (query, page = 0) => {
  try {
    const response = await fetch(`${API_BASE}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, page }),
    });

    if (!response.ok) {
      throw new Error('Search failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Search error:', error);
    return { results: [], totalPages: 0, currentPage: 0, totalResults: 0 };
  }
};

export const getFoodDetails = async (foodId) => {
  try {
    const response = await fetch(`${API_BASE}/food/${foodId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error('Failed to get food details');
    }

    return await response.json();
  } catch (error) {
    console.error('Food details error:', error);
    return null;
  }
};

export const parseNutritionFromDescription = (description) => {
  if (!description) return null;

  const caloriesMatch = description.match(/Calories:\s*([\d.]+)kcal/);
  const proteinMatch = description.match(/Protein:\s*([\d.]+)g/);
  const carbsMatch = description.match(/Carbs:\s*([\d.]+)g/);
  const fatMatch = description.match(/Fat:\s*([\d.]+)g/);

  return {
    calories: caloriesMatch ? parseFloat(caloriesMatch[1]) : 0,
    protein: proteinMatch ? parseFloat(proteinMatch[1]) : 0,
    carbs: carbsMatch ? parseFloat(carbsMatch[1]) : 0,
    fat: fatMatch ? parseFloat(fatMatch[1]) : 0,
  };
};

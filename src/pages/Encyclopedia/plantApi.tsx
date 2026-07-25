// src/pages/Encyclopedia/plantApi.tsx
import { Plant, Filters } from '../../types/plant';
import { apiUrl } from '../../config/api';

const API_BASE_URL = apiUrl('/api');

interface FetchPlantsResult {
  plants: Plant[];
  totalPages: number;
}

// ===== утилиты форматирования данных от Гигачата =====
const normalizeDangers = (src: any): string[] => {
  if (!src) return [];
  if (Array.isArray(src)) return src.map(String);
  if (typeof src === 'string') return [src];
  return Object.entries(src)
    .map(([k, v]) => `${k}: ${v}`)
    .filter(Boolean) as string[];
};

const buildDescription = (base: any, sci: string): string =>
  base ||
  `Это растение ${sci} используется как декоративное и хорошо чувствует себя в комнатных условиях. Подходит даже начинающим цветоводам.`;

// ========================
// PERENUAL - Plant Images
// ========================
export const fetchPlantImage = async (
  scientificName: string
): Promise<string> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/plants/photo?scientificName=${encodeURIComponent(
        scientificName
      )}`
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.image || 'https://via.placeholder.com/400x300?text=Plant';
  } catch (error) {
    console.error('🖼️ Plant photo fetch error:', error);
    return 'https://via.placeholder.com/400x300?text=Plant';
  }
};

// ========================
// Гигачат / GROQ – обогащение
// ========================
export const enrichPlantData = async (
  scientificName: string
): Promise<any | null> => {
  try {
    console.log('🌿 Enriching plant data for:', scientificName);

    const response = await fetch(`${API_BASE_URL}/plants/enrich`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scientificName }),
    });

    if (!response.ok) {
      console.error(`❌ Enrich request failed with status ${response.status}`);
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    console.log('✅ Enrichment response:', {
      scientificName: result.scientificName,
      enriched: result.enriched,
      hasData: !!result.data,
    });

    if (result.enriched && result.data) {
      console.log('📊 Enriched data fields:', Object.keys(result.data).join(', '));
      return result.data;
    }

    console.warn('⚠️ No enriched data returned');
    return null;
  } catch (error) {
    console.error('❌ Enrich error:', error);
    return null;
  }
};

// ========================
// PLANTS - Database CRUD
// ========================
export const fetchPlants = async (
  filters: Filters,
  page: number = 1
): Promise<FetchPlantsResult> => {
  try {
    const params = new URLSearchParams();

    if (filters.colors && filters.colors.length > 0) {
      params.append('colors', filters.colors.join(','));
    }
    if (filters.habitats && filters.habitats.length > 0) {
      params.append('habitats', filters.habitats.join(','));
    }
    if (filters.sizes && filters.sizes.length > 0) {
      params.append('sizes', filters.sizes.join(','));
    }

    params.append('page', page.toString());
    params.append('limit', '12');

    const response = await fetch(`${API_BASE_URL}/plants?${params}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    return {
      plants: data.plants,
      totalPages: data.totalPages,
    };
  } catch (error) {
    console.error('❌ Error fetching plants:', error);
    throw error;
  }
};

export const fetchPlantDetails = async (
  plantId: number | string
): Promise<Plant> => {
  try {
    const response = await fetch(`${API_BASE_URL}/plants/${plantId}`);
    if (!response.ok) throw new Error('Plant not found');
    return await response.json();
  } catch (error) {
    console.error('❌ Error fetching plant details:', error);
    throw error;
  }
};

export const searchPlants = async (query: string): Promise<Plant[]> => {
  try {
    if (!query.trim()) {
      const result = await fetchPlants({ colors: [], habitats: [], sizes: [] }, 1);
      return result.plants;
    }

    const response = await fetch(
      `${API_BASE_URL}/plants/search?query=${encodeURIComponent(query)}`
    );
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('❌ Error searching plants:', error);
    throw error;
  }
};

// ========================
// RECOGNITION - PlantNet + Enrichment
// ========================
export const addRecognizedPlant = async (
  plantData: any,
  genus?: string,
  family?: string,
  confidence?: number
): Promise<any> => {
  try {
    console.log('Adding recognized plant', plantData.scientificName);

    // 1. Обогащаем через Groq
    const enrichResponse = await fetch(`${API_BASE_URL}/plants/enrich`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scientificName: plantData.scientificName }),
    });

    if (!enrichResponse.ok) {
      const text = await enrichResponse.text();
      throw new Error(`Enrich failed: ${enrichResponse.status} ${text}`);
    }

    const enrichResult = await enrichResponse.json();
    const enriched = enrichResult?.data || null;

    // 2. Собираем объект под твою таблицу
    const fullPlantData = {
      scientificName: plantData.scientificName,
      name: enriched?.name || plantData.scientificName.split(' ')[0],
      image: null, // или URL, если хочешь
      color: enriched?.color || null,
      habitat: enriched?.habitat || null,
      size: enriched?.size || null,
      category: enriched?.category || null,
      categoryName: enriched?.categoryName || enriched?.categoryname || null,
      description: enriched?.description || null,
      watering: enriched?.watering || null,
      light: enriched?.light || null,
      temperature: enriched?.temperature || '10-25C',
      humidity: enriched?.humidity || null,
      features: enriched?.features || null,
      dangers: enriched?.dangers || null,
      maintenance: enriched?.maintenance || null,
      genus: genus || plantData.genus || enriched?.genus || null,
      family: family || plantData.family || enriched?.family || null,
      confidence: confidence ?? plantData.confidence ?? 0.95,
      // флаги/служебные поля
      isRecognized: true,
      source: 'plantnet+groq',
      verified: false,
      image_url: null,
      image_author: null,
      image_attribution_url: null,
    };

    // 3. Сохраняем растение
    const saveResponse = await fetch(`${API_BASE_URL}/plants/recognize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullPlantData),
    });

    if (!saveResponse.ok) {
      const errorText = await saveResponse.text();
      throw new Error(
        `HTTP ${saveResponse.status} - ${saveResponse.statusText}: ${errorText}`
      );
    }

    const result = await saveResponse.json();
    console.log('Plant saved', result);
    return result;
  } catch (error) {
    console.error('Error adding plant', error);
    throw error;
  }
};


// ========================
// SUBSCRIPTION API
// ========================

export const upgradeSubscription = async (
  userId: number,
  subscriptionType: 'free' | 'pro' | 'pro_ultra'
): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/subscription/upgrade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, subscriptionType }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upgrade subscription');
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Subscription upgrade error:', error);
    throw error;
  }
};

export default {
  fetchPlants,
  fetchPlantDetails,
  searchPlants,
  addRecognizedPlant,
  fetchPlantImage,
  enrichPlantData,
  upgradeSubscription, // ← ДОБАВИТЬ
};

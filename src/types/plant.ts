export type SubscriptionType = 'free' | 'pro' | 'pro_ultra';

export interface UserSubscription {
  type: SubscriptionType;
  dailyRequests: number;
  usedRequests: number;
}

export interface CareInfo {
  watering?: string;
  light?: string;
  temperature?: string;
  humidity?: string;
}

export interface Plant {
  id?: number;
  name: string;
  scientificName: string;  // ← camelCase для фронта
  image: string;
  color: string;
  habitat: 'indoor' | 'garden' | 'tropical' | 'desert';
  size: 'small' | 'medium' | 'large';
  category: string;
  categoryName: string;
  description: string;
  care: CareInfo;  // ← Используем care
  features: string[];
  dangers: string[];
  maintenance: string;
  isRecognized?: boolean;
  genus?: string;
  family?: string;
  confidence?: number;
  watering?: string;     // ← Backward compatibility
  light?: string;        // ← Backward compatibility  
  temperature?: string;  // ← Backward compatibility
  humidity?: string;     // ← Backward compatibility
}


export interface Filters {
  colors: string[];
  habitats: string[];
  sizes: string[];
}

export type FilterType = 'colors' | 'habitats' | 'sizes';

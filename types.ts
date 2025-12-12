export interface PlantInfo {
  name: string;
  scientificName: string;
  description: string;
  care: {
    water: string;
    light: string;
    soil: string;
    temperature: string;
  };
  funFact: string;
}

export interface DiagnosisResult {
  healthStatus: 'Healthy' | 'Sick' | 'Unknown';
  diagnosis: string;
  symptoms: string[];
  treatment: string[];
  prevention: string;
}

export interface ProductRecommendation {
  name: string;
  price: string;
  description: string;
  imageUrl?: string;
  productUrl?: string;
}

export interface SearchResult {
  products: ProductRecommendation[];
  rawText?: string;
  groundingChunks?: any[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  groundingMetadata?: any;
}

export enum AppMode {
  HOME = 'HOME',
  IDENTIFY = 'IDENTIFY',
  DIAGNOSE = 'DIAGNOSE',
  CHAT = 'CHAT',
  GARDEN = 'GARDEN' // Saved plants
}

export interface SavedPlant extends PlantInfo {
  id: string;
  imageUrl: string;
  dateAdded: number;
}
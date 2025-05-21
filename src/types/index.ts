export interface VoiceConfig {
  name: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  lang: string;
  isAzure?: boolean;
  premium?: boolean;
  gender?: string;
}

export interface AzureConfig {
  subscriptionKey: string;
  region: string;
  pricingTier: 'standard' | 'premium';
}

export type VisionAnalysisResult = {
  description: string;
  objects: string[];
  actions: string[];
  risks: {
    level: 'low' | 'medium' | 'high';
    description: string;
  }[];
}

export interface ImageCapture {
  dataUrl: string;
  timestamp: number;
}

export interface TtsConfig {
  voice: VoiceConfig;
  enabled: boolean;
  autoSpeak: boolean;
  azureEnabled?: boolean;
  azureConfig?: AzureConfig;
} 
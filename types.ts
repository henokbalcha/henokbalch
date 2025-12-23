
export enum OutfitType {
  CASUAL = 'Casual',
  BUSINESS = 'Business',
  NIGHT_OUT = 'Night Out'
}

export interface OutfitSuggestion {
  type: OutfitType;
  description: string;
  imagePrompt: string;
  pieces: string[];
}

export interface AnalysisResult {
  itemName: string;
  style: string;
  colors: string[];
  outfits: OutfitSuggestion[];
}

export interface StyledOutfit {
  type: OutfitType;
  description: string;
  imageUrl: string;
  originalPrompt: string;
}

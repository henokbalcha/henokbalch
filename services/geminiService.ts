
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { AnalysisResult, OutfitType } from "../types";

const API_KEY = process.env.API_KEY || "";

export const getGeminiClient = () => {
  return new GoogleGenAI({ apiKey: API_KEY });
};

export const analyzeItem = async (base64Image: string): Promise<AnalysisResult> => {
  const ai = getGeminiClient();
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: base64Image.split(',')[1] || base64Image,
            },
          },
          {
            text: "Analyze this clothing item. Identify its type, style, and color palette. Then, suggest 3 distinct outfits: Casual, Business, and Night Out. For each outfit, provide a list of complementary pieces and a detailed visual prompt for a 'flat-lay' photography style image that includes the original item and the suggested pieces on a clean, neutral background.",
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          itemName: { type: Type.STRING },
          style: { type: Type.STRING },
          colors: { type: Type.ARRAY, items: { type: Type.STRING } },
          outfits: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, enum: Object.values(OutfitType) },
                description: { type: Type.STRING },
                imagePrompt: { type: Type.STRING },
                pieces: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["type", "description", "imagePrompt", "pieces"],
            },
          },
        },
        required: ["itemName", "style", "colors", "outfits"],
      },
    },
  });

  const result = JSON.parse(response.text || "{}");
  return result as AnalysisResult;
};

export const generateOutfitImage = async (base64Reference: string, prompt: string): Promise<string> => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/png',
            data: base64Reference.split(',')[1] || base64Reference,
          },
        },
        {
          text: `Create a professional flat-lay fashion photography image. The image should feature the item in the reference photo styled with other clothing and accessories according to this description: ${prompt}. The layout should be clean, high-end, and minimalist on a soft neutral background.`,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  
  throw new Error("Failed to generate image");
};

export const editOutfitImage = async (base64Image: string, editPrompt: string): Promise<string> => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/png',
            data: base64Image.split(',')[1] || base64Image,
          },
        },
        {
          text: `Modify this fashion flat-lay image based on the following instruction: ${editPrompt}. Maintain the same clothing items but apply the requested visual changes or style filters.`,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  
  throw new Error("Failed to edit image");
};

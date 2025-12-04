import { GoogleGenAI } from "@google/genai";
import { GeneratedResult, FigureConfig, generatePrompt } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Converts a base64 string to a raw data string (removes the prefix).
 */
const cleanBase64 = (base64: string) => {
  return base64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
};

export const generateFigureImage = async (
  base64Image: string,
  mimeType: string,
  config: FigureConfig
): Promise<GeneratedResult> => {
  try {
    const prompt = generatePrompt(config);
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64(base64Image),
            },
          },
          {
            text: prompt,
          },
        ],
      },
      // Note: responseMimeType and responseSchema are not supported for nano banana series models.
    });

    let imageUrl: string | null = null;
    let text: string | null = null;

    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString: string = part.inlineData.data;
          // Determine mime type from response if available, default to png
          const responseMime = part.inlineData.mimeType || 'image/png';
          imageUrl = `data:${responseMime};base64,${base64EncodeString}`;
        } else if (part.text) {
          text = part.text;
        }
      }
    }

    return { imageUrl, text };
  } catch (error) {
    console.error("Error generating figure:", error);
    throw error;
  }
};
import { GoogleGenAI, Type } from "@google/genai";
import { PlantInfo, DiagnosisResult, SearchResult } from "../types";

// Initialize the client with the environment variable
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = "gemini-2.5-flash";

/**
 * Identifies a plant from a base64 image string.
 */
export const identifyPlant = async (base64Image: string): Promise<PlantInfo> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
          {
            text: "Identify this plant. Provide the common name, scientific name, a brief description, detailed care instructions (water, light, soil, temperature), and a fun fact.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            scientificName: { type: Type.STRING },
            description: { type: Type.STRING },
            care: {
              type: Type.OBJECT,
              properties: {
                water: { type: Type.STRING },
                light: { type: Type.STRING },
                soil: { type: Type.STRING },
                temperature: { type: Type.STRING },
              },
              required: ["water", "light", "soil", "temperature"],
            },
            funFact: { type: Type.STRING },
          },
          required: ["name", "scientificName", "description", "care", "funFact"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as PlantInfo;
    }
    throw new Error("No response text received from Gemini.");
  } catch (error) {
    console.error("Error identifying plant:", error);
    throw error;
  }
};

/**
 * Diagnoses plant health issues from a base64 image string.
 * @param base64Image The image of the plant.
 * @param zipCode Optional zip code for location-specific context.
 */
export const diagnosePlant = async (base64Image: string, zipCode?: string): Promise<DiagnosisResult> => {
  try {
    let prompt = "Analyze this plant for any signs of disease, pests, or nutrient deficiencies. Determine its health status.";
    
    if (zipCode) {
      prompt += ` The plant is located in zip code ${zipCode}. Take into account the local climate, season, and common regional pests or diseases for this area when forming your diagnosis and advice.`;
    }

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            healthStatus: { 
              type: Type.STRING, 
              enum: ["Healthy", "Sick", "Unknown"] 
            },
            diagnosis: { type: Type.STRING },
            symptoms: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            treatment: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            prevention: { type: Type.STRING },
          },
          required: ["healthStatus", "diagnosis", "symptoms", "treatment", "prevention"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as DiagnosisResult;
    }
    throw new Error("No response text received from Gemini.");
  } catch (error) {
    console.error("Error diagnosing plant:", error);
    throw error;
  }
};

/**
 * Searches for products to treat a specific diagnosis using Google Search.
 */
export const searchProducts = async (query: string): Promise<SearchResult> => {
  try {
    const prompt = `Find 3 top-rated commercial products available online to treat "${query}" in plants. 
    Use Google Search to find real products with prices.
    
    Return a strictly formatted JSON object with a single key "products" containing an array of items. 
    Each item must have:
    - "name": Exact product name
    - "price": Price with currency symbol (e.g. "$15.99") or empty string if not found.
    - "description": 1 sentence on why it works
    - "imageUrl": A direct URL to the product image if you can find one in the search snippets (otherwise leave empty string).
    - "productUrl": A URL to purchase the product (use the search result link)
    
    Do not use markdown formatting in the output. Just raw JSON.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    let products = [];
    try {
      // Attempt to parse JSON from text, handling potential markdown wrappers
      const cleanText = response.text?.replace(/```json|```/g, '').trim() || "{}";
      const parsed = JSON.parse(cleanText);
      products = parsed.products || [];
    } catch (e) {
      console.warn("Could not parse product JSON, falling back to text display", e);
    }

    return {
      products: products,
      rawText: response.text,
      groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.error("Error searching products:", error);
    throw error;
  }
};

/**
 * Chat with the botanical AI assistant.
 */
export const chatWithBotanist = async (message: string, history: {role: string, parts: {text: string}[]}[] = []) => {
  try {
    const chat = ai.chats.create({
      model: MODEL_NAME,
      history: history,
      config: {
        tools: [{ googleSearch: {} }], // Enable search for up-to-date info and images
        systemInstruction: "You are Greenthumb, an expert AI botanist. When users ask about specific plants, pests, or products, use Google Search to provide accurate, real-time information. If you find relevant images in the search results, include them in your response using Markdown image syntax: ![Description](Image URL). Keep answers helpful and concise.",
      }
    });

    const result = await chat.sendMessage({ message });
    
    return {
      text: result.text,
      groundingMetadata: result.candidates?.[0]?.groundingMetadata
    };
  } catch (error) {
    console.error("Error in chat:", error);
    throw error;
  }
};
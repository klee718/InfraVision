import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, BudgetItem, SpatialAnalysisResult } from "../types";
import { INITIAL_SYSTEM_INSTRUCTION } from "../constants";

// Initialize Gemini
// NOTE: API Key is accessed via process.env.API_KEY as per strict guidelines.
const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing from environment variables.");
    throw new Error("API Key missing");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Uses Gemini Vision to analyze the infrastructure issue.
 * DOES NOT handle geocoding (separated to allow use of Google Maps tool in a different call).
 */
export const analyzeInfrastructureMedia = async (
  base64Images: string[]
): Promise<AnalysisResult> => {
  const ai = getAIClient();

  const parts = base64Images.map(img => ({
    inlineData: {
      mimeType: "image/jpeg",
      data: img
    }
  }));

  const prompt = `
    Analyze these images/frames. 

    Tasks:
    1. Identify the infrastructure issue (Flooding, Pothole, Trash, etc.).
    2. Rate severity 1-10.
    3. Estimate water depth if applicable (e.g., "6 inches", "2 feet"). If not applicable, use "N/A".
    4. Provide a short 1-sentence description.
    5. Estimate the cost to repair/fix this specific issue (e.g. "$5,000", "$1.2M"). Be realistic based on NYC infrastructure costs.
    6. Identify the responsible NYC Department (e.g., "Transportation", "Sanitation", "Environmental", "Parks", "Education").
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [...parts, { text: prompt }]
      },
      config: {
        systemInstruction: INITIAL_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING },
            severity: { type: Type.INTEGER },
            waterDepth: { type: Type.STRING },
            description: { type: Type.STRING },
            repairCost: { type: Type.STRING },
            department: { type: Type.STRING },
          },
          required: ["type", "severity", "waterDepth", "description", "repairCost", "department"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    throw error;
  }
};

/**
 * Uses Gemini with Google Maps Grounding to find precise coordinates for an address.
 */
export const geocodeAddress = async (
  address: string
): Promise<{ latitude: number; longitude: number; googleMapsUrl?: string }> => {
  const ai = getAIClient();

  // If no address is provided, return default coordinates for District 30 (approximate center)
  if (!address || address.trim() === "") {
    return { latitude: 40.715, longitude: -73.880 };
  }

  const prompt = `
    Find the precise latitude and longitude coordinates for this address in New York City: "${address}".
    
    CRITICAL OUTPUT FORMAT:
    You must output the coordinates strictly in this format:
    LAT: <latitude_number>, LNG: <longitude_number>

    Example:
    LAT: 40.7128, LNG: -74.0060
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        // Enable Google Maps Grounding
        tools: [{ googleMaps: {} }],
        // responseMimeType cannot be used with tools
      }
    });

    const text = response.text || "";
    
    // Parse the coordinates using regex
    const latMatch = text.match(/LAT:\s*(-?\d+(\.\d+)?)/i);
    const lngMatch = text.match(/LNG:\s*(-?\d+(\.\d+)?)/i);

    // Extract Google Maps URI from grounding chunks
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    let googleMapsUrl: string | undefined;
    
    if (chunks) {
        // Look for the first chunk that has a map URI
        for (const chunk of chunks) {
            if (chunk.web?.uri && chunk.web.uri.includes('google.com/maps')) {
                googleMapsUrl = chunk.web.uri;
                break;
            }
        }
    }

    if (latMatch && lngMatch) {
      return {
        latitude: parseFloat(latMatch[1]),
        longitude: parseFloat(lngMatch[1]),
        googleMapsUrl
      };
    } else {
      console.warn("Could not parse coordinates from Gemini response:", text);
      // Fallback to District 30 center if parsing fails
      return { latitude: 40.715, longitude: -73.880 };
    }

  } catch (error) {
    console.error("Gemini Geocoding Error:", error);
    // Fallback on error
    return { latitude: 40.715, longitude: -73.880 };
  }
};

export const analyzeBudgetQuery = async (
  data: BudgetItem[],
  query: string
): Promise<string> => {
  const ai = getAIClient();

  const dataContext = JSON.stringify(data);
  const prompt = `
    Here is the budget data for NYC District 30 in JSON format:
    ${dataContext}

    User Question: ${query}

    Answer the question based strictly on the data provided. 
    Format the answer in Markdown. 
    Highlight key figures. 
    If the user asks for visualization suggestions, mention them in text.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a helpful data analyst for the City Council.",
      }
    });

    return response.text || "Could not generate an answer.";
  } catch (error) {
    console.error("Gemini Budget Error:", error);
    return "Error analyzing budget data.";
  }
};

/**
 * Uses Gemini 3 Pro to perform spatial reasoning on a satellite image.
 * Identifies "Transportation Deserts".
 */
export const analyzeSpatialImage = async (
  base64Image: string
): Promise<SpatialAnalysisResult> => {
  const ai = getAIClient();

  const prompt = `
    Analyze this satellite image of a neighborhood.
    
    Your goal is to identify "Transportation Deserts". 
    Look for areas that have:
    1. High residential density (apartment complexes, closely packed houses).
    2. NO visible public transportation infrastructure (no bus stops, no subway stations, no train tracks).
    
    Return a JSON object containing:
    1. A 'summary' string explaining the findings.
    2. A 'boxes' array where you "point" to these specific desert areas using bounding boxes.
    
    Each box should have:
    - 'ymin', 'xmin', 'ymax', 'xmax' (Normalized coordinates 0-1).
    - 'label' (e.g. "High Density Residential").
    - 'reasoning' (e.g. "Multi-story apartments visible but nearest major road lacks bus shelters").
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", // Using Gemini 3 Pro for advanced spatial reasoning
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            boxes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  ymin: { type: Type.NUMBER },
                  xmin: { type: Type.NUMBER },
                  ymax: { type: Type.NUMBER },
                  xmax: { type: Type.NUMBER },
                  label: { type: Type.STRING },
                  reasoning: { type: Type.STRING }
                },
                required: ["ymin", "xmin", "ymax", "xmax", "label", "reasoning"]
              }
            }
          },
          required: ["summary", "boxes"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const result = JSON.parse(text);
    
    return {
      imageBase64: base64Image,
      summary: result.summary,
      boxes: result.boxes
    };
  } catch (error) {
    console.error("Gemini Spatial Analysis Error:", error);
    throw error;
  }
};
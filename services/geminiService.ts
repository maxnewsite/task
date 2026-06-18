import { GoogleGenAI, Type } from "@google/genai";

const MODEL_NAME = 'gemini-2.5-flash';

export interface GeneratedSubtasks {
  subtasks: string[];
}

// Helper to get the AI client only when needed
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("TaskFlow Config Error: API_KEY is missing. Ensure it is set in your environment variables.");
    throw new Error("API Key is missing. Please check your environment configuration.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateSubtasks = async (taskTitle: string, taskDescription: string): Promise<string[]> => {
  try {
    const ai = getAiClient();
    const prompt = `I have a task titled "${taskTitle}". 
    Description: "${taskDescription || 'No description provided'}".
    
    Please break this task down into 3-5 concrete, actionable subtasks for a checklist. 
    Return only the subtasks as a list of strings.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subtasks: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    // Sometimes the model returns markdown code blocks even with JSON mode. Strip them.
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const result = JSON.parse(cleanText) as GeneratedSubtasks;
    return result.subtasks || [];
  } catch (error) {
    console.error("Gemini API Error (Subtasks):", error);
    // Return empty array instead of throwing to keep UI stable
    return [];
  }
};

export const generateBetterDescription = async (taskTitle: string, currentDescription: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const prompt = `Rewrite and expand the following task description to be more professional, clear, and actionable.
    Task Title: "${taskTitle}"
    Current Description: "${currentDescription}"
    
    Keep it concise (under 50 words).`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || currentDescription;
  } catch (error) {
    console.error("Gemini API Error (Description):", error);
    return currentDescription;
  }
};
import OpenAI from 'openai';
import type { VisionAnalysisResult } from '../types';

let openaiInstance: OpenAI | null = null;

const initOpenAI = (apiKey: string): OpenAI => {
  if (!openaiInstance) {
    openaiInstance = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true, // Note: In a production app, you should use a backend service
    });
  }
  return openaiInstance;
};

export const analyzeImage = async (
  apiKey: string, 
  imageBase64: string,
  prompt?: string
): Promise<VisionAnalysisResult> => {
  try {
    const openai = initOpenAI(apiKey);

    const defaultPrompt = `
        You are a high-precision security-analysis engine examining a single surveillance snapshot.
        Your job is to:
        1. Describe the overall scene in one or two concise sentences.
        2. Enumerate all detected objects (e.g. "backpack", "cellphone", "handgun").
        3. Enumerate all detected people, giving each:
            • a unique id (e.g. "person_1"),
            • a brief description (clothing, posture),
            • a bounding_box with { x, y, width, height } pixel coordinates.
        4. Enumerate all observed actions (e.g. "reaching into pocket", "tailgating").
        5. Identify any unusual or suspicious behaviors (e.g. loitering, forced entry).
        6. For each security risk, assign:
            • level: one of ["low","medium","high"]
            • description: a brief justification (visible cues).
        Be factual, avoid speculation beyond what’s visible, and do not invent details.

        Respond **only** with valid JSON matching this schema:
        {
            description: string;
            objects: string[];
            actions: string[];
            risks: {
                level: 'low' | 'medium' | 'high';
                description: string;
            }[];
        }


        `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt || defaultPrompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: "high",
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content || '';
    
    try {
      const result = JSON.parse(content) as VisionAnalysisResult;
      return result;
    } catch (e) {
      console.error('Failed to parse OpenAI response as JSON:', e);
      return {
        description: content || 'Failed to analyze image',
        objects: [],
        actions: [],
        risks: [],
      };
    }
  } catch (error) {
    console.error('Error analyzing image with OpenAI:', error);
    throw error;
  }
}; 
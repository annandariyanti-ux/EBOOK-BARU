import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface EbookOutline {
  title: string;
  chapters: {
    title: string;
    description: string;
  }[];
}

export async function generateOutline(topic: string, tone: string, author: string, targetPages: number): Promise<EbookOutline> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Generate a detailed eBook outline in Indonesian for a book titled about "${topic}". 
    Target length is ${targetPages} pages. 
    Tone: ${tone}. 
    Author: ${author}.
    Provide a catchy title and a list of chapters with brief descriptions of what each chapter will cover.
    The outline should be professional and structured for a sellable eBook.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          chapters: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING }
              },
              required: ["title", "description"]
            }
          }
        },
        required: ["title", "chapters"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function generateChapterContent(
  bookTitle: string, 
  chapterTitle: string, 
  chapterDescription: string, 
  tone: string, 
  author: string,
  outline: EbookOutline
): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Write the content for a chapter titled "${chapterTitle}" for the eBook "${bookTitle}" by ${author}.
    Chapter Description: ${chapterDescription}.
    Full Outline Context: ${JSON.stringify(outline.chapters.map(c => c.title))}
    
    Tone: ${tone}.
    Language: Indonesian (Bahasa Indonesia).
    Format: Markdown (use headings, bullet points, and bold text for readability).
    Length: Make it detailed and comprehensive (aim for 1000-1500 words if possible).
    Ensure the content is original, practical, and highly valuable for the reader.`,
  });

  return response.text;
}

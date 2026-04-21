import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();
const genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const handleAIRequest = async ({ code, action, prompt }) => {
  try {
    const model = genAi.getGenerativeModel({ model: "gemini-3-flash-preview" });

    let finalPrompt = "";

    if (action === "explain") {
      finalPrompt = `Explain the following code in simple terms:\n\n${code}`;
    } else if (action === "fix") {
      finalPrompt = `Fix the following code. Return only corrected code:\n\n${code}`;
    } else if (action === "generate") {
      finalPrompt = `Write code for the following requirement:\n\n${prompt}`;
    } else {
      finalPrompt = prompt || code;
    }

    // call gemini
    const result = await model.generateContent(finalPrompt);
    const response = result.response;
    const text = response.text();

    let type = "text";

    if (action === "fix" || action === "generate") {
      type = "code";
    }

    return {
      result: text,
      type,
    };
  } catch (error) {
    console.error("AI Service Error:", error);
    throw new Error("AI processing failed");
  }
};

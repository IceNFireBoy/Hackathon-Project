const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async function (event, context) {
  // 1. Setup CORS headers so your Chrome Extension can talk to this backend
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // Handle browser pre-flight checks
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  // Enforce POST requests only
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: "Method Not Allowed" };
  }

  try {
    const payload = JSON.parse(event.body);
    
    // Clean and trim the environment variable to ensure no hidden whitespace characters
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim(); 

    if (!GEMINI_API_KEY) {
      throw new Error("Missing Gemini API Key in environment variables.");
    }

    // 2. Initialize the official Google Gen AI SDK
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    // 3. Configure the model with system instructions and strict JSON enforcement
    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
      systemInstruction: `You are an expert electronics and hardware engineering assistant. 
      Your task is to analyze the provided text data or images and extract a list of physical electronic components, tools, or hardware parts required for the build. 
      
      CRITICAL CONTEXTUAL RULE: You must evaluate the context of how a part is mentioned. If the text explicitly states NOT to use a component, or mentions it as a rejected alternative (e.g., "do not use an Arduino", "instead of a Raspberry Pi"), you MUST OMIT IT entirely from your output.
      
      You must output ONLY a valid JSON array matching the schema below. Do not wrap the output in markdown text (like \`\`\`json).
      
      Required JSON Schema Format:
      [
        {
          "name": "Component Name (e.g., Arduino Uno R3, 10k Resistor)",
          "confidence_score": 0.95 
        }
      ]`,
      generationConfig: {
        responseMimeType: "application/json", // Forces the model to speak native JSON
        temperature: 0.1 // Kept low for highly factual, non-creative extraction
      }
    });

    let geminiParts = [];

    // 4. Parse incoming payload data from the extension
    if (payload.sourceType === "article") {
      // For text articles or web descriptions
      geminiParts.push(payload.data); 
    } else if (payload.sourceType === "video_frames") {
      // For processing canvas-captured image arrays from YouTube
      payload.data.forEach((base64String) => {
        const base64Data = base64String.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
        geminiParts.push({
          inlineData: { 
            mimeType: "image/jpeg", 
            data: base64Data 
          }
        });
      });
      geminiParts.push("Analyze these video frames and extract the electronic components being used.");
    } else {
      throw new Error("Invalid sourceType provided. Must be 'article' or 'video_frames'.");
    }

    // 5. Query the model
    const result = await model.generateContent(geminiParts);
    const responseText = result.response.text();

    // 6. Return the structured JSON array back to your React client UI
    return {
      statusCode: 200,
      headers,
      body: responseText,
    };

  } catch (error) {
    console.error("Function Error Details:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
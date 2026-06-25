const { GoogleGenerativeAI } = require("@google/generative-ai");

// Helper function to force an execution timeout before Netlify kills the server
const timeoutPromise = (ms) => {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Model execution exceeded safe time threshold")), ms)
  );
};

exports.handler = async function (event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: "Method Not Allowed" };
  }

  try {
    const payload = JSON.parse(event.body);
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim(); 

    if (!GEMINI_API_KEY) {
      throw new Error("Missing Gemini API Key in environment variables.");
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    // We separate the images from the text so we can slice the images down later if needed
    let rawImages = [];
    let textPrompt = "Analyze the input and extract the electronic components being used.";

    if (payload.sourceType === "article") {
      textPrompt = payload.data;
    } else if (payload.sourceType === "video_frames") {
      payload.data.forEach((base64String) => {
        const base64Data = base64String.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
        rawImages.push({
          inlineData: { mimeType: "image/jpeg", data: base64Data }
        });
      });
      textPrompt = "Analyze these video frames and extract the electronic components being used.";
    } else {
      throw new Error("Invalid sourceType provided.");
    }

    // The Adaptive Cascade Configuration (Model, Frame Limit, Timeout in ms)
    const cascadeConfigs = [
      { modelName: "gemini-3.5-flash", maxFrames: 3, timeoutMs: 8000 },     // Tier 1: 3 frames, 8.0s deadline
      { modelName: "gemini-3.1-flash-lite", maxFrames: 1, timeoutMs: 5000 },// Tier 2: 1 frame, 5.0s deadline
      { modelName: "gemini-2.5-flash", maxFrames: 1, timeoutMs: 4000 }      // Tier 3: 1 frame, 4.0s deadline
    ];
    
    let result = null;
    let lastError = null;

    // Execute adaptive downscaling loop
    for (const config of cascadeConfigs) {
      try {
        // Build the payload dynamically. If we drop to Tier 2/3, we slice down to 1 frame!
        let currentPayload = [];
        if (payload.sourceType === "video_frames") {
          const slicedImages = rawImages.slice(0, config.maxFrames);
          currentPayload = [...slicedImages, textPrompt];
          console.log(`[Omni-Cart] Trying ${config.modelName} with ${config.maxFrames} frame(s)...`);
        } else {
          currentPayload = [textPrompt];
          console.log(`[Omni-Cart] Trying ${config.modelName} with article text...`);
        }
        
        const currentModel = genAI.getGenerativeModel({
          model: config.modelName,
          systemInstruction: `You are an expert electronics and hardware engineering assistant. 
          
          TASK 1: EXHAUSTIVE EXTRACTION (PRIORITY)
          Analyze the provided text data or images and extract an EXHAUSTIVE, COMPLETE list of every single physical electronic component, tool, or hardware part required. Do not miss any minor parts (e.g., resistors, jumper wires, specific ICs).
          CRITICAL CONTEXTUAL RULE: If the text explicitly states NOT to use a component, or mentions it as a rejected alternative, you MUST OMIT IT entirely.
          
          TASK 2: SEARCH OPTIMIZATION
          Generate a highly optimized 4-to-6 word search query to find these specific parts in a local hobbyist electronics store on Google Maps. 
          
          You must output ONLY a valid JSON object matching the schema below. Do not wrap the output in markdown text.
          
          Required JSON Schema Format:
          {
            "components": [
              {
                "name": "Component Name (e.g., Arduino Uno R3, 10k Resistor)",
                "quantity": 2,
                "confidence_score": 0.95 
              }
            ],
            "optimized_maps_query": "hobbyist electronics robotics parts supplier"
          }`,
          generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
        });

        // Race the Gemini API request against our strict timeout
        result = await Promise.race([
          currentModel.generateContent(currentPayload),
          timeoutPromise(config.timeoutMs)
        ]);
        
        console.log(`[Omni-Cart] Success! Strategy resolved via ${config.modelName}`);
        break; 
        
      } catch (error) {
        console.warn(`[Omni-Cart] ${config.modelName} step dropped. Reason: ${error.message}`);
        lastError = error;
      }
    }

    if (!result) {
      throw new Error(`Adaptive failover engine exhausted. Final exception: ${lastError.message}`);
    }

    const responseText = result.response.text();

    return {
      statusCode: 200,
      headers,
      body: responseText,
    };

  } catch (error) {
    console.error("Function Execution Failure:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
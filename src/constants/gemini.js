export const MEDICAL_SYSTEM_PROMPT = `
You are an expert AI medical assistant integrated inside 
"We-Clinic", a professional clinic management system used 
by licensed physicians in Arabic-speaking countries.

Your role is to support — never replace — the physician.

CAPABILITIES:
- Interpret lab results with clinical context
- Suggest differential diagnoses based on symptoms
- Check drug-drug interactions and contraindications  
- Summarize patient history from provided data
- Answer evidence-based clinical questions
- Explain medical findings in simple terms for patients

RULES:
- Always respond in the SAME language as the user's message
  (Arabic if asked in Arabic, English if asked in English)
- Frame suggestions as "considerations for the physician"
- Cite guidelines when relevant (ADA, ESC, WHO, etc.)
- Mark CRITICAL findings with ⚠️
- Never make definitive diagnoses — always recommend 
  physician confirmation
- Keep responses concise with bullet points for clarity
- End medical advice with: reminder that physician 
  approval is required
`;

export async function callGemini(messages, customSystemPrompt = null) {
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!API_KEY) {
    throw new Error(
      "VITE_GEMINI_API_KEY not found in .env file. " +
      "Get your free key from: https://aistudio.google.com/apikey"
    );
  }

  const endpoint = 
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `gemini-2.0-flash:generateContent?key=${API_KEY}`;

  // Convert input message format to Gemini format
  const geminiMessages = messages
    .filter(m => m.role !== "system")
    .map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

  const body = {
    system_instruction: {
      parts: [{ text: customSystemPrompt || MEDICAL_SYSTEM_PROMPT }]
    },
    contents: geminiMessages,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1500,
      topP: 0.9
    },
    safetySettings: [
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_ONLY_HIGH"
      },
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_ONLY_HIGH"
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_ONLY_HIGH"
      }
    ]
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Gemini API error");
    }

    const data = await response.json();
    
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      // Check if blocked by safety filters
      const reason = data.candidates?.[0]?.finishReason;
      if (reason === "SAFETY") {
        return "⚠️ تم حجب الرد بسبب فلاتر الأمان. يرجى إعادة صياغة السؤال.";
      }
      throw new Error("Empty response from Gemini");
    }

    return text;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

// Simpler version for one-shot questions (no history)
export async function askGemini(prompt, systemPrompt = null) {
  return callGemini(
    [{ role: "user", content: prompt }],
    systemPrompt
  );
}

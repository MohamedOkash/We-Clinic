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

export async function callGemini(messages, systemPrompt = MEDICAL_SYSTEM_PROMPT) {
  // Try calling the backend proxy first to avoid exposing API keys in the frontend bundle
  try {
    const proxyEndpoint = '/api/gemini';
    const response = await fetch(proxyEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, systemPrompt })
    });

    if (response.ok) {
      const data = await response.json();
      return data.text || data.reply || 'Error';
    }
  } catch (proxyError) {
    console.warn('AI proxy server failed. Trying direct API call fallback...');
  }

  // Direct client-side fallback if backend proxy fails
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  if (!API_KEY) {
    throw new Error(
      "Gemini API Key is not configured on the backend proxy, and VITE_GEMINI_API_KEY was not found in the frontend environment variables."
    );
  }

  const callDirect = async (modelName) => {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: messages.map(m => ({
          role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
          parts: [{ text: m.content || m.text || '' }]
        })),
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1500,
        }
      })
    });
    return { status: response.status, data: await response.json().catch(() => ({})) };
  };

  let directResult = await callDirect('gemini-2.0-flash');
  const isDirectQuotaExceeded = directResult.status === 429 || 
    (directResult.data.error?.message?.includes('Quota exceeded') || false) ||
    (directResult.data.error?.message?.includes('quota') || false) ||
    (directResult.data.error?.message?.includes('limit') || false);

  if (isDirectQuotaExceeded) {
    console.warn('Gemini 2.0 Flash direct quota exceeded. Trying Gemini 1.5 Flash...');
    directResult = await callDirect('gemini-1.5-flash');
  }

  if (directResult.status !== 200) {
    const errorMsg = directResult.data.error?.message || `Google API status ${directResult.status}`;
    if (directResult.status === 429 || errorMsg.includes('Quota exceeded') || errorMsg.includes('quota') || errorMsg.includes('limit')) {
      return "⚠️ لقد تم تجاوز الحد الأقصى للاستخدام المجاني للذكاء الاصطناعي حالياً. يرجى الانتظار دقيقة وإعادة المحاولة.";
    }
    throw new Error(errorMsg);
  }

  const text = directResult.data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) {
    const reason = directResult.data.candidates?.[0]?.finishReason;
    if (reason === 'SAFETY') {
      return "⚠️ تم حجب الرد بسبب فلاتر الأمان. يرجى إعادة صياغة السؤال.";
    }
    throw new Error('Empty response from Gemini');
  }

  return text;
}

// Simpler version for one-shot questions (no history)
export async function askGemini(prompt, systemPrompt = MEDICAL_SYSTEM_PROMPT) {
  return callGemini(
    [{ role: 'user', content: prompt }],
    systemPrompt
  );
}

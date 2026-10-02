// Vercel Serverless Function: /api/prescription
// Takes a base64 image of a PRINTED or handwritten medicine strip/prescription
// and explains what's written on it, in the chosen language.
// Powered by Groq (free tier) using Qwen3.8-27B, a vision-capable model.

const GROQ_VISION_MODEL = 'qwen/qwen3.8-27b';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const LANGUAGE_INSTRUCTIONS = {
  hi: 'सरल, स्पष्ट हिंदी (देवनागरी लिपि) में जवाब दें।',
  hinglish: 'Respond in Hinglish - Hindi mixed with English, written in Roman/Latin script, the way people naturally text. Do NOT use Devanagari script.',
  en: 'Respond in simple, clear English.',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let imageBase64, mediaType, language;
  try {
    imageBase64 = req.body?.imageBase64;
    mediaType = req.body?.mediaType;
    language = req.body?.language || 'hi';
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }

  if (!['hi', 'hinglish', 'en'].includes(language)) language = 'hi';

  if (!imageBase64) {
    return res.status(400).json({ error: 'imageBase64 is required' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server is missing GROQ_API_KEY' });
  }

  const systemPrompt = `You explain what is written on a medicine strip or prescription photo. The photo may be printed or handwritten.

CRITICAL rules:
1. Only report information that is actually visible in the photo. Never guess a dosage or timing that isn't clearly legible.
2. A prescription often also has the PATIENT's name, age/sex, and the DOCTOR's name/signature written on it - these are NOT the medicine name. The medicine name is usually written next to words like "Tab", "Cap", "Syp", "Inj", or after an arrow/bullet listing drugs. Only put an actual drug name in "medicine_name" - if you cannot confidently identify a real drug name, leave "medicine_name" empty and explain what you see in "printed_instructions" instead.
3. If handwriting is unclear or illegible in places, explicitly say so and recommend confirming with a pharmacist or doctor - do not guess.
4. Only state a medicine's general purpose if its name is clearly identifiable, and always note this is general information, not medical advice.
5. Never suggest a new dosage or a different medicine.
6. Do NOT mention the patient's name, age, or doctor's name/signature in "printed_instructions" - only describe the medicines and dosage instructions. Skip any patient/doctor identity details entirely.
7. ${LANGUAGE_INSTRUCTIONS[language]}

Respond with ONLY this JSON format, no extra text, no markdown code fences:
{
  "readable": true or false,
  "medicine_name": "actual drug name(s) only, or empty string if unclear",
  "printed_instructions": "what is written on the label/prescription, described in the required language",
  "general_purpose": "general use info, or empty string if medicine name isn't clear",
  "caution_note": "any caution, e.g. about illegible handwriting, or empty string"
}`;

  try {
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    const dataUri = `data:${mediaType || 'image/jpeg'};base64,${imageBase64}`;
    let response, lastError;

    for (let attempt = 0; attempt < 3; attempt++) {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: GROQ_VISION_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Explain what is written on this medicine strip/prescription. Respond with JSON only.' },
                { type: 'image_url', image_url: { url: dataUri } },
              ],
            },
          ],
          temperature: 0.2,
          max_tokens: 500,
        }),
      });
      if (response.ok) break;
      lastError = await response.text();
      if (response.status !== 503 && response.status !== 429) break;
      await sleep(1500);
    }

    if (!response.ok) {
      return res.status(502).json({ error: 'Groq API error', detail: lastError });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    let parsed;
    try {
      const cleaned = text.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      const fallbackMsg = {
        hi: 'फोटो स्पष्ट नहीं है। कृपया बेहतर रोशनी में दोबारा फोटो लें।',
        hinglish: 'Photo clear nahi hai. Kripya achi roshni mein dobara photo lein.',
        en: 'The photo is not clear. Please retake it in better lighting.',
      };
      parsed = {
        readable: false,
        medicine_name: '',
        printed_instructions: '',
        general_purpose: '',
        caution_note: fallbackMsg[language],
      };
    }

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error', detail: String(err) });
  }
}
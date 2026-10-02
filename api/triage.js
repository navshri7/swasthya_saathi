// Vercel Serverless Function: /api/triage
// Takes free-text symptom description (Hindi/Hinglish/English), maps it against
// a fixed red-flag rules file, and returns a triage level + explanation.
// Powered by Groq (free tier, OpenAI-compatible API).

const redflags = {
  emergency: [
    "सीने में दर्द या दबाव",
    "सांस लेने में गंभीर तकलीफ",
    "बेहोशी या होश खोना",
    "तेज़ या अनियंत्रित रक्तस्राव",
    "शरीर के एक तरफ अचानक कमजोरी या सुन्नपन",
    "बोलने में अचानक दिक्कत",
    "गंभीर सिर की चोट",
    "आत्महत्या के विचार",
    "गंभीर एलर्जी प्रतिक्रिया (चेहरे/गले में सूजन)",
    "जहर खाना या ज़हरीली चीज़ निगलना",
    "बच्चे या वयस्क में तेज़ बुखार के साथ दौरे (फिट्स)",
    "पेट में अत्यधिक तेज़ दर्द"
  ],
  clinic_soon: [
    "3 दिन से अधिक तेज़ बुखार",
    "लगातार उल्टी या दस्त",
    "सांस लेने में हल्की तकलीफ",
    "शरीर पर असामान्य दाने या सूजन",
    "गर्भावस्था में असामान्य लक्षण",
    "पुराने घाव जो ठीक नहीं हो रहे",
    "पेशाब में जलन या खून",
    "लगातार खांसी (2 हफ्ते से अधिक)"
  ],
  self_care: [
    "हल्का सर्दी-जुकाम",
    "मामूली सिरदर्द",
    "हल्का गले में खराश",
    "थकान",
    "मामूली मांसपेशियों में दर्द"
  ],
  disclaimer: {
    hi: "यह चिकित्सा निदान नहीं है, केवल सामान्य मार्गदर्शन है। किसी भी आपातकालीन स्थिति में तुरंत 108 पर कॉल करें या नज़दीकी अस्पताल जाएं।",
    hinglish: "Yeh medical diagnosis nahi hai, sirf general guidance hai. Kisi bhi emergency mein turant 108 par call karein ya nazdeeki hospital jaayein.",
    en: "This is not a medical diagnosis, only general guidance. In any emergency, call 108 immediately or go to the nearest hospital.",
  },
  emergency_number: "108"
};

const GROQ_MODEL = 'openai/gpt-oss-120b';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const LANGUAGE_INSTRUCTIONS = {
  hi: 'जवाब सरल, स्पष्ट हिंदी (देवनागरी लिपि) में दें जो कम पढ़े-लिखे व्यक्ति भी समझ सकें।',
  hinglish: 'Respond in Hinglish - Hindi mixed with English, written in Roman/Latin script, the way people naturally text. Do NOT use Devanagari script.',
  en: 'Respond in simple, clear English that is easy for anyone to understand.',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let symptomText, language;
  try {
    symptomText = req.body?.symptomText;
    language = req.body?.language || 'hi';
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }

  if (!['hi', 'hinglish', 'en'].includes(language)) language = 'hi';

  if (!symptomText || typeof symptomText !== 'string' || !symptomText.trim()) {
    return res.status(400).json({ error: 'symptomText is required' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server is missing GROQ_API_KEY' });
  }

  const systemPrompt = `You are a health guidance assistant that performs ONLY triage, never diagnosis, and never suggesting medicine names or dosages.

Classify the user's symptoms (which may be written in Hindi, Hinglish, or English) into exactly one category, based on this fixed rules list:
- "emergency" - if symptoms match: ${JSON.stringify(redflags.emergency)}
- "clinic_soon" - if symptoms match: ${JSON.stringify(redflags.clinic_soon)}
- "self_care" - if symptoms match: ${JSON.stringify(redflags.self_care)}
- "need_more_info" - if symptoms are unclear and you should ask 1-2 clarifying questions

Rules:
1. If there is any doubt the symptoms could be serious, always choose the more cautious category.
2. Never suggest medicine names, dosages, or treatments.
3. Never state a definite diagnosis - only say what to do next.
4. ${LANGUAGE_INSTRUCTIONS[language]}

Respond with ONLY this JSON format, no extra text, no markdown code fences:
{
  "level": "emergency" or "clinic_soon" or "self_care" or "need_more_info",
  "explanation": "explanation in the required language",
  "next_step": "what to do next, in the required language",
  "clarifying_question": "question here if level is need_more_info, else empty string"
}`;

  try {
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    let response, lastError;

    for (let attempt = 0; attempt < 3; attempt++) {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: symptomText },
          ],
          response_format: { type: 'json_object' },
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
        hi: 'माफ़ करें, कृपया अपने लक्षण फिर से स्पष्ट रूप से बताएं।',
        hinglish: 'Maaf kijiye, kripya apne symptoms dobara clearly bataiye.',
        en: 'Sorry, please describe your symptoms again clearly.',
      };
      parsed = {
        level: 'need_more_info',
        explanation: fallbackMsg[language],
        next_step: '',
        clarifying_question: fallbackMsg[language],
      };
    }

    return res.status(200).json({
      ...parsed,
      disclaimer: redflags.disclaimer[language],
      emergency_number: redflags.emergency_number,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error', detail: String(err) });
  }
}
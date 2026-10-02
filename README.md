# स्वास्थ्य साथी (Swasthya Saathi)

**AI for Bharat: a voice-first health navigator in Hindi, Hinglish and English**

> Track 06: AI for Bharat in Indian Languages

**Live app:** https://swasthya-saathi-blush.vercel.app/

---

## Overview

Swasthya Saathi helps people who think and speak in Hindi get safe health guidance without needing to read English. It has two modes:

1. **लक्षण जांच (Symptom Triage)**: Describe symptoms by voice or text in Hindi, Hinglish or English. The app classifies them as 🔴 **Emergency**, 🟠 **Clinic soon**, 🟢 **Self-care**, or ⚪ **Need more info**, with a plain-language explanation and a clear next step. Emergency results include a one-tap call to **108**.
2. **दवा की जानकारी (Medicine / Prescription Explainer)**: Take a photo of a medicine strip or prescription. The app explains the medicine name, the written instructions and its general purpose in simple language. If handwriting is unclear it says so and asks the user to confirm with a pharmacist or doctor.

**It never diagnoses, never recommends medicines, and never invents dosages.**

## Why I built it

Most health apps are English-first, while millions of Indians communicate in Hindi or Hinglish, and many have limited literacy. People either panic over minor symptoms or ignore real warning signs, and medicine strips or prescriptions are hard to understand. Swasthya Saathi answers one question: *"What should I do next?"* It does this in the user's own language, by voice if they prefer.

## Key features

- **Voice input** in Hindi / Hinglish / English (Web Speech API)
- **Spoken read-back** of results for low-literacy users (text-to-speech)
- **Language toggle**: हिंदी / Hinglish / English
- **Four-level triage** with colour-coded results
- **One-tap 108** call on emergencies
- **Camera capture** for medicine strips and prescriptions
- **Privacy-aware**: patient and doctor names on prescriptions are intentionally not repeated
- **Access to past consultation**: can refer to older suggestions

## Safety-first design

- **Rules anchor the AI.** Triage severity is tied to a fixed red-flag list (12 emergency, 8 clinic-soon and 5 self-care symptoms, written in Hindi). The model handles language understanding and explanation, and the rules provide the guardrail.
- **Cautious by default.** If there is any doubt that a symptom could be serious, the model is instructed to choose the more cautious category.
- **No diagnosis, no medicine advice.** The system prompts forbid diagnoses, treatment suggestions, medicine names for treatment and dosages.
- **Fails safely.** Vague input leads to a clarifying question. An unreadable photo leads to a "retake the photo" message. Malformed model output falls back to a safe default message.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, plain CSS |
| Voice | Browser Web Speech API (speech recognition + speech synthesis) |
| Backend | Vercel Serverless Functions (Node.js) |
| AI: triage | [Groq](https://groq.com) API, `openai/gpt-oss-120b` (JSON mode) |
| AI: vision | Groq API, `qwen/qwen3.8-27b` (image to explanation) |
| Safety layer | Fixed red-flag rules (Hindi) |
| Hosting | Vercel |

## Architecture

```
User (voice / text / photo)
        │
        ▼
React frontend  (Web Speech API for voice input)
        │  POST (JSON)
        ▼
Vercel Serverless Functions
   ├── /api/triage        → Groq (gpt-oss-120b) + red-flag rules in prompt
   └── /api/prescription  → Groq (qwen3.8-27b, vision)
        │
        ▼
Structured JSON → UI result card + spoken read-back
```

**Reliability measures**

- Up to 3 automatic retries on `429` / `503` responses from the AI provider
- JSON-mode output with a safe fallback if parsing fails
- Input validation on both endpoints (HTTP method, required fields, language whitelist)
- Clear error responses (e.g. missing API key), with no silent failures
- The API key lives only on the server and is never exposed to the browser

## Project structure

```
swasthya-saathi/
├── api/
│   ├── triage.js          
│   └── prescription.js    
├── data/
│   └── redflags.json      
├── src/
│   ├── App.jsx            
│   ├── App.css
│   └── main.jsx
├── index.html
├── vercel.json
├── vite.config.js
└── .env.example
```

> The red-flag rules used at runtime are defined in `api/triage.js`. `data/redflags.json` mirrors them for reference, so update both if you change the rules.

## API reference

### `POST /api/triage`

```json
// Request
{ "symptomText": "सीने में तेज़ दर्द हो रहा है", "language": "hi" }   // language: "hi" | "hinglish" | "en"

// Response
{
  "level": "emergency",              // emergency | clinic_soon | self_care | need_more_info
  "explanation": "...",
  "next_step": "...",
  "clarifying_question": "",
  "disclaimer": "...",
  "emergency_number": "108"
}
```

### `POST /api/prescription`

```json
// Request
{ "imageBase64": "<base64 without data: prefix>", "mediaType": "image/jpeg", "language": "hi" }

// Response
{
  "readable": true,
  "medicine_name": "",
  "printed_instructions": "...",
  "general_purpose": "",
  "caution_note": ""
}
```

## Setup instructions

### Prerequisites

- Node.js 18 or later (the deployed project is configured for Node 24.x)
- A free Groq API key from [console.groq.com/keys](https://console.groq.com/keys)
- For deployment: a free [Vercel](https://vercel.com) account

### 1. Clone and install

```bash
git clone [repo-url]
cd swasthya-saathi
npm install
```

### 2. Configure your API key

```bash
cp .env.example .env
# then edit .env and add your key:
# GROQ_API_KEY=your_groq_key_here
```

### 3. Run locally

The frontend and the serverless functions must run together, so use the Vercel CLI:

```bash
npm install -g vercel
vercel dev
```

The app is served at `http://localhost:3000` with `/api/triage` and `/api/prescription` working as they do in production.

> `npm run dev` starts the Vite frontend only. The UI loads, but API calls will fail without `vercel dev`.

### 4. Deploy to Vercel

```bash
vercel
```

Then go to **Project Settings → Environment Variables**, add `GROQ_API_KEY`, and **redeploy** so the functions can read it.

## Testing

Manual test cases used to check output quality:

| # | Input | Language | Expected level | Result |
|---|---|---|---|---|
| 1 | सीने में तेज़ दर्द हो रहा है और सांस लेने में दिक्कत है | Hindi | 🔴 Emergency | [fill in] |
| 2 | Achanak bolne mein dikkat ho rahi hai aur ek taraf kamzori hai | Hinglish | 🔴 Emergency | [fill in] |
| 3 | 3 din se tez bukhar hai | Hinglish | 🟠 Clinic soon | [fill in] |
| 4 | लगातार उल्टी और दस्त हो रहे हैं | Hindi | 🟠 Clinic soon | [fill in] |
| 5 | Halka sa sardi-zukam hai | Hinglish | 🟢 Self-care | [fill in] |
| 6 | I have a mild headache | English | 🟢 Self-care | [fill in] |
| 7 | मुझे अच्छा नहीं लग रहा | Hindi | ⚪ Need more info | [fill in] |
| 8 | Printed medicine strip photo | Any | Readable, name and instructions explained | [fill in] |
| 9 | Blurry / dark photo | Any | Unclear, retake-photo message | [fill in] |
| 10 | Empty input / missing API key | n/a | Clear 400 / 500 error, no crash | [fill in] |

## Browser support

Voice input uses the Web Speech API, which works best in **Chrome / Edge** on desktop and Android. On unsupported browsers the app shows a clear message and falls back to text input. Text-to-speech availability depends on the voices installed on the device.

## Limitations (by design)

- Triage is **navigation guidance, not a diagnosis**. It always defers to real medical care for anything serious.
- Handwritten prescriptions are read on a best-effort basis. Unclear text is flagged, not guessed.
- The red-flag list is a compact rule set and has not been clinically reviewed.
- Three languages are supported today (Hindi, Hinglish, English).

## Future scope

- Add more languages by translating the rules and prompts
- Clinician-reviewed red-flag rules
- Nearby clinic / hospital locator
- WhatsApp and low-bandwidth / offline-friendly modes

## AI tools disclosure

- **Groq API** (`openai/gpt-oss-120b` and `qwen/qwen3.8-27b`): runtime AI that powers symptom triage and prescription/label explanation. The proposal originally planned to use Google Gemini; I switched to Groq because of daily quota limits and traffic issues.
- **Claude (Anthropic)**: used to help design, scaffold and write application code, prompts and documentation.

## Disclaimer

Swasthya Saathi provides general guidance only. It is **not** a medical diagnosis or a substitute for professional medical advice. In an emergency, call **108** or go to the nearest hospital immediately.

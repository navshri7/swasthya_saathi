import React, { useState, useRef, useCallback, useEffect } from 'react';

const LEVEL_META = {
  emergency: { label: { hi: 'आपातकाल', hinglish: 'Emergency', en: 'Emergency' }, color: '#C1443D', bg: '#FBEAE9' },
  clinic_soon: { label: { hi: 'डॉक्टर से मिलें', hinglish: 'Doctor se milein', en: 'See a doctor' }, color: '#B4790A', bg: '#FBF1DF' },
  self_care: { label: { hi: 'घर पर देखभाल', hinglish: 'Ghar par care karein', en: 'Self-care at home' }, color: '#227A5B', bg: '#E7F4EE' },
  need_more_info: { label: { hi: 'और जानकारी चाहिए', hinglish: 'Thodi aur info chahiye', en: 'Need more info' }, color: '#0B6E6E', bg: '#E6F3F3' },
};

const UI = {
  hi: {
    appTitle: 'swasthya साथी',
    tagline: 'आपकी भाषा में, आपके स्वास्थ्य का साथी',
    disclaimerBanner: 'यह चिकित्सा निदान नहीं है। आपातकाल में तुरंत',
    disclaimerCall: 'पर कॉल करें।',
    tabTriage: 'लक्षण जांच',
    tabRx: 'दवा की जानकारी',
    symptomLabel: 'अपने लक्षण बताएं (बोलकर या लिखकर)',
    symptomPlaceholder: 'जैसे: मुझे दो दिन से बुखार और खांसी है',
    micIdle: '🎙️',
    micListening: '● सुन रहा हूँ',
    micUnsupported: 'इस ब्राउज़र में आवाज़ पहचान उपलब्ध नहीं है। कृपया टाइप करें।',
    exampleLabel: 'जल्दी चुनें',
    examples: ['बुखार', 'सिरदर्द', 'पेट दर्द'],
    checkButton: 'जांच करें',
    checking: 'जांच हो रही है…',
    recentChecks: 'हाल की जांच',
    noRecentChecks: 'आपकी हाल की जांच यहां दिखाई देंगी।',
    clearHistory: 'इतिहास साफ़ करें',
    nearbyHospital: 'नज़दीकी अस्पताल खोजें',
    genericError: 'कुछ गलत हुआ। कृपया फिर से कोशिश करें।',
    nextStepLabel: 'आगे क्या करें: ',
    callButtonPrefix: 'पर कॉल करें',
    rxLabel: 'दवा की पट्टी या पर्ची की फोटो लें',
    explainButton: 'समझाएं',
    reading: 'पढ़ा जा रहा है…',
    rxUnclear: 'यह स्पष्ट नहीं है। कृपया बेहतर रोशनी में साफ़ फोटो लें, या अपने फार्मासिस्ट से पूछें।',
    rxNameLabel: 'दवा का नाम: ',
    rxPrintedLabel: 'लेबल पर लिखा है: ',
    rxPurposeLabel: 'सामान्य उपयोग: ',
    rxDisclaimer: 'यह जानकारी केवल सामान्य मार्गदर्शन है। कृपया अपने डॉक्टर या फार्मासिस्ट से पुष्टि करें।',
    readable: 'पढ़ने योग्य',
    confirmReading: 'पढ़ने की पुष्टि करें',
    footer: 'निर्मित: AI for Bharat हैकाथॉन के लिए · Claude द्वारा संचालित',
  },
  hinglish: {
    appTitle: 'swasthya साथी',
    tagline: 'Aapki bhasha mein, aapke health ka saathi',
    disclaimerBanner: 'Yeh medical diagnosis nahi hai. Emergency mein turant',
    disclaimerCall: 'par call karein.',
    tabTriage: 'Symptom Check',
    tabRx: 'Dawai ki Jaankari',
    symptomLabel: 'Apne symptoms bataiye (bolkar ya likhkar)',
    symptomPlaceholder: 'Jaise: mujhe do din se fever aur khaansi hai',
    micIdle: '🎙️',
    micListening: '● Sun raha hoon',
    micUnsupported: 'Is browser mein voice recognition available nahi hai. Kripya type karein.',
    exampleLabel: 'Quick choose',
    examples: ['Bukhar', 'Sir dard', 'Pet dard'],
    checkButton: 'Check Karein',
    checking: 'Check ho raha hai…',
    recentChecks: 'Recent checks',
    noRecentChecks: 'Aapke recent checks yahan dikhenge.',
    clearHistory: 'History clear karein',
    nearbyHospital: 'Nearby hospital khojein',
    genericError: 'Kuch galat hua. Kripya phir se try karein.',
    nextStepLabel: 'Aage kya karein: ',
    callButtonPrefix: 'par call karein',
    rxLabel: 'Dawai ki strip ya prescription ki photo lein',
    explainButton: 'Samjhaiye',
    reading: 'Padha ja raha hai…',
    rxUnclear: 'Yeh clear nahi hai. Kripya better lighting mein saaf photo lein, ya apne pharmacist se poochein.',
    rxNameLabel: 'Dawai ka naam: ',
    rxPrintedLabel: 'Label par likha hai: ',
    rxPurposeLabel: 'General use: ',
    rxDisclaimer: 'Yeh jaankari sirf general guidance hai. Kripya apne doctor ya pharmacist se confirm karein.',
    readable: 'Padhne layak',
    confirmReading: 'Reading confirm karein',
    footer: 'Built for the AI for Bharat hackathon · Powered by Claude',
  },
  en: {
    appTitle: 'swasthya साथी',
    tagline: 'Your health companion, in your language',
    disclaimerBanner: 'This is not a medical diagnosis. In an emergency, call',
    disclaimerCall: 'immediately.',
    tabTriage: 'Symptom Check',
    tabRx: 'Medicine Info',
    symptomLabel: 'Describe your symptoms (speak or type)',
    symptomPlaceholder: 'e.g., I have had fever and cough for two days',
    micIdle: '🎙️',
    micListening: '● Listening',
    micUnsupported: 'Voice recognition is not available in this browser. Please type instead.',
    exampleLabel: 'Quick choose',
    examples: ['Fever', 'Headache', 'Stomach pain'],
    checkButton: 'Check',
    checking: 'Checking…',
    recentChecks: 'Recent checks',
    noRecentChecks: 'Your recent checks will appear here.',
    clearHistory: 'Clear history',
    nearbyHospital: 'Find nearby hospital',
    genericError: 'Something went wrong. Please try again.',
    nextStepLabel: 'Next step: ',
    callButtonPrefix: 'Call',
    rxLabel: 'Take a photo of a medicine strip or prescription',
    explainButton: 'Explain',
    reading: 'Reading…',
    rxUnclear: 'This is not clear. Please retake the photo in better light, or ask your pharmacist.',
    rxNameLabel: 'Medicine name: ',
    rxPrintedLabel: 'Printed on label: ',
    rxPurposeLabel: 'General use: ',
    rxDisclaimer: 'This information is general guidance only. Please confirm with your doctor or pharmacist.',
    readable: 'Readable',
    confirmReading: 'Needs confirmation',
    footer: 'Built for the AI for Bharat hackathon · Powered by Claude',
  },
};

const SPEECH_LANG = { hi: 'hi-IN', hinglish: 'hi-IN', en: 'en-IN' };
const HISTORY_KEY = 'swasthya-saathi:recent-checks';

function speak(text, language) {
  if (!('speechSynthesis' in window) || !text) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = SPEECH_LANG[language] || 'hi-IN';
  utter.rate = 0.95;
  window.speechSynthesis.speak(utter);
}

function readRecentChecks() {
  try {
    const saved = window.localStorage.getItem(HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveRecentCheck(symptomText, result) {
  try {
    const history = readRecentChecks();
    const next = [{ symptomText, level: result.level, createdAt: Date.now() }, ...history]
      .slice(0, 5);
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
  }
}

function LanguageToggle({ language, setLanguage }) {
  const options = [
    { key: 'hi', label: 'हिंदी' },
    { key: 'hinglish', label: 'Hinglish' },
    { key: 'en', label: 'English' },
  ];
  return (
    <div className="lang-toggle">
      {options.map((opt) => (
        <button
          key={opt.key}
          className={`lang-btn ${language === opt.key ? 'lang-btn--active' : ''}`}
          onClick={() => setLanguage(opt.key)}
          type="button"
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function TriagePanel({ language }) {
  const t = UI[language];
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [recentChecks, setRecentChecks] = useState([]);
  const recognitionRef = useRef(null);

  useEffect(() => {
    setRecentChecks(readRecentChecks());
  }, []);

  const toggleMic = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError(t.micUnsupported);
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = SPEECH_LANG[language] || 'hi-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setText((prev) => (prev ? prev + ' ' + transcript : transcript));
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [listening, language]);

  const submit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptomText: text, language }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error('Triage API error:', data);
        throw new Error(data.error || t.genericError);
      }
      setResult(data);
      saveRecentCheck(text.trim(), data);
      setRecentChecks(readRecentChecks());
      speak(`${LEVEL_META[data.level]?.label[language] || ''}. ${data.explanation} ${data.next_step}`, language);
    } catch (e) {
      console.error('Triage request failed:', e);
      setError(t.genericError);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    window.localStorage.removeItem(HISTORY_KEY);
    setRecentChecks([]);
  };

  return (
    <div className="panel">
      <label className="field-label" htmlFor="symptom-input">{t.symptomLabel}</label>
      <div className="input-row">
        <textarea
          id="symptom-input"
          className="text-input"
          rows={3}
          placeholder={t.symptomPlaceholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          type="button"
          className={`mic-btn ${listening ? 'mic-btn--active' : ''}`}
          onClick={toggleMic}
          aria-label="voice input"
        >
          {listening ? t.micListening : t.micIdle}
        </button>
      </div>
      <div className="examples-row">
        <span className="examples-label">{t.exampleLabel}</span>
        {t.examples.map((example) => (
          <button key={example} type="button" className="example-chip" onClick={() => setText(example)}>
            {example}
          </button>
        ))}
      </div>
      <button className="primary-btn" onClick={submit} disabled={loading || !text.trim()}>
        {loading ? <><span className="loading-spinner" aria-hidden="true" />{t.checking}</> : t.checkButton}
      </button>

      {error && <p className="error-text">{error}</p>}

      {result && (
        <div
          className="result-card"
          style={{ borderColor: LEVEL_META[result.level]?.color, background: LEVEL_META[result.level]?.bg }}
        >
          <div className="result-badge" style={{ background: LEVEL_META[result.level]?.color }}>
            {LEVEL_META[result.level]?.label[language] || ''}
          </div>
          <p className="result-text">{result.explanation}</p>
          {result.next_step && <p className="result-next"><strong>{t.nextStepLabel}</strong>{result.next_step}</p>}
          {result.level === 'need_more_info' && result.clarifying_question && (
            <p className="result-question">{result.clarifying_question}</p>
          )}
          {result.level === 'emergency' && (
            <div className="emergency-actions">
              <a className="emergency-call" href={`tel:${result.emergency_number}`}>
                📞 {t.callButtonPrefix} {result.emergency_number}
              </a>
              <a
                className="hospital-link"
                href="https://www.google.com/maps/search/?api=1&query=hospitals+near+me"
                target="_blank"
                rel="noreferrer"
              >
                📍 {t.nearbyHospital}
              </a>
            </div>
          )}
          <p className="disclaimer-inline">{result.disclaimer}</p>
        </div>
      )}

      <section className="history-section" aria-labelledby="recent-checks-heading">
        <div className="history-heading">
          <h2 id="recent-checks-heading">{t.recentChecks}</h2>
          {recentChecks.length > 0 && (
            <button type="button" className="clear-history" onClick={clearHistory}>{t.clearHistory}</button>
          )}
        </div>
        {recentChecks.length === 0 ? (
          <p className="history-empty">{t.noRecentChecks}</p>
        ) : (
          <div className="history-list">
            {recentChecks.map((check) => (
              <div className="history-item" key={`${check.createdAt}-${check.symptomText}`}>
                <span className="history-symptom">{check.symptomText}</span>
                <span className="history-meta">
                  <span className="history-level" style={{ color: LEVEL_META[check.level]?.color }}>
                    {LEVEL_META[check.level]?.label[language] || check.level}
                  </span>
                  <time dateTime={new Date(check.createdAt).toISOString()}>
                    {new Date(check.createdAt).toLocaleDateString(language === 'hi' ? 'hi-IN' : language === 'en' ? 'en-IN' : 'en-IN')}
                  </time>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function PrescriptionPanel({ language }) {
  const t = UI[language];
  const [preview, setPreview] = useState(null);
  const [base64, setBase64] = useState(null);
  const [mediaType, setMediaType] = useState('image/jpeg');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setPreview(dataUrl);
      setBase64(dataUrl.split(',')[1]);
    };
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!base64) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/prescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mediaType, language }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error('Prescription API error:', data);
        throw new Error(data.error || t.genericError);
      }
      setResult(data);

      if (data.readable) {
        const speakText = [
          data.medicine_name && `${t.rxNameLabel}${data.medicine_name}.`,
          data.printed_instructions,
          data.general_purpose,
        ].filter(Boolean).join(' ');
        speak(speakText, language);
      } else {
        speak(data.caution_note || t.rxUnclear, language);
      }
    } catch (e) {
      console.error('Prescription request failed:', e);
      setError(t.genericError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel">
      <label className="field-label" htmlFor="rx-input">{t.rxLabel}</label>
      <input
        id="rx-input"
        className="file-input"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onFile}
      />
      {preview && <img className="preview-img" src={preview} alt="uploaded" />}
      <button className="primary-btn" onClick={submit} disabled={loading || !base64}>
        {loading ? <><span className="loading-spinner" aria-hidden="true" />{t.reading}</> : t.explainButton}
      </button>

      {error && <p className="error-text">{error}</p>}

      {result && (
        <div className="result-card" style={{ borderColor: '#0B6E6E', background: '#E6F3F3' }}>
          <div className={`readability-badge ${result.readable ? 'readability-badge--good' : 'readability-badge--caution'}`}>
            {result.readable ? `✓ ${t.readable}` : `! ${t.confirmReading}`}
          </div>
          {!result.readable && <p className="result-text">{result.caution_note || t.rxUnclear}</p>}
          {result.readable && (
            <>
              {result.medicine_name && <p className="result-text"><strong>{t.rxNameLabel}</strong>{result.medicine_name}</p>}
              {result.printed_instructions && <p className="result-text"><strong>{t.rxPrintedLabel}</strong>{result.printed_instructions}</p>}
              {result.general_purpose && <p className="result-text"><strong>{t.rxPurposeLabel}</strong>{result.general_purpose}</p>}
              {result.caution_note && <p className="result-question">{result.caution_note}</p>}
            </>
          )}
          <p className="disclaimer-inline">{t.rxDisclaimer}</p>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState('triage');
  const [language, setLanguage] = useState('hi');
  const t = UI[language];

  return (
    <div className="app">
      <header className="app-header">
        <h1>{t.appTitle}</h1>
        <p className="tagline">{t.tagline}</p>
      </header>

      <LanguageToggle language={language} setLanguage={setLanguage} />

      <div className="disclaimer-banner">
        ⚠️ {t.disclaimerBanner} <a href="tel:108">108</a> {t.disclaimerCall}
      </div>

      <nav className="tabs" role="tablist">
        <button
          role="tab"
          aria-selected={tab === 'triage'}
          className={`tab-btn ${tab === 'triage' ? 'tab-btn--active' : ''}`}
          onClick={() => setTab('triage')}
        >
          {t.tabTriage}
        </button>
        <button
          role="tab"
          aria-selected={tab === 'prescription'}
          className={`tab-btn ${tab === 'prescription' ? 'tab-btn--active' : ''}`}
          onClick={() => setTab('prescription')}
        >
          {t.tabRx}
        </button>
      </nav>

      {tab === 'triage' ? <TriagePanel language={language} /> : <PrescriptionPanel language={language} />}

      <footer className="app-footer">
        <p>{t.footer}</p>
      </footer>
    </div>
  );
}
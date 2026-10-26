// Proxy ke Google Gemini API supaya API key hanya ada di server.
const FALLBACK_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-3-flash-preview',
];

const ALLOWED_MODELS = new Set(FALLBACK_MODELS);

function endpoint(model) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

// POST /api/gemini  body: { model?: string, body: <payload generateContent> }
async function generate(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ message: 'GEMINI_API_KEY belum diatur di server.' });
  }

  const { model, body } = req.body || {};
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ message: 'Field "body" wajib diisi.' });
  }

  const first = ALLOWED_MODELS.has(model) ? model : FALLBACK_MODELS[0];
  const candidates = [first, ...FALLBACK_MODELS.filter((m) => m !== first)];

  let lastStatus = 502;
  let lastMessage = 'Tidak ada respons dari Gemini API.';

  for (const candidate of candidates) {
    let response;
    try {
      response = await fetch(endpoint(candidate), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(25000),
      });
    } catch (error) {
      // Timeout/gangguan koneksi: coba model cadangan berikutnya.
      lastMessage = error.message;
      continue;
    }

    const text = await response.text();
    if (response.ok) {
      return res.status(200).type('application/json').send(text);
    }

    lastStatus = response.status;
    try {
      lastMessage = JSON.parse(text).error?.message || text;
    } catch (_) {
      lastMessage = text;
    }

    // Hanya lanjut ke model cadangan jika overload (503).
    if (response.status !== 503) break;
  }

  return res.status(lastStatus).json({ message: lastMessage });
}

module.exports = { generate };

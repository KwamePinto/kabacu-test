const axios = require('axios');

const BASE_URL = 'https://ourdatastore.com/api';

// ── Token cache ───────────────────────────────────────────
let cachedToken  = null;
let tokenTime    = null;

async function generateToken() {
  const username = process.env.OURDATASTORE_USERNAME;
  const password = process.env.OURDATASTORE_PASSWORD;

  const encodedAuth = Buffer.from(`${username}:${password}`).toString('base64');

  const response = await axios.post(`${BASE_URL}/user`, {}, {
    headers: { Authorization: `Basic ${encodedAuth}` }
  });

  if (response.data.status !== 'success') {
    throw new Error(response.data.message);
  }

  return response.data.AccessToken;
}

async function getToken() {
  const now = Date.now();
  if (cachedToken && (now - tokenTime < 50 * 60 * 1000)) return cachedToken;
  const token   = await generateToken();
  cachedToken   = token;
  tokenTime     = now;
  return token;
}

// ── Helpers ───────────────────────────────────────────────
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ── Sequential request queue ──────────────────────────────
// Processes one purchase at a time to avoid hitting the API
// rate-limit when many users buy simultaneously.
const queue       = [];
let isProcessing  = false;
let lastCallTime  = 0;
const MIN_GAP_MS  = 1200; // minimum ms between consecutive API calls

async function processQueue() {
  if (isProcessing || queue.length === 0) return;
  isProcessing = true;

  while (queue.length > 0) {
    const { resolve, reject, params } = queue.shift();

    // Enforce minimum gap between calls
    const gap = Date.now() - lastCallTime;
    if (gap < MIN_GAP_MS) await sleep(MIN_GAP_MS - gap);

    try {
      const result = await executeBuyData(params);
      lastCallTime = Date.now();
      resolve(result);
    } catch (err) {
      lastCallTime = Date.now();
      reject(err);
    }
  }

  isProcessing = false;
}

// ── Core API call with retry on rate-limit ────────────────
const MAX_RETRIES  = 4;
const BASE_DELAY   = 2000; // 2 s → 4 s → 6 s → 8 s

async function executeBuyData(params) {
  const { network, phone, data_plan } = params;
  const requestId = `DATA_${Date.now()}`;

  console.log('[DATA PURCHASE] ── Request ──────────────────────');
  console.log('[DATA PURCHASE] Phone     :', phone);
  console.log('[DATA PURCHASE] Network   :', network === 1 ? 'MTN (1)' : `Other (${network})`);
  console.log('[DATA PURCHASE] Plan ID   :', data_plan);
  console.log('[DATA PURCHASE] Request ID:', requestId);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const token = await getToken();
      console.log(`[DATA PURCHASE] Token acquired (attempt ${attempt}/${MAX_RETRIES})`);

      const payload = {
        network,
        phone,
        data_plan,
        bypass: false,
        'request-id': requestId,
      };

      const response = await axios.post(`${BASE_URL}/data`, payload, {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('[DATA PURCHASE] ── Response ─────────────────────');
      console.log('[DATA PURCHASE]', JSON.stringify(response.data, null, 2));
      console.log('[DATA PURCHASE] ─────────────────────────────────');
      return response.data;

    } catch (error) {
      const msg       = error.response?.data?.message || error.message || '';
      const isRateLimit = msg === 'Too Many Attempts.' || error.response?.status === 429;

      console.error('[DATA PURCHASE] ── Error ────────────────────────');
      console.error('[DATA PURCHASE] Status :', error.response?.status || 'N/A');
      console.error('[DATA PURCHASE] Message:', msg);
      if (error.response?.data) {
        console.error('[DATA PURCHASE] Body   :', JSON.stringify(error.response.data, null, 2));
      }
      console.error('[DATA PURCHASE] ─────────────────────────────────');

      if (isRateLimit && attempt < MAX_RETRIES) {
        const wait = BASE_DELAY * attempt;
        console.warn(`[DATA PURCHASE] Rate limited – retrying in ${wait}ms (attempt ${attempt}/${MAX_RETRIES})`);
        await sleep(wait);
        continue;
      }

      throw error;
    }
  }
}

// ── Public API ────────────────────────────────────────────
async function buyData({ network, phone, data_plan }) {
  return new Promise((resolve, reject) => {
    queue.push({ resolve, reject, params: { network, phone, data_plan } });
    processQueue();
  });
}

module.exports = { buyData };
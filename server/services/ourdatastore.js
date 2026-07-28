const axios   = require('axios');
const { wrapper }    = require('axios-cookiejar-support');
const { CookieJar }  = require('tough-cookie');
const logger  = require('../config/logger');

const BASE_URL = 'https://ourdatastore.com/api';

// Maps a network name to the ourdatastore API code.
// Queries the Networks collection first (authoritative), then falls back to
// string matching so legacy products without a DB entry still work.
// 1 = MTN  |  2 = Airtel  |  3 = GLO  |  4 = 9mobile
async function networkCode(networkName) {
  if (!networkName) return null;
  try {
    const Network = require('../models/NetworkModel');
    const net = await Network.findOne({ name: networkName, is_deleted: { $ne: 1 } });
    if (net) return net.apiCode;
  } catch (_) { /* DB unavailable — fall through to string matching */ }

  // Verified against ourdatastore API: 1=MTN, 2=Airtel, 3=GLO, 4=9mobile
  const n = (networkName || '').toUpperCase();
  if (n.includes('MTN') || n.includes('CTC')) return 1;
  if (n.includes('AIRTEL'))                    return 2;
  if (n.includes('GLO'))                       return 3;
  if (n.includes('9MOBILE') || n.includes('ETISALAT')) return 4;
  return null;
}

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

  logger.info(`[DATA PURCHASE] Request — phone: ${phone}, network: ${network === 1 ? 'MTN' : network}, plan: ${data_plan}, reqId: ${requestId}`);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const token = await getToken();
      logger.info(`[DATA PURCHASE] Token acquired (attempt ${attempt}/${MAX_RETRIES})`);

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

      logger.info(`[DATA PURCHASE] Response — ${JSON.stringify(response.data)}`);
      return { ...response.data, requestId };

    } catch (error) {
      const msg       = error.response?.data?.message || error.message || '';
      const isRateLimit = msg === 'Too Many Attempts.' || error.response?.status === 429;

      logger.error(`[DATA PURCHASE] Error — status: ${error.response?.status || 'N/A'}, message: ${msg}, body: ${JSON.stringify(error.response?.data || {})}`);

      if (isRateLimit && attempt < MAX_RETRIES) {
        const wait = BASE_DELAY * attempt;
        logger.warn(`[DATA PURCHASE] Rate limited – retrying in ${wait}ms (attempt ${attempt}/${MAX_RETRIES})`);
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

// Returns the first sentence of the API response for display to the user.
// The full message is always preserved in the logs.
function userMessage(apiResponse, fallback = 'Transaction failed. Your balance has been refunded.') {
  const raw = (apiResponse && (apiResponse.response || apiResponse.message)) || fallback;
  const dot = raw.indexOf('.');
  return (dot !== -1 ? raw.slice(0, dot + 1) : raw).trim();
}

// ── Session-based auth (for history/dashboard API) ───────
const SESSION_TTL_MS = 90 * 60 * 1000; // refresh every 90 min (cookie expires at 120)
let sessionCookies = null;
let sessionTime    = null;

async function loginSession() {
  const jar    = new CookieJar();
  const client = wrapper(axios.create({ jar, withCredentials: true }));

  // Step 1: get CSRF cookie — jar stores XSRF-TOKEN + ourdatastore_session automatically
  const r1 = await client.get('https://ourdatastore.com/sanctum/csrf-cookie', {
    headers: {
      'Origin':     'https://app.ourdatastore.com',
      'Referer':    'https://app.ourdatastore.com/',
      'User-Agent': 'Mozilla/5.0',
      'Accept':     '*/*',
    },
  });

  const cookies1  = await jar.getCookies('https://ourdatastore.com');
  const xsrfEntry = cookies1.find(c => c.key === 'XSRF-TOKEN');
  const xsrf      = xsrfEntry ? decodeURIComponent(xsrfEntry.value) : '';

  // Step 2: log in — jar follows the redirect and retains all cookies
  await client.post('https://ourdatastore.com/login',
    { username: process.env.OURDATASTORE_USERNAME, password: process.env.OURDATASTORE_PASSWORD },
    {
      headers: {
        'Content-Type': 'application/json',
        'Accept':       'application/json',
        'X-XSRF-TOKEN': xsrf,
        'Origin':       'https://app.ourdatastore.com',
        'Referer':      'https://app.ourdatastore.com/',
        'User-Agent':   'Mozilla/5.0',
      },
      maxRedirects: 5,
    }
  );

  const cookies2     = await jar.getCookies('https://ourdatastore.com');
  const cookieHeader = cookies2.map(c => `${c.key}=${c.value}`).join('; ');

  sessionCookies = cookieHeader;
  sessionTime    = Date.now();
  logger.info('[OURDATASTORE] Session refreshed (cookies: %s)', cookies2.map(c => c.key).join(', '));
  return cookieHeader;
}

async function getSession() {
  if (sessionCookies && (Date.now() - sessionTime < SESSION_TTL_MS)) return sessionCookies;
  return loginSession();
}

async function getAccountInfo() {
  const username = process.env.OURDATASTORE_USERNAME;
  const password = process.env.OURDATASTORE_PASSWORD;
  const encodedAuth = Buffer.from(`${username}:${password}`).toString('base64');
  const response = await axios.post(`${BASE_URL}/user`, {}, {
    headers: { Authorization: `Basic ${encodedAuth}` },
  });
  return {
    balance:  response.data.balance,
    username: response.data.username,
    status:   response.data.status,
  };
}

async function getAdexId() {
  try {
    const SiteSettings = require('../models/SiteSettingsModel');
    const s = await SiteSettings.getSettings();
    if (s.ourdatastoreAdexId) return s.ourdatastoreAdexId;
  } catch (_) {}
  return process.env.OURDATASTORE_ADEX_ID;
}

async function saveAdexId(id) {
  try {
    const SiteSettings = require('../models/SiteSettingsModel');
    const s = await SiteSettings.getSettings();
    if (s.ourdatastoreAdexId !== id) {
      s.ourdatastoreAdexId = id;
      await s.save();
      logger.info('[OURDATASTORE] ADEX ID auto-updated to %s', id);
    }
  } catch (_) {}
}

// Probes OurDataStore endpoints to recover the ADEX ID without already knowing it.
// Called automatically when a 403 is received on the history endpoint.
async function discoverAdexId() {
  let cookies;
  try { cookies = await loginSession(); } catch (_) { return null; }

  const sessionHeaders = {
    Accept:       'application/json',
    Cookie:       cookies,
    Origin:       'https://app.ourdatastore.com',
    Referer:      'https://app.ourdatastore.com/',
    'User-Agent': 'Mozilla/5.0',
  };

  const idPattern = /"(?:id|account_id|adex_id|adexId)"\s*:\s*"([A-Z0-9]{10,20})"/i;

  // Probe 1: /api/account/my-account without a trailing ID — standard RESTful "my own account"
  try {
    const r = await axios.get('https://ourdatastore.com/api/account/my-account', {
      headers: sessionHeaders,
      validateStatus: () => true,
    });
    if (r.status === 200 && r.data && typeof r.data === 'object') {
      const m = JSON.stringify(r.data).match(idPattern);
      if (m) { await saveAdexId(m[1]); return m[1]; }
    }
  } catch (_) {}

  // Probe 2: /api/user with session cookies (returns account info in some API versions)
  try {
    const r = await axios.get('https://ourdatastore.com/api/user', {
      headers: sessionHeaders,
      validateStatus: () => true,
    });
    if (r.status === 200 && r.data && typeof r.data === 'object') {
      const m = JSON.stringify(r.data).match(idPattern);
      if (m) { await saveAdexId(m[1]); return m[1]; }
    }
  } catch (_) {}

  return null;
}

async function fetchHistory({ page = 1, status = 'ALL', search = '', perPage = 20 } = {}) {
  async function attempt() {
    const adexId = await getAdexId();
    const url    = `https://ourdatastore.com/api/system/all/history/adex/${adexId}/secure`;
    const cookies = await getSession();
    const r = await axios.get(url, {
      params:  { page, adex: perPage, status, search },
      headers: {
        Cookie:       cookies,
        Accept:       'application/json',
        Origin:       'https://app.ourdatastore.com',
        Referer:      'https://app.ourdatastore.com/',
        'User-Agent': 'Mozilla/5.0',
      },
    });
    // Auto-save ADEX ID extracted from the response path — keeps it current for next time
    const pathUrl = r.data?.all_summary?.path || '';
    const match   = pathUrl.match(/\/adex\/([^/]+)\/secure/);
    if (match && match[1] !== adexId) saveAdexId(match[1]);
    return r.data.all_summary;
  }

  try {
    return await attempt();
  } catch (firstErr) {
    if (firstErr.response?.status !== 403) throw firstErr;

    // 403 — try to auto-recover the ADEX ID without admin intervention
    logger.warn('[OURDATASTORE] 403 on history — attempting automatic ADEX ID recovery');
    sessionCookies = null; // force a fresh login inside discoverAdexId
    const newId = await discoverAdexId();

    if (newId) {
      logger.info('[OURDATASTORE] Auto-recovered ADEX ID: %s — retrying history', newId);
      try { return await attempt(); } catch (_) {}
    }

    logger.error('[OURDATASTORE] ADEX ID auto-recovery failed. Check server logs or update via /admin/settings.');
    throw new Error('ADEX_ID_STALE');
  }
}

async function getTransactionStatus(requestId) {
  if (!requestId) return null;
  try {
    const history = await fetchHistory({ page: 1, status: 'ALL', search: requestId, perPage: 5 });
    const match   = (history.data || []).find(t => t.transid === requestId);
    return match ? match.plan_status : null;
  } catch (_) {
    return null;
  }
}

module.exports = { buyData, networkCode, userMessage, getAccountInfo, fetchHistory, getTransactionStatus };
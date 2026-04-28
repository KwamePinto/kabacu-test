const axios = require('axios');

const BASE_URL = 'https://ourdatastore.com/api';

let cachedToken = null;
let tokenTime = null;

// 🔐 Generate Token
async function generateToken() {
  const username = process.env.OURDATASTORE_USERNAME;
  const password = process.env.OURDATASTORE_PASSWORD;

  const encodedAuth = Buffer.from(`${username}:${password}`).toString('base64');

  const response = await axios.post(`${BASE_URL}/user`, {}, {
    headers: {
      Authorization: `Basic ${encodedAuth}`
    }
  });

  if (response.data.status !== 'success') {
    throw new Error(response.data.message);
  }

  return response.data.AccessToken;
}

// ♻️ Cache Token
async function getToken() {
  const now = Date.now();

  if (cachedToken && (now - tokenTime < 50 * 60 * 1000)) {
    return cachedToken;
  }

  const token = await generateToken();
  cachedToken = token;
  tokenTime = now;

  return token;
}

// 📡 BUY DATA FUNCTION
async function buyData({ network, phone, data_plan }) {
  try {
    const token = await getToken();

    const payload = {
      network: network,        // e.g. 1 = MTN
      phone: phone,
      data_plan: data_plan,
      bypass: false,
      "request-id": `DATA_${Date.now()}`
    };

    const response = await axios.post(`${BASE_URL}/data`, payload, {
      headers: {
        Authorization: `Token ${token}`, // ✅ VERY IMPORTANT
        'Content-Type': 'application/json'
      }
    });

    console.log("BUY RESPONSE:", response.data);

    return response.data;

  } catch (error) {
    console.error('Error buying data:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  buyData
};
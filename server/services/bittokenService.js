const axios = require('axios');
const crypto = require('crypto');

const BITTOKEN_RECEIVE_RP_URL = 'https://dev-api.bittokenapp.com/api/user/kabacu/receive-rp';

function generateSignature(minerId, timestamp) {
  const payload = `${minerId}|${timestamp}`;
  return crypto
    .createHmac('sha256', process.env.EXTERNAL_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
}

async function transferRPToBittoken({ minerId, email, rpAmount }) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = generateSignature(minerId, timestamp);

  const response = await axios.post(
    BITTOKEN_RECEIVE_RP_URL,
    {
      miner_id: minerId,
      email_id: email,
      rp_amount: rpAmount,
      created_at: timestamp,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-signature': signature,
      },
      timeout: 15000,
    }
  );

  return response.data;
}

module.exports = { transferRPToBittoken };

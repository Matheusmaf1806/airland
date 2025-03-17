const fetch = require('node-fetch');

const CONTENT_API_URL = process.env.CONTENT_API_URL;
const CONTENT_API_KEY = process.env.CONTENT_API_KEY;

async function fetchContentForHotel(hotelCode) {
  const url = new URL(CONTENT_API_URL + '/hotel-content');
  url.searchParams.set('hotelCode', hotelCode);

  const headers = {
    'Authorization': `Bearer ${CONTENT_API_KEY}`,
    'Accept': 'application/json'
  };

  const resp = await fetch(url.toString(), { headers });
  if (!resp.ok) {
    console.warn("Falha content:", hotelCode, resp.status);
    return null;
  }
  return resp.json();
}

module.exports = { fetchContentForHotel };

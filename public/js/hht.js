import fetch from 'node-fetch';  // ou use 'fetch' se estiver em ambiente de navegador

export async function getHotelData(destination, limit = 5, offset = 1) {
  const apiKey = process.env.API_KEY_HH;
  const secretKey = process.env.SECRET_KEY_HH;
  
  const utcDate = Math.floor(new Date().getTime() / 1000);
  const signature = generateSignature(apiKey, secretKey, utcDate);
  
  const url = `https://api.test.hotelbeds.com/hotel-api/1.0/hotels?destination=${destination}&limit=${limit}&offset=${offset}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Api-key': apiKey,
      'X-Signature': signature,
    }
  });

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }

  return data;
}

function generateSignature(apiKey, secretKey, utcDate) {
  const assemble = apiKey + secretKey + utcDate;
  const hash = CryptoJS.SHA256(assemble).toString(CryptoJS.enc.Hex);
  return hash;
}

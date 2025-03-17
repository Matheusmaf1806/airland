const fetch = require('node-fetch');

const BOOKING_API_URL = process.env.BOOKING_API_URL;
const BOOKING_API_KEY = process.env.BOOKING_API_KEY;

async function fetchBookingHotels({ checkIn, checkOut, destination, rooms, page, limit }) {
  // Montar URL real da Booking
  const url = new URL(BOOKING_API_URL + '/hotels');
  url.searchParams.set('checkIn', checkIn);
  url.searchParams.set('checkOut', checkOut);
  url.searchParams.set('destination', destination);
  url.searchParams.set('rooms', rooms || 1);
  url.searchParams.set('page', page || 1);
  url.searchParams.set('limit', limit || 20);

  // Se for preciso mandar key no header:
  const headers = {
    'Authorization': `Bearer ${BOOKING_API_KEY}`,
    'Accept': 'application/json'
  };

  const resp = await fetch(url.toString(), { headers });
  if (!resp.ok) {
    throw new Error(`Booking API falhou: ${resp.status}`);
  }
  return resp.json();
}

module.exports = { fetchBookingHotels };

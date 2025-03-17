const { fetchBookingHotels } = require('./bookingApi');
const { fetchContentForHotel } = require('./contentApi');

async function getHotels(req, res) {
  try {
    // Extrair query params
    const { checkIn, checkOut, destination, rooms, page, limit } = req.query;
    
    // 1) Chama Booking API
    const bookingData = await fetchBookingHotels({ checkIn, checkOut, destination, rooms, page, limit });

    // Supondo que bookingData.hotels.hotels seja a array
    const hotelsArray = bookingData.hotels?.hotels || [];

    // 2) Para cada hotel, chama Content API e anexa:
    for (const hotel of hotelsArray) {
      const code = hotel.code;
      const contentData = await fetchContentForHotel(code);
      hotel.content = contentData?.hotel || {}; 
      // ou se quiser mesclar
    }

    // 3) Retorna ao front
    return res.json(bookingData);

  } catch (err) {
    console.error("Erro em getHotels:", err);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { getHotels };

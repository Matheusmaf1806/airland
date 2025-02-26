const { fetchHotelsFromHotelbeds } = require('../services/hotelbedsService');
const { OPERATOR_MARGIN, AGENCY_MARGIN } = require('../config');

async function getHotels(req, res) {
  try {
    // Pegar query params do front-end: /hotels?checkIn=2025-03-21&checkOut=2025-03-22&adults=1...
    const { checkIn, checkOut, adults, children, rooms, age } = req.query;

    // Chamar a service p/ buscar na Hotelbeds
    const rawData = await fetchHotelsFromHotelbeds({ checkIn, checkOut, adults, children, rooms, age });

    // Supondo que rawData seja algo tipo:
    // {
    //   hotels: [
    //     { id: 234673, name: 'Hotel ABC', price: 100.0, currency: 'USD' },
    //     { id: 897496, name: 'Hotel XYZ', price: 150.0, currency: 'USD' },
    //     ...
    //   ]
    // }
    // Ajuste conforme o que realmente retorna.

    const hotelsArray = rawData.hotels || [];

    // Vamos aplicar a fórmula do “preço final”:
    //   precoFinal = precoOriginal * (1 + OPERATOR_MARGIN) * (1 + AGENCY_MARGIN)
    // Exemplo: se OPERATOR_MARGIN=0.10 e AGENCY_MARGIN=0.05 => total +15,5% total
    const finalList = hotelsArray.map((hotel) => {
      const originalPrice = hotel.price;
      const withOperator = originalPrice * (1 + OPERATOR_MARGIN);
      const withAgency = withOperator * (1 + AGENCY_MARGIN);

      return {
        id: hotel.id,
        name: hotel.name,
        originalPrice: hotel.price,
        currency: hotel.currency,
        finalPrice: parseFloat(withAgency.toFixed(2)) // ex: 115.5 => 115.50
      };
    });

    return res.json(finalList);
  } catch (error) {
    console.error('Erro no getHotels:', error.message);
    return res.status(500).json({ error: 'Erro interno ao buscar hotéis' });
  }
}

module.exports = {
  getHotels
};

// hosp/controllers/hotelsController.js
const { getHotelsFromHotelbeds } = require('../services/hotelbedsService');
const { OPERATOR_MARGIN } = require('../config');

async function listHotels(req, res) {
  try {
    // Você pode receber do body (POST) ou dos query params
    // Exemplo: se no front você faz fetch POST com JSON:
    // const { checkIn, checkOut, adults, children, rooms, age } = req.body;
    // Ou se usa query (GET):
    const { checkIn, checkOut, adults, children, rooms, age } = req.query;

    // Monta payload p/ Hotelbeds
    // Esse "payload" deve seguir o JSON que você testou no Postman
    // Aqui um exemplo simplificado:
    const payload = {
      stay: {
        checkIn,
        checkOut,
        allowOnlyShift: true
      },
      occupancies: [
        {
          adults: parseInt(adults || '1', 10),
          children: parseInt(children || '0', 10),
          rooms: parseInt(rooms || '1', 10),
          paxes: [
            {
              type: 'AD',
              age: parseInt(age || '30', 10)
            }
          ]
        }
      ],
      // Por ex: se quiser filtrar hoteis específicos
      hotels: {
        hotel: [234673, 897496, 89413, 13204, 52174, 989016],
        included: 'true',
        type: 'HOTELBEDS'
      },
      platform: 80,
      language: 'ENG' 
    };

    // Chama a service p/ buscar no Hotelbeds
    const hotelbedsData = await getHotelsFromHotelbeds(payload);

    // Agora "hotelbedsData" tem a resposta bruta da API
    // A partir daqui, extraia a lista e calcule margens
    // Exemplo: supõe que hotelbedsData.hotels retorna algo
    // Você deve ver a estrutura JSON real no console
    const hotelsResult = [];

    if (hotelbedsData && hotelbedsData.hotels) {
      // Só um exemplo, depende do que a API devolve
      for (const hbHotel of hotelbedsData.hotels) {
        // Exemplo: se "hbHotel.prices.total" for o valor, acrescente
        const basePrice = hbHotel.prices?.total || 0;
        const finalPrice = basePrice + (basePrice * OPERATOR_MARGIN);

        hotelsResult.push({
          name: hbHotel.name?.content || 'Sem nome',
          finalPrice
        });
      }
    }

    return res.json(hotelsResult);
  } catch (error) {
    console.error('Erro listHotels:', error);
    res.status(500).json({ error: 'Falha ao obter hotéis.' });
  }
}

module.exports = {
  listHotels
};

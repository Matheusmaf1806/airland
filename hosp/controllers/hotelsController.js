// hosp/controllers/hotelsController.js
exports.getHotels = async (req, res) => {
  try {
    const { checkIn, checkOut, adults, children, rooms, age } = req.query;

    // Aqui você chama o hotelbedsService para consultar a API do Hotelbeds,
    // aplica margens, etc. Exemplo minimalista:

    // const results = await hotelbedsService.fetchHotels({
    //   checkIn, checkOut, adults, children, rooms, age
    // });
    // OU se ainda não implementou, retorne algo fixo para testar:
    const results = [
      { name: 'Hotel Exemplo', finalPrice: 200 },
      { name: 'Hotel Fictício', finalPrice: 300 },
    ];

    return res.json(results); 
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar hotéis' });
  }
};

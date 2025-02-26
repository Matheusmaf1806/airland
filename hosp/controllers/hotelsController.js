// controllers/hotelsController.js
const { searchHotels } = require('../services/hotelbedsService')
const { OPERATOR_MARGIN } = require('../config')

/**
 * Exemplo de controller:
 * - Recebe req.body com checkIn, checkOut, etc.
 * - Chama searchHotels
 * - Para cada hotel, aplica as margens
 */
async function getHotels(req, res) {
  try {
    const { checkIn, checkOut, adults, children, rooms, agencyMargin = 0.05 } = req.body

    // 1) Buscar no Hotelbeds
    const hotelbedsData = await searchHotels({ checkIn, checkOut, adults, children, rooms })

    // Exemplo: supondo que hotelbedsData retorna algo como
    // { hotels: [ { code: 123, netPrice: 100 }, ... ] }
    // Ajuste para o JSON real do Hotelbeds

    if (!hotelbedsData.hotels) {
      return res.status(200).json({ hotels: [] })
    }

    // 2) Aplica as margens
    const hotelsWithMargins = hotelbedsData.hotels.map(hotel => {
      const { netPrice } = hotel // ex
      // sua "lógica de acréscimo" (ex: netPrice * (1 + OPERATOR_MARGIN) * (1 + agencyMargin))
      const operatorPrice = netPrice * (1 + OPERATOR_MARGIN)
      const finalPrice = operatorPrice * (1 + agencyMargin)

      return {
        ...hotel,
        netPrice,
        finalPrice: parseFloat(finalPrice.toFixed(2)), // arredonda
      }
    })

    // 3) Retorna pro front
    res.status(200).json({
      hotels: hotelsWithMargins
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}

module.exports = {
  getHotels
}

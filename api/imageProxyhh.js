import express from "express";
import axios from "axios";

const router = express.Router();

// 🔹 Rota para buscar e servir imagens do HotelBeds
router.get("/:imagePath", async (req, res) => {
  try {
    const imageUrl = `https://photos.hotelbeds.com/giata/${req.params.imagePath}`; // URL correta das imagens
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });

    // Define o tipo da resposta como imagem
    res.set("Content-Type", "image/jpeg");
    res.send(response.data);
  } catch (error) {
    console.error("Erro ao carregar a imagem:", error);
    res.status(500).send("Erro ao carregar a imagem");
  }
});

export { router as imageProxyRoutes };

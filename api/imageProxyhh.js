import express from "express";
import axios from "axios";

const router = express.Router();

// 🔹 Proxy para buscar e servir imagens do Hotelbeds
router.get("/:imagePath", async (req, res) => {
  try {
    // Construindo a URL completa da imagem
    const imageUrl = `https://photos.hotelbeds.com/giata/${req.params.imagePath}`;

    // Requisição para obter a imagem
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });

    // Definir cabeçalho correto do tipo de conteúdo
    res.set("Content-Type", "image/jpeg");
    res.send(response.data);
  } catch (error) {
    console.error("Erro ao carregar a imagem:", error);

    // Tratamento de erro mais detalhado
    if (error.response && error.response.status === 404) {
      return res.status(404).send("Imagem não encontrada.");
    }

    res.status(500).send("Erro ao carregar a imagem.");
  }
});

// 🔹 Exportando a rota corretamente para uso no server.js
export { router as imageProxyRoutes };

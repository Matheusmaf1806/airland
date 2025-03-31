// routes/malga-tokenize.js ou dentro do server.js
import express from 'express';
import { tokenization } from '@malga/tokenization';

const router = express.Router();

router.post('/tokenize-card', async (req, res) => {
  try {
    const tokenizationInstance = tokenization({
      apiKey: process.env.MALGA_API_KEY,
      clientId: process.env.MALGA_CLIENT_ID,
      options: {
        config: {
          sandbox: true
        }
      }
    });

    const result = await tokenizationInstance.tokenize(req.body);
    return res.json(result);
  } catch (err) {
    console.error('Erro ao tokenizar:', err);
    return res.status(500).json({ error: 'Erro ao tokenizar cartão' });
  }
});

export default router;

const express = require('express');
const router = express.Router();
const { supabase } = require('../js/supabaseClient');

router.post('/importGatorland', async (req, res) => {
  try {
    const activity = req.body;

    if (!activity.modalities || !Array.isArray(activity.modalities)) {
      return res.status(400).json({ error: 'JSON inválido ou sem modalities.' });
    }

    for (const modality of activity.modalities) {
      if (!modality.amountsFrom || !Array.isArray(modality.amountsFrom)) {
        continue;
      }

      // Pega o valor ADULTO para caso CHILD seja 0
      const adultObj = modality.amountsFrom.find(p => p.paxType === 'ADULT');
      const adultPrice = adultObj ? adultObj.amount : null;

      for (const pax of modality.amountsFrom) {
        let priceType;
        if (pax.paxType === 'ADULT') {
          priceType = 'ADULTO';
        } else if (pax.paxType === 'CHILD') {
          priceType = 'CRIANÇA';
        } else {
          priceType = pax.paxType; // SENIOR, etc., se existir
        }

        // Se for CRIANÇA e 0, usar valor do adulto
        let finalPrice = pax.amount;
        if (priceType === 'CRIANÇA' && finalPrice === 0 && adultPrice !== null) {
          finalPrice = adultPrice;
        }

        // Montar objeto para inserir
        // Ajuste as colunas de acordo com o schema real do bd_net
        const record = {
          product_pk: 'AUTO_INCREMENT',  
          park_id: '8',                
          name_site: modality.name,    
          id_site: modality.code,      
          Images: JSON.stringify([]),  
          isSpecial: 'False',          
          extensions_nDays: modality.duration?.value ?? 1,
          forDate: '2025-05-28',       
          reqid: 'abc123',            
          price_type: priceType,       
          price: finalPrice,           
          SKU: modality.rates?.[0]?.rateDetails?.[0]?.rateKey || null,
          id_dsd: null,               
          USDBRL: 5.84                
        };

        const { data: dbData, error } = await supabase
          .from('bd_net')
          .insert(record);

        if (error) {
          console.error('Erro ao inserir no Supabase:', error);
        }
      }
    }

    return res.status(200).json({ message: 'Importação concluída' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;

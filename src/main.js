// src/main.js

import { tokenization } from '@malga/tokenization';

// Carrega as variáveis de ambiente definidas na Vercel
// (Elas devem ser prefixadas com "VITE_" para serem expostas no front-end)
const MALGA_API_KEY = import.meta.env.VITE_MALGA_API_KEY;
const MALGA_CLIENT_ID = import.meta.env.VITE_MALGA_CLIENT_ID;

console.log('Iniciando script com Malga');
console.log('MALGA_API_KEY (build-time):', MALGA_API_KEY);
console.log('MALGA_CLIENT_ID (build-time):', MALGA_CLIENT_ID);

// Exemplo mínimo de uso do Hosted Fields:
const malgaTokenization = tokenization({
  apiKey: MALGA_API_KEY,
  clientId: MALGA_CLIENT_ID,
  options: {
    config: {
      fields: {
        cardNumber: {
          container: 'card-number',
          type: 'text',
          placeholder: 'Número do Cartão',
          needMask: true,
          defaultValidation: true
        },
        cardHolderName: {
          container: 'card-holder-name',
          type: 'text',
          placeholder: 'Nome do Titular',
          needMask: false,
          defaultValidation: true
        },
        cardExpirationDate: {
          container: 'card-expiration-date',
          type: 'text',
          placeholder: 'MM/AA',
          needMask: true,
          defaultValidation: true
        },
        cardCvv: {
          container: 'card-cvv',
          type: 'text',
          placeholder: 'CVV',
          needMask: true,
          defaultValidation: true
        }
      },
      sandbox: true
    }
  }
});

// Aqui você adicionaria a lógica de "tokenize()" em algum evento, por exemplo:
const form = document.getElementById("checkout-form");
if (form) {
  form.addEventListener("submit", async (evt) => {
    evt.preventDefault();
    try {
      const { tokenId, error } = await malgaTokenization.tokenize();
      if (error) {
        console.error("Erro ao tokenizar:", error);
        alert("Erro ao processar o cartão.");
        return;
      }
      // Fazer algo com tokenId...
      console.log("Cartão tokenizado com sucesso, token:", tokenId);
      alert(`Token gerado: ${tokenId}`);
    } catch (err) {
      console.error("Erro inesperado na tokenização:", err);
      alert("Erro inesperado na tokenização.");
    }
  });
}

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { paypal } = require('../config');

// Função para obter o access token
async function getAccessToken() {
  const auth = Buffer.from(`${paypal.clientId}:${paypal.secret}`).toString('base64');
  const response = await axios.post(`${paypal.baseUrl}/v1/oauth2/token`, 'grant_type=client_credentials', {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${auth}`
    }
  });
  return response.data.access_token;
}

// Rota para criar o pedido
router.post('/', async (req, res) => {
  try {
    const accessToken = await getAccessToken();

    const payload = {
      "intent": "CAPTURE",
      "payment_source": {
        "paypal": {
          "name": {
            "given_name": "Luciana",
            "surname": "Coelho"
          },
          "email_address": "teste@paypal.com",
          "address": {
            "address_line_1": "Avenida Paulista, 1048",
            "address_line_2": "14 andar",
            "admin_area_1": "SP",
            "admin_area_2": "São Paulo",
            "country_code": "BR",
            "postal_code": "01310-100"
          },
          "experience_context": {
            "brand_name": "EXAMPLE INC",
            "cancel_url": "https://example.com/cancelUrl",
            "landing_page": "GUEST_CHECKOUT",
            "locale": "pt-BR",
            "payment_method_preference": "IMMEDIATE_PAYMENT_REQUIRED",
            "return_url": "https://example.com/returnUrl",
            "shipping_preference": "SET_PROVIDED_ADDRESS",
            "user_action": "CONTINUE"
          },
          "tax_info": {
            "tax_id": "000.000.000-00",
            "tax_id_type": "BR_CPF"
          }
        }
      },
      "purchase_units": [
        {
          "amount": {
            "breakdown": {
              "discount": {
                "currency_code": "BRL",
                "value": "0.50"
              },
              "item_total": {
                "currency_code": "BRL",
                "value": "10.00"
              },
              "shipping": {
                "currency_code": "BRL",
                "value": "2.00"
              },
              "shipping_discount": {
                "currency_code": "BRL",
                "value": "0.50"
              }
            },
            "currency_code": "BRL",
            "value": "11.00"
          },
          "description": "General description of purchase",
          "shipping": {
            "address": {
              "address_line_1": "Avenida Paulista, 1048",
              "address_line_2": "14 andar",
              "admin_area_1": "SP",
              "admin_area_2": "São Paulo",
              "country_code": "BR",
              "postal_code": "01310-100"
            }
          },
          "items": [
            {
              "category": "PHYSICAL_GOODS",
              "description": "Basic t-shirt",
              "name": "TeeShirt white",
              "quantity": "1",
              "sku": "tee0009123",
              "unit_amount": {
                "currency_code": "BRL",
                "value": "5.00"
              }
            },
            {
              "category": "PHYSICAL_GOODS",
              "description": "Basic t-shirt",
              "name": "TeeShirt black",
              "quantity": "1",
              "sku": "tee0009qwe123",
              "unit_amount": {
                "currency_code": "BRL",
                "value": "5.00"
              }
            }
          ]
        }
      ]
    };

    const response = await axios.post(`${paypal.baseUrl}/v2/checkout/orders`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Erro ao criar pedido:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Erro ao criar pedido' });
  }
});

module.exports = router;

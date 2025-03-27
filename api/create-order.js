// Exemplo de OrdersCreateRequest com installments em BRL
const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
request.prefer("return=representation");

request.requestBody({
  intent: "CAPTURE",
  purchase_units: [
    {
      amount: {
        currency_code: "BRL",
        value: "500.00" // valor total, por exemplo 500
      }
    }
  ],
  payment_source: {
    card: {
      // Configurações de parcelamento
      installments: {
        // Lista de parcelas permitidas
        allowed_installments: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        // Modo de pagamento (ex: "PAYMENT_COMPLETE")
        mode: "PAYMENT_COMPLETE"
      },
      // OPCIONAL: Dados adicionais do cartão
      name: "Nome Exemplo",
      billing_address: {
        address_line_1: "Av. Paulista, 100",
        admin_area_2: "São Paulo",
        admin_area_1: "SP",
        postal_code: "01310-100",
        country_code: "BR"
      }
    }
  },
  application_context: {
    return_url: process.env.RETURN_URL || "https://seu-site.com/return",
    cancel_url: process.env.CANCEL_URL || "https://seu-site.com/cancel"
  }
});

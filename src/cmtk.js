// Seleciona o componente <malga-checkout> no DOM
const malgaCheckout = document.querySelector('malga-checkout');

// Exemplo de config de métodos de pagamento
malgaCheckout.paymentMethods = {
  pix: {
    expiresIn: 600,
    items: [
      {
        id: "123",
        title: "Produto Exemplo - PIX",
        quantity: 1,
        unitPrice: 159000,
      },
    ],
  },
  credit: {
    installments: {
      quantity: 10,
      show: true,
    },
    showCreditCard: true,
  },
  boleto: {
    expiresDate: "2025-12-31",
    instructions: "Instruções de pagamento do boleto",
    interest: {
      days: 1,
      amount: 159000,
    },
    fine: {
      days: 2,
      amount: 200,
    },
    items: [
      {
        id: "123",
        title: "Produto Exemplo - Boleto",
        quantity: 1,
        unitPrice: 159000,
      },
    ],
  },
};

// Configurações de transação
malgaCheckout.transactionConfig = {
  statementDescriptor: "Malga Checkout Example",
  amount: 159000, // Em centavos
  description: "Demonstração do Malga Checkout",
  orderId: "pedido-123",
  customerId: "",
  currency: "BRL",
  capture: false,
  customer: null,
};

// Configurações do diálogo (modal) de status
malgaCheckout.dialogConfig = {
  show: true,
  actionButtonLabel: "Continuar",
  errorActionButtonLabel: "Tentar novamente",
  successActionButtonLabel: "Continuar",
  successRedirectUrl: "https://www.malga.io/",
  pixFilledProgressBarColor: "#2FAC9B",
  pixEmptyProgressBarColor: "#D8DFF0",
};

// Listeners de eventos
malgaCheckout.addEventListener("paymentSuccess", (event) => {
  console.log("Pagamento concluído com sucesso:", event.detail);
});

malgaCheckout.addEventListener("paymentFailed", (event) => {
  console.log("Falha no pagamento:", event.detail);
});

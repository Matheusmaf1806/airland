// checkout-script.js

// Pega o carrinho global carregado no main.js
const cart = window.u || [];

// Objeto do usuário principal
let t = {
  firstName: "",
  lastName: "",
  birthdate: "",
  state: "",
  email: "",
  celular: "",
  cpf: "",
  extraPassengers: []
};

// Container para alerts
const alertContainer = document.getElementById("alertContainer");

// ------------------------------------
// FUNÇÕES AUXILIARES DE ALERTA
// ------------------------------------
function showAlertSuccess(message) {
  alertContainer.innerHTML = `
    <div 
      style="
        position: fixed; 
        top: 1rem; 
        right: 1rem; 
        z-index: 9999; 
        width: 300px;
        padding: 0.8rem 1rem;
        background-color: #ecfdf5;
        color: #065f46;
        border-left: 4px solid #34d399;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        font-family: sans-serif;
        font-size: 0.9rem;
      "
    >
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <strong>Sucesso</strong>
        <button 
          style="
            background: transparent;
            border: none;
            font-weight: bold;
            font-size: 1rem;
            color: #065f46;
            cursor: pointer;
          "
          onclick="document.getElementById('alertContainer').innerHTML='';"
        >
          &times;
        </button>
      </div>
      <p style="margin-top: 0.5rem;">
        ${message}
      </p>
    </div>
  `;
}

function showAlertError(message) {
  alertContainer.innerHTML = `
    <div
      style="
        margin-top: 8px;
        border-left: 4px solid red;
        background-color: #fff5f5;
        color: #7a1f1f;
        padding: 8px;
        border-radius: 4px;
        font-family: sans-serif;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
      "
    >
      <strong style="margin-right: 6px;">Error:</strong> ${message}
    </div>
  `;
}

// ------------------------------------
// FUNÇÃO initOrderInDb (chama /api/orderInit)
// ------------------------------------
async function initOrderInDb(cartItems, userObj) {
  try {
    const response = await fetch('/api/orderInit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cart: cartItems, user: userObj })
    });
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Falha ao criar pedido');
    }
    return data.orderId; // Retorna o ID real do pedido
  } catch (error) {
    console.error("Erro em initOrderInDb:", error);
    throw error;
  }
}

// ------------------------------------
// CONFIGURANDO MALGA CHECKOUT
// ------------------------------------
const malgaCheckout = document.querySelector("#malga-checkout");

// Ajuste métodos de pagamento
malgaCheckout.paymentMethods = {
  pix: {
    expiresIn: 600,
    items: [
      {
        id: "pixItemABC",
        title: "Produto Pix",
        quantity: 1,
        unitPrice: 0
      }
    ]
  },
  credit: {
    installments: { quantity: 10, show: true },
    showCreditCard: true
  },
  boleto: {
    expiresDate: "2025-12-31",
    instructions: "Boleto Exemplo (Produção)",
    interest: { days: 1, amount: 1000 },
    fine: { days: 2, amount: 500 },
    items: [
      {
        id: "boletoItemABC",
        title: "Produto Boleto",
        quantity: 1,
        unitPrice: 0
      }
    ]
  }
};

malgaCheckout.transactionConfig = {
  statementDescriptor: "Checkout Completo",
  amount: 0,
  description: "Pacote + Taxas + Extras",
  orderId: "pedido-999999",
  currency: "BRL",
  capture: false,
  customer: {
    name: "",
    email: "",
    phoneNumber: "",
    document: { type: "CPF", number: "", country: "BR" },
    address: {
      zipCode: "",
      street: "",
      streetNumber: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      country: "BR"
    }
  }
};

// Desativando popup do Malga
malgaCheckout.dialogConfig = {
  show: false,
  actionButtonLabel: "Continuar",
  errorActionButtonLabel: "Tentar novamente",
  successActionButtonLabel: "Continuar",
  successRedirectUrl: "",
  pixFilledProgressBarColor: "#2FAC9B",
  pixEmptyProgressBarColor: "#D8DFF0"
};

// ------------------------------------
// EVENTO: paymentSuccess → ATUALIZAR pedido com status="pago"
// ------------------------------------
malgaCheckout.addEventListener("paymentSuccess", async (event) => {
  console.log("Pagamento concluído com sucesso:", event.detail);
  alertContainer.innerHTML = "";

  // 1) Pega cardId e dados
  const cardId   = event.detail.data.paymentSource?.cardId;
  const meioPgto = event.detail.data.paymentMethod.paymentType || "desconhecido";
  const parcelas = event.detail.data.paymentMethod.installments || 1;

  // 2) Tenta obter brand e cardHolderName
  let brandVal  = "desconhecido";
  let holderVal = "Nome do Cartão";
  if (cardId) {
    try {
      const cardResp = await fetch(`https://api.malga.io/v1/cards/${cardId}`, {
        method: 'GET',
        headers: {
          'X-Client-Id': '4457c178-0f07-4589-ba0e-954e5816fd0f',
          'X-Api-Key':   'bfabc953-1ea0-45d0-95e4-4968cfe2a00e'
        }
      });
      if (cardResp.ok) {
        const cardData = await cardResp.json();
        brandVal  = cardData?.brand || brandVal;
        holderVal = cardData?.cardHolderName || holderVal;
      } else {
        console.warn("Falha ao obter brand do /v1/cards", cardResp.status);
      }
    } catch (err) {
      console.error("Erro ao chamar /v1/cards:", err);
    }
  }

  // 3) Monta objeto de update
  const realOrderId = localStorage.getItem('myRealOrderId') || malgaCheckout.transactionConfig.orderId;
  const dataToUpdate = {
    status: "pago",
    nome_comprador:  holderVal,
    bandeira_cartao: brandVal,
    meio_pgto: meioPgto,
    parcelas,
    valor_venda: finalAmount / 100,
    data_pgto: new Date().toISOString().slice(0,10), 
    gateway: "Malga"
  };

  // 4) /api/orderComplete
  try {
    const response = await fetch('/api/orderComplete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: realOrderId, dataToUpdate })
    });
    const result = await response.json();

    if (!result.success) {
      console.error("Erro ao atualizar pedido (pago):", result.message);
      showAlertError("Falha ao atualizar o pedido no banco.");
      return;
    }

    showAlertSuccess(`Success - Pedido #${realOrderId} marcado como pago!`);
    console.log("Pedido atualizado (pago):", result.updatedData);

    // Step 4 - mensagem final
    document.getElementById("finalTitle").textContent =
      `Parabéns ${t.firstName || "(nome)"} pela sua escolha!`;
    document.getElementById("finalMsg").textContent =
      `Seu pedido #${realOrderId} foi concluído com sucesso.`;
    document.getElementById("finalThanks").textContent =
      "Aproveite a viagem!";

    const rightCol = document.querySelector(".right-col");
    if (rightCol) rightCol.style.display = "none";
    window.p(4);

  } catch (error) {
    console.error("Exceção ao chamar /api/orderComplete:", error);
    showAlertError(`Exceção ao chamar orderComplete: ${error.message}`);
  }
});

// ------------------------------------
// EVENTO: paymentFailed → "recusado"
// ------------------------------------
malgaCheckout.addEventListener("paymentFailed", async (event) => {
  console.log("Falha no pagamento:", event.detail);
  alertContainer.innerHTML = "";

  // Marca pedido como 'recusado'
  const realOrderId = localStorage.getItem('myRealOrderId') || malgaCheckout.transactionConfig.orderId;
  try {
    await fetch('/api/orderComplete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: realOrderId,
        dataToUpdate: { status: "recusado" }
      })
    });
  } catch (err) {
    console.error("Erro ao marcar pedido como recusado:", err);
  }

  showAlertError("Error - Pagamento falhou! Verifique o console.");
});

// ------------------------------------
// FUNÇÃO p/ OBTER TOTAL DO CARRINHO (#totalValue)
// ------------------------------------
function getCartAmountInCents() {
  const totalText = document.getElementById("totalValue").textContent.trim();
  let numericStr  = totalText.replace(/[^\d.,-]/g, "");
  numericStr      = numericStr.replace(/\./g, "");
  numericStr      = numericStr.replace(",", ".");
  const amount    = parseFloat(numericStr);
  if (isNaN(amount)) return 0;
  return Math.round(amount * 100);
}

let finalAmount = 0;

// ------------------------------------
// fetchProfileIfLoggedIn() se tiver agentId
// ------------------------------------
async function fetchProfileIfLoggedIn() {
  const agentId = localStorage.getItem("agentId");
  if (!agentId) return;

  try {
    const response = await fetch(`/api/users/profile?id=${agentId}`);
    if (!response.ok) {
      console.warn("Profile não encontrado:", response.status);
      return;
    }
    const data = await response.json();
    if (!data.primeiro_nome) {
      console.warn("API não retornou 'primeiro_nome'");
      return;
    }
    localStorage.setItem("userFirstName", data.primeiro_nome);
    localStorage.setItem("userLastName",  "");
    localStorage.setItem("userEmail",     data.email    || "");
    localStorage.setItem("userPhone",     data.telefone || "");
  } catch (err) {
    console.error("Erro ao buscar perfil:", err);
  }
}

// ------------------------------------
// STEP 1: Ler dados do form e preencher t
// ------------------------------------
function readUserDataFromStep1() {
  const agentId         = localStorage.getItem("agentId")         || "";
  const storedFirstName = localStorage.getItem("userFirstName")   || "";
  const storedLastName  = localStorage.getItem("userLastName")    || "";
  const storedEmail     = localStorage.getItem("userEmail")       || "";
  const storedPhone     = localStorage.getItem("userPhone")       || "";

  const formFirstName   = document.getElementById("firstName").value.trim();
  const formLastName    = document.getElementById("lastName").value.trim();
  const formCelular     = document.getElementById("celular").value.trim();
  const formEmail       = document.getElementById("email").value.trim();
  const formCpf         = document.getElementById("cpf").value.replace(/\D/g, "");
  const formBirthdate   = document.getElementById("birthdate").value.trim();
  const formState       = document.getElementById("state").value.trim();
  const formCity        = document.getElementById("city").value.trim();
  const formAddress     = document.getElementById("address").value.trim();
  const formNumber      = document.getElementById("number").value.trim();
  // (se quiser armazenar no t => city, address, etc.)

  if (agentId) {
    t.firstName = formFirstName || storedFirstName;
    t.lastName  = formLastName  || storedLastName;
    t.email     = formEmail     || storedEmail;
    t.celular   = formCelular   || storedPhone;
  } else {
    t.firstName = formFirstName;
    t.lastName  = formLastName;
    t.email     = formEmail;
    t.celular   = formCelular;
  }

  t.cpf       = formCpf;
  t.birthdate = formBirthdate;
  t.state     = formState;
}

// ------------------------------------
// STEP 1 -> STEP 2
// ------------------------------------
const toStep2Btn = document.getElementById("toStep2");
if (toStep2Btn) {
  toStep2Btn.addEventListener("click", () => {
    readUserDataFromStep1();
    // Avança Step
    document.querySelector('[data-step="1"]').classList.remove("active");
    document.querySelector('[data-step="2"]').classList.add("active");
  });
}

// ------------------------------------
// STEP 2 -> STEP 3
// ------------------------------------
const toStep3Btn = document.getElementById("toStep3");
if (toStep3Btn) {
  toStep3Btn.addEventListener("click", async () => {
    // 1) Lê dados do step1
    readUserDataFromStep1();

    // 2) calcula valor
    finalAmount = getCartAmountInCents();
    if (finalAmount <= 0) {
      showAlertError("Error - Valor do pedido não pode ser 0!");
      return;
    }
    if (!t.email || !t.email.includes("@")) {
      showAlertError("Error - E-mail inválido.");
      return;
    }

    // 3) Exemplo: affiliateId em cada item
    cart.forEach(item => {
      item.affiliateId = 101;
      item.geradoPor   = localStorage.getItem("cartOwnerId") || "System";
    });

    console.log("DEBUG - cart =>", cart);

    // 4) Cria pedido no banco
    let realOrderId;
    try {
      realOrderId = await initOrderInDb(cart, t);
      localStorage.setItem('myRealOrderId', realOrderId);
      console.log("Pedido pendente criado. ID=", realOrderId);
    } catch (err) {
      showAlertError("Falha ao criar pedido no banco: " + err.message);
      return;
    }

    // 5) Configura Malga
    malgaCheckout.transactionConfig.orderId = String(realOrderId);
    malgaCheckout.transactionConfig.amount  = finalAmount;

    // Montar "customer"
    malgaCheckout.transactionConfig.customer = {
      name: `${t.firstName} ${t.lastName}`,
      email: t.email,
      phoneNumber: t.celular,
      document: {
        type: "CPF",
        number: t.cpf,
        country: "BR"
      },
      address: {
        zipCode: document.getElementById("cep").value || "",
        street: document.getElementById("address").value || "",
        streetNumber: document.getElementById("number").value || "S/N",
        complement: "",
        neighborhood: "",
        city: document.getElementById("city").value || "",
        state: document.getElementById("state").value || "",
        country: "BR"
      }
    };

    // Ajustar itens do PIX e BOLETO
    malgaCheckout.paymentMethods.pix.items[0].unitPrice    = finalAmount;
    malgaCheckout.paymentMethods.boleto.items[0].unitPrice = finalAmount;

    // Step 3
    document.querySelector('[data-step="2"]').classList.remove("active");
    document.querySelector('[data-step="3"]').classList.add("active");
  });
}

// ------------------------------------
// Botoes "Voltar"
// ------------------------------------
const backToStep1Btn = document.getElementById("backToStep1");
if (backToStep1Btn) {
  backToStep1Btn.addEventListener("click", () => {
    document.querySelector('[data-step="2"]').classList.remove("active");
    document.querySelector('[data-step="1"]').classList.add("active");
  });
}

const backToStep2Btn = document.getElementById("backToStep2");
if (backToStep2Btn) {
  backToStep2Btn.addEventListener("click", () => {
    document.querySelector('[data-step="3"]').classList.remove("active");
    document.querySelector('[data-step="2"]').classList.add("active");
  });
}

// ------------------------------------
// DOMContentLoaded => fetchProfile e preenche form
// ------------------------------------
window.addEventListener("DOMContentLoaded", async () => {
  await fetchProfileIfLoggedIn();

  // Se localStorage tiver userFirstName etc.
  const storedFirstName = localStorage.getItem("userFirstName") || "";
  const storedLastName  = localStorage.getItem("userLastName")  || "";
  const storedEmail     = localStorage.getItem("userEmail")     || "";
  const storedPhone     = localStorage.getItem("userPhone")     || "";

  if (document.getElementById("firstName")) {
    document.getElementById("firstName").value = storedFirstName;
  }
  if (document.getElementById("lastName")) {
    document.getElementById("lastName").value = storedLastName;
  }
  if (document.getElementById("email")) {
    document.getElementById("email").value = storedEmail;
  }
  if (document.getElementById("celular")) {
    document.getElementById("celular").value = storedPhone;
  }
});

///////////////////////////////////////////////////////////
// src/main.js - Front-end principal do Checkout
///////////////////////////////////////////////////////////

// Apenas para debug, indicar que o JS carregou
console.log("Checkout ativo");

// =========================================================
// 0) SIMULAÇÃO DO FLUXO 3DS E GERAÇÃO DE TOKEN LOCAL
//    (você vai substituir por fetch('/api/malga/tokenize-card', ...) se quiser real.)
// =========================================================

// Objeto "Simulado" que finge gerar token e fluxo 3DS
const MockMalga = {
  // Gera token "dummy"
  tokenizeCard: function (cardDetails) {
    return new Promise((resolve) => {
      console.log("MockMalga.tokenizeCard chamado com:", cardDetails);
      setTimeout(() => {
        resolve({ tokenId: "dummy_card_token" });
      }, 1000);
    });
  },

  // Simula 3DS
  verify3DS: function (token, amount) {
    return new Promise((resolve) => {
      console.log("MockMalga.verify3DS chamado com token:", token, " e amount:", amount);
      alert("Simulando fluxo 3DS... Aguarde 1 segundo.");
      setTimeout(() => {
        // Retornamos um token "dummy" com 3DS
        resolve("dummy_card_token_with_3DS");
      }, 1000);
    });
  }
};

// =========================================================
// 1) FUNÇÃO PARA INICIALIZAR O "FORM DE CARTÃO" NO FRONT
//    (Simulando Hosted Fields + Chamando MockMalga)
// =========================================================
function initializeCardForm() {
  const form = document.getElementById("checkout-form");
  if (!form) {
    console.error("Não há form #checkout-form na página.");
    return;
  }

  form.addEventListener("submit", async (evt) => {
    evt.preventDefault();

    try {
      // Pegar dados do cartão (no real Hosted Fields, seria malgaTokenization.tokenize())
      const cardNumber = document.getElementById("card-number-input")?.value || "4111111111111111";
      const cardName = document.getElementById("card-holder-name-input")?.value || "Fulano Teste";
      const cardExp = document.getElementById("card-expiration-input")?.value || "12/25";
      const cardCvv = document.getElementById("card-cvv-input")?.value || "123";

      // 1. Simular tokenização
      const { tokenId } = await MockMalga.tokenizeCard({ cardNumber, cardName, cardExp, cardCvv });
      console.log("Token gerado localmente (dummy):", tokenId);

      // 2. Simular 3DS
      const amount = getOrderAmount();
      const token3DS = await MockMalga.verify3DS(tokenId, amount);
      console.log("Token após 3DS:", token3DS);

      // 3. Chama processPayment usando token3DS
      processPayment(token3DS, "card");
    } catch (err) {
      console.error("Erro inesperado no fluxo de cartão:", err);
      alert("Erro inesperado no fluxo de cartão.");
    }
  });
}

// =========================================================
// 2) RESTO DO SEU CÓDIGO DE STEPS, LOGIN, CARRINHO, ETC.
//    (Reutilizamos a lógica que você colocou no front.)
// =========================================================

let checkoutData = {
  extraPassengers: [],
  insuranceSelected: "none" // "none", "30k" ou "80k"
};

const stepsMenu = document.getElementById("stepsMenu");
const stepContents = document.querySelectorAll(".step-content");
const stepButtons = stepsMenu ? stepsMenu.querySelectorAll(".step") : [];

const toStep2Btn = document.getElementById("toStep2");
const backToStep1Btn = document.getElementById("backToStep1");
const toStep3Btn = document.getElementById("toStep3");
const backToStep2Btn = document.getElementById("backToStep2");

// Função para mostrar step
function showStep(stepNumber) {
  stepContents.forEach((content) => {
    content.classList.toggle("active", content.dataset.step === String(stepNumber));
  });
  stepButtons.forEach((button) => {
    const btnStep = parseInt(button.dataset.step, 10);
    button.classList.toggle("active", btnStep === stepNumber);
    if (btnStep > stepNumber) {
      button.classList.add("disabled");
    } else {
      button.classList.remove("disabled");
    }
  });
}

// Inicializar carrinho local
let cartItems = [];
const cartElement = document.getElementById("shoppingCart");
if (cartElement && cartElement.items && cartElement.items.length > 0) {
  cartItems = cartElement.items;
} else {
  const savedCart = localStorage.getItem("cartItems");
  if (savedCart) {
    cartItems = JSON.parse(savedCart);
  } else {
    // Exemplo
    cartItems = [
      {
        hotelName: "Hotel Exemplo A",
        adults: 2,
        children: 1,
        basePriceAdult: 100,
        checkIn: "2025-04-16",
        checkOut: "2025-04-18"
      },
      {
        hotelName: "Hotel Exemplo B",
        adults: 3,
        children: 0,
        basePriceAdult: 150,
        checkIn: "2025-04-10",
        checkOut: "2025-04-12"
      }
    ];
  }
}

// Botão para Step2
if (toStep2Btn) {
  toStep2Btn.addEventListener("click", () => {
    const isLoggedIn = !!localStorage.getItem("agentId");
    if (!isLoggedIn) {
      // Verifica campos de registro
      if (
        !document.getElementById("firstName").value ||
        !document.getElementById("lastName").value ||
        !document.getElementById("celular").value ||
        !document.getElementById("email").value ||
        !document.getElementById("password").value ||
        !document.getElementById("confirmPassword").value
      ) {
        alert("Por favor, preencha todos os campos obrigatórios antes de continuar.");
        return;
      }

      checkoutData.firstName = document.getElementById("firstName").value;
      checkoutData.lastName = document.getElementById("lastName").value;
      checkoutData.celular = document.getElementById("celular").value;
      checkoutData.email = document.getElementById("email").value;
      checkoutData.password = document.getElementById("password").value;
      checkoutData.confirmPassword = document.getElementById("confirmPassword").value;
    }

    // Verifica doc / endereço
    if (
      !document.getElementById("cpf").value ||
      !document.getElementById("rg").value ||
      !document.getElementById("birthdate").value ||
      !document.getElementById("cep").value ||
      !document.getElementById("state").value ||
      !document.getElementById("city").value ||
      !document.getElementById("address").value ||
      !document.getElementById("number").value
    ) {
      alert("Por favor, preencha todos os campos obrigatórios antes de continuar.");
      return;
    }

    checkoutData.cpf = document.getElementById("cpf").value;
    checkoutData.rg = document.getElementById("rg").value;
    checkoutData.birthdate = document.getElementById("birthdate").value;
    checkoutData.cep = document.getElementById("cep").value;
    checkoutData.state = document.getElementById("state").value;
    checkoutData.city = document.getElementById("city").value;
    checkoutData.address = document.getElementById("address").value;
    checkoutData.number = document.getElementById("number").value;

    showStep(2);
  });
}

// Botão Step2 -> Step3
if (toStep3Btn) {
  toStep3Btn.addEventListener("click", () => {
    const selectedInsurance = document.querySelector('input[name="insuranceOption"]:checked');
    checkoutData.insuranceSelected = selectedInsurance ? selectedInsurance.value : "none";

    let insuranceCost = 0;
    if (checkoutData.insuranceSelected === "30k") {
      insuranceCost = 112.81;
    } else if (checkoutData.insuranceSelected === "80k") {
      insuranceCost = 212.02;
    }
    checkoutData.insuranceCost = insuranceCost;

    updateCheckoutCart(cartItems);
    showStep(3);
    initializePaymentMethod(); // vai escolher qual PaymentMethod (card, pix, boleto)
  });
}

// Voltar
backToStep1Btn?.addEventListener("click", () => showStep(1));
backToStep2Btn?.addEventListener("click", () => showStep(2));

// Atualizar carrinho no DOM
function updateCheckoutCart(items) {
  const container = document.getElementById("cartItemsList");
  if (!container) return;

  let subtotal = 0;
  let html = "";

  items.forEach((item) => {
    let price = item.basePriceAdult || 80;
    subtotal += price;
    html += `
      <div class="reserva-item">
        <div class="reserva-left">
          <span class="categoria">${item.type || "Hospedagem"}</span>
          <span class="nome">${item.hotelName || "Hotel Desconhecido"} - ${item.roomName || "Quarto"}</span>
          <div class="reserva-details">
            <p>Check-in: ${item.checkIn || "--/--/----"}</p>
            <p>Check-out: ${item.checkOut || "--/--/----"}</p>
            <p>Quartos: ${item.rooms || 1}</p>
            <p>Adultos: ${item.adults || 1} | Crianças: ${item.children || 0}</p>
          </div>
        </div>
        <div class="reserva-preco">
          R$ ${price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </div>
      </div>
    `;
  });

  if (checkoutData.insuranceCost) {
    subtotal += checkoutData.insuranceCost;
  }

  container.innerHTML = html;
  document.getElementById("subtotalValue").textContent =
    "R$ " + subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  document.getElementById("discountValue").textContent = "- R$ 0,00";
  document.getElementById("totalValue").textContent =
    "R$ " + subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

// =========================================================
// 3) LÓGICA DE PASSAGEIROS EXTRAS E MODAL
// (idem ao que você usou - não vou encurtar)
// =========================================================

const passengerModal = document.getElementById("passengerModal");
const openPassengerModalBtn = document.getElementById("openPassengerModal");
const closeModalBtn = document.getElementById("closeModal");
const savePassengersBtn = document.getElementById("savePassengersBtn");
const modalPassengerContainer = document.getElementById("modalPassengerContainer");
const copyForAllBtn = document.getElementById("copyForAllBtn");

function createModalPassengerForms(items) {
  modalPassengerContainer.innerHTML = "";
  checkoutData.extraPassengers = [];
  let itemsWithExtras = 0;

  items.forEach((item, itemIndex) => {
    const extraCount = (item.adults || 1) - 1;
    if (extraCount > 0) {
      itemsWithExtras++;
      checkoutData.extraPassengers[itemIndex] = [];

      const itemDiv = document.createElement("div");
      itemDiv.classList.add("passenger-box");
      itemDiv.innerHTML = `<h4>${item.hotelName || "Item"}</h4>`;

      for (let i = 0; i < extraCount; i++) {
        const fieldsWrapper = document.createElement("div");
        fieldsWrapper.classList.add("fields-grid-2cols-modal");
        fieldsWrapper.innerHTML = `
          <div class="form-field">
            <label>Nome do Passageiro #${i + 1}</label>
            <input type="text" placeholder="Nome completo" data-item-index="${itemIndex}" data-passenger-index="${i}" class="modalExtraNameInput" />
          </div>
          <div class="form-field">
            <label>Data de Nascimento</label>
            <input type="date" data-item-index="${itemIndex}" data-passenger-index="${i}" class="modalExtraBirthdateInput" />
          </div>
        `;
        itemDiv.appendChild(fieldsWrapper);
      }

      modalPassengerContainer.appendChild(itemDiv);
    }
  });

  copyForAllBtn.style.display = itemsWithExtras > 1 ? "inline-block" : "none";
}

openPassengerModalBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  createModalPassengerForms(cartItems);
  if (passengerModal) passengerModal.style.display = "block";
});

closeModalBtn?.addEventListener("click", () => {
  if (passengerModal) passengerModal.style.display = "none";
});

savePassengersBtn?.addEventListener("click", () => {
  if (passengerModal) passengerModal.style.display = "none";
  alert("Passageiros extras salvos!");
});

copyForAllBtn?.addEventListener("click", () => {
  let sourceIndex = null;
  let sourceExtraCount = 0;
  for (let i = 0; i < cartItems.length; i++) {
    let extraCount = (cartItems[i].adults || 1) - 1;
    if (extraCount > 0) {
      sourceIndex = i;
      sourceExtraCount = extraCount;
      break;
    }
  }
  if (sourceIndex === null) return;

  const sourceData = checkoutData.extraPassengers[sourceIndex] || [];
  for (let i = 0; i < cartItems.length; i++) {
    if (i !== sourceIndex) {
      let extraCount = (cartItems[i].adults || 1) - 1;
      if (extraCount === sourceExtraCount && extraCount > 0) {
        checkoutData.extraPassengers[i] = JSON.parse(JSON.stringify(sourceData));
        for (let passIndex = 0; passIndex < extraCount; passIndex++) {
          const nameSelector = `.modalExtraNameInput[data-item-index="${i}"][data-passenger-index="${passIndex}"]`;
          const birthSelector = `.modalExtraBirthdateInput[data-item-index="${i}"][data-passenger-index="${passIndex}"]`;
          const nameInput = document.querySelector(nameSelector);
          const birthInput = document.querySelector(birthSelector);

          if (nameInput && birthInput && checkoutData.extraPassengers[i][passIndex]) {
            nameInput.value = checkoutData.extraPassengers[i][passIndex].name || "";
            birthInput.value = checkoutData.extraPassengers[i][passIndex].birthdate || "";
          }
        }
      }
    }
  }
  alert("Dados copiados para todos os itens compatíveis!");
});

modalPassengerContainer?.addEventListener("input", (e) => {
  const target = e.target;
  if (
    target.classList.contains("modalExtraNameInput") ||
    target.classList.contains("modalExtraBirthdateInput")
  ) {
    const itemIndex = parseInt(target.getAttribute("data-item-index"), 10);
    const passIndex = parseInt(target.getAttribute("data-passenger-index"), 10);

    if (!checkoutData.extraPassengers[itemIndex]) {
      checkoutData.extraPassengers[itemIndex] = [];
    }
    if (!checkoutData.extraPassengers[itemIndex][passIndex]) {
      checkoutData.extraPassengers[itemIndex][passIndex] = {};
    }
    if (target.classList.contains("modalExtraNameInput")) {
      checkoutData.extraPassengers[itemIndex][passIndex].name = target.value;
    } else {
      checkoutData.extraPassengers[itemIndex][passIndex].birthdate = target.value;
    }
  }
});

// =========================================================
// 4) Seleção do método de pagamento
// =========================================================
function initializePaymentMethod() {
  const method = document.querySelector('input[name="paymentMethod"]:checked').value;
  document.getElementById("card-container").style.display = "none";
  document.getElementById("pix-container").style.display = "none";
  document.getElementById("boleto-container").style.display = "none";

  if (method === "card") {
    document.getElementById("card-container").style.display = "block";
    initializeCardForm(); // Chamamos a função que simula o fluxo do cartão
  } else if (method === "pix") {
    document.getElementById("pix-container").style.display = "block";
    initializePix();
  } else if (method === "boleto") {
    document.getElementById("boleto-container").style.display = "block";
    initializeBoleto();
  }
}

function initializePix() {
  const pixContainer = document.getElementById("pix-container");
  pixContainer.innerHTML = "<button id='generatePixBtn'>Gerar Código Pix</button><div id='pixCodeDisplay'></div>";

  document.getElementById("generatePixBtn").addEventListener("click", function () {
    const amount = getOrderAmount();
    alert(`Simulando Pix para R$ ${amount}`);
    document.getElementById("pixCodeDisplay").innerText = "Código Pix: 1234567890PIX (simulado)";
  });
}

function initializeBoleto() {
  const boletoContainer = document.getElementById("boleto-container");
  boletoContainer.innerHTML = "<button id='generateBoletoBtn'>Gerar Boleto</button><div id='boletoDisplay'></div>";

  document.getElementById("generateBoletoBtn").addEventListener("click", function () {
    const amount = getOrderAmount();
    alert(`Simulando Boleto para R$ ${amount}`);
    document.getElementById("boletoDisplay").innerText = "Boleto gerado (simulado): http://dummy-boleto.com/1234567890";
  });
}

// =========================================================
// 5) ENVIO FINAL - processPayment
// =========================================================
async function processPayment(token, method = "card") {
  let totalText = document.getElementById("totalValue").textContent;
  let amount = totalText.replace("R$", "").trim().replace(/\./g, "").replace(",", ".");
  amount = parseFloat(amount).toFixed(2);

  let installments = "1";
  if (method === "card") {
    const installmentsSelect = document.getElementById("installments");
    if (installmentsSelect) {
      installments = installmentsSelect.value;
    }
  }

  // Aqui você chamaria a rota do backend /api/malga/create-transaction
  // Em vez de usar esse fetch local
  // Abaixo é só simulação:

  alert(`processPayment token=${token}, method=${method}, installments=${installments}, amount=${amount}`);
  // Exemplo de fetch real:
  /*
  const body = {
    paymentToken: token,
    amount,
    installments,
    customer: { ...checkoutData },
    ...
  };
  const res = await fetch("/api/malga/create-transaction", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const result = await res.json();
  if (result.success) {
    alert("Pagamento aprovado! Transaction ID: " + result.transactionId);
    showStep(4);
  } else {
    alert("Falha no pagamento: " + result.message);
  }
  */
  // Para simulação, vamos direto:
  alert("Pagamento Simulado Aprovado. Transaction ID: TRANS-12345");
  showStep(4);
}

// =========================================================
// 6) Função para pegar valor do pedido
// =========================================================
function getOrderAmount() {
  let totalText = document.getElementById("totalValue").textContent;
  let amount = totalText.replace("R$", "").trim().replace(/\./g, "").replace(",", ".");
  return parseFloat(amount).toFixed(2);
}

// =========================================================
// 7) Função para rodar no onload
// =========================================================
window.addEventListener("load", () => {
  // Atualiza carrinho
  updateCheckoutCart(cartItems);

  // Verifica login
  const isLoggedIn = !!localStorage.getItem("agentId");
  const toggleLoginLink = document.getElementById("toggleLogin");
  const registrationFieldsGeneral = document.getElementById("registrationFieldsGeneral");
  const loginFields = document.getElementById("loginFields");

  if (isLoggedIn) {
    if (toggleLoginLink) toggleLoginLink.style.display = "none";
    if (registrationFieldsGeneral) registrationFieldsGeneral.style.display = "none";
    if (loginFields) loginFields.style.display = "none";
  } else {
    if (toggleLoginLink) toggleLoginLink.style.display = "block";
    if (registrationFieldsGeneral) registrationFieldsGeneral.style.display = "block";
  }
});

// =========================================================
// 8) Toggle Login
// =========================================================
const toggleLogin = document.getElementById("toggleLogin");
const registrationFieldsGeneral = document.getElementById("registrationFieldsGeneral");
const loginFields = document.getElementById("loginFields");

if (toggleLogin) {
  toggleLogin.addEventListener("click", (e) => {
    e.preventDefault();
    if (registrationFieldsGeneral.style.display !== "none") {
      registrationFieldsGeneral.style.display = "none";
      loginFields.style.display = "block";
      toggleLogin.textContent = "Não tenho Login";
    } else {
      registrationFieldsGeneral.style.display = "block";
      loginFields.style.display = "none";
      toggleLogin.textContent = "Economize tempo fazendo Login";
    }
  });
}

// =========================================================
// 9) Botão de login
// =========================================================
const loginValidateBtn = document.getElementById("loginValidateBtn");
if (loginValidateBtn) {
  loginValidateBtn.addEventListener("click", () => {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    // Simulação:
    if (email === "teste@teste.com" && password === "1234") {
      localStorage.setItem("agentId", "AGENT-TESTE");
      alert("Login efetuado com sucesso!");
      toggleLogin.style.display = "none";
      registrationFieldsGeneral.style.display = "none";
      loginFields.style.display = "none";
    } else {
      alert("Erro no login: Dados inválidos.");
    }
  });
}

// =========================================================
// 10) CEP, CPF, RG - máscaras
// =========================================================
function buscarCEP(cep) {
  cep = cep.replace(/\D/g, "");
  if (cep.length === 8) {
    const url = `https://viacep.com.br/ws/${cep}/json/`;
    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        if (data.erro) {
          alert("CEP não encontrado!");
          return;
        }
        document.getElementById("address").value = data.logradouro || "";
        document.getElementById("city").value = data.localidade || "";
        document.getElementById("state").value = data.uf || "";
      })
      .catch((error) => {
        console.error("Erro ao buscar CEP:", error);
        alert("Não foi possível consultar o CEP.");
      });
  } else {
    console.log("CEP inválido ou incompleto.");
  }
}
document.getElementById("cep")?.addEventListener("blur", function () {
  buscarCEP(this.value);
});

// Máscara CPF
document.getElementById("cpf")?.addEventListener("input", function (e) {
  let value = e.target.value.replace(/\D/g, "");
  if (value.length > 3) {
    value = value.replace(/^(\d{3})(\d)/, "$1.$2");
  }
  if (value.length > 6) {
    value = value.replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3");
  }
  if (value.length > 9) {
    value = value.replace(/(\d{3})\.(\d{3})\.(\d{3})(\d{1,2}).*/, "$1.$2.$3-$4");
  }
  e.target.value = value;
});

// Máscara RG
document.getElementById("rg")?.addEventListener("input", function (e) {
  let value = e.target.value.replace(/\D/g, "");
  if (value.length > 2) {
    value = value.replace(/^(\d{2})(\d)/, "$1.$2");
  }
  if (value.length > 5) {
    value = value.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
  }
  if (value.length > 7) {
    value = value.replace(/(\d{2})\.(\d{3})\.(\d{3})(\d{1}).*/, "$1.$2.$3-$4");
  }
  e.target.value = value;
});

// =========================================================
// 11) Abertura e fechamento modais Intermac 30K / 80K
// =========================================================
document.querySelectorAll(".open30kModal").forEach((el) => {
  el.addEventListener("click", function (e) {
    e.preventDefault();
    document.getElementById("modalIntermac30K").style.display = "block";
  });
});
document.querySelectorAll(".open80kModal").forEach((el) => {
  el.addEventListener("click", function (e) {
    e.preventDefault();
    document.getElementById("modalIntermac80K").style.display = "block";
  });
});
document.querySelectorAll(".close-modal").forEach((closeBtn) => {
  closeBtn.addEventListener("click", function () {
    const modalId = this.getAttribute("data-close-modal");
    if (modalId) {
      document.getElementById(modalId).style.display = "none";
    }
  });
});

///////////////////////////////////////////////////////////
// FIM DO ARQUIVO src/main.js
///////////////////////////////////////////////////////////

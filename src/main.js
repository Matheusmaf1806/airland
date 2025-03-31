// src/main.js
// Front-end principal do Checkout com integração real via Hosted Fields do Malga

console.log("Checkout ativo");

// ======================================================================
// 1) Configuração dos Hosted Fields do Malga
// ======================================================================

// Para Vite, as variáveis de ambiente devem ter o prefixo VITE_
const MALGA_API_KEY = import.meta.env.VITE_MALGA_API_KEY;
const MALGA_CLIENT_ID = import.meta.env.VITE_MALGA_CLIENT_ID;

import { tokenization } from '@malga/tokenization';

const malgaTokenization = tokenization({
  apiKey: MALGA_API_KEY,
  clientId: MALGA_CLIENT_ID,
  options: {
    config: {
      fields: {
        cardNumber: {
          container: 'card-number',         // Elemento onde o campo será renderizado
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
      sandbox: true,
      styles: {
        input: {
          color: 'black',
          'font-size': '14px'
        },
        ':focus': {
          color: 'blue'
        }
      }
    }
  }
});

// ======================================================================
// 2) Função utilitária para obter o valor total do pedido
// ======================================================================
function getOrderAmount() {
  const totalText = document.getElementById("totalValue").textContent || "R$ 0,00";
  const amountStr = totalText.replace("R$", "").trim().replace(/\./g, "").replace(",", ".");
  return parseFloat(amountStr).toFixed(2);
}

// ======================================================================
// 3) Função para processar o pagamento: chama o endpoint real /api/malga/create-transaction
// ======================================================================
async function processPayment(token, method = "card") {
  try {
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
    const body = {
      tokenId: token,
      amount,
      installments,
      // Inclua aqui os dados do cliente se necessário (ex.: checkoutData.customer)
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
  } catch (err) {
    console.error("Erro ao processar o pagamento:", err);
    alert("Erro ao processar o pagamento. Tente novamente.");
  }
}

// ======================================================================
// 4) Função para inicializar o formulário do cartão (Hosted Fields)
// ======================================================================
function initializeCardForm() {
  const form = document.getElementById("checkout-form");
  if (!form) {
    console.error("Formulário #checkout-form não encontrado.");
    return;
  }
  form.addEventListener("submit", async (evt) => {
    evt.preventDefault();
    try {
      // Chama os Hosted Fields para tokenização
      const { tokenId, error } = await malgaTokenization.tokenize();
      if (error) {
        console.error("Erro na tokenização:", error.message);
        alert("Falha na tokenização: " + (error.message || "Erro desconhecido"));
        return;
      }
      console.log("Token gerado real:", tokenId);

      // Chama o endpoint de 3DS
      const amount = getOrderAmount();
      const verify3dsRes = await fetch("/api/malga/verify-3ds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId, amount })
      });
      const verify3dsData = await verify3dsRes.json();
      if (!verify3dsData.success) {
        alert("Falha no 3DS: " + (verify3dsData.message || "Erro no 3DS"));
        return;
      }
      const token3DS = verify3dsData.token3DS || tokenId;
      console.log("Token pós-3DS:", token3DS);

      // Chama o processamento final do pagamento
      await processPayment(token3DS, "card");
    } catch (err) {
      console.error("Erro inesperado no fluxo de cartão real:", err);
      alert("Erro inesperado no fluxo de cartão real. Ver console para detalhes.");
    }
  });
}

// ======================================================================
// 5) Lógica de steps, carrinho, login e modais (incluindo passageiros extras)
// ======================================================================

// Dados do checkout
let checkoutData = {
  extraPassengers: [],
  insuranceSelected: "none"
};

// Função para exibir um step
function showStep(stepNumber) {
  const stepContents = document.querySelectorAll(".step-content");
  const stepButtons = document.querySelectorAll("#stepsMenu .step");
  stepContents.forEach(content => {
    content.classList.toggle("active", content.dataset.step === String(stepNumber));
  });
  stepButtons.forEach(button => {
    const btnStep = parseInt(button.dataset.step, 10);
    button.classList.toggle("active", btnStep === stepNumber);
    if (btnStep > stepNumber) {
      button.classList.add("disabled");
    } else {
      button.classList.remove("disabled");
    }
  });
}

// Inicializar carrinho
let cartItems = [];
const cartElement = document.getElementById("shoppingCart");
if (cartElement && cartElement.items && cartElement.items.length > 0) {
  cartItems = cartElement.items;
} else {
  const savedCart = localStorage.getItem("cartItems");
  if (savedCart) {
    cartItems = JSON.parse(savedCart);
  } else {
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

// Atualizar carrinho na tela
function updateCheckoutCart(items) {
  const container = document.getElementById("cartItemsList");
  if (!container) return;
  let subtotal = 0;
  let html = "";
  items.forEach(item => {
    const price = item.basePriceAdult || 80;
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
  if (checkoutData.insuranceCost) subtotal += checkoutData.insuranceCost;
  container.innerHTML = html;
  document.getElementById("subtotalValue").textContent = "R$ " + subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  document.getElementById("discountValue").textContent = "- R$ 0,00";
  document.getElementById("totalValue").textContent = "R$ " + subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

// ======================================================================
// 6) Lógica de passageiros extras – Modal e armazenamento persistente
// ======================================================================

// Ao carregar, tenta recuperar os extras salvos no localStorage
if (localStorage.getItem("extraPassengers")) {
  checkoutData.extraPassengers = JSON.parse(localStorage.getItem("extraPassengers"));
}

function createModalPassengerForms(items) {
  const modalContainer = document.getElementById("modalPassengerContainer");
  modalContainer.innerHTML = "";
  checkoutData.extraPassengers = []; // Reinicia os extras
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
      modalContainer.appendChild(itemDiv);
    }
  });
  const copyBtn = document.getElementById("copyForAllBtn");
  if (copyBtn) {
    copyBtn.style.display = itemsWithExtras > 1 ? "inline-block" : "none";
  }
}

// Sempre que houver alteração nos campos de passageiros extras, salva no localStorage
function saveExtraPassengers() {
  localStorage.setItem("extraPassengers", JSON.stringify(checkoutData.extraPassengers));
}

const openPassengerModalBtn = document.getElementById("openPassengerModal");
const closeModalBtn = document.getElementById("closeModal");
const savePassengersBtn = document.getElementById("savePassengersBtn");
const copyForAllBtn = document.getElementById("copyForAllBtn");

if (openPassengerModalBtn) {
  openPassengerModalBtn.addEventListener("click", (e) => {
    e.preventDefault();
    createModalPassengerForms(cartItems);
    const modal = document.getElementById("passengerModal");
    if (modal) modal.style.display = "block";
  });
}
if (closeModalBtn) {
  closeModalBtn.addEventListener("click", () => {
    const modal = document.getElementById("passengerModal");
    if (modal) modal.style.display = "none";
  });
}
if (savePassengersBtn) {
  savePassengersBtn.addEventListener("click", () => {
    const modal = document.getElementById("passengerModal");
    if (modal) modal.style.display = "none";
    alert("Passageiros extras salvos!");
    saveExtraPassengers();
  });
}
if (copyForAllBtn) {
  copyForAllBtn.addEventListener("click", () => {
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
          // Atualiza os inputs do modal
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
    saveExtraPassengers();
  });
}
if (document.getElementById("modalPassengerContainer")) {
  document.getElementById("modalPassengerContainer").addEventListener("input", (e) => {
    const target = e.target;
    if (target.classList.contains("modalExtraNameInput") || target.classList.contains("modalExtraBirthdateInput")) {
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
      saveExtraPassengers();
    }
  });
}

// ======================================================================
// 7) Função para selecionar método de pagamento e inicializar os campos correspondentes
// ======================================================================
function initializePaymentMethod() {
  const method = document.querySelector('input[name="paymentMethod"]:checked').value;
  document.getElementById("card-container").style.display = "none";
  document.getElementById("pix-container").style.display = "none";
  document.getElementById("boleto-container").style.display = "none";
  if (method === "card") {
    document.getElementById("card-container").style.display = "block";
    initializeCardForm(); // Inicializa o fluxo do cartão (Hosted Fields)
  } else if (method === "pix") {
    document.getElementById("pix-container").style.display = "block";
    initializePix();
  } else if (method === "boleto") {
    document.getElementById("boleto-container").style.display = "block";
    initializeBoleto();
  }
}

// ======================================================================
// 8) Inicialização de Pix
// ======================================================================
function initializePix() {
  const pixContainer = document.getElementById("pix-container");
  pixContainer.innerHTML = "<button id='generatePixBtn'>Gerar Código Pix</button><div id='pixCodeDisplay'></div>";
  document.getElementById("generatePixBtn").addEventListener("click", async () => {
    try {
      const amount = getOrderAmount();
      const res = await fetch("/api/malga/generate-pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount })
      });
      const data = await res.json();
      if (!data.success) {
        alert("Falha ao gerar Pix: " + (data.message || "Erro Pix"));
        return;
      }
      document.getElementById("pixCodeDisplay").innerText = "Código Pix: " + data.pixCode;
    } catch (err) {
      console.error("Erro ao gerar Pix:", err);
      alert("Erro ao gerar Pix. Ver console para detalhes.");
    }
  });
}

// ======================================================================
// 9) Inicialização de Boleto
// ======================================================================
function initializeBoleto() {
  const boletoContainer = document.getElementById("boleto-container");
  boletoContainer.innerHTML = "<button id='generateBoletoBtn'>Gerar Boleto</button><div id='boletoDisplay'></div>";
  document.getElementById("generateBoletoBtn").addEventListener("click", async () => {
    try {
      const amount = getOrderAmount();
      const res = await fetch("/api/malga/generate-boleto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount })
      });
      const data = await res.json();
      if (!data.success) {
        alert("Falha ao gerar Boleto: " + (data.message || "Erro Boleto"));
        return;
      }
      document.getElementById("boletoDisplay").innerText = "Boleto gerado: " + data.boletoUrl;
    } catch (err) {
      console.error("Erro ao gerar Boleto:", err);
      alert("Erro ao gerar Boleto. Ver console para detalhes.");
    }
  });
}

// ======================================================================
// 10) Eventos de navegação entre steps e validação dos dados pessoais
// ======================================================================
const toStep2Btn = document.getElementById("toStep2");
const backToStep1Btn = document.getElementById("backToStep1");
const toStep3Btn = document.getElementById("toStep3");
const backToStep2Btn = document.getElementById("backToStep2");

if (toStep2Btn) {
  toStep2Btn.addEventListener("click", () => {
    // Validação dos dados pessoais e de endereço
    if (
      !document.getElementById("firstName").value ||
      !document.getElementById("lastName").value ||
      !document.getElementById("celular").value ||
      !document.getElementById("email").value ||
      !document.getElementById("password").value ||
      !document.getElementById("confirmPassword").value ||
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
    // Armazena os dados no checkoutData
    checkoutData.firstName = document.getElementById("firstName").value;
    checkoutData.lastName = document.getElementById("lastName").value;
    checkoutData.celular = document.getElementById("celular").value;
    checkoutData.email = document.getElementById("email").value;
    checkoutData.password = document.getElementById("password").value;
    checkoutData.confirmPassword = document.getElementById("confirmPassword").value;
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
    // Inicializa o método de pagamento escolhido
    initializePaymentMethod();
  });
}

if (backToStep1Btn) {
  backToStep1Btn.addEventListener("click", () => showStep(1));
}
if (backToStep2Btn) {
  backToStep2Btn.addEventListener("click", () => showStep(2));
}

// ======================================================================
// 11) Função para atualizar o carrinho na tela
// ======================================================================
function updateCheckoutCart(items) {
  const container = document.getElementById("cartItemsList");
  if (!container) return;
  let subtotal = 0;
  let html = "";
  items.forEach(item => {
    const price = item.basePriceAdult || 80;
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
  if (checkoutData.insuranceCost) subtotal += checkoutData.insuranceCost;
  container.innerHTML = html;
  document.getElementById("subtotalValue").textContent = "R$ " + subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  document.getElementById("discountValue").textContent = "- R$ 0,00";
  document.getElementById("totalValue").textContent = "R$ " + subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

// ======================================================================
// 12) Máscaras para CEP, CPF e RG
// ======================================================================
function buscarCEP(cep) {
  cep = cep.replace(/\D/g, "");
  if (cep.length === 8) {
    const url = `https://viacep.com.br/ws/${cep}/json/`;
    fetch(url)
      .then(response => response.json())
      .then(data => {
        if (data.erro) {
          alert("CEP não encontrado!");
          return;
        }
        document.getElementById("address").value = data.logradouro || "";
        document.getElementById("city").value = data.localidade || "";
        document.getElementById("state").value = data.uf || "";
      })
      .catch(error => {
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

document.getElementById("cpf")?.addEventListener("input", function (e) {
  let value = e.target.value.replace(/\D/g, "");
  if (value.length > 3) value = value.replace(/^(\d{3})(\d)/, "$1.$2");
  if (value.length > 6) value = value.replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3");
  if (value.length > 9) value = value.replace(/(\d{3})\.(\d{3})\.(\d{3})(\d{1,2}).*/, "$1.$2.$3-$4");
  e.target.value = value;
});

document.getElementById("rg")?.addEventListener("input", function (e) {
  let value = e.target.value.replace(/\D/g, "");
  if (value.length > 2) value = value.replace(/^(\d{2})(\d)/, "$1.$2");
  if (value.length > 5) value = value.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
  if (value.length > 7) value = value.replace(/(\d{2})\.(\d{3})\.(\d{3})(\d{1}).*/, "$1.$2.$3-$4");
  e.target.value = value;
});

// ======================================================================
// 13) Toggle de exibição do formulário de login/registro
// ======================================================================
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

// ======================================================================
// 14) Botão de Login
// ======================================================================
const loginValidateBtn = document.getElementById("loginValidateBtn");
if (loginValidateBtn) {
  loginValidateBtn.addEventListener("click", () => {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
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

// ======================================================================
// 15) Abertura/fechamento dos modais para Coberturas (Intermac 30K / 80K)
// ======================================================================
document.querySelectorAll(".open30kModal").forEach(el => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("modalIntermac30K").style.display = "block";
  });
});
document.querySelectorAll(".open80kModal").forEach(el => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("modalIntermac80K").style.display = "block";
  });
});
document.querySelectorAll(".close-modal").forEach(closeBtn => {
  closeBtn.addEventListener("click", function () {
    const modalId = this.getAttribute("data-close-modal");
    if (modalId) {
      document.getElementById(modalId).style.display = "none";
    }
  });
});

// ======================================================================
// 16) Inicialização do método de pagamento conforme seleção (Card/Pix/Boleto)
// ======================================================================
function initializePaymentMethod() {
  const method = document.querySelector('input[name="paymentMethod"]:checked').value;
  document.getElementById("card-container").style.display = "none";
  document.getElementById("pix-container").style.display = "none";
  document.getElementById("boleto-container").style.display = "none";
  if (method === "card") {
    document.getElementById("card-container").style.display = "block";
    initializeCardForm();
  } else if (method === "pix") {
    document.getElementById("pix-container").style.display = "block";
    initializePix();
  } else if (method === "boleto") {
    document.getElementById("boleto-container").style.display = "block";
    initializeBoleto();
  }
}

// ======================================================================
// 17) Inicialização de Pix e Boleto (como no exemplo real, usando endpoints)
// ======================================================================
function initializePix() {
  const pixContainer = document.getElementById("pix-container");
  pixContainer.innerHTML = "<button id='generatePixBtn'>Gerar Código Pix</button><div id='pixCodeDisplay'></div>";
  document.getElementById("generatePixBtn").addEventListener("click", async () => {
    try {
      const amount = getOrderAmount();
      const res = await fetch("/api/malga/generate-pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount })
      });
      const data = await res.json();
      if (!data.success) {
        alert("Falha ao gerar Pix: " + (data.message || "Erro Pix"));
        return;
      }
      document.getElementById("pixCodeDisplay").innerText = "Código Pix: " + data.pixCode;
    } catch (err) {
      console.error("Erro ao gerar Pix:", err);
      alert("Erro ao gerar Pix. Ver console para detalhes.");
    }
  });
}

function initializeBoleto() {
  const boletoContainer = document.getElementById("boleto-container");
  boletoContainer.innerHTML = "<button id='generateBoletoBtn'>Gerar Boleto</button><div id='boletoDisplay'></div>";
  document.getElementById("generateBoletoBtn").addEventListener("click", async () => {
    try {
      const amount = getOrderAmount();
      const res = await fetch("/api/malga/generate-boleto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount })
      });
      const data = await res.json();
      if (!data.success) {
        alert("Falha ao gerar Boleto: " + (data.message || "Erro Boleto"));
        return;
      }
      document.getElementById("boletoDisplay").innerText = "Boleto gerado: " + data.boletoUrl;
    } catch (err) {
      console.error("Erro ao gerar Boleto:", err);
      alert("Erro ao gerar Boleto. Ver console para detalhes.");
    }
  });
}

// ======================================================================
// 18) Inicialização geral (onload)
// ======================================================================
window.addEventListener("load", () => {
  updateCheckoutCart(cartItems);
  // Verifica se o usuário já está logado
  const isLoggedIn = !!localStorage.getItem("agentId");
  const toggleLoginLink = document.getElementById("toggleLogin");
  const regFields = document.getElementById("registrationFieldsGeneral");
  const loginFields = document.getElementById("loginFields");
  if (isLoggedIn) {
    if (toggleLoginLink) toggleLoginLink.style.display = "none";
    if (regFields) regFields.style.display = "none";
    if (loginFields) loginFields.style.display = "none";
  } else {
    if (toggleLoginLink) toggleLoginLink.style.display = "block";
    if (regFields) regFields.style.display = "block";
  }
});

// ======================================================================
// 19) Toggle de Login
// ======================================================================
const toggleLoginBtn = document.getElementById("toggleLogin");
const regFields = document.getElementById("registrationFieldsGeneral");
const loginSec = document.getElementById("loginFields");
if (toggleLoginBtn) {
  toggleLoginBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (regFields.style.display !== "none") {
      regFields.style.display = "none";
      loginSec.style.display = "block";
      toggleLoginBtn.textContent = "Não tenho Login";
    } else {
      regFields.style.display = "block";
      loginSec.style.display = "none";
      toggleLoginBtn.textContent = "Economize tempo fazendo Login";
    }
  });
}

// ======================================================================
// 20) Botão de Login
// ======================================================================
const loginValidateBtn = document.getElementById("loginValidateBtn");
if (loginValidateBtn) {
  loginValidateBtn.addEventListener("click", () => {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    if (email === "teste@teste.com" && password === "1234") {
      localStorage.setItem("agentId", "AGENT-TESTE");
      alert("Login efetuado com sucesso!");
      toggleLoginBtn.style.display = "none";
      regFields.style.display = "none";
      loginSec.style.display = "none";
    } else {
      alert("Erro no login: Dados inválidos.");
    }
  });
}
  
// ======================================================================
// 21) Máscaras para CEP, CPF e RG
// ======================================================================
function buscarCEP(cep) {
  cep = cep.replace(/\D/g, "");
  if (cep.length === 8) {
    const url = `https://viacep.com.br/ws/${cep}/json/`;
    fetch(url)
      .then(response => response.json())
      .then(data => {
        if (data.erro) {
          alert("CEP não encontrado!");
          return;
        }
        document.getElementById("address").value = data.logradouro || "";
        document.getElementById("city").value = data.localidade || "";
        document.getElementById("state").value = data.uf || "";
      })
      .catch(error => {
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

document.getElementById("cpf")?.addEventListener("input", function (e) {
  let value = e.target.value.replace(/\D/g, "");
  if (value.length > 3) value = value.replace(/^(\d{3})(\d)/, "$1.$2");
  if (value.length > 6) value = value.replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3");
  if (value.length > 9) value = value.replace(/(\d{3})\.(\d{3})\.(\d{3})(\d{1,2}).*/, "$1.$2.$3-$4");
  e.target.value = value;
});

document.getElementById("rg")?.addEventListener("input", function (e) {
  let value = e.target.value.replace(/\D/g, "");
  if (value.length > 2) value = value.replace(/^(\d{2})(\d)/, "$1.$2");
  if (value.length > 5) value = value.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
  if (value.length > 7) value = value.replace(/(\d{2})\.(\d{3})\.(\d{3})(\d{1}).*/, "$1.$2.$3-$4");
  e.target.value = value;
});

// ======================================================================
// 22) Abertura e fechamento dos modais de Cobertura (Intermac 30K / 80K)
// ======================================================================
document.querySelectorAll(".open30kModal").forEach(el => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("modalIntermac30K").style.display = "block";
  });
});
document.querySelectorAll(".open80kModal").forEach(el => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("modalIntermac80K").style.display = "block";
  });
});
document.querySelectorAll(".close-modal").forEach(closeBtn => {
  closeBtn.addEventListener("click", function () {
    const modalId = this.getAttribute("data-close-modal");
    if (modalId) {
      document.getElementById(modalId).style.display = "none";
    }
  });
});

// ======================================================================
// FIM DO ARQUIVO src/main.js
// ======================================================================

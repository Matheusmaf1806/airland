///////////////////////////////////////////////////////////
// src/main.js - Front-end principal do Checkout
// Integra os endpoints reais do Malga (sandbox) para:
// - Tokenização (/api/malga/tokenize-card)
// - Fluxo 3DS (/api/malga/verify-3ds)
// - Criação da transação (/api/malga/create-transaction)
// Também gerencia a navegação dos steps, carrinho e passagem
// de dados dos passageiros extras (salvando no localStorage)
///////////////////////////////////////////////////////////

console.log("Checkout ativo");

/**
 * Retorna o valor total do pedido (convertido para número com duas casas decimais)
 */
function getOrderAmount() {
  const totalElem = document.getElementById("totalValue");
  let totalText = totalElem ? totalElem.textContent : "R$ 0,00";
  let amount = totalText.replace("R$", "").trim().replace(/\./g, "").replace(",", ".");
  return parseFloat(amount).toFixed(2);
}

/**
 * Inicializa o formulário do cartão.
 * Lê os inputs do cartão, chama as rotas de tokenização e 3DS e, se tudo der certo, processa o pagamento.
 */
function initializeCardForm() {
  const form = document.getElementById("checkout-form");
  if (!form) {
    console.error("Formulário #checkout-form não encontrado.");
    return;
  }
  form.addEventListener("submit", async (evt) => {
    evt.preventDefault();
    try {
      // Ler dados dos inputs
      const cardNumber = document.getElementById("cardNumberInput")?.value || "";
      const cardHolderName = document.getElementById("cardHolderNameInput")?.value || "";
      const cardExpirationDate = document.getElementById("cardExpirationInput")?.value || "";
      const cardCvv = document.getElementById("cardCvvInput")?.value || "";

      // 1) Tokenizar o cartão
      const tokenizeRes = await fetch("/api/malga/tokenize-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardNumber,
          cardHolderName,
          cardExpirationDate,
          cardCvv
        })
      });
      const tokenizeData = await tokenizeRes.json();
      if (!tokenizeData.success) {
        alert("Falha na tokenização: " + (tokenizeData.message || "Erro desconhecido"));
        return;
      }
      const tokenId = tokenizeData.tokenId;
      console.log("Token gerado real:", tokenId);

      // 2) Executar o fluxo 3DS
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

      // 3) Processar pagamento com o token final
      await processPayment(token3DS, "card");
    } catch (err) {
      console.error("Erro inesperado no fluxo de cartão real:", err);
      alert("Erro inesperado no fluxo de cartão real. Ver console para detalhes.");
    }
  });
}

/**
 * Processa o pagamento chamando o endpoint real /api/malga/create-transaction.
 */
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
      customer: {
        firstName: checkoutData.firstName,
        lastName: checkoutData.lastName,
        email: checkoutData.email,
        phone: checkoutData.celular
      },
      billing: {
        streetAddress: checkoutData.address,
        extendedAddress: checkoutData.number,
        locality: checkoutData.city,
        region: checkoutData.state,
        postalCode: checkoutData.cep,
        countryCodeAlpha2: "BR"
      },
      extraPassengers: checkoutData.extraPassengers,
      insuranceSelected: checkoutData.insuranceSelected,
      paymentMethod: method
    };

    const res = await fetch("/api/malga/create-transaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const result = await res.json();
    if (!result.success) {
      alert("Falha na transação: " + (result.message || "Erro desconhecido"));
      return;
    }
    alert("Pagamento Aprovado! Transaction ID: " + result.transactionId);
    showStep(4);
  } catch (err) {
    console.error("Erro ao processar pagamento:", err);
    alert("Erro ao processar pagamento. Ver console para detalhes.");
  }
}

/**
 * Objeto para armazenar os dados do checkout.
 */
let checkoutData = {
  extraPassengers: [],
  insuranceSelected: "none" // "none", "30k" ou "80k"
};

/**
 * Lógica dos steps (navegação)
 */
const stepsMenu = document.getElementById("stepsMenu");
const stepContents = document.querySelectorAll(".step-content");
const stepButtons = stepsMenu ? stepsMenu.querySelectorAll(".step") : [];
const toStep2Btn = document.getElementById("toStep2");
const backToStep1Btn = document.getElementById("backToStep1");
const toStep3Btn = document.getElementById("toStep3");
const backToStep2Btn = document.getElementById("backToStep2");

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

/**
 * Inicializa o carrinho a partir do shoppingCart ou do localStorage.
 */
let cartItems = [];
const cartElement = document.getElementById("shoppingCart");
if (cartElement && cartElement.items && cartElement.items.length > 0) {
  cartItems = cartElement.items;
} else {
  const savedCart = localStorage.getItem("cartItems");
  if (savedCart) {
    cartItems = JSON.parse(savedCart);
  } else {
    // Exemplo de itens fictícios
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

/**
 * Atualiza o carrinho no DOM
 */
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
  if (checkoutData.insuranceCost) subtotal += checkoutData.insuranceCost;
  container.innerHTML = html;
  document.getElementById("subtotalValue").textContent =
    "R$ " + subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  document.getElementById("discountValue").textContent = "- R$ 0,00";
  document.getElementById("totalValue").textContent =
    "R$ " + subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

/**
 * Funções para Passageiros Extras (Modal)
 */
function createModalPassengerForms(items) {
  const modalPassengerContainer = document.getElementById("modalPassengerContainer");
  modalPassengerContainer.innerHTML = "";
  // Reinicia os passageiros extras
  checkoutData.extraPassengers = [];
  let itemsWithExtras = 0;
  items.forEach((item, itemIndex) => {
    const extraCount = (item.adults || 1) - 1;
    if (extraCount > 0) {
      itemsWithExtras++;
      // Inicializa array para este item
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
  const copyForAllBtn = document.getElementById("copyForAllBtn");
  if (copyForAllBtn) {
    copyForAllBtn.style.display = itemsWithExtras > 1 ? "inline-block" : "none";
  }
}

/**
 * Popula o modal com os dados salvos (se existirem no localStorage)
 */
function populatePassengerModal() {
  const savedData = localStorage.getItem("extraPassengers");
  if (!savedData) return;
  checkoutData.extraPassengers = JSON.parse(savedData);
  checkoutData.extraPassengers.forEach((passengers, itemIndex) => {
    passengers.forEach((passenger, passengerIndex) => {
      const nameInput = document.querySelector(`.modalExtraNameInput[data-item-index="${itemIndex}"][data-passenger-index="${passengerIndex}"]`);
      const birthInput = document.querySelector(`.modalExtraBirthdateInput[data-item-index="${itemIndex}"][data-passenger-index="${passengerIndex}"]`);
      if (nameInput) nameInput.value = passenger.name || "";
      if (birthInput) birthInput.value = passenger.birthdate || "";
    });
  });
}

/**
 * Configura os eventos do modal para passageiros extras
 */
function setupPassengerModalEvents() {
  const modalPassengerContainer = document.getElementById("modalPassengerContainer");
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
}

/**
 * Eventos para abrir/fechar o modal de passageiros extras
 */
const passengerModal = document.getElementById("passengerModal");
const openPassengerModalBtn = document.getElementById("openPassengerModal");
const closeModalBtn = document.getElementById("closeModal");
const savePassengersBtn = document.getElementById("savePassengersBtn");
const copyForAllBtn = document.getElementById("copyForAllBtn");

openPassengerModalBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  createModalPassengerForms(cartItems);
  // Se houver dados salvos, popula os inputs
  populatePassengerModal();
  if (passengerModal) passengerModal.style.display = "block";
});

closeModalBtn?.addEventListener("click", () => {
  if (passengerModal) passengerModal.style.display = "none";
});

savePassengersBtn?.addEventListener("click", () => {
  if (passengerModal) passengerModal.style.display = "none";
  // Salva os dados dos passageiros extras no localStorage
  localStorage.setItem("extraPassengers", JSON.stringify(checkoutData.extraPassengers));
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

/**
 * Inicializa o método de pagamento (card, pix ou boleto)
 */
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

function initializePix() {
  const pixContainer = document.getElementById("pix-container");
  pixContainer.innerHTML =
    "<button id='generatePixBtn'>Gerar Código Pix</button><div id='pixCodeDisplay'></div>";
  document.getElementById("generatePixBtn").addEventListener("click", async () => {
    const amount = getOrderAmount();
    try {
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
      alert("Erro ao gerar Pix. Ver console.");
    }
  });
}

function initializeBoleto() {
  const boletoContainer = document.getElementById("boleto-container");
  boletoContainer.innerHTML =
    "<button id='generateBoletoBtn'>Gerar Boleto</button><div id='boletoDisplay'></div>";
  document.getElementById("generateBoletoBtn").addEventListener("click", async () => {
    const amount = getOrderAmount();
    try {
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
      alert("Erro ao gerar Boleto. Ver console.");
    }
  });
}

/**
 * Eventos para processar o pagamento (chamada final)
 * (A única declaração de processPayment é esta, sem duplicação)
 */
// (A função processPayment já foi definida acima)

//////////////////////////////////////
// Eventos de navegação dos steps //
//////////////////////////////////////

if (toStep2Btn) {
  toStep2Btn.addEventListener("click", () => {
    if (!localStorage.getItem("agentId")) {
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
    // Inicia a seleção do método de pagamento
    initializePaymentMethod();
  });
}

if (backToStep1Btn) backToStep1Btn.addEventListener("click", () => showStep(1));
if (backToStep2Btn) backToStep2Btn.addEventListener("click", () => showStep(2));

//////////////////////////////////////
// Evento para atualizar carrinho //
//////////////////////////////////////
function updateCartAndDisplay() {
  updateCheckoutCart(cartItems);
}

//////////////////////////////////////
// Eventos para Login e Toggle Login //
//////////////////////////////////////
const toggleLogin = document.getElementById("toggleLogin");
const regFields = document.getElementById("registrationFieldsGeneral");
const loginDiv = document.getElementById("loginFields");

if (toggleLogin) {
  toggleLogin.addEventListener("click", (e) => {
    e.preventDefault();
    if (regFields.style.display !== "none") {
      regFields.style.display = "none";
      loginDiv.style.display = "block";
      toggleLogin.textContent = "Não tenho Login";
    } else {
      regFields.style.display = "block";
      loginDiv.style.display = "none";
      toggleLogin.textContent = "Economize tempo fazendo Login";
    }
  });
}

const loginValidateBtn = document.getElementById("loginValidateBtn");
if (loginValidateBtn) {
  loginValidateBtn.addEventListener("click", () => {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    if (email === "teste@teste.com" && password === "1234") {
      localStorage.setItem("agentId", "AGENT-TESTE");
      alert("Login efetuado com sucesso!");
      toggleLogin.style.display = "none";
      regFields.style.display = "none";
      loginDiv.style.display = "none";
    } else {
      alert("Erro no login: Dados inválidos.");
    }
  });
}

//////////////////////////////
// CEP e Máscaras de CPF/RG //
//////////////////////////////
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

//////////////////////////////
// Eventos para modais de Coberturas //
//////////////////////////////
document.querySelectorAll(".open30kModal").forEach((el) => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("modalIntermac30K").style.display = "block";
  });
});
document.querySelectorAll(".open80kModal").forEach((el) => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("modalIntermac80K").style.display = "block";
  });
});
document.querySelectorAll(".close-modal").forEach((btn) => {
  btn.addEventListener("click", function () {
    const modalId = this.getAttribute("data-close-modal");
    if (modalId) {
      document.getElementById(modalId).style.display = "none";
    }
  });
});

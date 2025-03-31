// src/main.js – Front-end principal do Checkout com Hosted Fields do Malga

console.log("Checkout ativo");

// Função para obter o valor total do pedido
function getOrderAmount() {
  const totalElem = document.getElementById("totalValue");
  let amountStr = totalElem ? totalElem.textContent : "R$ 0,00";
  amountStr = amountStr.replace("R$", "").trim().replace(/\./g, "").replace(",", ".");
  return parseFloat(amountStr).toFixed(2);
}

// Importa o SDK da Malga (usando Hosted Fields via MalgaTokenization)
import { MalgaTokenization } from '@malga/tokenization';

// Inicializa os Hosted Fields e vincula o submit do formulário
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM carregado, inicializando Hosted Fields da Malga");

  const malgaTokenization = new MalgaTokenization({
    apiKey: import.meta.env.VITE_MALGA_API_KEY,
    clientId: import.meta.env.VITE_MALGA_CLIENT_ID,
    options: {
      config: {
        fields: {
          cardNumber: {
            container: 'card-number',
            placeholder: 'Número do Cartão',
            type: 'text',
            needMask: true,
            defaultValidation: true,
          },
          cardHolderName: {
            container: 'card-holder-name',
            placeholder: 'Nome do Titular',
            type: 'text',
            needMask: false,
            defaultValidation: true,
          },
          cardExpirationDate: {
            container: 'card-expiration-date',
            placeholder: 'MM/AA',
            type: 'text',
            needMask: true,
            defaultValidation: true,
          },
          cardCvv: {
            container: 'card-cvv',
            placeholder: 'CVV',
            type: 'text',
            needMask: true,
            defaultValidation: true,
          },
        },
        styles: {
          input: { color: "black", "font-size": "14px" },
        },
        preventAutofill: true,
      },
      sandbox: true,
    },
  });

  // Vincula o evento de submit do formulário de checkout (Hosted Fields)
  const checkoutForm = document.getElementById("checkout-form");
  if (checkoutForm) {
    checkoutForm.addEventListener("submit", async (evt) => {
      evt.preventDefault();
      try {
        // Chama o método tokenize() do SDK, que aciona os Hosted Fields
        const { tokenId, error } = await malgaTokenization.tokenize();
        if (error) {
          console.error("Erro na tokenização:", error.message);
          alert("Falha na tokenização: " + (error.message || "Erro desconhecido"));
          return;
        }
        console.log("Token gerado:", tokenId);

        // Obter o valor total do pedido
        const amount = getOrderAmount();

        // Chama o endpoint para 3DS (via backend)
        const verifyRes = await fetch("/api/malga/verify-3ds", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tokenId, amount }),
        });
        const verifyData = await verifyRes.json();
        if (!verifyData.success) {
          alert("Falha no 3DS: " + (verifyData.message || "Erro no 3DS"));
          return;
        }
        const token3DS = verifyData.token3DS || tokenId;
        console.log("Token pós 3DS:", token3DS);

        // Chama o processamento final do pagamento
        await processPayment(token3DS, "card");
      } catch (err) {
        console.error("Erro inesperado no fluxo de pagamento:", err);
        alert("Erro inesperado no fluxo de pagamento. Ver console para detalhes.");
      }
    });
  } else {
    console.error("Formulário #checkout-form não encontrado.");
  }

  // Inicializa a lógica dos steps e passageiros extras
  initializeStepsAndPassengers();
});

// Função para processar o pagamento (chama o endpoint real)
async function processPayment(token, method = "card") {
  try {
    let totalText = document.getElementById("totalValue").textContent;
    let amount = totalText.replace("R$", "").trim().replace(/\./g, "").replace(",", ".");
    amount = parseFloat(amount).toFixed(2);
    let installments = "1";
    if (method === "card") {
      const instElem = document.getElementById("installments");
      if (instElem) {
        installments = instElem.value;
      }
    }
    const res = await fetch("/api/malga/create-transaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokenId: token, amount, installments }),
    });
    const data = await res.json();
    if (!data.success) {
      alert("Falha na transação: " + (data.message || "Erro desconhecido"));
      return;
    }
    alert("Pagamento Aprovado! Transaction ID: " + data.transactionId);
    showStep(4);
  } catch (err) {
    console.error("Erro ao processar pagamento:", err);
    alert("Erro ao processar pagamento. Tente novamente.");
  }
}

// Função para alternar entre steps e gerenciar passageiros extras
function initializeStepsAndPassengers() {
  let checkoutData = {
    extraPassengers: [],
    insuranceSelected: "none",
  };

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

  // Carrega carrinho (do localStorage ou exemplo)
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
          checkOut: "2025-04-18",
        },
        {
          hotelName: "Hotel Exemplo B",
          adults: 3,
          children: 0,
          basePriceAdult: 150,
          checkIn: "2025-04-10",
          checkOut: "2025-04-12",
        },
      ];
    }
  }

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

  // Passageiros extras – modal
  function createModalPassengerForms(items) {
    const modalContainer = document.getElementById("modalPassengerContainer");
    modalContainer.innerHTML = "";
    checkoutData.extraPassengers = [];
    let itemsWithExtras = 0;
    items.forEach((item, index) => {
      const extraCount = (item.adults || 1) - 1;
      if (extraCount > 0) {
        itemsWithExtras++;
        checkoutData.extraPassengers[index] = [];
        const itemDiv = document.createElement("div");
        itemDiv.classList.add("passenger-box");
        itemDiv.innerHTML = `<h4>${item.hotelName || "Item"}</h4>`;
        for (let i = 0; i < extraCount; i++) {
          const fieldsWrapper = document.createElement("div");
          fieldsWrapper.classList.add("fields-grid-2cols-modal");
          fieldsWrapper.innerHTML = `
            <div class="form-field">
              <label>Nome do Passageiro #${i + 1}</label>
              <input type="text" placeholder="Nome completo" data-item-index="${index}" data-passenger-index="${i}" class="modalExtraNameInput" />
            </div>
            <div class="form-field">
              <label>Data de Nascimento</label>
              <input type="date" data-item-index="${index}" data-passenger-index="${i}" class="modalExtraBirthdateInput" />
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

  function saveExtraPassengers() {
    localStorage.setItem("extraPassengers", JSON.stringify(checkoutData.extraPassengers));
  }

  // Eventos de modal de passageiros extras
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
            for (let j = 0; j < extraCount; j++) {
              const nameSelector = `.modalExtraNameInput[data-item-index="${i}"][data-passenger-index="${j}"]`;
              const birthSelector = `.modalExtraBirthdateInput[data-item-index="${i}"][data-passenger-index="${j}"]`;
              const nameInput = document.querySelector(nameSelector);
              const birthInput = document.querySelector(birthSelector);
              if (nameInput && birthInput && checkoutData.extraPassengers[i][j]) {
                nameInput.value = checkoutData.extraPassengers[i][j].name || "";
                birthInput.value = checkoutData.extraPassengers[i][j].birthdate || "";
              }
            }
          }
        }
      }
      alert("Dados copiados para todos os itens compatíveis!");
      saveExtraPassengers();
    });
  }
  // Salva alterações dos campos de passageiros extras
  const modalPassengerContainer = document.getElementById("modalPassengerContainer");
  if (modalPassengerContainer) {
    modalPassengerContainer.addEventListener("input", (e) => {
      const target = e.target;
      if (target.classList.contains("modalExtraNameInput") || target.classList.contains("modalExtraBirthdateInput")) {
        const itemIndex = parseInt(target.getAttribute("data-item-index"), 10);
        const passengerIndex = parseInt(target.getAttribute("data-passenger-index"), 10);
        if (!checkoutData.extraPassengers[itemIndex]) {
          checkoutData.extraPassengers[itemIndex] = [];
        }
        if (!checkoutData.extraPassengers[itemIndex][passengerIndex]) {
          checkoutData.extraPassengers[itemIndex][passengerIndex] = {};
        }
        if (target.classList.contains("modalExtraNameInput")) {
          checkoutData.extraPassengers[itemIndex][passengerIndex].name = target.value;
        } else {
          checkoutData.extraPassengers[itemIndex][passengerIndex].birthdate = target.value;
        }
        saveExtraPassengers();
      }
    });
  }

  // Eventos de navegação entre steps
  const toStep2Btn = document.getElementById("toStep2");
  const toStep3Btn = document.getElementById("toStep3");
  const backToStep1Btn = document.getElementById("backToStep1");
  const backToStep2Btn = document.getElementById("backToStep2");

  toStep2Btn && toStep2Btn.addEventListener("click", () => {
    // Validação dos campos obrigatórios do Step 1
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
    // Salva dados do Step 1
    s.firstName = document.getElementById("firstName").value;
    s.lastName = document.getElementById("lastName").value;
    s.celular = document.getElementById("celular").value;
    s.email = document.getElementById("email").value;
    s.password = document.getElementById("password").value;
    s.confirmPassword = document.getElementById("confirmPassword").value;
    s.cpf = document.getElementById("cpf").value;
    s.rg = document.getElementById("rg").value;
    s.birthdate = document.getElementById("birthdate").value;
    s.cep = document.getElementById("cep").value;
    s.state = document.getElementById("state").value;
    s.city = document.getElementById("city").value;
    s.address = document.getElementById("address").value;
    s.number = document.getElementById("number").value;
    showStep(2);
  });
  toStep3Btn && toStep3Btn.addEventListener("click", () => {
    const insuranceOption = document.querySelector('input[name="insuranceOption"]:checked');
    s.insuranceSelected = insuranceOption ? insuranceOption.value : "none";
    let cost = 0;
    if (s.insuranceSelected === "30k") {
      cost = 112.81;
    } else if (s.insuranceSelected === "80k") {
      cost = 212.02;
    }
    s.insuranceCost = cost;
    updateCheckoutCart(cartItems);
    showStep(3);
    se();
  });
  backToStep1Btn && backToStep1Btn.addEventListener("click", () => showStep(1));
  backToStep2Btn && backToStep2Btn.addEventListener("click", () => showStep(2));
}

// Alterna método de pagamento (card, pix, boleto)
function se() {
  const method = document.querySelector('input[name="paymentMethod"]:checked').value;
  document.getElementById("card-container").style.display = "none";
  document.getElementById("pix-container").style.display = "none";
  document.getElementById("boleto-container").style.display = "none";
  if (method === "card") {
    document.getElementById("card-container").style.display = "block";
  } else if (method === "pix") {
    document.getElementById("pix-container").style.display = "block";
    le();
  } else if (method === "boleto") {
    document.getElementById("boleto-container").style.display = "block";
    re();
  }
}

// Gera Pix (real)
function le() {
  const container = document.getElementById("pix-container");
  container.innerHTML =
    "<button id='generatePixBtn'>Gerar Código Pix</button><div id='pixCodeDisplay'></div>";
  document.getElementById("generatePixBtn").addEventListener("click", async () => {
    try {
      const amount = getOrderAmount();
      const res = await fetch("/api/malga/generate-pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
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

// Gera Boleto (real)
function re() {
  const container = document.getElementById("boleto-container");
  container.innerHTML =
    "<button id='generateBoletoBtn'>Gerar Boleto</button><div id='boletoDisplay'></div>";
  document.getElementById("generateBoletoBtn").addEventListener("click", async () => {
    try {
      const amount = getOrderAmount();
      const res = await fetch("/api/malga/generate-boleto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
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

// Alterna entre formulário de login e registro
document.getElementById("toggleLogin")?.addEventListener("click", (e) => {
  e.preventDefault();
  const registrationFields = document.getElementById("registrationFieldsGeneral");
  const loginFields = document.getElementById("loginFields");
  if (registrationFields.style.display !== "none") {
    registrationFields.style.display = "none";
    loginFields.style.display = "block";
    document.getElementById("toggleLogin").textContent = "Não tenho Login";
  } else {
    registrationFields.style.display = "block";
    loginFields.style.display = "none";
    document.getElementById("toggleLogin").textContent = "Economize tempo fazendo Login";
  }
});

// Validação de login
document.getElementById("loginValidateBtn")?.addEventListener("click", () => {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  if (email === "teste@teste.com" && password === "1234") {
    localStorage.setItem("agentId", "AGENT-TESTE");
    alert("Login efetuado com sucesso!");
    document.getElementById("toggleLogin").style.display = "none";
    document.getElementById("registrationFieldsGeneral").style.display = "none";
    document.getElementById("loginFields").style.display = "none";
  } else {
    alert("Erro no login: Dados inválidos.");
  }
});

// Máscaras para CEP, CPF e RG
document.getElementById("cep")?.addEventListener("blur", function () {
  const cep = this.value.replace(/\D/g, "");
  if (cep.length === 8) {
    fetch(`https://viacep.com.br/ws/${cep}/json/`)
      .then((res) => res.json())
      .then((data) => {
        if (data.erro) {
          alert("CEP não encontrado!");
          return;
        }
        document.getElementById("address").value = data.logradouro || "";
        document.getElementById("city").value = data.localidade || "";
        document.getElementById("state").value = data.uf || "";
      })
      .catch((err) => {
        console.error("Erro ao buscar CEP:", err);
        alert("Não foi possível consultar o CEP.");
      });
  } else {
    console.log("CEP inválido ou incompleto.");
  }
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

// Eventos para abrir/fechar modais de coberturas
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

// main.js

// IMPORTAMOS a MalgaTokenization via bundler:
import { MalgaTokenization } from "@malga/tokenization";

/* =========================================================
   JS COMPLETO E AJUSTADO PARA USAR O NOVO FORMATO DE MALGA TOKENIZATION
   ========================================================= */

// ----------------------------------------------------------
// Função utilitária para navegar entre os Steps
// ----------------------------------------------------------
function showStep(stepNumber) {
  const stepContents = document.querySelectorAll(".step-content");
  const stepButtons = document.querySelectorAll(".steps-menu .step");

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

// ----------------------------------------------------------
// Dados principais do Checkout (serão preenchidos nos Steps)
// ----------------------------------------------------------
let checkoutData = {
  extraPassengers: [],
  insuranceSelected: "none", // "none", "essencial" (30k) ou "completo" (80k)
  firstName: "",
  lastName: "",
  celular: "",
  email: "",
  password: "",
  confirmPassword: "",
  cpf: "",
  rg: "",
  birthdate: "",
  cep: "",
  state: "",
  city: "",
  address: "",
  number: "",
  insuranceCost: 0
};

// ----------------------------------------------------------
// Carregando itens do carrinho (exemplo ou de localStorage)
// ----------------------------------------------------------
let cartItems = [];
function loadCartItems() {
  const cartElement = document.getElementById("shoppingCart");
  if (cartElement && cartElement.items && cartElement.items.length > 0) {
    cartItems = cartElement.items;
  } else {
    const savedCart = localStorage.getItem("cartItems");
    if (savedCart) {
      cartItems = JSON.parse(savedCart);
    } else {
      // Exemplo default (fictício)
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
}

// ----------------------------------------------------------
// Atualiza o Resumo (coluna direita) com base no carrinho
// ----------------------------------------------------------
function updateCheckoutCart(items) {
  const container = document.getElementById("cartItemsList");
  let subtotal = 0;
  let html = "";

  items.forEach((item) => {
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

  // Se houver seguro selecionado, adiciona ao subtotal
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

// ----------------------------------------------------------
// Modal para Passageiros Extras
// ----------------------------------------------------------
function createModalPassengerForms(items) {
  const modalPassengerContainer = document.getElementById("modalPassengerContainer");
  const copyForAllBtn = document.getElementById("copyForAllBtn");
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
            <input 
              type="text" 
              placeholder="Nome completo" 
              data-item-index="${itemIndex}" 
              data-passenger-index="${i}" 
              class="modalExtraNameInput" 
            />
          </div>
          <div class="form-field">
            <label>Data de Nascimento</label>
            <input 
              type="date" 
              data-item-index="${itemIndex}" 
              data-passenger-index="${i}" 
              class="modalExtraBirthdateInput" 
            />
          </div>
        `;
        itemDiv.appendChild(fieldsWrapper);
      }
      modalPassengerContainer.appendChild(itemDiv);
    }
  });

  // Exibir "Copiar para todos" só se houver mais de um item com passageiros extras
  copyForAllBtn.style.display = itemsWithExtras > 1 ? "inline-block" : "none";
}

function handlePassengerModal() {
  const passengerModal = document.getElementById("passengerModal");
  const openPassengerModalBtn = document.getElementById("openPassengerModal");
  const closeModalBtn = document.getElementById("closeModal");
  const savePassengersBtn = document.getElementById("savePassengersBtn");
  const copyForAllBtn = document.getElementById("copyForAllBtn");
  const modalPassengerContainer = document.getElementById("modalPassengerContainer");

  // Abre modal
  openPassengerModalBtn.addEventListener("click", (e) => {
    e.preventDefault();
    createModalPassengerForms(cartItems);
    passengerModal.style.display = "block";
  });

  // Fecha modal
  closeModalBtn.addEventListener("click", () => {
    passengerModal.style.display = "none";
  });

  // Botão "Salvar Passageiros"
  savePassengersBtn.addEventListener("click", () => {
    passengerModal.style.display = "none";
    alert("Passageiros extras salvos!");
  });

  // Botão "Copiar para todos"
  copyForAllBtn.addEventListener("click", () => {
    let sourceIndex = null;
    let sourceExtraCount = 0;

    // Acha o primeiro item que tenha passageiros extras
    for (let i = 0; i < cartItems.length; i++) {
      const extraCount = (cartItems[i].adults || 1) - 1;
      if (extraCount > 0) {
        sourceIndex = i;
        sourceExtraCount = extraCount;
        break;
      }
    }
    if (sourceIndex === null) return;

    const sourceData = checkoutData.extraPassengers[sourceIndex] || [];
    // Copia para todos os outros itens com a mesma quantidade de extras
    for (let i = 0; i < cartItems.length; i++) {
      if (i !== sourceIndex) {
        const extraCount = (cartItems[i].adults || 1) - 1;
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

  // Escuta inputs dentro do modal (para salvar no objeto checkoutData em tempo real)
  modalPassengerContainer.addEventListener("input", (e) => {
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

// ----------------------------------------------------------
// Inicializa Listeners dos Steps 1 e 2
// ----------------------------------------------------------
function initStepOneTwoListeners() {
  // Botões para navegar
  const toStep2Btn = document.getElementById("toStep2");
  const backToStep1Btn = document.getElementById("backToStep1");
  const toStep3Btn = document.getElementById("toStep3");
  const backToStep2Btn = document.getElementById("backToStep2");

  // STEP 1 -> STEP 2
  toStep2Btn.addEventListener("click", () => {
    const isLoggedIn = !!localStorage.getItem("agentId");

    // Se não estiver logado, valida campos de registro
    if (!isLoggedIn) {
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

      // Salva dados do registro
      checkoutData.firstName = document.getElementById("firstName").value;
      checkoutData.lastName = document.getElementById("lastName").value;
      checkoutData.celular = document.getElementById("celular").value;
      checkoutData.email = document.getElementById("email").value;
      checkoutData.password = document.getElementById("password").value;
      checkoutData.confirmPassword = document.getElementById("confirmPassword").value;
    }

    // Valida docs e endereço (sempre obrigatório)
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

  // STEP 2 -> STEP 1 (Voltar)
  if (backToStep1Btn) {
    backToStep1Btn.addEventListener("click", () => showStep(1));
  }

  // STEP 2 -> STEP 3
  if (toStep3Btn) {
    toStep3Btn.addEventListener("click", () => {
      // Captura o seguro selecionado
      const selectedInsurance = document.querySelector('input[name="insuranceOption"]:checked');
      checkoutData.insuranceSelected = selectedInsurance ? selectedInsurance.value : "none";

      // Ajusta custo do seguro
      let insuranceCost = 0;
      if (checkoutData.insuranceSelected === "essencial") {
        insuranceCost = 60.65;
      } else if (checkoutData.insuranceSelected === "completo") {
        insuranceCost = 101.09;
      }
      checkoutData.insuranceCost = insuranceCost;

      updateCheckoutCart(cartItems);
      showStep(3);

      // Inicia a tokenização "manual" com data attributes
      initTokenization();
    });
  }

  // STEP 3 -> STEP 2 (Voltar)
  if (backToStep2Btn) {
    backToStep2Btn.addEventListener("click", () => showStep(2));
  }
}

// ----------------------------------------------------------
// Funções de máscaras e CEP (Step 1) + login
// ----------------------------------------------------------
function initMasksAndCep() {
  // Busca CEP
  function buscarCEP(cep) {
    cep = cep.replace(/\D/g, "");
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
        .catch((error) => {
          console.error("Erro ao buscar CEP:", error);
          alert("Não foi possível consultar o CEP.");
        });
    }
  }
  document.getElementById("cep").addEventListener("blur", function () {
    buscarCEP(this.value);
  });

  // Máscara CPF
  document.getElementById("cpf").addEventListener("input", function (e) {
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
  document.getElementById("rg").addEventListener("input", function (e) {
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

  // Login vs Registro
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

  // Botão "Entrar" (login)
  const loginValidateBtn = document.getElementById("loginValidateBtn");
  if (loginValidateBtn) {
    loginValidateBtn.addEventListener("click", () => {
      const email = document.getElementById("loginEmail").value;
      const password = document.getElementById("loginPassword").value;
      fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            localStorage.setItem("agentId", data.user.id);
            alert("Login efetuado com sucesso!");
            toggleLogin.style.display = "none";
            registrationFieldsGeneral.style.display = "none";
            loginFields.style.display = "none";
          } else {
            alert("Erro no login: " + (data.error || "Dados inválidos."));
          }
        })
        .catch((err) => {
          console.error(err);
          alert("Erro ao realizar o login. Tente novamente.");
        });
    });
  }
}

// ----------------------------------------------------------
// Inicializa a TOKENIZAÇÃO (com data-* no Step 3)
// ----------------------------------------------------------
function initTokenization() {
  // Substitua as credenciais pelas suas:
  const malgaTokenization = new MalgaTokenization({
    apiKey: "17a64c8f-a387-4682-bdd8-d280493715e0",
    clientId: "d1d2b51a-0446-432a-b055-034518c2660e",
    options: {
      sandbox: true,
      elements: {
        form: "data-malga-tokenization-form",
        holderName: "data-malga-tokenization-holder-name",
        cvv: "data-malga-tokenization-cvv",
        expirationDate: "data-malga-tokenization-expiration-date",
        number: "data-malga-tokenization-number",
      },
    },
  });

  // Captura o form pelo atributo data-malga-tokenization-form
  const form = document.querySelector("[data-malga-tokenization-form]");
  if (!form) return;

  form.addEventListener("submit", async (evt) => {
    evt.preventDefault();

    const { tokenId, error } = await malgaTokenization.tokenize();
    if (error) {
      console.error(error);
      alert("Não foi possível obter o token do cartão. Verifique os dados.");
      return;
    }

    document.getElementById("tokenResult").textContent = `Token gerado: ${tokenId}`;
    alert("Cartão tokenizado com sucesso! TokenId = " + tokenId);

    // Depois de obter o token, você pode enviá-lo ao backend e avançar:
    showStep(4);
  });
}

// ----------------------------------------------------------
// Ao carregar a página, inicializa tudo
// ----------------------------------------------------------
window.addEventListener("load", () => {
  loadCartItems();
  updateCheckoutCart(cartItems);
  initMasksAndCep();
  initStepOneTwoListeners();
  handlePassengerModal();

  // Verifica se está logado para exibir/ocultar forms
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

  // Inicia no Step 1
  showStep(1);
});

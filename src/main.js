/************************************************************
 *                      1) NAVEGAÇÃO DE STEPS
 ************************************************************/ 
window.p = function(stepNum) {
  // Step-content
  const stepContents = document.querySelectorAll(".step-content");
  stepContents.forEach(sc => {
    sc.classList.toggle("active", sc.dataset.step === String(stepNum));
  });

  // Bolinhas do menu
  const stepsMenu = document.querySelectorAll(".steps-menu .step");
  stepsMenu.forEach(st => {
    const n = parseInt(st.dataset.step, 10);
    st.classList.toggle("active", n === stepNum);
    if (n > stepNum) {
      st.classList.add("disabled");
    } else {
      st.classList.remove("disabled");
    }
  });
};

/************************************************************
 *                 2) OBJETOS E VARIÁVEIS GLOBAIS
 ************************************************************/
// t = dados do "Passageiro Principal" e configurações
let t = {
  // Parte de Passageiros Extras
  extraPassengers: [],
  // Seguro
  insuranceSelected: "none",
  insuranceCost: 0,

  // Campos do Passageiro (registro ou login)
  firstName: "",
  lastName: "",
  celular: "",
  email: "",
  password: "",
  confirmPassword: "",

  // Documentos
  cpf: "",
  rg: "",
  birthdate: "",
  cep: "",
  state: "",
  city: "",
  address: "",
  number: ""
};

// Array do carrinho
let m = [];

// Montante final em centavos (para Malga)
let finalAmount = 0;

// Ponteiro para container de alertas (exibir erros/sucesso)
const alertContainer = document.getElementById("alertContainer");

/************************************************************
 *      3) FUNÇÃO PARA CARREGAR CARRINHO E EXIBIR RESUMO
 ************************************************************/
function loadCart() {
  const shoppingEl = document.getElementById("shoppingCart");

  if (shoppingEl && shoppingEl.items && shoppingEl.items.length > 0) {
    // Se <shopping-cart> tiver items
    m = shoppingEl.items;
    console.log("DEBUG - <shopping-cart> com items =>", m);
  } else {
    // Senão, tenta localStorage
    const stored = localStorage.getItem("cartItems");
    if (stored) {
      try {
        m = JSON.parse(stored);
        console.log("DEBUG - Carregando do localStorage =>", m);
      } catch (err) {
        console.warn("Erro ao fazer JSON.parse em cartItems:", err);
        m = [];
      }
    } else {
      m = [];
      console.log("Carrinho vazio - sem itens de exemplo");
    }
  }
  // Expondo globalmente
  window.u = m;
}

function updateCartSummary(arr) {
  const cartItemsList = document.getElementById("cartItemsList");
  if (!cartItemsList) return;

  let total = 0;
  let htmlStr = "";

  arr.forEach(item => {
    const basePrice = item.basePriceAdult || 80; // fallback se não tiver
    total += basePrice;

    htmlStr += `
      <div class="reserva-item">
        <div class="reserva-left">
          <span class="categoria">${item.type || "Hospedagem"}</span>
          <span class="nome">
            ${item.hotelName || "Hotel Desconhecido"} -
            ${item.roomName  || "Quarto"}
          </span>
          <div class="reserva-details">
            <p>Check-in:  ${item.checkIn  || "--/--/----"}</p>
            <p>Check-out: ${item.checkOut || "--/--/----"}</p>
            <p>Quartos:   ${item.rooms    || 1}</p>
            <p>Adultos:   ${item.adults   || 1} | Crianças: ${item.children || 0}</p>
          </div>
        </div>
        <div class="reserva-preco">
          R$ ${basePrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </div>
      </div>
    `;
  });

  // Se tiver custo de seguro
  if (t.insuranceCost) {
    total += t.insuranceCost;
  }

  cartItemsList.innerHTML = htmlStr;

  // Atualiza Subtotal/Desconto/Total
  const subtEl = document.getElementById("subtotalValue");
  const discEl = document.getElementById("discountValue");
  const totlEl = document.getElementById("totalValue");

  if (subtEl) subtEl.textContent = "R$ " + total.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  if (discEl) discEl.textContent = "- R$ 0,00";
  if (totlEl) totlEl.textContent = "R$ " + total.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

/************************************************************
 *      4) MODAL DE PASSAGEIROS EXTRAS
 ************************************************************/
function showPassengersModal(arr) {
  const container = document.getElementById("modalPassengerContainer");
  const copyBtn   = document.getElementById("copyForAllBtn");
  if (!container) return;

  container.innerHTML = "";
  t.extraPassengers   = [];
  let multipleCount   = 0;

  arr.forEach((item, idx) => {
    const extras = (item.adults || 1) - 1;
    if (extras > 0) {
      multipleCount++;
      t.extraPassengers[idx] = [];

      const passBox = document.createElement("div");
      passBox.classList.add("passenger-box");
      passBox.innerHTML = `<h4>${item.hotelName || "Item"}</h4>`;

      for (let i = 0; i < extras; i++) {
        const fields = document.createElement("div");
        fields.classList.add("fields-grid-2cols-modal");
        fields.innerHTML = `
          <div class="form-field">
            <label>Nome do Passageiro #${i + 1}</label>
            <input
              type="text"
              placeholder="Nome completo"
              data-item-index="${idx}"
              data-passenger-index="${i}"
              class="modalExtraNameInput"
            />
          </div>
          <div class="form-field">
            <label>Data de Nascimento</label>
            <input
              type="date"
              data-item-index="${idx}"
              data-passenger-index="${i}"
              class="modalExtraBirthdateInput"
            />
          </div>
        `;
        passBox.appendChild(fields);
      }
      container.appendChild(passBox);
    }
  });

  if (copyBtn) {
    copyBtn.style.display = (multipleCount > 1) ? "inline-block" : "none";
  }
}

function setupPassengersModal() {
  const modal        = document.getElementById("passengerModal");
  const openModalBtn = document.getElementById("openPassengerModal");
  const closeBtn     = document.getElementById("closeModal");
  const saveBtn      = document.getElementById("savePassengersBtn");
  const copyBtn      = document.getElementById("copyForAllBtn");
  const container    = document.getElementById("modalPassengerContainer");

  openModalBtn?.addEventListener("click", (evt) => {
    evt.preventDefault();
    showPassengersModal(m);
    modal.style.display = "block";
  });

  closeBtn?.addEventListener("click", () => {
    modal.style.display = "none";
  });

  saveBtn?.addEventListener("click", () => {
    modal.style.display = "none";
    alert("Passageiros extras salvos!");
  });

  copyBtn?.addEventListener("click", () => {
    let firstIndex = null;
    let extraCount = 0;
    // Procura o primeiro item c/ multiple adults
    for (let i = 0; i < m.length; i++) {
      const needed = (m[i].adults || 1) - 1;
      if (needed > 0) {
        firstIndex = i;
        extraCount = needed;
        break;
      }
    }
    if (firstIndex === null) return;

    // Copia
    const firstArr = t.extraPassengers[firstIndex] || [];
    for (let j = 0; j < m.length; j++) {
      if (j !== firstIndex) {
        const needed2 = (m[j].adults || 1) - 1;
        if (needed2 === extraCount && needed2 > 0) {
          t.extraPassengers[j] = JSON.parse(JSON.stringify(firstArr));
          // Atualiza inputs do modal
          for (let p = 0; p < needed2; p++) {
            const selName = `.modalExtraNameInput[data-item-index="${j}"][data-passenger-index="${p}"]`;
            const selBD   = `.modalExtraBirthdateInput[data-item-index="${j}"][data-passenger-index="${p}"]`;
            const elName  = document.querySelector(selName);
            const elBD    = document.querySelector(selBD);
            if (elName && elBD && t.extraPassengers[j][p]) {
              elName.value = t.extraPassengers[j][p].name      || "";
              elBD.value   = t.extraPassengers[j][p].birthdate || "";
            }
          }
        }
      }
    }
    alert("Dados copiados para todos os itens compatíveis!");
  });

  // Captura input do modal e salva em t.extraPassengers
  container?.addEventListener("input", (evt) => {
    const el = evt.target;
    if (
      el.classList.contains("modalExtraNameInput") ||
      el.classList.contains("modalExtraBirthdateInput")
    ) {
      const itemIdx = parseInt(el.getAttribute("data-item-index"), 10);
      const passIdx = parseInt(el.getAttribute("data-passenger-index"), 10);

      if (!t.extraPassengers[itemIdx]) {
        t.extraPassengers[itemIdx] = [];
      }
      if (!t.extraPassengers[itemIdx][passIdx]) {
        t.extraPassengers[itemIdx][passIdx] = {};
      }

      if (el.classList.contains("modalExtraNameInput")) {
        t.extraPassengers[itemIdx][passIdx].name = el.value;
      } else {
        t.extraPassengers[itemIdx][passIdx].birthdate = el.value;
      }
    }
  });
}

/************************************************************
 * 5) FUNÇÕES DE MÁSCARA (CEP/CPF/RG) + LÓGICA DE LOGIN
 ************************************************************/
function setupMasksAndLogin() {
  // CEP => viaCEP
  function fetchCep(cepVal) {
    cepVal = cepVal.replace(/\D/g, "");
    if (cepVal.length === 8) {
      fetch(`https://viacep.com.br/ws/${cepVal}/json/`)
        .then(r => r.json())
        .then(data => {
          if (data.erro) {
            alert("CEP não encontrado!");
            return;
          }
          document.getElementById("address").value = data.logradouro || "";
          document.getElementById("city").value    = data.localidade || "";
          document.getElementById("state").value   = data.uf         || "";
        })
        .catch(err => {
          console.error("Erro ao buscar CEP:", err);
          alert("Não foi possível consultar o CEP.");
        });
    }
  }

  document.getElementById("cep")?.addEventListener("blur", function() {
    fetchCep(this.value);
  });

  // CPF
  document.getElementById("cpf")?.addEventListener("input", (evt) => {
    let val = evt.target.value.replace(/\D/g, "");
    if (val.length > 3) {
      val = val.replace(/^(\d{3})(\d)/, "$1.$2");
    }
    if (val.length > 6) {
      val = val.replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3");
    }
    if (val.length > 9) {
      val = val.replace(/(\d{3})\.(\d{3})\.(\d{3})(\d{1,2}).*/, "$1.$2.$3-$4");
    }
    evt.target.value = val;
  });

  // RG
  document.getElementById("rg")?.addEventListener("input", (evt) => {
    let val = evt.target.value.replace(/\D/g, "");
    if (val.length > 2) {
      val = val.replace(/^(\d{2})(\d)/, "$1.$2");
    }
    if (val.length > 5) {
      val = val.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    }
    if (val.length > 7) {
      val = val.replace(/(\d{2})\.(\d{3})\.(\d{3})(\d{1}).*/, "$1.$2.$3-$4");
    }
    evt.target.value = val;
  });

  // Toggle Login
  const toggleLink = document.getElementById("toggleLogin");
  const regDiv     = document.getElementById("registrationFieldsGeneral");
  const loginDiv   = document.getElementById("loginFields");

  toggleLink?.addEventListener("click", (evt) => {
    evt.preventDefault();
    if (regDiv?.style.display !== "none") {
      // exibe login, esconde registro
      regDiv.style.display   = "none";
      loginDiv.style.display = "block";
      toggleLink.textContent = "Não tenho Login";
    } else {
      // exibe registro, esconde login
      regDiv.style.display   = "block";
      loginDiv.style.display = "none";
      toggleLink.textContent = "Economize tempo fazendo Login";
    }
  });

  // Botão "Entrar" do login
  const loginBtn = document.getElementById("loginValidateBtn");
  loginBtn?.addEventListener("click", () => {
    const emailVal = document.getElementById("loginEmail").value;
    const passVal  = document.getElementById("loginPassword").value;

    fetch("/api/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailVal, password: passVal })
    })
      .then(r => r.json())
      .then(resp => {
        if (resp.success) {
          localStorage.setItem("agentId", resp.user.id);
          alert("Login efetuado com sucesso!");

          // esconde link e forms
          if (toggleLink) toggleLink.style.display = "none";
          if (regDiv)     regDiv.style.display     = "none";
          if (loginDiv)   loginDiv.style.display   = "none";
        } else {
          alert("Erro no login: " + (resp.error || "Dados inválidos."));
        }
      })
      .catch(err => {
        console.error("Erro ao realizar login:", err);
        alert("Erro ao realizar o login. Tente novamente.");
      });
  });
}

/************************************************************
 * 6) LER CAMPOS DO STEP 1 E JOGAR EM "t"
 ************************************************************/
function readUserDataFromStep1() {
  const agentId         = localStorage.getItem("agentId")       || "";
  const storedFirstName = localStorage.getItem("userFirstName") || "";
  const storedLastName  = localStorage.getItem("userLastName")  || "";
  const storedEmail     = localStorage.getItem("userEmail")     || "";
  const storedPhone     = localStorage.getItem("userPhone")     || "";

  const formFirstName   = document.getElementById("firstName")?.value.trim() || "";
  const formLastName    = document.getElementById("lastName") ?.value.trim() || "";
  const formCelular     = document.getElementById("celular")  ?.value.trim() || "";
  const formEmail       = document.getElementById("email")    ?.value.trim() || "";
  const formCpf         = (document.getElementById("cpf")?.value || "").replace(/\D/g, "");
  const formBirthdate   = document.getElementById("birthdate")?.value.trim() || "";
  const formState       = document.getElementById("state")    ?.value.trim() || "";
  const formCity        = document.getElementById("city")     ?.value.trim() || "";
  const formAddress     = document.getElementById("address")  ?.value.trim() || "";
  const formNumber      = document.getElementById("number")   ?.value.trim() || "";

  if (agentId) {
    // Se logado, prioriza localStorage se form estiver vazio
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
  t.city      = formCity;
  t.address   = formAddress;
  t.number    = formNumber;
}

/************************************************************
 *  7) FUNÇÃO initOrderInDb => Cria Pedido no Banco (status= PENDING)
 ************************************************************/
async function initOrderInDb(cartItems, userObj) {
  try {
    const response = await fetch("/api/orderInit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cart: cartItems, user: userObj })
    });
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Falha ao criar pedido");
    }
    return data.orderId; // Retorna ID do pedido
  } catch (error) {
    console.error("Erro em initOrderInDb:", error);
    throw error;
  }
}

/************************************************************
 *  8) MALGA CHECKOUT: Sucesso/Erro
 ************************************************************/
const malgaCheckout = document.querySelector("#malga-checkout");

// Métodos de Pagamento
malgaCheckout.paymentMethods = {
  pix: {
    expiresIn: 600,
    items: [{ id: "pixItemABC", title: "Produto Pix", quantity: 1, unitPrice: 0 }]
  },
  credit: {
    installments: { quantity: 10, show: true },
    showCreditCard: true
  },
  boleto: {
    expiresDate:  "2025-12-31",
    instructions: "Boleto Exemplo (Produção)",
    interest:     { days: 1, amount: 1000 },
    fine:         { days: 2, amount: 500 },
    items:        [{ id: "boletoItemABC", title: "Produto Boleto", quantity: 1, unitPrice: 0 }]
  }
};

// Configuração principal da transação
malgaCheckout.transactionConfig = {
  statementDescriptor: "Checkout Completo",
  amount: 0,
  description: "Pacote + Taxas + Extras",
  orderId: "pedido-999999",
  currency: "BRL",
  capture: false,
  customer: {
    name:  "",
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

// Sucesso
malgaCheckout.addEventListener("paymentSuccess", async (event) => {
  console.log("Pagamento concluído com sucesso:", event.detail);
  alertContainer.innerHTML = "";

  // 1) Pega cardId
  const cardId   = event.detail.data.paymentSource?.cardId;
  const meioPgto = event.detail.data.paymentMethod.paymentType || "desconhecido";
  const parcelas = event.detail.data.paymentMethod.installments || 1;

  // 2) Obter brand e nome do cartão via /v1/cards
  let brandVal  = "desconhecido";
  let holderVal = "Nome do Cartão";
  if (cardId) {
    try {
      const cardResp = await fetch(`https://api.malga.io/v1/cards/${cardId}`, {
        method: "GET",
        headers: {
          "X-Client-Id": "4457c178-0f07-4589-ba0e-954e5816fd0f",
          "X-Api-Key":   "bfabc953-1ea0-45d0-95e4-4968cfe2a00e"
        }
      });
      if (cardResp.ok) {
        const cData = await cardResp.json();
        brandVal  = cData?.brand           || brandVal;
        holderVal = cData?.cardHolderName  || holderVal;
      } else {
        console.warn("Falha ao obter brand do /v1/cards", cardResp.status);
      }
    } catch (err) {
      console.error("Erro ao chamar /v1/cards:", err);
    }
  }

  // 3) Monta objeto p/ atualizar no banco (status=pago)
  const realOrderId = localStorage.getItem("myRealOrderId") || malgaCheckout.transactionConfig.orderId;
  const dataToUpdate = {
    status: "pago",
    nome_comprador:  holderVal,
    bandeira_cartao: brandVal,
    meio_pgto:       meioPgto,
    parcelas,
    valor_venda:     finalAmount / 100,
    data_pgto:       new Date().toISOString().slice(0, 10),
    gateway:         "Malga"
  };

  // 4) POST /api/orderComplete
  try {
    const resp = await fetch("/api/orderComplete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: realOrderId, dataToUpdate })
    });
    const result = await resp.json();

    if (!result.success) {
      console.error("Erro ao atualizar pedido (pago):", result.message);
      showAlertError("Falha ao atualizar o pedido no banco.");
      return;
    }

    showAlertSuccess(`Success - Pedido #${realOrderId} marcado como pago!`);
    console.log("Pedido atualizado (pago):", result.updatedData);

    // Step 4 => Mensagem final
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

// Falha
malgaCheckout.addEventListener("paymentFailed", async (event) => {
  console.log("Falha no pagamento:", event.detail);
  alertContainer.innerHTML = "";

  const realOrderId = localStorage.getItem("myRealOrderId") || malgaCheckout.transactionConfig.orderId;
  try {
    await fetch("/api/orderComplete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

/************************************************************
 *  9) FUNÇÃO PARA OBTER O VALOR EM CENTAVOS (#totalValue)
 ************************************************************/
function getCartAmountInCents() {
  const totalText = document.getElementById("totalValue")?.textContent.trim() || "";
  let numericStr  = totalText.replace(/[^\d.,-]/g, "");
  // Remove pontos de milhar
  numericStr      = numericStr.replace(/\./g, "");
  // Troca vírgula por ponto
  numericStr      = numericStr.replace(",", ".");
  const amount    = parseFloat(numericStr);
  if (isNaN(amount)) return 0;
  finalAmount = Math.round(amount * 100);
  return finalAmount;
}

/************************************************************
 * 10) LÓGICA UNIFICADA: Step 2 -> Step 3
 ************************************************************/
async function step2ToStep3() {
  // 1) Lê dados do step 1
  readUserDataFromStep1();

  // 2) Qual seguro foi marcado?
  const selectedInsurance = document.querySelector('input[name="insuranceOption"]:checked');
  t.insuranceSelected = selectedInsurance ? selectedInsurance.value : "none";

  let cost = 0;
  if (t.insuranceSelected === "essencial") {
    cost = 60.65;
  } else if (t.insuranceSelected === "completo") {
    cost = 101.09;
  }
  t.insuranceCost = cost;

  // 3) Recalcular total do carrinho c/ insurance
  updateCartSummary(m);

  // 4) Pega valor final
  const amountCents = getCartAmountInCents();
  if (amountCents <= 0) {
    alert("Error - Valor do pedido não pode ser 0!");
    return;
  }
  if (!t.email || !t.email.includes("@")) {
    alert("Error - E-mail inválido.");
    return;
  }

  // 5) (Opcional) Anexar affiliateId
  m.forEach(item => {
    item.affiliateId = 101;
    item.geradoPor   = localStorage.getItem("cartOwnerId") || "System";
  });

  console.log("DEBUG - cart =>", m);

  // 6) Cria pedido no banco
  let realOrderId;
  try {
    realOrderId = await initOrderInDb(m, t);
    localStorage.setItem("myRealOrderId", realOrderId);
    console.log("Pedido pendente criado. ID=", realOrderId);
  } catch (err) {
    alert("Falha ao criar pedido no banco: " + err.message);
    return;
  }

  // 7) Configura Malga
  malgaCheckout.transactionConfig.orderId = String(realOrderId);
  malgaCheckout.transactionConfig.amount  = amountCents;

  // Montar "customer"
  malgaCheckout.transactionConfig.customer = {
    name:  `${t.firstName} ${t.lastName}`,
    email: t.email,
    phoneNumber: t.celular,
    document: {
      type: "CPF",
      number: t.cpf,
      country: "BR"
    },
    address: {
      zipCode:      document.getElementById("cep")?.value || "",
      street:       document.getElementById("address")?.value || "",
      streetNumber: document.getElementById("number")?.value  || "S/N",
      complement:   "",
      neighborhood: "",
      city:         document.getElementById("city")?.value    || "",
      state:        document.getElementById("state")?.value   || "",
      country:      "BR"
    }
  };

  // Ajusta itens do PIX e BOLETO
  malgaCheckout.paymentMethods.pix.items[0].unitPrice    = amountCents;
  malgaCheckout.paymentMethods.boleto.items[0].unitPrice = amountCents;

  // 8) Step 3
  p(3);
}

/************************************************************
 * 11) EVENTO LOAD => INICIALIZA TUDO
 ************************************************************/
window.addEventListener("load", () => {
  // 1) Carrega carrinho e exibe
  loadCart();
  updateCartSummary(m);

  // 2) Máscaras + Login
  setupMasksAndLogin();

  // 3) Modal Passageiros Extras
  setupPassengersModal();

  // 4) Step 1 -> Step 2
  const btnToStep2 = document.getElementById("toStep2");
  btnToStep2?.addEventListener("click", () => {
    // Se não tiver agentId, verifica campos de registro
    if (!localStorage.getItem("agentId")) {
      if (
        !document.getElementById("firstName").value      ||
        !document.getElementById("lastName").value       ||
        !document.getElementById("celular").value        ||
        !document.getElementById("email").value          ||
        !document.getElementById("password").value       ||
        !document.getElementById("confirmPassword").value
      ) {
        alert("Por favor, preencha todos os campos obrigatórios (Nome, E-mail, Senha...)");
        return;
      }
      // Armazena no t
      t.firstName       = document.getElementById("firstName").value;
      t.lastName        = document.getElementById("lastName").value;
      t.celular         = document.getElementById("celular").value;
      t.email           = document.getElementById("email").value;
      t.password        = document.getElementById("password").value;
      t.confirmPassword = document.getElementById("confirmPassword").value;
    }

    // Verifica campos doc/endereço
    if (
      !document.getElementById("cpf").value       ||
      !document.getElementById("rg").value        ||
      !document.getElementById("birthdate").value ||
      !document.getElementById("cep").value       ||
      !document.getElementById("state").value     ||
      !document.getElementById("city").value      ||
      !document.getElementById("address").value   ||
      !document.getElementById("number").value
    ) {
      alert("Por favor, preencha os campos de documento e endereço.");
      return;
    }

    // Copiamos doc/endereço para t
    t.cpf       = document.getElementById("cpf").value;
    t.rg        = document.getElementById("rg").value;
    t.birthdate = document.getElementById("birthdate").value;
    t.cep       = document.getElementById("cep").value;
    t.state     = document.getElementById("state").value;
    t.city      = document.getElementById("city").value;
    t.address   = document.getElementById("address").value;
    t.number    = document.getElementById("number").value;

    // Avança Step 2
    p(2);
  });

  // 5) Step 2 -> Step 3 (UNIFICA)
  const btnToStep3 = document.getElementById("toStep3");
  btnToStep3?.addEventListener("click", () => {
    step2ToStep3(); // Chama a função que cria o pedido e configura Malga
  });

  // 6) Step 2 -> Step 1 (Voltar)
  const btnBackToStep1 = document.getElementById("backToStep1");
  btnBackToStep1?.addEventListener("click", () => p(1));

  // 7) Step 3 -> Step 2 (Voltar)
  const btnBackToStep2 = document.getElementById("backToStep2");
  btnBackToStep2?.addEventListener("click", () => p(2));

  // 8) Se já estiver logado => oculta forms
  const hasAgentId = !!localStorage.getItem("agentId");
  const toggleLoginLink = document.getElementById("toggleLogin");
  const regFields       = document.getElementById("registrationFieldsGeneral");
  const loginFields     = document.getElementById("loginFields");

  if (hasAgentId) {
    if (toggleLoginLink) toggleLoginLink.style.display = "none";
    if (regFields)       regFields.style.display       = "none";
    if (loginFields)     loginFields.style.display     = "none";
  } else {
    if (toggleLoginLink) toggleLoginLink.style.display = "block";
    if (regFields)       regFields.style.display       = "block";
  }

  // Inicia no Step 1
  p(1);
});

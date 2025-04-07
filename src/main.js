/******************************************************
 *  1) Função de Navegação de Steps (window.p)
 ******************************************************/
window.p = function(stepNum) {
  const stepContents = document.querySelectorAll(".step-content");
  const stepsMenu    = document.querySelectorAll(".steps-menu .step");

  stepContents.forEach(sc => {
    sc.classList.toggle("active", sc.dataset.step === String(stepNum));
  });

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

/******************************************************
 *  2) Objetos Globais e Variáveis
 ******************************************************/
// Objeto "t" contendo dados do passageiro principal (e info de seguro, etc.)
let t = {
  extraPassengers: [],
  insuranceSelected: "none",
  insuranceCost: 0,

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
  number: ""
};

// Array do carrinho
let m = [];

/******************************************************
 *  3) Carrega Carrinho + Exibir Resumo (coluna direita)
 ******************************************************/
function loadCart() {
  const cartEl = document.getElementById("shoppingCart");
  if (cartEl && cartEl.items && cartEl.items.length > 0) {
    // Se <shopping-cart> tiver .items
    m = cartEl.items;
    console.log("DEBUG - <shopping-cart> com items =>", m);
  } else {
    // Caso contrário, tenta localStorage
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
  // Expondo globalmente, caso alguma lógica externa precise
  window.u = m;
}

function updateCartSummary(arr) {
  const cartItemsList = document.getElementById("cartItemsList");
  if (!cartItemsList) return;

  let total = 0;
  let htmlStr = "";

  arr.forEach(item => {
    const basePrice = item.basePriceAdult || 80;
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

  if (t.insuranceCost) {
    total += t.insuranceCost;
  }

  cartItemsList.innerHTML = htmlStr;

  const subtEl = document.getElementById("subtotalValue");
  const discEl = document.getElementById("discountValue");
  const totlEl = document.getElementById("totalValue");
  if (subtEl) subtEl.textContent = "R$ " + total.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  if (discEl) discEl.textContent = "- R$ 0,00";
  if (totlEl) totlEl.textContent = "R$ " + total.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

/******************************************************
 *  4) Modal de Passageiros Extras
 ******************************************************/
function showPassengersModal(arr) {
  const container = document.getElementById("modalPassengerContainer");
  const copyBtn   = document.getElementById("copyForAllBtn");
  if (!container) return;

  container.innerHTML = "";
  t.extraPassengers   = [];
  let multiItemsCount = 0;

  arr.forEach((item, idx) => {
    // Ex.: se item.adults=2 => 1 extra. Se 3 => 2 extras
    const extras = (item.adults || 1) - 1;
    if (extras > 0) {
      multiItemsCount++;
      t.extraPassengers[idx] = [];

      const passBox = document.createElement("div");
      passBox.classList.add("passenger-box");
      passBox.innerHTML = `<h4>${item.hotelName || "Item"}</h4>`;

      for (let p = 0; p < extras; p++) {
        const fields = document.createElement("div");
        fields.classList.add("fields-grid-2cols-modal");
        fields.innerHTML = `
          <div class="form-field">
            <label>Nome do Passageiro #${p + 1}</label>
            <input
              type="text"
              placeholder="Nome completo"
              data-item-index="${idx}"
              data-passenger-index="${p}"
              class="modalExtraNameInput"
            />
          </div>
          <div class="form-field">
            <label>Data de Nascimento</label>
            <input
              type="date"
              data-item-index="${idx}"
              data-passenger-index="${p}"
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
    copyBtn.style.display = (multiItemsCount > 1) ? "inline-block" : "none";
  }
}

function setupPassengersModal() {
  const modal         = document.getElementById("passengerModal");
  const openModalBtn  = document.getElementById("openPassengerModal");
  const closeModalBtn = document.getElementById("closeModal");
  const saveBtn       = document.getElementById("savePassengersBtn");
  const copyBtn       = document.getElementById("copyForAllBtn");
  const container     = document.getElementById("modalPassengerContainer");

  if (!modal) return;

  openModalBtn?.addEventListener("click", (evt) => {
    evt.preventDefault();
    showPassengersModal(m);
    modal.style.display = "block";
  });

  closeModalBtn?.addEventListener("click", () => {
    modal.style.display = "none";
  });

  saveBtn?.addEventListener("click", () => {
    modal.style.display = "none";
    alert("Passageiros extras salvos!");
  });

  copyBtn?.addEventListener("click", () => {
    let firstIndex = null;
    let extraCount = 0;

    // Acha primeiro item c/ multiple adults
    for (let i = 0; i < m.length; i++) {
      const needed = (m[i].adults || 1) - 1;
      if (needed > 0) {
        firstIndex = i;
        extraCount = needed;
        break;
      }
    }
    if (firstIndex === null) return;

    const firstArr = t.extraPassengers[firstIndex] || [];
    for (let j = 0; j < m.length; j++) {
      if (j !== firstIndex) {
        const needed = (m[j].adults || 1) - 1;
        if (needed === extraCount && needed > 0) {
          t.extraPassengers[j] = JSON.parse(JSON.stringify(firstArr));
          // Atualiza inputs
          for (let p = 0; p < needed; p++) {
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

  // Quando usuário digitar no modal
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

/******************************************************
 *  5) Navegação Steps (1->2->3->4) + Insurance
 ******************************************************/
function setupStepsNavigation() {
  const btnToStep2  = document.getElementById("toStep2");
  const btnBack1    = document.getElementById("backToStep1");
  const btnToStep3  = document.getElementById("toStep3");
  const btnBack2    = document.getElementById("backToStep2");

  // Step 1 -> Step 2
  btnToStep2?.addEventListener("click", () => {
    // Se não tiver agentId, exige campos
    if (!localStorage.getItem("agentId")) {
      if (
        !document.getElementById("firstName").value ||
        !document.getElementById("lastName").value  ||
        !document.getElementById("celular").value   ||
        !document.getElementById("email").value     ||
        !document.getElementById("password").value  ||
        !document.getElementById("confirmPassword").value
      ) {
        alert("Por favor, preencha todos os campos obrigatórios antes de continuar.");
        return;
      }
      // Copia para t
      t.firstName       = document.getElementById("firstName").value;
      t.lastName        = document.getElementById("lastName").value;
      t.celular         = document.getElementById("celular").value;
      t.email           = document.getElementById("email").value;
      t.password        = document.getElementById("password").value;
      t.confirmPassword = document.getElementById("confirmPassword").value;
    }

    // Documentos/Endereço
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
      alert("Por favor, preencha todos os campos obrigatórios antes de continuar.");
      return;
    }

    // Salva docs/endereço
    t.cpf       = document.getElementById("cpf").value;
    t.rg        = document.getElementById("rg").value;
    t.birthdate = document.getElementById("birthdate").value;
    t.cep       = document.getElementById("cep").value;
    t.state     = document.getElementById("state").value;
    t.city      = document.getElementById("city").value;
    t.address   = document.getElementById("address").value;
    t.number    = document.getElementById("number").value;

    // Avança Step
    p(2);
  });

  // Step 2 -> Step 1
  btnBack1?.addEventListener("click", () => p(1));

  // Step 2 -> Step 3
  btnToStep3?.addEventListener("click", () => {
    const sel = document.querySelector('input[name="insuranceOption"]:checked');
    t.insuranceSelected = sel ? sel.value : "none";

    let cost = 0;
    if (t.insuranceSelected === "essencial") {
      cost = 60.65;
    } else if (t.insuranceSelected === "completo") {
      cost = 101.09;
    }
    t.insuranceCost = cost;

    // Recalcular total
    updateCartSummary(m);

    // Avança p/ Step 3
    p(3);
  });

  // Step 3 -> Step 2
  btnBack2?.addEventListener("click", () => p(2));
}

/******************************************************
 *  6) Máscaras CEP, CPF, RG + Lógica de Login
 ******************************************************/
function setupMasksAndLogin() {
  // CEP
  function fetchCep(val) {
    val = val.replace(/\D/g, "");
    if (val.length === 8) {
      fetch(`https://viacep.com.br/ws/${val}/json/`)
        .then(r => r.json())
        .then(data => {
          if (data.erro) {
            alert("CEP não encontrado!");
            return;
          }
          document.getElementById("address").value = data.logradouro || "";
          document.getElementById("city").value    = data.localidade || "";
          document.getElementById("state").value   = data.uf || "";
        })
        .catch(err => {
          console.error("Erro ao buscar CEP:", err);
          alert("Não foi possível consultar o CEP.");
        });
    }
  }

  const cepEl = document.getElementById("cep");
  cepEl?.addEventListener("blur", function() {
    fetchCep(this.value);
  });

  // CPF
  const cpfEl = document.getElementById("cpf");
  cpfEl?.addEventListener("input", (evt) => {
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
  const rgEl = document.getElementById("rg");
  rgEl?.addEventListener("input", (evt) => {
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

  // Toggle login
  const toggleLoginLink = document.getElementById("toggleLogin");
  const regDiv          = document.getElementById("registrationFieldsGeneral");
  const loginDiv        = document.getElementById("loginFields");

  toggleLoginLink?.addEventListener("click", (evt) => {
    evt.preventDefault();
    if (regDiv.style.display !== "none") {
      regDiv.style.display = "none";
      loginDiv.style.display = "block";
      toggleLoginLink.textContent = "Não tenho Login";
    } else {
      regDiv.style.display = "block";
      loginDiv.style.display = "none";
      toggleLoginLink.textContent = "Economize tempo fazendo Login";
    }
  });

  // Botão Login
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

          if (toggleLoginLink) toggleLoginLink.style.display = "none";
          if (regDiv)          regDiv.style.display          = "none";
          if (loginDiv)        loginDiv.style.display        = "none";
        } else {
          alert("Erro no login: " + (resp.error || "Dados inválidos."));
        }
      })
      .catch(err => {
        console.error("Erro ao realizar o login:", err);
        alert("Erro ao realizar o login. Tente novamente.");
      });
  });
}

/******************************************************
 *  7) Funções p/ Criar Pedido e Configurar Malga
 ******************************************************/
// ALERTAS:
function showAlertSuccess(msg) {
  // Você pode usar a mesma função feita acima, se preferir
  console.log("showAlertSuccess:", msg);
  alert(msg);
}
function showAlertError(msg) {
  console.error("showAlertError:", msg);
  alert("Erro: " + msg);
}

// Cria pedido no banco (status = "pending")
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
    return data.orderId; // Retorna ID real do pedido
  } catch (error) {
    console.error("Erro em initOrderInDb:", error);
    throw error;
  }
}

// Configura Malga
const malgaCheckout = document.querySelector("#malga-checkout");
let finalAmount = 0;

if (malgaCheckout) {
  malgaCheckout.paymentMethods = {
    pix: {
      expiresIn: 600,
      items: [
        { id: "pixItemABC", title: "Produto Pix", quantity: 1, unitPrice: 0 }
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
        { id: "boletoItemABC", title: "Produto Boleto", quantity: 1, unitPrice: 0 }
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

  // Desativa popup do Malga
  malgaCheckout.dialogConfig = {
    show: false,
    actionButtonLabel: "Continuar",
    errorActionButtonLabel: "Tentar novamente",
    successActionButtonLabel: "Continuar",
    successRedirectUrl: "",
    pixFilledProgressBarColor: "#2FAC9B",
    pixEmptyProgressBarColor: "#D8DFF0"
  };

  // EVENTO: paymentSuccess
  malgaCheckout.addEventListener("paymentSuccess", async (event) => {
    console.log("Pagamento concluído com sucesso:", event.detail);

    const cardId   = event.detail.data.paymentSource?.cardId;
    const meioPgto = event.detail.data.paymentMethod.paymentType || "desconhecido";
    const parcelas = event.detail.data.paymentMethod.installments || 1;

    // Pega brand e holderName
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

    // Monta objeto de update
    const realOrderId = localStorage.getItem('myRealOrderId') || malgaCheckout.transactionConfig.orderId;
    const dataToUpdate = {
      status: "pago",
      nome_comprador:  holderVal,
      bandeira_cartao: brandVal,
      meio_pgto: meioPgto,
      parcelas,
      valor_venda: finalAmount / 100,  // se finalAmount for em cents
      data_pgto: new Date().toISOString().slice(0,10),
      gateway: "Malga"
    };

    // POST /api/orderComplete
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

      showAlertSuccess(`Pedido #${realOrderId} marcado como pago!`);
      console.log("Pedido atualizado (pago):", result.updatedData);

      // Step 4 - Mensagem final
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

  // EVENTO: paymentFailed
  malgaCheckout.addEventListener("paymentFailed", async (event) => {
    console.log("Falha no pagamento:", event.detail);

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

    showAlertError("Pagamento falhou! Verifique o console.");
  });
}

/******************************************************
 *  8) Ao Carregar (window.load) => Disparar tudo
 ******************************************************/
window.addEventListener("load", () => {
  // 1) Carregar carrinho (m)
  loadCart();

  // 2) Atualiza resumo do carrinho
  updateCartSummary(m);

  // 3) Configura máscaras e login
  setupMasksAndLogin();

  // 4) Navegação steps
  setupStepsNavigation();

  // 5) Modal de passageiros extras
  setupPassengersModal();

  // Se já houver agentId, esconde forms
  const hasAgent = !!localStorage.getItem("agentId");
  const togLink  = document.getElementById("toggleLogin");
  const regF     = document.getElementById("registrationFieldsGeneral");
  const logF     = document.getElementById("loginFields");

  if (hasAgent) {
    if (togLink) togLink.style.display   = "none";
    if (regF)    regF.style.display     = "none";
    if (logF)    logF.style.display     = "none";
  } else {
    if (togLink) togLink.style.display  = "block";
    if (regF)    regF.style.display     = "block";
  }

  // Começa no step 1
  p(1);
});

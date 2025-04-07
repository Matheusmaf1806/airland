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
// Objeto "t" contendo dados do passageiro principal + insurance + etc.
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
    m = cartEl.items;
    console.log("DEBUG - <shopping-cart> com items =>", m);
  } else {
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
 *  5) Máscaras CEP, CPF, RG + Lógica de Login
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

  document.getElementById("cep")?.addEventListener("blur", function() {
    fetchCep(this.value);
  });

  // CPF
  document.getElementById("cpf")?.addEventListener("input", (evt) => {
    let val = evt.target.value.replace(/\D/g, "");
    if (val.length > 3)  val = val.replace(/^(\d{3})(\d)/, "$1.$2");
    if (val.length > 6)  val = val.replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3");
    if (val.length > 9)  val = val.replace(/(\d{3})\.(\d{3})\.(\d{3})(\d{1,2}).*/, "$1.$2.$3-$4");
    evt.target.value = val;
  });

  // RG
  document.getElementById("rg")?.addEventListener("input", (evt) => {
    let val = evt.target.value.replace(/\D/g, "");
    if (val.length > 2)  val = val.replace(/^(\d{2})(\d)/, "$1.$2");
    if (val.length > 5)  val = val.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    if (val.length > 7)  val = val.replace(/(\d{2})\.(\d{3})\.(\d{3})(\d{1}).*/, "$1.$2.$3-$4");
    evt.target.value = val;
  });

  // Toggle Login
  const toggleLink = document.getElementById("toggleLogin");
  const regDiv     = document.getElementById("registrationFieldsGeneral");
  const loginDiv   = document.getElementById("loginFields");

  toggleLink?.addEventListener("click", (evt) => {
    evt.preventDefault();
    if (regDiv?.style.display !== "none") {
      regDiv.style.display  = "none";
      loginDiv.style.display= "block";
      toggleLink.textContent = "Não tenho Login";
    } else {
      regDiv.style.display  = "block";
      loginDiv.style.display= "none";
      toggleLink.textContent = "Economize tempo fazendo Login";
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

          if (toggleLink) toggleLink.style.display = "none";
          if (regDiv)     regDiv.style.display     = "none";
          if (loginDiv)   loginDiv.style.display   = "none";
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
 *  6) Lendo dados do Step 1 e calculando total
 ******************************************************/
function readUserDataFromStep1() {
  const agentId         = localStorage.getItem("agentId")      || "";
  const storedFirstName = localStorage.getItem("userFirstName")|| "";
  const storedLastName  = localStorage.getItem("userLastName") || "";
  const storedEmail     = localStorage.getItem("userEmail")    || "";
  const storedPhone     = localStorage.getItem("userPhone")    || "";

  const formFirstName   = document.getElementById("firstName").value.trim();
  const formLastName    = document.getElementById("lastName") .value.trim();
  const formCelular     = document.getElementById("celular")  .value.trim();
  const formEmail       = document.getElementById("email")    .value.trim();
  const formCpf         = document.getElementById("cpf")      .value.replace(/\D/g, "");
  const formBirthdate   = document.getElementById("birthdate").value.trim();
  const formState       = document.getElementById("state")    .value.trim();
  const formCity        = document.getElementById("city")     .value.trim();
  const formAddress     = document.getElementById("address")  .value.trim();
  const formNumber      = document.getElementById("number")   .value.trim();

  if (agentId) {
    // Se o usuário já estiver logado, só sobrescrevemos caso os campos do form não estejam preenchidos
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

/******************************************************
 *  7) Criar Pedido e Configurar Malga p/ Step 3
 ******************************************************/
async function doStep2toStep3() {
  // 1) Lê dados do step1
  readUserDataFromStep1();

  // 2) Descobre qual seguro foi escolhido
  const sel = document.querySelector('input[name="insuranceOption"]:checked');
  t.insuranceSelected = sel ? sel.value : "none";

  let cost = 0;
  if (t.insuranceSelected === "essencial") {
    cost = 60.65;
  } else if (t.insuranceSelected === "completo") {
    cost = 101.09;
  }
  t.insuranceCost = cost;

  // 3) Recalcula total do carrinho (para refletir cost)
  updateCartSummary(m);

  // 4) Pega valor do #totalValue
  const finalAmountInCents = getCartAmountInCents();
  if (finalAmountInCents <= 0) {
    alert("Valor do pedido não pode ser 0!");
    return;
  }
  if (!t.email || !t.email.includes("@")) {
    alert("E-mail inválido.");
    return;
  }

  // 5) Marcamos affiliate etc. (caso queira)
  m.forEach(item => {
    item.affiliateId = 101;
    item.geradoPor   = localStorage.getItem("cartOwnerId") || "System";
  });

  console.log("DEBUG - cart =>", m);

  // 6) Criar pedido no banco
  let realOrderId;
  try {
    realOrderId = await initOrderInDb(m, t);
    localStorage.setItem("myRealOrderId", realOrderId);
    console.log("Pedido pendente criado. ID=", realOrderId);
  } catch (err) {
    alert("Falha ao criar pedido no banco: " + err.message);
    return;
  }

  // 7) Configura Malga Checkout
  malgaCheckout.transactionConfig.orderId = String(realOrderId);
  malgaCheckout.transactionConfig.amount  = finalAmountInCents;

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
      zipCode:      document.getElementById("cep").value    || "",
      street:       document.getElementById("address").value|| "",
      streetNumber: document.getElementById("number").value || "S/N",
      complement:   "",
      neighborhood: "",
      city:         document.getElementById("city").value   || "",
      state:        document.getElementById("state").value  || "",
      country: "BR"
    }
  };

  // Ajustar itens do PIX e BOLETO
  malgaCheckout.paymentMethods.pix .items[0].unitPrice    = finalAmountInCents;
  malgaCheckout.paymentMethods.boleto.items[0].unitPrice = finalAmountInCents;

  // 8) Agora sim avança p/ Step 3
  p(3);
}

/******************************************************
 *  8) onload => Setup
 ******************************************************/
window.addEventListener("load", () => {
  // 1) Carrega carrinho (m) e exibe na direita
  loadCart();
  updateCartSummary(m);

  // 2) Máscaras + Login
  setupMasksAndLogin();

  // 3) Modal de passageiros extras
  setupPassengersModal();

  // 4) Step 1 -> Step 2
  const btnToStep2 = document.getElementById("toStep2");
  btnToStep2?.addEventListener("click", () => {
    // Se não tiver agentId, confere campos...
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
      // Guarda no objeto t
      t.firstName       = document.getElementById("firstName").value;
      t.lastName        = document.getElementById("lastName").value;
      t.celular         = document.getElementById("celular").value;
      t.email           = document.getElementById("email").value;
      t.password        = document.getElementById("password").value;
      t.confirmPassword = document.getElementById("confirmPassword").value;
    }

    // Campos doc/endereço
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
    // Armazena doc/endereço
    t.cpf       = document.getElementById("cpf").value;
    t.rg        = document.getElementById("rg").value;
    t.birthdate = document.getElementById("birthdate").value;
    t.cep       = document.getElementById("cep").value;
    t.state     = document.getElementById("state").value;
    t.city      = document.getElementById("city").value;
    t.address   = document.getElementById("address").value;
    t.number    = document.getElementById("number").value;

    p(2);
  });

  // 5) Step 2 -> Step 3 (UNIFICADO)
  const btnToStep3 = document.getElementById("toStep3");
  btnToStep3?.addEventListener("click", () => {
    doStep2toStep3();  // <-- chama a lógica unificada
  });

  // 6) Step 2 -> Step 1 (Voltar)
  const btnBack1 = document.getElementById("backToStep1");
  btnBack1?.addEventListener("click", () => p(1));

  // 7) Step 3 -> Step 2 (Voltar)
  const btnBack2 = document.getElementById("backToStep2");
  btnBack2?.addEventListener("click", () => p(2));

  // 8) Se já houver agentId, esconde forms
  const hasAgent = !!localStorage.getItem("agentId");
  const toggleLoginLink = document.getElementById("toggleLogin");
  const regFields       = document.getElementById("registrationFieldsGeneral");
  const loginFields     = document.getElementById("loginFields");

  if (hasAgent) {
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

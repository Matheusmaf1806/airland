/***********************************************************
 * 1) CONTROLE DE STEPS – window.p
 ***********************************************************/
window.p = function (stepNumber) {
  const stepContents = document.querySelectorAll(".step-content");
  const stepsMenu    = document.querySelectorAll(".steps-menu .step");

  // Mostra/esconde cada step via data-step
  stepContents.forEach((content) => {
    content.classList.toggle("active", content.dataset.step === String(stepNumber));
  });

  // Atualiza os botões (bolinhas) do menu de steps
  stepsMenu.forEach((el) => {
    const sNum = parseInt(el.dataset.step, 10);
    el.classList.toggle("active", sNum === stepNumber);
    if (sNum > stepNumber) {
      el.classList.add("disabled");
    } else {
      el.classList.remove("disabled");
    }
  });
};

/***********************************************************
 * 2) OBJETOS GLOBAIS: Passageiro Principal (t) e Carrinho (m)
 ***********************************************************/
let t = {
  extraPassengers:   [],
  insuranceSelected: "none",
  firstName:         "",
  lastName:          "",
  celular:           "",
  email:             "",
  password:          "",
  confirmPassword:   "",
  cpf:               "",
  rg:                "",
  birthdate:         "",
  cep:               "",
  state:             "",
  city:              "",
  address:           "",
  number:            "",
  insuranceCost:     0,
};

let m = []; // Array de itens do carrinho

/***********************************************************
 * 3) FUNÇÕES DE ALERTA
 ***********************************************************/
function showAlertSuccess(message) {
  const alertContainer = document.getElementById("alertContainer");
  if (!alertContainer) return;
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
      <p style="margin-top: 0.5rem;">${message}</p>
    </div>
  `;
}

function showAlertError(message) {
  const alertContainer = document.getElementById("alertContainer");
  if (!alertContainer) return;
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

/***********************************************************
 * 4) CARREGA CARRINHO (LOCALSTORAGE OU <shopping-cart>)
 ***********************************************************/
function B() {
  const shoppingEl = document.getElementById("shoppingCart");
  if (shoppingEl && shoppingEl.items && shoppingEl.items.length > 0) {
    m = shoppingEl.items;
    console.log("DEBUG - <shopping-cart> com items =>", m);
  } else {
    const stored = localStorage.getItem("cartItems");
    if (stored) {
      try {
        m = JSON.parse(stored);
        console.log("DEBUG - Carregando do localStorage =>", m);
      } catch (e) {
        console.warn("Erro ao fazer JSON.parse em cartItems:", e);
        m = [];
      }
    } else {
      m = [];
      console.log("Carrinho vazio - sem itens de exemplo");
    }
  }
  // Expõe globalmente para uso no checkout
  window.u = m;
}

/***********************************************************
 * 5) ATUALIZA RESUMO DO CARRINHO NA COLUNA DIREITA
 ***********************************************************/
function f(arr) {
  const cartItemsList = document.getElementById("cartItemsList");
  if (!cartItemsList) return;
  let total = 0;
  let htmlStr = "";

  arr.forEach((item) => {
    const basePrice = item.basePriceAdult || 80;
    total += basePrice;
    htmlStr += `
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
          R$ ${basePrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </div>
      </div>
    `;
  });
  if (t.insuranceCost) total += t.insuranceCost;
  cartItemsList.innerHTML = htmlStr;
  document.getElementById("subtotalValue").textContent = "R$ " + total.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  document.getElementById("discountValue").textContent = "- R$ 0,00";
  document.getElementById("totalValue").textContent = "R$ " + total.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

/***********************************************************
 * 6) MODAL DE PASSAGEIROS EXTRAS
 ***********************************************************/
function h(arr) {
  const passengerContainer = document.getElementById("modalPassengerContainer");
  const copyForAllBtn      = document.getElementById("copyForAllBtn");
  if (!passengerContainer || !copyForAllBtn) return;
  passengerContainer.innerHTML = "";
  t.extraPassengers = [];
  let countOfMulti = 0;
  arr.forEach((item, idx) => {
    const extraCount = (item.adults || 1) - 1;
    if (extraCount > 0) {
      countOfMulti++;
      t.extraPassengers[idx] = [];
      const passengerBox = document.createElement("div");
      passengerBox.classList.add("passenger-box");
      passengerBox.innerHTML = `<h4>${item.hotelName || "Item"}</h4>`;
      for (let p = 0; p < extraCount; p++) {
        const fields = document.createElement("div");
        fields.classList.add("fields-grid-2cols-modal");
        fields.innerHTML = `
          <div class="form-field">
            <label>Nome do Passageiro #${p + 1}</label>
            <input type="text" placeholder="Nome completo" data-item-index="${idx}" data-passenger-index="${p}" class="modalExtraNameInput" />
          </div>
          <div class="form-field">
            <label>Data de Nascimento</label>
            <input type="date" data-item-index="${idx}" data-passenger-index="${p}" class="modalExtraBirthdateInput" />
          </div>
        `;
        passengerBox.appendChild(fields);
      }
      passengerContainer.appendChild(passengerBox);
    }
  });
  copyForAllBtn.style.display = countOfMulti > 1 ? "inline-block" : "none";
}

/***********************************************************
 * 7) ABRIR/FECHAR MODAL E EVENTOS DE PASSAGEIROS EXTRAS
 ***********************************************************/
function x() {
  const passengerModal    = document.getElementById("passengerModal");
  const openModalBtn      = document.getElementById("openPassengerModal");
  const closeModalBtn     = document.getElementById("closeModal");
  const savePassengersBtn = document.getElementById("savePassengersBtn");
  const copyForAllBtn     = document.getElementById("copyForAllBtn");
  const modalContainer    = document.getElementById("modalPassengerContainer");
  if (!passengerModal || !openModalBtn) return;
  openModalBtn.addEventListener("click", (evt) => {
    evt.preventDefault();
    h(m);
    passengerModal.style.display = "block";
  });
  closeModalBtn.addEventListener("click", () => {
    passengerModal.style.display = "none";
  });
  savePassengersBtn.addEventListener("click", () => {
    passengerModal.style.display = "none";
    alert("Passageiros extras salvos!");
  });
  copyForAllBtn.addEventListener("click", () => {
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
    for (let i = 0; i < m.length; i++) {
      if (i !== firstIndex) {
        const needed = (m[i].adults || 1) - 1;
        if (needed === extraCount && needed > 0) {
          t.extraPassengers[i] = JSON.parse(JSON.stringify(firstArr));
          for (let p = 0; p < needed; p++) {
            const selName = `.modalExtraNameInput[data-item-index="${i}"][data-passenger-index="${p}"]`;
            const selBD   = `.modalExtraBirthdateInput[data-item-index="${i}"][data-passenger-index="${p}"]`;
            const elName  = document.querySelector(selName);
            const elBD    = document.querySelector(selBD);
            if (elName && elBD && t.extraPassengers[i][p]) {
              elName.value = t.extraPassengers[i][p].name || "";
              elBD.value   = t.extraPassengers[i][p].birthdate || "";
            }
          }
        }
      }
    }
    alert("Dados copiados para todos os itens compatíveis!");
  });
  modalContainer.addEventListener("input", (evt) => {
    const el = evt.target;
    if (el.classList.contains("modalExtraNameInput") || el.classList.contains("modalExtraBirthdateInput")) {
      const itemIndex = parseInt(el.getAttribute("data-item-index"), 10);
      const passIndex = parseInt(el.getAttribute("data-passenger-index"), 10);
      if (!t.extraPassengers[itemIndex]) t.extraPassengers[itemIndex] = [];
      if (!t.extraPassengers[itemIndex][passIndex]) t.extraPassengers[itemIndex][passIndex] = {};
      if (el.classList.contains("modalExtraNameInput")) {
        t.extraPassengers[itemIndex][passIndex].name = el.value;
      } else {
        t.extraPassengers[itemIndex][passIndex].birthdate = el.value;
      }
    }
  });
}

/***********************************************************
 * 8) EVENTOS DE NAVEGAÇÃO ENTRE STEPS – navigationEvents
 ***********************************************************/
function navigationEvents() {
  const toStep2Btn  = document.getElementById("toStep2");
  const backToStep1 = document.getElementById("backToStep1");
  const toStep3Btn  = document.getElementById("toStep3");
  const backToStep2 = document.getElementById("backToStep2");

  // Step 1 -> Step 2
  if (toStep2Btn) {
    toStep2Btn.addEventListener("click", () => {
      // Se não logado, checa campos obrigatórios de registro
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
        t.firstName       = document.getElementById("firstName").value;
        t.lastName        = document.getElementById("lastName").value;
        t.celular         = document.getElementById("celular").value;
        t.email           = document.getElementById("email").value;
        t.password        = document.getElementById("password").value;
        t.confirmPassword = document.getElementById("confirmPassword").value;
      }
      // Checa campos de documentos/endereço
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
  }

  // Step 2 -> Step 1 (Voltar)
  if (backToStep1) {
    backToStep1.addEventListener("click", () => p(1));
  }

  // Step 2 -> Step 3
  if (toStep3Btn) {
    toStep3Btn.addEventListener("click", async () => {
      // Atualiza dados do step 1
      readUserDataFromStep1();
      // Verifica qual seguro foi selecionado
      const selectedRadio = document.querySelector('input[name="insuranceOption"]:checked');
      t.insuranceSelected = selectedRadio ? selectedRadio.value : "none";
      let cost = 0;
      if (t.insuranceSelected === "essencial") cost = 60.65;
      else if (t.insuranceSelected === "completo") cost = 101.09;
      t.insuranceCost = cost;
      // Recalcula o resumo do carrinho
      f(m);
      // Lê o valor total atualizado e converte para centavos
      finalAmount = getCartAmountInCents();
      console.log("DEBUG - finalAmount =>", finalAmount);
      if (finalAmount <= 0) {
        showAlertError("Valor do pedido não pode ser 0!");
        return;
      }
      if (!t.email || !t.email.includes("@")) {
        showAlertError("E-mail inválido.");
        return;
      }
      // Marca cada item com affiliateId e geradoPor
      m.forEach(item => {
        item.affiliateId = 101;
        item.geradoPor   = localStorage.getItem("cartOwnerId") || "System";
      });
      console.log("DEBUG - cart =>", window.u);
      // Cria pedido no banco
      let realOrderId;
      try {
        realOrderId = await initOrderInDb(window.u, t);
        localStorage.setItem("myRealOrderId", realOrderId);
        console.log("Pedido pendente criado. ID=", realOrderId);
      } catch (err) {
        showAlertError("Falha ao criar pedido no banco: " + err.message);
        return;
      }
      // Configura MalgaCheckout
      malgaCheckout.transactionConfig.orderId = String(realOrderId);
      malgaCheckout.transactionConfig.amount  = finalAmount;
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
      // Ajusta os itens do PIX e BOLETO para o valor final
      malgaCheckout.paymentMethods.pix.items[0].unitPrice    = finalAmount;
      malgaCheckout.paymentMethods.boleto.items[0].unitPrice = finalAmount;
      // Avança para o step 3
      p(3);
    });
  }

  // Step 3 -> Step 2 (Voltar)
  if (backToStep2) {
    backToStep2.addEventListener("click", () => p(2));
  }
}

/***********************************************************
 * 9) MÁSCARAS (CEP, CPF, RG) E TOGGLE LOGIN
 ***********************************************************/
function b() {
  // Função de busca de CEP via ViaCEP
  function buscaCep(cepVal) {
    cepVal = cepVal.replace(/\D/g, "");
    if (cepVal.length === 8) {
      fetch(`https://viacep.com.br/ws/${cepVal}/json/`)
        .then((r) => r.json())
        .then((data) => {
          if (data.erro) {
            alert("CEP não encontrado!");
            return;
          }
          document.getElementById("address").value = data.logradouro || "";
          document.getElementById("city").value    = data.localidade || "";
          document.getElementById("state").value   = data.uf || "";
        })
        .catch((err) => {
          console.error("Erro ao buscar CEP:", err);
          alert("Não foi possível consultar o CEP.");
        });
    }
  }
  const cepInput = document.getElementById("cep");
  if (cepInput) {
    cepInput.addEventListener("blur", () => {
      buscaCep(cepInput.value);
    });
  }
  // Máscara para CPF
  const cpfInput = document.getElementById("cpf");
  if (cpfInput) {
    cpfInput.addEventListener("input", (evt) => {
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
  }
  // Máscara para RG
  const rgInput = document.getElementById("rg");
  if (rgInput) {
    rgInput.addEventListener("input", (evt) => {
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
  }
  // Toggle Login vs Registro
  const toggleLoginLink = document.getElementById("toggleLogin");
  const registrationDiv = document.getElementById("registrationFieldsGeneral");
  const loginDiv        = document.getElementById("loginFields");
  if (toggleLoginLink && registrationDiv && loginDiv) {
    toggleLoginLink.addEventListener("click", (evt) => {
      evt.preventDefault();
      if (registrationDiv.style.display !== "none") {
        registrationDiv.style.display = "none";
        loginDiv.style.display = "block";
        toggleLoginLink.textContent = "Não tenho Login";
      } else {
        registrationDiv.style.display = "block";
        loginDiv.style.display = "none";
        toggleLoginLink.textContent = "Economize tempo fazendo Login";
      }
    });
  }
  // Botão de login
  const loginValidateBtn = document.getElementById("loginValidateBtn");
  if (loginValidateBtn) {
    loginValidateBtn.addEventListener("click", () => {
      const emailVal = document.getElementById("loginEmail").value;
      const passVal  = document.getElementById("loginPassword").value;
      fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailVal, password: passVal }),
      })
        .then((resp) => resp.json())
        .then((json) => {
          if (json.success) {
            localStorage.setItem("agentId", json.user.id);
            alert("Login efetuado com sucesso!");
            if (toggleLoginLink) toggleLoginLink.style.display = "none";
            if (registrationDiv) registrationDiv.style.display = "none";
            if (loginDiv) loginDiv.style.display = "none";
          } else {
            alert("Erro no login: " + (json.error || "Dados inválidos."));
          }
        })
        .catch((err) => {
          console.error(err);
          alert("Erro ao realizar o login. Tente novamente.");
        });
    });
  }
}

/***********************************************************
 * 10) FUNÇÃO AUXILIAR: getCartAmountInCents (para Step 3)
 ***********************************************************/
function getCartAmountInCents() {
  const elTotal = document.getElementById("totalValue");
  if (!elTotal) return 0;
  const totalText = elTotal.textContent.trim(); // ex: "R$ 300,00"
  let numericStr = totalText.replace(/[^\d.,-]/g, "");
  numericStr = numericStr.replace(/\./g, "");
  numericStr = numericStr.replace(",", ".");
  const amount = parseFloat(numericStr);
  if (isNaN(amount)) return 0;
  return Math.round(amount * 100);
}

let finalAmount = 0;

/***********************************************************
 * 11) FUNÇÃO AUXILIAR: fetchProfileIfLoggedIn
 ***********************************************************/
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
    localStorage.setItem("userLastName", "");
    localStorage.setItem("userEmail", data.email || "");
    localStorage.setItem("userPhone", data.telefone || "");
  } catch (err) {
    console.error("Erro ao buscar perfil:", err);
  }
}

/***********************************************************
 * 12) FUNÇÃO AUXILIAR: readUserDataFromStep1
 ***********************************************************/
function readUserDataFromStep1() {
  const agentId         = localStorage.getItem("agentId") || "";
  const storedFirstName = localStorage.getItem("userFirstName") || "";
  const storedLastName  = localStorage.getItem("userLastName") || "";
  const storedEmail     = localStorage.getItem("userEmail") || "";
  const storedPhone     = localStorage.getItem("userPhone") || "";
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
  if (agentId) {
    t.firstName = formFirstName || storedFirstName;
    t.lastName  = formLastName || storedLastName;
    t.email     = formEmail || storedEmail;
    t.celular   = formCelular || storedPhone;
  } else {
    t.firstName = formFirstName;
    t.lastName  = formLastName;
    t.email     = formEmail;
    t.celular   = formCelular;
  }
  t.cpf = formCpf;
  t.birthdate = formBirthdate;
  t.state = formState;
}

/***********************************************************
 * 13) EVENTOS DE NAVEGAÇÃO ENTRE STEPS – navigationEvents
 ***********************************************************/
function navigationEvents() {
  const toStep2Btn  = document.getElementById("toStep2");
  const backToStep1 = document.getElementById("backToStep1");
  const toStep3Btn  = document.getElementById("toStep3");
  const backToStep2 = document.getElementById("backToStep2");

  // Step 1 -> Step 2
  if (toStep2Btn) {
    toStep2Btn.addEventListener("click", () => {
      // Se não estiver logado, valida campos de registro
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
        t.firstName       = document.getElementById("firstName").value;
        t.lastName        = document.getElementById("lastName").value;
        t.celular         = document.getElementById("celular").value;
        t.email           = document.getElementById("email").value;
        t.password        = document.getElementById("password").value;
        t.confirmPassword = document.getElementById("confirmPassword").value;
      }
      // Valida campos de documentos/endereço
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
  }

  // Step 2 -> Step 1 (Voltar)
  if (backToStep1) {
    backToStep1.addEventListener("click", () => p(1));
  }

  // Step 2 -> Step 3
  if (toStep3Btn) {
    toStep3Btn.addEventListener("click", async () => {
      readUserDataFromStep1();
      // Lê o seguro selecionado
      const selectedRadio = document.querySelector('input[name="insuranceOption"]:checked');
      t.insuranceSelected = selectedRadio ? selectedRadio.value : "none";
      let cost = 0;
      if (t.insuranceSelected === "essencial") cost = 60.65;
      else if (t.insuranceSelected === "completo") cost = 101.09;
      t.insuranceCost = cost;
      // Recalcula o carrinho (atualiza UI)
      f(m);
      // Lê o total atualizado e converte para centavos
      finalAmount = getCartAmountInCents();
      console.log("DEBUG - finalAmount =>", finalAmount);
      if (finalAmount <= 0) {
        showAlertError("Valor do pedido não pode ser 0!");
        return;
      }
      if (!t.email || !t.email.includes("@")) {
        showAlertError("E-mail inválido.");
        return;
      }
      // Marca cada item com affiliateId e geradoPor
      m.forEach(item => {
        item.affiliateId = 101;
        item.geradoPor   = localStorage.getItem("cartOwnerId") || "System";
      });
      console.log("DEBUG - cart =>", window.u);
      // Cria pedido no banco (status PENDING)
      let realOrderId;
      try {
        realOrderId = await initOrderInDb(window.u, t);
        localStorage.setItem("myRealOrderId", realOrderId);
        console.log("Pedido pendente criado. ID=", realOrderId);
      } catch (err) {
        showAlertError("Falha ao criar pedido no banco: " + err.message);
        return;
      }
      // Configura Malga Checkout
      malgaCheckout.transactionConfig.orderId = String(realOrderId);
      malgaCheckout.transactionConfig.amount  = finalAmount;
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
      malgaCheckout.paymentMethods.pix.items[0].unitPrice = finalAmount;
      malgaCheckout.paymentMethods.boleto.items[0].unitPrice = finalAmount;
      p(3);
    });
  }

  // Step 3 -> Step 2 (Voltar)
  if (backToStep2) {
    backToStep2.addEventListener("click", () => p(2));
  }
}

/***********************************************************
 * 14) EVENTOS DO MALGA CHECKOUT
 ***********************************************************/
if (document.querySelector("#malga-checkout")) {
  // Payment Success
  malgaCheckout.addEventListener("paymentSuccess", async (evt) => {
    console.log("Pagamento concluído com sucesso:", evt.detail);
    showAlertSuccess(""); // Limpa alert anterior

    const cardId = evt.detail.data.paymentSource?.cardId;
    const meioPgto = evt.detail.data.paymentMethod.paymentType || "desconhecido";
    const parcelas = evt.detail.data.paymentMethod.installments || 1;

    let brandVal = "desconhecido";
    let holderVal = "Nome do Cartão";
    if (cardId) {
      try {
        const cardResp = await fetch(`https://api.malga.io/v1/cards/${cardId}`, {
          method: "GET",
          headers: {
            "X-Client-Id": "4457c178-0f07-4589-ba0e-954e5816fd0f",
            "X-Api-Key": "bfabc953-1ea0-45d0-95e4-4968cfe2a00e",
          },
        });
        if (cardResp.ok) {
          const cardData = await cardResp.json();
          brandVal = cardData?.brand || brandVal;
          holderVal = cardData?.cardHolderName || holderVal;
        } else {
          console.warn("Falha ao obter brand /v1/cards", cardResp.status);
        }
      } catch (err) {
        console.error("Erro ao chamar /v1/cards:", err);
      }
    }

    const realOrderId = localStorage.getItem("myRealOrderId") || malgaCheckout.transactionConfig.orderId;
    const dataToUpdate = {
      status: "pago",
      nome_comprador: holderVal,
      bandeira_cartao: brandVal,
      meio_pgto: meioPgto,
      parcelas: parcelas,
      valor_venda: finalAmount / 100,
      data_pgto: new Date().toISOString().slice(0, 10),
      gateway: "Malga",
    };

    try {
      const resp = await fetch("/api/orderComplete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: realOrderId, dataToUpdate }),
      });
      const result = await resp.json();
      if (!result.success) {
        console.error("Erro ao atualizar pedido (pago):", result.message);
        showAlertError("Falha ao atualizar o pedido no banco.");
        return;
      }
      showAlertSuccess(`Success - Pedido #${realOrderId} marcado como pago!`);
      console.log("Pedido atualizado (pago):", result.updatedData);

      document.getElementById("finalTitle").textContent =
        `Parabéns ${t.firstName || "(nome)"} pela sua escolha!`;
      document.getElementById("finalMsg").textContent =
        `Seu pedido #${realOrderId} foi concluído com sucesso.`;
      document.getElementById("finalThanks").textContent =
        "Aproveite a viagem!";
      const rightCol = document.querySelector(".right-col");
      if (rightCol) rightCol.style.display = "none";
      p(4);
    } catch (error) {
      console.error("Exceção ao chamar /api/orderComplete:", error);
      showAlertError(`Exceção ao chamar orderComplete: ${error.message}`);
    }
  });

  // Payment Failed
  malgaCheckout.addEventListener("paymentFailed", async (evt) => {
    console.log("Falha no pagamento:", evt.detail);
    showAlertError("");
    const realOrderId = localStorage.getItem("myRealOrderId") || malgaCheckout.transactionConfig.orderId;
    try {
      await fetch("/api/orderComplete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: realOrderId,
          dataToUpdate: { status: "recusado" },
        }),
      });
    } catch (err) {
      console.error("Erro ao marcar pedido como recusado:", err);
    }
    showAlertError("Error - Pagamento falhou! Verifique o console.");
  });
}

/***********************************************************
 * 15) EVENTO: DOMContentLoaded E ONLOAD FINAL
 ***********************************************************/
window.addEventListener("DOMContentLoaded", async () => {
  await fetchProfileIfLoggedIn();
  const storedFirstName = localStorage.getItem("userFirstName") || "";
  const storedLastName = localStorage.getItem("userLastName") || "";
  const storedEmail = localStorage.getItem("userEmail") || "";
  const storedPhone = localStorage.getItem("userPhone") || "";
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

window.addEventListener("load", () => {
  B();
  f(m);
  b();
  navigationEvents();
  x();

  const hasAgent = !!localStorage.getItem("agentId");
  const toggleL = document.getElementById("toggleLogin");
  const regFields = document.getElementById("registrationFieldsGeneral");
  const loginF = document.getElementById("loginFields");
  if (hasAgent) {
    if (toggleL) toggleL.style.display = "none";
    if (regFields) regFields.style.display = "none";
    if (loginF) loginF.style.display = "none";
  } else {
    if (toggleL) toggleL.style.display = "block";
    if (regFields) regFields.style.display = "block";
  }
  p(1);
});

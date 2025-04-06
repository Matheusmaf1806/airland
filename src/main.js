// main.js

// Define função p(r) para mudar steps
window.p = function(r) {
  const stepContents = document.querySelectorAll(".step-content");
  const stepsMenu = document.querySelectorAll(".steps-menu .step");

  // Mostra stepContent r, esconde os outros
  stepContents.forEach(s => {
    s.classList.toggle("active", s.dataset.step === String(r));
  });

  // Bolinhas do menu
  stepsMenu.forEach(s => {
    const stepNum = parseInt(s.dataset.step, 10);
    s.classList.toggle("active", stepNum === r);
    if (stepNum > r) {
      s.classList.add("disabled");
    } else {
      s.classList.remove("disabled");
    }
  });
};

// Objeto de dados do user principal
let t = {
  extraPassengers: [],
  insuranceSelected: "none",
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
  insuranceCost: 0,
};

// Aqui é onde fica o carrinho
let m = [];

/** 
 * B() - Carrega itens do carrinho (de <shopping-cart> ou do localStorage).
 */
function B() {
  const shoppingCartEl = document.getElementById("shoppingCart");

  // Se <shopping-cart> tiver items
  if (shoppingCartEl && shoppingCartEl.items && shoppingCartEl.items.length > 0) {
    m = shoppingCartEl.items;
  } else {
    // Tenta localStorage
    const stored = localStorage.getItem("cartItems");
    if (stored) {
      m = JSON.parse(stored);
    } else {
      m = [];
      console.log("Carrinho vazio - sem itens de exemplo");
    }
  }

  // Expondo globalmente pra checkout.html
  window.u = m;
}

/**
 * v() - Desenha a coluna direita (resumo do carrinho)
 */
function v(items) {
  const cartItemsList = document.getElementById("cartItemsList");
  let total = 0;
  let htmlStr = "";

  items.forEach(item => {
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
          R$ ${basePrice.toLocaleString("pt-BR",{ minimumFractionDigits:2 })}
        </div>
      </div>
    `;
  });

  // Se tiver custo de seguro
  if (t.insuranceCost) {
    total += t.insuranceCost;
  }

  cartItemsList.innerHTML = htmlStr;

  document.getElementById("subtotalValue").textContent =
    "R$ " + total.toLocaleString("pt-BR",{ minimumFractionDigits:2 });
  document.getElementById("discountValue").textContent = "- R$ 0,00";
  document.getElementById("totalValue").textContent =
    "R$ " + total.toLocaleString("pt-BR",{ minimumFractionDigits:2 });
}

/**
 * h() - Prepara a listagem de passageiros extras (modal)
 */
function h(items) {
  const modalContainer = document.getElementById("modalPassengerContainer");
  const copyForAllBtn = document.getElementById("copyForAllBtn");
  modalContainer.innerHTML = "";

  t.extraPassengers = [];
  let multiCount = 0;

  items.forEach((it, idx) => {
    const extra = (it.adults || 1) - 1;
    if (extra > 0) {
      multiCount++;
      t.extraPassengers[idx] = [];

      const passBox = document.createElement("div");
      passBox.classList.add("passenger-box");
      passBox.innerHTML = `<h4>${it.hotelName || "Item"}</h4>`;

      for (let p = 0; p < extra; p++) {
        const row = document.createElement("div");
        row.classList.add("fields-grid-2cols-modal");
        row.innerHTML = `
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
        passBox.appendChild(row);
      }
      modalContainer.appendChild(passBox);
    }
  });

  copyForAllBtn.style.display = multiCount > 1 ? "inline-block" : "none";
}

/**
 * x() - Abre/fecha modal de passageiros extras
 */
function x() {
  const passengerModal = document.getElementById("passengerModal");
  const openBtn = document.getElementById("openPassengerModal");
  const closeBtn = document.getElementById("closeModal");
  const saveBtn = document.getElementById("savePassengersBtn");
  const copyBtn = document.getElementById("copyForAllBtn");
  const modalContainer = document.getElementById("modalPassengerContainer");

  openBtn.addEventListener("click", (evt) => {
    evt.preventDefault();
    h(m);
    passengerModal.style.display = "block";
  });

  closeBtn.addEventListener("click", () => {
    passengerModal.style.display = "none";
  });

  saveBtn.addEventListener("click", () => {
    passengerModal.style.display = "none";
    alert("Passageiros extras salvos!");
  });

  copyBtn.addEventListener("click", () => {
    let firstIndex = null;
    let count = 0;
    for (let i = 0; i < m.length; i++) {
      const needed = (m[i].adults || 1) - 1;
      if (needed > 0) {
        firstIndex = i;
        count = needed;
        break;
      }
    }
    if (firstIndex === null) return;

    const reference = t.extraPassengers[firstIndex] || [];
    for (let i = 0; i < m.length; i++) {
      if (i !== firstIndex) {
        const needed = (m[i].adults || 1) - 1;
        if (needed === count && needed > 0) {
          t.extraPassengers[i] = JSON.parse(JSON.stringify(reference));
          for (let p = 0; p < needed; p++) {
            const selName = `.modalExtraNameInput[data-item-index="${i}"][data-passenger-index="${p}"]`;
            const selBirth= `.modalExtraBirthdateInput[data-item-index="${i}"][data-passenger-index="${p}"]`;
            const nameEl  = document.querySelector(selName);
            const birthEl = document.querySelector(selBirth);
            if (nameEl && birthEl && t.extraPassengers[i][p]) {
              nameEl.value  = t.extraPassengers[i][p].name || "";
              birthEl.value = t.extraPassengers[i][p].birthdate || "";
            }
          }
        }
      }
    }
    alert("Dados copiados para todos os itens compatíveis!");
  });

  modalContainer.addEventListener("input", (evt) => {
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

/**
 * $() - Navegação steps (1,2,3,4)
 */
function $() {
  const toStep2Btn = document.getElementById("toStep2");
  const backToStep1Btn = document.getElementById("backToStep1");
  const toStep3Btn = document.getElementById("toStep3");
  const backToStep2Btn = document.getElementById("backToStep2");

  // Step 1 -> Step 2
  toStep2Btn.addEventListener("click", () => {
    if (!localStorage.getItem("agentId")) {
      // Se user não está logado, checa campos básicos
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
      t.firstName = document.getElementById("firstName").value;
      t.lastName  = document.getElementById("lastName").value;
      t.celular   = document.getElementById("celular").value;
      t.email     = document.getElementById("email").value;
      t.password  = document.getElementById("password").value;
      t.confirmPassword = document.getElementById("confirmPassword").value;
    }

    // Checa doc/endereço
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

    // Salva
    t.cpf       = document.getElementById("cpf").value;
    t.rg        = document.getElementById("rg").value;
    t.birthdate = document.getElementById("birthdate").value;
    t.cep       = document.getElementById("cep").value;
    t.state     = document.getElementById("state").value;
    t.city      = document.getElementById("city").value;
    t.address   = document.getElementById("address").value;
    t.number    = document.getElementById("number").value;

    // Passa pro step 2
    p(2);
  });

  // Step 2 -> Step 1
  if (backToStep1Btn) {
    backToStep1Btn.addEventListener("click", () => p(1));
  }

  // Step 2 -> Step 3
  if (toStep3Btn) {
    toStep3Btn.addEventListener("click", () => {
      const sel = document.querySelector('input[name="insuranceOption"]:checked');
      t.insuranceSelected = sel ? sel.value : "none";

      let cost = 0;
      if (t.insuranceSelected === "essencial") cost = 60.65;
      else if (t.insuranceSelected === "completo") cost = 101.09;

      t.insuranceCost = cost;

      // Recalcula total
      v(m);

      // Step 3
      p(3);
    });
  }

  // Step 3 -> Step 2
  if (backToStep2Btn) {
    backToStep2Btn.addEventListener("click", () => p(2));
  }
}

/**
 * b() - Máscaras de CEP, CPF, RG, e lógica de login
 */
function b() {
  function buscaCep(cep) {
    cep = cep.replace(/\D/g,"");
    if (cep.length === 8) {
      fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then(res => res.json())
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

  // CEP
  document.getElementById("cep").addEventListener("blur", function() {
    buscaCep(this.value);
  });

  // CPF
  document.getElementById("cpf").addEventListener("input", function(ev) {
    let val = ev.target.value.replace(/\D/g,"");
    if (val.length > 3)  val = val.replace(/^(\d{3})(\d)/, "$1.$2");
    if (val.length > 6)  val = val.replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3");
    if (val.length > 9)  val = val.replace(/(\d{3})\.(\d{3})\.(\d{3})(\d{1,2}).*/, "$1.$2.$3-$4");
    ev.target.value = val;
  });

  // RG
  document.getElementById("rg").addEventListener("input", function(ev) {
    let val = ev.target.value.replace(/\D/g,"");
    if (val.length > 2)  val = val.replace(/^(\d{2})(\d)/, "$1.$2");
    if (val.length > 5)  val = val.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    if (val.length > 7)  val = val.replace(/(\d{2})\.(\d{3})\.(\d{3})(\d{1}).*/, "$1.$2.$3-$4");
    ev.target.value = val;
  });

  // Toggle login vs register
  const toggleLogin = document.getElementById("toggleLogin");
  const regFields   = document.getElementById("registrationFieldsGeneral");
  const loginFields = document.getElementById("loginFields");

  toggleLogin &&
    toggleLogin.addEventListener("click", (evt) => {
      evt.preventDefault();
      if (regFields.style.display !== "none") {
        regFields.style.display = "none";
        loginFields.style.display = "block";
        toggleLogin.textContent = "Não tenho Login";
      } else {
        regFields.style.display = "block";
        loginFields.style.display = "none";
        toggleLogin.textContent = "Economize tempo fazendo Login";
      }
    });

  // Botão de Login
  const loginValidateBtn = document.getElementById("loginValidateBtn");
  loginValidateBtn &&
    loginValidateBtn.addEventListener("click", () => {
      const emailVal = document.getElementById("loginEmail").value;
      const passVal  = document.getElementById("loginPassword").value;

      fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailVal, password: passVal }),
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          localStorage.setItem("agentId", data.user.id);
          alert("Login efetuado com sucesso!");
          toggleLogin.style.display = "none";
          regFields.style.display    = "none";
          loginFields.style.display  = "none";
        } else {
          alert("Erro no login: " + (data.error || "Dados inválidos."));
        }
      })
      .catch(err => {
        console.error(err);
        alert("Erro ao realizar o login. Tente novamente.");
      });
    });
}

// Ao carregar a página
window.addEventListener("load", () => {
  // 1) Carrega carrinho
  B();

  // 2) Desenha resumo do carrinho
  v(m);

  // 3) Máscaras e login
  b();

  // 4) Steps
  $();

  // 5) Modal
  x();

  // Se houver agentId, oculta campos
  const hasAgent = !!localStorage.getItem("agentId");
  const toggleLogin = document.getElementById("toggleLogin");
  const regFields   = document.getElementById("registrationFieldsGeneral");
  const loginFields = document.getElementById("loginFields");

  if (hasAgent) {
    if (toggleLogin) toggleLogin.style.display = "none";
    if (regFields)   regFields.style.display   = "none";
    if (loginFields) loginFields.style.display = "none";
  } else {
    if (toggleLogin) toggleLogin.style.display = "block";
    if (regFields)   regFields.style.display   = "block";
  }

  // Inicia no step 1
  p(1);
});

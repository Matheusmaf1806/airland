/******************************************************
 *  1) STEP CONTROL (window.p) + OBJETOS GLOBAIS
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

// Objeto global do "Passageiro Principal" e configurações
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
 *  2) CARREGAR CARRINHO E EXIBIR NO RESUMO (COLUNA DIREITA)
 ******************************************************/
function loadCart() {
  // Tenta pegar itens de <shopping-cart> ou do localStorage
  const scEl = document.getElementById("shoppingCart");
  if (scEl && scEl.items && scEl.items.length > 0) {
    m = scEl.items;
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

// Atualizar resumo do carrinho (right-col)
function updateCartSummary(arr) {
  const cartItemsList = document.getElementById("cartItemsList");
  if (!cartItemsList) return;

  let total = 0;
  let htmlStr = "";

  arr.forEach(item => {
    // Exemplo de preço por adulto
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
            <p>Quartos:   ${item.rooms   || 1}</p>
            <p>Adultos:   ${item.adults  || 1} | Crianças: ${item.children || 0}</p>
          </div>
        </div>
        <div class="reserva-preco">
          R$ ${basePrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </div>
      </div>
    `;
  });

  // Se tiver custo de seguro, soma também
  if (t.insuranceCost) total += t.insuranceCost;

  cartItemsList.innerHTML = htmlStr;

  // Atualiza Subtotal / Desconto / Total
  const subtEl = document.getElementById("subtotalValue");
  const discEl = document.getElementById("discountValue");
  const totlEl = document.getElementById("totalValue");
  if (subtEl) subtEl.textContent = "R$ " + total.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  if (discEl) discEl.textContent = "- R$ 0,00";
  if (totlEl) totlEl.textContent = "R$ " + total.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

/******************************************************
 *  3) MODAL DE PASSAGEIROS EXTRAS
 ******************************************************/
function showPassengersModal(arr) {
  const container = document.getElementById("modalPassengerContainer");
  const copyBtn   = document.getElementById("copyForAllBtn");
  if (!container) return;

  container.innerHTML = "";
  t.extraPassengers   = [];
  let multipleItems   = 0;

  arr.forEach((item, idx) => {
    // Ex.: se item.adults = 2 => 1 extra
    const extras = (item.adults || 1) - 1;
    if (extras > 0) {
      multipleItems++;
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

  // Se há mais de 1 item com multipleAdults => exibe "copiar para todos"
  if (copyBtn) copyBtn.style.display = (multipleItems > 1) ? "inline-block" : "none";
}

function setupPassengersModal() {
  const modal         = document.getElementById("passengerModal");
  const openModalBtn  = document.getElementById("openPassengerModal");
  const closeModalBtn = document.getElementById("closeModal");
  const saveBtn       = document.getElementById("savePassengersBtn");
  const copyBtn       = document.getElementById("copyForAllBtn");
  const modalBox      = document.getElementById("modalPassengerContainer");

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

    // Copia array
    const firstArr = t.extraPassengers[firstIndex] || [];
    for (let i = 0; i < m.length; i++) {
      if (i !== firstIndex) {
        const needed = (m[i].adults || 1) - 1;
        if (needed === extraCount && needed > 0) {
          t.extraPassengers[i] = JSON.parse(JSON.stringify(firstArr));

          // Atualiza inputs
          for (let p = 0; p < needed; p++) {
            const selName = `.modalExtraNameInput[data-item-index="${i}"][data-passenger-index="${p}"]`;
            const selBD   = `.modalExtraBirthdateInput[data-item-index="${i}"][data-passenger-index="${p}"]`;
            const elName  = document.querySelector(selName);
            const elBD    = document.querySelector(selBD);

            if (elName && elBD && t.extraPassengers[i][p]) {
              elName.value = t.extraPassengers[i][p].name      || "";
              elBD.value   = t.extraPassengers[i][p].birthdate || "";
            }
          }
        }
      }
    }
    alert("Dados copiados para todos os itens compatíveis!");
  });

  // Captura inputs no modal
  modalBox?.addEventListener("input", (evt) => {
    const el = evt.target;
    if (el.classList.contains("modalExtraNameInput") ||
        el.classList.contains("modalExtraBirthdateInput")) {
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
 *  4) STEP NAVIGATION (1->2->3->4) + INSURANCE
 ******************************************************/
function setupStepsNavigation() {
  const btnToStep2  = document.getElementById("toStep2");
  const btnBack1    = document.getElementById("backToStep1");
  const btnToStep3  = document.getElementById("toStep3");
  const btnBack2    = document.getElementById("backToStep2");

  // Step 1 -> Step 2
  btnToStep2?.addEventListener("click", () => {
    // Se não estiver logado, exige campos de registro
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

    // Copia docs/endereço
    t.cpf       = document.getElementById("cpf").value;
    t.rg        = document.getElementById("rg").value;
    t.birthdate = document.getElementById("birthdate").value;
    t.cep       = document.getElementById("cep").value;
    t.state     = document.getElementById("state").value;
    t.city      = document.getElementById("city").value;
    t.address   = document.getElementById("address").value;
    t.number    = document.getElementById("number").value;

    // Avança
    p(2);
  });

  // Step 2 -> Step 1
  btnBack1?.addEventListener("click", () => {
    p(1);
  });

  // Step 2 -> Step 3
  btnToStep3?.addEventListener("click", () => {
    // Lê qual "insuranceOption" foi escolhido
    const sel = document.querySelector('input[name="insuranceOption"]:checked');
    t.insuranceSelected = sel ? sel.value : "none";

    let cost = 0;
    if (t.insuranceSelected === "essencial") {
      cost = 60.65;
    } else if (t.insuranceSelected === "completo") {
      cost = 101.09;
    }
    t.insuranceCost = cost;

    // Recalcula total c/ insurance
    updateCartSummary(m);

    // Avança p/ step 3
    p(3);
  });

  // Step 3 -> Step 2
  btnBack2?.addEventListener("click", () => {
    p(2);
  });
}

/******************************************************
 *  5) MÁSCARAS (CEP, CPF, RG) + LOGIN
 ******************************************************/
function setupMasksAndLogin() {
  // Buscar CEP
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
          document.getElementById("state").value   = data.uf || "";
        })
        .catch(err => {
          console.error("Erro ao buscar CEP:", err);
          alert("Não foi possível consultar o CEP.");
        });
    }
  }

  // CEP blur
  const cepEl = document.getElementById("cep");
  cepEl?.addEventListener("blur", function() {
    fetchCep(this.value);
  });

  // CPF input
  const cpfEl = document.getElementById("cpf");
  cpfEl?.addEventListener("input", (ev) => {
    let val = ev.target.value.replace(/\D/g, "");
    if (val.length > 3) {
      val = val.replace(/^(\d{3})(\d)/, "$1.$2");
    }
    if (val.length > 6) {
      val = val.replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3");
    }
    if (val.length > 9) {
      val = val.replace(/(\d{3})\.(\d{3})\.(\d{3})(\d{1,2}).*/, "$1.$2.$3-$4");
    }
    ev.target.value = val;
  });

  // RG input
  const rgEl = document.getElementById("rg");
  rgEl?.addEventListener("input", (ev) => {
    let val = ev.target.value.replace(/\D/g, "");
    if (val.length > 2) {
      val = val.replace(/^(\d{2})(\d)/, "$1.$2");
    }
    if (val.length > 5) {
      val = val.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    }
    if (val.length > 7) {
      val = val.replace(/(\d{2})\.(\d{3})\.(\d{3})(\d{1}).*/, "$1.$2.$3-$4");
    }
    ev.target.value = val;
  });

  // Toggle login vs registro
  const toggleLoginLink = document.getElementById("toggleLogin");
  const regDiv          = document.getElementById("registrationFieldsGeneral");
  const loginDiv        = document.getElementById("loginFields");

  toggleLoginLink?.addEventListener("click", (evt) => {
    evt.preventDefault();
    if (regDiv.style.display !== "none") {
      regDiv.style.display   = "none";
      loginDiv.style.display = "block";
      toggleLoginLink.textContent = "Não tenho Login";
    } else {
      regDiv.style.display   = "block";
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

          // Esconde links
          if (toggleLoginLink) toggleLoginLink.style.display = "none";
          if (regDiv)          regDiv.style.display          = "none";
          if (loginDiv)        loginDiv.style.display        = "none";
        } else {
          alert("Erro no login: " + (resp.error || "Dados inválidos."));
        }
      })
      .catch(err => {
        console.error(err);
        alert("Erro ao realizar o login. Tente novamente.");
      });
  });
}

/******************************************************
 *  6) FUNÇÕES DE CRIAR PEDIDO (initOrderInDb) + MALGA
 ******************************************************/
//  >> Já foi definido no script acima <<

/******************************************************
 *  7) EVENTO ONLOAD → INICIAR TUDO
 ******************************************************/
window.addEventListener("load", () => {
  // Carregar carrinho
  loadCart();
  // Exibir resumo do carrinho
  updateCartSummary(m);

  // Configurar máscaras, login, CEP
  setupMasksAndLogin();

  // Navegação entre steps
  setupStepsNavigation();

  // Passengers modal
  setupPassengersModal();

  // Se já houver agentId, esconde forms de registro/login
  const hasAgent = !!localStorage.getItem("agentId");
  const toggleL  = document.getElementById("toggleLogin");
  const regF     = document.getElementById("registrationFieldsGeneral");
  const logF     = document.getElementById("loginFields");

  if (hasAgent) {
    if (toggleL) toggleL.style.display = "none";
    if (regF)    regF.style.display    = "none";
    if (logF)    logF.style.display    = "none";
  } else {
    if (toggleL) toggleL.style.display = "block";
    if (regF)    regF.style.display    = "block";
  }

  // Inicia no step 1
  p(1);
});

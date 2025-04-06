// Define a função p(r) no objeto global, para poder chamá-la de fora
window.p = function(r) {
  const stepContents = document.querySelectorAll(".step-content");
  const stepsMenu = document.querySelectorAll(".steps-menu .step");

  // Ativa/desativa conteúdo
  stepContents.forEach(s => {
    s.classList.toggle("active", s.dataset.step === String(r));
  });

  // Atualiza bolinhas do menu
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

// Objeto de dados do usuário principal
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

// Aqui é onde ficará o array do carrinho
let m = [];

/** 
 * Carrega itens do carrinho ou do localStorage.
 */
function B() {
  const r = document.getElementById("shoppingCart");

  // Se o <shopping-cart> tiver items
  if (r && r.items && r.items.length > 0) {
    m = r.items;
  } else {
    // Senão, tenta localStorage
    const a = localStorage.getItem("cartItems");
    if (a) {
      m = JSON.parse(a);
    } else {
      // Remove itens de exemplo e deixa vazio
      m = [];
      console.log("Carrinho vazio - sem itens de exemplo");
    }
  }

  // Expondo o carrinho globalmente
  window.u = m;
}

/**
 * Atualiza o resumo do carrinho (direita) com base no array de items `m` e no `t.insuranceCost`.
 */
function v(r) {
  const o = document.getElementById("cartItemsList");
  let total = 0,
      htmlStr = "";

  r.forEach(d => {
    const precoBase = d.basePriceAdult || 80;
    total += precoBase;

    htmlStr += `
      <div class="reserva-item">
        <div class="reserva-left">
          <span class="categoria">${d.type || "Hospedagem"}</span>
          <span class="nome">${d.hotelName || "Hotel Desconhecido"} - ${d.roomName || "Quarto"}</span>
          <div class="reserva-details">
            <p>Check-in: ${d.checkIn || "--/--/----"}</p>
            <p>Check-out: ${d.checkOut || "--/--/----"}</p>
            <p>Quartos: ${d.rooms || 1}</p>
            <p>Adultos: ${d.adults || 1} | Crianças: ${d.children || 0}</p>
          </div>
        </div>
        <div class="reserva-preco">
          R$ ${precoBase.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </div>
      </div>
    `;
  });

  // Se tiver custo de seguro
  if (t.insuranceCost) {
    total += t.insuranceCost;
  }

  o.innerHTML = htmlStr;
  document.getElementById("subtotalValue").textContent =
    "R$ " + total.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  document.getElementById("discountValue").textContent = "- R$ 0,00";
  document.getElementById("totalValue").textContent =
    "R$ " + total.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

/**
 * Configura a listagem de passageiros extras no modal (caso haja).
 */
function h(r) {
  const container = document.getElementById("modalPassengerContainer"),
        copyBtn = document.getElementById("copyForAllBtn");

  container.innerHTML = "";
  t.extraPassengers = [];
  let countOfMulti = 0;

  r.forEach((item, idx) => {
    const extraCount = (item.adults || 1) - 1; 
    if (extraCount > 0) {
      countOfMulti++;
      t.extraPassengers[idx] = [];

      const passengerBox = document.createElement("div");
      passengerBox.classList.add("passenger-box");
      passengerBox.innerHTML = `<h4>${item.hotelName || "Item"}</h4>`;

      for (let pIndex = 0; pIndex < extraCount; pIndex++) {
        const divGrid = document.createElement("div");
        divGrid.classList.add("fields-grid-2cols-modal");
        divGrid.innerHTML = `
          <div class="form-field">
            <label>Nome do Passageiro #${pIndex + 1}</label>
            <input 
              type="text" 
              placeholder="Nome completo" 
              data-item-index="${idx}" 
              data-passenger-index="${pIndex}" 
              class="modalExtraNameInput" 
            />
          </div>
          <div class="form-field">
            <label>Data de Nascimento</label>
            <input 
              type="date" 
              data-item-index="${idx}" 
              data-passenger-index="${pIndex}" 
              class="modalExtraBirthdateInput" 
            />
          </div>
        `;
        passengerBox.appendChild(divGrid);
      }

      container.appendChild(passengerBox);
    }
  });

  copyBtn.style.display = countOfMulti > 1 ? "inline-block" : "none";
}

/**
 * Controla a abertura/fechamento do modal de passageiros extras.
 */
function x() {
  const modal = document.getElementById("passengerModal"),
        openBtn = document.getElementById("openPassengerModal"),
        closeBtn = document.getElementById("closeModal"),
        saveBtn = document.getElementById("savePassengersBtn"),
        copyBtn = document.getElementById("copyForAllBtn"),
        container = document.getElementById("modalPassengerContainer");

  openBtn.addEventListener("click", (e) => {
    e.preventDefault();
    h(m);
    modal.style.display = "block";
  });

  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  saveBtn.addEventListener("click", () => {
    modal.style.display = "none";
    alert("Passageiros extras salvos!");
  });

  copyBtn.addEventListener("click", () => {
    let firstIndex = null,
        extraCount = 0;
    for (let i = 0; i < m.length; i++) {
      const needed = (m[i].adults || 1) - 1;
      if (needed > 0) {
        firstIndex = i;
        extraCount = needed;
        break;
      }
    }
    if (firstIndex === null) return;

    const firstArray = t.extraPassengers[firstIndex] || [];
    for (let i = 0; i < m.length; i++) {
      if (i !== firstIndex) {
        const needed = (m[i].adults || 1) - 1;
        if (needed === extraCount && needed > 0) {
          t.extraPassengers[i] = JSON.parse(JSON.stringify(firstArray));
          for (let p = 0; p < needed; p++) {
            const nameSel = `.modalExtraNameInput[data-item-index="${i}"][data-passenger-index="${p}"]`,
                  bdSel   = `.modalExtraBirthdateInput[data-item-index="${i}"][data-passenger-index="${p}"]`,
                  nameEl  = document.querySelector(nameSel),
                  bdEl    = document.querySelector(bdSel);
            if (nameEl && bdEl && t.extraPassengers[i][p]) {
              nameEl.value = t.extraPassengers[i][p].name || "";
              bdEl.value   = t.extraPassengers[i][p].birthdate || "";
            }
          }
        }
      }
    }
    alert("Dados copiados para todos os itens compatíveis!");
  });

  container.addEventListener("input", (e) => {
    const el = e.target;
    if (
      el.classList.contains("modalExtraNameInput") ||
      el.classList.contains("modalExtraBirthdateInput")
    ) {
      const itemIndex = parseInt(el.getAttribute("data-item-index"), 10),
            passengerIndex = parseInt(el.getAttribute("data-passenger-index"), 10);

      if (!t.extraPassengers[itemIndex]) {
        t.extraPassengers[itemIndex] = [];
      }
      if (!t.extraPassengers[itemIndex][passengerIndex]) {
        t.extraPassengers[itemIndex][passengerIndex] = {};
      }

      if (el.classList.contains("modalExtraNameInput")) {
        t.extraPassengers[itemIndex][passengerIndex].name = el.value;
      } else {
        t.extraPassengers[itemIndex][passengerIndex].birthdate = el.value;
      }
    }
  });
}

/**
 * Navegação entre steps (1,2,3,4).
 */
function $() {
  const toStep2Btn = document.getElementById("toStep2"),
        backToStep1Btn = document.getElementById("backToStep1"),
        toStep3Btn = document.getElementById("toStep3"),
        backToStep2Btn = document.getElementById("backToStep2");

  // Step 1 -> Step 2
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
      t.firstName = document.getElementById("firstName").value;
      t.lastName  = document.getElementById("lastName").value;
      t.celular   = document.getElementById("celular").value;
      t.email     = document.getElementById("email").value;
      t.password  = document.getElementById("password").value;
      t.confirmPassword = document.getElementById("confirmPassword").value;
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

  // Step 2 -> Step 1 (voltar)
  backToStep1Btn && backToStep1Btn.addEventListener("click", () => p(1));

  // Step 2 -> Step 3
  toStep3Btn && toStep3Btn.addEventListener("click", () => {
    const selected = document.querySelector('input[name="insuranceOption"]:checked');
    t.insuranceSelected = selected ? selected.value : "none";

    let cost = 0;
    if (t.insuranceSelected === "essencial") cost = 60.65;
    else if (t.insuranceSelected === "completo") cost = 101.09;

    t.insuranceCost = cost;
    v(m);

    // Avança ao step 3
    p(3);
  });

  // Step 3 -> Step 2 (voltar)
  backToStep2Btn && backToStep2Btn.addEventListener("click", () => p(2));
}

/**
 * Máscaras de CEP, CPF, RG, etc., e lógica de login.
 */
function b() {
  function buscaCep(cep) {
    cep = cep.replace(/\D/g, "");
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
  document.getElementById("cep").addEventListener("blur", function () {
    buscaCep(this.value);
  });

  // CPF
  document.getElementById("cpf").addEventListener("input", function (e) {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 3) {
      val = val.replace(/^(\d{3})(\d)/, "$1.$2");
    }
    if (val.length > 6) {
      val = val.replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3");
    }
    if (val.length > 9) {
      val = val.replace(/(\d{3})\.(\d{3})\.(\d{3})(\d{1,2}).*/, "$1.$2.$3-$4");
    }
    e.target.value = val;
  });

  // RG
  document.getElementById("rg").addEventListener("input", function (e) {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 2) {
      val = val.replace(/^(\d{2})(\d)/, "$1.$2");
    }
    if (val.length > 5) {
      val = val.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    }
    if (val.length > 7) {
      val = val.replace(/(\d{2})\.(\d{3})\.(\d{3})(\d{1}).*/, "$1.$2.$3-$4");
    }
    e.target.value = val;
  });

  // Toggle entre Form de Login vs. Registro
  const toggleLogin = document.getElementById("toggleLogin"),
        regFields   = document.getElementById("registrationFieldsGeneral"),
        loginFields = document.getElementById("loginFields");

  toggleLogin &&
    toggleLogin.addEventListener("click", (ev) => {
      ev.preventDefault();
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
      const emailVal = document.getElementById("loginEmail").value,
            passVal  = document.getElementById("loginPassword").value;
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

// Ao carregar a página (load), executamos as funções
window.addEventListener("load", () => {
  B();      // Carrega itens do carrinho (m) ou deixa vazio
  v(m);     // Atualiza resumo
  b();      // Máscaras, login, etc.
  $();      // Navegação steps
  x();      // Modal de passageiros extras

  // Se houver agentId, oculta campos de registro e login
  const hasAgent = !!localStorage.getItem("agentId"),
        toggleLogin = document.getElementById("toggleLogin"),
        regFields   = document.getElementById("registrationFieldsGeneral"),
        loginFields = document.getElementById("loginFields");

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

// Define a função p(r) no objeto global, para poder chamá-la de fora:
window.p = function(r) {
  const stepContents = document.querySelectorAll(".step-content");
  const stepsMenu = document.querySelectorAll(".steps-menu .step");

  // Ativa/desativa conteúdo por step
  stepContents.forEach(s => {
    s.classList.toggle("active", s.dataset.step === String(r));
  });

  // Atualiza bolinhas do menu de steps
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

// Objeto de dados do "Passageiro Principal" (exemplo)
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
 * Carrega itens do carrinho:
 * - Primeiro verifica se existe <shopping-cart id="shoppingCart"> com items,
 * - Senão, tenta localStorage.getItem("cartItems").
 * - Se nada encontrado, fica vazio e mostra console.log("Carrinho vazio").
 */
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

  // Expondo o carrinho globalmente para o checkout.html
  window.u = m;
}

/**
 * Atualiza o resumo do carrinho (na coluna da direita) com base em `m` e em `t.insuranceCost`.
 */
function v(arr) {
  const cartItemsList = document.getElementById("cartItemsList");
  let total = 0;
  let htmlStr = "";

  arr.forEach(item => {
    // Supondo que cada item tenha .basePriceAdult
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

  // Se tiver custo de seguro, soma também
  if (t.insuranceCost) {
    total += t.insuranceCost;
  }

  cartItemsList.innerHTML = htmlStr;

  // Atualiza os valores de Subtotal / Desconto / Total
  document.getElementById("subtotalValue").textContent =
    "R$ " + total.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  document.getElementById("discountValue").textContent = "- R$ 0,00";
  document.getElementById("totalValue").textContent =
    "R$ " + total.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

/**
 * Configura a listagem de passageiros extras no modal (caso haja).
 */
function h(arr) {
  const passengerContainer = document.getElementById("modalPassengerContainer");
  const copyForAllBtn = document.getElementById("copyForAllBtn");

  passengerContainer.innerHTML = "";
  t.extraPassengers = [];

  let countOfMulti = 0;

  arr.forEach((item, idx) => {
    // Exemplo: se "adults" significa 1 ou 2
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
        passengerBox.appendChild(fields);
      }

      passengerContainer.appendChild(passengerBox);
    }
  });

  // Se há mais de 1 item com multiple adults => exibe "Copiar para todos"
  copyForAllBtn.style.display = countOfMulti > 1 ? "inline-block" : "none";
}

/**
 * Controla a abertura/fechamento do modal de passageiros extras.
 */
function x() {
  const passengerModal = document.getElementById("passengerModal"),
        openModalBtn   = document.getElementById("openPassengerModal"),
        closeModalBtn  = document.getElementById("closeModal"),
        savePassengersBtn = document.getElementById("savePassengersBtn"),
        copyForAllBtn  = document.getElementById("copyForAllBtn"),
        modalContainer = document.getElementById("modalPassengerContainer");

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

    // Acha o primeiro item que tiver multiple adults
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
    for (let i = 0; i < m.length; i++) {
      if (i !== firstIndex) {
        const needed = (m[i].adults || 1) - 1;
        if (needed === extraCount && needed > 0) {
          // Copia array
          t.extraPassengers[i] = JSON.parse(JSON.stringify(firstArr));
          // Atualiza inputs do modal
          for (let p = 0; p < needed; p++) {
            const selName = `.modalExtraNameInput[data-item-index="${i}"][data-passenger-index="${p}"]`,
                  selBD   = `.modalExtraBirthdateInput[data-item-index="${i}"][data-passenger-index="${p}"]`,
                  elName  = document.querySelector(selName),
                  elBD    = document.querySelector(selBD);

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

  // Quando digita no modal, salvamos em t.extraPassengers
  modalContainer.addEventListener("input", (e) => {
    const el = e.target;
    if (
      el.classList.contains("modalExtraNameInput") ||
      el.classList.contains("modalExtraBirthdateInput")
    ) {
      const itemIndex = parseInt(el.getAttribute("data-item-index"), 10);
      const passIndex = parseInt(el.getAttribute("data-passenger-index"), 10);

      if (!t.extraPassengers[itemIndex]) {
        t.extraPassengers[itemIndex] = [];
      }
      if (!t.extraPassengers[itemIndex][passIndex]) {
        t.extraPassengers[itemIndex][passIndex] = {};
      }

      if (el.classList.contains("modalExtraNameInput")) {
        t.extraPassengers[itemIndex][passIndex].name = el.value;
      } else {
        t.extraPassengers[itemIndex][passIndex].birthdate = el.value;
      }
    }
  });
}

/**
 * Navegação entre steps (1,2,3,4).
 */
function $() {
  const toStep2Btn   = document.getElementById("toStep2"),
        backToStep1  = document.getElementById("backToStep1"),
        toStep3Btn   = document.getElementById("toStep3"),
        backToStep2  = document.getElementById("backToStep2");

  // Step 1 -> Step 2
  toStep2Btn.addEventListener("click", () => {
    // Se não tiver agentId, forçamos preencher todos os campos de registro
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
      // Guarda no objeto t
      t.firstName       = document.getElementById("firstName").value;
      t.lastName        = document.getElementById("lastName").value;
      t.celular         = document.getElementById("celular").value;
      t.email           = document.getElementById("email").value;
      t.password        = document.getElementById("password").value;
      t.confirmPassword = document.getElementById("confirmPassword").value;
    }

    // Campos de documento/endereço
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

    // Avança step
    p(2);
  });

  // Step 2 -> Step 1 (Voltar)
  if (backToStep1) {
    backToStep1.addEventListener("click", () => p(1));
  }

  // Step 2 -> Step 3
  if (toStep3Btn) {
    toStep3Btn.addEventListener("click", () => {
      const selected = document.querySelector('input[name="insuranceOption"]:checked');
      t.insuranceSelected = selected ? selected.value : "none";

      let cost = 0;
      if (t.insuranceSelected === "essencial") cost = 60.65;
      else if (t.insuranceSelected === "completo") cost = 101.09;

      t.insuranceCost = cost;

      // Recalcula total do carrinho
      v(m);

      // Avança para step 3
      p(3);
    });
  }

  // Step 3 -> Step 2 (Voltar)
  if (backToStep2) {
    backToStep2.addEventListener("click", () => p(2));
  }
}

/**
 * Máscaras de CEP, CPF, RG, e lógica de login.
 */
function b() {
  function buscaCep(cepVal) {
    cepVal = cepVal.replace(/\D/g, "");
    if (cepVal.length === 8) {
      fetch(`https://viacep.com.br/ws/${cepVal}/json/`)
        .then(r => r.json())
        .then(d => {
          if (d.erro) {
            alert("CEP não encontrado!");
            return;
          }
          document.getElementById("address").value = d.logradouro || "";
          document.getElementById("city").value    = d.localidade || "";
          document.getElementById("state").value   = d.uf || "";
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

  // RG
  document.getElementById("rg").addEventListener("input", function(ev) {
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

  // Toggle Login vs Registro
  const toggleLoginLink  = document.getElementById("toggleLogin"),
        registrationDiv  = document.getElementById("registrationFieldsGeneral"),
        loginDiv         = document.getElementById("loginFields");

  if (toggleLoginLink) {
    toggleLoginLink.addEventListener("click", (evt) => {
      evt.preventDefault();
      if (registrationDiv.style.display !== "none") {
        registrationDiv.style.display = "none";
        loginDiv.style.display        = "block";
        toggleLoginLink.textContent   = "Não tenho Login";
      } else {
        registrationDiv.style.display = "block";
        loginDiv.style.display        = "none";
        toggleLoginLink.textContent   = "Economize tempo fazendo Login";
      }
    });
  }

  // Botão de Login
  const loginValidateBtn = document.getElementById("loginValidateBtn");
  if (loginValidateBtn) {
    loginValidateBtn.addEventListener("click", () => {
      const emailVal = document.getElementById("loginEmail").value,
            passVal  = document.getElementById("loginPassword").value;

      fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailVal, password: passVal }),
      })
        .then(r => r.json())
        .then(resData => {
          if (resData.success) {
            localStorage.setItem("agentId", resData.user.id);
            alert("Login efetuado com sucesso!");

            toggleLoginLink.style.display = "none";
            registrationDiv.style.display = "none";
            loginDiv.style.display        = "none";
          } else {
            alert("Erro no login: " + (resData.error || "Dados inválidos."));
          }
        })
        .catch(err => {
          console.error(err);
          alert("Erro ao realizar o login. Tente novamente.");
        });
    });
  }
}

/**
 * Evento principal ao carregar a página.
 */
window.addEventListener("load", () => {
  // 1) Carrega o carrinho (m) do localStorage ou <shopping-cart>
  B();

  // 2) Atualiza resumo do carrinho (direita)
  v(m);

  // 3) Configura máscaras e login
  b();

  // 4) Navegação steps
  $();

  // 5) Modal de passageiros extras
  x();

  // Se houver agentId no localStorage, esconde o form de registro/login
  const hasAgent = !!localStorage.getItem("agentId"),
        toggleLoginLink = document.getElementById("toggleLogin"),
        regFields       = document.getElementById("registrationFieldsGeneral"),
        loginFields     = document.getElementById("loginFields");

  if (hasAgent) {
    if (toggleLoginLink) toggleLoginLink.style.display = "none";
    if (regFields)       regFields.style.display       = "none";
    if (loginFields)     loginFields.style.display     = "none";
  } else {
    if (toggleLoginLink) toggleLoginLink.style.display = "block";
    if (regFields)       regFields.style.display       = "block";
  }

  // Começa no step 1
  p(1);
});

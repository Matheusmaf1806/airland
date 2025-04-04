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
  },
  u = [];

/** 
 * Carrega itens do carrinho ou do localStorage.
 */
function B() {
  const n = document.getElementById("shoppingCart");
  if (n && n.items && n.items.length > 0) {
    u = n.items;
  } else {
    const o = localStorage.getItem("cartItems");
    if (o) {
      u = JSON.parse(o);
    } else {
      // Exemplo de itens caso nada esteja salvo
      u = [
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
}

/**
 * Atualiza o resumo do carrinho (direita) com base no array de items `u` e no `insuranceCost`.
 */
function v(n) {
  const o = document.getElementById("cartItemsList");
  let a = 0,
    s = "";
  n.forEach((d) => {
    const l = d.basePriceAdult || 80;
    a += l;
    s += `
      <div class="reserva-item">
        <div class="reserva-left">
          <span class="categoria">${d.type || "Hospedagem"}</span>
          <span class="nome">${d.hotelName || "Hotel Desconhecido"} - ${
      d.roomName || "Quarto"
    }</span>
          <div class="reserva-details">
            <p>Check-in: ${d.checkIn || "--/--/----"}</p>
            <p>Check-out: ${d.checkOut || "--/--/----"}</p>
            <p>Quartos: ${d.rooms || 1}</p>
            <p>Adultos: ${d.adults || 1} | Crianças: ${
      d.children || 0
    }</p>
          </div>
        </div>
        <div class="reserva-preco">
          R$ ${l.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </div>
      </div>
    `;
  });

  // Se tiver custo de seguro
  if (t.insuranceCost) {
    a += t.insuranceCost;
  }

  o.innerHTML = s;
  document.getElementById("subtotalValue").textContent =
    "R$ " + a.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  document.getElementById("discountValue").textContent = "- R$ 0,00";
  document.getElementById("totalValue").textContent =
    "R$ " + a.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

/**
 * Configura a listagem de passageiros extras no modal (caso haja).
 */
function h(n) {
  const o = document.getElementById("modalPassengerContainer"),
    a = document.getElementById("copyForAllBtn");
  o.innerHTML = "";
  t.extraPassengers = [];
  let s = 0;

  n.forEach((d, l) => {
    const e = (d.adults || 1) - 1; 
    if (e > 0) {
      s++;
      t.extraPassengers[l] = [];
      const i = document.createElement("div");
      i.classList.add("passenger-box");
      i.innerHTML = `<h4>${d.hotelName || "Item"}</h4>`;

      for (let c = 0; c < e; c++) {
        const r = document.createElement("div");
        r.classList.add("fields-grid-2cols-modal");
        r.innerHTML = `
          <div class="form-field">
            <label>Nome do Passageiro #${c + 1}</label>
            <input 
              type="text" 
              placeholder="Nome completo" 
              data-item-index="${l}" 
              data-passenger-index="${c}" 
              class="modalExtraNameInput" 
            />
          </div>
          <div class="form-field">
            <label>Data de Nascimento</label>
            <input 
              type="date" 
              data-item-index="${l}" 
              data-passenger-index="${c}" 
              class="modalExtraBirthdateInput" 
            />
          </div>
        `;
        i.appendChild(r);
      }
      o.appendChild(i);
    }
  });

  a.style.display = s > 1 ? "inline-block" : "none";
}

/**
 * Controla a abertura/fechamento do modal de passageiros extras.
 */
function x() {
  const n = document.getElementById("passengerModal"),
    o = document.getElementById("openPassengerModal"),
    a = document.getElementById("closeModal"),
    s = document.getElementById("savePassengersBtn"),
    d = document.getElementById("copyForAllBtn"),
    l = document.getElementById("modalPassengerContainer");

  o.addEventListener("click", (e) => {
    e.preventDefault();
    h(u);
    n.style.display = "block";
  });

  a.addEventListener("click", () => {
    n.style.display = "none";
  });

  s.addEventListener("click", () => {
    n.style.display = "none";
    alert("Passageiros extras salvos!");
  });

  d.addEventListener("click", () => {
    let e = null,
      i = 0;
    for (let r = 0; r < u.length; r++) {
      const g = (u[r].adults || 1) - 1;
      if (g > 0) {
        e = r;
        i = g;
        break;
      }
    }
    if (e === null) return;

    const c = t.extraPassengers[e] || [];
    for (let r = 0; r < u.length; r++) {
      if (r !== e) {
        const g = (u[r].adults || 1) - 1;
        if (g === i && g > 0) {
          t.extraPassengers[r] = JSON.parse(JSON.stringify(c));
          for (let m = 0; m < g; m++) {
            const f = `.modalExtraNameInput[data-item-index="${r}"][data-passenger-index="${m}"]`,
              I = `.modalExtraBirthdateInput[data-item-index="${r}"][data-passenger-index="${m}"]`,
              y = document.querySelector(f),
              E = document.querySelector(I);
            if (y && E && t.extraPassengers[r][m]) {
              y.value = t.extraPassengers[r][m].name || "";
              E.value = t.extraPassengers[r][m].birthdate || "";
            }
          }
        }
      }
    }
    alert("Dados copiados para todos os itens compatíveis!");
  });

  l.addEventListener("input", (e) => {
    const i = e.target;
    if (
      i.classList.contains("modalExtraNameInput") ||
      i.classList.contains("modalExtraBirthdateInput")
    ) {
      const c = parseInt(i.getAttribute("data-item-index"), 10),
        r = parseInt(i.getAttribute("data-passenger-index"), 10);
      t.extraPassengers[c] || (t.extraPassengers[c] = []);
      t.extraPassengers[c][r] || (t.extraPassengers[c][r] = {});

      if (i.classList.contains("modalExtraNameInput")) {
        t.extraPassengers[c][r].name = i.value;
      } else {
        t.extraPassengers[c][r].birthdate = i.value;
      }
    }
  });
}

/**
 * Navegação entre steps (1,2,3,4).
 */
function C() {
  const n = document.getElementById("toStep2"),
    o = document.getElementById("backToStep1"),
    a = document.getElementById("toStep3"),
    s = document.getElementById("backToStep2");

  // Step 1 -> Step 2
  n.addEventListener("click", () => {
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
      t.lastName = document.getElementById("lastName").value;
      t.celular = document.getElementById("celular").value;
      t.email = document.getElementById("email").value;
      t.password = document.getElementById("password").value;
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
    t.cpf = document.getElementById("cpf").value;
    t.rg = document.getElementById("rg").value;
    t.birthdate = document.getElementById("birthdate").value;
    t.cep = document.getElementById("cep").value;
    t.state = document.getElementById("state").value;
    t.city = document.getElementById("city").value;
    t.address = document.getElementById("address").value;
    t.number = document.getElementById("number").value;

    p(2);
  });

  // Step 2 -> Step 1 (voltar)
  o && o.addEventListener("click", () => p(1));

  // Step 2 -> Step 3
  a && a.addEventListener("click", () => {
    const d = document.querySelector('input[name="insuranceOption"]:checked');
    t.insuranceSelected = d ? d.value : "none";
    let l = 0;
    if (t.insuranceSelected === "essencial") l = 60.65;
    else if (t.insuranceSelected === "completo") l = 101.09;
    t.insuranceCost = l;

    // Recalcular total
    v(u);

    // Antigamente chamava L() aqui. Removemos para não configurar Malga.
    // p(3), L();
    // Agora apenas:
    p(3);
  });

  // Step 3 -> Step 2 (voltar)
  s && s.addEventListener("click", () => p(2));
}

/**
 * Máscaras de CEP, CPF, RG, etc., e lógica de login.
 */
function b() {
  function n(l) {
    l = l.replace(/\D/g, "");
    if (l.length === 8) {
      fetch(`https://viacep.com.br/ws/${l}/json/`)
        .then((e) => e.json())
        .then((e) => {
          if (e.erro) {
            alert("CEP não encontrado!");
            return;
          }
          document.getElementById("address").value = e.logradouro || "";
          document.getElementById("city").value = e.localidade || "";
          document.getElementById("state").value = e.uf || "";
        })
        .catch((i) => {
          console.error("Erro ao buscar CEP:", i);
          alert("Não foi possível consultar o CEP.");
        });
    }
  }

  // CEP
  document.getElementById("cep").addEventListener("blur", function () {
    n(this.value);
  });

  // CPF
  document.getElementById("cpf").addEventListener("input", function (l) {
    let e = l.target.value.replace(/\D/g, "");
    if (e.length > 3) e = e.replace(/^(\d{3})(\d)/, "$1.$2");
    if (e.length > 6) e = e.replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3");
    if (e.length > 9)
      e = e.replace(/(\d{3})\.(\d{3})\.(\d{3})(\d{1,2}).*/, "$1.$2.$3-$4");
    l.target.value = e;
  });

  // RG
  document.getElementById("rg").addEventListener("input", function (l) {
    let e = l.target.value.replace(/\D/g, "");
    if (e.length > 2) e = e.replace(/^(\d{2})(\d)/, "$1.$2");
    if (e.length > 5) e = e.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    if (e.length > 7)
      e = e.replace(/(\d{2})\.(\d{3})\.(\d{3})(\d{1}).*/, "$1.$2.$3-$4");
    l.target.value = e;
  });

  // Toggle entre Form de Login vs. Registro
  const o = document.getElementById("toggleLogin"),
    a = document.getElementById("registrationFieldsGeneral"),
    s = document.getElementById("loginFields");
  o &&
    o.addEventListener("click", (l) => {
      l.preventDefault();
      if (a.style.display !== "none") {
        a.style.display = "none";
        s.style.display = "block";
        o.textContent = "Não tenho Login";
      } else {
        a.style.display = "block";
        s.style.display = "none";
        o.textContent = "Economize tempo fazendo Login";
      }
    });

  // Botão de Login
  const d = document.getElementById("loginValidateBtn");
  d &&
    d.addEventListener("click", () => {
      const l = document.getElementById("loginEmail").value,
        e = document.getElementById("loginPassword").value;
      fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: l, password: e }),
      })
        .then((i) => i.json())
        .then((i) => {
          if (i.success) {
            localStorage.setItem("agentId", i.user.id);
            alert("Login efetuado com sucesso!");
            o.style.display = "none";
            a.style.display = "none";
            s.style.display = "none";
          } else {
            alert("Erro no login: " + (i.error || "Dados inválidos."));
          }
        })
        .catch((i) => {
          console.error(i);
          alert("Erro ao realizar o login. Tente novamente.");
        });
    });
}

// REMOVIDO: function L() {...}

/**
 * Evento principal ao carregar página
 */
window.addEventListener("load", () => {
  B();      // Carrega itens do carrinho
  v(u);     // Atualiza resumo do carrinho
  b();      // Máscaras e login
  C();      // Navegação steps
  x();      // Modal de passageiros extras

  // Se houver agentId, oculta campos de registro e login
  const n = !!localStorage.getItem("agentId"),
    o = document.getElementById("toggleLogin"),
    a = document.getElementById("registrationFieldsGeneral"),
    s = document.getElementById("loginFields");

  if (n) {
    o && (o.style.display = "none");
    a && (a.style.display = "none");
    s && (s.style.display = "none");
  } else {
    o && (o.style.display = "block");
    a && (a.style.display = "block");
  }

  p(1); // Inicia no step 1
});

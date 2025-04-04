// main.js (continuando com type="module")

// Passo 1: Substituímos a função "p(r)" por "window.p = function(r){ ... }"
window.p = function(r) {
  const stepContents = document.querySelectorAll(".step-content");
  const stepsMenu    = document.querySelectorAll(".steps-menu .step");

  // Ativa o step correspondente e desativa os outros
  stepContents.forEach(s => {
    s.classList.toggle("active", s.dataset.step === String(r));
  });

  // Atualiza o menu (bolinhas e desabilitados)
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

// Variáveis e objetos (sem alterações)
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
  insuranceCost: 0
};

let m = [];

// Função B() (sem alterações)
function B() {
  const r = document.getElementById("shoppingCart");
  if (r && r.items && r.items.length > 0) {
    m = r.items;
  } else {
    const a = localStorage.getItem("cartItems");
    if (a) {
      m = JSON.parse(a);
    } else {
      // Exemplo de carrinho "falso"
      m = [
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

// Função v(r) (sem alterações): Atualiza o HTML de resumo do carrinho
function v(r) {
  const a = document.getElementById("cartItemsList");
  let o = 0;
  let s = "";
  r.forEach(d => {
    const n = d.basePriceAdult || 80;
    o += n;
    s += `
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
          R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </div>
      </div>
    `;
  });
  // Soma também o valor do seguro, se houver
  if (t.insuranceCost) o += t.insuranceCost;

  a.innerHTML = s;
  document.getElementById("subtotalValue").textContent = "R$ " + o.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  document.getElementById("discountValue").textContent = "- R$ 0,00";
  document.getElementById("totalValue").textContent = "R$ " + o.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

// Função h(r) (sem alterações): Prepara/passengers extras
function h(r) {
  const a = document.getElementById("modalPassengerContainer");
  const o = document.getElementById("copyForAllBtn");
  a.innerHTML = "";
  t.extraPassengers = [];
  let s = 0;

  r.forEach((d, n) => {
    const e = (d.adults || 1) - 1;
    if (e > 0) {
      s++;
      t.extraPassengers[n] = [];
      const c = document.createElement("div");
      c.classList.add("passenger-box");
      c.innerHTML = `<h4>${d.hotelName || "Item"}</h4>`;
      for (let i = 0; i < e; i++) {
        const l = document.createElement("div");
        l.classList.add("fields-grid-2cols-modal");
        l.innerHTML = `
          <div class="form-field">
            <label>Nome do Passageiro #${i+1}</label>
            <input 
              type="text" 
              placeholder="Nome completo" 
              data-item-index="${n}" 
              data-passenger-index="${i}" 
              class="modalExtraNameInput" 
            />
          </div>
          <div class="form-field">
            <label>Data de Nascimento</label>
            <input 
              type="date" 
              data-item-index="${n}" 
              data-passenger-index="${i}" 
              class="modalExtraBirthdateInput" 
            />
          </div>
        `;
        c.appendChild(l);
      }
      a.appendChild(c);
    }
  });

  o.style.display = s > 1 ? "inline-block" : "none";
}

// Função x() (sem alterações): Lida com o modal de passageiros extras
function x() {
  const r = document.getElementById("passengerModal"),
        a = document.getElementById("openPassengerModal"),
        o = document.getElementById("closeModal"),
        s = document.getElementById("savePassengersBtn"),
        d = document.getElementById("copyForAllBtn"),
        n = document.getElementById("modalPassengerContainer");

  a.addEventListener("click", e => {
    e.preventDefault();
    h(m);
    r.style.display = "block";
  });
  o.addEventListener("click", () => {
    r.style.display = "none";
  });
  s.addEventListener("click", () => {
    r.style.display = "none";
    alert("Passageiros extras salvos!");
  });
  d.addEventListener("click", () => {
    let e = null, c = 0;
    for (let l = 0; l < m.length; l++) {
      const g = (m[l].adults || 1) - 1;
      if (g > 0) {
        e = l;
        c = g;
        break;
      }
    }
    if (e === null) return;
    const i = t.extraPassengers[e] || [];
    for (let l = 0; l < m.length; l++) {
      if (l !== e) {
        const g = (m[l].adults || 1) - 1;
        if (g === c && g > 0) {
          t.extraPassengers[l] = JSON.parse(JSON.stringify(i));
          for (let u = 0; u < g; u++) {
            const I = `.modalExtraNameInput[data-item-index="${l}"][data-passenger-index="${u}"]`,
                  f = `.modalExtraBirthdateInput[data-item-index="${l}"][data-passenger-index="${u}"]`,
                  y = document.querySelector(I),
                  E = document.querySelector(f);
            if (y && E && t.extraPassengers[l][u]) {
              y.value = t.extraPassengers[l][u].name || "";
              E.value = t.extraPassengers[l][u].birthdate || "";
            }
          }
        }
      }
    }
    alert("Dados copiados para todos os itens compatíveis!");
  });

  n.addEventListener("input", e => {
    const c = e.target;
    if (c.classList.contains("modalExtraNameInput") || c.classList.contains("modalExtraBirthdateInput")) {
      const i = parseInt(c.getAttribute("data-item-index"), 10),
            l = parseInt(c.getAttribute("data-passenger-index"), 10);
      if (!t.extraPassengers[i]) {
        t.extraPassengers[i] = [];
      }
      if (!t.extraPassengers[i][l]) {
        t.extraPassengers[i][l] = {};
      }
      if (c.classList.contains("modalExtraNameInput")) {
        t.extraPassengers[i][l].name = c.value;
      } else {
        t.extraPassengers[i][l].birthdate = c.value;
      }
    }
  });
}

// Função $() (sem alterações) – controla avanços do step 1 -> 2 -> 3
function $() {
  const r = document.getElementById("toStep2"),
        a = document.getElementById("backToStep1"),
        o = document.getElementById("toStep3"),
        s = document.getElementById("backToStep2");

  r.addEventListener("click", () => {
    // Se não tiver login salvo, valida campos do Step 1
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

    // Se passou, guarda
    t.cpf       = document.getElementById("cpf").value;
    t.rg        = document.getElementById("rg").value;
    t.birthdate = document.getElementById("birthdate").value;
    t.cep       = document.getElementById("cep").value;
    t.state     = document.getElementById("state").value;
    t.city      = document.getElementById("city").value;
    t.address   = document.getElementById("address").value;
    t.number    = document.getElementById("number").value;

    // Step 1 -> Step 2
    window.p(2);
  });

  // Botão Voltar (Step 2 -> 1)
  a && a.addEventListener("click", () => window.p(1));

  // Botão Próximo (Step 2 -> 3)
  o && o.addEventListener("click", () => {
    const d = document.querySelector('input[name="insuranceOption"]:checked');
    t.insuranceSelected = d ? d.value : "none";
    let n = 0;
    if (t.insuranceSelected === "essencial") {
      n = 60.65;
    } else if (t.insuranceSelected === "completo") {
      n = 101.09;
    }
    t.insuranceCost = n;
    v(m);

    window.p(3);
  });

  // Botão Voltar (Step 3 -> 2)
  s && s.addEventListener("click", () => window.p(2));
}

// Função b() (sem alterações) – Máscaras, CEP etc.
function b() {
  function r(n) {
    n = n.replace(/\D/g, "");
    if (n.length === 8) {
      fetch(`https://viacep.com.br/ws/${n}/json/`)
        .then(e => e.json())
        .then(e => {
          if (e.erro) {
            alert("CEP não encontrado!");
            return;
          }
          document.getElementById("address").value = e.logradouro || "";
          document.getElementById("city").value    = e.localidade || "";
          document.getElementById("state").value   = e.uf || "";
        })
        .catch(e => {
          console.error("Erro ao buscar CEP:", e);
          alert("Não foi possível consultar o CEP.");
        });
    }
  }

  document.getElementById("cep").addEventListener("blur", function() {
    r(this.value);
  });

  document.getElementById("cpf").addEventListener("input", function(n) {
    let e = n.target.value.replace(/\D/g, "");
    if (e.length > 3) {
      e = e.replace(/^(\d{3})(\d)/, "$1.$2");
    }
    if (e.length > 6) {
      e = e.replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3");
    }
    if (e.length > 9) {
      e = e.replace(/(\d{3})\.(\d{3})\.(\d{3})(\d{1,2}).*/, "$1.$2.$3-$4");
    }
    n.target.value = e;
  });

  document.getElementById("rg").addEventListener("input", function(n) {
    let e = n.target.value.replace(/\D/g, "");
    if (e.length > 2) {
      e = e.replace(/^(\d{2})(\d)/, "$1.$2");
    }
    if (e.length > 5) {
      e = e.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    }
    if (e.length > 7) {
      e = e.replace(/(\d{2})\.(\d{3})\.(\d{3})(\d{1}).*/, "$1.$2.$3-$4");
    }
    n.target.value = e;
  });

  const a = document.getElementById("toggleLogin"),
        o = document.getElementById("registrationFieldsGeneral"),
        s = document.getElementById("loginFields");

  // Alternar entre formulário de registro e login
  a && a.addEventListener("click", n => {
    n.preventDefault();
    if (o.style.display !== "none") {
      o.style.display = "none";
      s.style.display = "block";
      a.textContent = "Não tenho Login";
    } else {
      o.style.display = "block";
      s.style.display = "none";
      a.textContent = "Economize tempo fazendo Login";
    }
  });

  const d = document.getElementById("loginValidateBtn");
  d && d.addEventListener("click", () => {
    const n = document.getElementById("loginEmail").value;
    const e = document.getElementById("loginPassword").value;
    fetch("/api/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: n, password: e })
    })
      .then(c => c.json())
      .then(c => {
        if (c.success) {
          localStorage.setItem("agentId", c.user.id);
          alert("Login efetuado com sucesso!");
          a.style.display = "none";
          o.style.display = "none";
          s.style.display = "none";
        } else {
          alert("Erro no login: " + (c.error || "Dados inválidos."));
        }
      })
      .catch(c => {
        console.error(c);
        alert("Erro ao realizar o login. Tente novamente.");
      });
  });
}

// Ao carregar a janela, executa as funções de inicialização
window.addEventListener("load", () => {
  B();
  v(m);
  b();
  $();
  x();

  const r = !!localStorage.getItem("agentId"),
        a = document.getElementById("toggleLogin"),
        o = document.getElementById("registrationFieldsGeneral"),
        s = document.getElementById("loginFields");

  if (r) {
    if (a) a.style.display = "none";
    if (o) o.style.display = "none";
    if (s) s.style.display = "none";
  } else {
    if (a) a.style.display = "block";
    if (o) o.style.display = "block";
  }

  // Inicia sempre no Step 1:
  window.p(1);
});

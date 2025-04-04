// main.js (ajustado para remover função p(r) e suas chamadas)

// Objeto t, contendo dados do usuário + extras
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

// Array m para carrinho
let m = [];

/***********************************************
 * FUNÇÃO B() - Lê carrinho de localStorage ou fallback
 ***********************************************/
function B() {
  const shoppingCartEl = document.getElementById("shoppingCart");
  if (shoppingCartEl && shoppingCartEl.items && shoppingCartEl.items.length > 0) {
    m = shoppingCartEl.items;
  } else {
    const storedCart = localStorage.getItem("cartItems");
    if (storedCart) {
      m = JSON.parse(storedCart);
    } else {
      // Exemplo fictício
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

/***********************************************
 * FUNÇÃO v() - Exibe itens do carrinho no DOM
 ***********************************************/
function v(arr) {
  const cartItemsList = document.getElementById("cartItemsList");
  let total = 0;
  let html = "";

  arr.forEach(item => {
    const price = item.basePriceAdult || 80;
    total += price;
    html += `
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
          R$ ${price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </div>
      </div>
    `;
  });
  // Somar custo de seguro (insuranceCost)
  if (t.insuranceCost) {
    total += t.insuranceCost;
  }

  cartItemsList.innerHTML = html;
  document.getElementById("subtotalValue").textContent = "R$ " + total.toLocaleString("pt-BR",{minimumFractionDigits:2});
  document.getElementById("discountValue").textContent = "- R$ 0,00";
  document.getElementById("totalValue").textContent = "R$ " + total.toLocaleString("pt-BR",{minimumFractionDigits:2});
}

/***********************************************
 * FUNÇÃO h() - Monta a tela de passageiros extras
 ***********************************************/
function h(arr) {
  const modalPassengerContainer = document.getElementById("modalPassengerContainer");
  const copyForAllBtn = document.getElementById("copyForAllBtn");

  modalPassengerContainer.innerHTML = "";
  t.extraPassengers = [];
  let totalExtraPassengers = 0;

  arr.forEach((item, idx) => {
    const adultCount = (item.adults || 1) - 1; 
    if (adultCount > 0) {
      totalExtraPassengers++;
      t.extraPassengers[idx] = [];

      const wrapper = document.createElement("div");
      wrapper.classList.add("passenger-box");
      wrapper.innerHTML = `<h4>${item.hotelName || "Item"}</h4>`;

      for (let i = 0; i < adultCount; i++) {
        const div2cols = document.createElement("div");
        div2cols.classList.add("fields-grid-2cols-modal");
        div2cols.innerHTML = `
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
        wrapper.appendChild(div2cols);
      }
      modalPassengerContainer.appendChild(wrapper);
    }
  });

  copyForAllBtn.style.display = totalExtraPassengers > 1 ? "inline-block" : "none";
}

/***********************************************
 * FUNÇÃO x() - controla modal de passageiros extras
 ***********************************************/
function x() {
  const passengerModal = document.getElementById("passengerModal");
  const openPassengerModal = document.getElementById("openPassengerModal");
  const closeModal = document.getElementById("closeModal");
  const savePassengersBtn = document.getElementById("savePassengersBtn");
  const copyForAllBtn = document.getElementById("copyForAllBtn");
  const modalPassengerContainer = document.getElementById("modalPassengerContainer");

  openPassengerModal.addEventListener("click", e => {
    e.preventDefault();
    h(m);
    passengerModal.style.display = "block";
  });

  closeModal.addEventListener("click", () => {
    passengerModal.style.display = "none";
  });

  savePassengersBtn.addEventListener("click", () => {
    passengerModal.style.display = "none";
    alert("Passageiros extras salvos!");
  });

  copyForAllBtn.addEventListener("click", () => {
    let firstIndex = null;
    let countSame  = 0;
    // Acha o primeiro item com adultCount > 0
    for(let i=0; i<m.length; i++){
      const adultCount = (m[i].adults || 1) - 1;
      if(adultCount>0) {
        firstIndex = i;
        countSame = adultCount;
        break;
      }
    }
    if(firstIndex===null) return;

    const firstPassengers = t.extraPassengers[firstIndex] || [];
    // Copia para todos os itens que tenham adultCount == countSame
    for(let i=0; i<m.length; i++){
      if(i!==firstIndex){
        const adultCount = (m[i].adults||1)-1;
        if(adultCount===countSame && adultCount>0){
          t.extraPassengers[i] = JSON.parse(JSON.stringify(firstPassengers));
          // reflete no DOM
          for(let j=0; j<adultCount; j++){
            const selName = `.modalExtraNameInput[data-item-index="${i}"][data-passenger-index="${j}"]`;
            const selBday = `.modalExtraBirthdateInput[data-item-index="${i}"][data-passenger-index="${j}"]`;
            const inpName = document.querySelector(selName);
            const inpBday = document.querySelector(selBday);
            if(inpName && inpBday && t.extraPassengers[i][j]){
              inpName.value  = t.extraPassengers[i][j].name || "";
              inpBday.value  = t.extraPassengers[i][j].birthdate || "";
            }
          }
        }
      }
    }
    alert("Dados copiados para todos os itens compatíveis!");
  });

  // event de input => atualiza t.extraPassengers
  modalPassengerContainer.addEventListener("input", e => {
    const target = e.target;
    if(target.classList.contains("modalExtraNameInput") ||
       target.classList.contains("modalExtraBirthdateInput")) {
      const itemIndex      = parseInt(target.getAttribute("data-item-index"), 10);
      const passengerIndex = parseInt(target.getAttribute("data-passenger-index"), 10);

      if(!t.extraPassengers[itemIndex]) {
        t.extraPassengers[itemIndex] = [];
      }
      if(!t.extraPassengers[itemIndex][passengerIndex]) {
        t.extraPassengers[itemIndex][passengerIndex] = {};
      }

      if(target.classList.contains("modalExtraNameInput")){
        t.extraPassengers[itemIndex][passengerIndex].name = target.value;
      } else {
        t.extraPassengers[itemIndex][passengerIndex].birthdate = target.value;
      }
    }
  });
}

/***********************************************
 * FUNÇÃO $() - Step 1 e 2 lógicas
 ***********************************************/
function $() {
  const toStep2Btn   = document.getElementById("toStep2");
  const backToStep1  = document.getElementById("backToStep1");
  const toStep3Btn   = document.getElementById("toStep3");
  const backToStep2  = document.getElementById("backToStep2");

  // Ir para Step 2 (era p(2) antes)
  toStep2Btn.addEventListener("click", ()=>{
    // Lógica de validação
    if(!localStorage.getItem("agentId")){
      // Se nao tem agentId, exige forms
      if(!document.getElementById("firstName").value ||
         !document.getElementById("lastName").value  ||
         !document.getElementById("celular").value   ||
         !document.getElementById("email").value     ||
         !document.getElementById("password").value  ||
         !document.getElementById("confirmPassword").value) {
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
    if(!document.getElementById("cpf").value        ||
       !document.getElementById("rg").value         ||
       !document.getElementById("birthdate").value  ||
       !document.getElementById("cep").value        ||
       !document.getElementById("state").value      ||
       !document.getElementById("city").value       ||
       !document.getElementById("address").value    ||
       !document.getElementById("number").value) {
      alert("Por favor, preencha todos os campos obrigatórios antes de continuar.");
      return;
    }

    // Salva no t
    t.cpf       = document.getElementById("cpf").value;
    t.rg        = document.getElementById("rg").value;
    t.birthdate = document.getElementById("birthdate").value;
    t.cep       = document.getElementById("cep").value;
    t.state     = document.getElementById("state").value;
    t.city      = document.getElementById("city").value;
    t.address   = document.getElementById("address").value;
    t.number    = document.getElementById("number").value;

    // Em vez de p(2), faça algo manual ou nada
    // Se você quiser trocar o Step aqui, use outro script
    // (ex.: document.querySelector('[data-step="1"]').classList.remove("active"); etc.)
  });

  // Voltar do Step 2 -> Step 1
  if(backToStep1) {
    backToStep1.addEventListener("click", () => {
      // p(1) removido
      // se quiser voltar manual: 
      // document.querySelector('[data-step="2"]').classList.remove("active");
      // document.querySelector('[data-step="1"]').classList.add("active");
    });
  }

  // Ir Step 2 -> Step 3 (era p(3))
  if(toStep3Btn){
    toStep3Btn.addEventListener("click", ()=>{
      const insuranceOption = document.querySelector('input[name="insuranceOption"]:checked');
      t.insuranceSelected = insuranceOption ? insuranceOption.value : "none";

      let cost = 0;
      if(t.insuranceSelected==="essencial") cost=60.65;
      else if(t.insuranceSelected==="completo") cost=101.09;
      t.insuranceCost = cost;

      v(m); // recalcula total com insurance

      // Se quiser trocar Step manualmente, ex.:
      // document.querySelector('[data-step="2"]').classList.remove("active");
      // document.querySelector('[data-step="3"]').classList.add("active");
    });
  }

  // Voltar Step 3 -> Step 2
  if(backToStep2){
    backToStep2.addEventListener("click", ()=>{
      // p(2) removido
      // ou manual: 
      // document.querySelector('[data-step="3"]').classList.remove("active");
      // document.querySelector('[data-step="2"]').classList.add("active");
    });
  }
}

/***********************************************
 * FUNÇÃO b() - CEP, CPF e RG máscaras
 ***********************************************/
function b() {
  function buscaCEP(value) {
    value = value.replace(/\D/g, "");
    if(value.length===8){
      fetch(`https://viacep.com.br/ws/${value}/json/`)
        .then(r=>r.json())
        .then(data=>{
          if(data.erro){
            alert("CEP não encontrado!");
            return;
          }
          document.getElementById("address").value = data.logradouro || "";
          document.getElementById("city").value    = data.localidade || "";
          document.getElementById("state").value   = data.uf || "";
        })
        .catch(err=>{
          console.error("Erro ao buscar CEP:", err);
          alert("Não foi possível consultar o CEP.");
        });
    }
  }

  // MÁSCARAS
  document.getElementById("cep").addEventListener("blur", function(){
    buscaCEP(this.value);
  });
  document.getElementById("cpf").addEventListener("input", function(e){
    let val = e.target.value.replace(/\D/g, "");
    if(val.length>3)  val=val.replace(/^(\d{3})(\d)/, "$1.$2");
    if(val.length>6)  val=val.replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3");
    if(val.length>9)  val=val.replace(/(\d{3})\.(\d{3})\.(\d{3})(\d{1,2}).*/, "$1.$2.$3-$4");
    e.target.value = val;
  });
  document.getElementById("rg").addEventListener("input", function(e){
    let val = e.target.value.replace(/\D/g, "");
    if(val.length>2) val=val.replace(/^(\d{2})(\d)/, "$1.$2");
    if(val.length>5) val=val.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    if(val.length>7) val=val.replace(/(\d{2})\.(\d{3})\.(\d{3})(\d{1}).*/, "$1.$2.$3-$4");
    e.target.value = val;
  });

  // LOGIN
  const toggleLogin        = document.getElementById("toggleLogin");
  const registrationFields = document.getElementById("registrationFieldsGeneral");
  const loginFields        = document.getElementById("loginFields");

  if(toggleLogin){
    toggleLogin.addEventListener("click", ev=>{
      ev.preventDefault();
      if(registrationFields.style.display!=="none"){
        registrationFields.style.display="none";
        loginFields.style.display="block";
        toggleLogin.textContent="Não tenho Login";
      } else {
        registrationFields.style.display="block";
        loginFields.style.display="none";
        toggleLogin.textContent="Economize tempo fazendo Login";
      }
    });
  }

  // Botão loginValidateBtn
  const loginValidateBtn = document.getElementById("loginValidateBtn");
  if(loginValidateBtn){
    loginValidateBtn.addEventListener("click", ()=>{
      const loginEmail = document.getElementById("loginEmail").value;
      const loginPass  = document.getElementById("loginPassword").value;
      fetch("/api/users/login", {
        method:"POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ email: loginEmail, password: loginPass })
      })
      .then(r=>r.json())
      .then(res=>{
        if(res.success){
          localStorage.setItem("agentId", res.user.id);
          alert("Login efetuado com sucesso!");
          toggleLogin.style.display="none";
          registrationFields.style.display="none";
          loginFields.style.display="none";
        } else {
          alert("Erro no login: "+(res.error||"Dados inválidos."));
        }
      })
      .catch(err=>{
        console.error(err);
        alert("Erro ao realizar o login. Tente novamente.");
      });
    });
  }
}

/***********************************************
 * Ao carregar, executa B, v, b, $, x...
 ***********************************************/
window.addEventListener("load", ()=>{
  B();       // Carrega/define m[]
  v(m);      // Exibe carrinho
  b();       // Máscaras e login
  $();       // Lógicas de step 1 e 2
  x();       // Modal de passageiros extras

  // Se user estiver logado, esconde toggleLogin
  const isLogged    = !!localStorage.getItem("agentId");
  const toggleLogin = document.getElementById("toggleLogin");
  const regFields   = document.getElementById("registrationFieldsGeneral");
  const logFields   = document.getElementById("loginFields");

  if(isLogged){
    if(toggleLogin) toggleLogin.style.display = "none";
    if(regFields)   regFields.style.display   = "none";
    if(logFields)   logFields.style.display   = "none";
  } else {
    if(toggleLogin) toggleLogin.style.display = "block";
    if(regFields)   regFields.style.display   = "block";
  }

  // Antes chamava p(1) => removido
  // p(r) e as chamadas a p(...) foram removidas
});

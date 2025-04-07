/***********************************************************
 * 1) window.p(step) → controla a visibilidade dos steps
 ***********************************************************/
window.p = function (stepNumber) {
  const stepContents = document.querySelectorAll(".step-content");
  const stepsMenu    = document.querySelectorAll(".steps-menu .step");

  // Mostra/esconde cada .step-content
  stepContents.forEach((content) => {
    content.classList.toggle("active", content.dataset.step === String(stepNumber));
  });

  // Controla as bolinhas do menu de steps
  stepsMenu.forEach((el) => {
    const sNum = parseInt(el.dataset.step, 10);
    el.classList.toggle("active", sNum === stepNumber);
    if (sNum > stepNumber) el.classList.add("disabled");
    else el.classList.remove("disabled");
  });
};

/***********************************************************
 * 2) Variáveis Globais:
 *    - Objeto "t" com dados do passageiro principal
 *    - Array "m" com itens do carrinho
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

let m = []; // Carrinho

// Para guardar o valor total (em centavos) antes do pagamento
let finalAmount = 0;

/***********************************************************
 * 3) Funções de ALERTA (showAlertSuccess / showAlertError)
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
      <p style="margin-top: 0.5rem;">
        ${message}
      </p>
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
 * 4) Carrega o Carrinho (função B())
 ***********************************************************/
function B() {
  const shoppingEl = document.getElementById("shoppingCart");

  if (shoppingEl && shoppingEl.items && shoppingEl.items.length > 0) {
    // Se <shopping-cart> tiver items
    m = shoppingEl.items;
    console.log("DEBUG - <shopping-cart> com items =>", m);
  } else {
    // Tenta localStorage
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

  // Expõe globalmente (se precisar em outro script)
  window.u = m;
}

/***********************************************************
 * 5) Atualiza resumo do carrinho (função f())
 ***********************************************************/
function f(arr) {
  const cartItemsList = document.getElementById("cartItemsList");
  if (!cartItemsList) return;

  let total = 0;
  let htmlStr = "";

  arr.forEach((item) => {
    const basePrice = item.basePriceAdult || 80; // fallback
    total += basePrice;

    htmlStr += `
      <div class="reserva-item">
        <div class="reserva-left">
          <span class="categoria">${item.type || "Hospedagem"}</span>
          <span class="nome">
            ${item.hotelName || "Hotel Desconhecido"} - ${item.roomName || "Quarto"}
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

  // Se tiver custo do seguro, soma
  if (t.insuranceCost) {
    total += t.insuranceCost;
  }

  cartItemsList.innerHTML = htmlStr;

  // Subtotal, Desconto, Total
  const elSubtotal = document.getElementById("subtotalValue");
  const elDiscount = document.getElementById("discountValue");
  const elTotal    = document.getElementById("totalValue");

  if (elSubtotal) elSubtotal.textContent =
    "R$ " + total.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  if (elDiscount) elDiscount.textContent = "- R$ 0,00";
  if (elTotal)    elTotal.textContent =
    "R$ " + total.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

/***********************************************************
 * 6) Modal de passageiros extras (h(m)) e x()
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

  // Se há mais de 1 item c/ multipleAdults => Copiar para todos
  copyForAllBtn.style.display = countOfMulti > 1 ? "inline-block" : "none";
}

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

    // Acha primeiro item com multipleAdults
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
          t.extraPassengers[i] = JSON.parse(JSON.stringify(firstArr));
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

  // Ao digitar no modal, preenche t.extraPassengers
  modalContainer.addEventListener("input", (evt) => {
    const el = evt.target;
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

/***********************************************************
 * 7) Navegação entre Steps: $()
 ***********************************************************/
function $() {
  const toStep2Btn   = document.getElementById("toStep2");
  const backToStep1  = document.getElementById("backToStep1");
  const toStep3Btn   = document.getElementById("toStep3");
  const backToStep2  = document.getElementById("backToStep2");

  // Step 1 -> Step 2
  if (toStep2Btn) {
    toStep2Btn.addEventListener("click", () => {
      // Se não tiver agentId, forçamos check do form de registro
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
        t.firstName       = document.getElementById("firstName").value;
        t.lastName        = document.getElementById("lastName").value;
        t.celular         = document.getElementById("celular").value;
        t.email           = document.getElementById("email").value;
        t.password        = document.getElementById("password").value;
        t.confirmPassword = document.getElementById("confirmPassword").value;
      }

      // Verifica documentos/endereço
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

      // Armazena no objeto t
      t.cpf       = document.getElementById("cpf").value;
      t.rg        = document.getElementById("rg").value;
      t.birthdate = document.getElementById("birthdate").value;
      t.cep       = document.getElementById("cep").value;
      t.state     = document.getElementById("state").value;
      t.city      = document.getElementById("city").value;
      t.address   = document.getElementById("address").value;
      t.number    = document.getElementById("number").value;

      // Avança step 2
      p(2);
    });
  }

  // Step 2 -> Step 1 (Voltar)
  if (backToStep1) {
    backToStep1.addEventListener("click", () => {
      p(1);
    });
  }

  // Step 2 -> Step 3
  if (toStep3Btn) {
    toStep3Btn.addEventListener("click", async () => {
      // (1) Lê o radio do seguro
      const selectedRadio = document.querySelector('input[name="insuranceOption"]:checked');
      t.insuranceSelected = selectedRadio ? selectedRadio.value : "none";

      let cost = 0;
      if (t.insuranceSelected === "essencial") cost = 60.65;
      else if (t.insuranceSelected === "completo") cost = 101.09;
      t.insuranceCost = cost;

      // (2) Recalcula e exibe total
      f(m);

      // (3) Lê #totalValue → finalAmount (em centavos)
      finalAmount = getCartAmountInCents();
      console.log("DEBUG - finalAmount =>", finalAmount);

      if (finalAmount <= 0) {
        alert("Valor do pedido não pode ser 0!");
        return;
      }

      // (4) Se e-mail for inválido
      if (!t.email || !t.email.includes("@")) {
        alert("E-mail inválido.");
        return;
      }

      // (5) Exemplo: define affiliateId
      m.forEach((item) => {
        item.affiliateId = 101;
        item.geradoPor   = localStorage.getItem("cartOwnerId") || "System";
      });

      // (6) Cria pedido no banco
      let realOrderId;
      try {
        realOrderId = await initOrderInDb(m, t);
        localStorage.setItem("myRealOrderId", realOrderId);
        console.log("Pedido pendente criado. ID=", realOrderId);
      } catch (err) {
        alert("Falha ao criar pedido no banco: " + err.message);
        return;
      }

      // (7) Configura Malga
      malgaCheckout.transactionConfig.orderId = String(realOrderId);
      malgaCheckout.transactionConfig.amount  = finalAmount;

      // Monta customer
      malgaCheckout.transactionConfig.customer = {
        name:        `${t.firstName} ${t.lastName}`,
        email:       t.email,
        phoneNumber: t.celular,
        document: {
          type:    "CPF",
          number:  t.cpf,
          country: "BR",
        },
        address: {
          zipCode:      document.getElementById("cep")?.value    || "",
          street:       document.getElementById("address")?.value|| "",
          streetNumber: document.getElementById("number")?.value || "S/N",
          complement:   "",
          neighborhood: "",
          city:         document.getElementById("city")?.value   || "",
          state:        document.getElementById("state")?.value  || "",
          country:      "BR",
        },
      };

      // Ajusta pix/boleto p/ finalAmount
      malgaCheckout.paymentMethods.pix.items[0].unitPrice    = finalAmount;
      malgaCheckout.paymentMethods.boleto.items[0].unitPrice = finalAmount;

      // (8) Avança step 3
      p(3);
    });
  }

  // Step 3 -> Step 2 (Voltar)
  if (backToStep2) {
    backToStep2.addEventListener("click", () => {
      p(2);
    });
  }
}

/***********************************************************
 * 8) Máscaras e Lógica de Login (função b())
 ***********************************************************/
function b() {
  // Função p/ CEP
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

  // CEP
  const cepInput = document.getElementById("cep");
  if (cepInput) {
    cepInput.addEventListener("blur", () => {
      buscaCep(cepInput.value);
    });
  }

  // CPF
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

  // RG
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

  // Toggle login vs registro
  const toggleLoginLink  = document.getElementById("toggleLogin");
  const registrationDiv  = document.getElementById("registrationFieldsGeneral");
  const loginDiv         = document.getElementById("loginFields");

  if (toggleLoginLink && registrationDiv && loginDiv) {
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

  // Botão "Entrar" do login
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
            if (loginDiv)        loginDiv.style.display        = "none";
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
 * 9) initOrderInDb – Cria pedido PENDING no banco
 ***********************************************************/
async function initOrderInDb(cartItems, userObj) {
  try {
    const resp = await fetch("/api/orderInit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cart: cartItems, user: userObj }),
    });
    const data = await resp.json();
    if (!data.success) {
      throw new Error(data.message || "Falha ao criar pedido");
    }
    return data.orderId;
  } catch (err) {
    console.error("Erro em initOrderInDb:", err);
    throw err;
  }
}

/***********************************************************
 * 10) Configurando MALGA CHECKOUT
 ***********************************************************/
const malgaCheckout = document.querySelector("#malga-checkout");

if (malgaCheckout) {
  // Ajusta meios de pagamento
  malgaCheckout.paymentMethods = {
    pix: {
      expiresIn: 600,
      items: [
        {
          id: "pixItemABC",
          title: "Produto Pix",
          quantity: 1,
          unitPrice: 0,
        },
      ],
    },
    credit: {
      installments: { quantity: 10, show: true },
      showCreditCard: true,
    },
    boleto: {
      expiresDate: "2025-12-31",
      instructions: "Boleto Exemplo (Produção)",
      interest: { days: 1, amount: 1000 },
      fine: { days: 2, amount: 500 },
      items: [
        {
          id: "boletoItemABC",
          title: "Produto Boleto",
          quantity: 1,
          unitPrice: 0,
        },
      ],
    },
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
        country: "BR",
      },
    },
  };

  // Desativa popup do Malga
  malgaCheckout.dialogConfig = {
    show: false,
    actionButtonLabel: "Continuar",
    errorActionButtonLabel: "Tentar novamente",
    successActionButtonLabel: "Continuar",
    successRedirectUrl: "",
    pixFilledProgressBarColor: "#2FAC9B",
    pixEmptyProgressBarColor: "#D8DFF0",
  };

  // PaymentSuccess
  malgaCheckout.addEventListener("paymentSuccess", async (event) => {
    console.log("Pagamento concluído com sucesso:", event.detail);
    // Limpa alert anterior
    showAlertSuccess("");

    // 1) cardId
    const cardId   = event.detail.data.paymentSource?.cardId;
    const meioPgto = event.detail.data.paymentMethod.paymentType || "desconhecido";
    const parcelas = event.detail.data.paymentMethod.installments || 1;

    // 2) Tenta brand / nome no cartão
    let brandVal  = "desconhecido";
    let holderVal = "Nome do Cartão";
    if (cardId) {
      try {
        const cardResp = await fetch(`https://api.malga.io/v1/cards/${cardId}`, {
          method: "GET",
          headers: {
            "X-Client-Id": "4457c178-0f07-4589-ba0e-954e5816fd0f",
            "X-Api-Key":   "bfabc953-1ea0-45d0-95e4-4968cfe2a00e",
          },
        });
        if (cardResp.ok) {
          const cardData = await cardResp.json();
          brandVal  = cardData?.brand           || brandVal;
          holderVal = cardData?.cardHolderName  || holderVal;
        } else {
          console.warn("Falha /v1/cards:", cardResp.status);
        }
      } catch (err) {
        console.error("Erro /v1/cards:", err);
      }
    }

    // 3) Monta update
    const realOrderId = localStorage.getItem("myRealOrderId") || malgaCheckout.transactionConfig.orderId;
    const dataToUpdate = {
      status:          "pago",
      nome_comprador:  holderVal,
      bandeira_cartao: brandVal,
      meio_pgto:       meioPgto,
      parcelas,
      valor_venda:     finalAmount / 100, // finalAmount = cents
      data_pgto:       new Date().toISOString().slice(0, 10),
      gateway:         "Malga",
    };

    // 4) Chama /api/orderComplete
    try {
      const resp = await fetch("/api/orderComplete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: realOrderId, dataToUpdate }),
      });
      const result = await resp.json();

      if (!result.success) {
        console.error("Erro ao atualizar (pago):", result.message);
        showAlertError("Falha ao atualizar o pedido no banco.");
        return;
      }

      showAlertSuccess(`Success - Pedido #${realOrderId} marcado como pago!`);
      console.log("Pedido atualizado (pago):", result.updatedData);

      // Ajusta step 4
      document.getElementById("finalTitle").textContent =
        `Parabéns ${t.firstName || "(nome)"} pela sua escolha!`;
      document.getElementById("finalMsg").textContent =
        `Seu pedido #${realOrderId} foi concluído com sucesso.`;
      document.getElementById("finalThanks").textContent =
        "Aproveite a viagem!";

      // Esconde col. direita
      const rightCol = document.querySelector(".right-col");
      if (rightCol) rightCol.style.display = "none";

      p(4);
    } catch (error) {
      console.error("Exceção /api/orderComplete:", error);
      showAlertError(`Exceção ao chamar orderComplete: ${error.message}`);
    }
  });

  // PaymentFailed
  malgaCheckout.addEventListener("paymentFailed", async (event) => {
    console.log("Falha no pagamento:", event.detail);

    showAlertError("Erro - Pagamento falhou! Verifique o console.");

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
  });
}

/***********************************************************
 * 11) getCartAmountInCents – Lê #totalValue
 ***********************************************************/
function getCartAmountInCents() {
  const elTotal = document.getElementById("totalValue");
  if (!elTotal) return 0;

  let txt = elTotal.textContent.trim(); // ex: "R$ 300,00"
  txt     = txt.replace(/[^\d.,-]/g, ""); // "300,00"
  txt     = txt.replace(/\./g, "");       // remove pontos de milhar
  txt     = txt.replace(",", ".");        // vira "300.00"
  const val = parseFloat(txt);
  if (isNaN(val)) return 0;
  return Math.round(val * 100);
}

/***********************************************************
 * 12) window.onload => Carrega carrinho, atualiza UI, etc
 ***********************************************************/
window.addEventListener("load", () => {
  // 1) Carrega carrinho
  B();

  // 2) Atualiza UI do carrinho
  f(m);

  // 3) Máscaras e Login
  b();

  // 4) Navegação steps
  $();

  // 5) Modal de passageiros extras
  x();

  // Se já tiver agentId => oculta form
  const hasAgent       = !!localStorage.getItem("agentId");
  const toggleLoginL   = document.getElementById("toggleLogin");
  const regFields      = document.getElementById("registrationFieldsGeneral");
  const loginFields    = document.getElementById("loginFields");

  if (hasAgent) {
    if (toggleLoginL) toggleLoginL.style.display   = "none";
    if (regFields)    regFields.style.display      = "none";
    if (loginFields)  loginFields.style.display    = "none";
  } else {
    if (toggleLoginL) toggleLoginL.style.display   = "block";
    if (regFields)    regFields.style.display      = "block";
  }

  // Inicia no step 1
  p(1);
});

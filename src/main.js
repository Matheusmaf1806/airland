// src/main.js – Front-end principal do Checkout com Hosted Fields do Malga

console.log("Checkout ativo");

/* 
      1) Importamos o SDK de Tokenization oficial da Malga.
         Ajuste caminhos, versões e credenciais conforme seu ambiente.
    */
    import { tokenization } from '@malga/tokenization';

    // Substitua por suas credenciais de sandbox
    const malgaTokenization = tokenization({
      apiKey: 'SUA_API_KEY_PUBLIC',
      clientId: 'SEU_CLIENT_ID',
      options: {
        config: {
          fields: {
            cardNumber: {
              container: 'card-number',
              type: 'text',
              placeholder: 'Número do Cartão',
              needMask: true,
              defaultValidation: true
            },
            cardHolderName: {
              container: 'card-holder-name',
              type: 'text',
              placeholder: 'Nome do Titular',
              needMask: false,
              defaultValidation: true
            },
            cardExpirationDate: {
              container: 'card-expiration-date',
              type: 'text',
              placeholder: 'MM/AA',
              needMask: true,
              defaultValidation: true
            },
            cardCvv: {
              container: 'card-cvv',
              type: 'text',
              placeholder: 'CVV',
              needMask: true,
              defaultValidation: true
            }
          },
          sandbox: true,
          styles: {
            input: {
              color: 'black',
              'font-size': '14px'
            },
            ':focus': {
              color: 'blue'
            }
          }
        }
      }
    });

    /*
      2) Objeto "checkoutData" para manter dados do formulário:
    */
    let checkoutData = {
      extraPassengers: [],
      insuranceSelected: "none" // "none", "30k" ou "80k"
    };

    // Referências para steps/telas
    const stepContents = document.querySelectorAll(".step-content");
    const stepButtons = document.querySelectorAll("#stepsMenu .step");

    const toStep2Btn    = document.getElementById("toStep2");
    const backToStep1Btn= document.getElementById("backToStep1");
    const toStep3Btn    = document.getElementById("toStep3");
    const backToStep2Btn= document.getElementById("backToStep2");

    function showStep(stepNumber) {
      stepContents.forEach(content => {
        content.classList.toggle("active", content.dataset.step === String(stepNumber));
      });
      stepButtons.forEach(button => {
        const btnStep = parseInt(button.dataset.step, 10);
        button.classList.toggle("active", btnStep === stepNumber);
        if (btnStep > stepNumber) {
          button.classList.add("disabled");
        } else {
          button.classList.remove("disabled");
        }
      });
    }

    // Carrega/Simula itens no carrinho
    let cartItems = [];
    const cartElement = document.getElementById("shoppingCart");
    if (cartElement && cartElement.items && cartElement.items.length > 0) {
      cartItems = cartElement.items;
    } else {
      const savedCart = localStorage.getItem("cartItems");
      if (savedCart) {
        cartItems = JSON.parse(savedCart);
      } else {
        // Exemplo de itens default
        cartItems = [
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

    // STEP 1
    toStep2Btn.addEventListener("click", () => {
      const isLoggedIn = !!localStorage.getItem("agentId");
      if (!isLoggedIn) {
        // Checa campos de registro
        if (!document.getElementById("firstName").value ||
            !document.getElementById("lastName").value ||
            !document.getElementById("celular").value ||
            !document.getElementById("email").value ||
            !document.getElementById("password").value ||
            !document.getElementById("confirmPassword").value) {
          alert("Por favor, preencha todos os campos obrigatórios antes de continuar.");
          return;
        }
        checkoutData.firstName = document.getElementById("firstName").value;
        checkoutData.lastName  = document.getElementById("lastName").value;
        checkoutData.celular   = document.getElementById("celular").value;
        checkoutData.email     = document.getElementById("email").value;
        checkoutData.password  = document.getElementById("password").value;
        checkoutData.confirmPassword = document.getElementById("confirmPassword").value;
      }

      // Campos obrigatórios comuns
      if (!document.getElementById("cpf").value ||
          !document.getElementById("rg").value ||
          !document.getElementById("birthdate").value ||
          !document.getElementById("cep").value ||
          !document.getElementById("state").value ||
          !document.getElementById("city").value ||
          !document.getElementById("address").value ||
          !document.getElementById("number").value) {
        alert("Por favor, preencha todos os campos obrigatórios antes de continuar.");
        return;
      }
      
      checkoutData.cpf       = document.getElementById("cpf").value;
      checkoutData.rg        = document.getElementById("rg").value;
      checkoutData.birthdate = document.getElementById("birthdate").value;
      checkoutData.cep       = document.getElementById("cep").value;
      checkoutData.state     = document.getElementById("state").value;
      checkoutData.city      = document.getElementById("city").value;
      checkoutData.address   = document.getElementById("address").value;
      checkoutData.number    = document.getElementById("number").value;

      showStep(2);
    });

    // STEP 2
    toStep3Btn.addEventListener("click", () => {
      const selectedInsurance = document.querySelector('input[name="insuranceOption"]:checked');
      checkoutData.insuranceSelected = selectedInsurance ? selectedInsurance.value : "none";

      let insuranceCost = 0;
      if (checkoutData.insuranceSelected === "30k") {
        insuranceCost = 112.81;
      } else if (checkoutData.insuranceSelected === "80k") {
        insuranceCost = 212.02;
      }
      checkoutData.insuranceCost = insuranceCost;

      updateCheckoutCart(cartItems);
      showStep(3);
      initializePaymentMethod(); // Verifica qual método (card/pix/boleto) e inicializa
    });

    backToStep1Btn?.addEventListener("click", () => showStep(1));
    backToStep2Btn?.addEventListener("click", () => showStep(2));

    function updateCheckoutCart(items) {
      const container = document.getElementById("cartItemsList");
      if (!container) return;

      let subtotal = 0;
      let html = "";
      items.forEach(item => {
        let price = item.basePriceAdult || 80;
        subtotal += price;
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
      if (checkoutData.insuranceCost) {
        subtotal += checkoutData.insuranceCost;
      }
      container.innerHTML = html;
      document.getElementById("subtotalValue").textContent =
        "R$ " + subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
      document.getElementById("discountValue").textContent = "- R$ 0,00";
      document.getElementById("totalValue").textContent =
        "R$ " + subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    }

    // Modal de passageiros extras
    const passengerModal = document.getElementById("passengerModal");
    const openPassengerModalBtn = document.getElementById("openPassengerModal");
    const closeModalBtn = document.getElementById("closeModal");
    const savePassengersBtn = document.getElementById("savePassengersBtn");
    const modalPassengerContainer = document.getElementById("modalPassengerContainer");
    const copyForAllBtn = document.getElementById("copyForAllBtn");

    function createModalPassengerForms(items) {
      modalPassengerContainer.innerHTML = "";
      checkoutData.extraPassengers = [];
      let itemsWithExtras = 0;
      items.forEach((item, itemIndex) => {
        const extraCount = (item.adults || 1) - 1;
        if (extraCount > 0) {
          itemsWithExtras++;
          checkoutData.extraPassengers[itemIndex] = [];
          const itemDiv = document.createElement("div");
          itemDiv.classList.add("passenger-box");
          itemDiv.innerHTML = `<h4>${item.hotelName || "Item"}</h4>`;
          for (let i = 0; i < extraCount; i++) {
            const fieldsWrapper = document.createElement("div");
            fieldsWrapper.classList.add("fields-grid-2cols-modal");
            fieldsWrapper.innerHTML = `
              <div class="form-field">
                <label>Nome do Passageiro #${i+1}</label>
                <input type="text" placeholder="Nome completo" data-item-index="${itemIndex}" data-passenger-index="${i}" class="modalExtraNameInput" />
              </div>
              <div class="form-field">
                <label>Data de Nascimento</label>
                <input type="date" data-item-index="${itemIndex}" data-passenger-index="${i}" class="modalExtraBirthdateInput" />
              </div>
            `;
            itemDiv.appendChild(fieldsWrapper);
          }
          modalPassengerContainer.appendChild(itemDiv);
        }
      });
      copyForAllBtn.style.display = (itemsWithExtras > 1) ? "inline-block" : "none";
    }

    openPassengerModalBtn.addEventListener("click", e => {
      e.preventDefault();
      createModalPassengerForms(cartItems);
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
      let sourceIndex = null;
      let sourceExtraCount = 0;
      for (let i = 0; i < cartItems.length; i++) {
        let extraCount = (cartItems[i].adults || 1) - 1;
        if (extraCount > 0) {
          sourceIndex = i;
          sourceExtraCount = extraCount;
          break;
        }
      }
      if (sourceIndex === null) return;
      const sourceData = checkoutData.extraPassengers[sourceIndex] || [];
      for (let i = 0; i < cartItems.length; i++) {
        if (i !== sourceIndex) {
          let extraCount = (cartItems[i].adults || 1) - 1;
          if (extraCount === sourceExtraCount && extraCount > 0) {
            checkoutData.extraPassengers[i] = JSON.parse(JSON.stringify(sourceData));
            for (let passIndex = 0; passIndex < extraCount; passIndex++) {
              const nameSelector = `.modalExtraNameInput[data-item-index="${i}"][data-passenger-index="${passIndex}"]`;
              const birthSelector= `.modalExtraBirthdateInput[data-item-index="${i}"][data-passenger-index="${passIndex}"]`;
              const nameInput = document.querySelector(nameSelector);
              const birthInput= document.querySelector(birthSelector);
              if (nameInput && birthInput && checkoutData.extraPassengers[i][passIndex]) {
                nameInput.value  = checkoutData.extraPassengers[i][passIndex].name      || "";
                birthInput.value = checkoutData.extraPassengers[i][passIndex].birthdate || "";
              }
            }
          }
        }
      }
      alert("Dados copiados para todos os itens compatíveis!");
    });

    modalPassengerContainer.addEventListener("input", e => {
      const target = e.target;
      if (target.classList.contains("modalExtraNameInput") || target.classList.contains("modalExtraBirthdateInput")) {
        const itemIndex = parseInt(target.getAttribute("data-item-index"), 10);
        const passIndex = parseInt(target.getAttribute("data-passenger-index"), 10);
        if (!checkoutData.extraPassengers[itemIndex]) {
          checkoutData.extraPassengers[itemIndex] = [];
        }
        if (!checkoutData.extraPassengers[itemIndex][passIndex]) {
          checkoutData.extraPassengers[itemIndex][passIndex] = {};
        }
        if (target.classList.contains("modalExtraNameInput")) {
          checkoutData.extraPassengers[itemIndex][passIndex].name = target.value;
        } else {
          checkoutData.extraPassengers[itemIndex][passIndex].birthdate = target.value;
        }
      }
    });

    // STEP 3
    function initializePaymentMethod() {
      const method = document.querySelector('input[name="paymentMethod"]:checked').value;
      document.getElementById("card-container").style.display    = "none";
      document.getElementById("pix-container").style.display     = "none";
      document.getElementById("boleto-container").style.display  = "none";

      if (method === "card") {
        document.getElementById("card-container").style.display = "block";
        initializeMalgaCard();
      } else if (method === "pix") {
        document.getElementById("pix-container").style.display = "block";
        initializeMalgaPix();
      } else if (method === "boleto") {
        document.getElementById("boleto-container").style.display = "block";
        initializeMalgaBoleto();
      }
    }

    function initializeMalgaCard() {
      // Escuta o "submit" do form e realiza a tokenização
      const form = document.getElementById("checkout-form");
      form.addEventListener("submit", async (evt) => {
        evt.preventDefault();
        try {
          const { tokenId, error } = await malgaTokenization.tokenize();
          if (error) {
            console.error("Erro na tokenização:", error.message);
            alert("Erro ao processar o cartão.");
            return;
          }
          // Chamamos a função que manda ao back-end
          processPayment(tokenId, "card");
        } catch (err) {
          console.error("Erro inesperado na tokenização:", err);
          alert("Erro inesperado ao tokenizar o cartão.");
        }
      });
    }

    function initializeMalgaPix() {
      const pixContainer = document.getElementById("pix-container");
      pixContainer.innerHTML = "<button id='generatePixBtn'>Gerar QR/Código Pix</button><div id='pixCodeDisplay'></div>";

      document.getElementById("generatePixBtn").addEventListener("click", async () => {
        const amount = getOrderAmount();
        try {
          // Chamamos nosso back-end, que internamente chama a Malga para gerar Pix
          const res = await fetch("/api/malga/create-transaction", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paymentMethod: "pix",
              amount: amount,
              extraPassengers: checkoutData.extraPassengers
              // etc. Quaisquer dados adicionais que queira mandar
            })
          });
          const result = await res.json();
          if (result.success) {
            // Exiba o código Pix, QR, ID de transação etc.
            document.getElementById("pixCodeDisplay").innerText = "Código Pix: " + (result.pixCode || "(retornado pelo backend)");
          } else {
            alert("Falha no pagamento: " + result.message);
          }
        } catch (err) {
          console.error("Erro ao gerar Pix:", err);
          alert("Erro ao gerar Pix. Tente novamente.");
        }
      });
    }

    function initializeMalgaBoleto() {
      const boletoContainer = document.getElementById("boleto-container");
      boletoContainer.innerHTML = "<button id='generateBoletoBtn'>Gerar Boleto</button><div id='boletoDisplay'></div>";

      document.getElementById("generateBoletoBtn").addEventListener("click", async () => {
        const amount = getOrderAmount();
        try {
          // Chamamos nosso back-end, que internamente chama a Malga para gerar Boleto
          const res = await fetch("/api/malga/create-transaction", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paymentMethod: "boleto",
              amount: amount,
              extraPassengers: checkoutData.extraPassengers
            })
          });
          const result = await res.json();
          if (result.success) {
            // Exiba a URL para download/visualização do Boleto, ID de transação etc.
            document.getElementById("boletoDisplay").innerText = "Boleto gerado: " + (result.boletoUrl || "(retornado pelo backend)");
          } else {
            alert("Falha ao gerar Boleto: " + result.message);
          }
        } catch (err) {
          console.error("Erro ao gerar Boleto:", err);
          alert("Erro ao gerar Boleto. Tente novamente.");
        }
      });
    }

    async function processPayment(token, method) {
      let amount = getOrderAmount();
      let installments = "1";
      if (method === "card") {
        const installmentsSelect = document.getElementById("installments");
        if (installmentsSelect) {
          installments = installmentsSelect.value;
        }
      }

      const body = {
        paymentMethod: method,
        paymentToken: token, // tokenId do cartão
        amount: amount,
        installments: installments,
        customer: {
          firstName: checkoutData.firstName,
          lastName: checkoutData.lastName,
          email: checkoutData.email,
          phone: checkoutData.celular
        },
        billing: {
          streetAddress: checkoutData.address,
          extendedAddress: checkoutData.number,
          locality: checkoutData.city,
          region: checkoutData.state,
          postalCode: checkoutData.cep,
          countryCodeAlpha2: "BR"
        },
        extraPassengers: checkoutData.extraPassengers,
        insuranceSelected: checkoutData.insuranceSelected
      };

      try {
        const res = await fetch("/api/malga/create-transaction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        const result = await res.json();
        if (result.success) {
          alert("Pagamento aprovado! Transaction ID: " + result.transactionId);
          showStep(4);
        } else {
          alert("Falha no pagamento: " + result.message);
        }
      } catch (error) {
        console.error("Erro ao processar pagamento:", error);
        alert("Erro ao processar pagamento. Tente novamente.");
      }
    }

    function getOrderAmount() {
      let totalText = document.getElementById("totalValue").textContent;
      let amount = totalText.replace("R$", "").trim().replace(/\./g, "").replace(",", ".");
      return parseFloat(amount).toFixed(2);
    }

    // LOGIN (Opcional)
    const toggleLogin         = document.getElementById("toggleLogin");
    const registrationFields  = document.getElementById("registrationFieldsGeneral");
    const loginFields         = document.getElementById("loginFields");
    const loginValidateBtn    = document.getElementById("loginValidateBtn");

    if (toggleLogin) {
      toggleLogin.addEventListener("click", e => {
        e.preventDefault();
        if (registrationFields.style.display !== "none") {
          registrationFields.style.display = "none";
          loginFields.style.display = "block";
          toggleLogin.textContent = "Não tenho Login";
        } else {
          registrationFields.style.display = "block";
          loginFields.style.display = "none";
          toggleLogin.textContent = "Economize tempo fazendo Login";
        }
      });
    }

    if (loginValidateBtn) {
      loginValidateBtn.addEventListener("click", () => {
        const email    = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;
        fetch("/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            localStorage.setItem("agentId", data.user.id);
            alert("Login efetuado com sucesso!");
            toggleLogin.style.display = "none";
            registrationFields.style.display = "none";
            loginFields.style.display = "none";
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

    // CEP auto-complete
    function buscarCEP(cep) {
      cep = cep.replace(/\D/g, '');
      if (cep.length === 8) {
        const url = `https://viacep.com.br/ws/${cep}/json/`;
        fetch(url)
          .then(response => response.json())
          .then(data => {
            if (data.erro) {
              alert("CEP não encontrado!");
              return;
            }
            document.getElementById("address").value = data.logradouro || "";
            document.getElementById("city").value    = data.localidade || "";
            document.getElementById("state").value   = data.uf || "";
          })
          .catch(error => {
            console.error("Erro ao buscar CEP:", error);
            alert("Não foi possível consultar o CEP.");
          });
      }
    }
    document.getElementById("cep").addEventListener("blur", function() {
      buscarCEP(this.value);
    });

    // Máscara CPF
    document.getElementById("cpf").addEventListener("input", function(e) {
      let value = e.target.value.replace(/\D/g, '');
      if(value.length > 3) {
        value = value.replace(/^(\d{3})(\d)/, '$1.$2');
      }
      if(value.length > 6) {
        value = value.replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3');
      }
      if(value.length > 9) {
        value = value.replace(/(\d{3})\.(\d{3})\.(\d{3})(\d{1,2}).*/, '$1.$2.$3-$4');
      }
      e.target.value = value;
    });

    // Máscara RG
    document.getElementById("rg").addEventListener("input", function(e) {
      let value = e.target.value.replace(/\D/g, '');
      if(value.length > 2) {
        value = value.replace(/^(\d{2})(\d)/, '$1.$2');
      }
      if(value.length > 5) {
        value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
      }
      if(value.length > 7) {
        value = value.replace(/(\d{2})\.(\d{3})\.(\d{3})(\d{1}).*/, '$1.$2.$3-$4');
      }
      e.target.value = value;
    });

    // Modais 30k e 80k
    document.querySelectorAll('.open30kModal').forEach(el => {
      el.addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('modalIntermac30K').style.display = 'block';
      });
    });
    document.querySelectorAll('.open80kModal').forEach(el => {
      el.addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('modalIntermac80K').style.display = 'block';
      });
    });
    document.querySelectorAll('.close-modal').forEach(closeBtn => {
      closeBtn.addEventListener('click', function() {
        const modalId = this.getAttribute('data-close-modal');
        if (modalId) {
          document.getElementById(modalId).style.display = 'none';
        }
      });
    });

    // Inicialização da página
    window.addEventListener("load", () => {
      updateCheckoutCart(cartItems);
      const isLoggedIn = !!localStorage.getItem("agentId");
      const toggleLoginLink = document.getElementById("toggleLogin");
      const registrationFieldsGeneral = document.getElementById("registrationFieldsGeneral");
      const loginFields = document.getElementById("loginFields");
      if (isLoggedIn) {
        toggleLoginLink.style.display = "none";
        registrationFieldsGeneral.style.display = "none";
        loginFields.style.display = "none";
      } else {
        toggleLoginLink.style.display = "block";
        registrationFieldsGeneral.style.display = "block";
      }
    });

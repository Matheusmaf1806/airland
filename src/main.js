/* =========================================================================
   main.js - Exemplo completo de Checkout com Integração Malga (Card/Pix/Boleto)
   =========================================================================
   Observações:
   1) Substitua "MALGA_API_KEY" e "MALGA_CLIENT_ID" pelas credenciais do seu
      ambiente (sandbox ou produção).
   2) Ajuste, se necessário, o caminho do import de '@malga/tokenization'
      conforme sua instalação (por exemplo, "node_modules/@malga/tokenization").
   3) Esse código supõe que você tem um endpoint em seu back-end chamado
      "/api/malga/create-transaction" que recebe JSON com "paymentMethod",
      "amount", "paymentToken" (se cartão), etc., e então faz a chamada
      oficial à API da Malga para criar transações de cartão/pix/boleto.
   4) Os passos e elementos de HTML devem existir no arquivo HTML (por exemplo,
      "toStep2", "backToStep1", etc.). Certifique-se de que esse "main.js"
      esteja sendo importado no HTML via <script type="module" src="/assets/main.js"></script>.
   5) Para simplificar, concentramos a maior parte da lógica aqui em um único
      arquivo. Você pode modularizar conforme preferir.
   ========================================================================= */

import MalgaTokenization from '@malga/tokenization';

/* =========================================================================
   1) Inicialização do Hosted Fields para Cartão
   ========================================================================= */
const malgaTokenization = new MalgaTokenization({
  apiKey: 'MALGA_API_KEY',    // <-- substitua aqui
  clientId: 'MALGA_CLIENT_ID',// <-- substitua aqui
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

/* =========================================================================
   2) Lógica de obtenção do TOTAL do carrinho (convertendo R$ para número)
   ========================================================================= */
function getOrderAmount() {
  const totalEl = document.getElementById('totalValue');
  if (!totalEl) return '0.00';
  let raw = totalEl.textContent
    .replace('R$', '')
    .trim()
    .replace(/\./g, '')
    .replace(',', '.');
  return parseFloat(raw).toFixed(2);
}

/* =========================================================================
   3) Função: envia tokenId do cartão para o back-end e processa o pagamento
   ========================================================================= */
async function processCardPayment(tokenId) {
  try {
    // Exemplo: se tiver select de parcelas (#installments), puxe aqui
    const installments = '1'; 
    const amount = getOrderAmount();

    // Chama o endpoint do back-end. Ele deve falar com a API da Malga.
    const resp = await fetch('/api/malga/create-transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentMethod: 'card',
        paymentToken: tokenId,
        amount,
        installments
        // ...inclua demais dados se quiser (ex: billing info, etc.)
      })
    });
    const result = await resp.json();

    if (result.success) {
      alert('Pagamento aprovado! Transaction ID: ' + result.transactionId);
      // Exemplo: mostrar Step 4 (Confirmação)
      showStep(4);
    } else {
      alert('Falha no pagamento: ' + result.message);
    }
  } catch (err) {
    console.error('Erro ao processar pagamento:', err);
    alert('Erro ao processar pagamento. Tente novamente.');
  }
}

/* =========================================================================
   4) Inicializa o formulário do Cartão (Hosted Fields)
   ========================================================================= */
function initializeCardForm() {
  const form = document.getElementById('checkout-form');
  if (!form) {
    console.error('Formulário #checkout-form não encontrado.');
    return;
  }

  form.addEventListener('submit', async (evt) => {
    evt.preventDefault();
    try {
      // Tokeniza o cartão via Malga
      const { tokenId, error } = await malgaTokenization.tokenize();
      if (error) {
        console.error('Erro na tokenização do cartão:', error.message);
        alert('Falha na tokenização do cartão.');
        return;
      }
      // Se funcionou, chama a função que envia ao back-end
      await processCardPayment(tokenId);
    } catch (err) {
      console.error('Erro inesperado no fluxo de cartão:', err);
      alert('Erro inesperado no fluxo de cartão.');
    }
  });
}

/* =========================================================================
   5) Fluxo Pix: gera QR/código Pix chamando o back-end, que chama a Malga
   ========================================================================= */
function initializePix() {
  const pixContainer = document.getElementById('pix-container');
  if (!pixContainer) return;

  pixContainer.innerHTML = `
    <button id="generatePixBtn">Gerar Código Pix</button>
    <div id="pixCodeDisplay"></div>
  `;
  const btn = document.getElementById('generatePixBtn');
  btn.addEventListener('click', async () => {
    try {
      const amount = getOrderAmount();
      const res = await fetch('/api/malga/create-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: 'pix',
          amount
        })
      });
      const result = await res.json();
      if (result.success) {
        document.getElementById('pixCodeDisplay').innerText =
          'Código Pix: ' + (result.pixCode || '(retornado pelo backend)');
      } else {
        alert('Falha ao gerar Pix: ' + result.message);
      }
    } catch (err) {
      console.error('Erro ao gerar Pix:', err);
      alert('Erro ao gerar Pix. Ver console para detalhes.');
    }
  });
}

/* =========================================================================
   6) Fluxo Boleto: gera link/linha digitável chamando back-end -> Malga
   ========================================================================= */
function initializeBoleto() {
  const boletoContainer = document.getElementById('boleto-container');
  if (!boletoContainer) return;

  boletoContainer.innerHTML = `
    <button id="generateBoletoBtn">Gerar Boleto</button>
    <div id="boletoDisplay"></div>
  `;
  const btn = document.getElementById('generateBoletoBtn');
  btn.addEventListener('click', async () => {
    try {
      const amount = getOrderAmount();
      const res = await fetch('/api/malga/create-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: 'boleto',
          amount
        })
      });
      const result = await res.json();
      if (result.success) {
        document.getElementById('boletoDisplay').innerText =
          'Boleto gerado: ' + (result.boletoUrl || '(retornado pelo backend)');
      } else {
        alert('Falha ao gerar Boleto: ' + result.message);
      }
    } catch (err) {
      console.error('Erro ao gerar Boleto:', err);
      alert('Erro ao gerar Boleto. Ver console para detalhes.');
    }
  });
}

/* =========================================================================
   7) Função que troca o método de pagamento (card/pix/boleto)
   ========================================================================= */
function switchPaymentMethod() {
  const method = document.querySelector('input[name="paymentMethod"]:checked')?.value;

  const cardContainer   = document.getElementById('card-container');
  const pixContainer    = document.getElementById('pix-container');
  const boletoContainer = document.getElementById('boleto-container');

  if (cardContainer)   cardContainer.style.display   = 'none';
  if (pixContainer)    pixContainer.style.display    = 'none';
  if (boletoContainer) boletoContainer.style.display = 'none';

  if (method === 'card') {
    if (cardContainer)   cardContainer.style.display = 'block';
    initializeCardForm();
  } else if (method === 'pix') {
    if (pixContainer)    pixContainer.style.display  = 'block';
    initializePix();
  } else if (method === 'boleto') {
    if (boletoContainer) boletoContainer.style.display = 'block';
    initializeBoleto();
  }
}

/* =========================================================================
   8) Controle de Steps (1,2,3,4)
   ========================================================================= */
function showStep(stepNumber) {
  const stepContents = document.querySelectorAll('.step-content');
  const stepButtons  = document.querySelectorAll('#stepsMenu .step');

  stepContents.forEach(content => {
    content.classList.toggle('active', content.dataset.step === String(stepNumber));
  });

  stepButtons.forEach(button => {
    const btnStep = parseInt(button.dataset.step, 10);
    button.classList.toggle('active', btnStep === stepNumber);
    if (btnStep > stepNumber) {
      button.classList.add('disabled');
    } else {
      button.classList.remove('disabled');
    }
  });
}

/* =========================================================================
   9) Leitura de carrinho (exemplo) e variáveis de checkout
   ========================================================================= */
let cartItems = [];
const cartElement = document.getElementById('shoppingCart');
if (cartElement && cartElement.items && cartElement.items.length > 0) {
  cartItems = cartElement.items;
} else {
  const savedCart = localStorage.getItem('cartItems');
  if (savedCart) {
    cartItems = JSON.parse(savedCart);
  } else {
    // Exemplo dummy
    cartItems = [
      {
        hotelName: 'Hotel Exemplo A',
        adults: 2,
        children: 1,
        basePriceAdult: 100,
        checkIn: '2025-04-16',
        checkOut: '2025-04-18'
      },
      {
        hotelName: 'Hotel Exemplo B',
        adults: 3,
        children: 0,
        basePriceAdult: 150,
        checkIn: '2025-04-10',
        checkOut: '2025-04-12'
      }
    ];
  }
}

// Exemplo de dados do checkout
const checkoutData = {
  extraPassengers: [],
  insuranceSelected: 'none' // "none", "30k", "80k", etc.
};

/* =========================================================================
   10) Atualiza itens na coluna direita (Resumo do carrinho)
   ========================================================================= */
function updateCheckoutCart(items) {
  const container = document.getElementById('cartItemsList');
  if (!container) return;

  let subtotal = 0;
  let html = '';
  items.forEach(item => {
    const price = item.basePriceAdult || 80;
    subtotal += price;
    html += `
      <div class="reserva-item">
        <div class="reserva-left">
          <span class="categoria">${item.type || 'Hospedagem'}</span>
          <span class="nome">${item.hotelName || 'Hotel Desconhecido'} - ${item.roomName || 'Quarto'}</span>
          <div class="reserva-details">
            <p>Check-in: ${item.checkIn || '--/--/----'}</p>
            <p>Check-out: ${item.checkOut || '--/--/----'}</p>
            <p>Quartos: ${item.rooms || 1}</p>
            <p>Adultos: ${item.adults || 1} | Crianças: ${item.children || 0}</p>
          </div>
        </div>
        <div class="reserva-preco">
          R$ ${price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </div>
      </div>
    `;
  });

  // Se adicionou seguro
  if (checkoutData.insuranceCost) {
    subtotal += checkoutData.insuranceCost;
  }

  container.innerHTML = html;
  document.getElementById('subtotalValue').textContent =
    'R$ ' + subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  document.getElementById('discountValue').textContent = '- R$ 0,00';
  document.getElementById('totalValue').textContent =
    'R$ ' + subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

/* =========================================================================
   11) Exemplo de Modal: Nomear passageiros extras
   ========================================================================= */
const passengerModal         = document.getElementById('passengerModal');
const openPassengerModalBtn  = document.getElementById('openPassengerModal');
const closeModalBtn          = document.getElementById('closeModal');
const savePassengersBtn      = document.getElementById('savePassengersBtn');
const modalPassengerContainer= document.getElementById('modalPassengerContainer');
const copyForAllBtn          = document.getElementById('copyForAllBtn');

function createModalPassengerForms(items) {
  modalPassengerContainer.innerHTML = '';
  checkoutData.extraPassengers = [];
  let itemsWithExtras = 0;

  items.forEach((item, itemIndex) => {
    const extraCount = (item.adults || 1) - 1;
    if (extraCount > 0) {
      itemsWithExtras++;
      checkoutData.extraPassengers[itemIndex] = [];
      const itemDiv = document.createElement('div');
      itemDiv.classList.add('passenger-box');
      itemDiv.innerHTML = `<h4>${item.hotelName || 'Item'}</h4>`;

      for (let i = 0; i < extraCount; i++) {
        const fieldsWrapper = document.createElement('div');
        fieldsWrapper.classList.add('fields-grid-2cols-modal');
        fieldsWrapper.innerHTML = `
          <div class="form-field">
            <label>Nome do Passageiro #${i + 1}</label>
            <input type="text"
                   placeholder="Nome completo"
                   data-item-index="${itemIndex}"
                   data-passenger-index="${i}"
                   class="modalExtraNameInput" />
          </div>
          <div class="form-field">
            <label>Data de Nascimento</label>
            <input type="date"
                   data-item-index="${itemIndex}"
                   data-passenger-index="${i}"
                   class="modalExtraBirthdateInput" />
          </div>
        `;
        itemDiv.appendChild(fieldsWrapper);
      }
      modalPassengerContainer.appendChild(itemDiv);
    }
  });
  copyForAllBtn.style.display = (itemsWithExtras > 1) ? 'inline-block' : 'none';
}

if (openPassengerModalBtn) {
  openPassengerModalBtn.addEventListener('click', e => {
    e.preventDefault();
    createModalPassengerForms(cartItems);
    passengerModal.style.display = 'block';
  });
}
if (closeModalBtn) {
  closeModalBtn.addEventListener('click', () => {
    passengerModal.style.display = 'none';
  });
}
if (savePassengersBtn) {
  savePassengersBtn.addEventListener('click', () => {
    passengerModal.style.display = 'none';
    alert('Passageiros extras salvos!');
  });
}

// Botão "Copiar para todos"
if (copyForAllBtn) {
  copyForAllBtn.addEventListener('click', () => {
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
            const nameSelector  = `.modalExtraNameInput[data-item-index="${i}"][data-passenger-index="${passIndex}"]`;
            const birthSelector = `.modalExtraBirthdateInput[data-item-index="${i}"][data-passenger-index="${passIndex}"]`;

            const nameInput  = document.querySelector(nameSelector);
            const birthInput = document.querySelector(birthSelector);

            if (nameInput && birthInput && checkoutData.extraPassengers[i][passIndex]) {
              nameInput.value  = checkoutData.extraPassengers[i][passIndex].name      || '';
              birthInput.value = checkoutData.extraPassengers[i][passIndex].birthdate || '';
            }
          }
        }
      }
    }
    alert('Dados copiados para todos os itens compatíveis!');
  });
}

// "Escuta" de input dentro do modal, para ir salvando no array
if (modalPassengerContainer) {
  modalPassengerContainer.addEventListener('input', e => {
    const target = e.target;
    if (target.classList.contains('modalExtraNameInput') || target.classList.contains('modalExtraBirthdateInput')) {
      const itemIndex = parseInt(target.getAttribute('data-item-index'), 10);
      const passIndex = parseInt(target.getAttribute('data-passenger-index'), 10);
      if (!checkoutData.extraPassengers[itemIndex]) {
        checkoutData.extraPassengers[itemIndex] = [];
      }
      if (!checkoutData.extraPassengers[itemIndex][passIndex]) {
        checkoutData.extraPassengers[itemIndex][passIndex] = {};
      }
      if (target.classList.contains('modalExtraNameInput')) {
        checkoutData.extraPassengers[itemIndex][passIndex].name = target.value;
      } else {
        checkoutData.extraPassengers[itemIndex][passIndex].birthdate = target.value;
      }
    }
  });
}

/* =========================================================================
   12) Botões e lógicas de Steps / Seleção de Plano e etc.
   ========================================================================= */
const toStep2Btn     = document.getElementById('toStep2');
const backToStep1Btn = document.getElementById('backToStep1');
const toStep3Btn     = document.getElementById('toStep3');
const backToStep2Btn = document.getElementById('backToStep2');

// Exemplo simplificado de validação ao ir para Step 2
if (toStep2Btn) {
  toStep2Btn.addEventListener('click', () => {
    // Exemplo: checar se user está logado ou se os campos de cadastro foram preenchidos
    const isLoggedIn = !!localStorage.getItem('agentId');
    if (!isLoggedIn) {
      // Campos básicos
      if (!document.getElementById('firstName').value ||
          !document.getElementById('lastName').value  ||
          !document.getElementById('celular').value   ||
          !document.getElementById('email').value     ||
          !document.getElementById('password').value  ||
          !document.getElementById('confirmPassword').value) {
        alert('Por favor, preencha todos os campos obrigatórios antes de continuar.');
        return;
      }
      // Salvar no objeto
      checkoutData.firstName = document.getElementById('firstName').value;
      checkoutData.lastName  = document.getElementById('lastName').value;
      checkoutData.celular   = document.getElementById('celular').value;
      checkoutData.email     = document.getElementById('email').value;
      checkoutData.password  = document.getElementById('password').value;
      checkoutData.confirmPassword = document.getElementById('confirmPassword').value;
    }

    // Checar campos de documento e endereço
    if (!document.getElementById('cpf').value       ||
        !document.getElementById('rg').value        ||
        !document.getElementById('birthdate').value ||
        !document.getElementById('cep').value       ||
        !document.getElementById('state').value     ||
        !document.getElementById('city').value      ||
        !document.getElementById('address').value   ||
        !document.getElementById('number').value) {
      alert('Por favor, preencha todos os campos obrigatórios antes de continuar.');
      return;
    }

    checkoutData.cpf       = document.getElementById('cpf').value;
    checkoutData.rg        = document.getElementById('rg').value;
    checkoutData.birthdate = document.getElementById('birthdate').value;
    checkoutData.cep       = document.getElementById('cep').value;
    checkoutData.state     = document.getElementById('state').value;
    checkoutData.city      = document.getElementById('city').value;
    checkoutData.address   = document.getElementById('address').value;
    checkoutData.number    = document.getElementById('number').value;

    showStep(2);
  });
}

// Step 3
if (toStep3Btn) {
  toStep3Btn.addEventListener('click', () => {
    // Qual plano de seguro foi escolhido?
    const selectedInsurance = document.querySelector('input[name="insuranceOption"]:checked');
    checkoutData.insuranceSelected = selectedInsurance ? selectedInsurance.value : 'none';

    let insuranceCost = 0;
    if (checkoutData.insuranceSelected === '30k' || checkoutData.insuranceSelected === 'essencial') {
      insuranceCost = 112.81;
    } else if (checkoutData.insuranceSelected === '80k' || checkoutData.insuranceSelected === 'completo') {
      insuranceCost = 212.02;
    }
    checkoutData.insuranceCost = insuranceCost;

    // Atualiza a coluna da direita
    updateCheckoutCart(cartItems);

    // Vai para Step 3 e inicializa a forma de pagamento
    showStep(3);
    switchPaymentMethod();
  });
}

// Voltar do Step 2 para Step 1
if (backToStep1Btn) {
  backToStep1Btn.addEventListener('click', () => {
    showStep(1);
  });
}

// Voltar do Step 3 para Step 2
if (backToStep2Btn) {
  backToStep2Btn.addEventListener('click', () => {
    showStep(2);
  });
}

/* =========================================================================
   13) Máscaras de CPF, RG e busca de CEP
   ========================================================================= */
function buscarCEP(cep) {
  cep = cep.replace(/\D/g, '');
  if (cep.length === 8) {
    fetch(`https://viacep.com.br/ws/${cep}/json/`)
      .then(resp => resp.json())
      .then(data => {
        if (data.erro) {
          alert('CEP não encontrado!');
          return;
        }
        document.getElementById('address').value = data.logradouro || '';
        document.getElementById('city').value    = data.localidade || '';
        document.getElementById('state').value   = data.uf || '';
      })
      .catch(err => {
        console.error('Erro ao buscar CEP:', err);
        alert('Não foi possível consultar o CEP.');
      });
  } else {
    console.log('CEP inválido ou incompleto.');
  }
}
const cepInput = document.getElementById('cep');
if (cepInput) {
  cepInput.addEventListener('blur', function() {
    buscarCEP(this.value);
  });
}

const cpfInput = document.getElementById('cpf');
if (cpfInput) {
  cpfInput.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 3) {
      value = value.replace(/^(\d{3})(\d)/, '$1.$2');
    }
    if (value.length > 6) {
      value = value.replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3');
    }
    if (value.length > 9) {
      value = value.replace(/(\d{3})\.(\d{3})\.(\d{3})(\d{1,2}).*/, '$1.$2.$3-$4');
    }
    e.target.value = value;
  });
}

const rgInput = document.getElementById('rg');
if (rgInput) {
  rgInput.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) {
      value = value.replace(/^(\d{2})(\d)/, '$1.$2');
    }
    if (value.length > 5) {
      value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
    }
    if (value.length > 7) {
      value = value.replace(/(\d{2})\.(\d{3})\.(\d{3})(\d{1}).*/, '$1.$2.$3-$4');
    }
    e.target.value = value;
  });
}

/* =========================================================================
   14) Login / Registro simples (caso não logado)
   ========================================================================= */
const toggleLoginLink         = document.getElementById('toggleLogin');
const registrationFieldsGeneral= document.getElementById('registrationFieldsGeneral');
const loginFields             = document.getElementById('loginFields');
const loginValidateBtn        = document.getElementById('loginValidateBtn');

if (toggleLoginLink) {
  toggleLoginLink.addEventListener('click', e => {
    e.preventDefault();
    if (registrationFieldsGeneral.style.display !== 'none') {
      registrationFieldsGeneral.style.display = 'none';
      loginFields.style.display = 'block';
      toggleLoginLink.textContent = 'Não tenho Login';
    } else {
      registrationFieldsGeneral.style.display = 'block';
      loginFields.style.display = 'none';
      toggleLoginLink.textContent = 'Economize tempo fazendo Login';
    }
  });
}
if (loginValidateBtn) {
  loginValidateBtn.addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // Exemplo: Chamar /api/users/login
    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('agentId', data.user.id);
        alert('Login efetuado com sucesso!');
        toggleLoginLink.style.display = 'none';
        registrationFieldsGeneral.style.display = 'none';
        loginFields.style.display = 'none';
      } else {
        alert('Erro no login: ' + (data.error || 'Dados inválidos.'));
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao realizar o login. Tente novamente.');
    }
  });
}

/* =========================================================================
   15) Disparar inicializações na carga da página
   ========================================================================= */
window.addEventListener('load', () => {
  // Step inicial
  showStep(1);

  // Se user já logado, esconde link login e formulário de registro
  const isLoggedIn = !!localStorage.getItem('agentId');
  if (isLoggedIn) {
    if (toggleLoginLink) toggleLoginLink.style.display = 'none';
    if (registrationFieldsGeneral) registrationFieldsGeneral.style.display = 'none';
    if (loginFields) loginFields.style.display = 'none';
  } else {
    if (toggleLoginLink) toggleLoginLink.style.display = 'block';
    if (registrationFieldsGeneral) registrationFieldsGeneral.style.display = 'block';
  }

  // Renderiza o carrinho
  updateCheckoutCart(cartItems);
});

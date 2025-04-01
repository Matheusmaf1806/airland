/* =========================================================================
   main.js - Exemplo Completo usando import.meta.env e Vite
   =========================================================================
   1) Certifique-se de que no seu vite.config.js exista:
       define: {
         'import.meta.env.VITE_MALGA_API_KEY': JSON.stringify(process.env.MALGA_API_KEY),
         'import.meta.env.VITE_MALGA_CLIENT_ID': JSON.stringify(process.env.MALGA_CLIENT_ID)
       }
   2) Garanta que process.env.MALGA_API_KEY e process.env.MALGA_CLIENT_ID
      existam no momento do build (por ex. definidas no Vercel).
   3) No seu código, use import.meta.env.VITE_MALGA_API_KEY
      sem aspas (como abaixo).
   ========================================================================= */

import * as Malga from '@malga/tokenization';

// Pegamos as chaves injetadas pelo Vite através do define{} no vite.config.js:
const apiKey = import.meta.env.VITE_MALGA_API_KEY;
const clientId = import.meta.env.VITE_MALGA_CLIENT_ID;

console.log('API KEY =>', apiKey);
console.log('CLIENT ID =>', clientId);
console.log('Malga =>', Malga);

// Instancia a tokenização da Malga
const malgaTokenization = new Malga.MalgaTokenization({
  apiKey,
  clientId,
  // Tente contornar postMessage se a Malga suportar:
  options: {
    allowedOrigins: ["https://business.airland.com.br"],
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
   1) Função para obter valor do carrinho (ex: "R$ 1.234,56" -> 1234.56)
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
   2) processCardPayment - envia token do cartão p/ back-end
   ========================================================================= */
async function processCardPayment(tokenId) {
  try {
    const amount = getOrderAmount();
    const installments = '1'; // Ajuste se tiver select de parcelas

    // Chama seu endpoint no back-end, que fala com a Malga
    const resp = await fetch('/api/malga/create-transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentMethod: 'card',
        paymentToken: tokenId,
        amount,
        installments
      })
    });

    const result = await resp.json();
    if (result.success) {
      alert('Pagamento aprovado! Transaction ID: ' + result.transactionId);
      showStep(4); // Step 4 => Confirmação
    } else {
      alert('Falha no pagamento: ' + result.message);
    }
  } catch (err) {
    console.error('Erro ao processar pagamento:', err);
    alert('Erro ao processar pagamento. Tente novamente.');
  }
}

/* =========================================================================
   3) Inicializa Hosted Fields (cartão)
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
      // Dispara a tokenização
      const { tokenId, error } = await malgaTokenization.tokenize();
      if (error) {
        console.error('Erro na tokenização do cartão:', error.message);
        alert('Falha na tokenização do cartão.');
        return;
      }
      await processCardPayment(tokenId);
    } catch (err) {
      console.error('Erro inesperado na tokenização do cartão:', err);
      alert('Erro inesperado na tokenização do cartão.');
    }
  });
}

/* =========================================================================
   4) initializePix: gera QR / código Pix (back-end -> Malga)
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
   5) initializeBoleto: gera link Boleto (back-end -> Malga)
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
   6) switchPaymentMethod: exibe form cartão ou Pix/Boleto
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
    if (cardContainer) cardContainer.style.display = 'block';
    initializeCardForm();
  } else if (method === 'pix') {
    if (pixContainer) pixContainer.style.display = 'block';
    initializePix();
  } else if (method === 'boleto') {
    if (boletoContainer) boletoContainer.style.display = 'block';
    initializeBoleto();
  }
}

/* =========================================================================
   7) showStep: gerencia steps (1..4)
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
   8) Exemplo de carrinho e checkoutData
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

const checkoutData = {
  extraPassengers: [],
  insuranceSelected: 'none'
};

/* =========================================================================
   9) updateCheckoutCart: exibe itens na coluna direita
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
   10) Modal de passageiros extras (nomear)
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
            const nameSel  = `.modalExtraNameInput[data-item-index="${i}"][data-passenger-index="${passIndex}"]`;
            const birthSel = `.modalExtraBirthdateInput[data-item-index="${i}"][data-passenger-index="${passIndex}"]`;
            const nameInput  = document.querySelector(nameSel);
            const birthInput = document.querySelector(birthSel);
            if (nameInput && birthInput && checkoutData.extraPassengers[i][passIndex]) {
              nameInput.value  = checkoutData.extraPassengers[i][passIndex].name || '';
              birthInput.value = checkoutData.extraPassengers[i][passIndex].birthdate || '';
            }
          }
        }
      }
    }
    alert('Dados copiados para todos os itens compatíveis!');
  });
}
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
   11) Steps (botões de "Voltar" / "Próximo")
   ========================================================================= */
const toStep2Btn     = document.getElementById('toStep2');
const backToStep1Btn = document.getElementById('backToStep1');
const toStep3Btn     = document.getElementById('toStep3');
const backToStep2Btn = document.getElementById('backToStep2');

if (toStep2Btn) {
  toStep2Btn.addEventListener('click', () => {
    // Exemplo: validando login ou registro
    const isLoggedIn = !!localStorage.getItem('agentId');
    if (!isLoggedIn) {
      if (!document.getElementById('firstName').value ||
          !document.getElementById('lastName').value  ||
          !document.getElementById('celular').value   ||
          !document.getElementById('email').value     ||
          !document.getElementById('password').value  ||
          !document.getElementById('confirmPassword').value) {
        alert('Preencha os campos obrigatórios antes de continuar.');
        return;
      }
      // salva no checkoutData
      checkoutData.firstName = document.getElementById('firstName').value;
      checkoutData.lastName  = document.getElementById('lastName').value;
      checkoutData.celular   = document.getElementById('celular').value;
      checkoutData.email     = document.getElementById('email').value;
      checkoutData.password  = document.getElementById('password').value;
      checkoutData.confirmPassword = document.getElementById('confirmPassword').value;
    }

    // Campos de documento/endereço
    if (!document.getElementById('cpf').value       ||
        !document.getElementById('rg').value        ||
        !document.getElementById('birthdate').value ||
        !document.getElementById('cep').value       ||
        !document.getElementById('state').value     ||
        !document.getElementById('city').value      ||
        !document.getElementById('address').value   ||
        !document.getElementById('number').value) {
      alert('Preencha todos os campos obrigatórios antes de continuar.');
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
if (backToStep1Btn) {
  backToStep1Btn.addEventListener('click', () => {
    showStep(1);
  });
}
if (toStep3Btn) {
  toStep3Btn.addEventListener('click', () => {
    const selectedInsurance = document.querySelector('input[name="insuranceOption"]:checked');
    checkoutData.insuranceSelected = selectedInsurance ? selectedInsurance.value : 'none';

    let insuranceCost = 0;
    if (checkoutData.insuranceSelected === '30k' || checkoutData.insuranceSelected === 'essencial') {
      insuranceCost = 112.81;
    } else if (checkoutData.insuranceSelected === '80k' || checkoutData.insuranceSelected === 'completo') {
      insuranceCost = 212.02;
    }
    checkoutData.insuranceCost = insuranceCost;

    updateCheckoutCart(cartItems);
    showStep(3);
    switchPaymentMethod();
  });
}
if (backToStep2Btn) {
  backToStep2Btn.addEventListener('click', () => {
    showStep(2);
  });
}

/* =========================================================================
   12) CEP / CPF / RG - máscaras e busca
   ========================================================================= */
function buscarCEP(cep) {
  cep = cep.replace(/\D/g, '');
  if (cep.length === 8) {
    const url = `https://viacep.com.br/ws/${cep}/json/`;
    fetch(url)
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
   13) Login / Registro simples
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
    const email    = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
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
      console.error('Erro ao realizar login:', err);
      alert('Erro ao realizar login. Tente novamente.');
    }
  });
}

/* =========================================================================
   14) Ao carregar a página => Step 1, checa se user está logado, exibe carrinho
   ========================================================================= */
window.addEventListener('load', () => {
  showStep(1);
  const isLoggedIn = !!localStorage.getItem('agentId');
  if (isLoggedIn) {
    if (toggleLoginLink) toggleLoginLink.style.display = 'none';
    if (registrationFieldsGeneral) registrationFieldsGeneral.style.display = 'none';
    if (loginFields) loginFields.style.display = 'none';
  } else {
    if (toggleLoginLink) toggleLoginLink.style.display = 'block';
    if (registrationFieldsGeneral) registrationFieldsGeneral.style.display = 'block';
  }

  updateCheckoutCart(cartItems);
});

/* js/checkout.js */
import { renderPassengerStep } from './steps/passenger-step.js';
import { renderDetailsStep } from './steps/details-step.js';
import { renderPaymentStep } from './steps/payment-step.js';

const stepContainer = document.getElementById('step-container');
let currentStep = 1;

function loadStep(stepNumber) {
  let htmlContent = '';
  switch(stepNumber) {
    case 1:
      htmlContent = renderPassengerStep();
      break;
    case 2:
      htmlContent = renderDetailsStep();
      break;
    case 3:
      htmlContent = renderPaymentStep();
      break;
    default:
      htmlContent = renderPassengerStep();
  }
  stepContainer.innerHTML = htmlContent;
  currentStep = stepNumber;
  attachEventListeners();
  updateStepsMenu();
}

function updateStepsMenu() {
  const stepButtons = document.querySelectorAll('.steps-menu .step');
  stepButtons.forEach(button => {
    const btnStep = parseInt(button.dataset.step);
    button.classList.remove('active', 'disabled');
    if(btnStep === currentStep) {
      button.classList.add('active');
    } else if(btnStep > currentStep) {
      button.classList.add('disabled');
    }
  });
}

function attachEventListeners() {
  if (currentStep === 1) {
    const toStep2Btn = document.getElementById("toStep2");
    if(toStep2Btn) {
      toStep2Btn.addEventListener("click", () => {
        loadStep(2);
      });
    }
  } else if (currentStep === 2) {
    const backToStep1Btn = document.getElementById("backToStep1");
    const toStep3Btn = document.getElementById("toStep3");
    if(backToStep1Btn) {
      backToStep1Btn.addEventListener("click", () => {
        loadStep(1);
      });
    }
    if(toStep3Btn) {
      toStep3Btn.addEventListener("click", () => {
        loadStep(3);
      });
    }
  } else if (currentStep === 3) {
    const backToStep2Btn = document.getElementById("backToStep2");
    const finishBtn = document.getElementById("finishBtn");
    if(backToStep2Btn) {
      backToStep2Btn.addEventListener("click", () => {
        loadStep(2);
      });
    }
    if(finishBtn) {
      finishBtn.addEventListener("click", handlePayment);
    }
  }
}

function handlePayment() {
  const cardNumber = document.getElementById("payment-card-number").value;
  const expiryInput = document.getElementById("payment-expiry").value;
  const expiry = convertExpiry(expiryInput);
  const securityCode = document.getElementById("payment-cvv").value;
  const installmentsCount = parseInt(document.getElementById("installmentsCount").value) || 1;
  const firstName = document.getElementById("firstName").value;
  const lastName = document.getElementById("lastName").value;
  const cardholderName = firstName + " " + lastName;
  const address_line_1 = document.getElementById("address").value + ", " + document.getElementById("number").value;
  const admin_area_2 = document.getElementById("city").value;
  const admin_area_1 = document.getElementById("state").value;
  const postal_code = document.getElementById("cep").value;
  const country_code = "BR";
  const billingAddress = {
    address_line_1,
    admin_area_2,
    admin_area_1,
    postal_code,
    country_code
  };
  const payload = {
    amount: "100.00",
    currency: "USD",
    cardholderName,
    cardNumber,
    expiry,
    securityCode,
    billingAddress,
    installmentsCount
  };

  fetch("/api/pay", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  .then(res => res.json())
  .then(data => {
    if(data.id) {
      alert("Pagamento processado com sucesso! \n" + JSON.stringify(data));
    } else {
      alert("Erro no processamento: " + (data.error || "Resposta inesperada."));
    }
  })
  .catch(err => {
    console.error(err);
    alert("Erro ao processar o pagamento. Tente novamente.");
  });
}

function convertExpiry(expiryStr) {
  const parts = expiryStr.split("/");
  if(parts.length !== 2) return expiryStr;
  const month = parts[0].padStart(2, "0");
  const year = "20" + parts[1];
  return `${year}-${month}`;
}

document.addEventListener("DOMContentLoaded", () => {
  loadStep(1);

  // Integração com o carrinho (exemplo simplificado)
  let items = [];
  const cart = document.getElementById("shoppingCart");
  if (cart && cart.items && cart.items.length > 0) {
    items = cart.items;
  } else {
    const savedCart = localStorage.getItem("cartItems");
    if (savedCart) {
      items = JSON.parse(savedCart);
    }
  }
  updateCheckoutCart(items);
});

function updateCheckoutCart(items) {
  const cartItemsList = document.getElementById("cartItemsList");
  cartItemsList.innerHTML = items.map(item => `
    <div class="reserva-item">
      <img class="reserva-img" src="${item.img}" alt="${item.nome}" />
      <div class="reserva-left">
        <span class="categoria">${item.categoria}</span>
        <span class="nome">${item.nome}</span>
        <span class="subinfo">${item.subinfo}</span>
      </div>
      <span class="reserva-preco">${item.preco}</span>
    </div>
  `).join('');
}

// global-cart.js

// URL base do seu backend
const BASE_URL = "http://localhost:3000";

// Obtenha affiliateId e agentId da sessão (injetados via template no HTML, por exemplo)
// Se não estiverem definidos, você pode definir um valor padrão ou tratar a ausência.
const affiliateId = window.affiliateId || "default_affiliate";
const agentId = window.agentId || "default_agent";

// Array para armazenar os itens adicionados
let cartItems = [];
// Variável para armazenar o shareId retornado pelo servidor
let shareId = null;

/**
 * Adiciona um item ao carrinho.
 * @param {Object} item - Objeto com as informações do item, ex:
 * { name: "WALT DISNEY WORLD - INGRESSO 1 DIA MAGIC KINGDOM [1 dia]",
 *   category: "INGRESSOS",
 *   date: "2025-04-12",
 *   price: 160.00 }
 */
function addItemToCart(item) {
  cartItems.push(item);
  localStorage.setItem("cartItems", JSON.stringify(cartItems));
  renderCartItems();
  updateCartServer(); // Se o carrinho já tiver sido compartilhado, atualiza no servidor
}

/**
 * Renderiza os itens do carrinho na área designada (.cart-body).
 */
function renderCartItems() {
  const cartBody = document.querySelector('.cart-body');
  if (!cartBody) return;
  
  // Limpa o conteúdo atual e adiciona a linha de título
  cartBody.innerHTML = `
    <div class="section-line">
      <span class="section-title">Itens</span>
      <button class="clear-cart-btn" onclick="clearCartServer()">Limpar Carrinho</button>
    </div>
  `;
  
  // Para cada item, cria o HTML correspondente
  cartItems.forEach((item, index) => {
    cartBody.innerHTML += `
      <div class="cart-item" data-index="${index}">
        <button class="trash-btn" onclick="removeItem(${index})">🗑</button>
        <span class="tag-ingresso">${item.category}</span>
        <div class="item-title">${item.name}</div>
        <div class="item-date">
          <svg class="icon" viewBox="0 0 16 16">
            <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h.5A1.5 1.5 0 0 1 15 2.5v11A1.5 1.5 0 0 1 13.5 15h-11A1.5 1.5 0 0 1 1 13.5v-11A1.5 1.5 0 0 1 2.5 1H3V.5a.5.5 0 0 1 .5-.5z"/>
          </svg>
          <span>${item.date}</span>
        </div>
        <div class="item-price">
          ${formatPrice(item.price)}
          <div class="installment-info">até 10x sem juros</div>
          <div class="pix-off">5% OFF no Pix</div>
        </div>
      </div>
    `;
  });
  
  // Atualiza os totais do carrinho
  updateTotals();
}

/**
 * Formata um número para o padrão de preço em Reais.
 * @param {number} value - Valor a formatar.
 * @returns {string} - Valor formatado.
 */
function formatPrice(value) {
  return "R$ " + value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

/**
 * Remove um item do carrinho com base no índice.
 * @param {number} index - Índice do item a remover.
 */
function removeItem(index) {
  cartItems.splice(index, 1);
  localStorage.setItem("cartItems", JSON.stringify(cartItems));
  renderCartItems();
  updateCartServer();
}

/**
 * Calcula e atualiza os totais do carrinho (subtotal, desconto e total).
 */
function updateTotals() {
  let subtotal = 0;
  cartItems.forEach(item => {
    subtotal += item.price; // Cada item deve ter o valor total em "price"
  });
  
  const subtotalEl = document.getElementById("subtotalValue");
  const discountEl = document.getElementById("discountValue");
  const totalEl = document.getElementById("totalValue");
  
  if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
  if (discountEl) discountEl.textContent = "- R$ 0,00"; // Exemplo fixo (sem desconto)
  if (totalEl) totalEl.textContent = formatPrice(subtotal);
}

/**
 * Compartilha o carrinho no servidor, gerando um shareId se necessário.
 */
async function shareCart() {
  if (cartItems.length === 0) {
    alert("Carrinho vazio, não há o que compartilhar!");
    return;
  }
  if (shareId) {
    alert("Carrinho já foi compartilhado. Share ID: " + shareId);
    return;
  }
  
  const payload = {
    affiliateId: affiliateId,
    agentId: agentId,
    items: cartItems
  };
  
  try {
    const response = await fetch(`${BASE_URL}/shareCart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (data.success) {
      shareId = data.shareId;
      localStorage.setItem("shareId", shareId);
      alert("Carrinho compartilhado! Share ID: " + shareId);
    } else {
      alert("Erro ao compartilhar carrinho: " + (data.error || "desconhecido"));
    }
  } catch (error) {
    console.error(error);
    alert("Falha ao compartilhar carrinho!");
  }
}

/**
 * Atualiza os itens do carrinho no servidor (se já tiver sido compartilhado).
 */
async function updateCartServer() {
  if (!shareId) return; // Se o carrinho ainda não foi compartilhado, não atualiza
  const payload = {
    shareId: shareId,
    items: cartItems
  };
  
  try {
    const response = await fetch(`${BASE_URL}/updateCart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!data.success) {
      console.error("Erro ao atualizar carrinho:", data.error);
    }
  } catch (error) {
    console.error(error);
  }
}

/**
 * Limpa o carrinho, removendo os itens localmente e do servidor.
 */
async function clearCartServer() {
  if (!shareId) {
    cartItems = [];
    localStorage.removeItem("cartItems");
    renderCartItems();
    alert("Carrinho limpo localmente!");
    return;
  }
  
  try {
    const response = await fetch(`${BASE_URL}/clearCart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shareId: shareId })
    });
    const data = await response.json();
    if (data.success) {
      alert("Carrinho removido do servidor!");
      cartItems = [];
      localStorage.removeItem("cartItems");
      renderCartItems();
      shareId = null;
      localStorage.removeItem("shareId");
    } else {
      alert("Erro ao limpar carrinho: " + (data.error || "desconhecido"));
    }
  } catch (error) {
    console.error(error);
  }
}

// Ao carregar a página, carrega os itens e o shareId salvos no localStorage e renderiza o carrinho.
document.addEventListener('DOMContentLoaded', () => {
  const storedItems = localStorage.getItem("cartItems");
  if (storedItems) {
    cartItems = JSON.parse(storedItems);
  }
  shareId = localStorage.getItem("shareId");
  renderCartItems();
});

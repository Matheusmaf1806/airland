// global-cart.js

// URL base do seu backend
const BASE_URL = "http://localhost:3000";

// Obtenha affiliateId e agentId da sessão (injetados via template, por exemplo)
const affiliateId = window.affiliateId || "default_affiliate";
const agentId = window.agentId || "default_agent";

// Array para armazenar os itens adicionados
let cartItems = [];
// Variável para armazenar o shareId retornado pelo servidor
let shareId = null;

/**
 * Abre o carrinho adicionando a classe "open" ao container.
 */
function openCart() {
  const cartContainer = document.querySelector('.cart-container');
  if (cartContainer) {
    cartContainer.classList.add('open');
  }
}

/**
 * Fecha o carrinho removendo a classe "open".
 */
function closeCart() {
  const cartContainer = document.querySelector('.cart-container');
  if (cartContainer) {
    cartContainer.classList.remove('open');
  }
}

/**
 * Adiciona um item ao carrinho, atualiza o localStorage, renderiza os itens,
 * atualiza o carrinho no servidor (se necessário) e abre o carrinho.
 * @param {Object} item - Objeto com informações do item (ex: {name, category, date, price})
 */
function addItemToCart(item) {
  cartItems.push(item);
  localStorage.setItem("cartItems", JSON.stringify(cartItems));
  renderCartItems();
  updateCartServer(); // Se já houver shareId, atualiza o carrinho no servidor
  openCart(); // Abre o carrinho no canto direito
}

/**
 * Renderiza os itens do carrinho na área (.cart-body).
 */
function renderCartItems() {
  const cartBody = document.querySelector('.cart-body');
  if (!cartBody) return;
  
  // Limpa o conteúdo e adiciona a linha de título
  cartBody.innerHTML = `
    <div class="section-line">
      <span class="section-title">Itens</span>
      <button class="clear-cart-btn" onclick="clearCartServer()">Limpar Carrinho</button>
    </div>
  `;
  
  // Adiciona cada item do array no HTML
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
  
  // Atualiza os totais
  updateTotals();
}

/**
 * Formata o valor para o padrão de preço brasileiro.
 */
function formatPrice(value) {
  return "R$ " + value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

/**
 * Remove um item do carrinho com base no índice.
 */
function removeItem(index) {
  cartItems.splice(index, 1);
  localStorage.setItem("cartItems", JSON.stringify(cartItems));
  renderCartItems();
  updateCartServer();
}

/**
 * Calcula e atualiza os totais (subtotal, desconto e total) do carrinho.
 */
function updateTotals() {
  let subtotal = 0;
  cartItems.forEach(item => {
    subtotal += item.price; // Considerando que "price" já é o valor total do item
  });
  
  const subtotalEl = document.getElementById("subtotalValue");
  const discountEl = document.getElementById("discountValue");
  const totalEl = document.getElementById("totalValue");
  
  if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
  if (discountEl) discountEl.textContent = "- R$ 0,00"; // Exemplo sem desconto
  if (totalEl) totalEl.textContent = formatPrice(subtotal);
}

/**
 * Compartilha o carrinho no servidor (gera um shareId se necessário).
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
 * Atualiza o carrinho no servidor, se o shareId já estiver definido.
 */
async function updateCartServer() {
  if (!shareId) return;
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
 * Limpa o carrinho tanto localmente quanto no servidor.
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

// Ao carregar a página, recupera itens e shareId do localStorage e renderiza o carrinho.
document.addEventListener('DOMContentLoaded', () => {
  const storedItems = localStorage.getItem("cartItems");
  if (storedItems) {
    cartItems = JSON.parse(storedItems);
  }
  shareId = localStorage.getItem("shareId");
  renderCartItems();
});

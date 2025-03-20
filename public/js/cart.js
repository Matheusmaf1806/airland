// cart.js

// Classe responsável por controlar a visibilidade do carrinho
class CartManager {
  constructor(cartContainerSelector) {
    this.cartContainer = document.querySelector(cartContainerSelector);
    if (!this.cartContainer) {
      console.error("Elemento do carrinho não encontrado!");
    }
  }

  // Esconde o carrinho adicionando a classe 'hidden'
  closeCart() {
    if (this.cartContainer) {
      this.cartContainer.classList.add('hidden');
    }
  }

  // Exibe o carrinho removendo a classe 'hidden'
  openCart() {
    if (this.cartContainer) {
      this.cartContainer.classList.remove('hidden');
    }
  }

  // Alterna a visibilidade do carrinho
  toggleCart() {
    if (this.cartContainer) {
      this.cartContainer.classList.toggle('hidden');
    }
  }
}

// Instancia o CartManager
const cartManager = new CartManager('.cart-container');

// Event listeners para botões (caso existam outros botões de abrir/alternar)
document.querySelector('.close-cart-btn')?.addEventListener('click', () => {
  cartManager.closeCart();
});
document.getElementById('openCartBtn')?.addEventListener('click', () => {
  cartManager.openCart();
});
document.getElementById('toggleCartBtn')?.addEventListener('click', () => {
  cartManager.toggleCart();
});

// Configuração do backend
const BASE_URL = "https://business.airland.com.br";
let shareId = null;
let cartItems = [];

/**
 * Calcula e formata o preço total de um item baseado em adultos e crianças.
 */
function calculateItemPrice(item) {
  const total = (item.adults * item.basePriceAdult) + (item.children * item.basePriceChild);
  return total.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

/**
 * Renderiza os itens do carrinho de forma dinâmica.
 */
function renderCartItems() {
  const cartBody = document.getElementById("cartBody");
  cartBody.innerHTML = ""; // Limpa o container

  if (cartItems.length === 0) {
    cartBody.innerHTML = "<p>Nenhum item no carrinho.</p>";
  } else {
    cartItems.forEach((item, index) => {
      const itemDiv = document.createElement("div");
      itemDiv.className = "cart-item";
      itemDiv.innerHTML = `
        <button class="trash-btn" onclick="removeItem(${index})">🗑</button>
        <span class="tag-ingresso">${item.tag || "INGRESSOS"}</span>
        <div class="item-title">${item.title || "Item do Carrinho"}</div>
        <div class="item-date">
          <svg class="icon" viewBox="0 0 16 16">
            <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h.5A1.5 1.5 0 0 1 15 2.5v11A1.5 1.5 0 0 1 13.5 15h-11A1.5 1.5 0 0 1 1 13.5v-11A1.5 1.5 0 0 1 2.5 1H3V.5a.5.5 0 0 1 .5-.5zM2.5 2a.5.5 0 0 0-.5.5V4h12V2.5a.5.5 0 0 0-.5-.5h-11zM14 5H2v8.5a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5V5z"></path>
          </svg>
          <span>${item.date}</span>
        </div>
        <div class="item-quantities">
          <div class="quantities-left">
            <!-- Crianças -->
            <div class="quant-column">
              <div class="quant-label">
                <svg class="icon" viewBox="0 0 96 96">
                  <circle cx="48" cy="20.5" r="12.5"/>
                </svg>
                <span>Crianças</span>
              </div>
              <div class="plusminus-row">
                <button class="plusminus-btn" onclick="decChildren(${index})">-</button>
                <span id="childCount${index}">${String(item.children).padStart(2, '0')}</span>
                <button class="plusminus-btn" onclick="incChildren(${index})">+</button>
              </div>
            </div>
            <div class="divider"></div>
            <!-- Adultos -->
            <div class="quant-column">
              <div class="quant-label">
                <svg class="icon" viewBox="0 0 575 575">
                  <path d="M290.088,230.112c-15.912,0-30.906..."></path>
                </svg>
                <span>Adultos</span>
              </div>
              <div class="plusminus-row">
                <button class="plusminus-btn" onclick="decAdults(${index})">-</button>
                <span id="adultCount${index}">${String(item.adults).padStart(2, '0')}</span>
                <button class="plusminus-btn" onclick="incAdults(${index})">+</button>
              </div>
            </div>
          </div>
          <div class="item-price" id="priceVal${index}">
            R$ ${calculateItemPrice(item)}
            <div class="installment-info">até 10x sem juros</div>
            <div class="pix-off">5% OFF no Pix</div>
          </div>
        </div>
      `;
      cartBody.appendChild(itemDiv);
    });
  }

  // Atualiza os valores de subtotal e total
  const total = cartItems.reduce((sum, item) =>
    sum + (item.adults * item.basePriceAdult) + (item.children * item.basePriceChild)
  , 0);
  document.getElementById("subtotalValue").textContent = "R$ " + total.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  document.getElementById("totalValue").textContent = "R$ " + total.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  document.getElementById("discountValue").textContent = "- R$ 0,00";
}

// Funções para alterar quantidades dos itens
function incChildren(index) {
  cartItems[index].children++;
  renderCartItems();
  updateCartServer();
}

function decChildren(index) {
  if (cartItems[index].children > 0) {
    cartItems[index].children--;
    renderCartItems();
    updateCartServer();
  }
}

function incAdults(index) {
  cartItems[index].adults++;
  renderCartItems();
  updateCartServer();
}

function decAdults(index) {
  if (cartItems[index].adults > 0) {
    cartItems[index].adults--;
    renderCartItems();
    updateCartServer();
  }
}

function removeItem(index) {
  cartItems.splice(index, 1);
  renderCartItems();
  updateCartServer();
  alert("Item removido");
}

/**
 * Funções para interagir com o backend:
 * - shareCart: Compartilha o carrinho e gera um shareId.
 * - updateCartServer: Atualiza o carrinho no servidor.
 * - loadCartFromServer: Carrega os itens do carrinho do servidor.
 * - clearCartServer: Limpa o carrinho do servidor ou localmente.
 */
async function shareCart() {
  if (cartItems.length === 0) {
    alert("Carrinho vazio, não há o que compartilhar!");
    return;
  }
  if (shareId) {
    alert("Carrinho já possui shareId: " + shareId);
    return;
  }
  const affiliateId = "aff123";
  const agentId = "agt567";
  
  try {
    const resp = await fetch(`${BASE_URL}/shareCart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ affiliateId, agentId, items: cartItems })
    });
    const data = await resp.json();
    if (data.success) {
      shareId = data.shareId;
      localStorage.setItem("shareId", shareId);
      const link = window.location.origin + window.location.pathname + "?shareId=" + shareId;
      alert("Carrinho compartilhado!\n" + link);
    } else {
      alert("Erro ao compartilhar: " + (data.error || "desconhecido"));
    }
  } catch (e) {
    console.error(e);
    alert("Falha ao compartilhar carrinho!");
  }
}

async function updateCartServer() {
  if (!shareId) return;
  try {
    const resp = await fetch(`${BASE_URL}/updateCart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shareId, items: cartItems })
    });
    const data = await resp.json();
    if (!data.success) {
      console.error("Erro updateCart:", data.error);
    }
  } catch (e) {
    console.error(e);
  }
}

async function loadCartFromServer(sId) {
  try {
    const resp = await fetch(`${BASE_URL}/cart/${sId}`);
    const data = await resp.json();
    if (!data.success) {
      console.error("Erro loadCart:", data.error);
      return;
    }
    cartItems = data.items;
    renderCartItems();
  } catch (e) {
    console.error(e);
  }
}

async function clearCartServer() {
  if (!shareId) {
    cartItems = [];
    renderCartItems();
    alert("Carrinho local limpo!");
    return;
  }
  try {
    const resp = await fetch(`${BASE_URL}/clearCart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shareId })
    });
    const data = await resp.json();
    if (data.success) {
      alert("Carrinho removido do servidor!");
      cartItems = [];
      renderCartItems();
      shareId = null;
      localStorage.removeItem("shareId");
    } else {
      alert("Erro ao limpar: " + (data.error || "desconhecido"));
    }
  } catch (e) {
    console.error(e);
  }
}

// Ao carregar a página, verifica se há um shareId e carrega o carrinho
window.addEventListener('load', () => {
  const stored = localStorage.getItem("shareId");
  if (stored) {
    shareId = stored;
    loadCartFromServer(shareId);
  }
  const params = new URLSearchParams(window.location.search);
  const paramS = params.get("shareId");
  if (paramS) {
    shareId = paramS;
    localStorage.setItem("shareId", shareId);
    loadCartFromServer(shareId);
  }
  renderCartItems();
});

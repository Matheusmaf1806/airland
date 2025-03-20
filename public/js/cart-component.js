// public/js/cart-component.js

class ShoppingCart extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Array para armazenar os itens do carrinho
    this.items = [];
    this.shareId = null;
    
    // Dados padrão do item (passados via atributos ou valores default)
    this.item = {
      type: this.getAttribute("type") || "INGRESSOS",
      category: this.getAttribute("category") || "WALT DISNEY WORLD",
      nameDays: this.getAttribute("nameDays") || "INGRESSO 1 DIA MAGIC KINGDOM [1 dia]",
      date: this.getAttribute("date") || "2025-04-12",
      basePriceAdult: parseFloat(this.getAttribute("basePriceAdult")) || 80,
      basePriceChild: parseFloat(this.getAttribute("basePriceChild")) || 60
    };

    // Base URL para as chamadas à API
    this.BASE_URL = "https://business.airland.com.br";

    // Define a estrutura interna do componente via Shadow DOM
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
        }
        .cart-container {
          position: fixed;
          top: 0;
          right: 0;
          width: 380px;
          height: 100vh;
          background: #fff;
          border-left: 1px solid #ddd;
          display: flex;
          flex-direction: column;
          z-index: 1000;
          transform: translateX(100%);
          transition: transform 0.3s ease;
        }
        .cart-container.open {
          transform: translateX(0);
        }
        .cart-header {
          position: relative;
          height: 60px;
          padding: 0 1rem;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .cart-header h2 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
        }
        .close-cart-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #333;
        }
        .cart-body {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          background: #fafafa;
        }
        .cart-item {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 10px;
          margin-bottom: 10px;
        }
        .remove-btn {
          background: none;
          border: none;
          color: #e00;
          cursor: pointer;
          margin-top: 5px;
        }
        .cart-footer {
          border-top: 1px solid #eee;
          padding: 1rem;
          background: #fff;
        }
        .checkout-btn {
          width: 100%;
          background: #35b473;
          border: none;
          color: #fff;
          font-size: 0.9rem;
          border-radius: 6px;
          padding: 0.7rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .checkout-btn:hover {
          background: #2d9e64;
        }
      </style>
      <div class="cart-container">
        <div class="cart-header">
          <h2>Resumo do pedido</h2>
          <button class="close-cart-btn" title="Fechar Carrinho">×</button>
        </div>
        <div class="cart-body" id="cartBody">
          <p>Nenhum item no carrinho.</p>
        </div>
        <div class="cart-footer">
          <p>Subtotal: <span id="subtotalValue">R$ 0,00</span></p>
          <button class="checkout-btn">Ir para o checkout</button>
        </div>
      </div>
    `;

    // Evento para fechar o carrinho
    this.shadowRoot.querySelector('.close-cart-btn')
      .addEventListener('click', () => this.closeCart());
  }

  connectedCallback() {
    this.renderCartItems();
  }

  // Método para abrir o carrinho (exibe o componente)
  openCart() {
    const container = this.shadowRoot.querySelector('.cart-container');
    if (container) {
      container.classList.add('open');
    }
  }

  // Método para fechar o carrinho (oculta o componente)
  closeCart() {
    const container = this.shadowRoot.querySelector('.cart-container');
    if (container) {
      container.classList.remove('open');
    }
  }

  // Método para adicionar um item ao carrinho
  addItem(item) {
    // Adiciona o item recebido ao array
    this.items.push(item);
    this.renderCartItems();
  }

  // Renderiza os itens do carrinho
  renderCartItems() {
    const cartBody = this.shadowRoot.getElementById("cartBody");
    if (!cartBody) return;
    cartBody.innerHTML = "";
    if (this.items.length === 0) {
      cartBody.innerHTML = "<p>Nenhum item no carrinho.</p>";
    } else {
      this.items.forEach((item, index) => {
        const div = document.createElement('div');
        div.classList.add('cart-item');
        div.innerHTML = `
          <p><strong>${item.hotelName}</strong> - ${item.roomName}</p>
          <p>Adultos: ${item.adults}, Crianças: ${item.children}</p>
          <p>Check-in: ${item.checkIn} | Check-out: ${item.checkOut}</p>
          <button class="remove-btn" data-index="${index}">Remover</button>
        `;
        cartBody.appendChild(div);
      });
      // Adiciona os eventos dos botões de remoção
      const removeButtons = this.shadowRoot.querySelectorAll('.remove-btn');
      removeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.target.getAttribute('data-index'));
          this.removeItem(idx);
        });
      });
    }
    this.updateTotals();
  }

  // Remove um item do carrinho pelo índice
  removeItem(index) {
    this.items.splice(index, 1);
    this.renderCartItems();
  }

  // Atualiza o subtotal do carrinho
  updateTotals() {
    let total = 0;
    this.items.forEach(item => {
      // Usa os preços do item se disponíveis; caso contrário, usa os padrões
      const priceAdult = item.basePriceAdult || this.item.basePriceAdult;
      const priceChild = item.basePriceChild || this.item.basePriceChild;
      total += (item.adults * priceAdult) + (item.children * priceChild);
    });
    const subtotalEl = this.shadowRoot.getElementById("subtotalValue");
    if (subtotalEl) {
      subtotalEl.textContent = "R$ " + total.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    }
  }

  // Chama a API para compartilhar o carrinho
  async shareCart() {
    if (this.items.length === 0) {
      alert("Carrinho vazio, não há o que compartilhar!");
      return;
    }
    if (this.shareId) {
      alert("Carrinho já possui shareId: " + this.shareId);
      return;
    }
    const affiliateId = "aff123";
    const agentId = "agt567";
    const itemsToShare = this.items.map(item => ({
      type: item.type || this.item.type,
      category: item.category || this.item.category,
      nameDays: item.nameDays || this.item.nameDays,
      date: item.date || this.item.date,
      adults: item.adults,
      children: item.children
    }));
    try {
      const resp = await fetch(`${this.BASE_URL}/shareCart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ affiliateId, agentId, items: itemsToShare })
      });
      const data = await resp.json();
      if (data.success) {
        this.shareId = data.shareId;
        localStorage.setItem("shareId", this.shareId);
        const link = window.location.origin + window.location.pathname + "?shareId=" + this.shareId;
        alert("Carrinho compartilhado!\n" + link);
      } else {
        alert("Erro ao compartilhar: " + (data.error || "desconhecido"));
      }
    } catch (e) {
      console.error(e);
      alert("Falha ao compartilhar carrinho!");
    }
  }

  // Atualiza o carrinho no servidor, se houver shareId
  async updateCartServer() {
    if (!this.shareId) return;
    const itemsToUpdate = this.items.map(item => ({
      type: item.type || this.item.type,
      category: item.category || this.item.category,
      nameDays: item.nameDays || this.item.nameDays,
      date: item.date || this.item.date,
      adults: item.adults,
      children: item.children
    }));
    try {
      const resp = await fetch(`${this.BASE_URL}/updateCart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareId: this.shareId, items: itemsToUpdate })
      });
      const data = await resp.json();
      if (!data.success) {
        console.error("Erro updateCart:", data.error);
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Carrega os itens do servidor (caso haja shareId salvo)
  async loadCartFromServer(sId) {
    try {
      const resp = await fetch(`${this.BASE_URL}/cart/${sId}`);
      const data = await resp.json();
      if (!data.success) {
        console.error("Erro loadCart:", data.error);
        return;
      }
      if (data.items && data.items.length > 0) {
        this.items = data.items;
      }
      this.renderCartItems();
    } catch (e) {
      console.error(e);
    }
  }

  // Limpa o carrinho no servidor e localmente
  async clearCartServer() {
    if (!this.shareId) {
      this.items = [];
      this.renderCartItems();
      alert("Carrinho local limpo!");
      return;
    }
    try {
      const resp = await fetch(`${this.BASE_URL}/clearCart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareId: this.shareId })
      });
      const data = await resp.json();
      if (data.success) {
        alert("Carrinho removido do servidor!");
        this.items = [];
        this.renderCartItems();
        this.shareId = null;
        localStorage.removeItem("shareId");
      } else {
        alert("Erro ao limpar: " + (data.error || "desconhecido"));
      }
    } catch (e) {
      console.error(e);
    }
  }
}

customElements.define('shopping-cart', ShoppingCart);

class ShoppingCart extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Armazena os itens do carrinho (ex.: ingressos e/ou quartos)
    this.items = [];
    this.shareId = null;
    // Ajuste a BASE_URL conforme seu servidor, se necessário
    this.BASE_URL = "https://business.airland.com.br/api"; 

    // Template do carrinho (HTML/CSS)
    this.shadowRoot.innerHTML = `
      <style>
        /* Importa o Font Awesome para uso no Shadow DOM */
        @import url("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css");

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
        .section-line {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        .section-title {
          font-size: 0.85rem;
          font-weight: 600;
          color: #444;
        }
        .clear-cart-btn {
          background: none;
          border: none;
          color: #666;
          font-size: 0.8rem;
          cursor: pointer;
          transition: color 0.2s;
          margin-left: -5px;
        }
        .clear-cart-btn:hover {
          color: #1a56b0;
        }
        .share-cart-btn {
          background: #007bff;
          color: #fff;
          border: none;
          border-radius: 4px;
          padding: 0.4rem 0.8rem;
          font-size: 0.75rem;
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .share-cart-btn:hover {
          background: #005bb5;
        }
        .share-icon {
          width: 14px;
          height: 14px;
          fill: #fff;
        }
        .cart-item {
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
          position: relative;
          display: flex;
          justify-content: space-between;
        }
        .cart-item:hover {
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        }
        .trash-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          background: none;
          border: none;
          font-size: 1rem;
          color: #999;
          cursor: pointer;
          transition: color 0.2s;
        }
        .trash-btn:hover {
          color: #e00;
        }
        .item-left {
          display: flex;
          flex-direction: column;
          gap: 4px;
          max-width: 65%;
        }
        .tag-ingresso {
          display: inline-block;
          background: #e0e5f6;
          color: #365CF5;
          border: 1px solid #365CF5;
          font-size: 0.65rem;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
          margin-bottom: 0.4rem;
        }
        .item-title {
          font-weight: 600;
          color: #333;
          font-size: 0.9rem;
        }
        .item-date {
          font-size: 0.8rem;
          color: #666;
        }
        .item-right {
          position: absolute;
          right: 0.1rem;
          bottom: 0.1rem;
          font-weight: 600;
          font-size: 0.85rem;
          color: #333;
          text-align: right;
          padding: 10px;
        }
        .item-price {
          font-weight: 600;
          font-size: 0.8rem;
          color: #333;
          text-align: right;
        }
        .installment-info {
          font-size: 0.8rem;
          color: #007bff;
        }
        .pix-off {
          font-size: 0.9rem;
          color: #35b473;
          margin-top: 2px;
        }
        .cart-footer {
          border-top: 1px solid #eee;
          padding: 1rem;
          background: #fff;
        }
        .coupon-section {
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px dashed #ccc;
          border-radius: 6px;
          padding: 8px;
          margin-bottom: 1rem;
          background: #fcfcfc;
        }
        .coupon-icon {
          width: 30px;
          height: 30px;
          fill: #666;
          flex-shrink: 0;
        }
        .coupon-input-box {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .coupon-input-box label {
          font-size: 0.8rem;
          font-weight: 500;
          color: #555;
        }
        .coupon-input-box input {
          height: 32px;
          border: 1px solid #ccc;
          border-radius: 4px;
          padding: 0 8px;
          font-size: 0.85rem;
          color: #333;
        }
        .price-line {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          margin-bottom: 0.2rem;
        }
        .price-line .green {
          color: #2a942f;
          font-weight: 600;
        }
        .total-line {
          display: flex;
          justify-content: space-between;
          font-weight: 600;
          margin: 0.5rem 0 1rem;
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
        <div class="cart-body">
          <div class="section-line">
            <span class="section-title">Itens | 
              <button class="clear-cart-btn" title="Limpar Carrinho">Limpar Carrinho</button>
            </span>
            <button class="share-cart-btn" title="Compartilhar Carrinho">
              <i class="fas fa-share-alt"></i> Compartilhar
            </button>
          </div>
          <div id="cartItemsList"></div>
        </div>
        <div class="cart-footer">
          <div class="price-line">
            <span>Subtotal</span>
            <span class="green" id="subtotalValue">R$ 0,00</span>
          </div>
          <div class="price-line">
            <span>Desconto</span>
            <span class="green" id="discountValue">- R$ 0,00</span>
          </div>
          <div class="total-line">
            <span>Total do pedido</span>
            <span id="totalValue">R$ 0,00</span>
          </div>
          <button class="checkout-btn">Ir para o checkout</button>
        </div>
      </div>
    `;
  }
  
  connectedCallback() {
    // Carrega itens salvos do localStorage, se houver
    const savedItems = localStorage.getItem("cartItems");
    if (savedItems) {
      this.items = JSON.parse(savedItems);
      this.renderCartItems();
    }
    
    // Trata o shareId (se houver) para carregar o carrinho do servidor
    const stored = localStorage.getItem("shareId");
    if (stored) {
      this.shareId = stored;
      this.loadCartFromServer(this.shareId);
    }
    const params = new URLSearchParams(window.location.search);
    const paramS = params.get("shareId");
    if (paramS) {
      this.shareId = paramS;
      localStorage.setItem("shareId", this.shareId);
      this.loadCartFromServer(this.shareId);
    }
  
    this.renderCartItems();
  
    // Eventos do componente
    this.shadowRoot.querySelector('.close-cart-btn')
      .addEventListener('click', () => this.closeCart());
    this.shadowRoot.querySelector('.share-cart-btn')
      .addEventListener('click', () => this.shareCart());
    this.shadowRoot.querySelector('.clear-cart-btn')
      .addEventListener('click', () => this.clearCartServer());
  
    // Evento para ir para o checkout
    const checkoutBtn = this.shadowRoot.querySelector('.checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        window.location.href = "checkout.html";
      });
    }
  }
  
  openCart() {
    const container = this.shadowRoot.querySelector('.cart-container');
    if (container) container.classList.add('open');
  }
  
  closeCart() {
    const container = this.shadowRoot.querySelector('.cart-container');
    if (container) container.classList.remove('open');
  }
  
  addItem(item) {
    this.items.push(item);
    // Salva os itens no localStorage
    localStorage.setItem("cartItems", JSON.stringify(this.items));
    this.renderCartItems();
  }
  
  renderCartItems() {
    const container = this.shadowRoot.querySelector('#cartItemsList');
    if (!container) return;
    container.innerHTML = '';
  
    if (this.items.length === 0) {
      container.innerHTML = '<p>Nenhum item no carrinho.</p>';
    } else {
      this.items.forEach((itm, idx) => {
        const type = itm.type ? itm.type.toUpperCase() : "HOSPEDAGEM";
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('cart-item');
  
        // Botão para remover o item
        const trashBtn = document.createElement('button');
        trashBtn.classList.add('trash-btn');
        trashBtn.setAttribute('data-index', idx);
        trashBtn.setAttribute('title', 'Remover Item');
        trashBtn.innerHTML = `<i class="fas fa-trash-alt"></i>`;
  
        // Contêiner esquerdo e direito
        const leftDiv = document.createElement('div');
        leftDiv.classList.add('item-left');
        const rightDiv = document.createElement('div');
        rightDiv.classList.add('item-right');
  
        if (type === "INGRESSOS") {
          // Exibe os campos específicos para INGRESSOS:
          leftDiv.innerHTML = `
            <span class="tag-ingresso">INGRESSOS</span>
            <div class="item-title">${itm.productName || "Ingresso Desconhecido"}</div>
            <div class="item-date">Data: ${this.formatDate(itm.date)}</div>
            <div class="item-date">Adultos: ${itm.adults} | Crianças: ${itm.children}</div>
          `;
          rightDiv.innerHTML = `
            <div class="item-price">R$ ${Number(itm.price).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
            <div class="installment-info">até 10x sem juros</div>
            <div class="pix-off">5% OFF no Pix</div>
          `;
        } else {
          // Para outros tipos (ex.: HOSPEDAGEM), mantém a exibição antiga:
          const formattedCheckIn = this.formatDate(itm.checkIn);
          const formattedCheckOut = this.formatDate(itm.checkOut);
          const categoryLabel = itm.type || "Hospedagem";
          leftDiv.innerHTML = `
            <span class="tag-ingresso">${categoryLabel}</span>
            <div class="item-title">${itm.hotelName || "Hotel Desconhecido"} - ${itm.roomName || "Quarto Desconhecido"}</div>
            <div class="item-date">Check-in: ${formattedCheckIn} | Check-out: ${formattedCheckOut}</div>
            <div class="item-date">Quartos: ${itm.rooms || 1}</div>
            <div class="item-date">Adultos: ${itm.adults} | Crianças: ${itm.children}</div>
          `;
          rightDiv.innerHTML = `
            <div class="item-price">R$ ${Number(itm.basePriceAdult).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <div class="installment-info">até 10x sem juros</div>
            <div class="pix-off">5% OFF no Pix</div>
          `;
        }
  
        itemDiv.appendChild(trashBtn);
        itemDiv.appendChild(leftDiv);
        itemDiv.appendChild(rightDiv);
        container.appendChild(itemDiv);
      });
  
      // Configura os eventos para os botões de remoção
      const removeBtns = this.shadowRoot.querySelectorAll('.trash-btn');
      removeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.currentTarget.getAttribute('data-index'));
          this.removeItem(idx);
        });
      });
    }
    this.updateTotals();
  }
  
  removeItem(index) {
    this.items.splice(index, 1);
    localStorage.setItem("cartItems", JSON.stringify(this.items));
    this.renderCartItems();
  }
  
  updateTotals() {
    let total = 0;
    this.items.forEach(itm => {
      const type = itm.type ? itm.type.toUpperCase() : "HOSPEDAGEM";
      if (type === "INGRESSOS") {
        total += itm.price || 0;
      } else {
        const basePrice = itm.basePriceAdult || 80;
        total += basePrice;
      }
    });
    const subtotalEl = this.shadowRoot.querySelector('#subtotalValue');
    const totalEl = this.shadowRoot.querySelector('#totalValue');
    if (subtotalEl) {
      subtotalEl.textContent = "R$ " + total.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    }
    if (totalEl) {
      totalEl.textContent = "R$ " + total.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    }
  }
  
  formatDate(dateStr) {
    if (!dateStr) return "--/--/----";
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  
  clearCart() {
    this.items = [];
    localStorage.removeItem("cartItems");
    this.renderCartItems();
  }
  
  async shareCart() {
    if (this.items.length === 0) {
      alert("Carrinho vazio, não há o que compartilhar!");
      return;
    }
  
    const storedAgentId = localStorage.getItem("agentId");
    if (!storedAgentId) {
      alert("Você precisa estar logado para compartilhar o carrinho.");
      return;
    }
  
    if (this.shareId) {
      const link = window.location.origin + window.location.pathname + "?shareId=" + this.shareId;
      try {
        await navigator.clipboard.writeText(link);
        alert("Link do carrinho copiado para a área de transferência!\n" + link);
      } catch (error) {
        alert("Falha ao copiar o link: " + error);
      }
      return;
    }
  
    const affiliateId = "aff123";
    const requestBody = {
      affiliateId,
      agentId: storedAgentId,
      items: this.items
    };
  
    try {
      const resp = await fetch(`${this.BASE_URL}/shareCart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });
      const data = await resp.json();
      if (data.success) {
        this.shareId = data.shareId;
        localStorage.setItem("shareId", this.shareId);
        const link = window.location.origin + window.location.pathname + "?shareId=" + this.shareId;
        try {
          await navigator.clipboard.writeText(link);
          alert("Carrinho compartilhado e link copiado para a área de transferência!\n" + link);
        } catch (err) {
          alert("Carrinho compartilhado, mas não foi possível copiar o link automaticamente.\n" + link);
        }
      } else {
        alert("Erro ao compartilhar: " + (data.error || "desconhecido"));
      }
    } catch (e) {
      console.error(e);
      alert("Falha ao compartilhar carrinho!");
    }
  }
  
  async updateCartServer() {
    if (!this.shareId) return;
    try {
      const resp = await fetch(`${this.BASE_URL}/updateCart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareId: this.shareId, items: this.items })
      });
      const data = await resp.json();
      if (!data.success) {
        console.error("Erro updateCart:", data.error);
      }
    } catch (e) {
      console.error(e);
    }
  }
  
  async loadCartFromServer(sId) {
    try {
      const resp = await fetch(`${this.BASE_URL}/cart/${sId}`);
      const data = await resp.json();
      if (!data.success) {
        console.error("Erro loadCart:", data.error);
        return;
      }
      if (Array.isArray(data.items)) {
        this.items = data.items;
      }
      this.renderCartItems();
    } catch (e) {
      console.error(e);
    }
  }
  
  async clearCartServer() {
    if (!this.shareId) {
      this.items = [];
      localStorage.removeItem("cartItems");
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
        localStorage.removeItem("cartItems");
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

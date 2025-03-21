class ShoppingCart extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Armazena vários itens (ex.: vários quartos)
    this.items = [];
    this.shareId = null;
    // Ajuste a BASE_URL conforme seu servidor, se necessário
    this.BASE_URL = "http://localhost:3000"; 

    // Template do carrinho (HTML/CSS)
    this.shadowRoot.innerHTML = `
      <style>
        /* Importa o Font Awesome para uso dentro do Shadow DOM */
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
          margin-right: 115px;
        }
        .item-title {
          font-weight: 600;
          color: #333;
          font-size: 0.9rem;
          margin-right: -120px;
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
          font-size: 0.75rem;
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
              Compartilhar Carrinho
              <svg class="share-icon" version="1.0" xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 1274.000000 1280.000000" preserveAspectRatio="xMidYMid meet">
                <g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
                   fill="#ffffff" stroke="none">
                  <path d="M5946 12377 c-178 -232 -815 -1061 -1415 -1842 l-1091 -1420 1098 -5
                  c1090 -5 1097 -5 1095 -25 -2 -11 -7 -49 -13 -85 -7 -44 -10 -815 -8 -2420 4
                  -2571 -1 -2369 58 -2510 167 -396 645 -556 1027 -345 43 24 100 70 155 125 72
                  72 94 103 132 181 83 171 77 -49 73 2624 -2 1309 -7 2397 -12 2417 l-7 38
                  1032 2 1032 3 -599 780 c-330 429 -967 1258 -1416 1842 l-816 1063 -325 -423z"/>
                  <path d="M0 3730 l0 -3730 6370 0 6370 0 0 3730 0 3730 -2055 0 -2055 0 0
                  -660 0 -660 1265 0 1265 0 0 -2410 0 -2410 -4790 0 -4790 0 0 2410 0 2410
                  1365 0 1365 0 -2 658 -3 657 -2152 3 -2153 2 0 -3730z"/>
                </g>
              </svg>
            </button>
          </div>
          <div id="cartItemsList"></div>
        </div>
        <div class="cart-footer">
          <div class="coupon-section">
            <svg class="coupon-icon" height="30" width="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.5 17h9c.277 0 .5.223.5.5s-.223.5-.5.5h-9c-.277 0-.5-.223-.5-.5s.223-.5.5-.5zm4.5 2
              c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 1c.558 0 1 .442 1 1s-.442 1-1
              1-1-.442-1-1 .442-1 1-1zm0-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0
              1c.558 0 1 .442 1 1s-.442 1-1 1-1-.442-1-1 .442-1 1-1zM25 3c-1.1 0-2 .9-2
              2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 1c.558 0 1 .442 1 1s-.442 1-1
              1-1-.442-1-1 .442-1 1-1zM.446 15.67c-.587.58-.583 1.542 0
              2.124l11.76 11.76c.58.582 1.542.587 2.123
              0L28.855 14.85c.247-.25.532-.48.768-.856.235-.376.376-.87.376-1.544V1.5c0-.823-.678-1.5-1.5-1.5h-11c-1.158
              0-1.824.624-2.35 1.145zm.703.712L15.85 1.856c.533-.526.808-.856 1.65-.856H28.5c.285
              0 .5.214.5.5v10.952c0 .547-.093.805-.224
              1.013-.13.21-.344.394-.63.684l-14.53 14.7c-.197.2-.5.2-.703-.002l-11.76-11.76c-.203-.203-.205-.508-.004-.706z"/>
            </svg>
            <div class="coupon-input-box">
              <label for="couponInput">Cupom de Desconto</label>
              <input type="text" id="couponInput" placeholder="Ex: DESCONTO10">
            </div>
          </div>
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

    this.shadowRoot.querySelector('.close-cart-btn')
      .addEventListener('click', () => this.closeCart());
    this.shadowRoot.querySelector('.share-cart-btn')
      .addEventListener('click', () => this.shareCart());
    this.shadowRoot.querySelector('.clear-cart-btn')
      .addEventListener('click', () => this.clearCartServer());
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
        let itemTotal;
        if (type === "HOSPEDAGEM") {
          itemTotal = itm.basePriceAdult || 80;
        } else {
          const baseAdult = itm.basePriceAdult || 80;
          const baseChild = itm.basePriceChild || 60;
          itemTotal = (itm.adults * baseAdult) + (itm.children * baseChild);
        }

        const formattedCheckIn = this.formatDate(itm.checkIn);
        const formattedCheckOut = this.formatDate(itm.checkOut);
        const categoryLabel = itm.type || "Hospedagem";

        const itemDiv = document.createElement('div');
        itemDiv.classList.add('cart-item');

        itemDiv.innerHTML = `
          <button class="trash-btn" data-index="${idx}" title="Remover Item">
            <i class="fas fa-trash-alt"></i>
          </button>
          <div class="item-left">
            <span class="tag-ingresso">${categoryLabel}</span>
            <div class="item-title">
              ${itm.hotelName || "Hotel Desconhecido"} - ${itm.roomName || "Quarto Desconhecido"}
            </div>
            <div class="item-date">
              Check-in: ${formattedCheckIn} | Check-out: ${formattedCheckOut}
            </div>
            <div class="item-date">
              Quartos: ${itm.rooms || 1}
            </div>
            <div class="item-date">
              Adultos: ${itm.adults} | Crianças: ${itm.children}
            </div>
          </div>
          <div class="item-right">
            <div class="item-price">
              R$ ${itemTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div class="installment-info">até 10x sem juros</div>
            <div class="pix-off">5% OFF no Pix</div>
          </div>
        `;

        container.appendChild(itemDiv);
      });

      const removeBtns = this.shadowRoot.querySelectorAll('.trash-btn');
      removeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.target.closest('button').getAttribute('data-index'));
          this.removeItem(idx);
        });
      });
    }
    this.updateTotals();
  }

  removeItem(index) {
    this.items.splice(index, 1);
    this.renderCartItems();
  }

  updateTotals() {
    let total = 0;
    this.items.forEach(itm => {
      const type = itm.type ? itm.type.toUpperCase() : "HOSPEDAGEM";
      if (type === "HOSPEDAGEM") {
        total += itm.basePriceAdult || 80;
      } else {
        const baseA = itm.basePriceAdult || 80;
        const baseC = itm.basePriceChild || 60;
        total += (itm.adults * baseA) + (itm.children * baseC);
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

  /**
   * shareCart()
   * Cria um shareId no servidor (se não existir) e copia o link.
   */
  async shareCart() {
    if (this.items.length === 0) {
      alert("Carrinho vazio, não há o que compartilhar!");
      return;
    }

    // Se já existe um shareId, só copiamos o link existente
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
    const agentId = "agt567";

    try {
      const resp = await fetch(`${this.BASE_URL}/shareCart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ affiliateId, agentId, items: this.items })
      });
      const data = await resp.json();
      if (data.success) {
        this.shareId = data.shareId;
        localStorage.setItem("shareId", this.shareId);
        const link = window.location.origin + window.location.pathname + "?shareId=" + this.shareId;

        // Tenta copiar o link
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

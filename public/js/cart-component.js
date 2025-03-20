// public/js/cart-component.js

class ShoppingCart extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Armazena vários itens (ex.: vários quartos)
    this.items = [];
    this.shareId = null;
    this.BASE_URL = "https://business.airland.com.br"; // Ajuste se necessário

    // Template do carrinho (HTML/CSS)
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

        /* ======== Cart Item ======== */
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

        /* ======== Left / Right Sections ======== */
        .item-left {
          display: flex;
          flex-direction: column;
          gap: 4px;
          max-width: 65%;
        }

        /* ======== Tag (Hospedagem, Ingressos, etc.) ======== */
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
          right: 0.1rem;
          bottom: 0.1rem;
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

        /* ======== Footer (Subtotal, etc.) ======== */
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
          width: 100%;
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
              <svg class="share-icon" viewBox="0 0 1274 1280" preserveAspectRatio="xMidYMid meet">
                <g transform="translate(0,1280) scale(0.1,-0.1)" fill="#ffffff" stroke="none">
                  <path d="M5946 12377 c-178 -232 -815 -1061 -1415 -1842 l-1091 -1420 1098 -5 ..."/>
                  <path d="M0 3730 l0 -3730 6370 0 6370 0 0 3730 0 3730 -2055 0 -2055 0 ..."/>
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
    // Se houver shareId salvo, carrega do servidor
    const stored = localStorage.getItem("shareId");
    if (stored) {
      this.shareId = stored;
      this.loadCartFromServer(this.shareId);
    }
    // Se houver shareId na URL
    const params = new URLSearchParams(window.location.search);
    const paramS = params.get("shareId");
    if (paramS) {
      this.shareId = paramS;
      localStorage.setItem("shareId", this.shareId);
      this.loadCartFromServer(this.shareId);
    }
    // Renderiza os itens locais
    this.renderCartItems();

    // Botões do header
    this.shadowRoot.querySelector('.close-cart-btn')
      .addEventListener('click', () => this.closeCart());
    this.shadowRoot.querySelector('.share-cart-btn')
      .addEventListener('click', () => this.shareCart());
    this.shadowRoot.querySelector('.clear-cart-btn')
      .addEventListener('click', () => this.clearCartServer());
  }

  // Abre o carrinho (mostra)
  openCart() {
    const container = this.shadowRoot.querySelector('.cart-container');
    if (container) container.classList.add('open');
  }

  // Fecha o carrinho (oculta)
  closeCart() {
    const container = this.shadowRoot.querySelector('.cart-container');
    if (container) container.classList.remove('open');
  }

  /**
   * addItem(item)
   * Adiciona um novo quarto/item ao array e re-renderiza
   */
  addItem(item) {
    this.items.push(item);
    this.renderCartItems();
    // Se quiser sincronizar no servidor automaticamente:
    // this.updateCartServer();
  }

  /**
   * renderCartItems()
   * Renderiza todos os itens do carrinho
   */
  renderCartItems() {
    const container = this.shadowRoot.querySelector('#cartItemsList');
    if (!container) return;
    container.innerHTML = '';

    if (this.items.length === 0) {
      container.innerHTML = '<p>Nenhum item no carrinho.</p>';
    } else {
      this.items.forEach((itm, idx) => {
        // Calcula valor total do item
        const baseAdult = itm.basePriceAdult || 80;
        const baseChild = itm.basePriceChild || 60;
        const itemTotal = (itm.adults * baseAdult) + (itm.children * baseChild);

        // Exibe "Hospedagem" (ou outro type) sem parênteses
        const categoryLabel = itm.type || "Hospedagem"; 

        // Monta o layout do item
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('cart-item');

        // Conteúdo do card
        itemDiv.innerHTML = `
          <!-- Botão Lixeira -->
          <button class="trash-btn" data-index="${idx}" title="Remover Item">
            <i class="fas fa-trash"></i>
          </button>

          <!-- Lado esquerdo (infos) -->
          <div class="item-left">
            <span class="tag-ingresso">${categoryLabel}</span>
            <div class="item-title">
              ${itm.hotelName || "Hotel Desconhecido"} - ${itm.roomName || "Quarto Desconhecido"}
            </div>
            <div class="item-date">
              Check-in: ${itm.checkIn || "--/--/----"} | 
              Check-out: ${itm.checkOut || "--/--/----"}
            </div>
            <div style="margin-top: 0.4rem;">
              Adultos: ${itm.adults} | Crianças: ${itm.children}
            </div>
          </div>

          <!-- Lado direito (preço e parcelas) -->
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

      // Eventos para remover
      const removeBtns = this.shadowRoot.querySelectorAll('.trash-btn');
      removeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.target.closest('button').getAttribute('data-index'));
          this.removeItem(idx);
        });
      });
    }

    // Atualiza o subtotal e total geral
    this.updateTotals();
  }

  /**
   * removeItem(index)
   * Remove um item e re-renderiza
   */
  removeItem(index) {
    this.items.splice(index, 1);
    this.renderCartItems();
    // Se quiser sincronizar:
    // this.updateCartServer();
  }

  /**
   * updateTotals()
   * Calcula o total e exibe
   */
  updateTotals() {
    let total = 0;
    this.items.forEach(itm => {
      const baseA = itm.basePriceAdult || 80;
      const baseC = itm.basePriceChild || 60;
      total += (itm.adults * baseA) + (itm.children * baseC);
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

  /**
   * shareCart()
   * Cria shareId no servidor e salva local
   */
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
        alert("Carrinho compartilhado!\n" + link);
      } else {
        alert("Erro ao compartilhar: " + (data.error || "desconhecido"));
      }
    } catch (e) {
      console.error(e);
      alert("Falha ao compartilhar carrinho!");
    }
  }

  /**
   * updateCartServer()
   * Atualiza os itens do carrinho no servidor, se houver shareId
   */
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

  /**
   * loadCartFromServer(sId)
   * Carrega itens do servidor e exibe
   */
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

  /**
   * clearCartServer()
   * Limpa o carrinho do servidor e localmente
   */
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
        alert("Erro ao limpar: " + (data.error||"desconhecido"));
      }
    } catch (e) {
      console.error(e);
    }
  }
}

customElements.define('shopping-cart', ShoppingCart);

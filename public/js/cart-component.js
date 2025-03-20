// js/cart-component.js

class ShoppingCart extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Inicializa os dados do item com valores dinâmicos a partir de atributos ou com defaults
    this.item = {
      type: this.getAttribute("type") || "INGRESSOS",
      category: this.getAttribute("category") || "WALT DISNEY WORLD",
      nameDays: this.getAttribute("nameDays") || "INGRESSO 1 DIA MAGIC KINGDOM [1 dia]",
      date: this.getAttribute("date") || "2025-04-12",
      children: 0,
      adults: 1,
      basePriceAdult: parseFloat(this.getAttribute("basePriceAdult")) || 80,
      basePriceChild: parseFloat(this.getAttribute("basePriceChild")) || 60
    };

    this.shareId = null;
    this.BASE_URL = "https://business.airland.com.br";

    this.shadowRoot.innerHTML = `
      <style>
        /* RESET e estilos do carrinho */
        * { box-sizing: border-box; }
        :host { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; }
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
        }
        .cart-header {
          position: relative;
          height: 60px;
          padding: 0 1rem;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
        }
        .cart-header h2 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
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
        .close-cart-btn {
          position: absolute;
          right: 15px;
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
        .cart-item {
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
          position: relative;
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
        .trash-btn:hover { color: #e00; }
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
          margin: 0.2rem 0;
          color: #333;
          font-size: 0.9rem;
        }
        .icon { width: 16px; height: 16px; fill: #666; vertical-align: middle; }
        .item-date {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          color: #666;
          margin: 0.4rem 0;
        }
        .item-quantities {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 0.4rem;
          position: relative;
        }
        .quantities-left { display: flex; gap: 20px; }
        .quant-column { display: flex; flex-direction: column; align-items: center; }
        .quant-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #666;
          display: flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 4px;
          text-transform: capitalize;
        }
        .plusminus-row {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .plusminus-btn {
          width: 24px;
          height: 24px;
          border: 1px solid #ccc;
          border-radius: 4px;
          background: #fff;
          cursor: pointer;
          font-size: 0.8rem;
          transition: background 0.2s;
        }
        .plusminus-btn:hover { background: #f2f2f2; }
        .divider { border-left: 1px solid #ccc; height: 40px; margin-top: 8px; }
        .item-price {
          position: absolute;
          right: 0.1rem;
          bottom: 0.1rem;
          font-weight: 600;
          font-size: 0.85rem;
          color: #333;
          text-align: right;
        }
        .installment-info { font-size: 0.7rem; color: #007bff; margin-top: 2px; }
        .pix-off { font-size: 0.7rem; color: #35b473; margin-top: 2px; }
        .cart-footer {
          position: relative;
          flex-shrink: 0;
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
        .coupon-icon { width: 30px; height: 30px; fill: #666; flex-shrink: 0; }
        .coupon-input-box {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .coupon-input-box label { font-size: 0.8rem; font-weight: 500; color: #555; }
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
        .price-line .green { color: #2a942f; font-weight: 600; }
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
        .checkout-btn:hover { background: #2d9e64; }
      </style>

      <div class="cart-container">
        <!-- HEADER: Título + Botão de fechar + Compartilhar -->
        <div class="cart-header">
          <button class="close-cart-btn" title="Fechar Carrinho">×</button>
          <h2>Resumo do pedido</h2>
        </div>
        <!-- ÁREA ROLÁVEL DOS ITENS -->
        <div class="cart-body">
          <div class="section-line">
            <span class="section-title">
              Itens | 
              <button class="clear-cart-btn" title="Limpar Carrinho">Limpar Carrinho</button>
            </span>
            <button class="share-cart-btn" title="Compartilhar Carrinho">
              Compartilhar Carrinho
              <svg class="share-icon" viewBox="0 0 1274 1280" preserveAspectRatio="xMidYMid meet">
                <g transform="translate(0,1280) scale(0.1,-0.1)" fill="#ffffff" stroke="none">
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
          <!-- CARD DO ITEM (exemplo) -->
          <div class="cart-item">
            <button class="trash-btn" title="Remover Item">🗑</button>
            <span class="tag-ingresso">(<span id="itemType">${this.item.type}</span>)</span>
            <div class="item-title">(<span id="itemCategory">${this.item.category}</span> - <span id="itemNameDays">${this.item.nameDays}</span>)</div>
            <div class="item-date">
              <svg class="icon" viewBox="0 0 16 16">
                <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 
                1 0V1h.5A1.5 1.5 0 0 1 15 
                2.5v11A1.5 1.5 0 0 1 13.5 
                15h-11A1.5 1.5 0 0 1 1 
                13.5v-11A1.5 1.5 0 0 1 
                2.5 1H3V.5a.5.5 0 0 
                1 .5-.5zM2.5 2a.5.5 
                0 0 0-.5.5V4h12V2.5a.5.5 
                0 0 0-.5-.5h-11zM14 5H2v8.5a.5.5 
                0 0 0 .5.5h11a.5.5 0 0 
                0 .5-.5V5z"/>
              </svg>
              <span id="dateVal">(${this.item.date})</span>
            </div>
            <div class="item-quantities">
              <div class="quantities-left">
                <div class="quant-column">
                  <div class="quant-label">
                    <svg class="icon" viewBox="0 0 96 96">
                      <circle cx="48" cy="20.5" r="12.5"/>
                      <path d="M57 62.5C57 62.6 57 62.7 57 62.8C53.5 63.1 50.9 66 51 69.5C51 70.5 51.3 71.5 51.8 72.3C50.7 72.7 49.3 72.9 47.8 72.9C46.2 72.9 44.9 72.7 43.9 72.3C45.4 70.1 45.4 67.1 43.8 64.8C42.6 63.2 40.9 62.2 39 62L39 60L57 60L57 62.5ZM76.2 44.2L59 35.2C58.6 35.1 58.2 35 57.8 35L39 35C38.5 35 38.1 35.1 37.6 35.2L19.6 45.2C17.5 46 16.5 48.3 17.2 50.3C17.8 52 19.4 53 21 53C21.5 53 21.9 52.9 22.4 52.8L35 46.2C35 46.2 35 62.7 35 63C34.8 63.1 26.8 68.7 26.8 68.7C25.1 69.9 24.6 72.3 25.7 74.1L32.7 85.1C33.9 87 36.4 87.5 38.2 86.3C40 85.1 40.6 82.6 39.4 80.8L36 75.3L38.2 75.3C38.9 75.3 39.6 75.2 40.3 75C42.1 76.2 44.5 76.9 47.7 76.9C50.7 76.9 53.1 76.2 55 75.2C55.8 75.6 56.8 75.7 57.8 75.7L59.6 75.6L56 80.6C54.7 82.4 55.1 84.9 56.9 86.2C58.7 87.5 61.2 87.1 62.5 85.3L70.5 74.3C70.6 74.2 70.7 74.1 70.7 73.9C71.8 72 71.1 69.5 69.2 68.4L61 63.8C61 63.4 61 45.8 61 45.8L73.8 51.9C74.2 52 74.6 52.1 75 52.1C76.7 52.1 78.3 51 78.8 49.3C79.5 47.1 78.3 44.9 76.2 44.2Z"/>
                    </svg>
                    <span>Crianças</span>
                  </div>
                  <div class="plusminus-row">
                    <button class="plusminus-btn dec-children" title="Diminuir Crianças">-</button>
                    <span id="childCount">(quantidade)</span>
                    <button class="plusminus-btn inc-children" title="Aumentar Crianças">+</button>
                  </div>
                </div>
                <div class="divider"></div>
                <div class="quant-column">
                  <div class="quant-label">
                    <svg class="icon" viewBox="0 0 575.28 575.28">
                      <path d="M290.088,230.112c-15.912,0-30.906-2.958-44.982-8.874c-14.076-5.916-26.316-14.076-36.72-24.48
                      c-10.404-10.404-18.564-22.644-24.48-36.72c-5.916-14.076-8.874-29.07-8.874-44.982s2.958-30.804,8.874-44.676
                      c5.916-13.872,14.076-26.01,24.48-36.414S231.03,15.3,245.106,9.18C259.182,3.06,274.176,0,290.088,0s30.804,3.06,44.676,9.18
                      s26.01,14.382,36.414,24.786s18.666,22.542,24.786,36.414s9.18,28.764,9.18,44.676s-3.06,30.906-9.18,44.982
                      s-14.382,26.316-24.786,36.72s-22.542,18.564-36.414,24.48S306,230.112,290.088,230.112z M383.112,253.98
                      c21.216,0,39.678,4.182,55.386,12.546c15.708,8.364,28.56,19.278,38.556,32.742s17.442,28.864,22.338,46.206
                      c4.896,17.34,7.345,34.983,7.345,52.938v167.076c0,6.528-3.265,9.792-9.791,9.792h-60.59c-6.525,0-9.792-3.264-9.792-9.792
                      V419.832c0-2.854-1.122-5.916-3.363-9.18c-2.244-3.264-5.814-4.896-10.71-4.896s-8.469,1.635-10.71,4.896
                      c-2.244,3.264-3.366,6.324-3.366,9.18v145.656c0,2.856-1.021,5.202-3.063,7.038s-4.485,2.754-7.344,2.754H185.436
                      c-6.528,0-9.792-3.264-9.792-9.792V419.832c0-2.854-0.918-5.916-2.754-9.18s-5.61-4.896-11.322-4.896s-9.486,1.635-11.322,4.896
                      c-1.836,3.264-2.754,6.324-2.754,9.18v145.656c0,2.856-1.02,5.202-3.06,7.038c-2.04,1.836-4.488,2.754-7.344,2.754h-58.14
                      c-6.936,0-10.404-3.264-10.404-9.792V398.412c0-17.952,2.448-35.598,7.344-52.938c4.896-17.343,12.444-32.742,22.644-46.206
                      s23.052-24.378,38.556-32.742s34.068-12.546,55.692-12.546h97.308H383.112L383.112,253.98z"/>
                    </svg>
                    <span>Adultos</span>
                  </div>
                  <div class="plusminus-row">
                    <button class="plusminus-btn dec-adults" title="Diminuir Adultos">-</button>
                    <span id="adultCount">(quantidade)</span>
                    <button class="plusminus-btn inc-adults" title="Aumentar Adultos">+</button>
                  </div>
                </div>
              </div>
              <div class="item-price" id="priceVal">
                (valor do item)
                <div class="installment-info">até 10x sem juros</div>
                <div class="pix-off">5% OFF no Pix</div>
              </div>
            </div>
          </div>
        </div>
        <!-- RODAPÉ FIXO AO FINAL DO CARRINHO -->
        <div class="cart-footer">
          <div class="coupon-section">
            <svg class="coupon-icon" height="30" width="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.5 17h9c.277 0 .5.223.5.5s-.223.5-.5.5h-9c-.277 0-.5-.223-.5-.5s.223-.5.5-.5zm4.5 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 1c.558 0 1 .442 1 1s-.442 1-1 1-1-.442-1-1 .442-1 1-1zm0-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 1c.558 0 1 .442 1 1s-.442 1-1 1-1-.442-1-1 .442-1 1-1zM25 3c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 1c.558 0 1 .442 1 1s-.442 1-1 1-1-.442-1-1 .442-1 1-1zM.446 15.67c-.587.58-.583 1.542 0 2.124l11.76 11.76c.58.582 1.542.587 2.123 0L28.855 14.85c.247-.25.532-.48.768-.856.235-.376.376-.87.376-1.544V1.5c0-.823-.678-1.5-1.5-1.5h-11c-1.158 0-1.824.624-2.35 1.145zm.703.712L15.85 1.856c.533-.526.808-.856 1.65-.856H28.5c.285 0 .5.214.5.5v10.952c0 .547-.093.805-.224 1.013-.13.21-.344.394-.63.684l-14.53 14.7c-.197.2-.5.2-.703-.002l-11.76-11.76c-.203-.203-.205-.508-.004-.706z"/>
            </svg>
            <div class="coupon-input-box">
              <label for="couponInput">Cupom de Desconto</label>
              <input type="text" id="couponInput" placeholder="Ex: DESCONTO10">
            </div>
          </div>
          <div class="price-line">
            <span>Subtotal</span>
            <span id="subtotalValue">(soma do pedido)</span>
          </div>
          <div class="price-line">
            <span>Desconto</span>
            <span class="green" id="discountValue">(valor do desconto)</span>
          </div>
          <div class="total-line">
            <span>Total do pedido</span>
            <span id="totalValue">(valor total do pedido)</span>
          </div>
          <button class="checkout-btn">Ir para o checkout</button>
        </div>
      </div>
    `;
  }

  connectedCallback() {
    // Inicializações ao inserir o componente no DOM
    this.initCart();

    // Event listeners para botões
    this.shadowRoot.querySelector('.close-cart-btn').addEventListener('click', () => this.closeCart());
    this.shadowRoot.querySelector('.share-cart-btn').addEventListener('click', () => this.shareCart());
    this.shadowRoot.querySelector('.clear-cart-btn').addEventListener('click', () => this.clearCartServer());
    this.shadowRoot.querySelector('.trash-btn').addEventListener('click', () => this.removeItem());

    // Eventos para incremento/decremento de crianças e adultos
    this.shadowRoot.querySelector('.inc-children').addEventListener('click', () => this.incChildren());
    this.shadowRoot.querySelector('.dec-children').addEventListener('click', () => this.decChildren());
    this.shadowRoot.querySelector('.inc-adults').addEventListener('click', () => this.incAdults());
    this.shadowRoot.querySelector('.dec-adults').addEventListener('click', () => this.decAdults());

    // Verifica shareId no localStorage ou na URL
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
    this.renderItem();
  }

  initCart() {
    // Outras inicializações, se necessário
  }

  renderItem() {
    // Atualiza os elementos com os dados do item
    const childCountElem = this.shadowRoot.getElementById("childCount");
    if (childCountElem) {
      childCountElem.textContent = this.item.children.toString().padStart(2, '0');
    }
    const adultCountElem = this.shadowRoot.getElementById("adultCount");
    if (adultCountElem) {
      adultCountElem.textContent = this.item.adults.toString().padStart(2, '0');
    }
    const totalItem = (this.item.adults * this.item.basePriceAdult) + (this.item.children * this.item.basePriceChild);
    const priceValElem = this.shadowRoot.getElementById("priceVal");
    if (priceValElem) {
      priceValElem.innerHTML = `
        R$ ${totalItem.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        <div class="installment-info">até 10x sem juros</div>
        <div class="pix-off">5% OFF no Pix</div>
      `;
    }
    const subtotalValueElem = this.shadowRoot.getElementById("subtotalValue");
    if (subtotalValueElem) {
      subtotalValueElem.textContent = "R$ " + totalItem.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    }
    const discountValueElem = this.shadowRoot.getElementById("discountValue");
    if (discountValueElem) {
      discountValueElem.textContent = "- R$ 0,00";
    }
    const totalValueElem = this.shadowRoot.getElementById("totalValue");
    if (totalValueElem) {
      totalValueElem.textContent = "R$ " + totalItem.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    }
  }

  incChildren() {
    this.item.children++;
    this.renderItem();
    this.updateCartServer();
  }
  decChildren() {
    if (this.item.children > 0) this.item.children--;
    this.renderItem();
    this.updateCartServer();
  }
  incAdults() {
    this.item.adults++;
    this.renderItem();
    this.updateCartServer();
  }
  decAdults() {
    if (this.item.adults > 0) this.item.adults--;
    this.renderItem();
    this.updateCartServer();
  }

  removeItem() {
    this.item.children = 0;
    this.item.adults = 0;
    this.renderItem();
    this.updateCartServer();
    alert("Item removido");
  }

  async shareCart() {
    if (this.item.adults === 0 && this.item.children === 0) {
      alert("Carrinho vazio, não há o que compartilhar!");
      return;
    }
    if (this.shareId) {
      alert("Carrinho já possui shareId: " + this.shareId);
      return;
    }
    const affiliateId = "aff123";
    const agentId = "agt567";
    const items = [{
      type: this.item.type,
      category: this.item.category,
      nameDays: this.item.nameDays,
      date: this.item.date,
      adults: this.item.adults,
      children: this.item.children
    }];
    try {
      const resp = await fetch(`${this.BASE_URL}/shareCart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ affiliateId, agentId, items })
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

  async updateCartServer() {
    if (!this.shareId) return;
    const items = [{
      type: this.item.type,
      category: this.item.category,
      nameDays: this.item.nameDays,
      date: this.item.date,
      adults: this.item.adults,
      children: this.item.children
    }];
    try {
      const resp = await fetch(`${this.BASE_URL}/updateCart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareId: this.shareId, items })
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
      if (data.items.length > 0) {
        const i = data.items[0];
        this.item.adults = i.adults;
        this.item.children = i.children;
        this.item.date = i.date;
      }
      this.renderItem();
    } catch (e) {
      console.error(e);
    }
  }

  async clearCartServer() {
    if (!this.shareId) {
      // Limpa localmente
      this.item.adults = 0;
      this.item.children = 0;
      this.renderItem();
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
        this.item.adults = 0;
        this.item.children = 0;
        this.renderItem();
        this.shareId = null;
        localStorage.removeItem("shareId");
      } else {
        alert("Erro ao limpar: " + (data.error || "desconhecido"));
      }
    } catch (e) {
      console.error(e);
    }
  }

  closeCart() {
    // Exemplo: oculta o carrinho definindo display none
    const container = this.shadowRoot.querySelector('.cart-container');
    if (container) {
      container.style.display = 'none';
    }
  }
}

customElements.define('shopping-cart', ShoppingCart);

class HeaderComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        /* Reset e configurações iniciais */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Montserrat', sans-serif;
          background-color: #f7f7f7;
        }

        /* ====== Barra Superior (Ofertas, Avisos) ====== */
        .top-offer-bar {
          width: 100%;
          background-color: #005CFF;
          color: #fff;
          padding: 20px 15px;
          text-align: center;
          font-size: 0.95rem;
          font-weight: 500;
        }

        /* ====== Header Principal ====== */
        .header-container {
          width: 100%;
          background-color: #fff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 15px 20px;
          border-bottom: 1px solid rgba(0,0,0,0.1);
        }

        /* Logo */
        .logo {
          text-decoration: none; 
          display: flex;
          align-items: center;
        }
        .logo img {
          width: 80px; 
          height: auto;
        }

        /* Navegação Principal */
        .nav-menu {
          display: flex;
          gap: 30px;
          align-items: center;
          margin-left: 40px;
          flex: 1;
        }
        .nav-item {
          text-decoration: none;
          color: #333;
          font-size: 0.9rem;
          font-weight: 500;
          transition: color 0.3s;
        }
        .nav-item:hover {
          color: #005CFF;
        }

        /* Área de Ações à Direita */
        .right-actions {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        /* Estilo "bolha" para todos os botões (Dúvidas, Dólar, Perfil, etc.) */
        .bubble-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background-color: #f1f1f1;
          border-radius: 16px;
          padding: 6px 12px;
          font-size: 0.85rem;
          color: #333;
          border: 1px solid #ddd;
          text-decoration: none;
          position: relative;
        }
        .bubble-btn:hover {
          background-color: #e9e9e9;
        }

        /* Bandeira */
        .flag-icon {
          width: 20px;
          height: 20px;
          object-fit: cover;
          border-radius: 50%;
        }

        /* Botão do carrinho em estilo bolha */
        .cart-btn {
          cursor: pointer;
        }
        /* Badge de contagem de itens no carrinho */
        .cart-count {
          position: absolute;
          top: -6px;
          right: -6px;
          background: #e00;
          color: #fff;
          border-radius: 50%;
          font-size: 0.7rem;
          padding: 2px 6px;
        }
      </style>

      <div class="top-offer-bar">
        <strong>SUPER DESCONTO NO PIX:</strong> 5% de desconto para qualquer pedido.
      </div>

      <header class="header-container">
        <!-- Logo -->
        <a href="/" class="logo">
          <img src="https://raw.githubusercontent.com/Matheusmaf1806/airland/refs/heads/main/image/Escrita%20Azul.png" alt="Logo Airland" />
        </a>

        <!-- Navegação Principal -->
        <nav class="nav-menu">
          <a href="#" class="nav-item">Hotel</a>
          <a href="#" class="nav-item">Ingressos</a>
          <a href="#" class="nav-item">Transfer</a>
          <a href="#" class="nav-item">Guiamento Remoto</a>
          <a href="#" class="nav-item">Seguro Viagem</a>
        </nav>

        <!-- Ações à Direita -->
        <div class="right-actions">
          <a href="#" class="bubble-btn">Dúvidas</a>

          <div class="bubble-btn" id="dollar-btn">
            <img src="https://upload.wikimedia.org/wikipedia/en/a/a4/Flag_of_the_United_States.svg" alt="Bandeira EUA" class="flag-icon" />
            <span class="dollar-value">R$ 0.00</span>
          </div>

          <div class="bubble-btn cart-btn" id="cart-btn">
            <i class="fas fa-shopping-cart"></i>
            <span class="cart-count">0</span>
          </div>

          <a href="#" class="bubble-btn profile-btn">Perfil</a>
        </div>
      </header>
    `;

    // Atualizar o valor do dólar
    this.updateDollar();

    // Evento para abrir o login ao clicar no botão de perfil
    this.shadowRoot.querySelector(".profile-btn").addEventListener("click", (e) => {
      e.preventDefault();
      if (typeof openLogin === "function") openLogin();
    });

    // Evento para alternar o carrinho de compras
    this.shadowRoot.querySelector("#cart-btn").addEventListener("click", () => {
      const cart = document.querySelector(".cart-container");
      if (cart) cart.classList.toggle("open");
    });
  }

  async updateDollar() {
    try {
      const response = await fetch("/api/getLatestDollar");
      const data = await response.json();
      this.shadowRoot.querySelector(".dollar-value").innerText = `R$ ${data.valor}`;
    } catch (error) {
      console.error("Erro ao buscar o valor do dólar:", error);
    }
  }
}

// Define o Web Component como <app-header>
customElements.define("app-header", HeaderComponent);

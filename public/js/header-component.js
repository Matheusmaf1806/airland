class HeaderComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500&display=swap" rel="stylesheet" />
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        :host {
          font-family: 'Montserrat', sans-serif;
          display: block;
        }
        .top-offer-bar {
          width: 100%;
          background-color: #005CFF;
          color: #fff;
          padding: 20px 15px;
          text-align: center;
          font-size: 0.95rem;
          font-weight: 500;
        }
        .header-container {
          width: 100%;
          background-color: #fff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 15px 20px;
          border-bottom: 1px solid rgba(0,0,0,0.1);
        }
        .logo {
          text-decoration: none;
          display: flex;
          align-items: center;
        }
        .logo img {
          width: 80px;
          height: auto;
        }
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
        .right-actions {
          display: flex;
          align-items: center;
          gap: 20px;
        }
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
        .flag-icon {
          width: 20px;
          height: 20px;
          object-fit: cover;
          border-radius: 50%;
        }
        .cart-btn {
          cursor: pointer;
          padding: 10px 20px;
          border-radius: 100px;
        }
        .cart-icon {
          width: 16px;
          height: 16px;
          fill: currentColor;
        }
        .cart-count {
          position: absolute;
          top: -6px;
          right: -6px;
          background: #e00;
          color: #fff;
          border-radius: 50%;
          font-size: 0.7rem;
          padding: 2px 6px;
          display: none;
        }
        .profile-wrapper {
          position: relative;
        }
        .profile-menu {
          position: absolute;
          top: 120%;
          right: 0;
          background: #fff;
          border: 1px solid #ccc;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          display: none;
          min-width: 100px;
          z-index: 10;
        }
        .profile-menu button {
          width: 100%;
          background: none;
          border: none;
          padding: 10px;
          text-align: left;
          font-size: 0.85rem;
          cursor: pointer;
        }
        .profile-menu button:hover {
          background-color: #f1f1f1;
        }
        @media (max-width: 1024px) {
          .header-container {
            flex-direction: column;
            padding: 15px 20px;
          }
          .nav-menu {
            flex-wrap: wrap;
            gap: 20px;
            margin: 10px 0;
            justify-content: center;
          }
          .right-actions {
            margin-top: 10px;
            justify-content: center;
          }
        }
        @media (max-width: 768px) {
          .header-container {
            padding: 10px 15px;
          }
          .logo img {
            width: 70px;
          }
          .nav-menu {
            gap: 15px;
            margin-left: 0;
          }
          .bubble-btn {
            padding: 5px 10px;
            font-size: 0.8rem;
          }
        }
        @media (max-width: 480px) {
          .header-container {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            padding: 8px 10px;
          }
          .logo img {
            width: 60px;
          }
          .nav-menu {
            display: none;
          }
          .right-actions {
            flex-direction: row;
            gap: 10px;
          }
          .right-actions > .bubble-btn:first-child {
            display: none;
          }
        }
      </style>

      <div class="top-offer-bar">
        <strong>SUPER DESCONTO NO PIX:</strong> 5% de desconto para qualquer pedido.
      </div>

      <header class="header-container">
        <a href="/" class="logo">
          <img src="https://raw.githubusercontent.com/Matheusmaf1806/airland/refs/heads/main/image/Escrita%20Azul.png" alt="Logo Airland" />
        </a>

        <nav class="nav-menu">
          <a href="#" class="nav-item">Hotel</a>
          <a href="#" class="nav-item">Ingressos</a>
          <a href="#" class="nav-item">Transfer</a>
          <a href="#" class="nav-item">Guiamento Remoto</a>
          <a href="#" class="nav-item">Seguro Viagem</a>
        </nav>

        <div class="right-actions">
          <a href="#" class="bubble-btn">Dúvidas</a>
          <div class="bubble-btn" id="dollar-btn">
            <img src="https://upload.wikimedia.org/wikipedia/en/a/a4/Flag_of_the_United_States.svg" alt="Bandeira EUA" class="flag-icon" />
            <span class="dollar-value">R$ 0.00</span>
          </div>
          <div class="bubble-btn cart-btn" id="cart-btn">
            <svg class="cart-icon" viewBox="0 0 24 24">
              <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 
                       0c-1.1 0-1.99.9-1.99 2S15.9 22 17 
                       22s2-.9 2-2-.9-2-2-2zM7.16 
                       14l.84-2h8.99c.75 0 1.41-.41 1.75-1.03l3.24-5.88a.996.996 
                       0 10-1.74-.96L17.21 10H8.53l-1.1-2H20V6H7l-1.1-2H1v2h3.6l3.6 
                       7.59-1.35 2.44C6.16 16.37 7.27 18 8.7 18H19v-2H8.7l-.54-1z"/>
            </svg>
            <span class="cart-count" id="cart-count">0</span>
          </div>
          <div class="bubble-btn profile-wrapper">
            <span class="profile-name">Login</span>
            <div class="profile-menu" id="profileMenu">
              <button id="logoutBtn">Sair</button>
            </div>
          </div>
        </div>
      </header>
    `;

    this.updateDollar();
    this.updateUserProfile();

    // Ao clicar no botão do carrinho, procura (ou cria) o componente <shopping-cart>
    this.shadowRoot.querySelector("#cart-btn").addEventListener("click", () => {
      let cart = document.querySelector("shopping-cart");
      if (!cart) {
        cart = document.createElement("shopping-cart");
        document.body.appendChild(cart);
      }
      // Aguarda que o componente esteja definido e seu Shadow DOM seja acessível
      customElements.whenDefined("shopping-cart").then(() => {
        if (cart.shadowRoot) {
          const cartContainer = cart.shadowRoot.querySelector(".cart-container");
          if (cartContainer) {
            if (cartContainer.classList.contains("open")) {
              cart.closeCart();
            } else {
              cart.openCart();
            }
          } else {
            console.warn("Elemento '.cart-container' não encontrado no shopping-cart.");
          }
        } else {
          console.warn("ShadowRoot do shopping-cart não está disponível.");
        }
      });
    });

    // Perfil: toggle do menu ou abrir login
    const profileWrapper = this.shadowRoot.querySelector(".profile-wrapper");
    const profileMenu = this.shadowRoot.querySelector("#profileMenu");
    const profileName = this.shadowRoot.querySelector(".profile-name");

    profileWrapper.addEventListener("click", async (e) => {
      e.preventDefault();
      const isLoggedIn = !!localStorage.getItem("agentId");
      if (isLoggedIn) {
        profileMenu.style.display = profileMenu.style.display === "block" ? "none" : "block";
        return;
      }
      if (!customElements.get("login-component")) {
        await import("/js/login-component.js").catch(err =>
          console.error("Erro ao importar login-component.js", err)
        );
      }
      if (!document.querySelector("login-component")) {
        const login = document.createElement("login-component");
        document.body.appendChild(login);
      }
    });

    // Logout
    this.shadowRoot.querySelector("#logoutBtn").addEventListener("click", () => {
      localStorage.removeItem("agentId");
      location.reload();
    });

    // Atualiza o contador do carrinho
    window.updateCartCount = (count) => {
      const badge = this.shadowRoot.querySelector("#cart-count");
      if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? "inline-block" : "none";
      }
    };
  }

  async updateDollar() {
    try {
      const response = await fetch("/api/getLatestDollar");
      const data = await response.json();
      if (data?.valor) {
        this.shadowRoot.querySelector(".dollar-value").innerText = `R$ ${data.valor}`;
      }
    } catch (error) {
      console.error("Erro ao buscar o valor do dólar:", error);
    }
  }

  async updateUserProfile() {
    const userId = localStorage.getItem("agentId");
    if (!userId) return;
    try {
      const res = await fetch(`/api/users/profile?id=${userId}`);
      const data = await res.json();
      if (data?.primeiro_nome) {
        const profileName = this.shadowRoot.querySelector(".profile-name");
        if (profileName) profileName.textContent = data.primeiro_nome;
      }
    } catch (err) {
      console.error("Erro ao buscar perfil do usuário:", err);
    }
  }
}

customElements.define("app-header", HeaderComponent);

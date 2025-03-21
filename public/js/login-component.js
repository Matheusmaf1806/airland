class LoginComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    // Modo inicial: 'register' para cadastro (exibe todos os campos)
    // Alternativamente, 'login' para usuário já cadastrado (exibe apenas Nome, Telefone e Email)
    this.mode = 'register';
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        /* From Uiverse.io by R1SH4BH81 */
        .form {
          display: flex;
          flex-direction: column;
          gap: 10px;
          background-color: #ffffff;
          padding: 30px;
          width: 450px;
          border-radius: 20px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
            Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
        }
        
        ::placeholder {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
            Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
        }
        
        .form button {
          align-self: flex-end;
        }
        
        .flex-column > label {
          color: #151717;
          font-weight: 600;
        }
        
        .inputForm {
          border: 1.5px solid #ecedec;
          border-radius: 10px;
          height: 50px;
          display: flex;
          align-items: center;
          padding-left: 10px;
          transition: 0.2s ease-in-out;
        }
        
        .input {
          margin-left: 10px;
          border-radius: 10px;
          border: none;
          width: 85%;
          height: 100%;
        }
        
        .input:focus {
          outline: none;
        }
        
        .inputForm:focus-within {
          border: 1.5px solid #2d79f3;
        }
        
        .flex-row {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 10px;
          justify-content: space-between;
        }
        
        .flex-row > div > label {
          font-size: 14px;
          color: black;
          font-weight: 400;
        }
        
        .span {
          font-size: 14px;
          margin-left: 5px;
          color: #2d79f3;
          font-weight: 500;
          cursor: pointer;
        }
        
        .button-submit {
          margin: 20px 0 10px 0;
          background-color: #151717;
          border: none;
          color: white;
          font-size: 15px;
          font-weight: 500;
          border-radius: 10px;
          height: 50px;
          width: 100%;
          cursor: pointer;
        }
        
        .button-submit:hover {
          background-color: #252727;
        }
        
        .p {
          text-align: center;
          color: black;
          font-size: 14px;
          margin: 5px 0;
        }
        
        .btn {
          margin-top: 10px;
          width: 100%;
          height: 50px;
          border-radius: 10px;
          display: flex;
          justify-content: center;
          align-items: center;
          font-weight: 500;
          gap: 10px;
          border: 1px solid #ededef;
          background-color: white;
          cursor: pointer;
          transition: 0.2s ease-in-out;
        }
        
        .btn:hover {
          border: 1px solid #2d79f3;
        }
      </style>
      <form class="form">
        <!-- Campo Nome -->
        <div class="flex-column">
          <label>Nome</label>
        </div>
        <div class="inputForm">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="7" r="4"></circle>
            <path d="M20 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M4 21v-2a4 4 0 0 1 3-3.87"></path>
          </svg>
          <input type="text" class="input" placeholder="Insira seu Nome" id="name" />
        </div>
        
        <!-- Campo Telefone -->
        <div class="flex-column">
          <label>Telefone</label>
        </div>
        <div class="inputForm">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.11-.27 11.72 11.72 0 003.68.59 1 1 0 011 1v3.59a1 1 0 01-1 1A16 16 0 014 4a1 1 0 011-1h3.59a1 1 0 011 1 11.72 11.72 0 00.59 3.68 1 1 0 01-.27 1.11l-2.2 2.2z"/>
          </svg>
          <input type="text" class="input" placeholder="Digite seu telefone" id="telefone" />
        </div>  
        
        <!-- Campo Email (sempre exibido em ambos os modos) -->
        <div class="flex-column">
          <label>Email </label>
        </div>
        <div class="inputForm">
          <svg height="20" viewBox="0 0 32 32" width="20" xmlns="http://www.w3.org/2000/svg">
            <g id="Layer_3" data-name="Layer 3">
              <path d="m30.853 13.87a15 15 0 0 0 -29.729 4.082 15.1 15.1 0 0 0 12.876 12.918 15.6 15.6 0 0 0 2.016.13 14.85 14.85 0 0 0 7.715-2.145 1 1 0 1 0 -1.031-1.711 13.007 13.007 0 1 1 5.458-6.529 2.149 2.149 0 0 1 -4.158-.759v-10.856a1 1 0 0 0 -2 0v1.726a8 8 0 1 0 .2 10.325 4.135 4.135 0 0 0 7.83.274 15.2 15.2 0 0 0 .823-7.455zm-14.853 8.13a6 6 0 1 1 6-6 6.006 6.006 0 0 1 -6 6z"></path>
            </g>
          </svg>
          <input type="text" class="input" placeholder="Insira seu melhor Email" id="email" />
        </div>
        
        ${
          // Em modo de cadastro, exibe o campo Senha; no modo login, não exibe.
          this.mode === 'register'
            ? `
        <div class="flex-column">
          <label>Senha </label>
        </div>
        <div class="inputForm">
          <svg height="20" viewBox="-64 0 512 512" width="20" xmlns="http://www.w3.org/2000/svg">
            <path d="m336 512h-288c-26.453125 0-48-21.523438-48-48v-224c0-26.476562 21.546875-48 48-48h288c26.453125 0 48 21.523438 48 48v224c0 26.476562-21.546875 48-48 48zm-288-288c-8.8125 0-16 7.167969-16 16v224c0 8.832031 7.1875 16 16 16h288c8.8125 0 16-7.167969 16-16v-224c0-8.832031-7.1875-16-16-16zm0 0"></path>
          </svg>
          <input type="password" class="input" placeholder="Insira sua Senha" id="senha" />
        </div>
        ` : ``
        }
        
        <button class="button-submit">${this.mode === 'register' ? 'Cadastre-se' : 'Entrar'}</button>
        <p class="p">
          ${
            this.mode === 'register'
              ? 'Já tem uma conta? <span class="span" id="toggleMode">Faça login</span>'
              : 'Não tem uma conta? <span class="span" id="toggleMode">Cadastre-se</span>'
          }
        </p>
      </form>
    `;
    this.shadowRoot.querySelector("form").addEventListener("submit", e => this.handleSubmit(e));
    this.shadowRoot.querySelector("#toggleMode").addEventListener("click", () => this.toggleMode());
  }

  toggleMode() {
    this.mode = this.mode === 'register' ? 'login' : 'register';
    this.render();
  }

  async handleSubmit(e) {
    e.preventDefault();
    const name = this.shadowRoot.querySelector("#name").value.trim();
    const telefone = this.shadowRoot.querySelector("#telefone").value.trim();
    const email = this.shadowRoot.querySelector("#email").value.trim();
    const senhaField = this.shadowRoot.querySelector("#senha");
    const senha = senhaField ? senhaField.value.trim() : null;

    if (!name || !telefone || !email || (this.mode === 'register' && !senha)) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    // Pegue affiliate_id da URL (ex.: ?affiliate=123)
    const params = new URLSearchParams(window.location.search);
    const affiliateId = params.get("affiliate") || null;

    const requestBody = {
      name,
      telefone,
      email,
      affiliateId
    };

    if (this.mode === 'register') {
      requestBody.password = senha;
    }

    // Endpoint: /api/users/register para cadastro, /api/users/login para login
    const endpoint = this.mode === 'register' ? "/api/users/register" : "/api/users/login";

    try {
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      const data = await resp.json();
      if (data.success) {
        alert("Login realizado com sucesso!");
        // Salva o agent_id (neste caso, o id do usuário) no localStorage
        localStorage.setItem("agentId", data.user.id);
        // Aqui você pode redirecionar o usuário ou atualizar a interface
      } else {
        alert("Erro: " + (data.error || "Ocorreu um erro."));
      }
    } catch (e) {
      console.error(e);
      alert("Falha na comunicação com o servidor.");
    }
  }
}

customElements.define('login-component', LoginComponent);

(function() {
  // --- INJEÇÃO DO CSS ---
  var css = `
/* Reset básico */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Corpo da página */
body {
  font-family: 'Montserrat', sans-serif;
  background-color: #f5f5f5;
  color: #2e2e2f;
}

/* Container geral para organizar o loader em cima e o card embaixo */
.loading-container {
  display: flex;
  flex-direction: column; /* Empilha o loader e o card verticalmente */
  align-items: center;    /* Centraliza horizontalmente */
  justify-content: flex-start; /* Alinhar ao topo */
  max-width: 1200px;     /* Maior largura para preencher mais a tela */
  margin: 0 auto;        /* Centraliza no meio da página */
  padding: 2rem;         /* Espaço interno se desejar */
}

/*************************************************
 * LOADER (Bloco superior, sem alterações)
 *************************************************/
.loader {
  width: 420px;          /* Um pouco maior que 320px */
  min-height: 180px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
  padding: 30px;
}

/* Container dos pontinhos pulsantes */
.dots-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.dot {
  height: 20px;
  width: 20px;
  margin-right: 10px;
  border-radius: 50%;
  background-color: #b3d4fc;
  animation: pulse 1.5s infinite ease-in-out;
}
.dot:last-child {
  margin-right: 0;
}

/* Delays diferentes para cada pontinho */
.dot:nth-child(1) {
  animation-delay: -0.3s;
}
.dot:nth-child(2) {
  animation-delay: -0.1s;
}
.dot:nth-child(3) {
  animation-delay: 0.1s;
}

@keyframes pulse {
  0% {
    transform: scale(0.8);
    background-color: #b3d4fc;
    box-shadow: 0 0 0 0 rgba(178, 212, 252, 0.7);
  }
  50% {
    transform: scale(1.2);
    background-color: #6793fb;
    box-shadow: 0 0 0 10px rgba(178, 212, 252, 0);
  }
  100% {
    transform: scale(0.8);
    background-color: #b3d4fc;
    box-shadow: 0 0 0 0 rgba(178, 212, 252, 0.7);
  }
}

/* Texto “Carregando...” */
.loader label {
  color: #002;
  font-size: 18px;
  font-weight: 600;
  animation: bit 0.6s alternate infinite;
}

@keyframes bit {
  from { opacity: 0.3; }
  to   { opacity: 1; }
}

/* Mensagem complementar */
.loader .message {
  margin-top: 0.5rem;
  font-size: 14px;
  text-align: center;
  color: #333;
}

/*************************************************
 * CARD (Bloco inferior, estilo original)
 *************************************************/
.task {
  position: relative;
  background-color: #fff;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: rgba(99, 99, 99, 0.1) 0px 2px 8px 0px;
  border: 3px dashed transparent;
  max-width: 500px;  /* Aumentamos para 500px */
  width: 100%;
  margin-bottom: 1rem;
}

.task:hover {
  box-shadow: rgba(99, 99, 99, 0.3) 0px 2px 8px 0px;
  border-color: rgba(162, 179, 207, 0.2) !important;
}

.task p {
  font-size: 15px;
  margin: 1.2rem 0;
  line-height: 1.4;
}

.task img {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 0 auto 1rem; /* Espaço abaixo da imagem */
  border-radius: 8px;
}

/* Tag / Botão de Opções */
.tag {
  border-radius: 100px;
  padding: 4px 13px;
  font-size: 12px;
  color: #ffffff;
  background-color: #1389eb;
}

.tags {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem; /* Espaço entre o título e a imagem */
}

.options {
  background: transparent;
  border: 0;
  cursor: pointer;
  font-size: 17px;
  color: #c4cad3;
}

.options svg {
  fill: #9fa4aa;
  width: 20px;
  height: 20px;
}

/* Seções de estatísticas (data, chat, curtidas, etc.) */
.stats {
  position: relative;
  width: 100%;
  color: #9fa4aa;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1rem;
}

.stats div {
  margin-right: 1rem;
  height: 20px;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.stats svg {
  margin-right: 5px;
  height: 100%;
  stroke: #9fa4aa;
}

/* Ícones de “viewer” */
.viewer span {
  height: 30px;
  width: 30px;
  background-color: rgb(28, 117, 219);
  margin-right: -10px;
  border-radius: 50%;
  border: 1px solid #fff;
  display: grid;
  align-items: center;
  text-align: center;
  font-weight: bold;
  color: #fff;
  padding: 2px;
}
.viewer span svg {
  stroke: #fff;
}
  `;
  var style = document.createElement("style");
  style.type = "text/css";
  style.appendChild(document.createTextNode(css));
  document.head.appendChild(style);

  // --- CRIAÇÃO DA ESTRUTURA HTML ---
  // Cria o elemento para o header externo
  var headerDiv = document.createElement("div");
  headerDiv.id = "externalHeader";
  document.body.appendChild(headerDiv);

  // Cria o container principal de loading
  var loadingContainer = document.createElement("div");
  loadingContainer.className = "loading-container";
  document.body.appendChild(loadingContainer);

  // Cria o bloco do loader
  var loader = document.createElement("div");
  loader.className = "loader";
  loader.innerHTML = `
    <section class="dots-container">
      <div class="dot"></div>
      <div class="dot"></div>
      <div class="dot"></div>
      <div class="dot"></div>
      <div class="dot"></div>
    </section>
    <label>Carregando...</label>
    <p class="message">Estamos buscando ofertas extraordinárias!</p>
  `;
  loadingContainer.appendChild(loader);

  // Cria o container para o card aleatório
  var randomCardContainer = document.createElement("div");
  randomCardContainer.id = "randomCardContainer";
  loadingContainer.appendChild(randomCardContainer);

  // --- CARREGA O HEADER EXTERNO ---
  // Alteração: agora importamos de "header-component.js" em vez de "header.html"
  fetch("https://business.airland.com.br/header-component.js")
    .then(function(resp) { return resp.text(); })
    .then(function(html) {
      document.getElementById("externalHeader").innerHTML = html;
    })
    .catch(function(err) {
      console.error("Erro ao carregar header externa:", err);
    });

  /**************************************************************
   * DEFINIÇÃO DOS 4 ITENS (com o HTML original que você passou)
   **************************************************************/

  /* ITEM 01 */
  var item1 = `
    <div class="task" draggable="true">
      <div class="tags">
        <span class="tag">Novidade Disney</span>
        <button class="options">
          <!-- SVG de opções (Capa_1) -->
          <svg xml:space="preserve" viewBox="0 0 41.915 41.916"
               xmlns:xlink="http://www.w3.org/1999/xlink"
               xmlns="http://www.w3.org/2000/svg" id="Capa_1"
               version="1.1" fill="#000000">
            <g stroke-width="0" id="SVGRepo_bgCarrier"></g>
            <g stroke-linejoin="round" stroke-linecap="round" id="SVGRepo_tracerCarrier"></g>
            <g id="SVGRepo_iconCarrier">
              <g>
                <g>
                  <path d="M11.214,20.956c0,3.091-2.509,5.589-5.607,5.589
                           C2.51,26.544,0,24.046,0,20.956c0-3.082,2.511-5.585,5.607-5.585
                           C8.705,15.371,11.214,17.874,11.214,20.956z"></path>
                  <path d="M26.564,20.956c0,3.091-2.509,5.589-5.606,5.589
                           c-3.097,0-5.607-2.498-5.607-5.589c0-3.082,2.511-5.585,5.607-5.585
                           C24.056,15.371,26.564,17.874,26.564,20.956z"></path>
                  <path d="M41.915,20.956c0,3.091-2.509,5.589-5.607,5.589
                           c-3.097,0-5.606-2.498-5.606-5.589c0-3.082,2.511-5.585,5.606-5.585
                           C39.406,15.371,41.915,17.874,41.915,20.956z"></path>
                </g>
              </g>
            </g>
          </svg>
        </button>
      </div>
  
      <img 
        src="https://www.vaipradisney.com/blog/wp-content/uploads/2024/08/WDW_Monsters_Street-View-2048x1180-1-780x449.jpg"
        alt="Banner da Magic Travel"
      >
  
      <p>
        No Hollywood Studios uma nova área de “Monstros S.A”, que será inspirada na cidade fictícia do filme, Monstrópolis. Uma montanha-russa suspensa também será inaugurada pela primeira vez, com portas penduradas, assim como nas cenas da animação.
      </p>
  
      <div class="stats">
        <div>
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <g stroke-width="0" id="SVGRepo_bgCarrier"></g>
              <g stroke-linejoin="round" stroke-linecap="round" id="SVGRepo_tracerCarrier"></g>
              <g id="SVGRepo_iconCarrier">
                <path stroke-linecap="round" stroke-width="2" d="M12 8V12L15 15"></path>
                <circle stroke-width="2" r="9" cy="12" cx="12"></circle>
              </g>
            </svg>
            Feb 24
          </div>
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <g stroke-width="0"></g>
              <g stroke-linejoin="round" stroke-linecap="round"></g>
              <g>
                <path stroke-linejoin="round" stroke-linecap="round" stroke-width="1.5"
                      d="M16 10H16.01M12 10H12.01M8 10H8.01M3 10C3 4.64706
                         5.11765 3 12 3C18.8824 3 21 4.64706 21 10C21 15.3529 18.8824 17
                         12 17C11.6592 17 11.3301 16.996 11.0124 16.9876L7 21V16.4939
                         C4.0328 15.6692 3 13.7383 3 10Z"></path>
              </g>
            </svg>
            18
          </div>
          <div>
            <svg fill="#000000" xmlns:xlink="http://www.w3.org/1999/xlink"
                 xmlns="http://www.w3.org/2000/svg" version="1.1"
                 viewBox="-2.5 0 32 32">
              <g stroke-width="0" id="SVGRepo_bgCarrier"></g>
              <g stroke-linejoin="round" stroke-linecap="round" id="SVGRepo_tracerCarrier"></g>
              <g id="SVGRepo_iconCarrier">
                <g id="icomoon-ignore"></g>
                <path fill="#000000" d="M0 10.284l0.505 0.36...
                "></path>
              </g>
            </svg>
            7
          </div>
        </div>
  
        <div class="viewer">
          <span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              ...
            </svg>
          </span>
          <span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              ...
            </svg>
          </span>
          <span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              ...
            </svg>
          </span>
          <span>+31</span>
        </div>
      </div>
    </div>
  `; // FIM ITEM 01
  
  /* ITEM 02 (TROPICAL AMERICAS) */
  var item2 = `
    <div class="task" draggable="true">
      <div class="tags">
        <span class="tag">Novidade Disney</span>
        <button class="options">
          <svg xml:space="preserve" viewBox="0 0 41.915 41.916"
               xmlns:xlink="http://www.w3.org/1999/xlink"
               xmlns="http://www.w3.org/2000/svg" id="Capa_1"
               version="1.1" fill="#000000">
            ...
          </svg>
        </button>
      </div>
    
      <img 
        src="https://www.indopraorlando.com.br/wp-content/uploads/2024/08/WDW_Tropical-Americas_Encanto_Casita_Exterior-601x292-3c857ab_Easy-Resize.com_.jpg"
        alt="Banner da Magic Travel"
      >
    
      <p>
        Tropical Americas será uma nova área no <b>Disney’s Animal Kingdom,</b> trazendo duas atrações inéditas:
        uma aventura com <b>Indiana Jones</b> em um templo maia e a Casita Madrigal
        de <b>“Encanto”</b>. Haverá também um carrossel inspirado em animais das
        histórias Disney. <b>A abertura está prevista para 2027.</b>
      </p>
    
      <div class="stats">
        <div>
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              ...
            </svg>
            Jan 17
          </div>
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              ...
            </svg>
            18
          </div>
          <div>
            <svg fill="#000000" xmlns:xlink="http://www.w3.org/1999/xlink"
                 xmlns="http://www.w3.org/2000/svg" version="1.1"
                 viewBox="-2.5 0 32 32">
              ...
            </svg>
            7
          </div>
        </div>
        <div class="viewer">
          <span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              ...
            </svg>
          </span>
          <span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              ...
            </svg>
          </span>
          <span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              ...
            </svg>
          </span>
          <span>+11</span>
        </div>
      </div>
    </div>
  `; // FIM ITEM 02
  
  /* ITEM 03 (CARROS NO MAGIC KINGDOM) */
  var item3 = `
    <div class="task" draggable="true">
      <div class="tags">
        <span class="tag">Novidade Disney</span>
        <button class="options">
          <svg xml:space="preserve" viewBox="0 0 41.915 41.916"
               xmlns:xlink="http://www.w3.org/1999/xlink"
               xmlns="http://www.w3.org/2000/svg" id="Capa_1"
               version="1.1" fill="#000000">
            ...
          </svg>
        </button>
      </div>
    
      <img 
        src="https://www.indopraorlando.com.br/wp-content/uploads/2024/08/WDW_Cars_Attraction_Finish-Line-601x307-508907b_Easy-Resize.com_.jpg"
        alt="Banner da Magic Travel"
      >
    
      <p>
        <b>Carros</b> chega ao <b>Magic Kingdom</b> em uma Frontierland reinventada com duas novas atrações:
        uma corrida de <b>rally off-road</b> e outra para toda a família,
        inclusive os pequenos fãs de velocidade. <b>A construção começa no início do próximo ano.</b>
      </p>
    
      <div class="stats">
        <div>
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              ...
            </svg>
            Feb 03
          </div>
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              ...
            </svg>
            18
          </div>
          <div>
            <svg fill="#000000" xmlns:xlink="http://www.w3.org/1999/xlink"
                 xmlns="http://www.w3.org/2000/svg" version="1.1"
                 viewBox="-2.5 0 32 32">
              ...
            </svg>
            7
          </div>
        </div>
    
        <div class="viewer">
          <span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              ...
            </svg>
          </span>
          <span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              ...
            </svg>
          </span>
          <span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              ...
            </svg>
          </span>
          <span>+20</span>
        </div>
      </div>
    </div>
  `; // FIM ITEM 03
  
  /* ITEM 04 (CURIOSIDADE DISNEY - EPIC UNIVERSE) */
  var item4 = `
    <div class="task" draggable="true">
      <div class="tags">
        <span class="tag">Curiosidade Disney</span>
        <button class="options">
          <svg xml:space="preserve" viewBox="0 0 41.915 41.916"
               xmlns:xlink="http://www.w3.org/1999/xlink"
               xmlns="http://www.w3.org/2000/svg" id="Capa_1"
               version="1.1" fill="#000000">
            ...
          </svg>
        </button>
      </div>
    
      <img 
        src="https://www.vaipradisney.com/blog/wp-content/uploads/2024/01/epic-universe-map-universal.jpg"
        alt="Banner da Magic Travel"
      >
    
      <p>
        O <b>Epic Universe,</b> da Universal, abre em <b>22 de maio de 2025</b> em Orlando.
        Será o quarto e maior parque do complexo, com cinco <b>mundos temáticos:</b>
        Ministério da Magia (Harry Potter), Super Nintendo World, Ilha de Berk
        (Como Treinar o Seu Dragão), Celestial Park e Dark Universe.
      </p>
    
      <div class="stats">
        <div>
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              ...
            </svg>
            Jan 09
          </div>
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              ...
            </svg>
            34
          </div>
          <div>
            <svg fill="#000000" xmlns:xlink="http://www.w3.org/1999/xlink"
                 xmlns="http://www.w3.org/2000/svg" version="1.1"
                 viewBox="-2.5 0 32 32">
              ...
            </svg>
            12
          </div>
        </div>
      
        <div class="viewer">
          <span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              ...
            </svg>
          </span>
          <span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              ...
            </svg>
          </span>
          <span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              ...
            </svg>
          </span>
          <span>+44</span>
        </div>
      </div>
    </div>
  `; // FIM ITEM 04
  
  /*****************************************************************
   * Seleciona aleatoriamente um card e injeta no container
   *****************************************************************/
  var items = [item1, item2, item3, item4];
  var randomIndex = Math.floor(Math.random() * items.length);
  document.getElementById("randomCardContainer").innerHTML = items[randomIndex];
})();

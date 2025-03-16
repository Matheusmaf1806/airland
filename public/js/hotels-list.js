// LÓGICA PRINCIPAL DE BUSCA DE HOTÉIS

const roomsWrapper = document.getElementById("roomsWrapper");
const statusEl = document.getElementById("status");
const hotelsListEl = document.getElementById("hotelsList");
let currentPage = 1;  // Página atual

// Ao carregar a página, cria pelo menos 1 quarto
window.addEventListener("DOMContentLoaded", () => {
  adicionarQuarto();
});

// Função para adicionar dinamicamente um quarto
function adicionarQuarto() {
  const roomIndex = roomsWrapper.children.length + 1;
  const div = document.createElement("div");
  div.classList.add("room-row");
  const roomId = `room_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  
  // Monta o HTML interno do quarto
  div.innerHTML = `
    <strong>Quarto ${roomIndex}:</strong>
    <label>Adultos:</label>
    <select class="adultsSelect">
      <option value="1">1</option>
      <option value="2" selected>2</option>
      <option value="3">3</option>
      <option value="4">4</option>
    </select>
    <label>Crianças:</label>
    <select class="childrenSelect">
      <option value="0" selected>0</option>
      <option value="1">1</option>
      <option value="2">2</option>
    </select>
    <button type="button" class="remove-room-btn">Remover</button>
  `;
  div.id = roomId;

  // Evento para remover o quarto
  const removeBtn = div.querySelector(".remove-room-btn");
  removeBtn.addEventListener("click", () => {
    roomsWrapper.removeChild(div);
    reindexRooms();
  });

  roomsWrapper.appendChild(div);
  reindexRooms();
}

// Reindexa nomes dos quartos após remoção
function reindexRooms() {
  const rows = roomsWrapper.querySelectorAll(".room-row");
  rows.forEach((row, idx) => {
    const strongEl = row.querySelector("strong");
    strongEl.textContent = `Quarto ${idx + 1}:`;
  });
}

// Função para buscar hotéis com paginação
async function buscarHoteis(page = 1) {
  currentPage = page;  // Atualiza a página atual

  const checkIn = document.getElementById("checkIn").value;
  const checkOut = document.getElementById("checkOut").value;
  const destination = document.getElementById("destination").value || "MCO";

  // Limpa a lista e exibe "carregando"
  hotelsListEl.innerHTML = "";
  statusEl.textContent = "Carregando hotéis...";
  statusEl.style.display = "block";

  // Montar query string a partir dos parâmetros e dos quartos selecionados
  const roomRows = roomsWrapper.querySelectorAll(".room-row");
  let queryString = `?checkIn=${checkIn}&checkOut=${checkOut}&destination=${destination}&rooms=${roomRows.length}&page=${page}&limit=20`;

  roomRows.forEach((row, index) => {
    const i = index + 1;
    const adultsSelect = row.querySelector(".adultsSelect");
    const childrenSelect = row.querySelector(".childrenSelect");
    const adValue = adultsSelect.value;
    const chValue = childrenSelect.value;
    queryString += `&adults${i}=${adValue}&children${i}=${chValue}`;
  });

  // URL para chamar o backend (rota que retorna hotéis com paginação e limite de 20)
  const url = `/api/hotelbeds/hotels${queryString}`;
  console.log("Requisição:", url);

  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`Erro ao buscar hotéis. Status: ${resp.status}`);
    }
    const data = await resp.json();

    // Verificar a estrutura correta de dados
    const hotelsArray = data.hotels?.hotels || [];

    if (!hotelsArray.length) {
      statusEl.textContent = "Nenhum hotel encontrado.";
      return;
    }

    statusEl.style.display = "none";

    // Exibe cada hotel na página
    for (const hotel of hotelsArray) {
      // Realiza a segunda requisição para buscar as imagens e descrição
      const hotelContentResp = await fetch(`/api/hotelbeds/hotel-content?hotelCode=${hotel.code}`);
      const hotelContent = await hotelContentResp.json();

      const content = hotelContent?.hotels?.[0] || {};

      const item = document.createElement("div");
      item.classList.add("hotel-item");

      // Nome e categoria: priorizando dados de conteúdo (se existir)
      const name = content.name || hotel.name || "Hotel sem nome";
      const category = content.categoryName || hotel.categoryName || hotel.categoryCode || "";

      // Descrição: do conteúdo detalhado ou mensagem padrão
      const description = content.description || "Não informado";

      // Imagem: se houver dados de conteúdo com imagens, usar a URL com "bigger"; senão, fallback
      let imageUrl = "";
      if (content.images && content.images.length) {
        imageUrl = `https://photos.hotelbeds.com/giata/bigger/${content.images[0].path}`;
      } else {
        imageUrl = "https://dummyimage.com/80x80/cccccc/000000.png&text=No+Image";
      }

      // Adiciona as informações desejadas, sem preços
      item.innerHTML = `
        <div class="hotel-header">
          <img src="${imageUrl}" alt="${name}">
          <div class="hotel-info">
            <h3>${name}</h3>
            <div class="hotel-location">Categoria: ${category}</div>
          </div>
        </div>
        <div class="hotel-description">Descrição: ${description}</div>
      `;
      hotelsListEl.appendChild(item);
    }

    // Exibe botões de navegação
    exibirPaginacao(data.totalPages, page);
  } catch (err) {
    console.error("Erro:", err);
    statusEl.textContent = "Erro ao buscar hotéis. Ver console.";
  }
}

// Função para exibir botões de navegação
function exibirPaginacao(totalPages, currentPage) {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";

  // Botão para página anterior
  if (currentPage > 1) {
    const previousButton = document.createElement("button");
    previousButton.textContent = "Anterior";
    previousButton.onclick = () => buscarHoteis(currentPage - 1);
    pagination.appendChild(previousButton);
  }

  // Botão para página seguinte
  if (currentPage < totalPages) {
    const nextButton = document.createElement("button");
    nextButton.textContent = "Próxima Página";
    nextButton.onclick = () => buscarHoteis(currentPage + 1);
    pagination.appendChild(nextButton);
  }
}


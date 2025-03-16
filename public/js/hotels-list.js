let currentPage = 1; // Página atual
let totalHotels = 0;  // Total de hotéis (será atualizado com a resposta)
let hotelsPerPage = 20; // Quantidade de hotéis por página

const roomsWrapper = document.getElementById("roomsWrapper");

// Ao carregar a página, cria pelo menos 1 quarto
window.addEventListener("DOMContentLoaded", () => {
  adicionarQuarto();
  // Não chamar buscarHoteis automaticamente aqui
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
  const checkIn = document.getElementById("checkIn").value;
  const checkOut = document.getElementById("checkOut").value;
  const destination = document.getElementById("destination").value || "MCO";

  const statusEl = document.getElementById("status");
  const hotelsListEl = document.getElementById("hotelsList");

  // Limpa a lista e exibe "carregando"
  hotelsListEl.innerHTML = "";
  statusEl.textContent = "Carregando hotéis...";
  statusEl.style.display = "block";

  const queryString = `?checkIn=${checkIn}&checkOut=${checkOut}&destination=${destination}&page=${page}&limit=${hotelsPerPage}`;
  const url = `/api/hotelbeds/hotels${queryString}`;

  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`Erro ao buscar hotéis. Status: ${resp.status}`);
    }
    const data = await resp.json();

    const hotelsArray = data.hotels || [];
    totalHotels = data.total || hotelsArray.length;  // Atualizar o total de hotéis baseado no que veio

    if (!hotelsArray.length) {
      statusEl.textContent = "Nenhum hotel encontrado.";
      return;
    }

    statusEl.style.display = "none";

    hotelsArray.forEach((hotel) => {
      const item = document.createElement("div");
      item.classList.add("hotel-item");

      // Nome e categoria: priorizando dados de conteúdo (se existir)
      const name = hotel.content?.name || hotel.name || "Hotel sem nome";
      const category = hotel.content?.categoryName || hotel.categoryName || hotel.categoryCode || "";

      // Descrição: do conteúdo detalhado ou mensagem padrão
      const description = hotel.content?.description || "Não informado";

      // Imagem: se houver dados de conteúdo com imagens, usar a URL com "bigger"; senão, fallback
      let imageUrl = "https://dummyimage.com/80x80/cccccc/000000.png&text=No+Image";
      if (hotel.content && hotel.content.images && hotel.content.images.length) {
        imageUrl = `https://photos.hotelbeds.com/giata/bigger/${hotel.content.images[0].path}`;
      }

      // Faixa de preço
      const priceRange = `${hotel.minRate || "???"} - ${hotel.maxRate || "???"} ${hotel.currency || ""}`;

      item.innerHTML = `
        <div class="hotel-header">
          <img src="${imageUrl}" alt="${name}">
          <div class="hotel-info">
            <h3>${name}</h3>
            <div class="hotel-location">Categoria: ${category}</div>
          </div>
        </div>
        <div class="hotel-description">Descrição: ${description}</div>
        <div class="hotel-price">Preço: ${priceRange}</div>
      `;
      hotelsListEl.appendChild(item);
    });
  } catch (err) {
    console.error("Erro:", err);
    statusEl.textContent = "Erro ao buscar hotéis. Ver console.";
  }
}

// Função para ir para a próxima página
function nextPage() {
  if ((currentPage * hotelsPerPage) < totalHotels) {
    currentPage++;
    buscarHoteis(currentPage);
  }
}

// Função para ir para a página anterior
function previousPage() {
  if (currentPage > 1) {
    currentPage--;
    buscarHoteis(currentPage);
  }
}

// Função para carregar os resultados da primeira página
document.getElementById("buscarBtn").addEventListener("click", function() {
  currentPage = 1;  // Resetar para a página 1
  buscarHoteis(currentPage); // Chama a função para buscar hotéis
});

// LÓGICA PRINCIPAL DE BUSCA DE HOTÉIS

const roomsWrapper = document.getElementById("roomsWrapper");

// Ao carregar a página, cria pelo menos 1 quarto
window.addEventListener("DOMContentLoaded", () => {
  adicionarQuarto(); 
});

// Função para adicionar dinamicamente um quarto
function adicionarQuarto() {
  const roomIndex = roomsWrapper.children.length + 1; // ex.: se já tem 2, o índice do novo será 3

  // Cria o container .room-row
  const div = document.createElement("div");
  div.classList.add("room-row");

  // ID único para identificação e remoção
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

  // Configura o evento de clique do botão "Remover"
  const removeBtn = div.querySelector(".remove-room-btn");
  removeBtn.addEventListener("click", () => {
    roomsWrapper.removeChild(div);
    reindexRooms();
  });

  roomsWrapper.appendChild(div);
  reindexRooms();
}

// Reindexa os nomes dos quartos após remoção
function reindexRooms() {
  const rows = roomsWrapper.querySelectorAll(".room-row");
  rows.forEach((row, idx) => {
    const strongEl = row.querySelector("strong");
    strongEl.textContent = `Quarto ${idx + 1}:`;
  });
}

// Função principal: chamar a rota do backend para buscar hotéis
async function buscarHoteis() {
  const checkIn = document.getElementById("checkIn").value;
  const checkOut = document.getElementById("checkOut").value;
  const destination = document.getElementById("destination").value || "MCO";

  const statusEl = document.getElementById("status");
  const hotelsListEl = document.getElementById("hotelsList");
  
  // Limpa a lista e exibe mensagem de "carregando"
  hotelsListEl.innerHTML = "";
  statusEl.textContent = "Carregando hotéis...";
  statusEl.style.display = "block";

  // Montar query string a partir dos parâmetros e dos quartos selecionados
  const roomRows = roomsWrapper.querySelectorAll(".room-row");
  let queryString = `?checkIn=${checkIn}&checkOut=${checkOut}&destination=${destination}&rooms=${roomRows.length}`;

  roomRows.forEach((row, index) => {
    const i = index + 1;
    const adultsSelect = row.querySelector(".adultsSelect");
    const childrenSelect = row.querySelector(".childrenSelect");
    const adValue = adultsSelect.value;
    const chValue = childrenSelect.value;
    queryString += `&adults${i}=${adValue}&children${i}=${chValue}`;
  });

  // URL para chamar o backend
  const url = `/api/hotelbeds/hotels${queryString}`;
  console.log("Requisição:", url);

  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`Erro ao buscar hotéis. Status: ${resp.status}`);
    }

    const data = await resp.json();

    // Se o back-end retornar "combined", usamos-o; senão, tentamos usar data.hotels.hotels
    const hotelsArray = data.combined || data?.hotels?.hotels || [];

    if (!hotelsArray.length) {
      statusEl.textContent = "Nenhum hotel encontrado.";
      return;
    }
    
    statusEl.style.display = "none";

    // Para cada hotel, exibe informações de disponibilidade e conteúdo detalhado
    hotelsArray.forEach((hotel) => {
      const item = document.createElement("div");
      item.classList.add("hotel-item");

      // Nome e categoria: se houver conteúdo detalhado, priorizamos
      const name = hotel.name || "Hotel sem nome";
      const category = hotel.content?.categoryName || hotel.categoryCode || "";
      
      // Descrição: busca a descrição no objeto "content" se existir, senão exibe mensagem padrão
      const description = hotel.content?.description || "Não informado";

      // Imagem: se houver dados de conteúdo e imagens, utiliza a primeira; senão, placeholder
      let imageUrl = "https://via.placeholder.com/80";
      if (hotel.content && hotel.content.images && hotel.content.images.length) {
        imageUrl = `https://photos.hotelbeds.com/giata/${hotel.content.images[0].path}`;
      }

      // Preço: utiliza minRate e maxRate da disponibilidade
      const priceRange = `${hotel.minRate || "???"} - ${hotel.maxRate || "???"} ${hotel.currency || ""}`;
      
      item.innerHTML = `
        <div class="hotel-header">
          <img src="${imageUrl}" alt="${name}">
          <div class="hotel-info">
            <h3>${name}</h3>
            <div class="hotel-location">
              Categoria: ${category}
            </div>
          </div>
        </div>
        <div class="hotel-description">
          Descrição: ${description}
        </div>
        <div class="hotel-price">
          Preço: ${priceRange}
        </div>
      `;

      hotelsListEl.appendChild(item);
    });
  } catch (err) {
    console.error("Erro:", err);
    statusEl.textContent = "Erro ao buscar hotéis. Ver console.";
  }
}

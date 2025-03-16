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

  // ID único p/ remover
  const roomId = `room_${Date.now()}_${Math.floor(Math.random()*1000)}`;

  // Monta HTML interno
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
  
  // Atribuímos um ID no container p/ identificar e remover depois
  div.id = roomId;

  // Capturamos o botão "Remover" e adicionamos o evento de clique
  const removeBtn = div.querySelector(".remove-room-btn");
  removeBtn.addEventListener("click", () => {
    roomsWrapper.removeChild(div);
    reindexRooms();
  });

  roomsWrapper.appendChild(div);
  reindexRooms();
}

// Reindexa nomes dos quartos (Quarto 1, Quarto 2...) após remover
function reindexRooms() {
  const rows = roomsWrapper.querySelectorAll(".room-row");
  rows.forEach((row, idx) => {
    const strongEl = row.querySelector("strong");
    strongEl.textContent = `Quarto ${idx+1}:`;
  });
}

// Principal: chamar a rota do backend para buscar hotéis
async function buscarHoteis() {
  const checkIn = document.getElementById("checkIn").value;
  const checkOut = document.getElementById("checkOut").value;
  const destination = document.getElementById("destination").value || "MCO";

  const statusEl = document.getElementById("status");
  const hotelsListEl = document.getElementById("hotelsList");
  
  // Limpa lista e mostra "carregando"
  hotelsListEl.innerHTML = "";
  statusEl.textContent = "Carregando hotéis...";
  statusEl.style.display = "block";

  // Montar query string
  // Precisamos iterar sobre cada .room-row e pegar Adults e Children
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

  // Faz GET na rota do seu back-end (ex.: /api/hotelbeds/hotels)
  const url = `/api/hotelbeds/hotels${queryString}`;
  console.log("Requisição:", url);

  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`Erro ao buscar hotéis. Status: ${resp.status}`);
    }

    const data = await resp.json();
    console.log("Resposta Hotelbeds:", data);

    const hotels = data.hotels || [];
    if (!hotels.length) {
      statusEl.textContent = "Nenhum hotel encontrado.";
      return;
    }

    // Oculta status, renderizar
    statusEl.style.display = "none";

    hotels.forEach((hotel) => {
      const item = document.createElement("div");
      item.classList.add("hotel-item");

      const name = hotel.name?.content || "Hotel sem nome";
      const category = hotel.categoryCode || "";
      const rating = hotel.categoryName || "";
      
      // Exemplo: pega 1 imagem
      let imageUrl = "https://via.placeholder.com/80";
      if (hotel.images && hotel.images.length) {
        imageUrl = `https://photos.hotelbeds.com/giata/${hotel.images[0].path}`;
      }

      item.innerHTML = `
        <div class="hotel-header">
          <img src="${imageUrl}" alt="${name}">
          <div class="hotel-info">
            <h3>${name}</h3>
            <div class="hotel-location">
              Categoria: ${category} - ${rating}
            </div>
          </div>
        </div>
        <div class="hotel-description">
          Endereço: ${hotel.address?.content || "Não informado"}
        </div>
        <div class="hotel-price">Preço: ??? (consultar cada room/board)</div>
      `;

      hotelsListEl.appendChild(item);
    });
  } catch (err) {
    console.error("Erro:", err);
    statusEl.textContent = "Erro ao buscar hotéis. Ver console.";
  }
}

// ---------------------------------------
// LÓGICA PRINCIPAL DE BUSCA DE HOTÉIS
// ---------------------------------------

// Capturamos a div que conterá as "room-rows"
const roomsWrapper = document.getElementById("roomsWrapper");

// Ao carregar a página, cria ao menos 1 quarto
window.addEventListener("DOMContentLoaded", () => {
  adicionarQuarto(); 
});

// Função para adicionar dinamicamente um quarto
function adicionarQuarto() {
  const roomIndex = roomsWrapper.children.length + 1;

  // Cria o container para um quarto
  const div = document.createElement("div");
  div.classList.add("room-row");

  // ID único p/ identificação e remoção
  const roomId = `room_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  div.id = roomId;

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

  // Configura o evento de clique no botão "Remover"
  const removeBtn = div.querySelector(".remove-room-btn");
  removeBtn.addEventListener("click", () => {
    roomsWrapper.removeChild(div);
    reindexRooms();
  });

  // Adiciona no wrapper
  roomsWrapper.appendChild(div);
  reindexRooms();
}

// Reindexar os nomes dos quartos após remoção
function reindexRooms() {
  const rows = roomsWrapper.querySelectorAll(".room-row");
  rows.forEach((row, idx) => {
    const strongEl = row.querySelector("strong");
    strongEl.textContent = `Quarto ${idx + 1}:`;
  });
}

/**
 * Função principal: chamar a rota do backend (/api/hotelbeds/hotels)
 * e exibir os resultados unificados (availability + content).
 */
async function buscarHoteis() {
  // 1) Pegar dados de checkIn, checkOut, destination
  const checkIn = document.getElementById("checkIn").value;
  const checkOut = document.getElementById("checkOut").value;
  const destination = document.getElementById("destination").value || "MCO";

  // 2) Pegar elementos de status e listagem
  const statusEl = document.getElementById("status");
  const hotelsListEl = document.getElementById("hotelsList");

  // 3) Limpar lista e mostrar "carregando"
  hotelsListEl.innerHTML = "";
  statusEl.textContent = "Carregando hotéis...";
  statusEl.style.display = "block";

  // 4) Montar query string (ocupa-se de capturar N quartos)
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

  // 5) URL do back-end
  const url = `/api/hotelbeds/hotels${queryString}`;
  console.log("Requisição:", url);

  try {
    // 6) Faz a chamada fetch
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`Erro ao buscar hotéis. Status: ${resp.status}`);
    }

    const data = await resp.json();

    /**
     * data deve ter o shape:
     * {
     *   availability: { ... }, 
     *   contentRaw: { ... }, 
     *   combined: [ { code, name, minRate, maxRate, currency, content: {...} }, ...]
     * }
     */
    const hotelsArray = data.combined || [];

    // Se não vier nada, exibimos mensagem
    if (!hotelsArray.length) {
      statusEl.textContent = "Nenhum hotel encontrado.";
      return;
    }

    // Se achou hotéis, some a msg de status
    statusEl.style.display = "none";

    // 7) Exibir cada hotel na página
    hotelsArray.forEach((hotel) => {
      const item = document.createElement("div");
      item.classList.add("hotel-item");

      // "hotel.name" = string com o nome do hotel
      const name = hotel.name || "Hotel sem nome";
      const category = hotel.content?.categoryName || hotel.categoryCode || "Sem categoria";
      
      // Exemplo de imagem, se houver no content
      let imageUrl = "https://via.placeholder.com/80";
      if (hotel.content?.images?.length) {
        imageUrl = `https://photos.hotelbeds.com/giata/${hotel.content.images[0].path}`;
      }

      // Descrição do hotel (pode ser um "content" grande)
      const description = hotel.content?.description || "Não informado";

      // Se houver reviews, podemos pegar a nota e qtd:
      // (Observe que a Content API pode ter reviews em "content.reviews" e cada item algo como { rate, reviewCount, type })
      let rating = "";
      if (hotel.content?.reviews?.length) {
        const { rate, reviewCount } = hotel.content.reviews[0];
        rating = `Nota: ${rate} (${reviewCount} avaliações)`;
      }

      // Exemplo para exibir minRate e maxRate
      // (Hotelbeds retorna strings, mas você pode formatar p/ real)
      const minRate = hotel.minRate ? `R$ ${hotel.minRate}` : "??";
      const maxRate = hotel.maxRate ? `R$ ${hotel.maxRate}` : "??";

      // Monta o HTML
      item.innerHTML = `
        <div class="hotel-header">
          <img src="${imageUrl}" alt="${name}">
          <div class="hotel-info">
            <h3>${name}</h3>
            <div class="hotel-category">
              ${category}
            </div>
            <div class="hotel-rating">
              ${rating}
            </div>
          </div>
        </div>
        <div class="hotel-description">
          Descrição: ${description}
        </div>
        <div class="hotel-price">
          Faixa de Preço: ${minRate} - ${maxRate}
        </div>
      `;

      hotelsListEl.appendChild(item);
    });
  } catch (err) {
    console.error("Erro:", err);
    statusEl.textContent = "Erro ao buscar hotéis. Verifique o console.";
  }
}

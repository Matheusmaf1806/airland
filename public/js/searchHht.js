// Certifique-se de que o script CryptoJS está sendo carregado corretamente
async function loadCryptoJS() {
  if (typeof CryptoJS === "undefined") {
    await import("https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js");
  }
}

const endpoint = "/hotel-data"; // Chama o backend em vez de acessar diretamente a API externa

// Função para buscar os hotéis com base no destino e nas datas
async function fetchHotelData(destination) {
  await loadCryptoJS(); // Garante que o CryptoJS foi carregado

  // Configuração da requisição
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ destination }),
  };

  try {
    const response = await fetch(endpoint, requestOptions);
    const result = await response.json();

    if (response.ok) {
      displayHotels(result); // Se a resposta for ok, exibe os hotéis
    } else {
      throw new Error(result.error || "Erro desconhecido ao buscar hotéis");
    }
  } catch (error) {
    console.error("Erro ao buscar hotéis:", error);
    document.getElementById("hotels-list").innerHTML =
      "Erro ao buscar hotéis: " + error.message; // Exibe erro na tela
  }
}

// Função para exibir os hotéis no front-end
function displayHotels(hotelsData) {
  const hotelsList = document.getElementById("hotels-list");
  hotelsList.innerHTML = ""; // Limpa a lista de hotéis antes de adicionar novos

  // Verifica se há hotéis retornados
  if (hotelsData && hotelsData.hotels && hotelsData.hotels.length > 0) {
    hotelsData.hotels.forEach((hotel) => {
      const hotelItem = document.createElement("div");
      hotelItem.className = "hotel-item";
      hotelItem.innerHTML = `
        <h3>${hotel.name}</h3>
        <p><strong>Categoria:</strong> ${hotel.categoryName}</p>
        <p><strong>Localização:</strong> ${hotel.destinationName}</p>
        <p><strong>Preço mínimo:</strong> ${hotel.minRate} ${hotel.currency}</p>
        <button onclick="alert('Reservado: ${hotel.name}')">Reservar</button>
      `;
      hotelsList.appendChild(hotelItem);
    });
  } else {
    hotelsList.innerHTML = "<p>Nenhum hotel encontrado para este destino.</p>";
  }
}

// Função chamada ao clicar no botão de buscar hotéis
document
  .getElementById("search-btn")
  .addEventListener("click", function () {
    const destination =
      document.getElementById("destination").value || "MCO"; // Define 'MCO' como destino padrão
    fetchHotelData(destination); // Chama a função para buscar hotéis
  });

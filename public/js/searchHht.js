// Certifique-se de que o script CryptoJS está sendo carregado corretamente
import CryptoJS from 'crypto-js';

const apiKey = '8b4f5d1990d4ad509b5c9a55e6928c30'; // Sua API Key
const secretKey = '1b5746196b'; // Sua Secret Key
const endpoint = 'https://api.test.hotelbeds.com/hotel-api/1.0/hotels';

// Função para gerar a assinatura X-Signature
function generateSignature() {
  const utcDate = Math.floor(new Date().getTime() / 1000); // Obtém o timestamp UTC
  const assemble = apiKey + secretKey + utcDate;  // Combina os dados necessários para gerar a assinatura
  const hash = CryptoJS.SHA256(assemble).toString(CryptoJS.enc.Hex); // Criptografa com SHA-256
  return hash;
}

// Função para buscar os hotéis com base no destino e nas datas
async function fetchHotelData(destination) {
  const signature = generateSignature();  // Gera a assinatura necessária

  // Cabeçalhos da requisição
  const myHeaders = new Headers();
  myHeaders.append("Api-key", apiKey);
  myHeaders.append("X-Signature", signature);
  myHeaders.append("Accept", "application/json");
  myHeaders.append("Content-Type", "application/json");

  const raw = JSON.stringify({
    "stay": {
      "checkIn": "2025-06-15",
      "checkOut": "2025-06-16"
    },
    "occupancies": [
      {
        "rooms": 1,
        "adults": 1,
        "children": 0
      }
    ],
    "destination": {
      "code": destination // O código do destino (ex: MCO)
    }
  });

  // Configuração da requisição
  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow"
  };

  // Faz a requisição para a API Hotelbeds
  try {
    const response = await fetch(endpoint, requestOptions);
    const result = await response.json();

    if (response.ok) {
      displayHotels(result);  // Se a resposta for ok, exibe os hotéis
    } else {
      throw new Error(result.error || 'Erro desconhecido ao buscar hotéis');
    }
  } catch (error) {
    console.error("Erro ao buscar hotéis:", error);
    document.getElementById("hotels-list").innerHTML = "Erro ao buscar hotéis: " + error.message;  // Exibe erro na tela
  }
}

// Função para exibir os hotéis no front-end
function displayHotels(hotelsData) {
  const hotelsList = document.getElementById("hotels-list");
  hotelsList.innerHTML = ''; // Limpa a lista de hotéis antes de adicionar novos

  // Verifica se há hotéis retornados
  if (hotelsData && hotelsData.hotels && hotelsData.hotels.length > 0) {
    hotelsData.hotels.forEach(hotel => {
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
document.getElementById("search-btn").addEventListener("click", function() {
  const destination = document.getElementById("destination").value || 'MCO'; // Define 'MCO' como destino padrão
  fetchHotelData(destination); // Chama a função para buscar hotéis
});

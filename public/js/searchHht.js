// Função para gerar a assinatura X-Signature
function generateSignature() {
  const publicKey = "8b4f5d1990d4ad509b5c9a55e6928c30";  // Sua chave pública
  const privateKey = "1b5746196b"; // Sua chave secreta

  const utcDate = Math.floor(new Date().getTime() / 1000);  // Timestamp UTC (em segundos)
  const assemble = `${publicKey}${privateKey}${utcDate}`;  // Combina os dados necessários para gerar a assinatura
  
  // Criptografia SHA-256 da combinação
  const hash = CryptoJS.SHA256(assemble).toString(CryptoJS.enc.Hex);
  return hash;
}

// Função para buscar os dados dos hotéis
async function fetchHotelData(destination) {
  const signature = generateSignature();  // Gera a assinatura necessária para a requisição
  const myHeaders = new Headers();
  myHeaders.append("Api-key", "8b4f5d1990d4ad509b5c9a55e6928c30");
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
      "code": destination
    }
  });

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow"
  };

  try {
    const response = await fetch("https://api.test.hotelbeds.com/hotel-api/1.0/hotels", requestOptions);
    const result = await response.json();
    displayHotels(result); // Exibe os dados dos hotéis na tela
  } catch (error) {
    console.error("Erro ao buscar hotéis:", error);
  }
}

// Função para exibir os hotéis na página
function displayHotels(data) {
  const hotelsList = document.getElementById("hotels-list");
  hotelsList.innerHTML = "";  // Limpa a lista de hotéis antes de adicionar os novos

  // Verifica se há hotéis na resposta
  if (data && data.hotels) {
    data.hotels.forEach(hotel => {
      const hotelItem = document.createElement("div");
      hotelItem.className = "hotel-item";
      hotelItem.innerHTML = `
        <h3>${hotel.name}</h3>
        <p>${hotel.categoryName}</p>
        <p>${hotel.destinationName}</p>
        <p>Preço: ${hotel.minRate} ${hotel.currency}</p>
      `;
      hotelsList.appendChild(hotelItem);  // Adiciona o item na lista
    });
  } else {
    hotelsList.innerHTML = "<p>Nenhum hotel encontrado.</p>";
  }
}

// Evento de clique no botão para buscar hotéis
document.getElementById("search-btn").addEventListener("click", () => {
  const destination = document.getElementById("destination").value || "MCO";  // Valor padrão "MCO" para Orlando
  fetchHotelData(destination);  // Chama a função para buscar os dados
});

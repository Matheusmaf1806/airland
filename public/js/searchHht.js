// Função para gerar a assinatura X-Signature
function generateSignature(publicKey, privateKey) {
  const utcDate = Math.floor(new Date().getTime() / 1000);  // Timestamp UTC (em segundos)
  const assemble = `${publicKey}${privateKey}${utcDate}`;  // Combina os dados necessários para gerar a assinatura
  
  // Criptografia SHA-256 da combinação
  const hash = CryptoJS.SHA256(assemble).toString();
  const encryption = hash.toString(CryptoJS.enc.Hex);
  
  return encryption;
}

// Função para realizar a requisição à API do Hotelbeds
function fetchHotelData(destination, checkIn, checkOut, rooms, adults, children) {
  const publicKey = '8b4f5d1990d4ad509b5c9a55e6928c30';  // Sua API Key
  const privateKey = '1b5746196b';  // Sua Secret Key
  
  // Gerar o X-Signature
  const signature = generateSignature(publicKey, privateKey);

  // Definir os cabeçalhos da requisição
  const myHeaders = new Headers();
  myHeaders.append("Api-key", publicKey);
  myHeaders.append("X-Signature", signature);
  myHeaders.append("Accept", "application/json");
  myHeaders.append("Accept-Encoding", "gzip");
  myHeaders.append("Content-Type", "application/json");

  // Definir o corpo da requisição (dados de pesquisa)
  const raw = JSON.stringify({
    "stay": {
      "checkIn": checkIn,
      "checkOut": checkOut
    },
    "occupancies": [
      {
        "rooms": rooms,
        "adults": adults,
        "children": children
      }
    ],
    "destination": {
      "code": destination  // Código do destino (Exemplo: "MCO" para Orlando)
    }
  });

  // Opções da requisição
  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow"
  };

  // Realizar a requisição
  fetch("https://api.test.hotelbeds.com/hotel-api/1.0/hotels", requestOptions)
    .then(response => response.json())  // Recebe a resposta em formato JSON
    .then(result => {
      console.log(result);  // Exibe o resultado no console
      displayHotels(result);  // Função para exibir os dados no front-end
    })
    .catch(error => {
      console.error("Erro ao buscar dados dos hotéis:", error);
    });
}

// Função para exibir os hotéis (na página, por exemplo)
function displayHotels(data) {
  const hotelsList = document.getElementById('hotels-list');  // Referência ao elemento que irá exibir os hotéis

  if (data.hotels && data.hotels.length > 0) {
    // Limpa qualquer conteúdo existente
    hotelsList.innerHTML = '';

    // Itera sobre os hotéis e cria a lista
    data.hotels.forEach(hotel => {
      const hotelElement = document.createElement('div');
      hotelElement.classList.add('hotel-item');
      
      // Extrair informações dos quartos e taxas
      let roomDetails = '';
      hotel.rooms.forEach(room => {
        roomDetails += `
          <div>
            <strong>${room.name}</strong>
            <p>Preço: ${room.rates[0].net} ${data.currency}</p>
            <p>Tipo de Tarifa: ${room.rates[0].rateClass}</p>
            <p>Política de Cancelamento: ${room.rates[0].cancellationPolicies[0].amount} antes de ${room.rates[0].cancellationPolicies[0].from}</p>
          </div>
        `;
      });

      hotelElement.innerHTML = `
        <h3>${hotel.name}</h3>
        <p>Categoria: ${hotel.categoryName}</p>
        <p>Localização: ${hotel.zoneName}, ${hotel.destinationName}</p>
        <p>Latitude: ${hotel.latitude}, Longitude: ${hotel.longitude}</p>
        ${roomDetails}
      `;
      hotelsList.appendChild(hotelElement);
    });
  } else {
    hotelsList.innerHTML = '<p>Nenhum hotel encontrado.</p>';
  }
}

// Chamar a função de pesquisa ao clicar no botão
document.getElementById('search-btn').addEventListener('click', () => {
  const destination = document.getElementById('destination').value || 'MCO';  // Padrão: Orlando (MCO)
  const checkIn = '2025-06-15';  // Exemplo de data de check-in
  const checkOut = '2025-06-16';  // Exemplo de data de check-out
  const rooms = 1;
  const adults = 1;
  const children = 0;

  fetchHotelData(destination, checkIn, checkOut, rooms, adults, children);
});

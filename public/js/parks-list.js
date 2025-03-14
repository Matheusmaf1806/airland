document.addEventListener("DOMContentLoaded", function() {
  // Função para carregar os parques
  fetch("https://devapi.ticketsgenie.app/v1/parks", {
    method: "GET",
    headers: {
      "x-api-key": "1234567890",
      "x-api-secret": "Magic Lamp"
    }
  })
  .then(response => response.json())
  .then(data => {
    const parksListContainer = document.getElementById('parks-list');
    
    // Loop para adicionar cada parque à página
    data.parks.forEach(park => {
      const parkElement = document.createElement('div');
      parkElement.classList.add('park-item');
      parkElement.innerHTML = `
        <h2>${park.name}</h2>
        <p>${park.description}</p>
        <button onclick="redirectToParkDetails('${park.code}')">Ver Detalhes</button>
      `;
      
      parksListContainer.appendChild(parkElement);
    });
  })
  .catch(error => {
    console.error('Erro ao carregar parques:', error);
  });

  // Função para redirecionar para a página de detalhes do parque
  window.redirectToParkDetails = function(parkCode) {
    window.location.href = `park-details.html?parkId=${parkCode}`;
  };
});

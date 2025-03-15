// parks-list.js

// Função para buscar a lista de parques via proxy do servidor
function listarParques() {
  fetch("/api/ticketsgenie/parks") 
    .then(response => {
      if (!response.ok) throw new Error("Erro ao buscar parques");
      return response.json();
    })
    .then(data => {
      const parksListEl = document.getElementById("parks-list");
      parksListEl.innerHTML = ""; // Limpa lista anterior

      // Cada parque do array data.parks
      data.parks.forEach(park => {
        // Cria um elemento div
        const parkEl = document.createElement("div");
        parkEl.classList.add("park-item");

        // Monta o HTML interno do item
        parkEl.innerHTML = `
          <h3>${park.name}</h3>
          <p>${park.description}</p>
          <button onclick="irParaIngressos('${park.code}')">Ver Ingressos</button>
        `;

        // Adiciona ao container
        parksListEl.appendChild(parkEl);
      });
    })
    .catch(err => {
      console.error("Erro ao listar parques:", err);
      alert("Não foi possível carregar os parques.");
    });
}

// Função que redireciona para a página de ingressos
function irParaIngressos(parkCode) {
  // Monta a URL do tickets-list.html com query param ?park=parkCode
  window.location.href = `tickets-list.html?park=${parkCode}`;
}

// Ao carregar a página, chamar listarParques()
window.addEventListener("DOMContentLoaded", listarParques);

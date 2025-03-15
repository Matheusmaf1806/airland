document.addEventListener("DOMContentLoaded", () => {
  listarIngressos();
});

function listarIngressos() {
  fetch("/api/noamtickets/parks")
    .then(response => {
      if (!response.ok) throw new Error("Erro ao buscar ingressos");
      return response.json();
    })
    .then(result => {
      const ticketsList = document.getElementById('tickets-list');
      ticketsList.innerHTML = '';

      result.products.forEach(ticket => {
        const ticketElement = document.createElement('div');
        ticketElement.classList.add('ticket-item');
        ticketElement.innerHTML = `
          <img src="${ticket.extensions.ticketBanner}" alt="${ticket.ticketName}">
          <h3>${ticket.ticketName}</h3>
          <p>${ticket.extensions.aboutTicket}</p>
          <p><strong>Preço:</strong> ${ticket.startingPrice.usdbrl.symbol}${ticket.startingPrice.usdbrl.amount}</p>
          <button onclick="abrirDetalhesIngresso('${ticket.code}')">Ver Detalhes</button>
        `;
        ticketsList.appendChild(ticketElement);
      });
    })
    .catch(error => console.error("Erro ao buscar ingressos:", error));
}

function abrirDetalhesIngresso(ticketCode) {
  window.location.href = `ticket-details.html?id=${ticketCode}`;
}

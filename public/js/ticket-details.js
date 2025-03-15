document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const ticketId = urlParams.get("id");
  
  if (ticketId) {
    carregarDetalhesIngresso(ticketId);
  }
});

function carregarDetalhesIngresso(ticketId) {
  fetch(`/api/noamtickets/parks/${ticketId}`)
    .then(response => {
      if (!response.ok) throw new Error("Erro ao buscar detalhes do ingresso");
      return response.json();
    })
    .then(ticket => {
      const ticketDetails = document.getElementById('ticket-details');
      ticketDetails.innerHTML = `
        <img src="${ticket.extensions.ticketBanner}" alt="${ticket.ticketName}">
        <h2>${ticket.ticketName}</h2>
        <p>${ticket.extensions.aboutTicket}</p>
        <p><strong>Preço:</strong> ${ticket.startingPrice.usdbrl.symbol}${ticket.startingPrice.usdbrl.amount}</p>
        <p><strong>Localização:</strong> ${ticket.parkLocation}</p>
        <p><strong>Parques Incluídos:</strong> ${ticket.parkIncluded}</p>
      `;
    })
    .catch(error => console.error("Erro ao buscar detalhes do ingresso:", error));
}

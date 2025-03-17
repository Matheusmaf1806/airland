// tickets-list.js

// Ao carregar a página, buscar o param "park" na query string
window.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const parkCode = urlParams.get("park");

  if (!parkCode) {
    alert("Nenhum parque selecionado!");
    return;
  }

  listarIngressos(parkCode);
});

function listarIngressos(parkCode) {
  // Exemplo de rota que retorna a lista de products do parque
  // /api/ticketsgenie/parks/:id/products
  fetch(`/api/ticketsgenie/parks/${parkCode}/products`)
    .then(response => {
      if (!response.ok) throw new Error("Erro ao buscar ingressos");
      return response.json();
    })
    .then(data => {
      const ticketsListEl = document.getElementById("tickets-list");
      ticketsListEl.innerHTML = ""; // Limpa qualquer conteúdo anterior

      data.products.forEach(product => {
        const itemEl = document.createElement("div");
        itemEl.classList.add("ticket-item");

        itemEl.innerHTML = `
          <h3>${product.ticketName}</h3>
          <p><strong>Sobre:</strong> ${product.extensions.aboutTicket}</p>
          <p><strong>Preço Inicial:</strong> ${product.startingPrice.usdbrl.symbol} ${product.startingPrice.usdbrl.amount}</p>
        `;
        ticketsListEl.appendChild(itemEl);
      });
    })
    .catch(err => {
      console.error("Erro ao listar ingressos:", err);
      alert("Não foi possível carregar ingressos.");
    });
}

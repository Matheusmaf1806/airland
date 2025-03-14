document.getElementById("search-btn").addEventListener("click", async () => {
  const destination = document.getElementById("destination").value.trim();

  if (!destination) {
    alert("Por favor, insira um destino.");
    return;
  }

  try {
    // Requisição ao seu servidor para pegar os dados dos hotéis
    const response = await fetch(`/hotel-data?destination=${destination}`);
    const data = await response.json();

    // Verifica se não há dados
    if (!data || data.length === 0) {
      document.getElementById("hotels-list").innerHTML = "<p>Nenhum hotel encontrado para este destino.</p>";
      return;
    }

    // Limpa a lista de hotéis antes de adicionar novos resultados
    document.getElementById("hotels-list").innerHTML = "";

    // Cria os itens de hotel dinamicamente
    data.forEach(hotel => {
      const hotelElement = document.createElement("div");
      hotelElement.classList.add("hotel-item");
      hotelElement.innerHTML = `
        <h3>${hotel.name}</h3>
        <p>${hotel.description}</p>
      `;
      document.getElementById("hotels-list").appendChild(hotelElement);
    });
  } catch (error) {
    console.error("Erro ao buscar hotéis:", error);
    document.getElementById("hotels-list").innerHTML = "<p>Erro ao carregar os dados. Tente novamente mais tarde.</p>";
  }
});

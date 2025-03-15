document.addEventListener("DOMContentLoaded", async function() {
  const parkListContainer = document.getElementById("park-list");

  try {
    const response = await fetch("/api/ticketsgenie/parks");
    if (!response.ok) throw new Error("Erro ao buscar parques");

    const data = await response.json();
    
    data.parks.forEach(park => {
      const parkItem = document.createElement("div");
      parkItem.classList.add("park-item");

      parkItem.innerHTML = `
        <img src="${park.images.thumbnail}" alt="${park.name}">
        <h3>${park.name}</h3>
        <p>${park.location}</p>
      `;

      // Adiciona evento de clique para abrir os detalhes do parque
      parkItem.addEventListener("click", () => {
        window.location.href = `/park-details.html?id=${park.code}`;
      });

      parkListContainer.appendChild(parkItem);
    });
  } catch (error) {
    console.error("Erro ao carregar parques:", error);
    parkListContainer.innerHTML = "<p>Erro ao carregar parques. Tente novamente mais tarde.</p>";
  }
});

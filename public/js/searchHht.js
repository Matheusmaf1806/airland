// Função para buscar os hotéis com base no destino e nas datas
async function fetchHotelData(destination) {
    try {
        const response = await fetch("/proxy-hotelbeds", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ destination }),
        });

        // Verifica se a resposta é JSON válida
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Erro desconhecido na requisição");
        }

        displayHotels(result);
    } catch (error) {
        console.error("Erro ao buscar hotéis:", error);
        document.getElementById("hotels-list").innerHTML = `<p style="color: red;">Erro: ${error.message}</p>`;
    }
}

// Função para exibir os hotéis no front-end
function displayHotels(hotelsData) {
    const hotelsList = document.getElementById("hotels-list");
    hotelsList.innerHTML = ""; // Limpa a lista antes de adicionar novos hotéis

    // Verifica se há hotéis retornados
    if (hotelsData && hotelsData.hotels && hotelsData.hotels.length > 0) {
        hotelsData.hotels.forEach((hotel) => {
            const hotelItem = document.createElement("div");
            hotelItem.className = "hotel-item";
            hotelItem.innerHTML = `
                <h3>${hotel.name}</h3>
                <p><strong>Categoria:</strong> ${hotel.categoryName || "Não informado"}</p>
                <p><strong>Localização:</strong> ${hotel.destinationName || "Localização não disponível"}</p>
                <p><strong>Preço mínimo:</strong> ${hotel.minRate ? `${hotel.minRate} ${hotel.currency}` : "Não disponível"}</p>
                <button onclick="alert('Reservado: ${hotel.name}')">Reservar</button>
            `;
            hotelsList.appendChild(hotelItem);
        });
    } else {
        hotelsList.innerHTML = "<p style='color: gray;'>Nenhum hotel encontrado para este destino.</p>";
    }
}

// Adiciona evento ao botão de busca quando a página estiver carregada
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("search-btn").addEventListener("click", function () {
        const destination = document.getElementById("destination").value.trim().toUpperCase() || "MCO"; // Converte para maiúsculas
        fetchHotelData(destination);
    });
});

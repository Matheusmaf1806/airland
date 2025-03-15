// 🔹 Certifique-se de que o script CryptoJS está carregado corretamente
async function loadCryptoJS() {
    if (typeof CryptoJS === "undefined") {
        await import("https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js");
    }
}

// 🔹 Função para buscar os hotéis com base no destino e nas datas
async function fetchHotelData(destination) {
    try {
        const response = await fetch("/proxy-hotelbeds", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ destination }),
        });

        const result = await response.json();

        console.log("📢 Dados recebidos da API:", result); // Log para depuração

        // 🔹 Verifica se os hotéis estão dentro do objeto "hotels.hotels"
        const hotelsArray = result.hotels?.hotels; // Usa `?.` para evitar erro se for `undefined`

        if (!hotelsArray || hotelsArray.length === 0) {
            throw new Error("Nenhum hotel encontrado para este destino.");
        }

        displayHotels(hotelsArray);
    } catch (error) {
        console.error("❌ Erro ao buscar hotéis:", error);
        document.getElementById("hotels-list").innerHTML = `<p style="color: red;">Erro: ${error.message}</p>`;
    }
}

// 🔹 Função para exibir os hotéis no frontend
function displayHotels(hotels) {
    const hotelsList = document.getElementById("hotels-list");
    hotelsList.innerHTML = ""; // Limpa a lista antes de adicionar novos hotéis

    hotels.forEach((hotel) => {
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
}

// 🔹 Adiciona evento ao botão de busca quando a página estiver carregada
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("search-btn").addEventListener("click", function () {
        const destination = document.getElementById("destination").value.trim().toUpperCase() || "MCO"; // Converte para maiúsculas
        fetchHotelData(destination);
    });
});

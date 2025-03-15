// Função para buscar a lista de parques via proxy
function listarParques() {
  fetch("/api/ticketsgenie/parks")
    .then(response => {
      if (!response.ok) throw new Error("Erro ao buscar parques");
      return response.json();
    })
    .then(result => {
      const parksList = document.getElementById('park-list'); // Corrigido o ID
      parksList.innerHTML = '';

      result.parks.forEach(park => {
        const parkElement = document.createElement('div');
        parkElement.classList.add('park-item');
        parkElement.innerHTML = `
          <h3>${park.name}</h3>
          <p>${park.description}</p>
          <img src="${park.images.thumbnail}" alt="${park.name}" />
          <button onclick="mostrarDetalhesParque('${park.code}')">Ver Detalhes</button>
        `;
        parksList.appendChild(parkElement);
      });
    })
    .catch(error => console.error("Erro ao buscar parques:", error));
}

// Função para buscar os detalhes do parque selecionado
function mostrarDetalhesParque(parkCode) {
  fetch(`/api/ticketsgenie/parks/${parkCode}`)
    .then(response => {
      if (!response.ok) throw new Error("Erro ao buscar detalhes do parque");
      return response.json();
    })
    .then(result => {
      const parkDetails = document.getElementById('park-details');
      parkDetails.innerHTML = `
        <h2>${result.name}</h2>
        <img src="${result.images.cover}" alt="${result.name}" />
        <p>${result.description}</p>
        <p><strong>Localização:</strong> ${result.location}</p>
        <p><strong>Atrações:</strong> ${result.attraction}</p>
        <button onclick="listarProdutosDoParque('${parkCode}')">Ver Produtos</button>
      `;
    })
    .catch(error => console.error("Erro ao buscar detalhes do parque:", error));
}

// Função para listar os produtos de um parque
function listarProdutosDoParque(parkCode) {
  fetch(`/api/ticketsgenie/parks/${parkCode}/products`)
    .then(response => {
      if (!response.ok) throw new Error("Erro ao buscar produtos");
      return response.json();
    })
    .then(result => {
      const productsList = document.getElementById('products-list');
      productsList.innerHTML = '';

      result.products.forEach(product => {
        const productElement = document.createElement('div');
        productElement.classList.add('product-item');
        productElement.innerHTML = `
          <h3>${product.ticketName}</h3>
          <p>${product.extensions.aboutTicket}</p>
          <img src="${product.extensions.ticketBanner}" alt="${product.ticketName}" />
          <p>Preço: ${product.startingPrice.usdbrl.symbol}${product.startingPrice.usdbrl.amount}</p>
        `;
        productsList.appendChild(productElement);
      });
    })
    .catch(error => console.error("Erro ao buscar produtos:", error));
}

// Carregar a lista de parques assim que a página carregar
window.onload = listarParques;

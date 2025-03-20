// cartManager.js

class CartManager {
  constructor(cartContainerSelector) {
    // Inicializa a classe com o seletor do container do carrinho
    this.cartContainer = document.querySelector(cartContainerSelector);
    if (!this.cartContainer) {
      console.error("Elemento do carrinho não encontrado!");
    }
  }

  // Método para esconder o carrinho
  closeCart() {
    if (this.cartContainer) {
      this.cartContainer.classList.add('hidden'); // Adiciona a classe 'hidden' para esconder o carrinho
    }
  }

  // Método para exibir o carrinho
  openCart() {
    if (this.cartContainer) {
      this.cartContainer.classList.remove('hidden'); // Remove a classe 'hidden' para exibir o carrinho
    }
  }

  // Método para alternar a visibilidade do carrinho
  toggleCart() {
    if (this.cartContainer) {
      this.cartContainer.classList.toggle('hidden'); // Alterna a visibilidade
    }
  }

  // Método para adicionar um item ao carrinho
  addItem(item) {
    // Adiciona o item ao carrinho, você pode personalizar o que adicionar
    console.log('Item adicionado ao carrinho:', item);
  }

  // Método para remover um item do carrinho
  removeItem(itemId) {
    console.log('Item removido do carrinho:', itemId);
  }
}

// Exemplo de uso:
const cartManager = new CartManager('.cart-container');

// Usar a instância para chamar os métodos
document.getElementById('closeCartBtn').addEventListener('click', () => {
  cartManager.closeCart();
});

document.getElementById('openCartBtn').addEventListener('click', () => {
  cartManager.openCart();
});

document.getElementById('toggleCartBtn').addEventListener('click', () => {
  cartManager.toggleCart();
});

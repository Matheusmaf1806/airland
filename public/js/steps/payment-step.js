/* payment-step.js - Define o HTML da etapa de Pagamento */
export function renderPaymentStep() {
  return `
    <div class="step-content" data-step="3">
      <div class="card-style-1">
        <h2>Métodos de Pagamento</h2>
        <p>
          Insira os dados do seu cartão para finalizar a reserva.
        </p>
        <div class="fields-grid-2cols">
          <div class="form-field">
            <label>Número do Cartão</label>
            <input type="text" id="payment-card-number" placeholder="4111 1111 1111 1111" />
          </div>
          <div class="form-field">
            <label>Validade (MM/AA)</label>
            <input type="text" id="payment-expiry" placeholder="10/28" />
          </div>
        </div>
        <div class="fields-grid-2cols">
          <div class="form-field">
            <label>CVV</label>
            <input type="text" id="payment-cvv" placeholder="123" />
          </div>
          <div class="form-field">
            <label>Nº de Parcelas</label>
            <select id="installmentsCount">
              <option value="1">1x sem juros</option>
              <option value="2">2x</option>
              <option value="3">3x</option>
              <option value="4">4x</option>
              <option value="5">5x</option>
              <option value="6">6x</option>
              <option value="7">7x</option>
              <option value="8">8x</option>
              <option value="9">9x</option>
              <option value="10">10x</option>
              <option value="11">11x</option>
              <option value="12">12x</option>
            </select>
          </div>
        </div>
        <div class="navigation">
          <button class="btn-save-passenger" id="backToStep2">Voltar</button>
          <button class="btn-save-passenger" id="finishBtn">Finalizar Pagamento</button>
        </div>
      </div>
    </div>
  `;
}

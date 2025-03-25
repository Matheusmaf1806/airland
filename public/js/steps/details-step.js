/* js/steps/details-step.js */
export function renderDetailsStep() {
  return `
    <div class="step-content" data-step="2">
      <div class="card-style-1">
        <h2>Seguro Viagem em Poucos Cliques</h2>
        <p>
          Evite riscos: o seguro do cartão exige pagamento adiantado com reembolso incerto.
          Garanta já seu seguro e deixe os especialistas cuidarem de tudo.
        </p>
        <div class="vip-card">
          <img src="https://www.escolhaviajar.com/wp-content/uploads/2019/11/Seguro-viagem-2.jpg" alt="Seguro Viagem" />
          <div class="vip-info">
            <span class="badge">Cobertura robusta para U$60.000 - Intermac</span>
            <span class="title">
              Cobertura de até U$ 60 mil para despesas médicas, hospitalares, atraso de voo, entre outros.
            </span>
            <span class="price">R$ 119,00 /pessoa</span>
            <div class="actions">
              <button>Adicionar</button>
              <a href="#">Detalhes</a>
            </div>
          </div>
        </div>
        <div class="vip-card">
          <img src="https://seguromaisbarato.com/wp-content/uploads/2024/05/Seguro-Viagem-para-os-EUA-Por-que-e-Essencial.jpg" alt="Seguro Viagem" />
          <div class="vip-info">
            <span class="badge">Cobertura robusta para U$60.000 - Intermac</span>
            <span class="title">
              Cobertura de até U$ 60 mil para despesas médicas, hospitalares, atraso de voo, entre outros.
            </span>
            <span class="price">R$ 119,00 /pessoa</span>
            <div class="actions">
              <button>Adicionar</button>
              <a href="#">Detalhes</a>
            </div>
          </div>
        </div>
        <div class="navigation">
          <button class="btn-save-passenger" id="backToStep1">Voltar</button>
          <button class="btn-save-passenger" id="toStep3">Próximo</button>
        </div>
      </div>
    </div>
  `;
}

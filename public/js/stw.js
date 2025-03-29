// stw.js – Módulo para o Step 2: Detalhes Adicionais (Seguro de Viagem)
const step2Container = document.getElementById("step2Container");

step2Container.innerHTML = `
  <div class="card-style-1">
    <h2>Detalhes Adicionais</h2>
    <p>Escolha abaixo seu seguro de viagem ou siga sem proteção:</p>
    <div style="margin-top:1rem; display:flex; flex-wrap:wrap; gap:1rem;">
      <!-- Opção 1: Sem Seguro Viagem -->
      <div style="flex:1; min-width:250px; border:1px solid #ddd; border-radius:8px; padding:1rem; position:relative;">
        <span style="position:absolute; top:10px; right:10px; background:#ff1744; color:#fff; padding:0.3rem 0.6rem; border-radius:4px; font-size:0.75rem;">
          Opção não recomendada
        </span>
        <h3>Sem Seguro Viagem</h3>
        <p style="font-size:0.85rem; color:#555; line-height:1.3;">
          Vai viajar sem proteção?<br/>
          Imprevistos podem acontecer, e alguns países exigem seguro viagem na entrada. Garanta o seu antes de embarcar!
        </p>
        <p style="font-size:1rem; font-weight:700; color:#00c853;">R$ 0</p>
        <button style="background:#007aff; color:#fff; border:none; border-radius:4px; padding:0.5rem 1rem; width:100%; cursor:pointer;">
          Selecionar
        </button>
      </div>

      <!-- Opção 2: Intermac 30K -->
      <div style="flex:1; min-width:250px; border:1px solid #ddd; border-radius:8px; padding:1rem; position:relative;">
        <img src="https://www.intermacseguros.com/bra/includes/logo-intermac-25-anos.png" alt="Intermac" style="width:120px; margin-bottom:0.5rem;" />
        <h3>Intermac 30K</h3>
        <p style="font-size:0.85rem; color:#555; line-height:1.3;">
          🗓️ 16 abr. 2025 - 18 abr. 2025<br/>
          +R$ 112,81
        </p>
        <p style="font-size:0.8rem; color:#333;">
          ✅ Cancelamento grátis<br/>
          ✅ Despesas hospitalares de até USD$ 30.000<br/>
          ✅ Despesas farmacêuticas de até USD$ 500
        </p>
        <div style="margin-top:0.5rem;">
          <a href="#" id="verMais30k">Ver mais</a> | 
          <a href="#" id="verPoliticas30k">Ver políticas</a>
        </div>
        <button style="background:#007aff; color:#fff; border:none; border-radius:4px; padding:0.5rem 1rem; width:100%; margin-top:1rem; cursor:pointer;" id="select30kBtn">
          Selecionar
        </button>
      </div>

      <!-- Opção 3: Intermac 80K -->
      <div style="flex:1; min-width:250px; border:1px solid #ddd; border-radius:8px; padding:1rem; position:relative;">
        <img src="https://www.intermacseguros.com/bra/includes/logo-intermac-25-anos.png" alt="Intermac" style="width:120px; margin-bottom:0.5rem;" />
        <h3>Intermac 80K</h3>
        <p style="font-size:0.85rem; color:#555; line-height:1.3;">
          🗓️ 16 abr. 2025 - 18 abr. 2025<br/>
          +R$ 212,02
        </p>
        <p style="font-size:0.8rem; color:#333;">
          ✅ Cancelamento grátis<br/>
          ✅ Despesas hospitalares de até USD$ 80.000<br/>
          ✅ Despesas farmacêuticas de até USD$ 2.000<br/>
          ✅ Acesso à Sala Vip em caso de atraso do voo
        </p>
        <div style="margin-top:0.5rem;">
          <a href="#" id="verMais80k">Ver mais</a> | 
          <a href="#" id="verPoliticas80k">Ver políticas</a>
        </div>
        <button style="background:#007aff; color:#fff; border:none; border-radius:4px; padding:0.5rem 1rem; width:100%; margin-top:1rem; cursor:pointer;" id="select80kBtn">
          Selecionar
        </button>
      </div>
    </div>

    <div class="navigation" style="margin-top:1rem; text-align:right;">
      <button class="btn-save-passenger" id="backToStep1">Voltar</button>
      <button class="btn-save-passenger" id="toStep3">Próximo</button>
    </div>
  </div>

  <!-- Modal para Intermac 30K -->
  <div id="modal30k" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:9999;">
    <div style="background:#fff; max-width:600px; margin:5% auto; padding:20px; border-radius:8px; position:relative;">
      <span id="closeModal30k" style="position:absolute; right:15px; top:10px; font-size:24px; cursor:pointer;">&times;</span>
      <h3>Coberturas Intermac 30K</h3>
      <p style="font-size:0.85rem; margin-bottom:1rem; color:#555;">Confira as coberturas e os valores:</p>
      <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
        <thead>
          <tr style="background:#f9f9f9;">
            <th style="border:1px solid #ddd; padding:5px;">Coberturas</th>
            <th style="border:1px solid #ddd; padding:5px;">Valores</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="border:1px solid #ddd; padding:5px;">Despesas Emergenciais Médicas e Hospitalares</td><td style="border:1px solid #ddd; padding:5px;">$30,000.00</td></tr>
          <tr><td style="border:1px solid #ddd; padding:5px;">Despesas Emergenciais Odontológicas</td><td style="border:1px solid #ddd; padding:5px;">$200.00</td></tr>
          <tr><td style="border:1px solid #ddd; padding:5px;">Proteção COVID-19 Integral</td><td style="border:1px solid #ddd; padding:5px;">INCLUSO NO DMH</td></tr>
          <tr><td style="border:1px solid #ddd; padding:5px;">Despesas Farmacêuticas</td><td style="border:1px solid #ddd; padding:5px;">$150.00</td></tr>
          <!-- Outras coberturas conforme solicitado... -->
          <tr><td style="border:1px solid #ddd; padding:5px;">Invalidez Permanente Total ou Parcial</td><td style="border:1px solid #ddd; padding:5px;">$7,500.00</td></tr>
          <tr><td style="border:1px solid #ddd; padding:5px;">Morte Acidental</td><td style="border:1px solid #ddd; padding:5px;">$7,500.00</td></tr>
          <tr><td style="border:1px solid #ddd; padding:5px;">Interrupção de Viagem</td><td style="border:1px solid #ddd; padding:5px;">N/A</td></tr>
          <tr><td style="border:1px solid #ddd; padding:5px;">Atraso de Bagagem (12h)</td><td style="border:1px solid #ddd; padding:5px;">$100.00</td></tr>
          <tr><td style="border:1px solid #ddd; padding:5px;">Atraso de Vôo</td><td style="border:1px solid #ddd; padding:5px;">$100.00</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Modal para Intermac 80K -->
  <div id="modal80k" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:9999;">
    <div style="background:#fff; max-width:600px; margin:5% auto; padding:20px; border-radius:8px; position:relative;">
      <span id="closeModal80k" style="position:absolute; right:15px; top:10px; font-size:24px; cursor:pointer;">&times;</span>
      <h3>Coberturas Intermac 80K</h3>
      <p style="font-size:0.85rem; margin-bottom:1rem; color:#555;">Confira as coberturas e os valores:</p>
      <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
        <thead>
          <tr style="background:#f9f9f9;">
            <th style="border:1px solid #ddd; padding:5px;">Coberturas</th>
            <th style="border:1px solid #ddd; padding:5px;">Valores</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="border:1px solid #ddd; padding:5px;">Despesas Emergenciais Médicas e Hospitalares</td><td style="border:1px solid #ddd; padding:5px;">$80,000.00</td></tr>
          <tr><td style="border:1px solid #ddd; padding:5px;">Despesas Emergenciais Odontológicas</td><td style="border:1px solid #ddd; padding:5px;">$800.00</td></tr>
          <tr><td style="border:1px solid #ddd; padding:5px;">Proteção COVID-19 Integral</td><td style="border:1px solid #ddd; padding:5px;">INCLUSO NO DMH</td></tr>
          <tr><td style="border:1px solid #ddd; padding:5px;">Despesas Farmacêuticas</td><td style="border:1px solid #ddd; padding:5px;">$800.00</td></tr>
          <!-- Outras coberturas conforme solicitado... -->
          <tr><td style="border:1px solid #ddd; padding:5px;">Invalidez Permanente Total ou Parcial</td><td style="border:1px solid #ddd; padding:5px;">$17,500.00</td></tr>
          <tr><td style="border:1px solid #ddd; padding:5px;">Morte Acidental</td><td style="border:1px solid #ddd; padding:5px;">$17,500.00</td></tr>
          <tr><td style="border:1px solid #ddd; padding:5px;">Interrupção de Viagem</td><td style="border:1px solid #ddd; padding:5px;">$750.00</td></tr>
          <tr><td style="border:1px solid #ddd; padding:5px;">Atraso de Bagagem (12h)</td><td style="border:1px solid #ddd; padding:5px;">$250.00</td></tr>
          <tr><td style="border:1px solid #ddd; padding:5px;">Atraso de Vôo</td><td style="border:1px solid #ddd; padding:5px;">$250.00</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <script>
    // -------------- STEPS E NAVEGAÇÃO --------------
    const stepContents = document.querySelectorAll(".step-content");
    const stepButtons = document.querySelectorAll(".steps-menu .step");

    function showStep(num) {
      stepContents.forEach(s => {
        s.classList.remove("active");
        if (s.dataset.step == num) {
          s.classList.add("active");
        }
      });
      stepButtons.forEach(b => {
        const bStep = parseInt(b.dataset.step, 10);
        b.classList.remove("active", "disabled");
        if (bStep == num) {
          b.classList.add("active");
        }
        if (bStep > num) {
          b.classList.add("disabled");
        }
      });
    }

    const toStep2Btn = document.getElementById("toStep2");
    toStep2Btn.addEventListener("click", () => {
      // (Validação dos campos obrigatórios do Step 1 já é feita pelo browser via "required")
      showStep(2);
    });

    const backToStep2Btn = document.getElementById("backToStep2");
    backToStep2Btn?.addEventListener("click", () => showStep(2));

    const goToStep4Btn = document.getElementById("goToStep4");
    goToStep4Btn?.addEventListener("click", () => showStep(4));

    // -------------- LÓGICA DO CARRINHO --------------
    let cartItems = [];
    const cartEl = document.getElementById("shoppingCart");
    if (cartEl && cartEl.items && cartEl.items.length > 0) {
      cartItems = cartEl.items;
    } else {
      const savedCart = localStorage.getItem("cartItems");
      if (savedCart) {
        cartItems = JSON.parse(savedCart);
      } else {
        cartItems = [
          { hotelName: "Hotel Exemplo A", adults: 2, children: 1, basePriceAdult: 100 },
          { hotelName: "Hotel Exemplo B", adults: 3, children: 0, basePriceAdult: 150 }
        ];
      }
    }

    function updateCheckoutCart(items) {
      const container = document.getElementById("cartItemsList");
      let subtotal = 0;
      let html = "";
      items.forEach(item => {
        let price = item.basePriceAdult || 80;
        subtotal += price;
        html += `
          <div class="reserva-item">
            <div class="reserva-left">
              <span class="categoria">${item.type || "Hospedagem"}</span>
              <span class="nome">${item.hotelName || "Hotel Desconhecido"}</span>
              <div class="reserva-details">
                <p>Check-in: ${item.checkIn || "--/--/----"}</p>
                <p>Check-out: ${item.checkOut || "--/--/----"}</p>
                <p>Quartos: ${item.rooms || 1}</p>
                <p>Adultos: ${item.adults || 1} | Crianças: ${item.children || 0}</p>
              </div>
            </div>
            <div class="reserva-preco">
              R$ ${price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
          </div>
        `;
      });
      container.innerHTML = html;
      document.getElementById("subtotalValue").textContent = "R$ " + subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
      document.getElementById("discountValue").textContent = "- R$ 0,00";
      document.getElementById("totalValue").textContent = "R$ " + subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    }
    updateCheckoutCart(cartItems);

    // -------------- CEP, CPF, RG --------------
    document.getElementById("cep").addEventListener("blur", function() {
      let cep = this.value.replace(/\D/g, "");
      if (cep.length === 8) {
        fetch(`https://viacep.com.br/ws/${cep}/json/`)
          .then(resp => resp.json())
          .then(data => {
            if (!data.erro) {
              document.getElementById("address").value = data.logradouro || "";
              document.getElementById("city").value = data.localidade || "";
              document.getElementById("state").value = data.uf || "";
            }
          })
          .catch(err => console.error("Erro CEP:", err));
      }
    });

    // Máscara CPF
    document.getElementById("cpf").addEventListener("input", (e) => {
      let val = e.target.value.replace(/\D/g, "");
      if(val.length > 3) val = val.replace(/^(\d{3})(\d)/, "$1.$2");
      if(val.length > 6) val = val.replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3");
      if(val.length > 9) val = val.replace(/(\d{3})\.(\d{3})\.(\d{3})(\d{1,2}).*/, "$1.$2.$3-$4");
      e.target.value = val;
    });

    // Máscara RG
    document.getElementById("rg").addEventListener("input", (e) => {
      let val = e.target.value.replace(/\D/g, "");
      if(val.length > 2) val = val.replace(/^(\d{2})(\d)/, "$1.$2");
      if(val.length > 5) val = val.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
      if(val.length > 7) val = val.replace(/(\d{2})\.(\d{3})\.(\d{3})(\d{1}).*/, "$1.$2.$3-$4");
      e.target.value = val;
    });
  </script>
</body>
</html>

/* js/steps/passenger-step.js */
export function renderPassengerStep() {
  return `
    <div class="step-content" data-step="1">
      <div class="card-style-1">
        <div class="traveler-form-header">
          <h2>Quem vai viajar?</h2>
          <div class="actions">
            <a href="#">Economize tempo fazendo Login</a>
          </div>
        </div>
        <div class="passenger-box">
          <!-- Linha 1: Nome | Sobrenome -->
          <div class="fields-grid-2cols">
            <div class="form-field">
              <label>Nome</label>
              <input type="text" id="firstName" placeholder="Nome" />
            </div>
            <div class="form-field">
              <label>Sobrenome</label>
              <input type="text" id="lastName" placeholder="Sobrenome" />
            </div>
          </div>
          <!-- Linha 2: Celular | E-mail -->
          <div class="fields-grid-2cols">
            <div class="form-field">
              <label>Celular</label>
              <input type="text" id="celular" placeholder="(XX) 99999-9999" />
            </div>
            <div class="form-field">
              <label>E-mail</label>
              <input type="email" placeholder="seuemail@exemplo.com" />
            </div>
          </div>
          <!-- Linha 3: Senha | Repetir Senha -->
          <div class="fields-grid-2cols">
            <div class="form-field">
              <label>Senha</label>
              <input type="password" placeholder="********" />
            </div>
            <div class="form-field">
              <label>Repetir Senha</label>
              <input type="password" placeholder="********" />
            </div>
          </div>
          <!-- Linha 4: CPF | RG | Data de Nascimento -->
          <div class="fields-grid-3cols">
            <div class="form-field">
              <label>CPF</label>
              <input type="text" id="cpf" placeholder="123.456.789-00" />
            </div>
            <div class="form-field">
              <label>RG</label>
              <input type="text" id="rg" placeholder="12.345.678-9" />
            </div>
            <div class="form-field">
              <label>Data de Nascimento</label>
              <input type="date" />
            </div>
          </div>
          <!-- Linha 5: CEP | Estado | Cidade -->
          <div class="fields-grid-3cols">
            <div class="form-field">
              <label>CEP</label>
              <input type="text" id="cep" placeholder="12345-678" />
            </div>
            <div class="form-field">
              <label>Estado</label>
              <input type="text" id="state" placeholder="Ex: SP" />
            </div>
            <div class="form-field">
              <label>Cidade</label>
              <input type="text" id="city" placeholder="São Paulo" />
            </div>
          </div>
          <!-- Linha 6: Endereço | Número -->
          <div class="fields-grid-2cols">
            <div class="form-field">
              <label>Endereço</label>
              <input type="text" id="address" placeholder="Rua, Avenida..." />
            </div>
            <div class="form-field">
              <label>Número</label>
              <input type="text" id="number" placeholder="123" />
            </div>
          </div>
          <p class="form-note">
            * Insira o nome exatamente como aparece em seus documentos para o check-in.
          </p>
        </div>
        <div class="navigation">
          <button class="btn-save-passenger" id="toStep2">Próximo</button>
        </div>
      </div>
    </div>
  `;
}

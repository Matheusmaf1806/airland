  async function buscarIngressos() {
    // Obtenha o código do destino a partir do campo hidden
    const destination = document.getElementById('destinoIngressoCode')?.value ||
                        document.getElementById('destinoIngresso')?.value ||
                        '';
    const date = document.getElementById('dataIngresso')?.value || '';

    if (!destination) {
      alert('Selecione ou informe um destino válido.');
      return;
    }

    // Atualize uma área da página para indicar que a busca está sendo realizada
    const statusEl = document.getElementById('status');
    if (statusEl) {
      statusEl.textContent = 'Buscando ingressos...';
      statusEl.style.display = 'block';
    }

    // Monte a query: supondo que a data de evento no banco esteja no formato YYYY-MM-DD,
    // você pode ter que converter o valor do input se ele estiver em outro formato.
    // Para este exemplo, vamos assumir que o usuário já informa no formato correto.
    const query = `?destination=${encodeURIComponent(destination)}&date=${encodeURIComponent(date)}`;
    const url = `/api/tickets${query}`;
    console.log('Buscando ingressos na URL:', url);

    try {
      const resp = await fetch(url);
      if (!resp.ok) {
        throw new Error('Erro na consulta de ingressos: ' + resp.status);
      }
      const tickets = await resp.json();
      // Exiba os ingressos na página; por exemplo, crie cards para cada ingresso.
      exibirIngressos(tickets);
      if (statusEl) statusEl.style.display = 'none';
    } catch (e) {
      console.error(e);
      if (statusEl) statusEl.textContent = 'Erro ao buscar ingressos.';
    }
  }

  function exibirIngressos(tickets) {
    const container = document.getElementById('ingressosList'); // Certifique-se que exista este container no HTML
    container.innerHTML = '';
    if (!tickets || !tickets.length) {
      container.innerHTML = '<p>Nenhum ingresso encontrado.</p>';
      return;
    }
    tickets.forEach(ticket => {
      // Crie um card simples para cada ingresso – adapte conforme sua necessidade
      const card = document.createElement('div');
      card.className = 'ticket-card';
      card.innerHTML = `
        <h3>${ticket.event_name}</h3>
        <p>Data: ${ticket.event_date}</p>
        <p>Preço: ${ticket.price ? ticket.price : 'Consultar'}</p>
      `;
      container.appendChild(card);
    });
  }

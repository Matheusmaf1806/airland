  async function buscarIngressos() {
    // Prioriza o valor do campo hidden; se estiver vazio, utiliza o texto digitado (mas o ideal é sempre ter o code)
    const destination = document.getElementById('destinoIngressoCode')?.value ||
                        document.getElementById('destinoIngresso')?.value || '';
    const date = document.getElementById('dataIngresso')?.value || '';
  
    if (!destination) {
      alert('Selecione ou informe um destino válido.');
      return;
    }
  
    const statusEl = document.getElementById('status');
    if (statusEl) {
      statusEl.textContent = 'Buscando ingressos...';
      statusEl.style.display = 'block';
    }
  
    // Monte a query string (supondo que o backend espera "destination" e "date")
    const query = `?destination=${encodeURIComponent(destination)}&date=${encodeURIComponent(date)}`;
    const url = `/api/tickets${query}`;
    console.log('Buscando ingressos na URL:', url);
  
    try {
      const resp = await fetch(url);
      if (!resp.ok) {
        throw new Error('Erro na consulta de ingressos: ' + resp.status);
      }
      const tickets = await resp.json();
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

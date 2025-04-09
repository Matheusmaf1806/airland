// Função para converter "dd/mm/yyyy" para "yyyy-mm-dd"
  function convertDateFormat(dateStr) {
    const [d, m, y] = dateStr.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  async function buscarIngressos() {
    const destination = document.getElementById('destinoIngressoCode')?.value ||
                        document.getElementById('destinoIngresso')?.value || '';
    const dateInput = document.getElementById('dataIngresso')?.value || '';
  
    if (!destination) {
      alert('Selecione ou informe um destino válido.');
      return;
    }
    if (!dateInput) {
      alert('Selecione uma data!');
      return;
    }
  
    function convertDateFormat(dateStr) {
      const [d, m, a] = dateStr.split('/');
      return `${a}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    const dateFormatted = convertDateFormat(dateInput);
  
    const statusEl = document.getElementById('status');
    if (statusEl) {
      statusEl.textContent = 'Buscando ingressos...';
      statusEl.style.display = 'block';
    }
  
    // Aqui montamos a URL com um caminho relativo.
    const query = `?destination=${encodeURIComponent(destination)}&date=${encodeURIComponent(dateFormatted)}`;
    const url = '/api/tickets' + query; // ← Certifique-se de usar "/api/tickets", não a URL completa!
  
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
    const container = document.getElementById('ingressosList');
    container.innerHTML = '';
    if (!tickets || !tickets.length) {
      container.innerHTML = '<p>Nenhum ingresso encontrado.</p>';
      return;
    }
    tickets.forEach(ticket => {
      // Cria um card simples para cada ingresso – adapte conforme necessário
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

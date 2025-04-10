// public/js/tac.js

// Função global para converter "dd/mm/yyyy" para "yyyy-mm-dd"
// Obs.: Se a data já estiver no formato ISO, esta função pode ser ajustada para não alterar
function convertDateFormat(dateStr) {
  if (dateStr.indexOf('/') > -1) {
    const [d, m, y] = dateStr.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return dateStr; // já no formato ISO
}

async function buscarIngressos() {
  // Primeiro, verifica se os parâmetros de URL activityCode e dataIngresso foram fornecidos
  const urlParams = new URLSearchParams(window.location.search);
  const activityCode = urlParams.get('activityCode');
  const dataIngressoParam = urlParams.get('dataIngresso');

  let apiUrl = '/api/tickets';
  let query = '';

  if (activityCode && dataIngressoParam) {
    // Se os parâmetros estiverem na URL, converte a data se necessário
    const formattedDataIngresso = convertDateFormat(dataIngressoParam);
    query = `?activityCode=${encodeURIComponent(activityCode)}&dataIngresso=${encodeURIComponent(formattedDataIngresso)}`;
  } else {
    // Senão, utiliza os valores dos campos do formulário
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

    // Converte a data para o formato esperado
    const dateFormatted = convertDateFormat(dateInput);
    query = `?destination=${encodeURIComponent(destination)}&date=${encodeURIComponent(dateFormatted)}`;
  }
  
  // Monta a URL final para a busca
  const urlFinal = apiUrl + query;

  const statusEl = document.getElementById('status');
  if (statusEl) {
    statusEl.textContent = 'Buscando ingressos...';
    statusEl.style.display = 'block';
  }
  
  try {
    const resp = await fetch(urlFinal);
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
    // Cria um card simples para cada ingresso – adapta os campos conforme necessário
    const card = document.createElement('div');
    card.className = 'ticket-card';
    card.setAttribute('data-ticket-id', ticket.ticket_id || ticket.code || '');
    card.innerHTML = `
      <h3>${ticket.event_name || ticket.nome}</h3>
      <p>Data: ${ticket.event_date || ticket.date}</p>
      <p>Preço: ${ticket.price ? ticket.price : 'Consultar'}</p>
      <button class="btn-details-ingresso">Ver detalhes</button>
    `;
    container.appendChild(card);
  });
}

// tacr.js - Versão anterior

// Função para formatar preços com a moeda apropriada
function formatPrice(value, currency) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency || 'EUR'
  }).format(value);
}

// Função para exibir os cards de atividades no container especificado (default: "activitiesGrid")
function exibirAtividades(activities, containerId = 'activitiesGrid') {
  const container = document.getElementById(containerId);
  container.innerHTML = ''; // Limpa o container

  if (!activities || activities.length === 0) {
    container.innerHTML = '<p>Nenhuma atividade encontrada.</p>';
    return;
  }

  activities.forEach(activity => {
    // Código de extração da imagem original: utiliza apenas o primeiro item do array activity.media
    let imageUrl = 'https://via.placeholder.com/300x180?text=No+Image';
    if (activity.media && activity.media.length > 0) {
      const firstMedia = activity.media[0];
      if (firstMedia.urls && firstMedia.urls.length > 0) {
        // Tenta encontrar uma URL com sizeType 'XLARGE'; se não encontrar, usa a primeira
        const urlObj = firstMedia.urls.find(u => u.sizeType === 'XLARGE') || firstMedia.urls[0];
        if (urlObj && urlObj.resource) {
          imageUrl = urlObj.resource;
        }
      }
    }

    // Trata a descrição, removendo tags HTML e limitando a 100 caracteres
    let descText = activity.descricao ? activity.descricao.replace(/<[^>]*>/g, '') : '';
    if (descText.length > 100) {
      descText = descText.substring(0, 100) + '...';
    }

    // Define o preço a ser exibido – tenta usar top_level_adult_price, ou outros campos se necessário
    let priceToShow = activity.top_level_adult_price;
    if (!priceToShow || priceToShow <= 0) {
      priceToShow = activity.amount_adult || activity.box_office_amount || 0;
    }

    // Cria o elemento do card
    const card = document.createElement('div');
    card.className = 'activity-card';

    // Cria e insere a imagem do card
    const img = document.createElement('img');
    img.className = 'activity-card-img';
    img.src = imageUrl;
    img.alt = activity.nome;
    card.appendChild(img);

    // Cria o corpo do card (área de conteúdo)
    const body = document.createElement('div');
    body.className = 'activity-body';

    // Título
    const title = document.createElement('h3');
    title.className = 'activity-title';
    title.textContent = activity.nome;
    body.appendChild(title);

    // Data
    const dateEl = document.createElement('p');
    dateEl.className = 'activity-date';
    dateEl.textContent = `Data: ${activity.date}`;
    body.appendChild(dateEl);

    // Área de preços
    const priceEl = document.createElement('div');
    priceEl.className = 'activity-prices';
    const priceStarting = document.createElement('span');
    priceStarting.className = 'price-starting';
    priceStarting.textContent = `A partir de ${formatPrice(priceToShow, activity.currency)}`;
    priceEl.appendChild(priceStarting);
    const installments = document.createElement('span');
    installments.className = 'installments';
    installments.textContent = ' ou 10x sem juros';
    priceEl.appendChild(installments);
    body.appendChild(priceEl);

    // Descrição resumida
    const descEl = document.createElement('p');
    descEl.className = 'activity-description';
    descEl.textContent = descText;
    body.appendChild(descEl);

    // Botão "Ver detalhes"
    const btn = document.createElement('button');
    btn.className = 'btn-see-more';
    btn.textContent = 'Ver detalhes';
    btn.onclick = function() {
      verDetalhesActivity(activity.activity_code);
    };
    body.appendChild(btn);

    card.appendChild(body);
    container.appendChild(card);
  });
}

// Função simples para tratar o botão "Ver detalhes"
function verDetalhesActivity(activityCode) {
  alert(`Detalhes da atividade: ${activityCode}`);
  // Exemplo: window.location.href = `/detalhes.html?code=${activityCode}`;
}

// Função para converter um ingresso (ticket) para o formato de "atividade"
function convertTicketToActivity(ticket) {
  return {
    nome: ticket.event_name || ticket.nome || 'Evento Sem Nome',
    date: ticket.event_date || ticket.date || '',
    currency: ticket.currency || 'BRL',
    top_level_adult_price: ticket.price || 0,
    media: [{
      urls: [{
        sizeType: 'XLARGE',
        resource: ticket.image_url || 'https://via.placeholder.com/300x180?text=No+Image'
      }]
    }],
    descricao: ticket.description || ticket.descricao || '',
    activity_code: ticket.ticket_id || ticket.code || ticket.event_code || ''
  };
}

// Função para exibir ingressos utilizando o mesmo layout de cards das atividades.
// Converte os ingressos para o formato esperado e renderiza no container "ingressosList".
function exibirIngressos(tickets) {
  if (!tickets || tickets.length === 0) {
    document.getElementById('ingressosList').innerHTML = '<p>Nenhum ingresso encontrado.</p>';
    return;
  }
  const activities = tickets.map(convertTicketToActivity);
  exibirAtividades(activities, 'ingressosList');
}

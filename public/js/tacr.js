// tacr.js - Versão ajustada

// Formata os preços sempre em Reais (BRL) – ex.: R$ 1.111,11
function formatPrice(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

// Deduplica as atividades com base no nome (case insensitive),
// escolhendo a com o menor top_level_adult_price em caso de duplicatas
function deduplicateActivities(activities) {
  const uniqueMap = {};
  activities.forEach(activity => {
    const key = activity.nome.toLowerCase();
    if (!uniqueMap[key]) {
      uniqueMap[key] = activity;
    } else {
      if (activity.top_level_adult_price < uniqueMap[key].top_level_adult_price) {
        uniqueMap[key] = activity;
      }
    }
  });
  return Object.values(uniqueMap);
}

// Exibe os cards no container especificado (default: "activitiesGrid") e
// configura o layout para 3 itens por fileira.
function exibirAtividades(activities, containerId = 'activitiesGrid') {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container com id "${containerId}" não foi encontrado.`);
    return;
  }

  // Configura o layout em grid: 3 colunas com gap de 20px
  container.style.display = 'grid';
  container.style.gridTemplateColumns = 'repeat(3, 1fr)';
  container.style.gap = '20px';
  container.innerHTML = ''; // Limpa o container

  if (!activities || activities.length === 0) {
    container.innerHTML = '<p>Nenhuma atividade encontrada.</p>';
    return;
  }

  activities.forEach(activity => {
    // Obter a imagem – se a atividade possuir mídia, tenta a URL com sizeType "XLARGE"
    let imageUrl = 'https://via.placeholder.com/300x180?text=No+Image';
    if (activity.media && activity.media.length > 0) {
      const firstMedia = activity.media[0];
      if (firstMedia.urls && firstMedia.urls.length > 0) {
        const urlObj = firstMedia.urls.find(u => u.sizeType === 'XLARGE') || firstMedia.urls[0];
        if (urlObj && urlObj.resource) {
          imageUrl = urlObj.resource;
        }
      }
    }

    // Processa a descrição removendo as tags HTML e limitando a 100 caracteres
    let descText = activity.descricao ? activity.descricao.replace(/<[^>]*>/g, '') : '';
    if (descText.length > 100) {
      descText = descText.substring(0, 100) + '...';
    }

    // Define o preço exibido: usa top_level_adult_price; se não existir, usa outros valores como fallback
    let priceToShow = activity.top_level_adult_price;
    if (!priceToShow || priceToShow <= 0) {
      priceToShow = activity.amount_adult || activity.box_office_amount || 0;
    }

    // Cria o card
    const card = document.createElement('div');
    card.className = 'activity-card';

    // Cria a imagem do card
    const img = document.createElement('img');
    img.className = 'activity-card-img';
    img.src = imageUrl;
    img.alt = activity.nome;
    card.appendChild(img);

    // Cria o corpo do card
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
    priceStarting.textContent = `A partir de ${formatPrice(priceToShow)}`;
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

// Função para tratar o clique em "Ver detalhes" – pode ser personalizada conforme necessário.
function verDetalhesActivity(activityCode) {
  alert(`Detalhes da atividade: ${activityCode}`);
  // Exemplo alternativo:
  // window.location.href = `/detalhes.html?code=${activityCode}`;
}

// Converte um ingresso (ticket) para o formato de "atividade" esperado.
// Observação: força a moeda para BRL.
function convertTicketToActivity(ticket) {
  return {
    nome: ticket.event_name || ticket.nome || 'Evento Sem Nome',
    date: ticket.event_date || ticket.date || '',
    currency: 'BRL',
    top_level_adult_price: ticket.price || 0,
    // Estrutura de "media": utiliza ticket.image_url se disponível
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

// Exibe ingressos utilizando o mesmo layout de cards.
// Converte os ingressos para o formato adequado, deduplica e renderiza no container "ingressosList".
function exibirIngressos(tickets) {
  if (!tickets || tickets.length === 0) {
    const ingressoContainer = document.getElementById('ingressosList');
    if (ingressoContainer) {
      ingressoContainer.innerHTML = '<p>Nenhum ingresso encontrado.</p>';
    }
    return;
  }
  const activities = tickets.map(convertTicketToActivity);
  const uniqueActivities = deduplicateActivities(activities);
  exibirAtividades(uniqueActivities, 'ingressosList');
}

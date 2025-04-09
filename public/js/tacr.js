// tacr.js - Versão final ajustada

// Formata os preços sempre em Reais (BRL) – ex.: R$ 1.111,11
function formatPrice(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

// Função que, dado um array de mídia, percorre todos os itens procurando a melhor imagem
// de acordo com a ordem de preferência definida.
function getBestMediaUrl(mediaArray) {
  if (!mediaArray || !mediaArray.length) {
    return 'https://via.placeholder.com/300x180?text=No+Image';
  }

  // Ordem de preferência para os tamanhos
  const preferredSizes = ["XLARGE", "LARGE", "MEDIUM", "SMALL"];

  // Percorre os tamanhos em ordem de preferência
  for (let size of preferredSizes) {
    for (let i = 0; i < mediaArray.length; i++) {
      const mediaItem = mediaArray[i];
      if (mediaItem.urls && mediaItem.urls.length) {
        const foundUrl = mediaItem.urls.find(u => u.sizeType === size);
        if (foundUrl && foundUrl.resource) {
          return foundUrl.resource;
        }
      }
    }
  }

  // Se não encontrar, retorna a primeira URL do primeiro item (ou fallback)
  if (mediaArray[0].urls && mediaArray[0].urls.length) {
    return mediaArray[0].urls[0].resource || 'https://via.placeholder.com/300x180?text=No+Image';
  }
  return 'https://via.placeholder.com/300x180?text=No+Image';
}

// Remove duplicatas com base no nome (case insensitive)
// Se houver duplicatas, mantém a atividade com o menor valor de top_level_adult_price.
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

// Exibe os cards no container especificado (padrão: "activitiesGrid") com layout em grid de 3 colunas.
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
    // Obtém a URL da melhor imagem percorrendo todos os itens de mídia
    let imageUrl = getBestMediaUrl(activity.media);

    // Processa a descrição: remove as tags HTML e limita a 100 caracteres
    let descText = activity.descricao ? activity.descricao.replace(/<[^>]*>/g, '') : '';
    if (descText.length > 100) {
      descText = descText.substring(0, 100) + '...';
    }

    // Define o preço a ser exibido: utiliza top_level_adult_price; caso não exista, usa outros campos como fallback
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

    // Cria o corpo do card
    const body = document.createElement('div');
    body.className = 'activity-body';

    // Título da atividade ou ingresso
    const title = document.createElement('h3');
    title.className = 'activity-title';
    title.textContent = activity.nome;
    body.appendChild(title);

    // Data da atividade ou ingresso
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

    // Descrição resumida da atividade/ingresso
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

// Função para tratar o clique no botão "Ver detalhes"
// Essa função pode ser personalizada para redirecionar para outra página ou abrir um modal com informações detalhadas.
function verDetalhesActivity(activityCode) {
  alert(`Detalhes da atividade: ${activityCode}`);
  // Exemplo alternativo:
  // window.location.href = `/detalhes.html?code=${activityCode}`;
}

// Converte um ingresso (ticket) para o formato de "atividade" esperado.
// Agora, a função verifica os campos top_level_adult_price, price, amount_adult e box_office_amount para definir o valor.
// Força a moeda para BRL.
function convertTicketToActivity(ticket) {
  const computedPrice = ticket.top_level_adult_price || ticket.price || ticket.amount_adult || ticket.box_office_amount || 0;
  return {
    nome: ticket.event_name || ticket.nome || 'Evento Sem Nome',
    date: ticket.event_date || ticket.date || '',
    currency: 'BRL',
    top_level_adult_price: computedPrice,
    amount_adult: ticket.amount_adult || 0, // Mapeia também para fallback, se necessário
    box_office_amount: ticket.box_office_amount || 0,
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

// Exibe ingressos utilizando o mesmo layout de cards das atividades.
// Converte os ingressos, remove duplicatas e renderiza no container "ingressosList".
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

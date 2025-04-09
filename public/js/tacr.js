// tacr.js - Versão atualizada com a abordagem B para selecionar a imagem

// Formata os preços sempre em Reais (BRL), ex.: R$ 1.111,11
function formatPrice(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

// Função que percorre todo o array de mídia e retorna a URL da imagem
// de acordo com a ordem de preferência: XLARGE, LARGE, MEDIUM, SMALL.
function getBestMediaUrl(mediaArray) {
  if (!mediaArray || !mediaArray.length) {
    return 'https://via.placeholder.com/300x180?text=No+Image';
  }
  
  const preferredSizes = ["XLARGE", "LARGE", "MEDIUM", "SMALL"];
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
  
  // Se não encontrar nenhum, retorna a primeira URL do primeiro item, se existir.
  if (mediaArray[0].urls && mediaArray[0].urls.length) {
    return mediaArray[0].urls[0].resource || 'https://via.placeholder.com/300x180?text=No+Image';
  }
  
  return 'https://via.placeholder.com/300x180?text=No+Image';
}

// Deduplica atividades (ou ingressos convertidos) com base no nome (case insensitive).
// Se houver duplicatas, mantém aquela com o menor top_level_adult_price.
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

// Exibe os cards no container especificado (default: "activitiesGrid").
// Configura o container em grid com 3 colunas (3 itens por fileira) e um gap de 20px.
function exibirAtividades(activities, containerId = 'activitiesGrid') {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container com id "${containerId}" não foi encontrado.`);
    return;
  }
  
  // Configura o container como grid de 3 colunas
  container.style.display = 'grid';
  container.style.gridTemplateColumns = 'repeat(3, 1fr)';
  container.style.gap = '20px';
  container.innerHTML = ''; // Limpa o conteúdo existente

  if (!activities || activities.length === 0) {
    container.innerHTML = '<p>Nenhuma atividade encontrada.</p>';
    return;
  }
  
  activities.forEach(activity => {
    // Obtém a URL da imagem usando getBestMediaUrl (varrendo todo o array de mídia)
    let imageUrl = getBestMediaUrl(activity.media);
    
    // Processa a descrição: remove tags HTML e limita a 100 caracteres
    let descText = activity.descricao ? activity.descricao.replace(/<[^>]*>/g, '') : '';
    if (descText.length > 100) {
      descText = descText.substring(0, 100) + '...';
    }
    
    // Determina o preço a ser exibido: tenta top_level_adult_price; se não existir, usa amount_adult ou box_office_amount
    let priceToShow = activity.top_level_adult_price;
    if (!priceToShow || priceToShow <= 0) {
      priceToShow = activity.amount_adult || activity.box_office_amount || 0;
    }
    
    // Cria o elemento card
    const card = document.createElement('div');
    card.className = 'activity-card';
    
    // Cria o elemento de imagem do card
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

// Função para tratar o clique no botão "Ver detalhes".
// Pode ser personalizada para abrir um modal ou redirecionar para outra página.
function verDetalhesActivity(activityCode) {
  alert(`Detalhes da atividade: ${activityCode}`);
  // Exemplo alternativo:
  // window.location.href = `/detalhes.html?code=${activityCode}`;
}

// Converte um ingresso (ticket) para o formato de "atividade" esperado pela função de exibição.
// Força a moeda para BRL e mapeia os campos necessários.
function convertTicketToActivity(ticket) {
  return {
    nome: ticket.event_name || ticket.nome || 'Evento Sem Nome',
    date: ticket.event_date || ticket.date || '',
    currency: 'BRL',
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

// Exibe ingressos utilizando o mesmo layout de cards das atividades.
// Converte os ingressos, deduplica (com base no nome) e renderiza no container com id "ingressosList".
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

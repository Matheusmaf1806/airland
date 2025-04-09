// tacr.js - Versão original com alteração apenas na obtenção da imagem

// Função para formatar preços sempre em Reais (BRL), no formato 'R$ 1.111,11'
function formatPrice(value, currency) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency || 'EUR'
  }).format(value);
}

// Função para deduplicar atividades com base no nome (case insensitive),
// mantendo a atividade com o menor top_level_adult_price em caso de duplicatas.
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

// *** NOVA FUNÇÃO: Apenas para obter a imagem com sizeType "XLARGE" procurando em todo o array ***
function getActivityImageUrl(activity) {
  let fallback = 'https://via.placeholder.com/300x180?text=No+Image';
  if (!activity.media || !activity.media.length) {
    return fallback;
  }
  // Tenta encontrar no array inteiro o primeiro item com sizeType "XLARGE"
  for (let i = 0; i < activity.media.length; i++) {
    const mediaItem = activity.media[i];
    if (mediaItem.urls && mediaItem.urls.length) {
      const urlObj = mediaItem.urls.find(u => u.sizeType === 'XLARGE');
      if (urlObj && urlObj.resource) {
        return urlObj.resource;
      }
    }
  }
  // Se não encontrar "XLARGE", retorna a primeira URL do primeiro item
  const first = activity.media[0];
  if (first.urls && first.urls.length) {
    return first.urls[0].resource || fallback;
  }
  return fallback;
}

// Função para exibir os cards no container especificado (padrão: "activitiesGrid").
// Configura o layout em grid com 3 itens por fileira.
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
    // Obtém a imagem usando a nova função getActivityImageUrl (modificação única)
    let imageUrl = getActivityImageUrl(activity);

    // Processa a descrição: remove as tags HTML e limita a 100 caracteres
    let descText = activity.descricao ? activity.descricao.replace(/<[^>]*>/g, '') : '';
    if (descText.length > 100) {
      descText = descText.substring(0, 100) + '...';
    }

    // Determina o preço: usa top_level_adult_price; se não existir, usa amount_adult ou box_office_amount
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

    // Cria a área de conteúdo do card
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
    priceStarting.textContent = `A partir de ${formatPrice(priceToShow, activity.currency)}`;
    priceEl.appendChild(priceStarting);
    const installments = document.createElement('span');
    installments.className = 'installments';
    installments.textContent = ' ou 10x sem juros';
    priceEl.appendChild(installments);
    body.appendChild(priceEl);

    // Descrição curta
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

// Função para tratar o clique em "Ver detalhes" – pode ser adaptada para redirecionamento ou modal.
function verDetalhesActivity(activityCode) {
  alert(`Detalhes da atividade: ${activityCode}`);
  // Exemplo alternativo:
  // window.location.href = `/detalhes.html?code=${activityCode}`;
}

// Função para converter um ingresso (ticket) para o formato de "atividade" esperado.
// Mapeia os campos conforme o que a busca espera, sem alterar a lógica de preços.
function convertTicketToActivity(ticket) {
  return {
    nome: ticket.event_name || ticket.nome || 'Evento Sem Nome',
    date: ticket.event_date || ticket.date || '',
    currency: ticket.currency || 'BRL',
    top_level_adult_price: ticket.price || 0,
    // Estrutura de "media": usa ticket.image_url se disponível
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

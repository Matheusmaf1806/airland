// tacr.js - Versão unificada com seleção da melhor resolução na lista de media

// Função para formatar preços sempre em Reais (BRL), no formato 'R$ 1.111,11'
function formatPrice(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
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

// Função que, dado um array de itens de media, retorna a URL da imagem com a melhor resolução
// seguindo a ordem de preferência: XLARGE, LARGE, MEDIUM, SMALL.
// Caso não encontre, retorna null.
function getBestMediaUrl(mediaArray) {
  if (!mediaArray || !mediaArray.length) return null;
  const preferredSizes = ["XLARGE", "LARGE", "MEDIUM", "SMALL"];
  
  for (let size of preferredSizes) {
    // Percorre todos os itens da media
    for (let i = 0; i < mediaArray.length; i++) {
      const item = mediaArray[i];
      if (item.urls && item.urls.length) {
        const foundUrl = item.urls.find(u => u.sizeType === size);
        if (foundUrl && foundUrl.resource) {
          return foundUrl.resource;
        }
      }
    }
  }
  return null;
}

// Função para exibir os cards no container especificado (padrão: "activitiesGrid")
// Configura o layout em grid com 3 itens por fileira.
function exibirAtividades(activities, containerId = 'activitiesGrid') {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container com id "${containerId}" não foi encontrado.`);
    return;
  }

  // Configura o container em grid: 3 colunas com gap de 20px
  container.style.display = 'grid';
  container.style.gridTemplateColumns = 'repeat(3, 1fr)';
  container.style.gap = '20px';
  container.innerHTML = ''; // Limpa o container

  if (!activities || activities.length === 0) {
    container.innerHTML = '<p>Nenhuma atividade encontrada.</p>';
    return;
  }

  activities.forEach(activity => {
    // Seleciona a imagem usando a função que percorre todo o array de media
    let imageUrl = getBestMediaUrl(activity.media);
    if (!imageUrl) {
      imageUrl = 'https://via.placeholder.com/300x180?text=No+Image';
    }

    // Processa a descrição: remove as tags HTML e limita a 100 caracteres
    let descText = activity.descricao ? activity.descricao.replace(/<[^>]*>/g, '') : '';
    if (descText.length > 100) {
      descText = descText.substring(0, 100) + '...';
    }

    // Determina o preço a ser exibido: utiliza top_level_adult_price ou, se não existir, outros campos como fallback
    let priceToShow = activity.top_level_adult_price;
    if (!priceToShow || priceToShow <= 0) {
      priceToShow = activity.amount_adult || activity.box_office_amount || 0;
    }

    // Cria o card principal
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

    // Exibe a data da atividade ou ingresso
    const dateEl = document.createElement('p');
    dateEl.className = 'activity-date';
    dateEl.textContent = `Data: ${activity.date}`;
    body.appendChild(dateEl);

    // Área de preços: formata o valor para BRL
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

// Função para tratar o clique em "Ver detalhes"
// Pode ser personalizada para redirecionar para uma página com mais informações ou abrir um modal.
function verDetalhesActivity(activityCode) {
  alert(`Detalhes da atividade: ${activityCode}`);
  // Exemplo alternativo:
  // window.location.href = `/detalhes.html?code=${activityCode}`;
}

// Função para converter um ingresso (ticket) para o formato de "atividade" esperado
// Aqui não mexemos na lógica de preço; apenas mapeamos os campos e forçamos a moeda para 'BRL'
function convertTicketToActivity(ticket) {
  return {
    nome: ticket.event_name || ticket.nome || 'Evento Sem Nome',
    date: ticket.event_date || ticket.date || '',
    currency: 'BRL',
    top_level_adult_price: ticket.price || 0,
    // Estrutura de "media": usa ticket.image_url se existir; caso contrário, placeholder
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

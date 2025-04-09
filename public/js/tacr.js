// tacr.js

function formatPrice(value, currency) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency || 'BRL' // Força R$ sempre
  }).format(value);
}

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

// Função para obter a imagem com sizeType "XLARGE", percorrendo todo o array.
function getActivityImageUrl(activity) {
  let fallback = 'https://via.placeholder.com/300x180?text=No+Image';
  if (!activity.media || !activity.media.length) {
    return fallback;
  }
  // Tenta achar "XLARGE"
  for (let i = 0; i < activity.media.length; i++) {
    const mediaItem = activity.media[i];
    if (mediaItem.urls && mediaItem.urls.length) {
      const urlObj = mediaItem.urls.find(u => u.sizeType === 'XLARGE');
      if (urlObj && urlObj.resource) {
        return urlObj.resource;
      }
    }
  }
  // Se não encontrou, usa a primeira URL do primeiro item
  const first = activity.media[0];
  if (first.urls && first.urls.length) {
    return first.urls[0].resource || fallback;
  }
  return fallback;
}

function exibirAtividades(activities, containerId = 'activitiesGrid') {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container com id "${containerId}" não foi encontrado.`);
    return;
  }
  container.style.display = 'grid';
  container.style.gridTemplateColumns = 'repeat(3, 1fr)';
  container.style.gap = '20px';
  container.innerHTML = ''; // Limpa

  if (!activities || activities.length === 0) {
    container.innerHTML = '<p>Nenhuma atividade encontrada.</p>';
    return;
  }

  activities.forEach(activity => {
    const imageUrl = getActivityImageUrl(activity);

    let descText = activity.descricao
      ? activity.descricao.replace(/<[^>]*>/g, '')
      : '';
    if (descText.length > 100) {
      descText = descText.substring(0, 100) + '...';
    }

    // Lógica de preço
    let priceToShow = activity.top_level_adult_price;
    if (!priceToShow || priceToShow <= 0) {
      priceToShow = activity.amount_adult || activity.box_office_amount || 0;
    }

    const card = document.createElement('div');
    card.className = 'activity-card';

    const img = document.createElement('img');
    img.className = 'activity-card-img';
    img.src = imageUrl;
    img.alt = activity.nome;
    card.appendChild(img);

    const body = document.createElement('div');
    body.className = 'activity-body';

    const title = document.createElement('h3');
    title.className = 'activity-title';
    title.textContent = activity.nome;
    body.appendChild(title);

    const dateEl = document.createElement('p');
    dateEl.className = 'activity-date';
    dateEl.textContent = `Data: ${activity.date}`;
    body.appendChild(dateEl);

    const priceEl = document.createElement('div');
    priceEl.className = 'activity-prices';
    const priceStarting = document.createElement('span');
    priceStarting.className = 'price-starting';

    // Exibe o valor em R$ (forçamos 'BRL' no formatPrice)
    priceStarting.textContent = `A partir de ${formatPrice(priceToShow, activity.currency)}`;
    priceEl.appendChild(priceStarting);

    const installments = document.createElement('span');
    installments.className = 'installments';
    installments.textContent = ' ou 10x sem juros';
    priceEl.appendChild(installments);
    body.appendChild(priceEl);

    const descEl = document.createElement('p');
    descEl.className = 'activity-description';
    descEl.textContent = descText;
    body.appendChild(descEl);

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

function verDetalhesActivity(activityCode) {
  alert(`Detalhes da atividade: ${activityCode}`);
}

// **AQUI A MUDANÇA PRINCIPAL**: Mapeamos de fato o ticket.top_level_adult_price e ticket.media
function convertTicketToActivity(ticket) {
  return {
    nome: ticket.event_name || ticket.nome || 'Evento Sem Nome',
    date: ticket.event_date || ticket.date || '',
    // Se sempre quiser R$, pode forçar 'BRL'. Se quiser respeitar a do JSON, use ticket.currency
    currency: 'BRL',
    top_level_adult_price: ticket.top_level_adult_price
      || ticket.amount_adult
      || ticket.box_office_amount
      || 0,
    media: ticket.media, // Agora aproveitamos o array real do servidor
    descricao: ticket.description || ticket.descricao || '',
    activity_code: ticket.ticket_id || ticket.code || ticket.event_code || ''
  };
}

function exibirIngressos(tickets) {
  if (!tickets || tickets.length === 0) {
    const resultContainer = document.getElementById('activitiesGrid');
    if (resultContainer) {
      resultContainer.innerHTML = '<p>Nenhum ingresso encontrado.</p>';
    }
    return;
  }
  const activities = tickets.map(convertTicketToActivity);
  const uniqueActivities = deduplicateActivities(activities);
  exibirAtividades(uniqueActivities, 'activitiesGrid'); // Usando "activitiesGrid" aqui
}

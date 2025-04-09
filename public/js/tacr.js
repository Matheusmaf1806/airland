// tacr.js - Versão unificada com ajustes para que a busca (exibição de ingressos) não seja prejudicada

// Função para formatar preços com a moeda apropriada (usa activity.currency ou 'EUR' se não definido)
function formatPrice(value, currency) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency || 'EUR'
  }).format(value);
}

// Função para exibir os cards no container especificado.
// O parâmetro containerId permite direcionar a renderização para o container adequado (default: "activitiesGrid").
function exibirAtividades(activities, containerId = 'activitiesGrid') {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container com id "${containerId}" não foi encontrado.`);
    return;
  }
  
  container.innerHTML = ''; // Limpa o container

  if (!activities || activities.length === 0) {
    container.innerHTML = '<p>Nenhuma atividade encontrada.</p>';
    return;
  }

  activities.forEach(activity => {
    // Obter a imagem da atividade; se não houver, usa placeholder
    let imageUrl = 'https://via.placeholder.com/300x180?text=No+Image';
    if (activity.media && activity.media.length > 0) {
      const firstMedia = activity.media[0];
      if (firstMedia.urls && firstMedia.urls.length > 0) {
        // Busca uma URL com sizeType 'XLARGE' ou, se não houver, pega a primeira
        const urlObj = firstMedia.urls.find(u => u.sizeType === 'XLARGE') || firstMedia.urls[0];
        if (urlObj && urlObj.resource) {
          imageUrl = urlObj.resource;
        }
      }
    }

    // Processa a descrição: remove tags HTML e limita a 100 caracteres
    let descText = activity.descricao ? activity.descricao.replace(/<[^>]*>/g, '') : '';
    if (descText.length > 100) {
      descText = descText.substring(0, 100) + '...';
    }

    // Determina o preço: usa top_level_adult_price ou outros valores como fallback
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

    // Cria a área de conteúdo (body) do card
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

    // Cria a área de preços com o valor formatado e parcelas
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

    // Descrição resumida da atividade/ingresso
    const descEl = document.createElement('p');
    descEl.className = 'activity-description';
    descEl.textContent = descText;
    body.appendChild(descEl);

    // Botão "Ver detalhes", que chama a função para tratar a ação
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

// Função que trata a ação do botão "Ver detalhes"
// Esta função pode ser personalizada para redirecionar para outra página ou abrir um modal com mais informações.
function verDetalhesActivity(activityCode) {
  alert(`Detalhes da atividade: ${activityCode}`);
  // Exemplo alternativo:
  // window.location.href = `/detalhes.html?code=${activityCode}`;
}

// Função para converter um ingresso (ticket) para o formato de "atividade" esperado.
// Essa conversão garante que os ingressos possam ser renderizados com o mesmo layout de card.
function convertTicketToActivity(ticket) {
  return {
    nome: ticket.event_name || ticket.nome || 'Evento Sem Nome',
    date: ticket.event_date || ticket.date || '',
    currency: ticket.currency || 'BRL',
    top_level_adult_price: ticket.price || 0,
    // Cria a estrutura de "media" com o campo de imagem (usa ticket.image_url se existir)
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
// Ela converte os dados do ingresso e direciona a renderização para o container "ingressosList".
function exibirIngressos(tickets) {
  if (!tickets || tickets.length === 0) {
    const ingressoContainer = document.getElementById('ingressosList');
    if (ingressoContainer) {
      ingressoContainer.innerHTML = '<p>Nenhum ingresso encontrado.</p>';
    }
    return;
  }
  const activities = tickets.map(convertTicketToActivity);
  exibirAtividades(activities, 'ingressosList');
}

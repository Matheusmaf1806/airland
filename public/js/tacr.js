// Função para formatar preços com a moeda apropriada (neste exemplo, utiliza activity.currency)
  function formatPrice(value, currency) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency || 'EUR'
    }).format(value);
  }

  // Função para exibir os cards de atividades no container "activitiesGrid"
  function exibirAtividades(activities) {
    const container = document.getElementById('activitiesGrid');
    container.innerHTML = ''; // Limpa o grid

    if (!activities || activities.length === 0) {
      container.innerHTML = '<p>Nenhuma atividade encontrada.</p>';
      return;
    }

    activities.forEach(activity => {
      // Obter a imagem da atividade
      let imageUrl = 'https://via.placeholder.com/300x180?text=No+Image';
      if (activity.media && activity.media.length > 0) {
        const firstMedia = activity.media[0];
        if (firstMedia.urls && firstMedia.urls.length > 0) {
          // Tenta encontrar uma URL com sizeType XLARGE ou, caso não exista, pega a primeira
          const urlObj = firstMedia.urls.find(u => u.sizeType === 'XLARGE') || firstMedia.urls[0];
          if (urlObj && urlObj.resource) {
            imageUrl = urlObj.resource;
          }
        }
      }

      // Extrai um trecho curto da descrição removendo as tags HTML
      let descText = activity.descricao ? activity.descricao.replace(/<[^>]*>/g, '') : '';
      if (descText.length > 100) {
        descText = descText.substring(0, 100) + '...';
      }

      // Escolhe o preço a ser exibido: tenta usar top_level_adult_price se existir e for válido;
      // caso contrário, utiliza amount_adult ou box_office_amount
      let priceToShow = activity.top_level_adult_price;
      if (!priceToShow || priceToShow <= 0) {
        priceToShow = activity.amount_adult || activity.box_office_amount || 0;
      }

      // Cria o elemento do card
      const card = document.createElement('div');
      card.className = 'activity-card';

      // Insere a imagem
      const img = document.createElement('img');
      img.className = 'activity-card-img';
      img.src = imageUrl;
      img.alt = activity.nome;
      card.appendChild(img);

      // Cria a área de conteúdo
      const body = document.createElement('div');
      body.className = 'activity-body';

      // Título da atividade
      const title = document.createElement('h3');
      title.className = 'activity-title';
      title.textContent = activity.nome;
      body.appendChild(title);

      // Data da atividade
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

      // Botão "Ver mais" para detalhes
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

  // Exemplo simples de função para tratar o botão "Ver detalhes"
  function verDetalhesActivity(activityCode) {
    // Redirecione ou abra um modal com os detalhes da atividade
    alert(`Detalhes da atividade: ${activityCode}`);
    // Exemplo: window.location.href = `/detalhes.html?code=${activityCode}`;
  }

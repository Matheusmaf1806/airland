// hotels-list.js
// Certifique‑se de que esse arquivo seja carregado pelo seu HTML (via <script src="/js/hotels-list.js"></script>)
// e que a variável global facilitiesMap esteja disponível (por exemplo, via /js/facilitiesMap.js).

document.addEventListener("DOMContentLoaded", () => {
  /* ===========================================
     A) LÓGICA DO BUSCADOR / ABAS + FLATPICKR
  ============================================ */
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(tc => tc.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.getAttribute('data-tab');
      document.getElementById(target).classList.add('active');
    });
  });

  if (typeof flatpickr !== 'undefined') {
    flatpickr('#dataIngresso', {
      locale: 'pt',
      dateFormat: 'd/m/Y',
      minDate: 'today',
      defaultDate: 'today'
    });
    flatpickr('#dataRangeHoteis', {
      locale: 'pt',
      mode: 'range',
      dateFormat: 'd/m/Y',
      showMonths: 2,
      minDate: 'today',
      allowInput: true
    });
  }

  /* ===========================================
     B) DROPDOWN DE QUARTOS E PESSOAS
  ============================================ */
  const quartosInput = document.getElementById('quartos');
  const dropdown = document.getElementById('quartosDropdown');
  const roomsMinus = document.getElementById('roomsMinus');
  const roomsPlus = document.getElementById('roomsPlus');
  const roomsTotalEl = document.getElementById('roomsTotal');
  const roomsContainer = document.getElementById('roomsContainer');
  const applyQuartos = document.getElementById('applyQuartos');

  // Array que guarda os dados de cada quarto
  let roomsData = [
    { adults: 2, children: 0, childAges: [] }
  ];

  if (quartosInput) {
    quartosInput.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('active');
    });
  }
  if (dropdown) {
    dropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }
  document.addEventListener('click', () => {
    dropdown.classList.remove('active');
  });

  function renderRooms() {
    if (!roomsContainer || !roomsTotalEl) return;
    roomsContainer.innerHTML = '';
    roomsTotalEl.textContent = roomsData.length;
    roomsData.forEach((room, index) => {
      const block = document.createElement('div');
      block.classList.add('qd-room-block');
      
      const title = document.createElement('div');
      title.className = 'qd-room-title';
      title.textContent = `Quarto ${index + 1}`;
      block.appendChild(title);

      // Linha de adultos
      const adRow = document.createElement('div');
      adRow.className = 'qd-row';
      adRow.innerHTML = `
        <span class="qd-label">Adultos</span>
        <div class="qd-counter">
          <button type="button" class="adultMinus">-</button>
          <span class="adultCount">${room.adults}</span>
          <button type="button" class="adultPlus">+</button>
        </div>
      `;
      block.appendChild(adRow);

      // Linha de crianças
      const chRow = document.createElement('div');
      chRow.className = 'qd-row';
      chRow.innerHTML = `
        <span class="qd-label">Crianças</span>
        <div class="qd-counter">
          <button type="button" class="childMinus">-</button>
          <span class="childCount">${room.children}</span>
          <button type="button" class="childPlus">+</button>
        </div>
      `;
      block.appendChild(chRow);

      // Container das idades das crianças
      const agesDiv = document.createElement('div');
      agesDiv.className = 'children-ages';
      room.childAges.forEach((ageVal, i2) => {
        const sel = document.createElement('select');
        sel.className = 'childAgeSelect';
        for (let a = 0; a <= 17; a++) {
          const opt = document.createElement('option');
          opt.value = a;
          opt.text = `${a} ano(s)`;
          sel.appendChild(opt);
        }
        sel.value = ageVal;
        sel.addEventListener('change', (ev) => {
          room.childAges[i2] = parseInt(ev.target.value, 10);
        });
        agesDiv.appendChild(sel);
      });
      block.appendChild(agesDiv);

      // Eventos (+/-) adultos
      adRow.querySelector('.adultPlus').addEventListener('click', () => {
        room.adults++;
        renderRooms();
      });
      adRow.querySelector('.adultMinus').addEventListener('click', () => {
        if (room.adults > 1) {
          room.adults--;
          renderRooms();
        }
      });

      // Eventos (+/-) crianças
      chRow.querySelector('.childPlus').addEventListener('click', () => {
        room.children++;
        room.childAges.push(0);
        renderRooms();
      });
      chRow.querySelector('.childMinus').addEventListener('click', () => {
        if (room.children > 0) {
          room.children--;
          room.childAges.pop();
          renderRooms();
        }
      });

      roomsContainer.appendChild(block);
    });
  }

  if (roomsPlus) {
    roomsPlus.addEventListener('click', () => {
      roomsData.push({ adults: 2, children: 0, childAges: [] });
      renderRooms();
    });
  }
  if (roomsMinus) {
    roomsMinus.addEventListener('click', () => {
      if (roomsData.length > 1) {
        roomsData.pop();
        renderRooms();
      }
    });
  }
  if (applyQuartos) {
    applyQuartos.addEventListener('click', () => {
      let totalA = 0, totalC = 0;
      for (const r of roomsData) {
        totalA += r.adults;
        totalC += r.children;
      }
      if (quartosInput) {
        quartosInput.value = `${roomsData.length} Quarto(s), ${totalA} Adulto(s), ${totalC} Criança(s)`;
      }
      dropdown.classList.remove('active');
    });
  }
  renderRooms();

  /* =========================================
     C) LÓGICA DE CRIAÇÃO DE CARD E CHAMADA /api/hoteis
  ========================================= */

  // Converte metros em "0,8 km"
  function convertDistanceToKm(distStr) {
    const meters = parseFloat(distStr) || 0;
    const km = meters / 1000;
    return km.toFixed(1).replace('.', ',') + " km";
  }

  // Cria um Card de hotel a partir do template #hotelCardTemplate
  function createHotelCard(hotelData) {
    const template = document.getElementById("hotelCardTemplate");
    if (!template) return document.createDocumentFragment();
    const clone = template.content.cloneNode(true);

    // Preenche campos básicos
    clone.querySelector(".hotel-name").textContent = hotelData.name || "";
    clone.querySelector(".hotel-address").textContent = hotelData.address || "";
    clone.querySelector(".days-nights").textContent = hotelData.daysNights || "";
    clone.querySelector(".price-starting").textContent = hotelData.priceFrom || "";
    clone.querySelector(".ten-installments").textContent = hotelData.installments || "";

    // Estrelas
    const starEl = clone.querySelector(".stars");
    starEl.innerHTML = "";
    const r = Math.round(hotelData.ratingStars || 0);
    for (let i = 1; i <= 5; i++) {
      const star = document.createElement("i");
      if (i <= r) star.classList.add("fas", "fa-star");
      else star.classList.add("far", "fa-star", "empty");
      starEl.appendChild(star);
    }
    clone.querySelector(".rating-value").textContent = hotelData.ratingValue || "";

    // Facilities – procura os ícones via facilitiesMap (deve estar carregado globalmente)
    const facDiv = clone.querySelector(".facility-icons");
    (hotelData.facilities || []).forEach(f => {
      const found = getFacilityIcon(f);
      if (found) {
        const iconDiv = document.createElement("div");
        iconDiv.className = "facility-icon";
        iconDiv.innerHTML = found.svg;
        // Tooltip
        const tt = document.createElement("div");
        tt.className = "tooltip";
        tt.textContent = found.pt;
        iconDiv.appendChild(tt);
        facDiv.appendChild(iconDiv);
      }
    });

    // Pontos de Interesse (POI)
    const poiUl = clone.querySelector(".poi-list");
    (hotelData.poiList || []).forEach(p => {
      const li = document.createElement("li");
      const distKm = convertDistanceToKm(p.distance);
      li.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${p.poiName} - ${distKm}`;
      poiUl.appendChild(li);
    });

    // Carrossel de imagens
    const track = clone.querySelector(".carousel-track");
    let currentSlide = 0;
    (hotelData.images || []).forEach(url => {
      const slide = document.createElement("div");
      slide.className = "carousel-slide";
      slide.innerHTML = `<img src="${url}" alt="Foto do Hotel">`;
      track.appendChild(slide);
    });
    const prevBtn = clone.querySelector(".prev-button");
    const nextBtn = clone.querySelector(".next-button");

    function updateCarousel() {
      const slides = track.querySelectorAll(".carousel-slide");
      if (!slides.length) return;
      const w = slides[0].getBoundingClientRect().width;
      track.style.transform = `translateX(-${currentSlide * w}px)`;
    }
    prevBtn.addEventListener('click', () => {
      const slides = track.querySelectorAll(".carousel-slide");
      if (!slides.length) return;
      currentSlide = (currentSlide - 1 + slides.length) % slides.length;
      updateCarousel();
    });
    nextBtn.addEventListener('click', () => {
      const slides = track.querySelectorAll(".carousel-slide");
      if (!slides.length) return;
      currentSlide = (currentSlide + 1) % slides.length;
      updateCarousel();
    });
    window.addEventListener('resize', updateCarousel);

    return clone;
  }

  // Retorna o ícone de facility a partir do facilitiesMap global
  function getFacilityIcon(name) {
    if (window.facilitiesMap) {
      return window.facilitiesMap[name] || null;
    }
    return null;
  }

  // Função para buscar hotéis chamando o back-end
  async function buscarHoteis() {
    const destination = document.getElementById("destinoHoteis")?.value || "MCO";
    const range = document.getElementById("dataRangeHoteis")?.value || "";
    const hotelsListEl = document.getElementById("hotelsList");
    const statusEl = document.getElementById("status");
    const paginationEl = document.getElementById("pagination");

    if (!range) {
      alert("Selecione as datas!");
      return;
    }

    // Converte "DD/MM/YYYY" -> "YYYY-MM-DD"
    function toISO(dmy) {
      const [d, m, y] = dmy.split("/");
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
    let checkIn = "", checkOut = "";
    const parts = range.split(" ");
    if (parts.length >= 2) {
      checkIn = parts[0];
      checkOut = parts[2] || parts[1];
    }
    const isoIn = toISO(checkIn);
    const isoOut = toISO(checkOut);

    // Monta query com base no roomsData
    let query = `?checkIn=${isoIn}&checkOut=${isoOut}&destination=${destination}&rooms=${roomsData.length}&page=1&limit=20`;
    roomsData.forEach((r, i) => {
      const idx = i + 1;
      query += `&adults${idx}=${r.adults}&children${idx}=${r.children}`;
    });

    if (hotelsListEl) hotelsListEl.innerHTML = "";
    if (paginationEl) {
      paginationEl.innerHTML = "";
      paginationEl.style.display = "none";
    }
    if (statusEl) {
      statusEl.textContent = "Carregando hotéis...";
      statusEl.style.display = "block";
    }

    // Note: ajuste o endpoint conforme sua rota no back-end; 
    // se você registrou a rota como /api/hoteis, use esse caminho.
    const url = `/api/hoteis${query}`;
    console.log("Chamando backend:", url);

    try {
      const resp = await fetch(url);
      if (!resp.ok) {
        throw new Error("Erro ao buscar /api/hoteis: " + resp.status);
      }
      const data = await resp.json();

      // Supondo que a resposta contenha data.hotels.hotels (array de hotéis)
      const hotelsArr = data.hotels?.hotels || [];
      if (!hotelsArr.length) {
        if (statusEl) statusEl.textContent = "Nenhum hotel encontrado.";
        return;
      }
      if (statusEl) statusEl.style.display = "none";

      // Para cada hotel, cria o card e o adiciona à listagem
      hotelsArr.forEach(hotelObj => {
        const cardEl = createHotelCard(hotelObj);
        if (hotelsListEl) hotelsListEl.appendChild(cardEl);
      });

      // Se houver paginação, você pode chamar uma função para exibi-la
      // exibirPaginacao(data.totalPages || 1, 1);

    } catch (e) {
      console.error(e);
      if (statusEl) statusEl.textContent = "Erro ao buscar hotéis. Ver console.";
    }
  }

  // Se o botão de busca (no HTML) chama a função buscarHoteis, precisamos torná-la global:
  window.buscarHoteis = buscarHoteis;
});

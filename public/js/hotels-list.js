/* =====================================================
   hotels-list.js
   Responsável por:
   - Gerenciar abas e calendários (Flatpickr)
   - Gerenciar o dropdown de múltiplos quartos
   - Buscar hotéis via backend (/api/hotelbeds/hotels)
   - Criar e injetar os cards de hotel no DOM (incluindo carrossel, facilidades, POIs, etc.)
===================================================== */

/* ---------- A) Configuração de Abas e Flatpickr ---------- */
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

/* ---------- B) Dropdown de Quartos ---------- */
const quartosInput   = document.getElementById('quartos');
const dropdown       = document.getElementById('quartosDropdown');
const roomsMinus     = document.getElementById('roomsMinus');
const roomsPlus      = document.getElementById('roomsPlus');
const roomsTotalEl   = document.getElementById('roomsTotal');
const roomsContainer = document.getElementById('roomsContainer');
const applyQuartos   = document.getElementById('applyQuartos');

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
  if (dropdown) dropdown.classList.remove('active');
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

    // Linha de Adultos
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

    // Linha de Crianças
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

    // Container das idades
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

    // Eventos para adultos
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

    // Eventos para crianças
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
    let totalA = 0;
    let totalC = 0;
    for (const r of roomsData) {
      totalA += r.adults;
      totalC += r.children;
    }
    quartosInput.value = `${roomsData.length} Quarto(s), ${totalA} Adulto(s), ${totalC} Criança(s)`;
    dropdown.classList.remove('active');
  });
}
renderRooms();

/* ---------- C) FUNÇÕES AUXILIARES E CRIAÇÃO DE CARD ---------- */

/** Converte distância (em metros) para "0,8 km" */
function convertDistanceToKm(distStr) {
  const meters = parseFloat(distStr) || 0;
  const km = meters / 1000;
  return km.toFixed(1).replace('.', ',') + " km";
}

/**
 * Cria um card de hotel usando o template #hotelCardTemplate.
 * O objeto hotelData deve conter:
 * {
 *   name, address, ratingStars, ratingValue,
 *   images: [ "url1", "url2", ... ],
 *   daysNights, priceFrom, installments,
 *   facilities: [ "Wi-fi", "Air conditioning in public areas", ... ],
 *   poiList: [ { poiName:"Downtown Disney", distance:"800" }, ... ]
 * }
 */
function createHotelCard(hotelData) {
  const template = document.getElementById("hotelCardTemplate");
  if (!template) {
    console.warn("Template #hotelCardTemplate não encontrado!");
    return document.createDocumentFragment();
  }
  const clone = template.content.cloneNode(true);

  // Campos básicos
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

  // Facilities – usando o facilitiesMap definido em /js/facilitiesMap.js (deve estar carregado no HTML)
  const facDiv = clone.querySelector(".facility-icons");
  (hotelData.facilities || []).forEach(f => {
    if (window.facilitiesMap) {
      const key = f.trim();
      const found = window.facilitiesMap[key];
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
    }
  });

  // Pontos de interesse (POI)
  const poiUl = clone.querySelector(".poi-list");
  (hotelData.poiList || []).forEach(p => {
    const li = document.createElement("li");
    const distKm = convertDistanceToKm(p.distance);
    li.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${p.poiName} - ${distKm}`;
    poiUl.appendChild(li);
  });

  // Carrossel de imagens – garante que as imagens sejam exibidas em formato quadrado via CSS (object-fit: cover)
  const track = clone.querySelector(".carousel-track");
  let currentSlide = 0;
  (hotelData.images || []).forEach(url => {
    const slide = document.createElement("div");
    slide.className = "carousel-slide";
    // Aqui, se necessário, você pode definir dimensões fixas no CSS para que a imagem fique quadrada.
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

/* ---------- D) BUSCAR HOTÉIS ---------- */

/**
 * Função que busca hotéis no backend (/api/hoteis) usando:
 * - Datas do input #dataRangeHoteis
 * - Destino do input #destinoHoteis
 * - Dados dos quartos (roomsData)
 * Depois monta os cards e os insere no container #hotelsList.
 */
async function buscarHoteis() {
  const destination = document.getElementById("destinoHoteis")?.value || "MCO";
  const range = document.getElementById("dataRangeHoteis")?.value || "";
  const hotelsListEl = document.getElementById("hotelsList");
  const statusEl = document.getElementById("status");
  const paginationEl = document.getElementById("pagination");

  if (!range) {
    alert("Selecione as datas (Check-in / Check-out)!");
    return;
  }

  // Função auxiliar para converter "DD/MM/YYYY" para "YYYY-MM-DD"
  function toISO(dmy) {
    const [d, m, y] = dmy.split("/");
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  let checkIn = "", checkOut = "";
  const parts = range.split(" ");
  if (parts.length >= 2) {
    checkIn = parts[0];             // "DD/MM/YYYY"
    checkOut = parts[2] || parts[1]; // "DD/MM/YYYY"
  }
  const isoIn = toISO(checkIn);
  const isoOut = toISO(checkOut);

  // Monta a query string incluindo rooms
  let query = `?checkIn=${isoIn}&checkOut=${isoOut}&destination=${destination}&rooms=${roomsData.length}`;
  query += `&page=1&limit=20`;
  roomsData.forEach((r, i) => {
    const idx = i + 1;
    query += `&adults${idx}=${r.adults}&children${idx}=${r.children}`;
    // Se precisar enviar idades: &childAges${idx}=0,5,...
  });

  // Limpa resultados anteriores e exibe status
  if (hotelsListEl) hotelsListEl.innerHTML = "";
  if (paginationEl) {
    paginationEl.innerHTML = "";
    paginationEl.style.display = "none";
  }
  if (statusEl) {
    statusEl.textContent = "Carregando hotéis...";
    statusEl.style.display = "block";
  }

  const url = `/api/hotelbeds/hotels${query}`;
  console.log("Chamando backend:", url);

  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`Erro ao buscar /api/hotelbeds/hotels: ${resp.status}`);
    }
    const data = await resp.json();

    // Supondo que o backend retorne { hotels: {hotels: [...] } }
    const hotelsArr = data.hotels?.hotels || [];
    if (!hotelsArr.length) {
      if (statusEl) statusEl.textContent = "Nenhum hotel encontrado.";
      return;
    }
    if (statusEl) statusEl.style.display = "none";

    // Para cada hotel retornado, monta o card
    for (const rawHotel of hotelsArr) {
      // Processa os dados do hotel (Booking e Content)
      let priceLabel = "A partir de R$ ???";
      if (typeof rawHotel.minRate !== "undefined") {
        const pr = parseFloat(rawHotel.minRate);
        if (!isNaN(pr)) {
          priceLabel = `A partir de R$ ${pr.toFixed(2)}`;
        }
      }

      // Define rating a partir do categoryCode (ex.: "4EST")
      let ratingNum = 0;
      if (rawHotel.categoryCode) {
        const match = rawHotel.categoryCode.match(/\d+/);
        if (match) ratingNum = parseInt(match[0], 10);
      }
      if (!ratingNum) ratingNum = 3; // fallback

      // Facilities: extraídas de rawHotel.content.facilities
      let facArr = [];
      if (rawHotel.content?.facilities?.length) {
        facArr = rawHotel.content.facilities.slice(0, 5)
                  .map(f => f.description?.content?.trim() || "");
      }

      // Pontos de interesse
      let poiArr = [];
      if (rawHotel.content?.interestPoints?.length) {
        poiArr = rawHotel.content.interestPoints.map(ip => ({
          poiName: ip.poiName || "Ponto de Interesse",
          distance: ip.distance || "0"
        }));
      }

      // Imagens: Filtra imagens com type.code "HAB" (Room)
      let imagesArr = [];
      if (rawHotel.content?.images?.length) {
        const roomImgs = rawHotel.content.images.filter(img => img.type?.code === "HAB");
        const arr = roomImgs.length ? roomImgs : rawHotel.content.images;
        imagesArr = arr.map(img => `https://photos.hotelbeds.com/giata/xl/${img.path}`);
      } else {
        imagesArr = ["https://dummyimage.com/300x300/ccc/000.png&text=No+Image"];
      }

      // Calcula dias/noites
      let daysNightsLabel = "";
      if (isoIn && isoOut) {
        const d1 = new Date(isoIn);
        const d2 = new Date(isoOut);
        const diffMs = d2 - d1;
        if (diffMs > 0) {
          const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
          daysNightsLabel = `${diffDays} dia(s), ${Math.max(diffDays - 1, 1)} noite(s)`;
        }
      }

      const hotelObj = {
        name: rawHotel.name || "Hotel sem nome",
        address: rawHotel.content?.address?.street || "",
        ratingStars: ratingNum,
        ratingValue: ratingNum.toString(),
        images: imagesArr,
        daysNights: daysNightsLabel,
        priceFrom: priceLabel,
        installments: "Até 10x sem juros",
        facilities: facArr,
        poiList: poiArr
      };

      const cardEl = createHotelCard(hotelObj);
      hotelsListEl.appendChild(cardEl);
    }

    // Se o backend retornar totalPages, chame a função de paginação aqui (opcional)
    // exibirPaginacao(data.totalPages || 1, 1);
  } catch (e) {
    console.error("Erro ao buscar hotéis:", e);
    if (statusEl) statusEl.textContent = "Erro ao buscar hotéis. Ver console.";
  }
}

/* (Opcional) Função de paginação */
function exibirPaginacao(totalPages, currentPage) {
  const pagEl = document.getElementById("pagination");
  if (!pagEl || totalPages <= 1) return;
  pagEl.style.display = "flex";

  if (currentPage > 1) {
    const btnPrev = document.createElement("button");
    btnPrev.textContent = "Anterior";
    btnPrev.onclick = () => buscarHoteis(currentPage - 1);
    pagEl.appendChild(btnPrev);
  }
  if (currentPage < totalPages) {
    const btnNext = document.createElement("button");
    btnNext.textContent = "Próxima Página";
    btnNext.onclick = () => buscarHoteis(currentPage + 1);
    pagEl.appendChild(btnNext);
  }
}

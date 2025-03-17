/* ===========================================
   hotels-list.js
   -------------------------------------------
   Script responsável por:
   - Gerenciar dropdown de múltiplos quartos
   - Buscar hotéis via /api/hoteis
   - Criar cards de hotel (carrossel, facilidades, etc.)
=========================================== */

/* ===========================================
   A) DROPDOWN DE MÚLTIPLOS QUARTOS
=========================================== */

// Inputs e elementos do dropdown
const quartosInput   = document.getElementById('quartos');
const dropdown       = document.getElementById('quartosDropdown');
const roomsMinus     = document.getElementById('roomsMinus');
const roomsPlus      = document.getElementById('roomsPlus');
const roomsTotalEl   = document.getElementById('roomsTotal');
const roomsContainer = document.getElementById('roomsContainer');
const applyQuartos   = document.getElementById('applyQuartos');

/** roomsData: Armazena a configuração de cada quarto
 *  (adults, children, childAges: [0..17])
 *  Ex.: [ {adults:2, children:0, childAges: []}, ... ]
 */
let roomsData = [
  { adults: 2, children: 0, childAges: [] }
];

// Abre/fecha dropdown ao clicar no input
if (quartosInput) {
  quartosInput.addEventListener('click', (ev) => {
    ev.stopPropagation();
    if (dropdown) dropdown.classList.toggle('active');
  });
}
// Impede que clique dentro do dropdown feche a si mesmo
if (dropdown) {
  dropdown.addEventListener('click', (ev) => {
    ev.stopPropagation();
  });
}
// Fecha dropdown se clicar em qualquer lugar fora dele
document.addEventListener('click', () => {
  if (dropdown) dropdown.classList.remove('active');
});

// Renderiza cada quarto (HTML) dentro do dropdown
function renderRooms() {
  if (!roomsContainer || !roomsTotalEl) return;

  // Limpa o container
  roomsContainer.innerHTML = '';
  // Atualiza o contador de "Quartos"
  roomsTotalEl.textContent = roomsData.length;

  // Para cada quarto no array...
  roomsData.forEach((room, index) => {
    const block = document.createElement('div');
    block.classList.add('qd-room-block');

    // Título "Quarto X"
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

    // Container para idades
    const agesDiv = document.createElement('div');
    agesDiv.className = 'children-ages';
    // Para cada criança, cria um <select> de 0..17
    room.childAges.forEach((ageVal, i2) => {
      const sel = document.createElement('select');
      sel.className = 'childAgeSelect';
      for (let a = 0; a <= 17; a++) {
        const opt = document.createElement('option');
        opt.value = a;
        opt.text = `${a} ano(s)`;
        sel.appendChild(opt);
      }
      sel.value = ageVal; // idade atual
      sel.addEventListener('change', (ev) => {
        room.childAges[i2] = parseInt(ev.target.value, 10);
      });
      agesDiv.appendChild(sel);
    });
    block.appendChild(agesDiv);

    // Eventos de + / - em adultos
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

    // Eventos de + / - em crianças
    chRow.querySelector('.childPlus').addEventListener('click', () => {
      room.children++;
      room.childAges.push(0); // criança começa com 0 anos
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

// Botões (+/-) para aumentar/diminuir o total de quartos
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

// Botão "Aplicar" do dropdown
if (applyQuartos) {
  applyQuartos.addEventListener('click', () => {
    let totalA = 0;
    let totalC = 0;
    for (const r of roomsData) {
      totalA += r.adults;
      totalC += r.children;
    }
    // Ex.: "2 Quartos, 4 Adultos, 1 Criança"
    if (quartosInput) {
      quartosInput.value = `${roomsData.length} Quarto(s), ${totalA} Adulto(s), ${totalC} Criança(s)`;
    }
    // Fecha dropdown
    if (dropdown) dropdown.classList.remove('active');
  });
}

// Render inicial
renderRooms();

/* =========================================
   B) FUNÇÕES AUXILIARES E CRIAÇÃO DE CARD
========================================= */

/** Converte metros (string ou número) em "0,8 km" */
function convertDistanceToKm(distStr) {
  const meters = parseFloat(distStr) || 0;
  const km = meters / 1000;
  // Ex.: 0.8 => "0,8"
  return km.toFixed(1).replace('.', ',') + " km";
}

/**
 * createHotelCard(hotelData)
 * Monta o card de hotel a partir de #hotelCardTemplate no HTML
 * `hotelData` deve ter algo como:
 *  {
 *    name: "Nome do Hotel",
 *    address: "Endereço",
 *    ratingStars: 4,
 *    ratingValue: "4.0",
 *    images: ["url1", "url2", ...],
 *    daysNights: "2 dias, 1 noite",
 *    priceFrom: "A partir de R$...",
 *    installments: "Até 10x sem juros",
 *    facilities: ["Wi-fi", "Air conditioning in public areas", ...]
 *    poiList: [ { poiName:"Downtown Disney", distance:"800" }, ...]
 *  }
 */
function createHotelCard(hotelData) {
  const template = document.getElementById("hotelCardTemplate");
  if (!template) {
    console.warn("Template #hotelCardTemplate não encontrado!");
    return document.createDocumentFragment();
  }

  // Clona o conteúdo do template
  const clone = template.content.cloneNode(true);

  // 1) Nome, endereço, datas/noites, preço
  clone.querySelector(".hotel-name").textContent    = hotelData.name         || "";
  clone.querySelector(".hotel-address").textContent = hotelData.address      || "";
  clone.querySelector(".days-nights").textContent   = hotelData.daysNights   || "";
  clone.querySelector(".price-starting").textContent= hotelData.priceFrom    || "";
  clone.querySelector(".ten-installments").textContent = hotelData.installments || "";

  // 2) Estrelas + valor numérico (rating)
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

  // 3) Facilities => se tiver um facilitiesMap global
  const facDiv = clone.querySelector(".facility-icons");
  (hotelData.facilities || []).forEach(f => {
    // Se você estiver usando window.facilitiesMap...
    if (window.facilitiesMap) {
      // Normalize string
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
      } else {
        // console.warn("Facility não mapeada:", key);
      }
    }
  });

  // 4) Pontos de Interesse
  const poiUl = clone.querySelector(".poi-list");
  (hotelData.poiList || []).forEach(p => {
    const li = document.createElement("li");
    const distKm = convertDistanceToKm(p.distance);
    li.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${p.poiName} - ${distKm}`;
    poiUl.appendChild(li);
  });

  // 5) Carrossel de imagens
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

  // Função interna para mover o carrossel
  function updateCarousel() {
    const slides = track.querySelectorAll(".carousel-slide");
    if (!slides.length) return;
    const w = slides[0].getBoundingClientRect().width;
    track.style.transform = `translateX(-${currentSlide * w}px)`;
  }

  // Botões anterior/próximo
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
  // Ajusta o carrossel ao redimensionar a tela
  window.addEventListener('resize', updateCarousel);

  return clone;
}

/* =========================================
   C) FUNÇÃO buscarHoteis() => chama /api/hoteis
========================================= */

/**
 * Buscar hotéis no backend, usando:
 *  - datas do input #dataRangeHoteis
 *  - destino do input #destinoHoteis
 *  - roomsData (quartos)
 *  - exibe cards dentro de #hotelsList
 */
async function buscarHoteis() {
  const destination  = document.getElementById("destinoHoteis")?.value || "MCO";
  const range        = document.getElementById("dataRangeHoteis")?.value || "";
  const hotelsListEl = document.getElementById("hotelsList");
  const statusEl     = document.getElementById("status");
  const paginationEl = document.getElementById("pagination");

  if (!range) {
    alert("Selecione as datas (Check-in / Check-out)!");
    return;
  }

  // Converte "DD/MM/YYYY" -> "YYYY-MM-DD"
  function toISO(dmy) {
    const [d,m,y] = dmy.split("/");
    return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
  }
  let checkIn = "", checkOut = "";
  const parts = range.split(" ");
  if (parts.length >= 2) {
    checkIn  = parts[0];             // "DD/MM/YYYY"
    checkOut = parts[2] || parts[1]; // "DD/MM/YYYY"
  }
  const isoIn  = toISO(checkIn);
  const isoOut = toISO(checkOut);

  // Monta query com roomsData
  // Exemplo: ?checkIn=2025-06-15&checkOut=2025-06-20&destination=MCO&rooms=1&page=1&limit=20&adults1=2&children1=0
  let query = `?checkIn=${isoIn}&checkOut=${isoOut}&destination=${destination}&rooms=${roomsData.length}`;
  query += `&page=1&limit=20`;
  roomsData.forEach((r, i) => {
    const idx = i + 1;
    query += `&adults${idx}=${r.adults}&children${idx}=${r.children}`;
    // se quisesse mandar também as idades: &childAges${idx}=0,5,... -> mas depende do seu back
  });

  // Limpa resultados anteriores
  if (hotelsListEl) hotelsListEl.innerHTML = "";
  if (paginationEl) {
    paginationEl.innerHTML = "";
    paginationEl.style.display = "none";
  }
  if (statusEl) {
    statusEl.textContent = "Carregando hotéis...";
    statusEl.style.display = "block";
  }

  // Exemplo de rota => "/api/hoteis"
  const url = `/api/hoteis${query}`;
  console.log("Chamando backend:", url);

  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`Erro ao buscar /api/hoteis: HTTP ${resp.status}`);
    }
    const data = await resp.json();

    // Se o back retorna algo como { hotels: {hotels: [...]} }
    // Ajuste se for { combined: [...] } ou outro nome
    const hotelsArr = data.hotels?.hotels || [];
    if (!hotelsArr.length) {
      if (statusEl) statusEl.textContent = "Nenhum hotel encontrado.";
      return;
    }
    if (statusEl) statusEl.style.display = "none";

    // Monta cards
    for (const rawHotel of hotelsArr) {
      // Supondo que o back já junte booking+content e retorne algo do tipo:
      // rawHotel = { code, name, categoryCode, minRate, content: {...} }
      // Precisamos criar "hotelData" no formato esperado
      // Exemplo: interpreta minRate etc. e gera priceFrom

      // Exemplo simples: se minRate=185.5 => priceFrom="A partir de R$ 185.50"
      let priceLabel = "A partir de R$ ???";
      if (typeof rawHotel.minRate !== "undefined") {
        const pr = parseFloat(rawHotel.minRate);
        if (!isNaN(pr)) {
          priceLabel = `A partir de R$ ${pr.toFixed(2)}`;
        }
      }

      // Exemplo: ratingStars a partir de categoryCode => "4EST"
      let ratingNum = 0;
      if (rawHotel.categoryCode) {
        const match = rawHotel.categoryCode.match(/\d+/);
        if (match) ratingNum = parseInt(match[0], 10);
      }

      // Monta facilities => se vierem do .content.facilities
      let facArr = [];
      if (rawHotel.content?.facilities?.length) {
        facArr = rawHotel.content.facilities
          // pegando no máximo 5
          .slice(0, 5)
          .map(f => f.description?.content?.trim() || "");
      }

      // interestPoints => se vier do .content.interestPoints
      let poiList = [];
      if (rawHotel.content?.interestPoints?.length) {
        poiList = rawHotel.content.interestPoints.map(ip => ({
          poiName: ip.poiName || "Ponto de Interesse",
          distance: ip.distance || "0"
        }));
      }

      // Imagens => se vier de rawHotel.content.images
      let imagesArr = [];
      if (rawHotel.content?.images?.length) {
        // filtrar type.code="HAB", senão pega tudo
        const arr = rawHotel.content.images;
        const roomImgs = arr.filter(img => img.type?.code === "HAB");
        const finalImgs = roomImgs.length ? roomImgs : arr;
        imagesArr = finalImgs.map(img => `https://photos.hotelbeds.com/giata/xl/${img.path}`);
      } else {
        imagesArr = ["https://dummyimage.com/300x200/ccc/000.png&text=No+Image"];
      }

      // Faz um calculo simples de daysNights
      let daysNightsLabel = "";
      if (isoIn && isoOut) {
        const d1 = new Date(isoIn), d2 = new Date(isoOut);
        const diffMs = d2 - d1;
        if (diffMs > 0) {
          const diffDays = Math.round(diffMs / (1000*60*60*24));
          daysNightsLabel = `${diffDays} dia(s), ${Math.max(diffDays-1,1)} noite(s)`;
        }
      }

      // Monta o objeto "hotelData" esperado por createHotelCard
      const hotelObj = {
        name:       rawHotel.name || "Hotel sem nome",
        address:    rawHotel.content?.address?.street || "",
        ratingStars: ratingNum,
        ratingValue: ratingNum.toString(),
        images:     imagesArr,
        daysNights: daysNightsLabel,
        priceFrom:  priceLabel,
        installments: "Até 10x sem juros",  // exemplo fixo
        facilities: facArr,
        poiList:    poiList
      };

      // Cria o card
      const cardEl = createHotelCard(hotelObj);
      hotelsListEl?.appendChild(cardEl);
    }

    // Se back retorna data.totalPages, chama exibirPaginacao(data.totalPages,1)

  } catch (err) {
    console.error("Erro ao buscar hoteis:", err);
    if (statusEl) statusEl.textContent = "Erro ao buscar hotéis. Ver console.";
  }
}

/** Exemplo de paginação (chame se seu backend devolver totalPages etc.)
function exibirPaginacao(totalPages, currentPage) {
  const pagEl = document.getElementById("pagination");
  if (!pagEl || totalPages <= 1) return;
  pagEl.style.display = "flex";

  if (currentPage > 1) {
    const btnPrev = document.createElement("button");
    btnPrev.textContent = "Anterior";
    btnPrev.onclick = () => buscarHoteis(/* currentPage - 1 * /);
    pagEl.appendChild(btnPrev);
  }

  if (currentPage < totalPages) {
    const btnNext = document.createElement("button");
    btnNext.textContent = "Próxima Página";
    btnNext.onclick = () => buscarHoteis(/* currentPage + 1 * /);
    pagEl.appendChild(btnNext);
  }
}
*/

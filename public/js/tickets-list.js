/* ===================================
   A) LÓGICA DO BUSCADOR / ABAS
=================================== */

// Abas
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

// Flatpickr => #dataIngresso, #dataRangeHoteis
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

// Dropdown de Quartos
const quartosInput   = document.getElementById('quartos');
const dropdown       = document.getElementById('quartosDropdown');
const roomsMinus     = document.getElementById('roomsMinus');
const roomsPlus      = document.getElementById('roomsPlus');
const roomsTotalEl   = document.getElementById('roomsTotal');
const roomsContainer = document.getElementById('roomsContainer');
const applyQuartos   = document.getElementById('applyQuartos');

// Array que guarda dados de cada quarto
let roomsData = [
  { adults: 2, children: 0, childAges: [] }
];

// Abre/fecha dropdown
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

// Renderiza os blocos de cada quarto
function renderRooms() {
  if (!roomsContainer) return;
  roomsContainer.innerHTML = '';
  roomsTotalEl.textContent = roomsData.length;

  roomsData.forEach((room, index) => {
    const block = document.createElement('div');
    block.classList.add('qd-room-block');

    const title = document.createElement('div');
    title.className = 'qd-room-title';
    title.textContent = `Quarto ${index+1}`;
    block.appendChild(title);

    // Adultos
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

    // Crianças
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

    // Idades
    const agesDiv = document.createElement('div');
    agesDiv.className = 'children-ages';
    room.childAges.forEach((ageVal, i2) => {
      const sel = document.createElement('select');
      sel.className = 'childAgeSelect';
      for (let a=0; a<=17; a++){
        const opt = document.createElement('option');
        opt.value=a;
        opt.text=`${a} ano(s)`;
        sel.appendChild(opt);
      }
      sel.value=ageVal;
      sel.addEventListener('change',(ev)=>{
        room.childAges[i2]=parseInt(ev.target.value,10);
      });
      agesDiv.appendChild(sel);
    });
    block.appendChild(agesDiv);

    // Eventos (+/-)
    adRow.querySelector('.adultPlus').addEventListener('click', ()=>{
      room.adults++;
      renderRooms();
    });
    adRow.querySelector('.adultMinus').addEventListener('click', ()=>{
      if(room.adults>1){
        room.adults--;
        renderRooms();
      }
    });
    chRow.querySelector('.childPlus').addEventListener('click', ()=>{
      room.children++;
      room.childAges.push(0);
      renderRooms();
    });
    chRow.querySelector('.childMinus').addEventListener('click', ()=>{
      if(room.children>0){
        room.children--;
        room.childAges.pop();
        renderRooms();
      }
    });

    roomsContainer.appendChild(block);
  });
}
if (roomsPlus) {
  roomsPlus.addEventListener('click', ()=>{
    roomsData.push({ adults:2, children:0, childAges:[] });
    renderRooms();
  });
}
if (roomsMinus) {
  roomsMinus.addEventListener('click', ()=>{
    if(roomsData.length>1){
      roomsData.pop();
      renderRooms();
    }
  });
}
if (applyQuartos) {
  applyQuartos.addEventListener('click', ()=>{
    let totalA=0, totalC=0;
    for(const r of roomsData){
      totalA+=r.adults;
      totalC+=r.children;
    }
    quartosInput.value = `${roomsData.length} Quarto(s), ${totalA} Adulto(s), ${totalC} Criança(s)`;
    dropdown.classList.remove('active');
  });
}
renderRooms();

/* =========================================
   B) LÓGICA DO CARD E CHAMADA /api/hoteis
========================================= */

// Converte metros string -> "0,8 km"
function convertDistanceToKm(distStr) {
  const meters = parseFloat(distStr) || 0;
  const km = meters / 1000;
  return km.toFixed(1).replace('.', ',') + " km";
}

// Cria o card baseado nos dados (images, stars, etc.)
function createHotelCard(hotelData) {
  const template = document.getElementById("hotelCardTemplate");
  if (!template) return document.createDocumentFragment();
  const clone = template.content.cloneNode(true);

  // Preenche texto
  clone.querySelector(".hotel-name").textContent = hotelData.name || "";
  clone.querySelector(".hotel-address").textContent = hotelData.address || "";
  clone.querySelector(".days-nights").textContent = hotelData.daysNights || "";
  clone.querySelector(".price-starting").textContent= hotelData.priceFrom || "";
  clone.querySelector(".ten-installments").textContent= hotelData.installments || "";

  // Rating (estrelas)
  const starEl = clone.querySelector(".stars");
  starEl.innerHTML = "";
  const r = Math.round(hotelData.ratingStars || 0);
  for(let i=1; i<=5; i++){
    const star = document.createElement("i");
    if(i<=r) star.classList.add("fas","fa-star");
    else star.classList.add("far","fa-star","empty");
    starEl.appendChild(star);
  }
  clone.querySelector(".rating-value").textContent = hotelData.ratingValue || "";

  // Facilities (usando facilitiesMap.js se existir no window)
  const facDiv = clone.querySelector(".facility-icons");
  (hotelData.facilities || []).forEach(f => {
    if (window.facilitiesMap) {
      const found = window.facilitiesMap[f];
      if (found) {
        const iconDiv = document.createElement("div");
        iconDiv.className = "facility-icon";
        iconDiv.innerHTML = found.svg;
        const tt = document.createElement("div");
        tt.className = "tooltip";
        tt.textContent = found.pt;
        iconDiv.appendChild(tt);
        facDiv.appendChild(iconDiv);
      }
    }
  });

  // POIs
  const poiUl = clone.querySelector(".poi-list");
  (hotelData.poiList || []).forEach(p => {
    const li = document.createElement("li");
    const distKm = convertDistanceToKm(p.distance);
    li.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${p.poiName} - ${distKm}`;
    poiUl.appendChild(li);
  });

  // Carrossel
  const track= clone.querySelector(".carousel-track");
  let currentSlide=0;
  (hotelData.images || []).forEach(url=>{
    const slide= document.createElement("div");
    slide.className="carousel-slide";
    slide.innerHTML= `<img src="${url}" alt="Foto do Hotel">`;
    track.appendChild(slide);
  });
  const prevBtn= clone.querySelector(".prev-button");
  const nextBtn= clone.querySelector(".next-button");

  function updateCarousel() {
    const slides= track.querySelectorAll(".carousel-slide");
    if(!slides.length)return;
    const w= slides[0].getBoundingClientRect().width;
    track.style.transform=`translateX(-${currentSlide*w}px)`;
  }
  prevBtn.addEventListener('click', ()=>{
    const slides= track.querySelectorAll(".carousel-slide");
    if(!slides.length)return;
    currentSlide=(currentSlide-1+slides.length)%slides.length;
    updateCarousel();
  });
  nextBtn.addEventListener('click', ()=>{
    const slides= track.querySelectorAll(".carousel-slide");
    if(!slides.length)return;
    currentSlide=(currentSlide+1)%slides.length;
    updateCarousel();
  });
  window.addEventListener('resize', updateCarousel);

  return clone;
}

// Buscar hotéis => chama /api/hoteis no back
async function buscarHoteis() {
  const destination= document.getElementById("destinoHoteis").value || "MCO";
  const range= document.getElementById("dataRangeHoteis").value || "";
  const hotelsListEl= document.getElementById("hotelsList");
  const statusEl= document.getElementById("status");
  const paginationEl= document.getElementById("pagination");

  if(!range) {
    alert("Selecione as datas!");
    return;
  }

  // parse "DD/MM/YYYY to DD/MM/YYYY"
  let checkIn="", checkOut="";
  const parts=range.split(" ");
  if(parts.length>=2){
    checkIn= parts[0];
    checkOut= parts[2]||parts[1];
  }
  // converte p/ "YYYY-MM-DD"
  function toISO(dmy){
    const [d,m,y]= dmy.split("/");
    return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
  }
  const isoIn= toISO(checkIn);
  const isoOut= toISO(checkOut);

  // Rooms
  let query=`?checkIn=${isoIn}&checkOut=${isoOut}&destination=${destination}&rooms=${roomsData.length}&page=1&limit=20`;
  roomsData.forEach((r,i)=>{
    const idx=i+1;
    query+=`&adults${idx}=${r.adults}&children${idx}=${r.children}`;
    // se quisesse childAges? => childrenAges1=...
  });

  hotelsListEl.innerHTML="";
  paginationEl.innerHTML="";
  paginationEl.style.display="none";
  statusEl.textContent="Carregando hotéis...";
  statusEl.style.display="block";

  // Exemplo: /api/hoteis => seu back-end agrupa Booking+Content
  const url = `/api/hoteis${query}`;
  console.log("Chamando backend:", url);

  try {
    const resp= await fetch(url);
    if(!resp.ok) throw new Error("Erro ao buscar /api/hoteis: "+resp.status);
    const data= await resp.json();

    // data => supõe que vem { hotels: [...], totalPages: N, etc. }
    const hotelsArr= data.hotels?.hotels || [];
    if(!hotelsArr.length){
      statusEl.textContent="Nenhum hotel encontrado.";
      return;
    }
    statusEl.style.display="none";

    // Exemplo: se o back já trouxe "hotelObj" formatado
    for(const hotelObj of hotelsArr){
      const cardEl= createHotelCard(hotelObj);
      hotelsListEl.appendChild(cardEl);
    }

    // Exemplo de paginação
    // exibirPaginacao(data.totalPages || 1, 1);

  } catch(e){
    console.error(e);
    statusEl.textContent="Erro ao buscar hotéis. Ver console.";
  }
}

// Função de Paginação (caso queira)
function exibirPaginacao(totalPages, currentPage) {
  const pagEl= document.getElementById("pagination");
  if(totalPages <= 1) return;
  pagEl.style.display="flex";

  if(currentPage>1){
    const btnPrev=document.createElement("button");
    btnPrev.textContent="Anterior";
    btnPrev.onclick=()=> buscarHoteis(currentPage-1);
    pagEl.appendChild(btnPrev);
  }
  if(currentPage<totalPages){
    const btnNext=document.createElement("button");
    btnNext.textContent="Próxima Página";
    btnNext.onclick=()=> buscarHoteis(currentPage+1);
    pagEl.appendChild(btnNext);
  }
}

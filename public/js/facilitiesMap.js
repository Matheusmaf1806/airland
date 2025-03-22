// facilitiesMap.js

// Lista de facilities que não devem ser exibidas na seção principal (serão utilizadas apenas nos blocos adicionais)
const hiddenFacilities = [
  "Year of most recent renovation",
  "Total number of rooms",
  "Number of floors (main building)",
  "Double rooms",
  "Suites",
  "hotel",
  "American Express",
  "EC",
  "JCB",
  "Diners Club",
  "MasterCard",
  "Visa",
  "Visa Electrón",
  "Car hire",
  "Fax",
  "IHG Green Hotel Certificate",
  "Hilton - CleanStay",
  "Twin rooms",
  "Satellite TV",
  "Hi-fi",
  "Welcome pack",
  "Single rooms",
  "Check-in hour",
  "Check-out hour",
  "Car park",
  "Resort Fee"
];

const facilitiesMap = {
  "Year of most recent renovation": {
    pt: "Ano da última renovação",
    icon: "fa-solid fa-history"
  },
  "Number of floors (main building)": {
    pt: "Número de andares (prédio principal)",
    icon: "fa-solid fa-building"
  },
  "Disability-friendly rooms": {
    pt: "Quartos adaptados para pessoas com deficiência",
    icon: "fa-solid fa-wheelchair"
  },
  "American Express": {
    pt: "American Express",
    icon: "fab fa-cc-amex"
  },
  "JCB": {
    pt: "JCB",
    icon: "fab fa-cc-jcb"
  },
  "Diners Club": {
    pt: "Diners Club",
    icon: "fab fa-cc-diners-club"
  },
  "MasterCard": {
    pt: "Mastercard",
    icon: "fab fa-cc-mastercard"
  },
  "Visa": {
    pt: "Visa",
    icon: "fab fa-cc-visa"
  },
  "City centre": {
    pt: "Centro da cidade",
    icon: "fa-solid fa-city"
  },
  "Bus/Train station": {
    pt: "Estação de ônibus/trem",
    icon: "fa-solid fa-bus"
  },
  "Nearest Bus / Metro Stop": {
    pt: "Ponto de ônibus / metrô mais próximo",
    icon: "fa-solid fa-subway"
  },
  "Airport": {
    pt: "Aeroporto",
    icon: "fa-solid fa-plane"
  },
  "Beach": {
    pt: "Praia",
    icon: "fa-solid fa-umbrella-beach"
  },
  "Golf course": {
    pt: "Campo de golfe",
    icon: "fa-solid fa-golf-ball"
  },
  "Entertainment Area": {
    pt: "Área de entretenimento",
    icon: "fa-solid fa-theater-masks"
  },
  "Number of bedrooms": {
    pt: "Número de quartos",
    icon: "fa-solid fa-bed"
  },
  "Living room": {
    pt: "Sala de estar",
    icon: "fa-solid fa-couch"
  },
  "Disability-friendly bathroom": {
    pt: "Banheiro adaptado",
    icon: "fa-solid fa-toilet"
  },
  "Hairdryer": {
    pt: "Secador de cabelo",
    icon: "fa-solid fa-wind"
  },
  "Bathrobes": {
    pt: "Roupões de banho",
    icon: "fa-solid fa-tshirt"
  },
  "Wi-fi": {
    pt: "Wi-Fi",
    icon: "fa-solid fa-wifi"
  },
  "Internet access": {
    pt: "Acesso à internet",
    icon: "fa-solid fa-wifi"
  },
  "Cable TV": {
    pt: "TV a cabo",
    icon: "fa-solid fa-tv"
  },
  "Pay movies": {
    pt: "Filmes pagos",
    icon: "fa-solid fa-film"
  },
  "Alarm clock": {
    pt: "Despertador",
    icon: "fa-solid fa-clock"
  },
  "Safe": {
    pt: "Cofre",
    icon: "fa-solid fa-lock"
  },
  "Wheelchair-accessible": {
    pt: "Acessível para cadeira de rodas",
    icon: "fa-solid fa-wheelchair"
  },
  "Wake-up service": {
    pt: "Serviço de despertar",
    icon: "fa-solid fa-bell"
  },
  "Smoking rooms": {
    pt: "Quartos para fumantes",
    icon: "fa-solid fa-smoking"
  },
  "Extra beds on demand": {
    pt: "Camas extras sob demanda",
    icon: "fa-solid fa-bed"
  },
  "Cot on demand": {
    pt: "Berço sob demanda",
    icon: "fa-solid fa-baby"
  },
  "Car park": {
    pt: "Estacionamento",
    icon: "fa-solid fa-parking"
  },
  "24-hour reception": {
    pt: "Recepção 24h",
    icon: "fa-solid fa-concierge-bell"
  },
  "Check-in hour": {
    pt: "Check-in hour",
    icon: "fa-solid fa-clock"
  },
  "Check-out hour": {
    pt: "Check-out hour",
    icon: "fa-solid fa-clock"
  },
  "Late Check-out": {
    pt: "Late check-out",
    icon: "fa-solid fa-clock"
  },
  "Wired Internet": {
    pt: "Internet com fio",
    icon: "fa-solid fa-network-wired"
  },
  "Secure parking": {
    pt: "Estacionamento seguro",
    icon: "fa-solid fa-lock"
  },
  "Valet parking": {
    pt: "Manobrista",
    icon: "fa-solid fa-car"
  },
  "Room service": {
    pt: "Serviço de quarto",
    icon: "fa-solid fa-concierge-bell"
  },
  "Laundry service": {
    pt: "Serviço de lavanderia",
    icon: "fa-solid fa-tshirt"
  },
  "Launderette": {
    pt: "Lavanderia self-service",
    icon: "fa-solid fa-tshirt"
  },
  "Multilingual staff": {
    pt: "Equipe multilíngue",
    icon: "fa-solid fa-language"
  },
  "24-hour security": {
    pt: "Segurança 24h",
    icon: "fa-solid fa-shield-alt"
  },
  "Air conditioning in public areas": {
    pt: "Ar-condicionado em áreas públicas",
    icon: "fa-solid fa-fan"
  },
  "Fireplace": {
    pt: "Lareira",
    icon: "fa-solid fa-fire"
  },
  "Hotel safe": {
    pt: "Cofre do hotel",
    icon: "fa-solid fa-lock"
  },
  "Lift access": {
    pt: "Acesso por elevador",
    icon: "fa-solid fa-arrow-up"
  },
  "Gym": {
    pt: "Academia",
    icon: "fa-solid fa-dumbbell"
  },
  "Newspapers": {
    pt: "Jornais",
    icon: "fa-solid fa-newspaper"
  },
  "Luggage room": {
    pt: "Depósito de bagagem",
    icon: "fa-solid fa-suitcase"
  },
  "Clothes dryer": {
    pt: "Secadora de roupas",
    icon: "fa-solid fa-tshirt"
  },
  "Bar": {
    pt: "Bar",
    icon: "fa-solid fa-glass-martini-alt"
  },
  "Restaurant": {
    pt: "Restaurante",
    icon: "fa-solid fa-utensils"
  },
  "Non-smoking area": {
    pt: "Área para não fumantes",
    icon: "fa-solid fa-smoking-ban"
  },
  "Smoking area": {
    pt: "Área para fumantes",
    icon: "fa-solid fa-smoking"
  },
  "Highchairs": {
    pt: "Cadeiras altas",
    icon: "fa-solid fa-chair"
  },
  "Poolside snack bar": {
    pt: "Bar de lanches à beira da piscina",
    icon: "fa-solid fa-cocktail"
  },
  "Banquet hall": {
    pt: "Salão de banquetes",
    icon: "fa-solid fa-utensils"
  },
  "Meeting room": {
    pt: "Sala de reuniões",
    icon: "fa-solid fa-door-open"
  },
  "Photocopier": {
    pt: "Fotocopiadora",
    icon: "fa-solid fa-copy"
  },
  "Business centre": {
    pt: "Centro de negócios",
    icon: "fa-solid fa-briefcase"
  },
  "Audio-visual equipment rental": {
    pt: "Aluguel de equipamento audiovisual",
    icon: "fa-solid fa-video"
  },
  "Fax": {
    pt: "Fax",
    icon: "fa-solid fa-fax"
  },
  "Outdoor freshwater pool": {
    pt: "Piscina externa de água doce",
    icon: "fa-solid fa-swimming-pool"
  },
  "Outdoor heated pool": {
    pt: "Piscina externa aquecida",
    icon: "fa-solid fa-swimming-pool"
  },
  "Sun loungers": {
    pt: "Espreguiçadeiras",
    icon: "fa-solid fa-chair"
  },
  "Parasols": {
    pt: "Sombrinhas",
    icon: "fa-solid fa-umbrella"
  },
  "TV lounge": {
    pt: "Sala de TV",
    icon: "fa-solid fa-tv"
  },
  "Breakfast": {
    pt: "Café da manhã",
    icon: "fa-solid fa-coffee"
  },
  "Continental breakfast": {
    pt: "Café da manhã continental",
    icon: "fa-solid fa-mug-hot"
  },
  "Snacks": {
    pt: "Lanches",
    icon: "fa-solid fa-cookie-bite"
  },
  "LGTBIQ friendly": {
    pt: "Amigável para LGTBIQ",
    icon: "fa-solid fa-heart"
  },
  "Deposit on arrival": {
    pt: "Depósito na chegada",
    icon: "fa-solid fa-piggy-bank"
  },
  "Charges for late arrival": {
    pt: "Taxas por chegada tardia",
    icon: "fa-solid fa-money-bill-wave"
  },
  "Identification card at arrival": {
    pt: "Carteira de identidade na chegada",
    icon: "fa-solid fa-id-card"
  },
  "Non-smoking establishment": {
    pt: "Estabelecimento para não fumantes",
    icon: "fa-solid fa-smoking-ban"
  },
  "Minimum check-in age": {
    pt: "Idade mínima para check-in",
    icon: "fa-solid fa-user-check"
  },
  "Jet ski": {
    pt: "Jet ski",
    icon: "fa-solid fa-ship"
  },
  "Windsurfing": {
    pt: "Windsurf",
    icon: "fa-solid fa-wind"
  },
  "Sailing": {
    pt: "Vela",
    icon: "fa-solid fa-ship"
  },
  "Canoeing": {
    pt: "Canoagem",
    icon: "fa-solid fa-water"
  },
  "Fitness": {
    pt: "Academia",
    icon: "fa-solid fa-dumbbell"
  },
  "Horse riding": {
    pt: "Equitação",
    icon: "fa-solid fa-horse"
  },
  "Basketball": {
    pt: "Basquete",
    icon: "fa-solid fa-basketball-ball"
  },
  "Billiards": {
    pt: "Sinuca",
    icon: "fa-solid fa-circle" // Placeholder para sinuca
  },
  "Bowling alley": {
    pt: "Pista de boliche",
    icon: "fa-solid fa-bowling-ball"
  },
  "Tennis": {
    pt: "Tênis",
    icon: "fa-solid fa-table-tennis-paddle-ball"
  },
  "Hilton - CleanStay": {
    pt: "Hilton - CleanStay",
    icon: "fa-solid fa-hotel"
  }
};

function getFacilityData(key) {
  return facilitiesMap[key] || null;
}

function processFacility(item) {
  const mapping = getFacilityData(item);
  if (mapping) {
    const iconElement = document.createElement("i");
    iconElement.className = mapping.icon;
    const container = document.createElement("div");
    container.style.margin = "10px";
    container.innerHTML = `<strong>${mapping.pt}</strong>`;
    container.appendChild(iconElement);
    document.body.appendChild(container);
  } else {
    console.log(item, "não faz parte de facilitiesMap");
  }
}

/**
 * Preenche o container com até 12 facilities válidas.
 * Itens que estiverem na lista de ocultos serão ignorados.
 */
function fillFacilities(facilities) {
  const container = document.getElementById("facilities");
  if (!container) return;
  container.innerHTML = "";
  if (!facilities || facilities.length === 0) return;
  
  let count = 0;
  // Itera por todo o array para exibir 12 itens válidos (ignorando os ocultos)
  for (let i = 0; i < facilities.length && count < 12; i++) {
    const facility = facilities[i];
    const facilityKey = facility.code || facility.description?.content;
    if (hiddenFacilities.includes(facilityKey)) continue;
    const mapping = getFacilityData(facilityKey);
    const displayText = mapping ? mapping.pt : facility.description?.content || facilityKey;
    const iconClass = mapping ? mapping.icon : "fas fa-check";
    container.innerHTML += `<div class="facility"><i class="${iconClass}"></i> ${displayText}</div>`;
    count++;
  }
}

// Exporta as funções para uso (caso seja importado como módulo)
export { facilitiesMap, getFacilityData, processFacility, fillFacilities };

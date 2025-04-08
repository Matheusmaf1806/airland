// scripts/updateLocations.js
import supabase from '../api/supabaseClient.js';
import crypto from 'crypto';
import fetch from 'node-fetch'; // Se estiver usando Node < 18; se estiver usando Node 18+ pode remover essa linha

// Verificação de Debug para saber se as variáveis estão definidas
if (!process.env.SUPABASE_URL) {
  console.error("Erro: A variável de ambiente SUPABASE_URL não foi definida.");
  process.exit(1);
}
if (!process.env.SUPABASE_ANON_KEY) {
  console.error("Erro: A variável de ambiente SUPABASE_ANON_KEY não foi definida.");
  process.exit(1);
}
if (!process.env.API_KEY_HA) {
  console.error("Erro: A variável de ambiente API_KEY_HA não foi definida.");
  process.exit(1);
}
if (!process.env.SECRET_KEY_HA) {
  console.error("Erro: A variável de ambiente SECRET_KEY_HA não foi definida.");
  process.exit(1);
}

// O restante do código segue igual...
const PUBLIC_KEY = process.env.API_KEY_HA;
const PRIVATE_KEY = process.env.SECRET_KEY_HA;

// Função para gerar a assinatura (X-Signature)
function generateSignature() {
  const utcDate = Math.floor(Date.now() / 1000);
  const assembly = PUBLIC_KEY + PRIVATE_KEY + utcDate;
  const hash = crypto.createHash('sha256').update(assembly).digest('hex');
  return { signature: hash, utcDate };
}

// Lista de países (exemplo; você pode expandir conforme necessário)
const countries = [
  { code: "AL", name: "Albania" },
  { code: "AD", name: "Andorra" },
  { code: "AO", name: "Angola" },
  { code: "AI", name: "Anguilla" },
  { code: "AG", name: "Antigua & Barbuda" },
  { code: "AR", name: "Argentina" },
  { code: "AM", name: "Armenia" },
  { code: "AW", name: "Aruba" },
  { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" },
  { code: "AZ", name: "Azerbaijan" },
  { code: "BS", name: "Bahamas" },
  { code: "BH", name: "Bahrain" },
  { code: "BB", name: "Barbados" },
  { code: "BE", name: "Belgium" },
  { code: "BZ", name: "Belize" },
  { code: "BT", name: "Bhutan" },
  { code: "BO", name: "Bolivia" },
  { code: "BA", name: "Bosnia & Herzegovina" },
  { code: "BW", name: "Botswana" },
  { code: "BR", name: "Brazil" },
  { code: "VG", name: "British Virgin Islands" },
  { code: "BN", name: "Brunei" },
  { code: "BG", name: "Bulgaria" },
  { code: "KH", name: "Cambodia" },
  { code: "CA", name: "Canada" },
  { code: "CV", name: "Cape Verde" },
  { code: "BK", name: "Caribbean Netherlands" },
  { code: "KY", name: "Cayman Islands" },
  { code: "CL", name: "Chile" },
  { code: "CN", name: "China" },
  { code: "CO", name: "Colombia" },
  { code: "CK", name: "Cook Islands" },
  { code: "CR", name: "Costa Rica" },
  { code: "HR", name: "Croatia" },
  { code: "C0", name: "Curaçao" },
  { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czech Republic" },
  { code: "DK", name: "Denmark" },
  { code: "DO", name: "Dominican Republic" },
  { code: "EC", name: "Ecuador" },
  { code: "EG", name: "Egypt" },
  { code: "SV", name: "El Salvador" },
  { code: "EE", name: "Estonia" },
  { code: "ET", name: "Ethiopia" },
  { code: "FJ", name: "Fiji" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "PF", name: "French Polynesia" },
  { code: "GM", name: "Gambia" },
  { code: "GE", name: "Georgia" },
  { code: "DE", name: "Germany" },
  { code: "GH", name: "Ghana" },
  { code: "GR", name: "Greece" },
  { code: "GD", name: "Grenada" },
  { code: "GP", name: "Guadeloupe" },
  { code: "GT", name: "Guatemala" },
  { code: "HN", name: "Honduras" },
  { code: "HK", name: "Hong Kong – China" },
  { code: "HU", name: "Hungary" },
  { code: "IS", name: "Iceland" },
  { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" },
  { code: "IE", name: "Ireland" },
  { code: "IL", name: "Israel" },
  { code: "IT", name: "Italy" },
  { code: "CI", name: "Ivory Coast" },
  { code: "JM", name: "Jamaica" },
  { code: "JP", name: "Japan" },
  { code: "JO", name: "Jordan" },
  { code: "KE", name: "Kenya" },
  { code: "KW", name: "Kuwait" },
  { code: "LA", name: "Laos" },
  { code: "LV", name: "Latvia" },
  { code: "LB", name: "Lebanon" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "MO", name: "Macau - China" },
  { code: "MK", name: "Macedonia (FYROM)" },
  { code: "MG", name: "Madagascar" },
  { code: "MW", name: "Malawi" },
  { code: "MY", name: "Malaysia" },
  { code: "MV", name: "Maldives" },
  { code: "MT", name: "Malta" },
  { code: "MU", name: "Mauritius" },
  { code: "MX", name: "Mexico" },
  { code: "MD", name: "Moldova" },
  { code: "MC", name: "Monaco" },
  { code: "ME", name: "Montenegro" },
  { code: "MA", name: "Morocco" },
  { code: "MZ", name: "Mozambique" },
  { code: "MM", name: "Myanmar (Burma)" },
  { code: "NA", name: "Namibia" },
  { code: "NP", name: "Nepal" },
  { code: "NL", name: "Netherlands" },
  { code: "NZ", name: "New Zealand" },
  { code: "NI", name: "Nicaragua" },
  { code: "NY", name: "Northern Cyprus" },
  { code: "NO", name: "Norway" },
  { code: "OM", name: "Oman" },
  { code: "PA", name: "Panama" },
  { code: "PY", name: "Paraguay" },
  { code: "PE", name: "Peru" },
  { code: "PH", name: "Philippines" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "PR", name: "Puerto Rico" },
  { code: "QA", name: "Qatar" },
  { code: "RE", name: "Réunion" },
  { code: "RO", name: "Romania" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "SN", name: "Senegal" },
  { code: "RS", name: "Serbia" },
  { code: "SC", name: "Seychelles" },
  { code: "SG", name: "Singapore" },
  { code: "SF", name: "Sint Maarten" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "ZA", name: "South Africa" },
  { code: "KR", name: "South Korea" },
  { code: "ES", name: "Spain" },
  { code: "LK", name: "Sri Lanka" },
  { code: "KN", name: "St. Kitts & Nevis" },
  { code: "LC", name: "St. Lucia" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "TW", name: "Taiwan – China" },
  { code: "TZ", name: "Tanzania" },
  { code: "TH", name: "Thailand" },
  { code: "TT", name: "Trinidad & Tobago" },
  { code: "TN", name: "Tunisia" },
  { code: "TR", name: "Turkey" },
  { code: "TC", name: "Turks & Caicos Islands" },
  { code: "VI", name: "U.S. Virgin Islands" },
  { code: "UG", name: "Uganda" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "UK", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "UY", name: "Uruguay" },
  { code: "VE", name: "Venezuela" },
  { code: "VN", name: "Vietnam" },
  { code: "ZM", name: "Zambia" },
  { code: "ZW", name: "Zimbabwe" }
];

// Função para extrair cidade, estado e código do estado a partir do nome do destino  
function parseDestinationName(name) {
  const parts = name.split(' - ');
  if (parts.length >= 3) {
    const stateCode = parts[parts.length - 1].trim();
    const stateName = parts[parts.length - 2].trim();
    const cityName = parts.slice(0, parts.length - 2).join(' - ').trim();
    return { cityName, stateName, stateCode };
  } else {
    return { cityName: name, stateName: null, stateCode: null };
  }
}

// Função principal para processar os países e inserir destinos na tabela 'locations'
async function processDestinations() {
  for (const country of countries) {
    try {
      const { signature } = generateSignature();
      const url = `https://api.test.hotelbeds.com/activity-content-api/3.0/destinations/en/${country.code}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Api-key': process.env.API_KEY_HA, // ou PUBLIC_KEY
          'X-Signature': signature,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error(`Erro ao buscar destinos para ${country.name}: ${response.statusText}`);
        continue;
      }
      
      const data = await response.json();
      const destinations = data?.country?.destinations;
      if (!destinations || !destinations.length) {
        console.log(`Nenhum destino encontrado para ${country.name}`);
        continue;
      }

      for (const destination of destinations) {
        const { cityName, stateName, stateCode } = parseDestinationName(destination.name);
        const payload = {
          country_name: country.name,
          country_code: country.code,
          state_name: stateName,
          state_code: stateCode,
          city_name: cityName,
          city_code: destination.code
        };

        const { error } = await supabase
          .from('locations')
          .insert(payload);
        if (error) {
          console.error(`Erro ao inserir destino ${destination.name}:`, error);
        } else {
          console.log(`Inserido: ${payload.city_name} (${payload.city_code}) - ${payload.state_name}`);
        }
      }
    } catch (err) {
      console.error(`Erro no processamento de ${country.name}:`, err);
    }
  }
}

processDestinations()
  .then(() => {
    console.log("Processamento concluído!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Erro geral:", err);
    process.exit(1);
  });

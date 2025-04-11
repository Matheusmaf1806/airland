// public/js/calcomuni.js

/**
 * Cria um calendário de data única, buscando preços reais para cada data do mês
 * usando a rota /api/tickets?activityCode=...&start_date=...&end_date=....
 *
 * @param {object} options - Objeto de opções, ex: { activityCode: "XYZ" }
 * @returns {object} - { element, getSelectedDate, btnBack, btnApply, selectYear, selectMonth }
 */
export async function createSingleDateCalendar(options = {}) {
  const { activityCode } = options;  // activityCode para buscar dados reais

  // ========== Criação da Estrutura do Calendário ==========
  const calendarEl = document.createElement("div");
  calendarEl.classList.add("calendar");

  // Container de opções - Selects para mês e ano
  const opts = document.createElement("div");
  opts.classList.add("calendar__opts");

  const selectMonth = document.createElement("select");
  selectMonth.id = "calendar__month";

  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  meses.forEach((mes, idx) => {
    const option = document.createElement("option");
    option.value = idx;
    option.textContent = mes;
    selectMonth.appendChild(option);
  });

  const selectYear = document.createElement("select");
  selectYear.id = "calendar__year";
  const currentYear = new Date().getFullYear();
  [currentYear, currentYear + 1].forEach(year => {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    selectYear.appendChild(option);
  });

  opts.appendChild(selectMonth);
  opts.appendChild(selectYear);
  calendarEl.appendChild(opts);

  // Corpo do calendário (dias da semana + datas)
  const bodyEl = document.createElement("div");
  bodyEl.classList.add("calendar__body");

  // Rótulos dos dias (começando em segunda)
  const daysEl = document.createElement("div");
  daysEl.classList.add("calendar__days");
  const dayLabels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  dayLabels.forEach(day => {
    const dayDiv = document.createElement("div");
    dayDiv.textContent = day;
    daysEl.appendChild(dayDiv);
  });
  bodyEl.appendChild(daysEl);

  // Container para as datas
  const datesEl = document.createElement("div");
  datesEl.classList.add("calendar__dates");
  datesEl.id = "calendar__dates";
  bodyEl.appendChild(datesEl);
  calendarEl.appendChild(bodyEl);

  // Botões (Voltar/Confirmar)
  const buttonsEl = document.createElement("div");
  buttonsEl.classList.add("calendar__buttons");
  const btnBack = document.createElement("button");
  btnBack.className = "calendar__button calendar__button--grey";
  btnBack.textContent = "Voltar";
  const btnApply = document.createElement("button");
  btnApply.className = "calendar__button calendar__button--primary";
  btnApply.textContent = "Confirmar";
  buttonsEl.appendChild(btnBack);
  buttonsEl.appendChild(btnApply);
  calendarEl.appendChild(buttonsEl);

  // ========== Variáveis / Funções Auxiliares ==========
  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }
  function getWeekDayIndex(date) {
    // Ajusta para segunda-feira = 0
    return (date.getDay() + 6) % 7;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let selectedDate = null;
  let clickableDates = [];

  // Função que faz o fetch dos preços reais para (activityCode, intervalo do mês)
  async function getPricesForMonth(activityCode, year, month) {
    if (!activityCode) return {};  // Se não houver activityCode, não faz busca
    const start_date = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const lastDay = getDaysInMonth(year, month);
    const end_date = `${year}-${String(month + 1).padStart(2, "0")}-${lastDay}`;

    try {
      // Rota que retorna todos os registros entre start_date e end_date
      const response = await fetch(
        `/api/tickets?activityCode=${activityCode}&start_date=${start_date}&end_date=${end_date}`
      );
      const data = await response.json();
      // Mapeamento "YYYY-MM-DD" -> amount_adult
      const mapping = {};
      data.forEach(item => {
        // Exemplo: se a coluna de data no BD for "date"
        // item.date deve conter "2025-04-15", etc.
        // e item.amount_adult é o preço de adulto
        mapping[item.date] = item.amount_adult;
      });
      return mapping;
    } catch (err) {
      console.error("Erro ao buscar preços do mês:", err);
      return {};
    }
  }

  // Constrói o calendário para um mês/ano específicos
  async function buildCalendar(year, month) {
    datesEl.innerHTML = "";
    clickableDates = [];

    // Pega o mapeamento de preços (caso haja activityCode)
    let priceMapping = {};
    if (activityCode) {
      priceMapping = await getPricesForMonth(activityCode, year, month);
    }

    const totalDays = getDaysInMonth(year, month);
    const firstDay = new Date(year, month, 1);
    const startWeekIndex = getWeekDayIndex(firstDay);
    const totalCells = 42; // 6 linhas x 7 colunas
    let daysArray = [];

    // Dias do mês anterior para preencher o início do grid
    if (startWeekIndex > 0) {
      let prevMonth = month - 1;
      let prevYear = year;
      if (prevMonth < 0) {
        prevMonth = 11;
        prevYear--;
      }
      const totalDaysPrev = getDaysInMonth(prevYear, prevMonth);
      for (let i = startWeekIndex; i > 0; i--) {
        const dayNum = totalDaysPrev - i + 1;
        daysArray.push({
          day: dayNum,
          inCurrent: false,
          date: new Date(prevYear, prevMonth, dayNum)
        });
      }
    }

    // Dias do mês atual
    for (let d = 1; d <= totalDays; d++) {
      daysArray.push({
        day: d,
        inCurrent: true,
        date: new Date(year, month, d)
      });
    }

    // Dias do próximo mês para preencher as 42 células
    const remaining = totalCells - daysArray.length;
    if (remaining > 0) {
      let nextMonth = month + 1;
      let nextYear = year;
      if (nextMonth > 11) {
        nextMonth = 0;
        nextYear++;
      }
      for (let d = 1; d <= remaining; d++) {
        daysArray.push({
          day: d,
          inCurrent: false,
          date: new Date(nextYear, nextMonth, d)
        });
      }
    }

    // Renderiza cada célula
    daysArray.forEach(obj => {
      const cell = document.createElement("div");
      cell.classList.add("calendar__date");
      if (!obj.inCurrent || obj.date < today) {
        cell.classList.add("calendar__date--grey");
      }
      const inner = document.createElement("div");
      inner.classList.add("date-content");
      const daySpan = document.createElement("span");
      daySpan.textContent = obj.day;

      const priceSpan = document.createElement("span");
      priceSpan.classList.add("calendar__price");

      // Monta a data no formato YYYY-MM-DD para procurar em priceMapping
      const formattedDate = obj.date.toISOString().split("T")[0];
      if (obj.inCurrent && priceMapping[formattedDate] !== undefined) {
        const price = priceMapping[formattedDate];
        priceSpan.textContent = price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      } else if (obj.inCurrent) {
        // Se está dentro do mês mas não tem preço no mapeamento
        priceSpan.textContent = "Indisponível";
      } else {
        // Fora do mês atual
        priceSpan.textContent = "";
      }

      inner.appendChild(daySpan);
      inner.appendChild(priceSpan);
      cell.appendChild(inner);

      // Se está no mês atual e não é antes de hoje, permite clicar
      if (obj.date >= today && obj.inCurrent) {
        clickableDates.push(cell);
        cell.addEventListener("click", () => {
          clickableDates.forEach(c => c.classList.remove("calendar__date--range"));
          cell.classList.add("calendar__date--range");
          selectedDate = obj.date;
        });
      }

      datesEl.appendChild(cell);
    });
  }

  // Sempre que user muda mês/ano, refaz buildCalendar
  async function onChangeMonthYear() {
    const year = parseInt(selectYear.value, 10);
    const month = parseInt(selectMonth.value, 10);
    await buildCalendar(year, month);
  }

  selectMonth.addEventListener("change", onChangeMonthYear);
  selectYear.addEventListener("change", onChangeMonthYear);

  // Inicia no mês atual
  selectYear.value = today.getFullYear();
  selectMonth.value = today.getMonth();
  await buildCalendar(today.getFullYear(), today.getMonth());

  return {
    element: calendarEl,
    getSelectedDate: () => selectedDate,
    btnBack,
    btnApply,
    selectYear,
    selectMonth
  };
}

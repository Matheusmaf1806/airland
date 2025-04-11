// public/js/calcomuni.js
// Agora a função recebe um objeto de opções, por exemplo, { activityCode: "XYZ" }
export async function createSingleDateCalendar(options = {}) {
  const { activityCode } = options;

  // Cria a estrutura do calendário (elemento principal, selects, corpo, etc.)
  const calendarEl = document.createElement("div");
  calendarEl.classList.add("calendar");

  // --- Configuração dos selects de mês e ano ---
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

  // --- Corpo do calendário ---
  const bodyEl = document.createElement("div");
  bodyEl.classList.add("calendar__body");

  // Rótulos dos dias (começa em segunda)
  const daysEl = document.createElement("div");
  daysEl.classList.add("calendar__days");
  const dayLabels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  dayLabels.forEach(day => {
    const dayDiv = document.createElement("div");
    dayDiv.textContent = day;
    daysEl.appendChild(dayDiv);
  });
  bodyEl.appendChild(daysEl);

  const datesEl = document.createElement("div");
  datesEl.classList.add("calendar__dates");
  datesEl.id = "calendar__dates";
  bodyEl.appendChild(datesEl);
  calendarEl.appendChild(bodyEl);

  // --- Botões (Voltar e Confirmar) ---
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

  // --- Funções auxiliares ---
  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }
  function getWeekDayIndex(date) {
    return (date.getDay() + 6) % 7;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let selectedDate = null;
  let clickableDates = [];

  // --- Função para buscar preços reais para o mês corrente ---
  async function getPricesForMonth(activityCode, year, month) {
    if (!activityCode) return {}; // se não houver activityCode, retorna vazio
    // Formata o início e fim do mês (YYYY-MM-DD)
    const start_date = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const lastDay = getDaysInMonth(year, month);
    const end_date = `${year}-${String(month + 1).padStart(2, "0")}-${lastDay}`;
    try {
      // Faz a requisição à API; essa rota precisa estar preparada para receber start_date e end_date
      const response = await fetch(`/api/tickets?activityCode=${activityCode}&start_date=${start_date}&end_date=${end_date}`);
      const data = await response.json();
      // Monta um mapeamento: data (YYYY-MM-DD) -> amount_adult
      const mapping = {};
      data.forEach(item => {
        mapping[item.date] = item.amount_adult;
      });
      return mapping;
    } catch (err) {
      console.error("Erro ao buscar preços do mês:", err);
      return {};
    }
  }

  // --- Função para construir o calendário com os preços reais ---
  async function buildCalendar(year, month) {
    datesEl.innerHTML = "";
    clickableDates = [];

    // Busca o mapeamento de preços para o mês atual (se activityCode for informado)
    let priceMapping = {};
    if (activityCode) {
      priceMapping = await getPricesForMonth(activityCode, year, month);
    }

    const totalDays = getDaysInMonth(year, month);
    const firstDay = new Date(year, month, 1);
    const startWeekIndex = getWeekDayIndex(firstDay);
    const totalCells = 42;
    let daysArray = [];

    // Dias do mês anterior
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

    // Dias do próximo mês para completar as 42 células
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

      // Formata a data como YYYY-MM-DD para consulta no mapeamento
      const formattedDate = obj.date.toISOString().split("T")[0];
      if (obj.inCurrent && priceMapping[formattedDate] !== undefined) {
        const price = priceMapping[formattedDate];
        priceSpan.textContent = price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      } else if (obj.inCurrent) {
        priceSpan.textContent = "Indisponível";
      } else {
        priceSpan.textContent = "";
      }

      inner.appendChild(daySpan);
      inner.appendChild(priceSpan);
      cell.appendChild(inner);

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

  // Eventos dos selects — refaz o calendário com nova busca
  async function onChangeMonthYear() {
    const year = parseInt(selectYear.value, 10);
    const month = parseInt(selectMonth.value, 10);
    await buildCalendar(year, month);
  }
  selectMonth.addEventListener("change", onChangeMonthYear);
  selectYear.addEventListener("change", onChangeMonthYear);

  // Inicializa no mês vigente
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

// public/js/calcomuni.js

/**
 * Cria um calendário que exibe as datas com os preços reais obtidos da API.
 * A função espera um objeto de opções; exemplo: { activityCode: "XYZ" }.
 *
 * Para cada mês, ela faz uma requisição para obter os registros entre o primeiro e o último dia,
 * monta um mapeamento onde cada data (no formato YYYY-MM-DD) se associa ao preço real (amount_adult),
 * e renderiza o calendário com essas informações.
 *
 * @param {object} options - Objeto de opções (ex: { activityCode: "XYZ" }).
 * @returns {object} - Retorna { element, getSelectedDate, btnBack, btnApply, selectYear, selectMonth }.
 */
export async function createSingleDateCalendar(options = {}) {
  const { activityCode } = options;

  // Criação da estrutura principal do calendário
  const calendarEl = document.createElement("div");
  calendarEl.classList.add("calendar");

  // ====== Configuração dos selects de mês e ano ======
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
  // Permite selecionar o ano corrente e o próximo
  [currentYear, currentYear + 1].forEach(year => {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    selectYear.appendChild(option);
  });

  opts.appendChild(selectMonth);
  opts.appendChild(selectYear);
  calendarEl.appendChild(opts);

  // ====== Corpo do calendário ======
  const bodyEl = document.createElement("div");
  bodyEl.classList.add("calendar__body");

  // Rótulos dos dias, começando em segunda-feira
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

  // ====== Botões ======
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

  // ====== Funções Auxiliares ======
  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }
  function getWeekDayIndex(date) {
    // Ajusta para que a semana comece em segunda-feira (segunda = 0)
    return (date.getDay() + 6) % 7;
  }

  // Define o dia de hoje, sem horário
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let selectedDate = null;
  let clickableDates = [];

  // ====== Busca dos Preços Reais para o Mês ======
  async function getPricesForMonth(activityCode, year, month) {
    if (!activityCode) return {}; // Se não houver activityCode, retorna mapeamento vazio
    const start_date = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const lastDay = getDaysInMonth(year, month);
    const end_date = `${year}-${String(month + 1).padStart(2, "0")}-${lastDay}`;
    try {
      const response = await fetch(
        `/api/tickets?activityCode=${activityCode}&start_date=${start_date}&end_date=${end_date}`
      );
      const data = await response.json();
      // Constrói um mapeamento: { "YYYY-MM-DD": amount_adult, ... }
      const mapping = {};
      data.forEach(item => {
        // Assume que o campo 'date' já vem no formato "YYYY-MM-DD"
        mapping[item.date] = item.amount_adult;
      });
      return mapping;
    } catch (err) {
      console.error("Erro ao buscar preços do mês:", err);
      return {};
    }
  }

  // ====== Construção do Calendário ======
  async function buildCalendar(year, month) {
    datesEl.innerHTML = "";
    clickableDates = [];

    // Busca os preços reais para o mês, se activityCode estiver definido
    let priceMapping = {};
    if (activityCode) {
      priceMapping = await getPricesForMonth(activityCode, year, month);
    }

    const totalDays = getDaysInMonth(year, month);
    const firstDay = new Date(year, month, 1);
    const startWeekIndex = getWeekDayIndex(firstDay);
    const totalCells = 42; // 6 linhas x 7 colunas
    let daysArray = [];

    // Preenche dias do mês anterior para alinhamento no grid
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

    // Renderiza cada célula do calendário
    daysArray.forEach(obj => {
      const cell = document.createElement("div");
      cell.classList.add("calendar__date");
      // Se a data não pertence ao mês atual ou for anterior a hoje, marca como desabilitada (cinza)
      if (!obj.inCurrent || obj.date < today) {
        cell.classList.add("calendar__date--grey");
      }
      const inner = document.createElement("div");
      inner.classList.add("date-content");
      const daySpan = document.createElement("span");
      daySpan.textContent = obj.day;
      const priceSpan = document.createElement("span");
      priceSpan.classList.add("calendar__price");

      // Formata a data no formato "YYYY-MM-DD"
      const formattedDate = obj.date.toISOString().split("T")[0];
      if (obj.inCurrent && priceMapping[formattedDate] !== undefined) {
        // Exibe o preço sem centavos
        const price = priceMapping[formattedDate];
        priceSpan.textContent = price.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        });
        // Permite que a célula seja clicável
        clickableDates.push(cell);
        cell.addEventListener("click", () => {
          clickableDates.forEach(c => c.classList.remove("calendar__date--range"));
          cell.classList.add("calendar__date--range");
          selectedDate = obj.date;
        });
      } else if (obj.inCurrent) {
        // Se não houver preço para o dia, não exibe nada
        priceSpan.textContent = "";
        // Garante a aparência desabilitada (cinza) sem adicionar evento de clique
        cell.classList.add("calendar__date--grey");
      } else {
        priceSpan.textContent = "";
      }

      inner.appendChild(daySpan);
      inner.appendChild(priceSpan);
      cell.appendChild(inner);

      datesEl.appendChild(cell);
    });
  }

  // Atualiza o calendário sempre que o usuário mudar o mês ou o ano
  async function onChangeMonthYear() {
    const year = parseInt(selectYear.value, 10);
    const month = parseInt(selectMonth.value, 10);
    await buildCalendar(year, month);
  }
  selectMonth.addEventListener("change", onChangeMonthYear);
  selectYear.addEventListener("change", onChangeMonthYear);

  // Inicializa o calendário no mês vigente
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

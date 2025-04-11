// public/js/calcomuni.js
export function createSingleDateCalendar(basePrice) {
  // =================== 1) Criação da Estrutura do Calendário ===================
  const calendarEl = document.createElement("div");
  calendarEl.classList.add("calendar");

  // Container de opções – selects para mês e ano
  const opts = document.createElement("div");
  opts.classList.add("calendar__opts");

  // Select de mês
  const selectMonth = document.createElement("select");
  selectMonth.id = "calendar__month";
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  meses.forEach((mes, idx) => {
    const option = document.createElement("option");
    option.value = idx;
    option.textContent = mes;
    selectMonth.appendChild(option);
  });

  // Select de ano – usamos o ano atual e o próximo
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

  // =================== Corpo do Calendário ===================
  const bodyEl = document.createElement("div");
  bodyEl.classList.add("calendar__body");

  // Linha dos rótulos dos dias (inicia em segunda)
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

  // =================== Botões "Voltar" e "Confirmar" ===================
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

  // =================== 2) Funções Auxiliares ===================
  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }
  // Faz a semana começar na segunda (0 = segunda, 6 = domingo)
  function getWeekDayIndex(date) {
    return (date.getDay() + 6) % 7;
  }

  // =================== 3) Configuração da Data Atual ===================
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let selectedDate = null;
  let clickableDates = [];

  // =================== 4) Construção do Calendário ===================
  function buildCalendar(year, month) {
    datesEl.innerHTML = "";
    clickableDates = [];

    const totalDays = getDaysInMonth(year, month);
    const firstDay = new Date(year, month, 1);
    const startWeekIndex = getWeekDayIndex(firstDay);
    const totalCells = 42; // Grade de 6 linhas x 7 células
    let daysArray = [];

    // Dias do mês anterior (preenche o início da grade)
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
      // Se a data não pertence ao mês atual ou é anterior a hoje, deixa grisinha
      if (!obj.inCurrent || obj.date < today) {
        cell.classList.add("calendar__date--grey");
      }
      // Cria o conteúdo: o número do dia e o preço
      const inner = document.createElement("div");
      inner.classList.add("date-content");
      const daySpan = document.createElement("span");
      daySpan.textContent = obj.day;
      const priceSpan = document.createElement("span");
      priceSpan.classList.add("calendar__price");
      // Use o preço base passado (basePrice) – o mesmo para todos os dias
      priceSpan.textContent = basePrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      inner.appendChild(daySpan);
      inner.appendChild(priceSpan);
      cell.appendChild(inner);
  
      // Se a data é válida (>= hoje) torna a célula clicável
      if (obj.date >= today) {
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
  
  // =================== 5) Atualiza o Calendário com os Selects ===================
  function onChangeMonthYear() {
    const year = parseInt(selectYear.value, 10);
    const month = parseInt(selectMonth.value, 10);
    buildCalendar(year, month);
  }
  selectMonth.addEventListener("change", onChangeMonthYear);
  selectYear.addEventListener("change", onChangeMonthYear);
  
  // =================== 6) Inicialização no Mês Vigente ===================
  selectYear.value = today.getFullYear();
  selectMonth.value = today.getMonth();
  buildCalendar(today.getFullYear(), today.getMonth());
  
  // =================== 7) Retorno do Componente ===================
  return {
    element: calendarEl,
    getSelectedDate: () => selectedDate,
    btnBack,
    btnApply,
    selectYear,
    selectMonth
  };
}

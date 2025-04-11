// calendarComponent.js

export function createCalendarComponent() {
  // Cria o contêiner principal do calendário
  const calendarEl = document.createElement("div");
  calendarEl.classList.add("calendar");

  // ----- Cria a seção de opções (selects de mês e ano) -----
  const opts = document.createElement("div");
  opts.classList.add("calendar__opts");

  const selectMonth = document.createElement("select");
  selectMonth.id = "calendar__month";
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  months.forEach((m, index) => {
    const opt = document.createElement("option");
    opt.value = index;
    opt.textContent = m;
    selectMonth.appendChild(opt);
  });

  const selectYear = document.createElement("select");
  selectYear.id = "calendar__year";
  // Apenas os anos 2025 e 2026
  [2025, 2026].forEach(y => {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    selectYear.appendChild(opt);
  });

  opts.appendChild(selectMonth);
  opts.appendChild(selectYear);
  calendarEl.appendChild(opts);

  // ----- Cria o corpo do calendário (dias da semana e datas) -----
  const bodyEl = document.createElement("div");
  bodyEl.classList.add("calendar__body");

  // Dias da semana (iniciando em segunda)
  const daysEl = document.createElement("div");
  daysEl.classList.add("calendar__days");
  const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  days.forEach(d => {
    const dayDiv = document.createElement("div");
    dayDiv.textContent = d;
    daysEl.appendChild(dayDiv);
  });
  bodyEl.appendChild(daysEl);

  // Container de datas
  const datesEl = document.createElement("div");
  datesEl.classList.add("calendar__dates");
  datesEl.id = "calendar__dates";
  bodyEl.appendChild(datesEl);

  calendarEl.appendChild(bodyEl);

  // ----- Cria a seção de botões -----
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

  // ----- Funções de construção do calendário e lógica de seleção -----
  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  function getWeekDayIndex(date) {
    return (date.getDay() + 6) % 7;
  }

  let globalClickableDates = [];
  let startSelected = null, endSelected = null;

  function buildCalendar(year, month) {
    datesEl.innerHTML = "";
    globalClickableDates = [];
    const totalDaysCurrent = getDaysInMonth(year, month);
    const firstDay = new Date(year, month, 1);
    const startWeekIndex = getWeekDayIndex(firstDay);
    const totalCells = 42; // 6 linhas x 7 colunas
    let daysArray = [];

    // Dias do mês anterior (se o primeiro dia não for segunda)
    if (startWeekIndex > 0) {
      let prevMonth = month - 1;
      let prevYear = year;
      if (prevMonth < 0) {
        prevMonth = 11;
        prevYear--;
      }
      const totalDaysPrev = getDaysInMonth(prevYear, prevMonth);
      for (let i = startWeekIndex; i > 0; i--) {
        let dayNum = totalDaysPrev - i + 1;
        daysArray.push({
          day: dayNum,
          inCurrent: false,
          date: new Date(prevYear, prevMonth, dayNum)
        });
      }
    }

    // Dias do mês atual
    for (let d = 1; d <= totalDaysCurrent; d++) {
      daysArray.push({
        day: d,
        inCurrent: true,
        date: new Date(year, month, d)
      });
    }

    // Dias do próximo mês para completar 42 células
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

    // Define referência de amanhã (para não permitir seleção de datas anteriores a amanhã)
    let today = new Date();
    today.setHours(0, 0, 0, 0);
    let tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Renderiza as células
    daysArray.forEach(obj => {
      const cell = document.createElement("div");
      cell.classList.add("calendar__date");
      if (!obj.inCurrent) {
        cell.classList.add("calendar__date--grey");
      }
      // Se a data for anterior a amanhã, marca como desabilitada (cinza)
      if (obj.date < tomorrow) {
        cell.classList.add("calendar__date--grey");
      }
      
      // Cria o container para dia e preço
      const container = document.createElement("div");
      container.classList.add("date-content");
      const daySpan = document.createElement("span");
      daySpan.textContent = obj.day;
      // Exemplo de cálculo de preço
      let rawPrice = 30 + obj.day;
      const priceSpan = document.createElement("span");
      priceSpan.classList.add("calendar__price");
      priceSpan.textContent = rawPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      
      container.appendChild(daySpan);
      container.appendChild(priceSpan);
      cell.appendChild(container);

      // Torna a célula clicável se a data for >= tomorrow (mesmo que não seja do mês corrente)
      if (obj.date >= tomorrow) {
        globalClickableDates.push(cell);
        cell.addEventListener("click", function() {
          handleDateClick(cell, globalClickableDates);
        });
      }
      
      datesEl.appendChild(cell);
    });
  }

  function clearRange(clickableDates) {
    clickableDates.forEach(el => {
      el.classList.remove("calendar__date--selected", "calendar__date--first-date", "calendar__date--range-start", "calendar__date--last-date", "calendar__date--range-end");
    });
    startSelected = null;
    endSelected = null;
  }

  function handleDateClick(clickedEl, clickableDates) {
    if (startSelected !== null && endSelected !== null) {
      clearRange(clickableDates);
    }
    const index = clickableDates.indexOf(clickedEl);
    if (startSelected === null) {
      startSelected = index;
      clickedEl.classList.add("calendar__date--selected", "calendar__date--first-date", "calendar__date--range-start");
    } else if (startSelected !== null && endSelected === null) {
      if (index === startSelected) {
        clickedEl.classList.remove("calendar__date--selected", "calendar__date--first-date", "calendar__date--range-start");
        startSelected = null;
        return;
      }
      endSelected = index;
      const startPos = Math.min(startSelected, endSelected);
      const endPos = Math.max(startSelected, endSelected);
      clickableDates.forEach((el, i) => {
        if (i === startPos) {
          el.classList.add("calendar__date--selected", "calendar__date--first-date", "calendar__date--range-start");
        } else if (i === endPos) {
          el.classList.add("calendar__date--selected", "calendar__date--last-date", "calendar__date--range-end");
        } else if (i > startPos && i < endPos) {
          el.classList.add("calendar__date--selected");
        }
      });
    }
  }

  function onChangeMonthYear() {
    const year = parseInt(selectYear.value, 10);
    const month = parseInt(selectMonth.value, 10);
    startSelected = null;
    endSelected = null;
    buildCalendar(year, month);
    
    // Se o calendário exibido for do mesmo mês/ano de amanhã, pré-seleciona a célula de amanhã
    let today = new Date();
    today.setHours(0, 0, 0, 0);
    let tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (year === tomorrow.getFullYear() && month === tomorrow.getMonth()) {
      for (let i = 0; i < globalClickableDates.length; i++) {
        const cell = globalClickableDates[i];
        const cellDay = parseInt(cell.querySelector(".date-content span").textContent, 10);
        if (cellDay === tomorrow.getDate()) {
          cell.classList.add("calendar__date--selected", "calendar__date--first-date", "calendar__date--range-start");
          startSelected = i;
          break;
        }
      }
    }
  }

  selectMonth.addEventListener("change", onChangeMonthYear);
  selectYear.addEventListener("change", onChangeMonthYear);
  onChangeMonthYear();

  // Retorna o componente para que ele possa ser inserido na página
  return calendarEl;
}

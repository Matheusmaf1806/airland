// calcom.js
export function createSingleDateCalendar() {
  const calendarEl = document.createElement("div");
  calendarEl.classList.add("calendar");

  // Cria a área de opções (selects)
  const opts = document.createElement("div");
  opts.classList.add("calendar__opts");

  const selectMonth = document.createElement("select");
  selectMonth.id = "calendar__month";
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  meses.forEach((m, idx) => {
    const opt = document.createElement("option");
    opt.value = idx;
    opt.textContent = m;
    selectMonth.appendChild(opt);
  });

  const selectYear = document.createElement("select");
  selectYear.id = "calendar__year";
  [2025, 2026].forEach(y => {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    selectYear.appendChild(opt);
  });

  opts.appendChild(selectMonth);
  opts.appendChild(selectYear);
  calendarEl.appendChild(opts);

  // Cria a área do calendário (dias da semana e datas)
  const bodyEl = document.createElement("div");
  bodyEl.classList.add("calendar__body");

  const daysEl = document.createElement("div");
  daysEl.classList.add("calendar__days");
  const dias = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  dias.forEach(d => {
    const div = document.createElement("div");
    div.textContent = d;
    daysEl.appendChild(div);
  });
  bodyEl.appendChild(daysEl);

  // Container de datas
  const datesEl = document.createElement("div");
  datesEl.classList.add("calendar__dates");
  datesEl.id = "calendar__dates";
  bodyEl.appendChild(datesEl);

  calendarEl.appendChild(bodyEl);

  // Seção de botões (opcional, se houver ações específicas)
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

  // Funções de apoio
  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }
  function getWeekDayIndex(date) {
    return (date.getDay() + 6) % 7;
  }

  // Definindo "now" e "tomorrow"
  let hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  let amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);

  // Variável para armazenar a data selecionada
  let selectedDate = null;
  // Array para manter as células que são clicáveis
  let clickableDates = [];

  function buildCalendar(year, month) {
    datesEl.innerHTML = "";
    clickableDates = [];
    const totalDias = getDaysInMonth(year, month);
    const primeiroDia = new Date(year, month, 1);
    const startWeekIndex = getWeekDayIndex(primeiroDia);
    const totalCells = 42;
    let diasArray = [];

    // Dias do mês anterior
    if (startWeekIndex > 0) {
      let prevMonth = month - 1;
      let prevYear = year;
      if (prevMonth < 0) {
        prevMonth = 11;
        prevYear--;
      }
      const totalDiasPrev = getDaysInMonth(prevYear, prevMonth);
      for (let i = startWeekIndex; i > 0; i--) {
        let diaNum = totalDiasPrev - i + 1;
        diasArray.push({
          dia: diaNum,
          inCurrent: false,
          date: new Date(prevYear, prevMonth, diaNum)
        });
      }
    }

    // Dias do mês atual
    for (let d = 1; d <= totalDias; d++) {
      diasArray.push({
        dia: d,
        inCurrent: true,
        date: new Date(year, month, d)
      });
    }

    // Dias do próximo mês
    const restantes = totalCells - diasArray.length;
    if (restantes > 0) {
      let nextMonth = month + 1;
      let nextYear = year;
      if (nextMonth > 11) {
        nextMonth = 0;
        nextYear++;
      }
      for (let d = 1; d <= restantes; d++) {
        diasArray.push({
          dia: d,
          inCurrent: false,
          date: new Date(nextYear, nextMonth, d)
        });
      }
    }

    // Renderiza as células
    diasArray.forEach(obj => {
      const cell = document.createElement("div");
      cell.classList.add("calendar__date");
      if (!obj.inCurrent) {
        cell.classList.add("calendar__date--grey");
      }
      // Impedir seleção de datas anteriores a amanhã
      if (obj.date < amanha) {
        cell.classList.add("calendar__date--grey");
      }
      const container = document.createElement("div");
      container.classList.add("date-content");
      const spanDia = document.createElement("span");
      spanDia.textContent = obj.dia;
      // Preço exemplo: 30 + dia
      let precoBruto = 30 + obj.dia;
      const spanPreco = document.createElement("span");
      spanPreco.classList.add("calendar__price");
      spanPreco.textContent = precoBruto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      container.appendChild(spanDia);
      container.appendChild(spanPreco);
      cell.appendChild(container);

      // Se a data for igual ou posterior a amanhã, torna clicável (mesmo que seja de outro mês)
      if (obj.date >= amanha) {
        clickableDates.push(cell);
        cell.addEventListener("click", function() {
          // Remove a seleção anterior
          clickableDates.forEach(c => c.classList.remove("calendar__date--selected"));
          cell.classList.add("calendar__date--selected");
          selectedDate = obj.date;
        });
      }

      datesEl.appendChild(cell);
    });
  }

  function onChangeMonthYear() {
    const year = parseInt(selectYear.value, 10);
    const month = parseInt(selectMonth.value, 10);
    buildCalendar(year, month);
    // Se o calendário estiver no mesmo mês/ano de amanhã, pré-seleciona a célula de amanhã.
    if (year === amanha.getFullYear() && month === amanha.getMonth()) {
      clickableDates.forEach((cell, index) => {
        const cellDay = parseInt(cell.querySelector(".date-content span").textContent, 10);
        if (cellDay === amanha.getDate()) {
          cell.classList.add("calendar__date--selected");
          selectedDate = amanha;
        }
      });
    }
  }

  selectMonth.addEventListener("change", onChangeMonthYear);
  selectYear.addEventListener("change", onChangeMonthYear);
  onChangeMonthYear();

  // Se desejar, você pode expor uma função para obter a data selecionada:
  return {
    element: calendarEl,
    getSelectedDate: () => selectedDate
  };
}

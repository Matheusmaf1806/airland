// calcomuni.js
export function createSingleDateCalendar() {
  // Cria o container principal do calendário
  const calendarEl = document.createElement("div");
  calendarEl.classList.add("calendar");

  // Cria a área de opções (selects para mês e ano)
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
  // Apenas os anos 2025 e 2026
  [2025, 2026].forEach(ano => {
    const option = document.createElement("option");
    option.value = ano;
    option.textContent = ano;
    selectYear.appendChild(option);
  });

  opts.appendChild(selectMonth);
  opts.appendChild(selectYear);
  calendarEl.appendChild(opts);

  // Cria a área do corpo do calendário (dias da semana e datas)
  const bodyEl = document.createElement("div");
  bodyEl.classList.add("calendar__body");

  const daysEl = document.createElement("div");
  daysEl.classList.add("calendar__days");
  // Rótulos dos dias (começando em segunda)
  const dias = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  dias.forEach(dia => {
    const dayDiv = document.createElement("div");
    dayDiv.textContent = dia;
    daysEl.appendChild(dayDiv);
  });
  bodyEl.appendChild(daysEl);

  // Container para as datas (serão geradas dinamicamente)
  const datesEl = document.createElement("div");
  datesEl.classList.add("calendar__dates");
  datesEl.id = "calendar__dates";
  bodyEl.appendChild(datesEl);

  calendarEl.appendChild(bodyEl);

  // Cria a área dos botões (por exemplo, "Voltar" e "Confirmar")
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

  // Funções auxiliares para cálculo de datas
  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }
  function getWeekDayIndex(date) {
    // Ajusta para que a semana comece em segunda-feira (0 para segunda, 6 para domingo)
    return (date.getDay() + 6) % 7;
  }

  // Define "hoje" e "amanhã" sem considerar a hora (para comparação correta)
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);

  // Variável que armazenará a data selecionada e o array de células clicáveis
  let selectedDate = null;
  let clickableDates = [];

  // Função que constrói o calendário para um mês/ano específicos
  function buildCalendar(year, month) {
    datesEl.innerHTML = "";
    clickableDates = [];

    const totalDias = getDaysInMonth(year, month);
    const primeiroDia = new Date(year, month, 1);
    const startWeekIndex = getWeekDayIndex(primeiroDia);
    const totalCells = 42; // 6 semanas para preencher o calendário
    let diasArray = [];

    // Adiciona os dias do mês anterior para preencher o início do calendário
    if (startWeekIndex > 0) {
      let prevMonth = month - 1;
      let prevYear = year;
      if (prevMonth < 0) {
        prevMonth = 11;
        prevYear--;
      }
      const totalDiasPrev = getDaysInMonth(prevYear, prevMonth);
      for (let i = startWeekIndex; i > 0; i--) {
        const diaNum = totalDiasPrev - i + 1;
        diasArray.push({
          dia: diaNum,
          inCurrent: false,
          date: new Date(prevYear, prevMonth, diaNum)
        });
      }
    }

    // Adiciona os dias do mês atual
    for (let d = 1; d <= totalDias; d++) {
      diasArray.push({
        dia: d,
        inCurrent: true,
        date: new Date(year, month, d)
      });
    }

    // Adiciona os dias do próximo mês para completar as 42 células
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

    // Renderiza cada célula do calendário
    diasArray.forEach(obj => {
      const cell = document.createElement("div");
      cell.classList.add("calendar__date");
      // Se a data não pertence ao mês atual, deixa com aparência cinza
      if (!obj.inCurrent) {
        cell.classList.add("calendar__date--grey");
      }
      // Se a data for anterior a "amanhã", impede a seleção (mesmo que seja de outro mês)
      if (obj.date < amanha) {
        cell.classList.add("calendar__date--grey");
      }

      // Cria o container para agrupar o dia e o preço
      const container = document.createElement("div");
      container.classList.add("date-content");
      const spanDia = document.createElement("span");
      spanDia.textContent = obj.dia;
      // Exemplo de cálculo de preço: 30 + dia
      const precoBruto = 30 + obj.dia;
      const spanPreco = document.createElement("span");
      spanPreco.classList.add("calendar__price");
      spanPreco.textContent = precoBruto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      container.appendChild(spanDia);
      container.appendChild(spanPreco);
      cell.appendChild(container);

      // Se a data for válida para seleção (>= amanhã), torna a célula clicável
      if (obj.date >= amanha) {
        clickableDates.push(cell);
        cell.addEventListener("click", function() {
          // Remove a classe de seleção de todas as células clicáveis
          clickableDates.forEach(cel => cel.classList.remove("calendar__date--selected"));
          // Adiciona a classe de seleção apenas na célula clicada
          cell.classList.add("calendar__date--selected");
          selectedDate = obj.date;
        });
      }

      datesEl.appendChild(cell);
    });
  }

  // Atualiza o calendário conforme a alteração dos selects
  function onChangeMonthYear() {
    const year = parseInt(selectYear.value, 10);
    const month = parseInt(selectMonth.value, 10);
    buildCalendar(year, month);

    // Se o calendário atual corresponder ao mês/ano de "amanhã",
    // pré-seleciona a célula referente a esse dia.
    if (year === amanha.getFullYear() && month === amanha.getMonth()) {
      clickableDates.forEach(cell => {
        const cellDay = parseInt(cell.querySelector(".date-content span").textContent, 10);
        if (cellDay === amanha.getDate()) {
          cell.classList.add("calendar__date--selected");
          selectedDate = amanha;
        }
      });
    }
  }

  // Associa os eventos de mudança aos selects
  selectMonth.addEventListener("change", onChangeMonthYear);
  selectYear.addEventListener("change", onChangeMonthYear);

  // Inicializa o calendário com os valores atuais dos selects
  onChangeMonthYear();

  // Retorna o elemento do calendário e uma função para obter a data selecionada
  return {
    element: calendarEl,
    getSelectedDate: () => selectedDate
  };
}

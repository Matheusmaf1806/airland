// public/js/calcomuni.js
export function createSingleDateCalendar() {
  // =================== 1) Estrutura do Calendário ===================
  const calendarEl = document.createElement("div");
  calendarEl.classList.add("calendar");

  // Área de opções: selects para mês e ano
  const opts = document.createElement("div");
  opts.classList.add("calendar__opts");

  // Select para o mês
  const selectMonth = document.createElement("select");
  selectMonth.id = "calendar__month";
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  meses.forEach((mes, idx) => {
    const option = document.createElement("option");
    option.value = idx;
    option.textContent = mes;
    selectMonth.appendChild(option);
  });

  // Select para o ano
  const selectYear = document.createElement("select");
  selectYear.id = "calendar__year";
  // Aqui, preenchendo com o ano vigente e o próximo
  const currentYear = new Date().getFullYear();
  [currentYear, currentYear + 1].forEach(ano => {
    const option = document.createElement("option");
    option.value = ano;
    option.textContent = ano;
    selectYear.appendChild(option);
  });

  opts.appendChild(selectMonth);
  opts.appendChild(selectYear);
  calendarEl.appendChild(opts);

  // Corpo do calendário: rótulos dos dias e datas
  const bodyEl = document.createElement("div");
  bodyEl.classList.add("calendar__body");

  // Dias da semana (iniciando em segunda)
  const daysEl = document.createElement("div");
  daysEl.classList.add("calendar__days");
  const diasRotulos = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  diasRotulos.forEach(dia => {
    const dayDiv = document.createElement("div");
    dayDiv.textContent = dia;
    daysEl.appendChild(dayDiv);
  });
  bodyEl.appendChild(daysEl);

  // Container para as datas
  const datesEl = document.createElement("div");
  datesEl.classList.add("calendar__dates");
  datesEl.id = "calendar__dates";
  bodyEl.appendChild(datesEl);
  calendarEl.appendChild(bodyEl);

  // Área de botões: "Voltar" e "Confirmar"
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
  // Ajusta para que a semana comece em segunda (0 = segunda, 6 = domingo)
  function getWeekDayIndex(date) {
    return (date.getDay() + 6) % 7;
  }

  // =================== 3) Configuração da Data Atual ===================
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0); // Zera as horas para comparação

  let selectedDate = null;
  let clickableDates = [];

  // =================== 4) Construção do Calendário ===================
  function buildCalendar(year, month) {
    datesEl.innerHTML = "";
    clickableDates = [];

    const totalDias = getDaysInMonth(year, month);
    const primeiroDia = new Date(year, month, 1);
    const startWeekIndex = getWeekDayIndex(primeiroDia);
    const totalCells = 42; // 6 linhas de 7 dias
    let diasArray = [];

    // Preenche os dias do mês anterior
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

    // Preenche os dias do mês atual
    for (let d = 1; d <= totalDias; d++) {
      diasArray.push({
        dia: d,
        inCurrent: true,
        date: new Date(year, month, d)
      });
    }

    // Preenche os dias do próximo mês para completar as 42 células
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

      // Se o dia não pertence ao mês atual, pinta-o com cor de fundo grisalha
      if (!obj.inCurrent) {
        cell.classList.add("calendar__date--grey");
      }
      // Se a data for anterior a hoje, também deverá estar inativa
      if (obj.date < hoje) {
        cell.classList.add("calendar__date--grey");
      }

      // Cria o conteúdo interno (dia + preço de exemplo)
      const container = document.createElement("div");
      container.classList.add("date-content");
      const spanDia = document.createElement("span");
      spanDia.textContent = obj.dia;
      // Exemplo: preço calculado como 30 + dia
      const preco = 30 + obj.dia;
      const spanPreco = document.createElement("span");
      spanPreco.classList.add("calendar__price");
      spanPreco.textContent = preco.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
      });
      container.appendChild(spanDia);
      container.appendChild(spanPreco);
      cell.appendChild(container);

      // Se a data é válida (>= hoje), torna-a clicável
      if (obj.date >= hoje) {
        clickableDates.push(cell);
        cell.addEventListener("click", () => {
          // Remove a classe de seleção de todas as células clicáveis
          clickableDates.forEach(c => c.classList.remove("calendar__date--range"));
          // Adiciona a classe apenas na célula clicada para destacá-la
          cell.classList.add("calendar__date--range");
          selectedDate = obj.date;
        });
      }
      datesEl.appendChild(cell);
    });
  }

  // =================== 5) Atualiza o Calendário ao Mudar os Selects ===================
  function onChangeMonthYear() {
    const year = parseInt(selectYear.value, 10);
    const month = parseInt(selectMonth.value, 10);
    buildCalendar(year, month);
  }

  // =================== 6) Inicializa o Calendário no Mês Vigente ===================
  selectYear.value = hoje.getFullYear();
  selectMonth.value = hoje.getMonth();
  buildCalendar(hoje.getFullYear(), hoje.getMonth());

  selectMonth.addEventListener("change", onChangeMonthYear);
  selectYear.addEventListener("change", onChangeMonthYear);

  // =================== 7) Retorno do Componente ===================
  return {
    element: calendarEl,         // Elemento HTML do calendário
    getSelectedDate: () => selectedDate, // Função para obter a data selecionada
    btnBack,                      // Botão "Voltar"
    btnApply,                     // Botão "Confirmar"
    selectYear,
    selectMonth
  };
}

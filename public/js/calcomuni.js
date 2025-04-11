// calcomuni.js
export function createSingleDateCalendar() {
  // ============ 1) Criação da Estrutura Principal ============
  const calendarEl = document.createElement("div");
  calendarEl.classList.add("calendar");

  // Área de selects (mês/ano)
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

  // Corpo do calendário (dias da semana + datas)
  const bodyEl = document.createElement("div");
  bodyEl.classList.add("calendar__body");

  const daysEl = document.createElement("div");
  daysEl.classList.add("calendar__days");
  // Rotulando dias para começar em segunda
  const diasRotulos = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  diasRotulos.forEach(dia => {
    const dayDiv = document.createElement("div");
    dayDiv.textContent = dia;
    daysEl.appendChild(dayDiv);
  });
  bodyEl.appendChild(daysEl);

  const datesEl = document.createElement("div");
  datesEl.classList.add("calendar__dates");
  datesEl.id = "calendar__dates";
  bodyEl.appendChild(datesEl);

  calendarEl.appendChild(bodyEl);

  // Botões "Voltar" e "Confirmar"
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

  // ============ 2) Funções Auxiliares ============
  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }
  // Ajuste para a semana começar em segunda (0 = segunda, 6 = domingo)
  function getWeekDayIndex(date) {
    return (date.getDay() + 6) % 7;
  }

  // ============ 3) Lógica de Datas (hoje) ============
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0); // Zera horas para comparar só a data

  // Variáveis principais
  let selectedDate = null;
  let clickableDates = [];

  // ============ 4) Função de Construção do Calendário ============
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
          date: new Date(prevYear, prevMonth, diaNum),
        });
      }
    }

    // Preenche os dias do mês atual
    for (let d = 1; d <= totalDias; d++) {
      diasArray.push({
        dia: d,
        inCurrent: true,
        date: new Date(year, month, d),
      });
    }

    // Preenche os dias do próximo mês até totalizar 42 células
    const faltam = totalCells - diasArray.length;
    if (faltam > 0) {
      let nextMonth = month + 1;
      let nextYear = year;
      if (nextMonth > 11) {
        nextMonth = 0;
        nextYear++;
      }
      for (let d = 1; d <= faltam; d++) {
        diasArray.push({
          dia: d,
          inCurrent: false,
          date: new Date(nextYear, nextMonth, d),
        });
      }
    }

    // Renderiza cada célula
    diasArray.forEach(obj => {
      const cell = document.createElement("div");
      cell.classList.add("calendar__date");
      // Se não for do mês atual, pinta cinza
      if (!obj.inCurrent) {
        cell.classList.add("calendar__date--grey");
      }
      // Se a data for anterior a "hoje", também deixa cinza e inativa
      if (obj.date < hoje) {
        cell.classList.add("calendar__date--grey");
      }

      // Conteúdo interno (dia + "preço" de exemplo)
      const container = document.createElement("div");
      container.classList.add("date-content");
      const spanDia = document.createElement("span");
      spanDia.textContent = obj.dia;
      // Exemplo de preço: 30 + dia
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

      // Se a data é >= hoje, pode ser clicável
      if (obj.date >= hoje) {
        clickableDates.push(cell);
        cell.addEventListener("click", () => {
          // Remove a classe .calendar__date--range de todas as clicáveis
          clickableDates.forEach(c => c.classList.remove("calendar__date--range"));
          // Adiciona no item clicado
          cell.classList.add(".calendar__date--range-end::before");
          selectedDate = obj.date;
        });
      }

      datesEl.appendChild(cell);
    });
  }

  // ============ 5) Atualiza Calendário ao Mudar Selects ============
  function onChangeMonthYear() {
    const year = parseInt(selectYear.value, 10);
    const month = parseInt(selectMonth.value, 10);
    buildCalendar(year, month);
  }

  // ============ 6) Definir o Mês Vigente (mês atual do sistema) ============
  // Ajusta o ano se estiver fora de 2025-2026
  let currentYear = hoje.getFullYear();
  if (currentYear < 2025) currentYear = 2025;
  if (currentYear > 2026) currentYear = 2026;

  // Seta o valor dos selects para o ano/mês ajustados
  selectYear.value = currentYear;
  selectMonth.value = hoje.getMonth();

  // Chama a função que monta o calendário no mês/ano atual
  buildCalendar(currentYear, hoje.getMonth());

  // Quando o usuário trocar manualmente os selects (Mês / Ano)
  selectMonth.addEventListener("change", onChangeMonthYear);
  selectYear.addEventListener("change", onChangeMonthYear);

  // ============ 7) Retorno do Componente ============
  return {
    element: calendarEl, // o elemento HTML do calendário
    getSelectedDate: () => selectedDate, // função para obter a data escolhida
    // Elementos auxiliares (caso precise):
    btnBack,
    btnApply,
    selectYear,
    selectMonth
  };
}

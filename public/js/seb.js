// Bloco de Busca: Tabs e Flatpickr
document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(tc => tc.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.getAttribute('data-tab');
      document.getElementById(target).classList.add('active');
    });
  });
  if (typeof flatpickr !== 'undefined') {
    flatpickr('#dataIngresso', {
      locale: 'pt',
      dateFormat: 'd/m/Y',
      minDate: 'today',
      defaultDate: 'today'
    });
    flatpickr('#dataRangeHoteis', {
      locale: 'pt',
      mode: 'range',
      dateFormat: 'd/m/Y',
      showMonths: 2,
      minDate: 'today',
      allowInput: true
    });
  }
});

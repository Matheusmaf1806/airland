async function applyAffiliateColorsFromHost() {
  try {
    const host = window.location.hostname; // Ex: parceiro.airland.com.br
    const response = await fetch(`/api/affiliateColors?host=${host}`);
    const data = await response.json();

    if (!data || !data.primary_color) return;

    const root = document.documentElement;
    root.style.setProperty('--primary_color', data.primary_color);
    root.style.setProperty('--button_color', data.button_color);
    root.style.setProperty('--button_text_color', data.button_text_color);
    root.style.setProperty('--button_hover', data.button_hover);
    root.style.setProperty('--background_color', data.background_color);
  } catch (err) {
    console.error("Erro ao aplicar cores do afiliado:", err);
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  await applyAffiliateColorsFromHost();
});

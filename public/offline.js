const text = {
  en: [
    "You are offline",
    "Reconnect to access your saved conversations and live agents. Private chat data is never stored in the offline cache.",
    "Back to Ocnif",
  ],
  es: [
    "Sin conexión",
    "Reconecta para acceder a conversaciones y agentes. Los datos privados del chat no se guardan en la caché sin conexión.",
    "Volver a Ocnif",
  ],
  de: [
    "Du bist offline",
    "Verbinde dich erneut, um Gespräche und Agenten zu nutzen. Private Chatdaten werden nicht offline zwischengespeichert.",
    "Zurück zu Ocnif",
  ],
  fr: [
    "Vous êtes hors ligne",
    "Reconnectez-vous pour accéder aux conversations et aux agents. Les données privées ne sont pas stockées dans le cache hors ligne.",
    "Retour à Ocnif",
  ],
};
const locale = localStorage.getItem("ocnif-locale") || "en";
const copy = text[locale] || text.en;
document.documentElement.lang = locale;
["title", "body", "back"].forEach((id, index) => {
  document.getElementById(id).textContent = copy[index];
});

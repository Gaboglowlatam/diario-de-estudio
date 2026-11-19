const STORAGE_KEY = "diarioDeEstudio.sesiones";

const form = document.getElementById("session-form");
const dateInput = document.getElementById("date");
const topicInput = document.getElementById("topic");
const minutesInput = document.getElementById("minutes");
const formError = document.getElementById("form-error");
const sessionsList = document.getElementById("sessions");
const emptyMessage = document.getElementById("empty");
const streakNumber = document.getElementById("streak");
const streakLabel = document.getElementById("streak-label");

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

let sessions = loadSessions();

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function todayKey() {
  return toDateKey(new Date());
}

function formatDateKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return dateFormatter.format(new Date(year, month - 1, day));
}

function isValidSession(session) {
  return (
    session &&
    typeof session === "object" &&
    typeof session.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(session.date) &&
    typeof session.topic === "string" &&
    typeof session.minutes === "number" &&
    session.minutes > 0 &&
    typeof session.createdAt === "number"
  );
}

function loadSessions() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed.filter(isValidSession) : [];
  } catch (error) {
    console.error("No se pudieron leer las sesiones guardadas.", error);
    return [];
  }
}

function saveSessions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error("No se pudieron guardar las sesiones.", error);
    showFormError("No se pudieron guardar los datos en este navegador.");
  }
}

function showFormError(message) {
  formError.textContent = message;
  formError.hidden = false;
}

function clearFormError() {
  formError.textContent = "";
  formError.hidden = true;
}

function sortSessions(list) {
  return [...list].sort((a, b) => {
    if (a.date !== b.date) {
      return a.date < b.date ? 1 : -1;
    }
    return b.createdAt - a.createdAt;
  });
}

function calculateStreak(list) {
  const studiedDays = new Set(list.map((session) => session.date));
  const cursor = new Date();

  // Si hoy aún no hay sesión, la racha sigue viva y se cuenta hasta ayer.
  if (!studiedDays.has(toDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (studiedDays.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function renderStreak() {
  const streak = calculateStreak(sessions);
  streakNumber.textContent = String(streak);
  streakLabel.textContent = streak === 1 ? "día seguido" : "días seguidos";
}

function renderSessions() {
  sessionsList.replaceChildren();
  const ordered = sortSessions(sessions);

  ordered.forEach((session) => {
    const item = document.createElement("li");
    item.className = "session";

    const info = document.createElement("div");
    info.className = "session-info";

    const topic = document.createElement("p");
    topic.className = "session-topic";
    topic.textContent = session.topic;

    const date = document.createElement("p");
    date.className = "session-date";
    date.textContent = formatDateKey(session.date);

    info.append(topic, date);

    const minutes = document.createElement("span");
    minutes.className = "session-minutes";
    minutes.textContent = `${session.minutes} min`;

    item.append(info, minutes);
    sessionsList.append(item);
  });

  emptyMessage.hidden = ordered.length > 0;
}

function render() {
  renderStreak();
  renderSessions();
}

function handleSubmit(event) {
  event.preventDefault();
  clearFormError();

  const date = dateInput.value;
  const topic = topicInput.value.trim();
  const minutes = Number(minutesInput.value);

  if (!date) {
    showFormError("Elige una fecha para la sesión.");
    dateInput.focus();
    return;
  }

  if (date > todayKey()) {
    showFormError("La fecha no puede ser futura.");
    dateInput.focus();
    return;
  }

  if (!topic) {
    showFormError("Escribe el tema que estudiaste.");
    topicInput.focus();
    return;
  }

  if (!Number.isFinite(minutes) || minutes <= 0) {
    showFormError("Introduce un número de minutos mayor que 0.");
    minutesInput.focus();
    return;
  }

  sessions.push({
    date,
    topic,
    minutes,
    createdAt: Date.now(),
  });

  saveSessions();
  render();

  form.reset();
  dateInput.value = todayKey();
  topicInput.focus();
}

dateInput.max = todayKey();
dateInput.value = todayKey();

form.addEventListener("submit", handleSubmit);
[dateInput, topicInput, minutesInput].forEach((input) => {
  input.addEventListener("input", clearFormError);
});

render();

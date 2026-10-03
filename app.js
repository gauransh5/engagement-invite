const envelope = document.getElementById("envelope");
const studio = document.querySelector(".studio");
const card = document.getElementById("card");
const hint = document.getElementById("hint");
const pager = document.getElementById("pager");
const dots = document.getElementById("dots");
const story = document.getElementById("story");
const beats = [...document.querySelectorAll(".beat")];

const details = window.INVITE || {};
document.querySelectorAll("[data-field]").forEach((el) => {
  const key = el.dataset.field;
  if (details[key]) el.textContent = details[key];
});

function titledName(name) {
  const text = String(name || "").trim();
  const first = text.charAt(0).toUpperCase();
  const rest = text.slice(1);
  return `<span class="initial">${first}</span>${rest}`;
}

document.querySelectorAll("[data-name]").forEach((el) => {
  const key = el.dataset.name;
  if (details[key]) el.innerHTML = titledName(details[key]);
});

let page = 0;
let opened = false;
let animating = false;
const STAGGER_MS = 90;
const BEAT_FADE_MS = 500;

function renderDots() {
  dots.innerHTML = beats
    .map(
      (_, i) =>
        `<button type="button" class="${i === page ? "is-on" : ""}" aria-label="Go to moment ${i + 1}"></button>`
    )
    .join("");
  dots.querySelectorAll("button").forEach((dot, i) => {
    dot.addEventListener("click", (event) => {
      event.stopPropagation();
      goTo(i);
    });
  });
}

function syncChrome() {
  const onSeal = page === beats.length - 1;
  studio.classList.toggle("on-seal", onSeal);
  card.classList.toggle("is-seal", onSeal);
  hint.textContent = !opened
    ? "Tap the envelope to open"
    : page === beats.length - 1
      ? "Scroll up to go back"
      : "Scroll to reveal";
  dots.querySelectorAll("button").forEach((dot, i) => {
    dot.classList.toggle("is-on", i === page);
  });
}

function clearReveals(beat) {
  beat.querySelectorAll(".reveal").forEach((el) => el.classList.remove("is-in"));
}

function revealBeat(beat) {
  const items = [...beat.querySelectorAll(".reveal")];
  items.forEach((el) => {
    const delay = Number(el.dataset.delay || 0) * STAGGER_MS;
    window.setTimeout(() => el.classList.add("is-in"), delay);
  });
}

function showBeat(index, { animate = true } = {}) {
  page = Math.max(0, Math.min(beats.length - 1, index));
  beats.forEach((beat, i) => {
    const active = i === page;
    if (!active) {
      beat.classList.remove("is-active");
      clearReveals(beat);
    } else {
      beat.classList.add("is-active");
      clearReveals(beat);
      if (animate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        revealBeat(beat);
      } else {
        beat.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-in"));
      }
    }
  });
  syncChrome();
}

function goTo(next) {
  next = Math.max(0, Math.min(beats.length - 1, next));
  if (next === page || animating) return;
  animating = true;

  const current = beats[page];
  current.classList.remove("is-active");
  clearReveals(current);

  window.setTimeout(() => {
    showBeat(next, { animate: true });
    const maxDelay =
      Math.max(
        0,
        ...[...beats[next].querySelectorAll(".reveal")].map((el) => Number(el.dataset.delay || 0))
      ) * STAGGER_MS;
    window.setTimeout(() => {
      animating = false;
    }, maxDelay + 450);
  }, BEAT_FADE_MS);
}

function openEnvelope() {
  if (opened) return;
  opened = true;
  envelope.classList.add("is-open");
  studio.classList.add("is-open");
  envelope.removeAttribute("role");
  envelope.removeAttribute("tabindex");
  pager.hidden = false;
  story.style.touchAction = "none";
  window.setTimeout(() => showBeat(0, { animate: true }), 450);
  syncChrome();
}

envelope.addEventListener("click", () => {
  if (!opened) openEnvelope();
});

envelope.addEventListener("keydown", (event) => {
  if (!opened && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    openEnvelope();
  }
});

document.addEventListener("keydown", (event) => {
  if (!opened) return;
  if (["ArrowDown", "PageDown", "ArrowRight", " "].includes(event.key)) {
    event.preventDefault();
    goTo(page + 1);
  }
  if (["ArrowUp", "PageUp", "ArrowLeft"].includes(event.key)) {
    event.preventDefault();
    goTo(page - 1);
  }
});

let wheelLock = 0;
story.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    if (!opened || animating) return;
    const now = Date.now();
    if (now - wheelLock < 700) return;
    if (Math.abs(event.deltaY) < 12) return;
    wheelLock = now;
    goTo(page + (event.deltaY > 0 ? 1 : -1));
  },
  { passive: false }
);

let touchY = 0;
story.addEventListener(
  "touchstart",
  (event) => {
    touchY = event.changedTouches[0].clientY;
  },
  { passive: true }
);

story.addEventListener(
  "touchmove",
  (event) => {
    if (opened) event.preventDefault();
  },
  { passive: false }
);

story.addEventListener(
  "touchend",
  (event) => {
    const dy = event.changedTouches[0].clientY - touchY;
    if (!opened) {
      if (Math.abs(dy) < 12) openEnvelope();
      return;
    }
    if (Math.abs(dy) < 36 || animating) return;
    goTo(page + (dy < 0 ? 1 : -1));
  },
  { passive: true }
);

window.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
  },
  { passive: false }
);

renderDots();
syncChrome();

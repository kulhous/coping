import { parseMd } from "./parse_md.js";

const LANG_KEY = "coping-methods-lang";
const QUIVER_REVIEW_KEY = "coping-quiver-review-visible";
const DETAIL_DEFAULT_RENDER_MODE = "scaled";
const DETAIL_CARD_RATIO = 0.68;
const DETAIL_DESIGN_WIDTH = 470;
const DETAIL_DESIGN_HEIGHT = Math.round(DETAIL_DESIGN_WIDTH / DETAIL_CARD_RATIO);
const QUIVER_REVIEW_DIR = "assets/quiver-review";
const QUIVER_REVIEW_VERSION = "20260419-2";
const QUIVER_REVIEW_CURATED_SLUGS = new Set([
  "box_breath","butterfly_hug","shake_it_out","self_hug","color_my_mood","brain_dump",
  "secret_letter","mood_dj","body_map","stop_sign","urge_surfing","coping_kit",
  "5_senses","sour_candy","cold_splash","my_playlist","heavy_blanket",
]);

function slugifyReviewText(text) {
  return String(text || "")
    .toLowerCase()
    .replaceAll("&", "and")
    .split("")
    .map((ch) => (/[a-z0-9]/.test(ch) ? ch : "_"))
    .join("")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

function getQuiverReviewSlug(card) {
  return slugifyReviewText(card.nickname_en || card.nickname || card.id);
}

function getQuiverReviewStem(card) {
  return `${card.id}_${getQuiverReviewSlug(card)}`;
}

function isQuiverReviewCard(card) {
  return !QUIVER_REVIEW_CURATED_SLUGS.has(getQuiverReviewSlug(card));
}

function getQuiverReviewSrc(card) {
  return `${QUIVER_REVIEW_DIR}/${getQuiverReviewStem(card)}.svg?v=${QUIVER_REVIEW_VERSION}`;
}

function getQuiverReviewPngSrc(card) {
  const stem = getQuiverReviewStem(card);
  return `../generated_icons/api/${stem}/${stem}_hf_master_512.png?v=${QUIVER_REVIEW_VERSION}`;
}

function getFallbackReviewArt(card) {
  if (!card || !isQuiverReviewCard(card)) return null;
  return {
    src: getQuiverReviewSrc(card),
    fallbackSrc: getQuiverReviewPngSrc(card),
    alt: {
      cs: `${card.nickname || card.nickname_en || card.id} ilustrace`,
      en: `${card.nickname_en || card.nickname || card.id} illustration`,
    },
  };
}

function attachArtFallback(img, art) {
  if (!img || !art || !art.fallbackSrc || art.fallbackSrc === art.src) return;
  img.addEventListener("error", () => {
    if (img.dataset.fallbackApplied === "true") return;
    img.dataset.fallbackApplied = "true";
    img.src = art.fallbackSrc;
  });
}

/* ─── Kid-friendly modality labels ─── */
const MOD_MAP = {
  cs: {
    Body:             "🤸 Pohyb tělem",
    Sensory:          "👃 Zapojit smysly",
    Creative:         "🎨 Tvořit",
    Cognitive:        "🧠 Přemýšlet jinak",
    "Social-Adjacent":"💬 Být s někým",
    Nature:           "🌿 Jít ven",
    Humor:            "😂 Zasmát se",
    Ritual:           "✨ Rituál / návyk",
  },
  en: {
    Body:             "🤸 Move my body",
    Sensory:          "👃 Use my senses",
    Creative:         "🎨 Create something",
    Cognitive:        "🧠 Think differently",
    "Social-Adjacent":"💬 Be with someone",
    Nature:           "🌿 Go outside",
    Humor:            "😂 Laugh",
    Ritual:           "✨ Build a habit",
  },
};

const MOD_EMOJI = {
  Body: "🤸", Sensory: "👃", Creative: "🎨", Cognitive: "🧠",
  "Social-Adjacent": "💬", Nature: "🌿", Humor: "😂", Ritual: "✨",
};

/* ─── Kid-friendly emotional state labels ─── */
const STATE_MAP = {
  cs: {
    panic:       "😰 Mám strach",
    anxiety:     "😟 Mám úzkost",
    anger:       "😡 Mám vztek",
    sadness:     "😢 Je mi smutno",
    selfharm:    "💔 Chci si ublížit",
    dissociation:"🌫️ Jsem mimo",
    rumination:  "🔄 Myšlenky se točí",
    shame:       "😳 Stydím se",
    loneliness:  "🫂 Jsem sám/sama",
    sleep:       "😴 Nemůžu spát",
    school:      "📚 Stres ze školy",
    any:         "🌀 Cokoli",
  },
  en: {
    panic:       "😰 Panic",
    anxiety:     "😟 Anxiety",
    anger:       "😡 Anger",
    sadness:     "😢 Sadness",
    selfharm:    "💔 Urge to self-harm",
    dissociation:"🌫️ Spaced out",
    rumination:  "🔄 Thoughts won't stop",
    shame:       "😳 Shame",
    loneliness:  "🫂 Lonely",
    sleep:       "😴 Can't sleep",
    school:      "📚 School stress",
    any:         "🌀 Anything",
  },
};

const STATE_ORDER = [
  "panic","anxiety","anger","sadness","selfharm",
  "dissociation","rumination","shame","loneliness","sleep","school","any",
];

function classifyStates(raw) {
  if (!raw) return [];
  const s = raw.toLowerCase();
  const out = new Set();
  if (s.includes("panic"))                            out.add("panic");
  if (s.includes("diffuse anxiety") || (s.includes("anxiety") && !s.includes("panic")))
                                                      out.add("anxiety");
  if (s.includes("anger") || s.includes("rage"))      out.add("anger");
  if (s.includes("sadness") || s.includes("numbness"))out.add("sadness");
  if (s.includes("self-harm") || s.includes("self harm")) out.add("selfharm");
  if (s.includes("dissociation") || s.includes("unreal")) out.add("dissociation");
  if (s.includes("rumination") || s.includes("thought spiral") || s.includes("catastrophiz"))
                                                      out.add("rumination");
  if (s.includes("shame") || s.includes("social anxiety")) out.add("shame");
  if (s.includes("loneliness") || s.includes("lonely")) out.add("loneliness");
  if (s.includes("sleep"))                            out.add("sleep");
  if (s.includes("school"))                           out.add("school");
  if (s.includes("any emotional") || s.includes("preventive") || s.includes("all states"))
                                                      out.add("any");
  if (out.size === 0) {
    if (s.includes("stress"))  out.add("school");
    if (s.includes("overwhelm")) out.add("anxiety");
    if (s.includes("frustrat")) out.add("anger");
    if (s.includes("tension")) out.add("anxiety");
  }
  return [...out];
}

/* ─── Kid-friendly energy labels ─── */
const ENERGY_MAP = {
  cs: { low: "😴 Skoro žádnou", medium: "🙂 Trochu", high: "💪 Dost!" },
  en: { low: "😴 Almost none",  medium: "🙂 Some",   high: "💪 Plenty!" },
};

const ENERGY_ORDER = ["low", "medium", "high"];

function classifyEnergy(raw) {
  if (!raw) return "medium";
  const s = raw.toLowerCase();
  if (s.startsWith("low") && !s.includes("medium")) return "low";
  if (s.startsWith("high")) return "high";
  if (s.includes("medium") && s.includes("high")) return "high";
  if (s.includes("low") && s.includes("medium")) return "low";
  return "medium";
}

/* ─── Default card colors per modality ─── */
const MOD_COLORS = {
  Body: "#d0e8f0", Sensory: "#f2e4cc", Creative: "#f5d0d8",
  Cognitive: "#ddd5ea", "Social-Adjacent": "#c9dded",
  Nature: "#c5e6d0", Humor: "#fef3e2", Ritual: "#eee5c8",
};

const CARD_ART = {
  B01: {
    src: "assets/box_breath.svg?v=20260413-1",
    alt: {
      cs: "Ilustrace dýchání do čtverce",
      en: "Box Breath illustration",
    },
  },
  B05: {
    src: "assets/butterfly_hug.svg?v=20260413-2",
    alt: {
      cs: "Ilustrace motýlího objetí",
      en: "Butterfly Hug illustration",
    },
  },
  B06: {
    src: "assets/shake_it_out.svg?v=20260413-2",
    alt: {
      cs: "Ilustrace vyklepání",
      en: "Shake It Out illustration",
    },
  },
  B10: {
    src: "assets/self_hug.svg?v=20260413-1",
    alt: {
      cs: "Ilustrace pevného objetí",
      en: "Self-Hug illustration",
    },
  },
  C01: {
    src: "assets/color_my_mood.svg?v=20260413-2",
    alt: {
      cs: "Ilustrace barev pocitů",
      en: "Color My Mood illustration",
    },
  },
  C02: {
    src: "assets/brain_dump.svg?v=20260413-2",
    alt: {
      cs: "Ilustrace výplachu hlavy",
      en: "Brain Dump illustration",
    },
  },
  C03: {
    src: "assets/secret_letter.svg?v=20260413-1",
    alt: {
      cs: "Ilustrace tajného dopisu",
      en: "Secret Letter illustration",
    },
  },
  C05: {
    src: "assets/mood_dj.svg?v=20260413-2",
    alt: {
      cs: "Ilustrace DJ nálady",
      en: "Mood DJ illustration",
    },
  },
  C10: {
    src: "assets/body_map.svg?v=20260413-2",
    alt: {
      cs: "Ilustrace mapy těla",
      en: "Body Map illustration",
    },
  },
  K05: {
    src: "assets/stop_sign.svg?v=20260413-2",
    alt: {
      cs: "Ilustrace stopky",
      en: "STOP Sign illustration",
    },
  },
  K06: {
    src: "assets/urge_surfing.svg?v=20260413-1",
    alt: {
      cs: "Ilustrace jízdy na vlně",
      en: "Urge Surfing illustration",
    },
  },
  R01: {
    src: "assets/coping_kit.svg?v=20260413-1",
    alt: {
      cs: "Ilustrace krabičky záchrany",
      en: "Coping Kit illustration",
    },
  },
  S01: {
    src: "assets/5_senses.svg?v=20260413-1",
    alt: {
      cs: "Ilustrace pěti smyslů",
      en: "5 Senses illustration",
    },
  },
  S04: {
    src: "assets/sour_candy.svg?v=20260413-2",
    alt: {
      cs: "Ilustrace silné chuti",
      en: "Sour Candy illustration",
    },
  },
  S05: {
    src: "assets/cold_splash.svg?v=20260413-2",
    alt: {
      cs: "Ilustrace studené vody",
      en: "Cold Splash illustration",
    },
  },
  S06: {
    src: "assets/my_playlist.svg?v=20260413-2",
    alt: {
      cs: "Ilustrace mého playlistu",
      en: "My Playlist illustration",
    },
  },
  S07: {
    src: "assets/heavy_blanket.svg?v=20260413-2",
    alt: {
      cs: "Ilustrace těžké deky",
      en: "Heavy Blanket illustration",
    },
  },
};

function getCardArt(methodId, card = null) {
  return CARD_ART[methodId] || getFallbackReviewArt(card) || null;
}

/* ─── UI text ─── */
const UI = {
  cs: {
    title: "🌈 Kartičky uvolňovacích metod",
    lead: "Vyber si, co se ti teď hodí. Klikni a rozbal.",
    random: "🎲 Náhodná kartička",
    accModality: "🎯 Co chci dělat?",
    accState: "💭 Co cítím?",
    accEnergy: "🔋 Kolik mám síly?",
    accAge: "🎂 Kolik mi je?",
    optAll: "Vše",
    close: "Zavřít",
    prev: "Předchozí kartička",
    next: "Další kartička",
    proLink: "📋 Odborný přehled",
    count: (n, t) => `${n} z ${t} kartiček`,
    empty: "🤷 Nic tu není — zkus jinou kombinaci.",
    footer: 'V akutní krizi kontaktuj Linku bezpečí — <strong>116&nbsp;111</strong> (zdarma) · <a href="https://chat.linkabezpeci.cz" target="_blank" rel="noopener">chat.linkabezpeci.cz</a> 💚',
    duration: "⏱️",
    objects: "🎒",
    where: "📍",
    mechanism: "🔬 Jak to funguje",
    reviewShow: "🖼️ Zobrazit Quiver SVG",
    reviewHide: "🖼️ Skrýt Quiver SVG",
    reviewTitle: "🖼️ Quiver SVG kontrola",
    reviewLead: "Tady jsou Quiver náhledy pro rychlou kontrolu. Chybějící soubory se ukážou jako nehotové.",
    reviewOpen: "Otevřít SVG",
    reviewMissing: "Chybí SVG",
    reviewStatus: (ready, total, missing, checking) => `Hotovo ${ready}/${total} · chybí ${missing} · kontroluji ${checking}`,
  },
  en: {
    title: "🌈 Coping cards",
    lead: "Pick what fits right now. Tap and explore.",
    random: "🎲 Random card",
    accModality: "🎯 What do I want to do?",
    accState: "💭 What do I feel?",
    accEnergy: "🔋 How much energy do I have?",
    accAge: "🎂 How old am I?",
    optAll: "All",
    close: "Close",
    prev: "Previous card",
    next: "Next card",
    proLink: "📋 Professional view",
    count: (n, t) => `${n} of ${t} cards`,
    empty: "🤷 Nothing here — try a different combo.",
    footer: 'In an acute crisis, reach a trusted adult or your local helpline. 💚',
    duration: "⏱️",
    objects: "🎒",
    where: "📍",
    mechanism: "🔬 How it works",
    reviewShow: "🖼️ Show Quiver SVGs",
    reviewHide: "🖼️ Hide Quiver SVGs",
    reviewTitle: "🖼️ Quiver SVG review",
    reviewLead: "These are the Quiver previews for review. Missing files are marked as unfinished.",
    reviewOpen: "Open SVG",
    reviewMissing: "SVG missing",
    reviewStatus: (ready, total, missing, checking) => `Ready ${ready}/${total} · missing ${missing} · checking ${checking}`,
  },
};

/* ============================================================
   MAIN
   ============================================================ */
function main() {
  const $ = (id) => document.getElementById(id);
  const grid      = $("grid");
  const emptyEl   = $("empty");
  const countEl   = $("count");
  const bubMod    = $("bub-modality");
  const bubState  = $("bub-state");
  const bubEnergy = $("bub-energy");
  const dlg       = $("detail");
  const dlgScaleShell = $("detail-scale-shell");
  const dlgCard   = $("detail-card");
  const dlgColor  = $("detail-color");
  const dlgNick   = $("detail-nickname");
  const dlgHead   = $("detail-headline");
  const dlgText   = $("detail-text");
  const dlgMeta   = $("detail-meta");
  const dlgClose  = $("detail-close");
  const dlgScroll = $("detail-scroll");
  const dlgPrev   = $("detail-prev");
  const dlgNext   = $("detail-next");
  const btnCs     = $("lang-cs");
  const btnEn     = $("lang-en");
  const randomBtn = $("random-card");
  const reviewToggleBtn = $("quiver-review-toggle");
  const reviewSection = $("quiver-review-section");
  const reviewTitleEl = $("quiver-review-title");
  const reviewLeadEl = $("quiver-review-lead");
  const reviewStatusEl = $("quiver-review-status");
  const reviewGrid = $("quiver-review-grid");
  const specialSection = $("special-section");
  const specialCardEl = $("special-card");
  const rootEl = document.documentElement;
  const bodyEl    = document.body;
  const chipsMod  = $("chips-modality");
  const chipsState= $("chips-state");
  const chipsNrg  = $("chips-energy");
  const chipsAge  = $("chips-age");
  const lblAge    = $("bub-age-label");
  const ageAll    = $("age-all");

  let methods = [];       // from methods_bilingual.json
  let kidsCards = [];     // from kids_cards.json
  let kidsMap = {};       // method_id -> kids card
  let specialCards = []; // special cards (special: true)
  let quiverReviewCards = [];
  let enriched = [];      // methods with computed fields
  let visibleCards = [];
  let activeModalCards = [];
  let activeModalIndex = -1;
  let detailTransitionBusy = false;
  let detailReturnFocusEl = null;
  let detailScrollSnapshot = null;
  let detailScrollLockStyles = null;
  let lang = localStorage.getItem(LANG_KEY) || "cs";
  let detailRenderMode = DETAIL_DEFAULT_RENDER_MODE;
  let quiverReviewVisible = localStorage.getItem(QUIVER_REVIEW_KEY);
  quiverReviewVisible = quiverReviewVisible === null ? true : quiverReviewVisible === "true";
  let quiverReviewStats = { ready: 0, missing: 0, checking: 0 };
  let quiverReviewRenderToken = 0;

  // Active filters
  const sel = { modality: new Set(), state: new Set(), energy: new Set(), age: null };

  function getViewportScroll() {
    return { x: window.scrollX, y: window.scrollY };
  }

  function restoreViewportScroll(pos) {
    if (!pos) return;
    window.scrollTo(pos.x, pos.y);
  }

  function stabilizeViewport(pos) {
    if (!pos) return;
    restoreViewportScroll(pos);
    requestAnimationFrame(() => {
      restoreViewportScroll(pos);
      requestAnimationFrame(() => restoreViewportScroll(pos));
    });
    setTimeout(() => restoreViewportScroll(pos), 0);
    setTimeout(() => restoreViewportScroll(pos), 50);
  }

  function lockBackgroundScroll() {
    if (detailScrollLockStyles) return;
    const pos = getViewportScroll();
    detailScrollSnapshot = pos;
    detailScrollLockStyles = {
      rootOverflow: rootEl.style.overflow,
      bodyOverflow: bodyEl.style.overflow,
      bodyPosition: bodyEl.style.position,
      bodyInset: bodyEl.style.inset,
      bodyTop: bodyEl.style.top,
      bodyWidth: bodyEl.style.width,
    };
    rootEl.style.overflow = "hidden";
    bodyEl.style.overflow = "hidden";
    bodyEl.style.position = "fixed";
    bodyEl.style.inset = "0";
    bodyEl.style.top = `-${pos.y}px`;
    bodyEl.style.width = "100%";
  }

  function unlockBackgroundScroll() {
    const pos = detailScrollSnapshot;
    if (detailScrollLockStyles) {
      rootEl.style.overflow = detailScrollLockStyles.rootOverflow;
      bodyEl.style.overflow = detailScrollLockStyles.bodyOverflow;
      bodyEl.style.position = detailScrollLockStyles.bodyPosition;
      bodyEl.style.inset = detailScrollLockStyles.bodyInset;
      bodyEl.style.top = detailScrollLockStyles.bodyTop;
      bodyEl.style.width = detailScrollLockStyles.bodyWidth;
      detailScrollLockStyles = null;
    }
    stabilizeViewport(pos);
  }

  function methodName(row) {
    return row["Name (Child-friendly)"] || row["Name (Card Title)"] || row["Name (Professional)"] || "";
  }

  function isScaledDetailMode() {
    return detailRenderMode === "scaled";
  }

  function updateDetailRenderMetrics() {
    if (!isScaledDetailMode()) {
      dlg.style.removeProperty("--detail-scale");
      dlg.style.removeProperty("--detail-scaled-height");
      return;
    }

    const availableWidth = dlg.clientWidth;
    if (!availableWidth) return;

    const scale = Math.min(1, availableWidth / DETAIL_DESIGN_WIDTH);
    dlg.style.setProperty("--detail-scale", scale.toFixed(4));
    dlg.style.setProperty("--detail-scaled-height", `${(DETAIL_DESIGN_HEIGHT * scale).toFixed(2)}px`);
  }

  function scheduleDetailRenderMetrics() {
    requestAnimationFrame(() => {
      updateDetailRenderMetrics();
      requestAnimationFrame(() => updateDetailRenderMetrics());
    });
  }

  function syncRenderMode() {
    dlg.dataset.renderMode = detailRenderMode;
  }

  /* ─── Build enriched list ─── */
  function buildEnriched() {
    const usedKids = new Set();
    enriched = methods.map((m) => {
      const en = m.en;
      const cs = m.cs;
      const modality = en.Modality;
      const energyKey = classifyEnergy(en["Activation Energy"]);
      const stateKeys = classifyStates(en["Target Emotional State(s)"]);
      let kid = kidsMap[m.id] || null;
      if (kid && usedKids.has(kid.id)) kid = null;
      if (kid) usedKids.add(kid.id);
      return { id: m.id, en, cs, modality, energyKey, stateKeys, kid };
    });
  }

  function updateQuiverReviewStatus() {
    const u = UI[lang];
    reviewStatusEl.textContent = u.reviewStatus(
      quiverReviewStats.ready,
      quiverReviewCards.length,
      quiverReviewStats.missing,
      quiverReviewStats.checking,
    );
  }

  function syncQuiverReviewVisibility() {
    const u = UI[lang];
    const hasCards = quiverReviewCards.length > 0;
    reviewToggleBtn.hidden = !hasCards;
    reviewToggleBtn.textContent = quiverReviewVisible ? u.reviewHide : u.reviewShow;
    reviewSection.hidden = !hasCards || !quiverReviewVisible;
  }

  function setQuiverReviewVisible(nextVisible) {
    quiverReviewVisible = nextVisible;
    localStorage.setItem(QUIVER_REVIEW_KEY, String(quiverReviewVisible));
    syncQuiverReviewVisibility();
  }

  function buildQuiverReviewCard(card, renderToken) {
    const u = UI[lang];
    const stem = getQuiverReviewStem(card);
    const art = getFallbackReviewArt(card);
    const src = art ? art.src : getQuiverReviewSrc(card);
    const item = document.createElement("article");
    item.className = "quiver-review-card";
    item.dataset.reviewState = "checking";

    const artWrap = document.createElement("div");
    artWrap.className = "quiver-review-art";

    const img = document.createElement("img");
    img.src = src;
    img.alt = `${lang === "en" ? card.nickname_en : card.nickname} Quiver SVG`;
    img.loading = "lazy";
    attachArtFallback(img, art);

    let settled = false;
    const settle = (state) => {
      if (settled || renderToken !== quiverReviewRenderToken) return;
      settled = true;
      quiverReviewStats.checking -= 1;
      if (state === "ready") {
        item.dataset.reviewState = "ready";
        quiverReviewStats.ready += 1;
      } else {
        item.dataset.reviewState = "missing";
        quiverReviewStats.missing += 1;
        artWrap.replaceChildren();
        const placeholder = document.createElement("div");
        placeholder.className = "quiver-review-placeholder";
        placeholder.textContent = u.reviewMissing;
        artWrap.appendChild(placeholder);
      }
      updateQuiverReviewStatus();
    };

    img.addEventListener("load", () => settle("ready"), { once: true });
    img.addEventListener("error", () => settle("missing"), { once: true });
    artWrap.appendChild(img);

    const meta = document.createElement("div");
    meta.className = "quiver-review-meta";

    const id = document.createElement("div");
    id.className = "quiver-review-id";
    id.textContent = card.id.toUpperCase();

    const name = document.createElement("div");
    name.className = "quiver-review-name";
    name.textContent = lang === "en" ? card.nickname_en : card.nickname;

    const headline = document.createElement("div");
    headline.className = "quiver-review-headline";
    headline.textContent = lang === "en" ? card.headline_en : card.headline_cs;

    const link = document.createElement("a");
    link.className = "quiver-review-link";
    link.href = src;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = u.reviewOpen;

    meta.append(id, name, headline, link);
    item.append(artWrap, meta);
    return item;
  }

  function renderQuiverReview() {
    reviewTitleEl.textContent = UI[lang].reviewTitle;
    reviewLeadEl.textContent = UI[lang].reviewLead;
    quiverReviewCards = kidsCards.filter(isQuiverReviewCard);
    reviewGrid.replaceChildren();

    if (!quiverReviewCards.length) {
      quiverReviewStats = { ready: 0, missing: 0, checking: 0 };
      updateQuiverReviewStatus();
      syncQuiverReviewVisibility();
      return;
    }

    const renderToken = ++quiverReviewRenderToken;
    quiverReviewStats = { ready: 0, missing: 0, checking: quiverReviewCards.length };
    updateQuiverReviewStatus();

    for (const card of quiverReviewCards) {
      reviewGrid.appendChild(buildQuiverReviewCard(card, renderToken));
    }
    syncQuiverReviewVisibility();
  }

  /* ─── Render chip buttons ─── */
  function renderChips() {
    const u = UI[lang];
    const mods = MOD_MAP[lang];
    chipsMod.replaceChildren();
    for (const [key, label] of Object.entries(mods)) {
      chipsMod.appendChild(makeChip(label, "modality", key));
    }
    chipsState.replaceChildren();
    const states = STATE_MAP[lang];
    for (const key of STATE_ORDER) {
      chipsState.appendChild(makeChip(states[key], "state", key));
    }
    chipsNrg.replaceChildren();
    const nrg = ENERGY_MAP[lang];
    for (const key of ENERGY_ORDER) {
      chipsNrg.appendChild(makeChip(nrg[key], "energy", key));
    }
    if (chipsAge) {
      [...chipsAge.children].forEach(b => {
        b.onclick = () => {
          const v = b.dataset.val;
          sel.age = v === "" ? null : v;
          syncChips();
          render();
        };
      });
    }
  }

  function makeChip(label, dimension, value) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip";
    btn.dataset.filterKey = value;
    btn.textContent = label;
    btn.setAttribute("aria-pressed", sel[dimension].has(value) ? "true" : "false");
    btn.addEventListener("click", () => {
      if (sel[dimension].has(value)) {
        sel[dimension].delete(value);
      } else {
        sel[dimension].add(value);
      }
      syncChips();
      render();
    });
    return btn;
  }

  /** Sync aria-pressed on all chips; CSS handles visibility via .bubble.pinned state. */
  function repositionFilterChips(bubble, tray, keys, selectedKeys) {
    keys.forEach((k) => {
      let btn = tray.querySelector(`button[data-filter-key="${k}"]`);
      if (!btn) btn = bubble.querySelector(`:scope > button.chip[data-filter-key="${k}"]`);
      if (btn) tray.appendChild(btn);
    });
    keys.forEach((k) => {
      const btn = tray.querySelector(`button[data-filter-key="${k}"]`);
      if (btn) btn.setAttribute("aria-pressed", selectedKeys.has(k) ? "true" : "false");
    });
  }

  function syncChips() {
    repositionFilterChips(bubMod, chipsMod, Object.keys(MOD_MAP.en), sel.modality);
    repositionFilterChips(bubState, chipsState, STATE_ORDER, sel.state);
    repositionFilterChips(bubEnergy, chipsNrg, ENERGY_ORDER, sel.energy);
    if (chipsAge) {
      [...chipsAge.children].forEach(b => {
        const v = b.dataset.val;
        b.setAttribute("aria-pressed", (v === "" && sel.age === null) || (v === sel.age) ? "true" : "false");
      });
    }
    bubMod.classList.toggle("pinned", sel.modality.size > 0);
    bubState.classList.toggle("pinned", sel.state.size > 0);
    bubEnergy.classList.toggle("pinned", sel.energy.size > 0);
  }

  /* ─── Filter ─── */
  function filtered() {
    return enriched.filter((m) => {
      if (sel.modality.size > 0 && !sel.modality.has(m.modality)) return false;
      if (sel.state.size > 0 && !m.stateKeys.some((key) => sel.state.has(key))) return false;
      if (sel.energy.size > 0 && !sel.energy.has(m.energyKey)) return false;
      if (sel.age) {
        const row = lang === "en" ? m.en : m.cs;
        const rangeText = row["Age Range"] || "";
        const nums = (rangeText.match(/\d+/g) || []).map(Number);
        const ageNum = parseInt(sel.age, 10);
        if (nums.length >= 2) {
          if (ageNum < nums[0] || ageNum > nums[1]) return false;
        } else if (nums.length === 1) {
          if (ageNum < nums[0]) return false;
        }
      }
      return true;
    });
  }

  /* ─── Render cards ─── */
  function render() {
    const u = UI[lang];
    visibleCards = filtered();
    countEl.textContent = u.count(visibleCards.length, enriched.length);
    grid.replaceChildren();
    randomBtn.disabled = visibleCards.length === 0;
    if (!visibleCards.length) {
      emptyEl.hidden = false;
      emptyEl.textContent = u.empty;
      syncDialogNav();
      return;
    }
    emptyEl.hidden = true;
    for (const m of visibleCards) {
      grid.appendChild(buildCard(m));
    }
    syncDialogNav();
  }

  function buildCard(m) {
    const row = lang === "en" ? m.en : m.cs;
    const kid = m.kid;
    const color = kid ? kid.color : (MOD_COLORS[m.modality] || "#eee");
    const nickname = kid ? (lang === "en" ? kid.nickname_en : kid.nickname) : methodName(row);
    const art = getCardArt(m.id, kid);

    let headline = "";
    if (kid && kid.headline_cs) {
      headline = lang === "en" ? kid.headline_en : kid.headline_cs;
    } else {
      const rawStatesEn = m.en["Target Emotional State(s)"] ? m.en["Target Emotional State(s)"].split(";") : [];
      if (rawStatesEn.length > 0) {
        const rawFirstEn = rawStatesEn[0].trim();
        const classified = classifyStates(rawFirstEn);
        if (classified.length > 0) {
          headline = STATE_MAP[lang][classified[0]];
        } else {
          // Fallback to raw localized state if classification fails
          const rawStatesLoc = row["Target Emotional State(s)"] ? row["Target Emotional State(s)"].split(";") : [];
          headline = rawStatesLoc.length > 0 ? rawStatesLoc[0].trim() + "." : "";
        }
      }
    }

    const preview = kid
      ? firstLines(cleanKidBodyText(lang === "en" ? kid.body_en : kid.body_cs), 2)
      : (row["Brief Mechanism"] || "");

    const card = document.createElement("article");
    card.className = "card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    if (art) card.dataset.hasArt = "true";

    const artFrame = document.createElement("div");
    artFrame.className = "card-art-frame";

    const colorDiv = document.createElement("div");
    colorDiv.className = "card-color";
    colorDiv.style.backgroundColor = color;
    artFrame.appendChild(colorDiv);

    if (art) {
      const img = document.createElement("img");
      img.className = "card-art";
      img.src = art.src;
      img.alt = art.alt[lang] || nickname;
      img.loading = "lazy";
      attachArtFallback(img, art);
      colorDiv.appendChild(img);
    }

    const emoji = document.createElement("span");
    emoji.className = "card-emoji";
    emoji.textContent = MOD_EMOJI[m.modality] || "";
    colorDiv.appendChild(emoji);

    const titlePlate = document.createElement("div");
    titlePlate.className = "card-title-plate";

    const nick = document.createElement("span");
    nick.className = "card-nickname";
    nick.textContent = nickname;
    titlePlate.appendChild(nick);
    colorDiv.appendChild(titlePlate);

    const body = document.createElement("div");
    body.className = "card-body";

    const h2 = document.createElement("h2");
    h2.className = "card-headline";
    h2.textContent = headline;

    const prev = document.createElement("p");
    prev.className = "card-preview";
    prev.innerHTML = preview ? parseMd(preview) : "";

    const pills = document.createElement("div");
    pills.className = "card-pills";
    const pMod = document.createElement("span");
    pMod.className = "card-pill";
    pMod.textContent = MOD_MAP[lang][m.modality] || m.modality;
    const pNrg = document.createElement("span");
    pNrg.className = "card-pill";
    pNrg.textContent = ENERGY_MAP[lang][m.energyKey] || "";
    pills.append(pMod, pNrg);

    body.append(h2, prev, pills);
    card.append(artFrame, body);

    card.addEventListener("click", () => openDetailFromList(visibleCards, visibleCards.indexOf(m), card));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openDetailFromList(visibleCards, visibleCards.indexOf(m), card);
      }
    });
    return card;
  }

  function cleanKidBodyText(text) {
    return (text || "")
      .replace(/^\*\*[^*]+\*\*\n+/, "")
      .trim();
  }

  function firstLines(text, n) {
    return (text || "").split(/(?<=[\.\?\!])\s+/).slice(0, n).join(" ");
  }

  /* ─── Detail dialog ─── */
  function syncDialogNav() {
    const hasNav = activeModalCards.length > 1;
    dlgPrev.hidden = !hasNav;
    dlgNext.hidden = !hasNav;
    dlgPrev.disabled = !hasNav;
    dlgNext.disabled = !hasNav;
  }

  function openDetailFromList(list, index, triggerEl = null) {
    if (!Array.isArray(list) || list.length === 0 || index < 0 || index >= list.length) return;
    detailReturnFocusEl = triggerEl instanceof HTMLElement ? triggerEl : detailReturnFocusEl;
    activeModalCards = list;
    activeModalIndex = index;
    openDetail(activeModalCards[activeModalIndex]);
  }

  function stepDetail(delta) {
    if (!dlg.open || activeModalCards.length < 2 || activeModalIndex < 0 || detailTransitionBusy) return;
    activeModalIndex = (activeModalIndex + delta + activeModalCards.length) % activeModalCards.length;
    openDetail(activeModalCards[activeModalIndex], delta);
  }

  function openRandomCard() {
    if (visibleCards.length === 0) return;
    const index = Math.floor(Math.random() * visibleCards.length);
    openDetailFromList(visibleCards, index);
  }

  function closeDetail() {
    if (!dlg.open) return;
    dlg.close();
  }

  function renderDetailContent(m) {
    const u = UI[lang];
    const row = lang === "en" ? m.en : m.cs;
    const kid = m.kid;
    const color = kid ? kid.color : (MOD_COLORS[m.modality] || "#eee");
    const nickname = kid ? (lang === "en" ? kid.nickname_en : kid.nickname) : methodName(row);
    const art = getCardArt(m.id, kid);

    let headline = "";
    if (kid && kid.headline_cs) {
      headline = lang === "en" ? kid.headline_en : kid.headline_cs;
    } else {
      const rawStatesEn = m.en["Target Emotional State(s)"] ? m.en["Target Emotional State(s)"].split(";") : [];
      if (rawStatesEn.length > 0) {
        const rawFirstEn = rawStatesEn[0].trim();
        const classified = classifyStates(rawFirstEn);
        if (classified.length > 0) {
          headline = STATE_MAP[lang][classified[0]];
        } else {
          // Fallback to raw localized state if classification fails
          const rawStatesLoc = row["Target Emotional State(s)"] ? row["Target Emotional State(s)"].split(";") : [];
          headline = rawStatesLoc.length > 0 ? rawStatesLoc[0].trim() + "." : "";
        }
      }
    }

    dlgColor.style.backgroundColor = color;
    dlgColor.style.setProperty("--detail-art", art ? `url(${art.fallbackSrc || art.src})` : "none");
    dlgColor.dataset.hasArt = art ? "true" : "false";
    dlgNick.textContent = nickname;
    dlgHead.textContent = headline;

    if (kid) {
      const text = cleanKidBodyText(lang === "en" ? kid.body_en : kid.body_cs);
      dlgText.innerHTML = parseMd(text);
    } else {
      const parts = [];
      if (row["Brief Mechanism"]) parts.push(row["Brief Mechanism"]);
      const notes = row["Czech Adaptation Notes"];
      if (notes && lang !== "en") parts.push(notes);
      dlgText.textContent = parts.join("\n\n") || "";
    }

    dlgMeta.replaceChildren();
    const duration = (kid && kid["duration_" + lang]) || row["Duration of Activity"];
    const objects = (kid && kid["objects_" + lang]) || row["Required Objects"];
    const where = (kid && kid["where_" + lang]) || row["Setting Constraints"];

    const metaPairs = [
      [u.duration, duration],
      [u.objects, objects],
      [u.where, where],
    ];
    for (const [icon, val] of metaPairs) {
      if (!val) continue;
      const pill = document.createElement("span");
      pill.className = "dm-pill";
      pill.textContent = `${icon} ${val}`;
      dlgMeta.appendChild(pill);
    }

    dlgScroll.scrollTop = 0;
  }

  function animateDetailSwap(nextMethod, direction) {
    detailTransitionBusy = true;

    const outgoing = dlgCard.cloneNode(true);
    outgoing.removeAttribute("id");
    outgoing.classList.add("dialog-card-ghost", direction > 0 ? "is-leaving-next" : "is-leaving-prev");
    outgoing.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
    dlg.appendChild(outgoing);

    renderDetailContent(nextMethod);
    dlgCard.classList.add(direction > 0 ? "is-entering-next" : "is-entering-prev");

    const clearTransition = () => {
      outgoing.remove();
      dlgCard.classList.remove("is-entering-next", "is-entering-prev");
      detailTransitionBusy = false;
    };

    const handleEnd = (event) => {
      if (event.target !== dlgCard) return;
      dlgCard.removeEventListener("animationend", handleEnd);
      clearTransition();
    };

    dlgCard.addEventListener("animationend", handleEnd);
  }

  function animateScaledDetailSwap(nextMethod, direction) {
    detailTransitionBusy = true;
    clearHoverTilt();

    const outgoing = dlgScaleShell.cloneNode(true);
    outgoing.removeAttribute("id");
    outgoing.classList.remove("is-entering-next", "is-entering-prev");
    outgoing.classList.add("dialog-shell-ghost", direction > 0 ? "is-leaving-next" : "is-leaving-prev");
    outgoing.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
    dlg.appendChild(outgoing);

    renderDetailContent(nextMethod);
    scheduleDetailRenderMetrics();
    dlgScaleShell.classList.add(direction > 0 ? "is-entering-next" : "is-entering-prev");

    const clearTransition = () => {
      outgoing.remove();
      dlgScaleShell.classList.remove("is-entering-next", "is-entering-prev");
      detailTransitionBusy = false;
    };

    const handleEnd = (event) => {
      if (event.target !== dlgScaleShell) return;
      dlgScaleShell.removeEventListener("animationend", handleEnd);
      clearTransition();
    };

    dlgScaleShell.addEventListener("animationend", handleEnd);
  }

  function openDetail(m, direction = 0) {
    const shouldAnimate = dlg.open && direction !== 0;
    if (shouldAnimate) {
      if (isScaledDetailMode()) {
        animateScaledDetailSwap(m, direction);
      } else {
        animateDetailSwap(m, direction);
      }
      return;
    }

    renderDetailContent(m);

    syncDialogNav();
    if (!dlg.open) {
      if (!(detailReturnFocusEl instanceof HTMLElement)) {
        detailReturnFocusEl = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      }
      lockBackgroundScroll();
      dlg.showModal();
      scheduleDetailRenderMetrics();
      dlgClose.focus({ preventScroll: true });
    } else if (isScaledDetailMode()) {
      scheduleDetailRenderMetrics();
    }
  }

  dlgClose.addEventListener("click", closeDetail);
  dlg.addEventListener("click", (e) => { if (e.target === dlg) closeDetail(); });
  dlg.addEventListener("close", () => {
    detailTransitionBusy = false;
    dlg.querySelectorAll(".dialog-card-ghost").forEach((node) => node.remove());
    dlg.querySelectorAll(".dialog-shell-ghost").forEach((node) => node.remove());
    dlgCard.classList.remove("is-entering-next", "is-entering-prev");
    dlgScaleShell.classList.remove("is-entering-next", "is-entering-prev");
    clearHoverTilt();
    unlockBackgroundScroll();
    detailScrollSnapshot = null;
    if (detailReturnFocusEl instanceof HTMLElement && document.contains(detailReturnFocusEl)) {
      detailReturnFocusEl.focus({ preventScroll: true });
    }
    detailReturnFocusEl = null;
  });
  dlgPrev.addEventListener("click", () => stepDetail(-1));
  dlgNext.addEventListener("click", () => stepDetail(1));
  randomBtn.addEventListener("click", openRandomCard);
  document.addEventListener("keydown", (e) => {
    if (!dlg.open) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      stepDetail(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      stepDetail(1);
    }
  });

  window.addEventListener("resize", () => {
    if (dlg.open && isScaledDetailMode()) scheduleDetailRenderMetrics();
  });

  if (typeof ResizeObserver === "function") {
    const detailResizeObserver = new ResizeObserver(() => {
      if (dlg.open && isScaledDetailMode()) updateDetailRenderMetrics();
    });
    detailResizeObserver.observe(dlg);
    detailResizeObserver.observe(dlgScaleShell);
  }

  /* ─── Hover tilt (mouse-tracking 3D) ─── */
  const HOVER_TILT_MAX = 3.5; // degrees

  function clearHoverTilt() {
    dlgScaleShell.style.transform = "";
  }

  dlg.addEventListener("mousemove", (e) => {
    if (detailTransitionBusy || !dlg.open) return;
    const rect = dlgScaleShell.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const x = (e.clientX - rect.left) / rect.width;   // 0..1
    const y = (e.clientY - rect.top) / rect.height;    // 0..1
    const tiltX = (0.5 - y) * HOVER_TILT_MAX;  // top edge → positive (tilts toward viewer)
    const tiltY = (x - 0.5) * HOVER_TILT_MAX;  // right edge → positive (tilts toward viewer)
    dlgScaleShell.style.transform = `rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg)`;
  });

  dlg.addEventListener("mouseleave", () => {
    if (!detailTransitionBusy) clearHoverTilt();
  });

  /* ─── Language ─── */
  function setLang(next) {
    lang = next;
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang === "en" ? "en" : "cs";
    btnCs.setAttribute("aria-pressed", lang === "cs" ? "true" : "false");
    btnEn.setAttribute("aria-pressed", lang === "en" ? "true" : "false");
    const u = UI[lang];
    $("site-title").textContent = u.title;
    $("site-lead").textContent = u.lead;
    $("bub-modality-label").textContent = u.accModality;
    $("bub-state-label").textContent = u.accState;
    $("bub-energy-label").textContent = u.accEnergy;
    if ($("bub-age-label")) $("bub-age-label").textContent = u.accAge;
    if ($("age-all")) $("age-all").textContent = u.optAll;
    $("pro-link").textContent = u.proLink;
    randomBtn.textContent = u.random;
    randomBtn.setAttribute("aria-label", u.random);
    $("footer-text").innerHTML = u.footer;
    dlgClose.setAttribute("aria-label", u.close);
    dlgPrev.setAttribute("aria-label", u.prev);
    dlgNext.setAttribute("aria-label", u.next);
    syncRenderMode();
    renderChips();
    syncChips();
    render();
    renderSpecialCard();
    renderQuiverReview();
  }

  /* ─── Special cards (wound care, scar aftercare) ─── */
  const SPECIAL_EMOJI = { first_aid: '✚', healing_skin: '🌱' };

  function renderSpecialCard() {
    if (!specialCards.length) { specialSection.hidden = true; return; }
    specialSection.hidden = false;
    specialCardEl.innerHTML = '';
    for (const sc of specialCards) {
      const btn = document.createElement('div');
      btn.className = 'special-card-item';
      btn.tabIndex = 0;
      btn.setAttribute('role', 'button');
      btn.dataset.specialId = sc.id;
      const emoji = document.createElement('span');
      emoji.className = 'special-card-emoji';
      emoji.textContent = SPECIAL_EMOJI[sc.id] || '🩹';
      const nickEl = document.createElement('span');
      nickEl.className = 'special-card-nick';
      nickEl.textContent = lang === 'en' ? sc.nickname_en : sc.nickname;
      const headEl = document.createElement('span');
      headEl.className = 'special-card-headline';
      headEl.textContent = lang === 'en' ? sc.headline_en : sc.headline_cs;
      const arrow = document.createElement('span');
      arrow.className = 'special-card-arrow';
      arrow.textContent = '›';
      btn.append(emoji, nickEl, headEl, arrow);
      btn.addEventListener('click', () => openSpecialDetail(sc));
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openSpecialDetail(sc); }
      });
      specialCardEl.append(btn);
    }
  }

  function openSpecialDetail(card) {
    if (!card) return;
    const nick = lang === 'en' ? card.nickname_en : card.nickname;
    const headline = lang === 'en' ? card.headline_en : card.headline_cs;
    const bodyText = cleanKidBodyText(lang === 'en' ? card.body_en : card.body_cs);
    const art = getFallbackReviewArt(card);
    dlgColor.style.backgroundColor = card.color;
    dlgColor.style.setProperty('--detail-art', art ? `url(${art.fallbackSrc || art.src})` : 'none');
    dlgColor.dataset.hasArt = art ? 'true' : 'false';
    dlgNick.textContent = nick;
    dlgHead.textContent = headline;
    dlgText.innerHTML = parseMd(bodyText);
    dlgMeta.replaceChildren();
    dlgScroll.scrollTop = 0;
    activeModalCards = [];
    activeModalIndex = -1;
    syncDialogNav();
    if (!dlg.open) {
      detailReturnFocusEl = specialCardEl;
      lockBackgroundScroll();
      dlg.showModal();
      scheduleDetailRenderMetrics();
      dlgClose.focus({ preventScroll: true });
    } else if (isScaledDetailMode()) {
      scheduleDetailRenderMetrics();
    }
  }

  btnCs.addEventListener("click", () => setLang("cs"));
  btnEn.addEventListener("click", () => setLang("en"));
  reviewToggleBtn.addEventListener("click", () => setQuiverReviewVisible(!quiverReviewVisible));

  /* ─── Load data ─── */
  Promise.all([
    fetch("data/methods_bilingual.json").then((r) => r.json()),
    fetch("data/kids_cards.json").then((r) => r.json()),
  ])
    .then(([mData, kData]) => {
      methods = mData;
      kidsCards = kData;
      kidsMap = {};
      specialCards = [];
      for (const k of kidsCards) {
        if (k.special) { specialCards.push(k); continue; }
        for (const rid of k.related || []) {
          if (!kidsMap[rid]) kidsMap[rid] = k;
        }
      }
      buildEnriched();
      setLang(lang);
    })
    .catch((err) => {
      console.error(err);
      grid.innerHTML =
        '<p style="text-align:center;color:#888;grid-column:1/-1;">Data se nepodařilo načíst. Spusť přes HTTP server.</p>';
    });
}

main();

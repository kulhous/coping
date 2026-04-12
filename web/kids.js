import { parseMd } from "./parse_md.js";

const LANG_KEY = "coping-methods-lang";

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

/* ─── UI text ─── */
const UI = {
  cs: {
    title: "🌈 Kartičky zvládání",
    lead: "Vyber si, co se ti teď hodí. Klikni a rozbal.",
    accModality: "🎯 Co chci dělat?",
    accState: "💭 Co cítím?",
    accEnergy: "🔋 Kolik mám síly?",
    accAge: "🎂 Kolik mi je?",
    optAll: "Vše",
    close: "Zavřít",
    proLink: "📋 Odborný přehled",
    count: (n, t) => `${n} z ${t} kartiček`,
    empty: "🤷 Nic tu není — zkus jinou kombinaci.",
    footer: 'V akutní krizi kontaktuj Linku bezpečí — <strong>116&nbsp;111</strong> (zdarma) · <a href="https://chat.linkabezpeci.cz" target="_blank" rel="noopener">chat.linkabezpeci.cz</a> 💚',
    duration: "⏱️",
    objects: "🎒",
    where: "📍",
    mechanism: "🔬 Jak to funguje",
  },
  en: {
    title: "🌈 Coping cards",
    lead: "Pick what fits right now. Tap and explore.",
    accModality: "🎯 What do I want to do?",
    accState: "💭 What do I feel?",
    accEnergy: "🔋 How much energy do I have?",
    accAge: "🎂 How old am I?",
    optAll: "All",
    close: "Close",
    proLink: "📋 Professional view",
    count: (n, t) => `${n} of ${t} cards`,
    empty: "🤷 Nothing here — try a different combo.",
    footer: 'In an acute crisis, reach a trusted adult or your local helpline. 💚',
    duration: "⏱️",
    objects: "🎒",
    where: "📍",
    mechanism: "🔬 How it works",
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
  const dlgColor  = $("detail-color");
  const dlgNick   = $("detail-nickname");
  const dlgHead   = $("detail-headline");
  const dlgText   = $("detail-text");
  const dlgMeta   = $("detail-meta");
  const dlgClose  = $("detail-close");
  const btnCs     = $("lang-cs");
  const btnEn     = $("lang-en");
  const chipsMod  = $("chips-modality");
  const chipsState= $("chips-state");
  const chipsNrg  = $("chips-energy");
  const chipsAge  = $("chips-age");
  const lblAge    = $("bub-age-label");
  const ageAll    = $("age-all");

  let methods = [];       // from methods_bilingual.json
  let kidsCards = [];     // from kids_cards.json
  let kidsMap = {};       // method_id -> kids card
  let enriched = [];      // methods with computed fields
  let lang = localStorage.getItem(LANG_KEY) || "cs";

  // Active filters
  const sel = { modality: null, state: null, energy: null, age: null };

  function methodName(row) {
    return row["Name (Child-friendly)"] || row["Name (Card Title)"] || row["Name (Professional)"] || "";
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
    btn.textContent = label;
    btn.setAttribute("aria-pressed", sel[dimension] === value ? "true" : "false");
    btn.addEventListener("click", () => {
      sel[dimension] = sel[dimension] === value ? null : value;
      syncChips();
      render();
    });
    return btn;
  }

  function syncChips() {
    [...chipsMod.children].forEach((b, i) => {
      const key = Object.keys(MOD_MAP.en)[i];
      b.setAttribute("aria-pressed", sel.modality === key ? "true" : "false");
    });
    [...chipsState.children].forEach((b, i) => {
      b.setAttribute("aria-pressed", sel.state === STATE_ORDER[i] ? "true" : "false");
    });
    [...chipsNrg.children].forEach((b, i) => {
      b.setAttribute("aria-pressed", sel.energy === ENERGY_ORDER[i] ? "true" : "false");
    });
    if (chipsAge) {
      [...chipsAge.children].forEach(b => {
        const v = b.dataset.val;
        b.setAttribute("aria-pressed", (v === "" && sel.age === null) || (v === sel.age) ? "true" : "false");
      });
    }
    bubMod.classList.toggle("pinned", sel.modality !== null);
    bubState.classList.toggle("pinned", sel.state !== null);
    bubEnergy.classList.toggle("pinned", sel.energy !== null);
  }

  /* ─── Filter ─── */
  function filtered() {
    return enriched.filter((m) => {
      if (sel.modality && m.modality !== sel.modality) return false;
      if (sel.state && !m.stateKeys.includes(sel.state)) return false;
      if (sel.energy && m.energyKey !== sel.energy) return false;
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
    const list = filtered();
    countEl.textContent = u.count(list.length, enriched.length);
    grid.replaceChildren();
    if (!list.length) {
      emptyEl.hidden = false;
      emptyEl.textContent = u.empty;
      return;
    }
    emptyEl.hidden = true;
    for (const m of list) {
      grid.appendChild(buildCard(m));
    }
  }

  function buildCard(m) {
    const row = lang === "en" ? m.en : m.cs;
    const kid = m.kid;
    const color = kid ? kid.color : (MOD_COLORS[m.modality] || "#eee");
    const nickname = kid ? (lang === "en" ? kid.nickname_en : kid.nickname) : methodName(row);

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
      ? firstLines(lang === "en" ? kid.body_en : kid.body_cs, 2)
      : (row["Brief Mechanism"] || "");

    const card = document.createElement("article");
    card.className = "card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");

    const colorDiv = document.createElement("div");
    colorDiv.className = "card-color";
    colorDiv.style.backgroundColor = color;

    const emoji = document.createElement("span");
    emoji.className = "card-emoji";
    emoji.textContent = MOD_EMOJI[m.modality] || "";
    colorDiv.appendChild(emoji);

    const nick = document.createElement("span");
    nick.className = "card-nickname";
    nick.textContent = nickname;
    colorDiv.appendChild(nick);

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
    card.append(colorDiv, body);

    card.addEventListener("click", () => openDetail(m));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDetail(m); }
    });
    return card;
  }

  function firstLines(text, n) {
    return (text || "").split(/(?<=[\.\?\!])\s+/).slice(0, n).join(" ");
  }

  /* ─── Detail dialog ─── */
  function openDetail(m) {
    const u = UI[lang];
    const row = lang === "en" ? m.en : m.cs;
    const kid = m.kid;
    const color = kid ? kid.color : (MOD_COLORS[m.modality] || "#eee");
    const nickname = kid ? (lang === "en" ? kid.nickname_en : kid.nickname) : methodName(row);

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
    dlgNick.textContent = nickname;
    dlgHead.textContent = headline;

    if (kid) {
      const text = lang === "en" ? (kid.body_en || "") : (kid.body_cs || "");
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

    dlg.showModal();
  }

  dlgClose.addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });

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
    $("footer-text").innerHTML = u.footer;
    dlgClose.setAttribute("aria-label", u.close);
    renderChips();
    syncChips();
    render();
  }

  btnCs.addEventListener("click", () => setLang("cs"));
  btnEn.addEventListener("click", () => setLang("en"));

  /* ─── Load data ─── */
  Promise.all([
    fetch("data/methods_bilingual.json").then((r) => r.json()),
    fetch("data/kids_cards.json").then((r) => r.json()),
  ])
    .then(([mData, kData]) => {
      methods = mData;
      kidsCards = kData;
      kidsMap = {};
      for (const k of kidsCards) {
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

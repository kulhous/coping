import { parseMd } from "./parse_md.js";

const STORAGE_KEY = "coping-methods-lang";

const FIELD_ORDER = [
  "Name (Professional)",
  "Name (Child-friendly)",
  "Modality",
  "Source(s)",
  "Age Range",
  "Target Emotional State(s)",
  "Activation Energy",
  "Time to Effect",
  "Duration of Activity",
  "Required Objects",
  "Setting Constraints",
  "Brief Mechanism",
  "Bridges to Help-Seeking",
  "Repeatability",
  "Evidence Strength",
  "Czech Adaptation Notes",
];

/** @type {{ cs: Record<string, string>, en: Record<string, string> }} */
const UI = {
  cs: {
    title: "Databáze copingových metod",
    lead: "Interaktivní průvodce strategiemi zvládání pro děti a dospívající (8–18 let). Vyhledej podle nálady, modality nebo náročnosti.",
    searchPlaceholder: "Hledat v názvu, mechanismu, zdrojích…",
    searchLabel: "Hledat",
    langGroup: "Jazyk",
    lblModality: "Modalita",
    lblState: "Cílový emoční stav",
    lblEnergy: "Aktivační energie",
    lblEvidence: "Síla evidence",
    lblAge: "Rozsah věku",
    optAll: "Vše",
    meta: (n, total) => `Zobrazeno ${n} z ${total} metod`,
    empty: "Žádná metoda nevyhovuje filtrům.",
    expand: "Podrobnosti",
    close: "Zavřít",
    kidsLink: "Kartičky pro děti a dospívající",
    footnote:
      "Informace slouží k osvětě a nenahrazují odbornou péči. V akutní krizi kontaktuj dospělého důvěry nebo Linku bezpečí (116 111, chat.linkabezpeci.cz).",
    fields: {
      "Name (Professional)": "Odborný název",
      "Name (Child-friendly)": "Dětský název",
      Modality: "Modalita",
      "Source(s)": "Zdroje",
      "Age Range": "Věk",
      "Target Emotional State(s)": "Cílové emoční stavy",
      "Activation Energy": "Aktivační energie",
      "Time to Effect": "Čas do účinku",
      "Duration of Activity": "Délka aktivity",
      "Required Objects": "Potřebné předměty",
      "Setting Constraints": "Omezení prostředí",
      "Brief Mechanism": "Stručný mechanismus",
      "Bridges to Help-Seeking": "Most k vyhledání pomoci",
      Repeatability: "Opakovatelnost",
      "Evidence Strength": "Síla evidence",
      "Czech Adaptation Notes": "Poznámky k české adaptaci",
    },
  },
  en: {
    title: "Coping methods database",
    lead: "Interactive guide to regulation strategies for children and teens (ages 8–18). Search by mood, modality, or effort level.",
    searchPlaceholder: "Search title, mechanism, sources…",
    searchLabel: "Search",
    langGroup: "Language",
    lblModality: "Modality",
    lblState: "Target emotional state",
    lblEnergy: "Activation energy",
    lblEvidence: "Evidence strength",
    lblAge: "Age range",
    optAll: "All",
    meta: (n, total) => `Showing ${n} of ${total} methods`,
    empty: "No methods match the filters.",
    expand: "Details",
    close: "Close",
    kidsLink: "Cards for kids & teens",
    footnote:
      "For education only — not a substitute for professional care. In an acute crisis, reach a trusted adult or your local helpline.",
    fields: {
      "Name (Professional)": "Professional name",
      "Name (Child-friendly)": "Child-friendly name",
      Modality: "Modality",
      "Source(s)": "Sources",
      "Age Range": "Age range",
      "Target Emotional State(s)": "Target emotional state(s)",
      "Activation Energy": "Activation energy",
      "Time to Effect": "Time to effect",
      "Duration of Activity": "Duration",
      "Required Objects": "Required objects",
      "Setting Constraints": "Setting constraints",
      "Brief Mechanism": "Brief mechanism",
      "Bridges to Help-Seeking": "Bridges to help-seeking",
      Repeatability: "Repeatability",
      "Evidence Strength": "Evidence strength",
      "Czech Adaptation Notes": "Czech adaptation notes",
    },
  },
};

/** @param {string} lang */
function getLang(lang) {
  return lang === "en" ? UI.en : UI.cs;
}

/** @param {string} energy */
function energyClass(energy) {
  const s = (energy || "").toLowerCase();
  if (s.includes("high") || s.includes("vysok")) return "energy-high";
  if (s.includes("medium") || s.includes("střed")) return "energy-med";
  if (s.includes("low") || s.includes("nízk")) return "energy-low";
  return "";
}

/** @param {string} text */
function splitStates(text) {
  if (!text) return [];
  return text
    .split(";")
    .map((p) => p.trim())
    .filter(Boolean);
}

function collectUniqueStates(records, lang) {
  const set = new Set();
  for (const r of records) {
    const row = lang === "en" ? r.en : r.cs;
    for (const p of splitStates(row["Target Emotional State(s)"])) set.add(p);
  }
  return [...set].sort((a, b) => a.localeCompare(b, lang === "en" ? "en" : "cs"));
}

/** @param {ReturnType<typeof getLang>} u */
function collectUnique(records, lang, key) {
  const set = new Set();
  for (const r of records) {
    const row = lang === "en" ? r.en : r.cs;
    const v = row[key];
    if (v) set.add(String(v));
  }
  return [...set].sort((a, b) => a.localeCompare(b, lang === "en" ? "en" : "cs"));
}

/** @param {Record<string, string | null>} row @param {string} q */
function rowMatchesQuery(row, q) {
  if (!q) return true;
  const hay = FIELD_ORDER.map((k) => row[k] || "")
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

function applyFilters(records, lang, q, modality, state, energy, evidence, ageStr) {
  return records.filter((r) => {
    const row = lang === "en" ? r.en : r.cs;
    if (!rowMatchesQuery(row, q)) return false;
    if (modality && row.Modality !== modality) return false;
    if (energy && row["Activation Energy"] !== energy) return false;
    if (evidence && row["Evidence Strength"] !== evidence) return false;
    if (state) {
      const targets = row["Target Emotional State(s)"] || "";
      if (!targets.includes(state)) return false;
    }
    if (ageStr) {
      const ageNum = parseInt(ageStr, 10);
      const rangeText = row["Age Range"] || "";
      const nums = (rangeText.match(/\d+/g) || []).map(Number);
      if (nums.length >= 2) {
        if (ageNum < nums[0] || ageNum > nums[1]) return false;
      } else if (nums.length === 1) {
        if (ageNum < nums[0]) return false;
      }
    }
    return true;
  });
}

function main() {
  const grid = document.getElementById("grid");
  const meta = document.getElementById("meta");
  const empty = document.getElementById("empty");
  const foot = document.getElementById("footnote");
  const qEl = document.getElementById("q");
  const fMod = document.getElementById("f-modality");
  const fState = document.getElementById("f-state");
  const fEnergy = document.getElementById("f-energy");
  const fEvidence = document.getElementById("f-evidence");
  const ageBtns = document.querySelectorAll(".age-btn");
  const btnCs = document.getElementById("lang-cs");
  const btnEn = document.getElementById("lang-en");
  const dlg = document.getElementById("detail");
  const dlgTitle = document.getElementById("detail-title");
  const dlgId = document.getElementById("detail-id");
  const dlgFields = document.getElementById("detail-fields");
  const dlgClose = document.getElementById("detail-close");
  const dlgCloseX = document.getElementById("detail-close-x");

  let records = [];
  let lang = localStorage.getItem(STORAGE_KEY) || "cs";
  let currentAge = "";

  ageBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      ageBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentAge = btn.dataset.val;
      render();
    });
  });

  function setLang(next) {
    lang = next;
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang === "en" ? "en" : "cs";
    btnCs.setAttribute("aria-pressed", lang === "cs" ? "true" : "false");
    btnEn.setAttribute("aria-pressed", lang === "en" ? "true" : "false");
    const g = getLang(lang);
    document.getElementById("title").textContent = g.title;
    document.getElementById("lead").textContent = g.lead;
    qEl.placeholder = g.searchPlaceholder;
    document.getElementById("searchLabel").textContent = g.searchLabel;
    document.querySelector(".lang-toggle").setAttribute("aria-label", g.langGroup);
    document.getElementById("lbl-modality").textContent = g.lblModality;
    document.getElementById("lbl-state").textContent = g.lblState;
    document.getElementById("lbl-energy").textContent = g.lblEnergy;
    document.getElementById("lbl-evidence").textContent = g.lblEvidence;
    document.getElementById("lbl-age").textContent = g.lblAge;
    const btnAllAge = document.querySelector('.age-btn[data-val=""]');
    if (btnAllAge) btnAllAge.textContent = g.optAll;
    foot.textContent = g.footnote;
    document.getElementById("kids-link").textContent = g.kidsLink;
    const kidsHeader = document.getElementById("kids-header-link");
    if (kidsHeader) kidsHeader.textContent = g.kidsLink;
    dlgClose.textContent = g.close;
    rebuildFilterOptions();
    render();
  }

  function rebuildFilterOptions() {
    const g = getLang(lang);
    const sel = [
      [fMod, "Modality", collectUnique(records, lang, "Modality")],
      [fState, null, collectUniqueStates(records, lang)],
      [fEnergy, "Activation Energy", collectUnique(records, lang, "Activation Energy")],
      [fEvidence, "Evidence Strength", collectUnique(records, lang, "Evidence Strength")],
    ];
    for (const [el, _key, values] of sel) {
      const cur = el.value;
      el.replaceChildren();
      const all = document.createElement("option");
      all.value = "";
      all.textContent = g.optAll;
      el.appendChild(all);
      for (const v of values) {
        const o = document.createElement("option");
        o.value = v;
        o.textContent = v;
        el.appendChild(o);
      }
      if ([...el.options].some((o) => o.value === cur)) el.value = cur;
    }
  }

  function render() {
    const g = getLang(lang);
    const q = qEl.value.trim().toLowerCase();
    const list = applyFilters(
      records,
      lang,
      q,
      fMod.value,
      fState.value,
      fEnergy.value,
      fEvidence.value,
      currentAge
    );
    meta.textContent = g.meta(list.length, records.length);
    grid.replaceChildren();
    if (!list.length) {
      empty.hidden = false;
      empty.textContent = g.empty;
      return;
    }
    empty.hidden = true;
    for (const r of list) {
      const row = lang === "en" ? r.en : r.cs;
      const card = document.createElement("article");
      card.className = "card";
      card.style.cursor = "pointer";
      card.addEventListener("click", (e) => {
        if (e.target.closest("button")) return;
        openDetail(r);
      });
      const header = document.createElement("header");
      const idSpan = document.createElement("span");
      idSpan.className = "id";
      idSpan.textContent = r.id;
      const h2 = document.createElement("h2");
      const namePro = row["Name (Professional)"] || row["Name (Card Title)"] || "";
      const nameKid = row["Name (Child-friendly)"] || "";
      h2.textContent = namePro + (nameKid && nameKid !== namePro ? ` / ${nameKid}` : "");
      header.append(idSpan, h2);
      const pills = document.createElement("div");
      pills.className = "pills";
      const pMod = document.createElement("span");
      pMod.className = "pill";
      pMod.textContent = row.Modality || "";
      const pEn = document.createElement("span");
      pEn.className = `pill ${energyClass(row["Activation Energy"] || "")}`;
      pEn.textContent = row["Activation Energy"] || "";
      pills.append(pMod, pEn);
      const mech = document.createElement("p");
      mech.className = "mechanism";
      const mechRaw = row["Brief Mechanism"] || "";
      mech.innerHTML = mechRaw ? parseMd(mechRaw) : "";
      const footer = document.createElement("footer");
      const ev = document.createElement("span");
      ev.className = "pill";
      ev.textContent = row["Evidence Strength"] || "";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "expand";
      btn.textContent = g.expand;
      btn.addEventListener("click", () => openDetail(r));
      footer.append(ev, btn);
      card.append(header, pills, mech, footer);
      grid.appendChild(card);
    }
  }

  /** @param {{ id: string, en: Record<string, string|null>, cs: Record<string, string|null>, kidsCards?: any[] }} r */
  function openDetail(r) {
    const g = getLang(lang);
    const row = lang === "en" ? r.en : r.cs;
    dlgId.textContent = r.id;
    const namePro = row["Name (Professional)"] || "";
    const nameKid = row["Name (Child-friendly)"] || "";
    dlgTitle.textContent = namePro + (nameKid && nameKid !== namePro ? ` / ${nameKid}` : "");
    dlgFields.replaceChildren();
    for (const key of FIELD_ORDER) {
      if (key === "Name (Professional)" || key === "Name (Child-friendly)") continue;
      const val = row[key];
      if (val === null || val === undefined || val === "") continue;
      const dt = document.createElement("dt");
      dt.textContent = g.fields[key] || key;
      const dd = document.createElement("dd");
      if (key === "Brief Mechanism" || key === "Czech Adaptation Notes") {
        dd.innerHTML = parseMd(val);
      } else {
        dd.textContent = val;
      }
      dlgFields.append(dt, dd);
    }

    if (r.kidsCards && r.kidsCards.length > 0) {
      const dt = document.createElement("dt");
      dt.textContent = lang === "en" ? "What the child sees" : "Co vidí dítě";
      const dd = document.createElement("dd");
      dd.style.display = "flex";
      dd.style.flexDirection = "column";
      dd.style.gap = "8px";
      for (const kc of r.kidsCards) {
        const headline = lang === "en" ? kc.headline_en : kc.headline_cs;
        const body = lang === "en" ? kc.body_en : kc.body_cs;
        const color = kc.color || "#eee";
        const cardBox = document.createElement("div");
        cardBox.className = "kids-card-preview";
        cardBox.style.backgroundColor = color;
        const strong = document.createElement("strong");
        strong.textContent = headline || "";
        cardBox.appendChild(strong);
        cardBox.appendChild(document.createElement("br"));
        cardBox.appendChild(document.createElement("br"));
        const bodyText = (body || "").split("\n");
        bodyText.forEach((line, i) => {
          cardBox.appendChild(document.createTextNode(line));
          if (i < bodyText.length - 1) cardBox.appendChild(document.createElement("br"));
        });
        dd.appendChild(cardBox);
      }
      dlgFields.append(dt, dd);
    }

    dlg.showModal();
    document.querySelector(".panel-inner").scrollTop = 0;
  }

  dlgClose.addEventListener("click", () => dlg.close());
  dlgCloseX.addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => {
    if (e.target === dlg) dlg.close();
  });

  btnCs.addEventListener("click", () => setLang("cs"));
  btnEn.addEventListener("click", () => setLang("en"));

  for (const el of [qEl, fMod, fState, fEnergy, fEvidence]) {
    el.addEventListener("input", render);
    el.addEventListener("change", render);
  }

  Promise.all([
    fetch("data/methods_bilingual.json").then((res) => {
      if (!res.ok) throw new Error(String(res.status));
      return res.json();
    }),
    fetch("data/kids_cards.json").then((res) => {
      if (!res.ok) throw new Error(String(res.status));
      return res.json();
    }).catch(() => [])
  ])
    .then(([methodsData, kidsData]) => {
      records = methodsData;
      for (const r of records) {
        r.kidsCards = kidsData.filter((kc) => kc.related && kc.related.includes(r.id));
      }
      setLang(lang);
    })
    .catch(() => {
      grid.replaceChildren();
      const g = getLang(lang);
      empty.hidden = false;
      empty.textContent =
        lang === "en"
          ? "Could not load data. Serve this folder over HTTP (e.g. python -m http.server)."
          : "Data se nepodařilo načíst. Spusť složku přes HTTP (např. python -m http.server).";
      meta.textContent = "";
    });
}

main();

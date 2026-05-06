// MindPrep — UI binding pour l'Exposé intelligent
// Branche le formulaire #presentationForm, génère un exposé via le moteur
// local (avec hooks AI prêts), et injecte le résultat dans la vue.

import {
  generatePresentation,
  generateMindMapWithNapkin,
  PRESENTATION_INTEGRATIONS,
} from "./index.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

let lastPresentation = null;

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value || "";
}

function renderOutline(axes) {
  const root = $("#presoOutline");
  if (!root) return;
  root.innerHTML = axes
    .map(
      (a) => `
      <li>
        <strong>${escapeHtml(a.title)}</strong>
        <small style="display:block;color:var(--muted);margin:2px 0 4px;">${escapeHtml(a.lens)}</small>
        <ul>${a.sub.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>
      </li>`,
    )
    .join("");
}

function renderList(id, items) {
  const root = document.getElementById(id);
  if (!root) return;
  root.innerHTML = items.map((s) => `<li>${escapeHtml(s)}</li>`).join("");
}

function renderSlides(slides) {
  const root = $("#presoSlides");
  if (!root) return;
  root.innerHTML = slides
    .map(
      (s) => `
      <div class="preso-slide">
        <span class="preso-slide-tag">${escapeHtml(s.tag || "")}</span>
        <span class="preso-slide-num">SLIDE ${escapeHtml(s.num)}</span>
        <h4 class="preso-slide-title">${escapeHtml(s.title)}</h4>
        <p class="preso-slide-body">${escapeHtml(s.body)}</p>
      </div>`,
    )
    .join("");
}

function renderMindMap(mm) {
  const svg = $("#presoMindmap");
  if (!svg) return;
  const W = 720;
  const H = 420;
  const cx = W / 2;
  const cy = H / 2;
  const branchRadius = Math.min(W, H) * 0.32;
  const branches = mm.branches || [];
  const N = Math.max(branches.length, 1);
  const parts = [];

  // Centre
  parts.push(
    `<g><rect class="mm-node-bg mm-center-bg" x="${cx - 110}" y="${cy - 30}" width="220" height="60" rx="14"/>` +
      `<text class="mm-text mm-center-text" x="${cx}" y="${cy + 5}" text-anchor="middle">${escapeHtml(truncate(mm.center, 36))}</text></g>`,
  );

  branches.forEach((b, i) => {
    const angle = (Math.PI * 2 * i) / N - Math.PI / 2;
    const bx = cx + Math.cos(angle) * branchRadius;
    const by = cy + Math.sin(angle) * branchRadius;
    parts.push(`<path class="mm-link" d="M ${cx} ${cy} Q ${(cx + bx) / 2} ${(cy + by) / 2 - 10} ${bx} ${by}"/>`);
    parts.push(
      `<g><rect class="mm-node-bg" x="${bx - 90}" y="${by - 22}" width="180" height="44" rx="10"/>` +
        `<text class="mm-text" x="${bx}" y="${by + 4}" text-anchor="middle">${escapeHtml(truncate(b.label, 28))}</text></g>`,
    );
    // Sub-branches : positionnées en éventail
    (b.sub || []).slice(0, 3).forEach((sub, j) => {
      const subAngle = angle + (j - 1) * 0.32;
      const sxRaw = bx + Math.cos(subAngle) * 130;
      const syRaw = by + Math.sin(subAngle) * 60;
      const sx = clamp(sxRaw, 70, W - 70);
      const sy = clamp(syRaw, 24, H - 24);
      parts.push(`<path class="mm-link" d="M ${bx} ${by} L ${sx} ${sy}"/>`);
      parts.push(
        `<g><rect class="mm-node-bg mm-sub-bg" x="${sx - 60}" y="${sy - 14}" width="120" height="28" rx="8"/>` +
          `<text class="mm-text mm-sub-text" x="${sx}" y="${sy + 4}" text-anchor="middle">${escapeHtml(truncate(sub, 24))}</text></g>`,
      );
    });
  });

  svg.innerHTML = parts.join("");
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function truncate(s, n) {
  if (!s) return "";
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function renderCharts(charts) {
  const root = $("#presoCharts");
  if (!root) return;
  root.innerHTML = charts.map((c) => renderChartCard(c)).join("");
}

function renderChartCard(c) {
  const svg = renderChartSvg(c);
  return `
    <div class="preso-chart-card">
      <h4>${escapeHtml(c.title)}</h4>
      <small>${escapeHtml(c.goal)}</small>
      ${svg}
      <small><strong>Type recommandé :</strong> ${escapeHtml(c.type)} · données illustratives.</small>
    </div>`;
}

function renderChartSvg(c) {
  if (c.kind === "line") {
    const data = c.sample;
    const W = 240, H = 120;
    const max = Math.max(...data);
    const stepX = W / (data.length - 1);
    const points = data.map((v, i) => `${i * stepX},${H - (v / max) * (H - 16) - 4}`);
    const path = `M ${points.join(" L ")}`;
    const area = `M 0 ${H} L ${points.join(" L ")} L ${W} ${H} Z`;
    return `<svg class="preso-chart-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
      <defs><linearGradient id="lg-${Math.random().toString(36).slice(2, 7)}" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#10b981" stop-opacity=".35"/><stop offset="100%" stop-color="#10b981" stop-opacity="0"/></linearGradient></defs>
      <path d="${area}" fill="rgba(15,118,110,.15)"/>
      <path d="${path}" fill="none" stroke="#0f766e" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    </svg>`;
  }
  if (c.kind === "bar") {
    const data = c.sample;
    const W = 240, H = 120;
    const max = Math.max(...data.map((d) => d.value));
    const rowH = H / data.length;
    const bars = data.map((d, i) => {
      const w = (d.value / max) * (W - 80);
      const y = i * rowH + 4;
      return `
        <g>
          <text x="0" y="${y + rowH / 2 + 3}" font-size="10" fill="#647086">${escapeHtml(d.label)}</text>
          <rect x="60" y="${y}" width="${w}" height="${rowH - 8}" rx="4" fill="#0f766e"/>
          <text x="${60 + w + 4}" y="${y + rowH / 2 + 3}" font-size="10" fill="#14213d">${d.value}</text>
        </g>`;
    });
    return `<svg class="preso-chart-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${bars.join("")}</svg>`;
  }
  if (c.kind === "donut") {
    const data = c.sample;
    const total = data.reduce((s, v) => s + v, 0);
    const W = 240, H = 120;
    const cx = 70, cy = 60, r = 48, rIn = 28;
    const colors = ["#0f766e", "#3b82f6", "#e9b44c", "#a855f7", "#ef4444"];
    let acc = 0;
    const arcs = data.map((v, i) => {
      const a0 = (acc / total) * Math.PI * 2 - Math.PI / 2;
      acc += v;
      const a1 = (acc / total) * Math.PI * 2 - Math.PI / 2;
      const large = a1 - a0 > Math.PI ? 1 : 0;
      const x0 = cx + Math.cos(a0) * r, y0 = cy + Math.sin(a0) * r;
      const x1 = cx + Math.cos(a1) * r, y1 = cy + Math.sin(a1) * r;
      const xi0 = cx + Math.cos(a0) * rIn, yi0 = cy + Math.sin(a0) * rIn;
      const xi1 = cx + Math.cos(a1) * rIn, yi1 = cy + Math.sin(a1) * rIn;
      return `<path d="M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} L ${xi1} ${yi1} A ${rIn} ${rIn} 0 ${large} 0 ${xi0} ${yi0} Z" fill="${colors[i % colors.length]}"/>`;
    });
    const legend = data
      .map((v, i) => `<g><rect x="140" y="${10 + i * 18}" width="10" height="10" fill="${colors[i % colors.length]}" rx="2"/><text x="156" y="${19 + i * 18}" font-size="10" fill="#647086">Cat. ${i + 1} — ${Math.round((v / total) * 100)}%</text></g>`)
      .join("");
    return `<svg class="preso-chart-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${arcs.join("")}${legend}</svg>`;
  }
  if (c.kind === "matrix") {
    return `<svg class="preso-chart-svg" viewBox="0 0 240 120" preserveAspectRatio="none">
      <line x1="120" y1="6" x2="120" y2="114" stroke="#d9e1e8" stroke-width="1"/>
      <line x1="6" y1="60" x2="234" y2="60" stroke="#d9e1e8" stroke-width="1"/>
      <text x="120" y="4" font-size="9" fill="#647086" text-anchor="middle">+ Impact</text>
      <text x="120" y="119" font-size="9" fill="#647086" text-anchor="middle">- Impact</text>
      <text x="2" y="63" font-size="9" fill="#647086">- Diff.</text>
      <text x="208" y="63" font-size="9" fill="#647086">+ Diff.</text>
      <circle cx="80" cy="35" r="9" fill="#0f766e" opacity=".7"/>
      <circle cx="170" cy="42" r="11" fill="#3b82f6" opacity=".7"/>
      <circle cx="160" cy="86" r="7" fill="#e9b44c" opacity=".8"/>
      <circle cx="60" cy="92" r="6" fill="#a855f7" opacity=".7"/>
    </svg>`;
  }
  return "";
}

function showResult(level) {
  const result = $("#presoResult");
  if (result) result.classList.remove("is-hidden");
  const lvlLabel = level === "premium" ? "Avancé Premium" : "Standard";
  setText("presoResultLevel", lvlLabel);
  // Premium upgrade button
  const upgradeBtn = $("#presoUpgradeInline");
  if (upgradeBtn) upgradeBtn.classList.toggle("is-hidden", level === "premium");
  // Coaching block
  const coachingShown = $("#presoCoaching");
  const coachingLocked = $("#presoCoachingLocked");
  if (coachingShown && coachingLocked) {
    if (level === "premium") {
      coachingShown.classList.remove("is-hidden");
      coachingLocked.classList.add("is-hidden");
    } else {
      coachingShown.classList.add("is-hidden");
      coachingLocked.classList.remove("is-hidden");
    }
  }
}

function bindTabs() {
  const tabs = $$(".preso-tab");
  tabs.forEach((t) => {
    t.addEventListener("click", () => {
      tabs.forEach((x) => x.classList.toggle("active", x === t));
      const key = t.dataset.presoTab;
      $$(".preso-panel").forEach((p) => {
        p.classList.toggle("active", p.dataset.presoPanel === key);
      });
    });
  });
}

function openPaywallSafely() {
  // Tente d'utiliser le paywall existant si dispo
  try {
    if (typeof window !== "undefined" && typeof window.openPaywall === "function") {
      window.openPaywall("student");
      return;
    }
  } catch (_) {}
  const btn = document.querySelector("#openPaywallBtn");
  if (btn) btn.click();
}

function bindForm() {
  const form = $("#presentationForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const topic = $("#presoTopic")?.value?.trim();
    const content = $("#presoContent")?.value || "";
    const level = (form.querySelector('input[name="presoLevel"]:checked')?.value) || "standard";
    const format = (form.querySelector('input[name="presoFormat"]:checked')?.value) || "oral";

    if (!topic) {
      $("#presoTopic")?.focus();
      return;
    }

    const presentation = generatePresentation({ topic, content, level, format });
    lastPresentation = presentation;

    setText("presoSummary", presentation.summary);
    setText("presoProblem", presentation.problematic);
    setText("presoIntro", presentation.introduction);
    renderOutline(presentation.outline);
    renderList("presoTransitions", presentation.transitions);
    setText("presoConclusion", presentation.conclusion);
    renderList("presoBiblio", presentation.bibliography);
    renderSlides(presentation.slides);
    renderMindMap(presentation.mindmap);
    renderCharts(presentation.charts);
    renderList("presoQuestions", presentation.questions);
    if (presentation.coaching) {
      renderList("presoCoachingList", presentation.coaching);
    }

    showResult(level);

    // Hook Napkin (no-op tant que non configuré)
    try { await generateMindMapWithNapkin(presentation); } catch (_) {}

    // Scroll vers le résultat
    $("#presoResult")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  $("#presoExample")?.addEventListener("click", () => {
    const t = $("#presoTopic");
    const c = $("#presoContent");
    if (t) t.value = "La mondialisation et ses fractures";
    if (c) c.value = "Présentation orale de 10 minutes en Terminale, niveau bac. Doit présenter les ressorts économiques, culturels et politiques, avec un exemple concret par partie.";
    form.requestSubmit();
  });

  $("#presoUpgrade")?.addEventListener("click", openPaywallSafely);
  $("#presoUpgradeInline")?.addEventListener("click", openPaywallSafely);
  document.querySelectorAll("[data-preso-upgrade]").forEach((b) => b.addEventListener("click", openPaywallSafely));

  $("#presoCopy")?.addEventListener("click", () => {
    if (!lastPresentation) return;
    const text = formatPlainText(lastPresentation);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(
        () => flashAction("#presoCopy", "Copié ✓"),
        () => flashAction("#presoCopy", "Erreur"),
      );
    } else {
      flashAction("#presoCopy", "Copie indisponible");
    }
  });

  $("#presoExport")?.addEventListener("click", () => {
    if (!lastPresentation) return;
    const blob = new Blob([formatPlainText(lastPresentation)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expose-${slugify(lastPresentation.meta.topic)}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    flashAction("#presoExport", "Téléchargé ✓");
  });
}

function flashAction(sel, label) {
  const btn = document.querySelector(sel);
  if (!btn) return;
  const orig = btn.textContent;
  btn.textContent = label;
  setTimeout(() => { btn.textContent = orig; }, 1600);
}

function slugify(s) {
  return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "expose";
}

function formatPlainText(p) {
  const lines = [];
  lines.push(`EXPOSÉ — ${p.meta.topic}`);
  lines.push(`Niveau : ${p.meta.level === "premium" ? "Avancé Premium" : "Standard"}`);
  lines.push(`Format : ${p.meta.format}`);
  lines.push("");
  lines.push("Résumé :"); lines.push(p.summary); lines.push("");
  lines.push("Problématique :"); lines.push(p.problematic); lines.push("");
  lines.push("Introduction :"); lines.push(p.introduction); lines.push("");
  lines.push("Plan détaillé :");
  p.outline.forEach((a) => {
    lines.push(`- ${a.title} (${a.lens})`);
    a.sub.forEach((s) => lines.push(`  • ${s}`));
  });
  lines.push("");
  lines.push("Transitions :");
  p.transitions.forEach((t) => lines.push(`- ${t}`));
  lines.push("");
  lines.push("Conclusion :"); lines.push(p.conclusion); lines.push("");
  lines.push("Questions probables :");
  p.questions.forEach((q, i) => lines.push(`${i + 1}. ${q}`));
  lines.push("");
  lines.push("Bibliographie indicative :");
  p.bibliography.forEach((b) => lines.push(`- ${b}`));
  if (p.coaching) {
    lines.push("");
    lines.push("Coaching oral (Premium) :");
    p.coaching.forEach((c) => lines.push(`- ${c}`));
  }
  lines.push("");
  lines.push("— Généré localement par MindPrep. Branche OpenAI/Claude/Napkin pour un rendu enrichi.");
  return lines.join("\n");
}

export function initPresentationModule() {
  if (!document.getElementById("presentation")) return;
  bindTabs();
  bindForm();
  // Expose pour debug / tests manuels
  if (typeof window !== "undefined") {
    window.MindPrepPresentation = { generatePresentation, integrations: PRESENTATION_INTEGRATIONS };
  }
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPresentationModule);
  } else {
    initPresentationModule();
  }
}

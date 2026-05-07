// MindPrep — UI binding pour l'Exposé intelligent IA
// Cockpit 3 panneaux : configuration, prévisualisation live, intelligence visuelle.
// Branche le formulaire #presentationForm, génère un exposé via le moteur local
// (avec hooks AI prêts), et injecte le résultat dans la vue en temps réel.

import {
  generatePresentation,
  generateMindMapWithNapkin,
  PRESENTATION_INTEGRATIONS,
} from "./index.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

let lastPresentation = null;
let lastTier = "standard";
let liveTimer = null;

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

function renderTree(tree, mermaidStr) {
  const root = $("#presoTree");
  if (!root) return;
  // Rendu SVG local d'un arbre logique (cascade horizontale).
  const W = 360;
  const nodeH = 28;
  const gap = 8;
  const branchGap = 14;
  let y = 0;
  const lines = [];
  const nodes = [];
  // Racine
  nodes.push(rectNode(0, y, "root", tree.label, "tree-root"));
  const rootCenterY = y + nodeH / 2;
  y += nodeH + branchGap;
  (tree.children || []).forEach((c) => {
    const cTop = y;
    nodes.push(rectNode(40, y, c.id, c.label, "tree-branch"));
    lines.push(`<path class="tree-link" d="M 12 ${rootCenterY} L 12 ${y + nodeH / 2} L 40 ${y + nodeH / 2}"/>`);
    y += nodeH + gap;
    (c.children || []).forEach((g) => {
      nodes.push(rectNode(80, y, g.id, g.label, "tree-leaf"));
      lines.push(`<path class="tree-link" d="M 52 ${cTop + nodeH} L 52 ${y + nodeH / 2} L 80 ${y + nodeH / 2}"/>`);
      y += nodeH + gap;
    });
    y += branchGap - gap;
  });
  const totalH = Math.max(180, y);
  root.innerHTML = `<svg viewBox="0 0 ${W} ${totalH}" class="expose-tree-svg" role="img" aria-label="Arbre logique">${lines.join("")}${nodes.join("")}</svg>`;
  // Mermaid optionnel — visible si Mermaid est présent dans la page.
  const mer = $("#presoMermaid");
  if (mer && mermaidStr) {
    mer.textContent = mermaidStr;
    if (typeof window !== "undefined" && window.mermaid && typeof window.mermaid.render === "function") {
      mer.hidden = false;
    }
  }
}

function rectNode(x, y, id, label, cls) {
  const w = 270;
  const h = 28;
  const text = escapeHtml(truncate(label, 44));
  return `<g class="tree-node ${cls}" data-id="${escapeHtml(id)}">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/>
    <text x="${x + 10}" y="${y + h / 2 + 4}">${text}</text>
  </g>`;
}

function renderSynthesis(synthesis) {
  const root = $("#presoSynthesis");
  if (!root) return;
  const ideas = synthesis.ideas || [];
  const max = Math.max(...ideas.map((i) => i.weight), 1);
  root.innerHTML = `
    <ul class="expose-synth-bars">
      ${ideas.map((i) => `
        <li>
          <span class="expose-synth-label">${escapeHtml(i.label)}</span>
          <span class="expose-synth-bar"><span style="width:${Math.round((i.weight / max) * 100)}%"></span></span>
          <span class="expose-synth-w">${Math.round(i.weight)}</span>
        </li>
      `).join("")}
    </ul>
    <ul class="expose-synth-pillars">
      ${(synthesis.pillars || []).map((p) => `<li>${escapeHtml(p)}</li>`).join("")}
    </ul>
  `;
}

function renderCharts(charts, tier) {
  const root = $("#presoCharts");
  if (!root) return;
  root.innerHTML = charts.map((c) => renderChartCard(c, tier)).join("");
}

function renderChartCard(c, tier) {
  const locked = c.premium && tier !== "premium";
  const svg = locked ? '<div class="expose-locked-chart">🔒 Premium</div>' : renderChartSvg(c);
  return `
    <div class="preso-chart-card ${locked ? "is-locked" : ""}">
      <h4>${escapeHtml(c.title)} ${c.premium ? '<em class="preso-badge">Premium</em>' : ""}</h4>
      <small>${escapeHtml(c.goal)}</small>
      ${svg}
      <small><strong>Type recommandé :</strong> ${escapeHtml(c.type)}${locked ? " · accès Premium" : " · données illustratives"}.</small>
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

function renderOral(oral, tier) {
  setText("presoOralSummary", oral.summary);
  const pts = $("#presoOralPoints");
  if (pts) {
    pts.innerHTML = (oral.talkingPoints || [])
      .map((p) => `<li><strong>${escapeHtml(p.part)} — ${escapeHtml(p.point)}</strong><small>${escapeHtml(p.cue)}</small></li>`)
      .join("");
  }
  const rh = $("#presoOralRhythm");
  if (rh && oral.rhythm) {
    rh.innerHTML = [
      `<li><strong>Intro</strong> — ${escapeHtml(oral.rhythm.intro)}</li>`,
      `<li><strong>Développement</strong> — ${escapeHtml(oral.rhythm.development)}</li>`,
      `<li><strong>Conclusion</strong> — ${escapeHtml(oral.rhythm.conclusion)}</li>`,
      `<li><strong>Q & A</strong> — ${escapeHtml(oral.rhythm.qa)}</li>`,
    ].join("");
  }
  // Conseils premium
  const advWrap = $("#presoOralAdvanced");
  const lockedWrap = $("#presoOralLocked");
  if (advWrap && lockedWrap) {
    if (tier === "premium") {
      renderList("presoOralAdvice", oral.advice || []);
      advWrap.classList.remove("is-hidden");
      lockedWrap.classList.add("is-hidden");
    } else {
      advWrap.classList.add("is-hidden");
      lockedWrap.classList.remove("is-hidden");
    }
  }
}

function applyTierVisuals(tier) {
  const lvlLabel = tier === "premium" ? "Avancé Premium" : "Standard";
  setText("presoResultLevel", lvlLabel);
  const upgradeBtn = $("#presoUpgradeInline");
  if (upgradeBtn) upgradeBtn.classList.toggle("is-hidden", tier === "premium");
  const coachingShown = $("#presoCoaching");
  const coachingLocked = $("#presoCoachingLocked");
  if (coachingShown && coachingLocked) {
    if (tier === "premium") {
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
  try {
    if (typeof window !== "undefined" && typeof window.openPaywall === "function") {
      window.openPaywall("student");
      return;
    }
  } catch (_) {}
  const btn = document.querySelector("#openPaywallBtn");
  if (btn) btn.click();
}

function readForm() {
  const form = $("#presentationForm");
  if (!form) return null;
  const topic = $("#presoTopic")?.value?.trim() || "";
  const content = $("#presoContent")?.value || "";
  const level = $("#presoLevel")?.value || "lycee";
  const type = $("#presoType")?.value || "expose";
  const duration = parseInt($("#presoDuration")?.value || "10", 10) || 10;
  const language = $("#presoLanguage")?.value || "fr";
  const tone = $("#presoTone")?.value || "academique";
  const tier = (form.querySelector('input[name="presoTier"]:checked')?.value) || "standard";
  return { topic, content, level, type, duration, language, tone, tier };
}

function renderAll(presentation, tier) {
  setText("presoOptimizedTitle", presentation.title);
  setText("presoSummary", presentation.summary);
  setText("presoContext", presentation.context);
  setText("presoProblem", presentation.problematic);
  setText("presoIntro", presentation.introduction);
  renderOutline(presentation.outline);
  renderList("presoTransitions", presentation.transitions);
  setText("presoConclusion", presentation.conclusion);
  renderList("presoBiblio", presentation.bibliography);
  renderSlides(presentation.slides);
  renderMindMap(presentation.mindmap);
  renderTree(presentation.logicalTree.tree, presentation.logicalTree.mermaid);
  renderSynthesis(presentation.visualSynthesis);
  renderCharts(presentation.charts, tier);
  renderList("presoQuestions", presentation.questions);
  renderOral(presentation.oral, tier);
  if (presentation.coaching) renderList("presoCoachingList", presentation.coaching);
  applyTierVisuals(tier);
}

function liveGenerate() {
  const data = readForm();
  if (!data || !data.topic) return;
  try {
    const presentation = generatePresentation(data);
    lastPresentation = presentation;
    lastTier = data.tier;
    renderAll(presentation, data.tier);
  } catch (e) {
    console.warn("[MindPrep] live generation failed:", e?.message || e);
  }
}

function scheduleLive() {
  if (liveTimer) clearTimeout(liveTimer);
  liveTimer = setTimeout(liveGenerate, 220);
}

function bindLiveInputs() {
  const ids = ["presoTopic", "presoContent", "presoLevel", "presoType", "presoDuration", "presoLanguage", "presoTone"];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", scheduleLive);
    el.addEventListener("change", scheduleLive);
  });
  document.querySelectorAll('input[name="presoTier"]').forEach((r) => {
    r.addEventListener("change", () => {
      // Premium gating sans regenerate full → on rerend juste la partie tier-dépendante.
      const tier = document.querySelector('input[name="presoTier"]:checked')?.value || "standard";
      lastTier = tier;
      if (tier === "premium" && lastPresentation) {
        // On régénère pour potentiellement basculer le niveau interne aussi.
        scheduleLive();
      } else {
        applyTierVisuals(tier);
        if (lastPresentation) {
          renderCharts(lastPresentation.charts, tier);
          renderOral(lastPresentation.oral, tier);
        }
      }
    });
  });
}

function bindForm() {
  const form = $("#presentationForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    liveGenerate();
    if (lastPresentation) {
      // Smooth scroll vers le panneau preview sur mobile.
      $("#presoResult")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    // Hook Napkin (no-op tant que non configuré)
    if (lastPresentation) {
      try { generateMindMapWithNapkin(lastPresentation); } catch (_) {}
    }
  });

  $("#presoExample")?.addEventListener("click", () => {
    const t = $("#presoTopic");
    const c = $("#presoContent");
    if (t) t.value = "La mondialisation et ses fractures";
    if (c) c.value = "Présentation orale de 10 minutes en Terminale, niveau bac. Doit présenter les ressorts économiques, culturels et politiques, avec un exemple concret par partie.";
    liveGenerate();
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

  // Exports
  $("#presoExportPdf")?.addEventListener("click", () => exportAs("pdf"));
  $("#presoExportWord")?.addEventListener("click", () => exportAs("word"));
  $("#presoExportPpt")?.addEventListener("click", () => exportAs("ppt"));
}

function exportAs(kind) {
  if (!lastPresentation) return;
  if (kind === "ppt" && lastTier !== "premium") {
    openPaywallSafely();
    return;
  }
  const slug = slugify(lastPresentation.meta.topic);
  if (kind === "pdf") {
    // Génère un HTML imprimable et déclenche window.print() via une nouvelle fenêtre.
    const html = renderPrintableHtml(lastPresentation);
    openPrintWindow(html, `expose-${slug}`);
    flashAction("#presoExportPdf", "PDF prêt ✓");
    return;
  }
  if (kind === "word") {
    // Export .doc HTML compatible Word — pas besoin de lib externe.
    const html = renderPrintableHtml(lastPresentation, { word: true });
    const blob = new Blob([html], { type: "application/msword" });
    triggerDownload(blob, `expose-${slug}.doc`);
    flashAction("#presoExportWord", "Word téléchargé ✓");
    return;
  }
  if (kind === "ppt") {
    // Hook PPT — si PptxGenJS est branché côté hôte, on l'utilise. Sinon, fallback texte.
    if (typeof window !== "undefined" && window.PptxGenJS) {
      try {
        const pptx = new window.PptxGenJS();
        lastPresentation.slides.forEach((s) => {
          const slide = pptx.addSlide();
          slide.addText(s.title || "", { x: 0.5, y: 0.4, fontSize: 24, bold: true });
          slide.addText(s.body || "", { x: 0.5, y: 1.4, fontSize: 14 });
        });
        pptx.writeFile({ fileName: `expose-${slug}.pptx` });
        flashAction("#presoExportPpt", "PPT téléchargé ✓");
        return;
      } catch (e) {
        console.warn("[MindPrep] PPT export failed:", e?.message || e);
      }
    }
    // Fallback : exporte un brouillon texte explicite.
    const txt = formatPlainText(lastPresentation);
    const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
    triggerDownload(blob, `expose-${slug}-brouillon-pptx.txt`);
    flashAction("#presoExportPpt", "Brouillon PPT (texte) ✓");
  }
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function openPrintWindow(html, title) {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>` +
    `<style>body{font-family:Inter,Segoe UI,Arial,sans-serif;color:#14213d;max-width:780px;margin:32px auto;padding:0 24px;line-height:1.55}h1{color:#0f766e}h2{margin-top:28px;border-bottom:1px solid #e6ecf2;padding-bottom:6px}small{color:#647086}.box{border:1px solid #e6ecf2;border-radius:10px;padding:14px;margin:10px 0}</style>` +
    `</head><body>${html}<script>window.onload=()=>{setTimeout(()=>window.print(),250);}<\/script></body></html>`);
  win.document.close();
}

function renderPrintableHtml(p, opts = {}) {
  const slidesHtml = p.slides.map((s) => `<div class="box"><strong>SLIDE ${escapeHtml(s.num)} — ${escapeHtml(s.title)}</strong><br/><small>${escapeHtml(s.tag || "")}</small><p>${escapeHtml(s.body)}</p></div>`).join("");
  const outlineHtml = p.outline.map((a) => `<li><strong>${escapeHtml(a.title)}</strong> <small>(${escapeHtml(a.lens)})</small><ul>${a.sub.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul></li>`).join("");
  const qHtml = p.questions.map((q) => `<li>${escapeHtml(q)}</li>`).join("");
  const bibHtml = p.bibliography.map((b) => `<li>${escapeHtml(b)}</li>`).join("");
  const oral = p.oral || {};
  const tpHtml = (oral.talkingPoints || []).map((t) => `<li><strong>${escapeHtml(t.part)} — ${escapeHtml(t.point)}</strong> · ${escapeHtml(t.cue)}</li>`).join("");
  return `
    <h1>${escapeHtml(p.title || p.meta.topic)}</h1>
    <small>Niveau : ${escapeHtml(p.meta.level)} · Type : ${escapeHtml(p.meta.type)} · ${escapeHtml(String(p.meta.duration))} min · ${escapeHtml(p.meta.language)} · ${escapeHtml(p.meta.tone)}</small>
    <h2>Résumé exécutif</h2><p>${escapeHtml(p.summary)}</p>
    <h2>Contexte</h2><p>${escapeHtml(p.context)}</p>
    <h2>Problématique</h2><p>${escapeHtml(p.problematic)}</p>
    <h2>Introduction</h2><p>${escapeHtml(p.introduction)}</p>
    <h2>Plan détaillé</h2><ol>${outlineHtml}</ol>
    <h2>Conclusion</h2><p>${escapeHtml(p.conclusion)}</p>
    <h2>Slides</h2>${slidesHtml}
    <h2>Préparation orale</h2><p>${escapeHtml(oral.summary || "")}</p><ul>${tpHtml}</ul>
    <h2>Questions probables</h2><ol>${qHtml}</ol>
    <h2>Bibliographie indicative</h2><ul>${bibHtml}</ul>
    <hr/><small>Généré localement par MindPrep — Exposé intelligent IA.${opts.word ? " Format compatible Word." : ""}</small>
  `;
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
  lines.push(`EXPOSÉ — ${p.title || p.meta.topic}`);
  lines.push(`Niveau : ${p.meta.level} · Type : ${p.meta.type} · Durée : ${p.meta.duration} min · Langue : ${p.meta.language} · Ton : ${p.meta.tone}`);
  lines.push("");
  lines.push("Résumé :"); lines.push(p.summary); lines.push("");
  lines.push("Contexte :"); lines.push(p.context); lines.push("");
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
  lines.push("Préparation orale :");
  if (p.oral) {
    lines.push(p.oral.summary);
    (p.oral.talkingPoints || []).forEach((tp) => lines.push(`- ${tp.part} — ${tp.point} · ${tp.cue}`));
  }
  lines.push("");
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
  bindLiveInputs();
  // Première génération discrète pour ne pas avoir un panneau vide.
  setTimeout(() => {
    const t = document.getElementById("presoTopic");
    if (t && !t.value) {
      t.value = "L'intelligence artificielle dans l'éducation";
      liveGenerate();
      // Efface la valeur de démo si l'utilisateur n'a pas commencé à interagir.
    }
  }, 250);
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

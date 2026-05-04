import { formatList } from "../utils/text-utils.js";

export function renderCourse(model, subject, elements) {
  const { courseOutputTitle, criticalAlerts, courseOutput } = elements;

  courseOutputTitle.textContent = model.mainIdea;
  criticalAlerts.innerHTML = `
    <strong>Alertes critiques de l'élève</strong>
    ${formatList(model.alerts)}
  `;

  courseOutput.innerHTML = `
    <div class="course-block">
      <strong>1. Idée centrale</strong>
      <span>${model.mainIdea}: comprendre le mécanisme, pas seulement mémoriser le cours.</span>
    </div>
    <div class="course-block">
      <strong>2. Décomposition</strong>
      ${formatList(model.keywords)}
    </div>
    <div class="course-block">
      <strong>3. Modélisation</strong>
      <div class="schema-box">${model.schema}</div>
    </div>
    <div class="course-block">
      <strong>4. Relations fonctionnelles</strong>
      ${formatList(model.relations)}
    </div>
    <div class="course-block">
      <strong>5. Compression intelligente</strong>
      ${formatList(model.compression)}
    </div>
    <div class="course-block">
      <strong>6. Règles pédagogiques</strong>
      ${formatList(model.rules)}
    </div>
    <div class="course-block">
      <strong>7. Reconstruction</strong>
      ${formatList(model.reconstruction)}
    </div>
    <div class="course-block">
      <strong>Applications ${subject}</strong>
      ${formatList(model.applications)}
    </div>
    <div class="course-block">
      <strong>Approche pédagogique</strong>
      <span>Systèmes, cause → effet, méthode Feynman et apprentissage par erreurs.</span>
    </div>
  `;
}

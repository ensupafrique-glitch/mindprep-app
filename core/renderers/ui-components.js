export function createInfoCard(title, content) {
  return `
    <article class="info-card">
      <h3>${title}</h3>
      <p>${content}</p>
    </article>
  `;
}

export function renderSchemaBlock(schema) {
  return `<div class="schema-box">${schema}</div>`;
}

export function renderFeedback(title, text, details = "") {
  return `
    <div class="feedback-card">
      <h3>${title}</h3>
      <p>${text}</p>
      ${details ? `<div class="feedback-details">${details}</div>` : ""}
    </div>
  `;
}

export function listItems(items) {
  return `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
}
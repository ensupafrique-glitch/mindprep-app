// Configuration pour l'intégration IA
export const aiConfig = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || null,
    model: "gpt-4o-mini",
    maxTokens: 400,
    temperature: 0.7,
  },
  prompts: {
    courseEnhancement: (subject, content) => `
      Améliore ce contenu pédagogique pour ${subject} en ajoutant:
      1. Des connexions interdisciplinaires
      2. Des exemples concrets supplémentaires
      3. Des questions de réflexion avancées
      4. Des analogies pédagogiques

      Contenu original:
      ${content}
    `,
    conceptRelations: (concepts) => `
      Analyse les relations entre ces concepts pédagogiques:
      ${concepts.join(", ")}

      Identifie:
      - Dépendances logiques
      - Hiérarchies conceptuelles
      - Liens transversaux
      - Points de friction potentiels
    `,
  },
};

// Interface pour les services IA
export class AIService {
  constructor(config = aiConfig.openai) {
    this.config = config;
  }

  async enhanceContent(subject, content) {
    if (!this.config.apiKey) {
      console.warn("Clé API OpenAI non configurée");
      return content;
    }

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [{
            role: "user",
            content: aiConfig.prompts.courseEnhancement(subject, content)
          }],
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
        }),
      });

      const data = await response.json();
      return data?.choices?.[0]?.message?.content || content;
    } catch (error) {
      console.error("Erreur IA:", error);
      return content;
    }
  }
}
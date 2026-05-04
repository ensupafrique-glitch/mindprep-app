import { extractKeywords } from "../analyzers/text-analyzer.js";
import { buildSchema } from "../analyzers/concept-analyzer.js";
import { buildRelations } from "../analyzers/relation-analyzer.js";
import { buildCompression } from "../analyzers/compression-analyzer.js";
import { buildReconstruction } from "../analyzers/reconstruction-analyzer.js";
import { CourseModel, SubjectProfile } from "../models/course-model.js";
import { ReportEngine } from "../reporting/report-engine.js";

export class PedagogyEngine {
  constructor(options = {}) {
    this.useAI = options.useAI || false;
    this.apiKey = options.apiKey || null;
    this.reportEngine = new ReportEngine();
  }

  async build(subject, title, notes) {
    const profile = new SubjectProfile(subject);
    const keywords = extractKeywords(notes, subject);
    const mainIdea = title || keywords[0] || subject;

    const model = new CourseModel(subject, title, notes)
      .setMainIdea(mainIdea)
      .setKeywords(keywords)
      .setType(profile)
      .setSchema(buildSchema(mainIdea, profile))
      .setRelations(buildRelations(profile))
      .setAlerts(this.buildAlerts(keywords, profile))
      .setRules(this.buildRules(mainIdea, keywords))
      .setApplications(this.buildApplications(profile))
      .setCompression(buildCompression(model))
      .setReconstruction(buildReconstruction(profile));

    // Si IA activée, enrichir le modèle
    if (this.useAI && this.apiKey) {
      await this.enrichWithAI(model);
    }

    return model;
  }

  /**
   * Analyse un exercice soumis par l'élève et génère un rapport pédagogique complet
   * @param {string} studentWork - Le travail de l'élève (texte de l'exercice)
   * @param {string} subject - La matière
   * @param {Object} exerciseInfo - Informations sur l'exercice
   * @param {Object} studentInfo - Informations sur l'élève
   * @returns {Object} - Rapport pédagogique complet
   */
  async analyzeAndReport(studentWork, subject, exerciseInfo = {}, studentInfo = {}) {
    // Étape 1: Analyse pédagogique du travail de l'élève
    const analysis = await this.analyzeStudentWork(studentWork, subject);

    // Étape 2: Génération du rapport complet
    const report = this.reportEngine.generateReport(analysis, studentInfo, exerciseInfo);

    return {
      analysis: analysis,
      report: report,
      model: analysis.model // Le modèle pédagogique de référence
    };
  }

  /**
   * Analyse le travail d'un élève
   * @param {string} studentWork - Travail de l'élève
   * @param {string} subject - Matière
   * @returns {Object} - Analyse détaillée
   */
  async analyzeStudentWork(studentWork, subject) {
    // Création du modèle de référence pour cette matière
    const referenceModel = await this.build(subject, "Exercice d'analyse", studentWork);

    // Analyse des erreurs dans le travail de l'élève
    const errors = this.detectErrors(studentWork, referenceModel);

    // Identification des concepts non maîtrisés
    const unmasteredConcepts = this.identifyUnmasteredConcepts(studentWork, referenceModel);

    // Évaluation des points forts
    const strengths = this.identifyStrengths(studentWork, referenceModel);

    // Analyse méthodologique
    const methodAnalysis = this.analyzeMethod(studentWork, referenceModel);

    // Analyse logique
    const logicAnalysis = this.analyzeLogic(studentWork, referenceModel);

    // Analyse conceptuelle
    const conceptAnalysis = this.analyzeConcepts(studentWork, referenceModel);

    return {
      model: referenceModel,
      errors: errors,
      unmasteredConcepts: unmasteredConcepts,
      strengths: strengths,
      methodAnalysis: methodAnalysis,
      logicAnalysis: logicAnalysis,
      conceptAnalysis: conceptAnalysis,
      difficulty: this.assessDifficulty(studentWork),
      originalWork: studentWork
    };
  }

  /**
   * Détecte les erreurs dans le travail de l'élève
   * @param {string} work - Travail de l'élève
   * @param {CourseModel} model - Modèle de référence
   * @returns {Array} - Liste des erreurs détectées
   */
  detectErrors(work, model) {
    const errors = [];
    const workLower = work.toLowerCase();

    // Erreurs de méthode
    if (!workLower.includes('méthode') && !workLower.includes('démarche')) {
      errors.push({
        type: 'erreur de méthode',
        description: 'Méthode de résolution non explicitée',
        severity: 'medium'
      });
    }

    // Erreurs de logique
    const logicalIndicators = ['donc', 'par conséquent', 'ainsi', 'il s\'ensuit'];
    const hasLogicalConnectors = logicalIndicators.some(indicator => workLower.includes(indicator));
    if (!hasLogicalConnectors && work.length > 200) {
      errors.push({
        type: 'erreur de logique',
        description: 'Connecteurs logiques insuffisants pour structurer le raisonnement',
        severity: 'medium'
      });
    }

    // Erreurs de calcul (détection basique)
    const numbers = work.match(/\d+/g);
    if (numbers && numbers.length > 2) {
      // Vérifier si les calculs semblent cohérents
      const hasCalculationErrors = this.detectCalculationErrors(work);
      if (hasCalculationErrors) {
        errors.push({
          type: 'erreur de calcul',
          description: 'Erreur dans les opérations mathématiques',
          severity: 'high'
        });
      }
    }

    // Confusion de concepts
    const conceptErrors = this.detectConceptConfusion(work, model);
    errors.push(...conceptErrors);

    return errors;
  }

  /**
   * Identifie les concepts non maîtrisés
   * @param {string} work - Travail de l'élève
   * @param {CourseModel} model - Modèle de référence
   * @returns {Array} - Concepts non maîtrisés
   */
  identifyUnmasteredConcepts(work, model) {
    const unmastered = [];
    const workLower = work.toLowerCase();

    // Vérifier la présence des concepts clés
    if (model.keywords) {
      model.keywords.forEach(keyword => {
        if (!workLower.includes(keyword.toLowerCase())) {
          unmastered.push(keyword);
        }
      });
    }

    // Concepts spécifiques selon la matière
    if (model.subjectProfile) {
      const subjectSpecificConcepts = this.getSubjectSpecificConcepts(model.subjectProfile);
      subjectSpecificConcepts.forEach(concept => {
        if (!workLower.includes(concept.toLowerCase())) {
          unmastered.push(concept);
        }
      });
    }

    return unmastered.slice(0, 5); // Limiter à 5 concepts maximum
  }

  /**
   * Identifie les points forts du travail
   * @param {string} work - Travail de l'élève
   * @param {CourseModel} model - Modèle de référence
   * @returns {Array} - Points forts identifiés
   */
  identifyStrengths(work, model) {
    const strengths = [];
    const workLower = work.toLowerCase();

    // Structure claire
    if (workLower.includes('introduction') || workLower.includes('conclusion')) {
      strengths.push('Structure claire du raisonnement');
    }

    // Utilisation de vocabulaire approprié
    if (model.keywords && model.keywords.some(keyword => workLower.includes(keyword.toLowerCase()))) {
      strengths.push('Vocabulaire technique adapté');
    }

    // Rigueur dans les explications
    if (workLower.includes('car') || workLower.includes('parce que') || workLower.includes('puisque')) {
      strengths.push('Explications justifiées');
    }

    // Originalité dans l'approche
    if (work.length > 300 && workLower.includes('perspective') || workLower.includes('approche')) {
      strengths.push('Approche originale et réfléchie');
    }

    return strengths;
  }

  /**
   * Analyse la méthode utilisée
   * @param {string} work - Travail de l'élève
   * @param {CourseModel} model - Modèle de référence
   * @returns {Object} - Analyse méthodologique
   */
  analyzeMethod(work, model) {
    const hasSteps = /\d+\)|•|-|\(\d+\)/.test(work); // Détection de listes numérotées
    const hasMethodExplanation = /méthode|démarche|approche/.test(work.toLowerCase());

    if (hasSteps && hasMethodExplanation) {
      return {
        level: 'excellente',
        detail: 'méthode clairement explicitée et structurée'
      };
    } else if (hasSteps) {
      return {
        level: 'bonne',
        detail: 'structure présente mais méthode implicite'
      };
    } else {
      return {
        level: 'insuffisante',
        detail: 'manque de structure méthodologique claire'
      };
    }
  }

  /**
   * Analyse la logique du raisonnement
   * @param {string} work - Travail de l'élève
   * @param {CourseModel} model - Modèle de référence
   * @returns {Object} - Analyse logique
   */
  analyzeLogic(work, model) {
    const logicalConnectors = ['donc', 'par conséquent', 'ainsi', 'il s\'ensuit', 'ce qui implique'];
    const hasLogic = logicalConnectors.some(connector => work.toLowerCase().includes(connector));

    const contradictions = /mais|cependant|néanmoins|pourtant/.test(work.toLowerCase());
    const hasCoherence = !contradictions || work.length < 100;

    if (hasLogic && hasCoherence) {
      return {
        level: 'cohérente',
        detail: 'enchaînements logiques bien maîtrisés'
      };
    } else if (hasCoherence) {
      return {
        level: 'acceptable',
        detail: 'raisonnement globalement cohérent'
      };
    } else {
      return {
        level: 'confuse',
        detail: 'raisonnement nécessite clarification'
      };
    }
  }

  /**
   * Analyse la maîtrise conceptuelle
   * @param {string} work - Travail de l'élève
   * @param {CourseModel} model - Modèle de référence
   * @returns {Object} - Analyse conceptuelle
   */
  analyzeConcepts(work, model) {
    const conceptCount = model.keywords ? model.keywords.length : 0;
    const usedConcepts = model.keywords ?
      model.keywords.filter(keyword => work.toLowerCase().includes(keyword.toLowerCase())).length : 0;

    const masteryRate = conceptCount > 0 ? usedConcepts / conceptCount : 0;

    if (masteryRate >= 0.8) {
      return {
        level: 'excellente',
        detail: 'maîtrise conceptuelle solide'
      };
    } else if (masteryRate >= 0.6) {
      return {
        level: 'satisfaisante',
        detail: 'bons fondamentaux conceptuels'
      };
    } else if (masteryRate >= 0.4) {
      return {
        level: 'fragile',
        detail: 'concepts de base présents mais perfectibles'
      };
    } else {
      return {
        level: 'insuffisante',
        detail: 'nécessite un approfondissement conceptuel'
      };
    }
  }

  /**
   * Évalue la difficulté apparente du travail
   * @param {string} work - Travail de l'élève
   * @returns {string} - Niveau de difficulté
   */
  assessDifficulty(work) {
    const length = work.length;
    const complexityIndicators = /intégrale|dérivée|matrice|analyse|synthèse/gi.test(work);

    if (length > 1000 || complexityIndicators) {
      return 'difficile';
    } else if (length > 500) {
      return 'moyen';
    } else {
      return 'facile';
    }
  }

  // Méthodes utilitaires privées

  detectCalculationErrors(work) {
    // Détection basique d'erreurs de calcul
    // En réalité, cela nécessiterait un analyseur mathématique plus sophistiqué
    const hasEquals = /=/.test(work);
    const hasNumbers = /\d/.test(work);

    // Si on a des égalités et des nombres, on suppose qu'il pourrait y avoir des calculs
    // Pour une vraie détection, il faudrait parser les expressions mathématiques
    return false; // Placeholder - à implémenter avec un vrai parseur mathématique
  }

  detectConceptConfusion(work, model) {
    const confusions = [];

    // Exemples de confusions conceptuelles selon la matière
    if (model.subjectProfile && model.subjectProfile.isManagement) {
      if (work.toLowerCase().includes('bénéfice') && work.toLowerCase().includes('profit')) {
        // Confusion entre bénéfice et profit
        confusions.push({
          type: 'confusion de concept',
          description: 'Confusion entre bénéfice et profit',
          severity: 'medium'
        });
      }
    }

    return confusions;
  }

  getSubjectSpecificConcepts(profile) {
    if (profile.isManagement) {
      return ['seuil de rentabilité', 'marge sur coût variable', 'point mort', 'contribution'];
    } else if (profile.isHumanities) {
      return ['problématique', 'plan', 'introduction', 'conclusion', 'argumentation'];
    } else {
      return ['définition', 'propriété', 'théorème', 'démonstration'];
    }
  }

  buildAlerts(keywords, profile) {
    return [
      `Point critique: ${keywords[0]} doit être défini sans approximation.`,
      `Risque d’erreur: apprendre ${keywords[1] || "la notion"} sans comprendre ses relations.`,
      profile.isHumanities ? "Alerte méthode: éviter le résumé, construire une démonstration." : "Alerte application: toujours interpréter le résultat obtenu.",
    ];
  }

  buildRules(mainIdea, keywords) {
    return [
      `Toujours partir de l’objectif: pourquoi ${mainIdea} existe ?`,
      `Relier ${keywords[0]} à ${keywords[1] || "un concept voisin"}.`,
      "Transformer chaque définition en exemple concret.",
      "Après chaque exercice, noter l’erreur et la règle oubliée.",
      "Reconstruire le schéma sans regarder le cours.",
    ];
  }

  buildApplications(profile) {
    return profile.isManagement
      ? ["Calculer un indicateur", "Interpréter la conséquence", "Comparer deux décisions", "Identifier le risque principal"]
      : ["Construire une problématique", "Faire un plan en 2 ou 3 axes", "Analyser un exemple", "Rédiger une conclusion courte"];
  }

  async enrichWithAI(model) {
    // Placeholder pour intégration IA future
    // Ici on pourrait appeler OpenAI pour améliorer le modèle
    console.log("Enrichissement IA activé pour le modèle pédagogique");
  }
}
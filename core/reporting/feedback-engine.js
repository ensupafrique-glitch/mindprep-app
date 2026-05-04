/**
 * Feedback Engine - Moteur de feedback pédagogique
 * Rédige les appréciations, commentaires pédagogiques et synthèses intelligentes
 */

export class FeedbackEngine {
    constructor() {
        this.templates = {
            appreciation: {
                excellent: [
                    "Excellente maîtrise des concepts. L'élève démontre une compréhension profonde et une application rigoureuse.",
                    "Travail remarquable qui témoigne d'une assimilation parfaite des notions abordées.",
                    "Performance exceptionnelle avec une logique impeccable et une présentation soignée."
                ],
                good: [
                    "Bonne compréhension globale avec quelques points d'attention. L'élève maîtrise l'essentiel mais peut peaufiner certains détails.",
                    "Travail solide qui montre une bonne assimilation des concepts fondamentaux.",
                    "Bonne performance générale avec une marge de progression sur certains aspects techniques."
                ],
                average: [
                    "Compréhension des mécanismes de base présente, mais manque de rigueur dans l'application. Les fondements sont là, la maîtrise reste partielle.",
                    "Travail correct qui nécessite un approfondissement de certains concepts.",
                    "Performance moyenne qui révèle des lacunes à combler pour atteindre un niveau satisfaisant."
                ],
                weak: [
                    "Difficultés notables dans la compréhension des concepts essentiels. Un travail de fond s'impose.",
                    "Travail insuffisant qui révèle des lacunes importantes dans les notions de base.",
                    "Performance faible qui nécessite un accompagnement renforcé et des révisions approfondies."
                ],
                poor: [
                    "Compréhension très limitée des concepts abordés. Reconstruction complète nécessaire.",
                    "Travail très insuffisant qui nécessite une remise à niveau complète.",
                    "Performance très faible qui impose une révision totale des apprentissages."
                ]
            },
            synthesis: {
                method: "L'élève montre {strength} en termes de méthode, mais {weakness} dans l'application pratique.",
                logic: "La logique de raisonnement est {logic_level}, avec {logic_detail}.",
                concepts: "La maîtrise conceptuelle est {concept_level}, particulièrement sur {concept_detail}."
            }
        };
    }

    /**
     * Génère une appréciation pédagogique basée sur l'analyse
     * @param {Object} analysis - Analyse pédagogique détaillée
     * @param {Object} grade - Résultats de notation
     * @returns {string} - Appréciation pédagogique
     */
    generateAppreciation(analysis, grade) {
        const level = this.mapGradeToLevel(grade.level);
        const templates = this.templates.appreciation[level];

        let appreciation = templates[Math.floor(Math.random() * templates.length)];

        // Personnalisation basée sur l'analyse
        if (analysis.strengths && analysis.strengths.length > 0) {
            appreciation += ` Points forts : ${analysis.strengths.slice(0, 2).join(', ')}.`;
        }

        if (analysis.errors && analysis.errors.length > 0) {
            appreciation += ` Points d'attention : ${this.summarizeErrors(analysis.errors)}.`;
        }

        return appreciation;
    }

    /**
     * Génère une synthèse intelligente des performances
     * @param {Object} analysis - Analyse pédagogique
     * @returns {string} - Synthèse pédagogique
     */
    generateSynthesis(analysis) {
        const parts = [];

        // Analyse de la méthode
        if (analysis.methodAnalysis) {
            parts.push(this.generateMethodSynthesis(analysis.methodAnalysis));
        }

        // Analyse de la logique
        if (analysis.logicAnalysis) {
            parts.push(this.generateLogicSynthesis(analysis.logicAnalysis));
        }

        // Analyse conceptuelle
        if (analysis.conceptAnalysis) {
            parts.push(this.generateConceptSynthesis(analysis.conceptAnalysis));
        }

        return parts.join(' ') || this.generateDefaultSynthesis(analysis);
    }

    /**
     * Génère une synthèse sur la méthode
     * @param {Object} methodAnalysis - Analyse de la méthode
     * @returns {string} - Synthèse méthodologique
     */
    generateMethodSynthesis(methodAnalysis) {
        const strength = methodAnalysis.strength || 'une approche correcte';
        const weakness = methodAnalysis.weakness || 'certains aspects perfectibles';

        return this.templates.synthesis.method
            .replace('{strength}', strength)
            .replace('{weakness}', weakness);
    }

    /**
     * Génère une synthèse sur la logique
     * @param {Object} logicAnalysis - Analyse de la logique
     * @returns {string} - Synthèse logique
     */
    generateLogicSynthesis(logicAnalysis) {
        const level = logicAnalysis.level || 'correcte';
        const detail = logicAnalysis.detail || 'quelques imprécisions mineures';

        return this.templates.synthesis.logic
            .replace('{logic_level}', level)
            .replace('{logic_detail}', detail);
    }

    /**
     * Génère une synthèse sur les concepts
     * @param {Object} conceptAnalysis - Analyse conceptuelle
     * @returns {string} - Synthèse conceptuelle
     */
    generateConceptSynthesis(conceptAnalysis) {
        const level = conceptAnalysis.level || 'satisfaisante';
        const detail = conceptAnalysis.detail || 'les notions essentielles';

        return this.templates.synthesis.concepts
            .replace('{concept_level}', level)
            .replace('{concept_detail}', detail);
    }

    /**
     * Génère une synthèse par défaut
     * @param {Object} analysis - Analyse générale
     * @returns {string} - Synthèse par défaut
     */
    generateDefaultSynthesis(analysis) {
        const errorCount = analysis.errors ? analysis.errors.length : 0;
        const conceptCount = analysis.unmasteredConcepts ? analysis.unmasteredConcepts.length : 0;

        if (errorCount === 0 && conceptCount === 0) {
            return "Travail globalement réussi avec une bonne compréhension d'ensemble.";
        } else if (errorCount > conceptCount) {
            return "Des erreurs d'application sont présentes, mais les concepts de base sont assimilés.";
        } else {
            return "Les notions fondamentales nécessitent un approfondissement pour une meilleure maîtrise.";
        }
    }

    /**
     * Génère des commentaires détaillés par section
     * @param {Object} analysis - Analyse pédagogique
     * @returns {Array} - Commentaires détaillés
     */
    generateDetailedComments(analysis) {
        const comments = [];

        if (analysis.errors && analysis.errors.length > 0) {
            comments.push({
                type: 'errors',
                title: 'Analyse des erreurs',
                content: this.analyzeErrors(analysis.errors)
            });
        }

        if (analysis.unmasteredConcepts && analysis.unmasteredConcepts.length > 0) {
            comments.push({
                type: 'concepts',
                title: 'Concepts à retravailler',
                content: this.analyzeConcepts(analysis.unmasteredConcepts)
            });
        }

        if (analysis.strengths && analysis.strengths.length > 0) {
            comments.push({
                type: 'strengths',
                title: 'Points forts',
                content: this.analyzeStrengths(analysis.strengths)
            });
        }

        return comments;
    }

    /**
     * Analyse détaillée des erreurs
     * @param {Array} errors - Liste des erreurs
     * @returns {string} - Analyse des erreurs
     */
    analyzeErrors(errors) {
        const errorTypes = {};
        errors.forEach(error => {
            errorTypes[error.type] = (errorTypes[error.type] || 0) + 1;
        });

        const analysis = Object.entries(errorTypes)
            .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`)
            .join(', ');

        return `Erreurs identifiées : ${analysis}. ${this.getErrorRecommendations(errorTypes)}`;
    }

    /**
     * Analyse des concepts non maîtrisés
     * @param {Array} concepts - Concepts à retravailler
     * @returns {string} - Analyse conceptuelle
     */
    analyzeConcepts(concepts) {
        const conceptList = concepts.slice(0, 5).join(', ');
        const remaining = concepts.length - 5;

        let analysis = `Notions nécessitant un approfondissement : ${conceptList}`;
        if (remaining > 0) {
            analysis += ` et ${remaining} autre${remaining > 1 ? 's' : ''}`;
        }

        return analysis + '. Un travail ciblé sur ces concepts permettra une progression significative.';
    }

    /**
     * Analyse des points forts
     * @param {Array} strengths - Points forts
     * @returns {string} - Analyse des points forts
     */
    analyzeStrengths(strengths) {
        return `Points forts identifiés : ${strengths.join(', ')}. Ces compétences constituent une base solide pour progresser.`;
    }

    /**
     * Génère des recommandations basées sur les types d'erreurs
     * @param {Object} errorTypes - Types d'erreurs et leurs fréquences
     * @returns {string} - Recommandations
     */
    getErrorRecommendations(errorTypes) {
        const recommendations = [];

        if (errorTypes['erreur de méthode']) {
            recommendations.push('renforcer la méthodologie');
        }
        if (errorTypes['erreur de logique']) {
            recommendations.push('travailler la rigueur logique');
        }
        if (errorTypes['erreur de calcul']) {
            recommendations.push('consolider les automatismes de calcul');
        }
        if (errorTypes['confusion de concept']) {
            recommendations.push('clarifier les définitions conceptuelles');
        }
        if (errorTypes['oubli de règle']) {
            recommendations.push('mémoriser les règles essentielles');
        }

        return recommendations.length > 0
            ? `Il est recommandé de ${recommendations.join(', ')}.`
            : '';
    }

    /**
     * Mappe le niveau de grade vers les catégories de feedback
     * @param {string} level - Niveau du grade
     * @returns {string} - Catégorie de feedback
     */
    mapGradeToLevel(level) {
        const mapping = {
            'Excellent': 'excellent',
            'Bon': 'good',
            'Moyen': 'average',
            'Faible': 'weak',
            'Insuffisant': 'poor'
        };
        return mapping[level] || 'average';
    }

    /**
     * Résume les erreurs pour l'appréciation
     * @param {Array} errors - Liste des erreurs
     * @returns {string} - Résumé des erreurs
     */
    summarizeErrors(errors) {
        const types = [...new Set(errors.map(e => e.type))];
        return types.slice(0, 2).join(', ') + (types.length > 2 ? ' et autres' : '');
    }
}
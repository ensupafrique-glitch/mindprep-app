/**
 * Grading Engine - Moteur de notation pédagogique
 * Calcule la note, le score, le niveau et le statut d'un élève
 */

export class GradingEngine {
    constructor() {
        this.levels = {
            excellent: { min: 16, max: 20, label: 'Excellent', status: 'Maîtrisé' },
            good: { min: 14, max: 15.99, label: 'Bon', status: 'Solide' },
            average: { min: 12, max: 13.99, label: 'Moyen', status: 'À renforcer' },
            weak: { min: 10, max: 11.99, label: 'Faible', status: 'À travailler' },
            poor: { min: 0, max: 9.99, label: 'Insuffisant', status: 'À reconstruire' }
        };
    }

    /**
     * Calcule la note globale basée sur l'analyse pédagogique
     * @param {Object} analysis - Résultats de l'analyse pédagogique
     * @returns {Object} - Note et métriques associées
     */
    calculateGrade(analysis) {
        const score = this.calculateScore(analysis);
        const level = this.determineLevel(score);
        const status = this.determineStatus(score);

        return {
            score: Math.round(score * 100) / 100,
            grade: this.scoreToGrade(score),
            level: level,
            status: status,
            percentage: Math.round((score / 20) * 100)
        };
    }

    /**
     * Calcule le score sur 20 basé sur différents critères
     * @param {Object} analysis - Analyse pédagogique détaillée
     * @returns {number} - Score sur 20
     */
    calculateScore(analysis) {
        let score = 20; // Score de base

        // Pénalités pour les erreurs
        if (analysis.errors) {
            score -= this.calculateErrorPenalty(analysis.errors);
        }

        // Pénalités pour les concepts non maîtrisés
        if (analysis.unmasteredConcepts) {
            score -= this.calculateConceptPenalty(analysis.unmasteredConcepts);
        }

        // Bonus pour les points forts
        if (analysis.strengths) {
            score += this.calculateStrengthBonus(analysis.strengths);
        }

        // Ajustement basé sur la complexité de l'exercice
        score = this.adjustForDifficulty(score, analysis.difficulty);

        return Math.max(0, Math.min(20, score));
    }

    /**
     * Calcule la pénalité pour les erreurs
     * @param {Array} errors - Liste des erreurs détectées
     * @returns {number} - Pénalité à appliquer
     */
    calculateErrorPenalty(errors) {
        const penalties = {
            'erreur de méthode': 2,
            'erreur de logique': 1.5,
            'erreur de calcul': 1,
            'confusion de concept': 1.5,
            'oubli de règle': 1
        };

        return errors.reduce((total, error) => {
            return total + (penalties[error.type] || 0.5);
        }, 0);
    }

    /**
     * Calcule la pénalité pour les concepts non maîtrisés
     * @param {Array} concepts - Concepts non maîtrisés
     * @returns {number} - Pénalité à appliquer
     */
    calculateConceptPenalty(concepts) {
        return concepts.length * 0.8; // 0.8 point par concept non maîtrisé
    }

    /**
     * Calcule le bonus pour les points forts
     * @param {Array} strengths - Points forts identifiés
     * @returns {number} - Bonus à appliquer
     */
    calculateStrengthBonus(strengths) {
        return strengths.length * 0.3; // 0.3 point par point fort
    }

    /**
     * Ajuste le score selon la difficulté de l'exercice
     * @param {number} score - Score calculé
     * @param {string} difficulty - Niveau de difficulté
     * @returns {number} - Score ajusté
     */
    adjustForDifficulty(score, difficulty) {
        const adjustments = {
            'facile': 0.95,
            'moyen': 1.0,
            'difficile': 1.05,
            'expert': 1.1
        };

        const factor = adjustments[difficulty] || 1.0;
        return score * factor;
    }

    /**
     * Convertit un score numérique en note sur 20
     * @param {number} score - Score sur 20
     * @returns {string} - Note formatée
     */
    scoreToGrade(score) {
        return `${Math.round(score * 100) / 100}/20`;
    }

    /**
     * Détermine le niveau basé sur le score
     * @param {number} score - Score sur 20
     * @returns {string} - Niveau déterminé
     */
    determineLevel(score) {
        for (const [key, level] of Object.entries(this.levels)) {
            if (score >= level.min && score <= level.max) {
                return level.label;
            }
        }
        return 'Non évalué';
    }

    /**
     * Détermine le statut basé sur le score
     * @param {number} score - Score sur 20
     * @returns {string} - Statut déterminé
     */
    determineStatus(score) {
        for (const [key, level] of Object.entries(this.levels)) {
            if (score >= level.min && score <= level.max) {
                return level.status;
            }
        }
        return 'À évaluer';
    }

    /**
     * Génère des métriques détaillées pour le rapport
     * @param {Object} analysis - Analyse pédagogique
     * @returns {Object} - Métriques détaillées
     */
    generateDetailedMetrics(analysis) {
        const grade = this.calculateGrade(analysis);

        return {
            ...grade,
            breakdown: {
                baseScore: 20,
                errorPenalty: analysis.errors ? this.calculateErrorPenalty(analysis.errors) : 0,
                conceptPenalty: analysis.unmasteredConcepts ? this.calculateConceptPenalty(analysis.unmasteredConcepts) : 0,
                strengthBonus: analysis.strengths ? this.calculateStrengthBonus(analysis.strengths) : 0,
                difficultyAdjustment: this.adjustForDifficulty(1, analysis.difficulty) - 1
            },
            thresholds: this.levels
        };
    }
}
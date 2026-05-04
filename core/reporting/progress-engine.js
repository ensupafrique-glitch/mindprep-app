/**
 * Progress Engine - Moteur de progression pédagogique
 * Produit les axes de progression, plans de remédiation et prochaines étapes
 */

export class ProgressEngine {
    constructor() {
        this.remediationTemplates = {
            excellent: {
                duration: 7,
                focus: 'perfectionnement',
                activities: ['approfondissement', 'complexification', 'créativité']
            },
            good: {
                duration: 5,
                focus: 'consolidation',
                activities: ['révision ciblée', 'exercices d\'application', 'entraînement']
            },
            average: {
                duration: 10,
                focus: 'reconstruction',
                activities: ['révision fondamentale', 'exercices guidés', 'accompagnement']
            },
            weak: {
                duration: 14,
                focus: 'remise à niveau',
                activities: ['révision complète', 'exercices de base', 'soutien intensif']
            },
            poor: {
                duration: 21,
                focus: 'reconstruction totale',
                activities: ['réapprentissage', 'exercices élémentaires', 'accompagnement quotidien']
            }
        };
    }

    /**
     * Génère les axes de progression basés sur l'analyse
     * @param {Object} analysis - Analyse pédagogique détaillée
     * @param {Object} grade - Résultats de notation
     * @returns {Array} - Axes de progression identifiés
     */
    generateProgressAxes(analysis, grade) {
        const axes = [];

        // Axe méthodologique
        if (analysis.errors && analysis.errors.some(e => e.type === 'erreur de méthode')) {
            axes.push({
                type: 'method',
                title: 'Méthodologie',
                description: 'Développer une approche structurée et rigoureuse',
                priority: 'high',
                actions: [
                    'Apprendre la méthode pas à pas',
                    'S\'entraîner sur des exercices types',
                    'Vérifier chaque étape du raisonnement'
                ]
            });
        }

        // Axe logique
        if (analysis.errors && analysis.errors.some(e => e.type === 'erreur de logique')) {
            axes.push({
                type: 'logic',
                title: 'Raisonnement logique',
                description: 'Renforcer la rigueur du raisonnement et la cohérence',
                priority: 'high',
                actions: [
                    'Identifier les prémisses et conclusions',
                    'Vérifier la validité des enchaînements',
                    'Pratiquer les démonstrations logiques'
                ]
            });
        }

        // Axe conceptuel
        if (analysis.unmasteredConcepts && analysis.unmasteredConcepts.length > 0) {
            axes.push({
                type: 'concepts',
                title: 'Maîtrise conceptuelle',
                description: `Approfondir ${analysis.unmasteredConcepts.length} notion${analysis.unmasteredConcepts.length > 1 ? 's' : ''} essentielle${analysis.unmasteredConcepts.length > 1 ? 's' : ''}`,
                priority: analysis.unmasteredConcepts.length > 3 ? 'high' : 'medium',
                actions: [
                    'Relire et reformuler les définitions',
                    'Faire des exercices d\'identification',
                    'Créer des cartes mentales'
                ]
            });
        }

        // Axe calculatoire
        if (analysis.errors && analysis.errors.some(e => e.type === 'erreur de calcul')) {
            axes.push({
                type: 'calculation',
                title: 'Automatismes de calcul',
                description: 'Consolider les compétences numériques et le calcul mental',
                priority: 'medium',
                actions: [
                    'Réviter les opérations de base',
                    'Utiliser des techniques de calcul rapide',
                    'Vérifier systématiquement les résultats'
                ]
            });
        }

        // Axe de perfectionnement (si niveau excellent)
        if (grade.level === 'Excellent') {
            axes.push({
                type: 'perfection',
                title: 'Perfectionnement avancé',
                description: 'Développer l\'excellence et la créativité',
                priority: 'low',
                actions: [
                    'Explorer des problèmes complexes',
                    'Innover dans les méthodes de résolution',
                    'Enseigner à d\'autres élèves'
                ]
            });
        }

        return axes.sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority));
    }

    /**
     * Génère un plan de remédiation personnalisé
     * @param {Object} analysis - Analyse pédagogique
     * @param {Object} grade - Résultats de notation
     * @returns {Object} - Plan de remédiation structuré
     */
    generateRemediationPlan(analysis, grade) {
        const level = this.mapGradeToLevel(grade.level);
        const template = this.remediationTemplates[level];

        const plan = {
            duration: template.duration,
            focus: template.focus,
            activities: template.activities,
            schedule: this.generateSchedule(template.duration, analysis, grade),
            objectives: this.generateObjectives(analysis, grade),
            evaluation: this.generateEvaluationPoints(template.duration)
        };

        return plan;
    }

    /**
     * Génère un planning détaillé sur plusieurs jours
     * @param {number} duration - Durée totale en jours
     * @param {Object} analysis - Analyse pédagogique
     * @param {Object} grade - Résultats de notation
     * @returns {Array} - Planning journalier
     */
    generateSchedule(duration, analysis, grade) {
        const schedule = [];
        const level = this.mapGradeToLevel(grade.level);

        for (let day = 1; day <= duration; day++) {
            const dayPlan = {
                day: day,
                date: this.getFutureDate(day),
                activities: this.getDayActivities(day, duration, level, analysis),
                duration: this.getDayDuration(day, duration),
                type: this.getDayType(day, duration)
            };
            schedule.push(dayPlan);
        }

        return schedule;
    }

    /**
     * Génère les objectifs du plan de remédiation
     * @param {Object} analysis - Analyse pédagogique
     * @param {Object} grade - Résultats de notation
     * @returns {Array} - Objectifs à atteindre
     */
    generateObjectives(analysis, grade) {
        const objectives = [];

        // Objectif principal basé sur le niveau
        const mainObjective = this.getMainObjective(grade.level);
        objectives.push({
            type: 'main',
            description: mainObjective,
            deadline: this.getFutureDate(7),
            measurable: true
        });

        // Objectifs spécifiques aux erreurs
        if (analysis.errors && analysis.errors.length > 0) {
            const errorObjectives = this.generateErrorObjectives(analysis.errors);
            objectives.push(...errorObjectives);
        }

        // Objectifs conceptuels
        if (analysis.unmasteredConcepts && analysis.unmasteredConcepts.length > 0) {
            objectives.push({
                type: 'concept',
                description: `Maîtriser ${analysis.unmasteredConcepts.length} notion${analysis.unmasteredConcepts.length > 1 ? 's' : ''} identifiée${analysis.unmasteredConcepts.length > 1 ? 's' : ''}`,
                deadline: this.getFutureDate(5),
                measurable: true
            });
        }

        return objectives;
    }

    /**
     * Génère les points d'évaluation du plan
     * @param {number} duration - Durée totale du plan
     * @returns {Array} - Points d'évaluation
     */
    generateEvaluationPoints(duration) {
        const evaluations = [];

        // Évaluation intermédiaire
        if (duration >= 7) {
            evaluations.push({
                day: 3,
                type: 'intermediate',
                description: 'Évaluation des premiers progrès',
                method: 'Mini-test sur les notions révisées'
            });
        }

        // Évaluation finale
        evaluations.push({
            day: duration,
            type: 'final',
            description: 'Évaluation de la progression globale',
            method: 'Test complet sur le chapitre'
        });

        // Évaluation de suivi
        if (duration >= 14) {
            evaluations.push({
                day: Math.floor(duration / 2),
                type: 'followup',
                description: 'Point de suivi de la remédiation',
                method: 'Exercice d\'application'
            });
        }

        return evaluations;
    }

    /**
     * Génère les prochaines étapes recommandées
     * @param {Object} analysis - Analyse pédagogique
     * @param {Object} grade - Résultats de notation
     * @returns {Array} - Prochaines étapes
     */
    generateNextSteps(analysis, grade) {
        const steps = [];

        // Étape immédiate (J+1)
        steps.push({
            timing: 'J+1',
            action: 'Révision des bases',
            description: 'Relire les notions essentielles et refaire les exercices de base',
            priority: 'immediate'
        });

        // Étape courte (J+2 à J+3)
        if (analysis.unmasteredConcepts && analysis.unmasteredConcepts.length > 0) {
            steps.push({
                timing: 'J+2',
                action: 'Travail conceptuel ciblé',
                description: `Approfondir : ${analysis.unmasteredConcepts.slice(0, 3).join(', ')}`,
                priority: 'high'
            });
        }

        // Étape intermédiaire (J+5)
        steps.push({
            timing: 'J+5',
            action: 'Application pratique',
            description: 'Réaliser des exercices d\'application des notions révisées',
            priority: 'medium'
        });

        // Étape de validation (J+7)
        steps.push({
            timing: 'J+7',
            action: 'Évaluation flash',
            description: 'Mini-test pour valider les progrès',
            priority: 'medium'
        });

        return steps;
    }

    // Méthodes utilitaires privées

    getPriorityWeight(priority) {
        const weights = { high: 3, medium: 2, low: 1 };
        return weights[priority] || 0;
    }

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

    getFutureDate(daysFromNow) {
        const date = new Date();
        date.setDate(date.getDate() + daysFromNow);
        return date.toLocaleDateString('fr-FR');
    }

    getDayActivities(day, totalDuration, level, analysis) {
        const activities = [];

        if (day === 1) {
            activities.push('Révision des notions de base');
        } else if (day <= 3) {
            activities.push('Exercices guidés sur les points faibles');
        } else if (day <= totalDuration - 2) {
            activities.push('Application autonome des concepts');
        } else {
            activities.push('Évaluation et consolidation');
        }

        return activities;
    }

    getDayDuration(day, totalDuration) {
        if (day === 1) return 30; // minutes
        if (day <= 3) return 45;
        if (day <= totalDuration - 2) return 60;
        return 45;
    }

    getDayType(day, totalDuration) {
        if (day === 1) return 'revision';
        if (day <= 3) return 'guided';
        if (day <= totalDuration - 2) return 'practice';
        return 'evaluation';
    }

    getMainObjective(level) {
        const objectives = {
            'Excellent': 'Maintenir l\'excellence et développer la créativité',
            'Bon': 'Consolider les acquis et corriger les derniers points faibles',
            'Moyen': 'Acquérir une maîtrise solide des notions essentielles',
            'Faible': 'Reconstruire les bases et combler les lacunes',
            'Insuffisant': 'Réapprendre les fondamentaux de manière structurée'
        };
        return objectives[level] || 'Progresser de manière significative';
    }

    generateErrorObjectives(errors) {
        const objectives = [];
        const errorTypes = [...new Set(errors.map(e => e.type))];

        errorTypes.forEach(type => {
            let objective = '';
            switch (type) {
                case 'erreur de méthode':
                    objective = 'Développer une méthodologie rigoureuse';
                    break;
                case 'erreur de logique':
                    objective = 'Renforcer le raisonnement logique';
                    break;
                case 'erreur de calcul':
                    objective = 'Consolider les automatismes de calcul';
                    break;
                case 'confusion de concept':
                    objective = 'Clarifier les définitions conceptuelles';
                    break;
                case 'oubli de règle':
                    objective = 'Mémoriser les règles essentielles';
                    break;
            }
            if (objective) {
                objectives.push({
                    type: 'error_correction',
                    description: objective,
                    deadline: this.getFutureDate(5),
                    measurable: true
                });
            }
        });

        return objectives;
    }
}
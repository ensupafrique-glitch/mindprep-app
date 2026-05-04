/**
 * Report Engine - Moteur d'assemblage des rapports pédagogiques
 * Assemble tous les éléments pour générer un rapport pédagogique complet
 */

import { GradingEngine } from './grading-engine.js';
import { FeedbackEngine } from './feedback-engine.js';
import { ProgressEngine } from './progress-engine.js';

export class ReportEngine {
    constructor() {
        this.gradingEngine = new GradingEngine();
        this.feedbackEngine = new FeedbackEngine();
        this.progressEngine = new ProgressEngine();
    }

    /**
     * Génère un rapport pédagogique complet
     * @param {Object} analysis - Analyse pédagogique détaillée
     * @param {Object} studentInfo - Informations sur l'élève
     * @param {Object} exerciseInfo - Informations sur l'exercice
     * @returns {Object} - Rapport pédagogique structuré
     */
    generateReport(analysis, studentInfo = {}, exerciseInfo = {}) {
        // Calcul de la notation
        const grade = this.gradingEngine.calculateGrade(analysis);

        // Génération du feedback
        const appreciation = this.feedbackEngine.generateAppreciation(analysis, grade);
        const synthesis = this.feedbackEngine.generateSynthesis(analysis);
        const detailedComments = this.feedbackEngine.generateDetailedComments(analysis);

        // Génération du plan de progression
        const progressAxes = this.progressEngine.generateProgressAxes(analysis, grade);
        const remediationPlan = this.progressEngine.generateRemediationPlan(analysis, grade);
        const nextSteps = this.progressEngine.generateNextSteps(analysis, grade);

        // Métriques détaillées
        const detailedMetrics = this.gradingEngine.generateDetailedMetrics(analysis);

        // Construction du rapport
        const report = {
            header: this.generateHeader(studentInfo, exerciseInfo),
            results: this.generateResultsSection(grade, detailedMetrics),
            appreciation: appreciation,
            analysis: this.generateAnalysisSection(analysis, detailedComments),
            progress: this.generateProgressSection(progressAxes, nextSteps),
            remediation: remediationPlan,
            conclusion: this.generateConclusion(grade, analysis),
            metadata: {
                generatedAt: new Date().toISOString(),
                version: '1.0',
                engines: {
                    grading: 'GradingEngine v1.0',
                    feedback: 'FeedbackEngine v1.0',
                    progress: 'ProgressEngine v1.0'
                }
            }
        };

        return report;
    }

    /**
     * Génère l'en-tête du rapport
     * @param {Object} studentInfo - Infos élève
     * @param {Object} exerciseInfo - Infos exercice
     * @returns {Object} - En-tête structuré
     */
    generateHeader(studentInfo, exerciseInfo) {
        return {
            studentInfo: {
                name: studentInfo.name || 'Élève',
                class: studentInfo.class || 'Classe non spécifiée',
                id: studentInfo.id || 'N/A'
            },
            exerciseInfo: {
                subject: exerciseInfo.subject || 'Matière non spécifiée',
                title: exerciseInfo.title || 'Exercice',
                type: exerciseInfo.type || 'Type non spécifié',
                date: exerciseInfo.date || new Date().toLocaleDateString('fr-FR'),
                estimatedDuration: exerciseInfo.estimatedDuration || 'Non spécifié'
            }
        };
    }

    /**
     * Génère la section des résultats globaux
     * @param {Object} grade - Résultats de notation
     * @param {Object} detailedMetrics - Métriques détaillées
     * @returns {Object} - Section résultats
     */
    generateResultsSection(grade, detailedMetrics) {
        return {
            grade: grade.grade,
            level: grade.level,
            status: grade.status,
            percentage: grade.percentage,
            score: grade.score,
            breakdown: detailedMetrics.breakdown
        };
    }

    /**
     * Génère la section d'analyse détaillée
     * @param {Object} analysis - Analyse pédagogique
     * @param {Array} detailedComments - Commentaires détaillés
     * @returns {Object} - Section analyse
     */
    generateAnalysisSection(analysis, detailedComments) {
        return {
            errors: this.formatErrors(analysis.errors || []),
            unmasteredConcepts: analysis.unmasteredConcepts || [],
            strengths: analysis.strengths || [],
            detailedComments: detailedComments,
            summary: {
                errorCount: analysis.errors ? analysis.errors.length : 0,
                conceptCount: analysis.unmasteredConcepts ? analysis.unmasteredConcepts.length : 0,
                strengthCount: analysis.strengths ? analysis.strengths.length : 0
            }
        };
    }

    /**
     * Génère la section de progression
     * @param {Array} progressAxes - Axes de progression
     * @param {Array} nextSteps - Prochaines étapes
     * @returns {Object} - Section progression
     */
    generateProgressSection(progressAxes, nextSteps) {
        return {
            axes: progressAxes,
            recommendedProgression: nextSteps,
            priorityActions: progressAxes.filter(axis => axis.priority === 'high'),
            secondaryActions: progressAxes.filter(axis => axis.priority !== 'high')
        };
    }

    /**
     * Génère la conclusion du rapport
     * @param {Object} grade - Résultats de notation
     * @param {Object} analysis - Analyse pédagogique
     * @returns {Object} - Conclusion structurée
     */
    generateConclusion(grade, analysis) {
        const conclusion = {
            currentLevel: grade.level,
            status: grade.status,
            potential: this.assessPotential(grade, analysis),
            nextPriority: this.determineNextPriority(grade, analysis),
            recommendations: this.generateFinalRecommendations(grade, analysis)
        };

        return conclusion;
    }

    /**
     * Formate la liste des erreurs pour l'affichage
     * @param {Array} errors - Liste des erreurs
     * @returns {Array} - Erreurs formatées
     */
    formatErrors(errors) {
        return errors.map(error => ({
            type: error.type,
            description: error.description || this.getErrorDescription(error.type),
            severity: error.severity || 'medium',
            location: error.location || 'Non spécifié'
        }));
    }

    /**
     * Évalue le potentiel de l'élève
     * @param {Object} grade - Résultats de notation
     * @param {Object} analysis - Analyse pédagogique
     * @returns {string} - Évaluation du potentiel
     */
    assessPotential(grade, analysis) {
        const score = grade.score;
        const hasStrengths = analysis.strengths && analysis.strengths.length > 0;
        const errorCount = analysis.errors ? analysis.errors.length : 0;

        if (score >= 16) {
            return hasStrengths ? 'Très élevé - Capable d\'excellence' : 'Élevé - Bon potentiel à exploiter';
        } else if (score >= 12) {
            return errorCount < 3 ? 'Bon - Progression possible avec travail régulier' : 'Moyen - Nécessite un accompagnement ciblé';
        } else if (score >= 8) {
            return 'À développer - Travail de fond nécessaire';
        } else {
            return 'À reconstruire - Accompagnement intensif requis';
        }
    }

    /**
     * Détermine la prochaine priorité
     * @param {Object} grade - Résultats de notation
     * @param {Object} analysis - Analyse pédagogique
     * @returns {string} - Prochaine priorité
     */
    determineNextPriority(grade, analysis) {
        if (grade.score < 10) {
            return 'Reconstruction des bases fondamentales';
        } else if (analysis.errors && analysis.errors.some(e => e.type === 'erreur de méthode')) {
            return 'Acquisition d\'une méthodologie rigoureuse';
        } else if (analysis.unmasteredConcepts && analysis.unmasteredConcepts.length > 3) {
            return 'Approfondissement conceptuel ciblé';
        } else {
            return 'Consolidation et perfectionnement';
        }
    }

    /**
     * Génère les recommandations finales
     * @param {Object} grade - Résultats de notation
     * @param {Object} analysis - Analyse pédagogique
     * @returns {Array} - Recommandations finales
     */
    generateFinalRecommendations(grade, analysis) {
        const recommendations = [];

        if (grade.score < 12) {
            recommendations.push('Augmenter le temps de travail personnel');
            recommendations.push('Solliciter un accompagnement régulier');
        }

        if (analysis.errors && analysis.errors.length > 5) {
            recommendations.push('Se concentrer sur la qualité plutôt que la quantité');
        }

        if (analysis.unmasteredConcepts && analysis.unmasteredConcepts.length > 0) {
            recommendations.push('Créer des fiches de révision personnalisées');
        }

        if (grade.level === 'Excellent') {
            recommendations.push('S\'orienter vers des challenges plus complexes');
            recommendations.push('Participer à des projets enrichissants');
        }

        return recommendations;
    }

    /**
     * Fournit une description par défaut pour les types d'erreurs
     * @param {string} errorType - Type d'erreur
     * @returns {string} - Description de l'erreur
     */
    getErrorDescription(errorType) {
        const descriptions = {
            'erreur de méthode': 'Problème dans l\'approche ou la démarche utilisée',
            'erreur de logique': 'Erreur dans le raisonnement ou l\'enchaînement logique',
            'erreur de calcul': 'Erreur dans les opérations mathématiques',
            'confusion de concept': 'Mélange ou confusion entre différents concepts',
            'oubli de règle': 'Oubli d\'une règle ou d\'une propriété essentielle'
        };
        return descriptions[errorType] || 'Erreur non spécifiée';
    }

    /**
     * Exporte le rapport dans différents formats
     * @param {Object} report - Rapport à exporter
     * @param {string} format - Format d'export ('json', 'html', 'text')
     * @returns {string} - Rapport formaté
     */
    exportReport(report, format = 'json') {
        switch (format) {
            case 'json':
                return JSON.stringify(report, null, 2);
            case 'html':
                return this.generateHTMLReport(report);
            case 'text':
                return this.generateTextReport(report);
            default:
                throw new Error(`Format d'export non supporté: ${format}`);
        }
    }

    /**
     * Génère un rapport HTML (aperçu pour l'export)
     * @param {Object} report - Rapport à convertir
     * @returns {string} - Rapport HTML
     */
    generateHTMLReport(report) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Rapport Pédagogique - ${report.header.studentInfo.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
        .grade { font-size: 24px; font-weight: bold; color: #2c5aa0; }
        .error { color: #d9534f; }
        .success { color: #5cb85c; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Rapport Pédagogique</h1>
        <p><strong>Élève:</strong> ${report.header.studentInfo.name}</p>
        <p><strong>Classe:</strong> ${report.header.studentInfo.class}</p>
        <p><strong>Matière:</strong> ${report.header.exerciseInfo.subject}</p>
        <p><strong>Exercice:</strong> ${report.header.exerciseInfo.title}</p>
        <p><strong>Date:</strong> ${report.header.exerciseInfo.date}</p>
    </div>

    <div class="section">
        <h2>Résultat Global</h2>
        <div class="grade">${report.results.grade}</div>
        <p><strong>Niveau:</strong> ${report.results.level}</p>
        <p><strong>Statut:</strong> ${report.results.status}</p>
    </div>

    <div class="section">
        <h2>Appréciation Pédagogique</h2>
        <p>${report.appreciation}</p>
    </div>

    <div class="section">
        <h2>Analyse Détaillée</h2>
        ${report.analysis.detailedComments.map(comment => `
            <h3>${comment.title}</h3>
            <p>${comment.content}</p>
        `).join('')}
    </div>

    <div class="section">
        <h2>Conclusion</h2>
        <p><strong>Niveau actuel:</strong> ${report.conclusion.currentLevel}</p>
        <p><strong>Potentiel:</strong> ${report.conclusion.potential}</p>
        <p><strong>Prochaine priorité:</strong> ${report.conclusion.nextPriority}</p>
    </div>
</body>
</html>`;
    }

    /**
     * Génère un rapport texte simple
     * @param {Object} report - Rapport à convertir
     * @returns {string} - Rapport texte
     */
    generateTextReport(report) {
        return `
RAPPORT PÉDAGOGIQUE

ÉLÈVE: ${report.header.studentInfo.name}
CLASSE: ${report.header.studentInfo.class}
MATIÈRE: ${report.header.exerciseInfo.subject}
EXERCICE: ${report.header.exerciseInfo.title}
DATE: ${report.header.exerciseInfo.date}

RÉSULTAT GLOBAL
Note: ${report.results.grade}
Niveau: ${report.results.level}
Statut: ${report.results.status}

APPRÉCIATION
${report.appreciation}

CONCLUSION
Niveau actuel: ${report.conclusion.currentLevel}
Potentiel: ${report.conclusion.potential}
Prochaine priorité: ${report.conclusion.nextPriority}
`;
    }
}
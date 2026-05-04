/**
 * Reporting Module - Module de génération de rapports pédagogiques
 * Point d'entrée pour tous les moteurs de reporting
 */

export { ReportEngine } from './report-engine.js';
export { GradingEngine } from './grading-engine.js';
export { FeedbackEngine } from './feedback-engine.js';
export { ProgressEngine } from './progress-engine.js';
export { PDFExporter } from './pdf-exporter.js';
export { DOCXExporter } from './docx-exporter.js';

// Configuration globale du module
export const REPORTING_CONFIG = {
    defaultFormats: ['pdf', 'docx'],
    maxReportSize: 50 * 1024 * 1024, // 50MB
    supportedLanguages: ['fr', 'en'],
    defaultLanguage: 'fr',
    exportTimeout: 30000, // 30 secondes
    pdfOptions: {
        format: 'a4',
        orientation: 'portrait',
        margin: 20,
        fontSize: 11
    },
    docxOptions: {
        margins: {
            top: 1440,    // 1 inch in twips
            right: 1440,
            bottom: 1440,
            left: 1440
        }
    }
};

// Utilitaires partagés
export class ReportingUtils {
    /**
     * Formate une date pour les rapports
     * @param {string|Date} date - Date à formater
     * @param {string} locale - Locale (défaut: 'fr-FR')
     * @returns {string} - Date formatée
     */
    static formatReportDate(date, locale = 'fr-FR') {
        const d = new Date(date);
        return d.toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Génère un nom de fichier unique pour l'export
     * @param {string} baseName - Nom de base
     * @param {string} extension - Extension du fichier
     * @returns {string} - Nom de fichier unique
     */
    static generateFileName(baseName, extension) {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
        const cleanBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
        return `${cleanBaseName}-${timestamp}.${extension}`;
    }

    /**
     * Valide la structure d'un rapport
     * @param {Object} report - Rapport à valider
     * @returns {Object} - Résultat de validation
     */
    static validateReportStructure(report) {
        const requiredSections = [
            'header',
            'results',
            'appreciation',
            'analysis',
            'progress',
            'remediation',
            'conclusion'
        ];

        const missingSections = requiredSections.filter(section => !report[section]);

        if (missingSections.length > 0) {
            return {
                valid: false,
                errors: [`Sections manquantes: ${missingSections.join(', ')}`]
            };
        }

        // Validation des données essentielles
        const errors = [];

        if (!report.header?.studentInfo?.name) {
            errors.push('Informations élève manquantes');
        }

        if (!report.header?.exerciseInfo?.subject) {
            errors.push('Informations matière manquantes');
        }

        if (!report.results?.grade) {
            errors.push('Résultats de notation manquants');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Calcule la taille estimée du rapport
     * @param {Object} report - Rapport pédagogique
     * @returns {number} - Taille estimée en octets
     */
    static estimateReportSize(report) {
        const jsonString = JSON.stringify(report);
        // Estimation: JSON compressé fait environ 30-50% de la taille originale
        return Math.round(jsonString.length * 0.4);
    }

    /**
     * Nettoie le texte pour l'export
     * @param {string} text - Texte à nettoyer
     * @returns {string} - Texte nettoyé
     */
    static sanitizeText(text) {
        if (!text) return '';

        return text
            .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '') // Contrôles caractères
            .replace(/[\uD800-\uDFFF\uFFFD]/g, '') // Caractères de substitution
            .trim();
    }

    /**
     * Traduit les termes selon la langue
     * @param {string} key - Clé de traduction
     * @param {string} language - Langue cible
     * @returns {string} - Terme traduit
     */
    static translateTerm(key, language = 'fr') {
        const translations = {
            fr: {
                'student': 'Élève',
                'subject': 'Matière',
                'date': 'Date',
                'grade': 'Note',
                'level': 'Niveau',
                'status': 'Statut',
                'analysis': 'Analyse',
                'progress': 'Progression',
                'conclusion': 'Conclusion',
                'recommendations': 'Recommandations',
                'next_steps': 'Prochaines étapes'
            },
            en: {
                'student': 'Student',
                'subject': 'Subject',
                'date': 'Date',
                'grade': 'Grade',
                'level': 'Level',
                'status': 'Status',
                'analysis': 'Analysis',
                'progress': 'Progress',
                'conclusion': 'Conclusion',
                'recommendations': 'Recommendations',
                'next_steps': 'Next Steps'
            }
        };

        return translations[language]?.[key] || key;
    }

    /**
     * Génère des métadonnées pour l'export
     * @param {Object} report - Rapport pédagogique
     * @param {string} format - Format d'export
     * @returns {Object} - Métadonnées
     */
    static generateExportMetadata(report, format) {
        return {
            generatedAt: new Date().toISOString(),
            format: format.toUpperCase(),
            version: '1.0.0',
            generator: 'MindPrep Reporting Engine',
            studentId: report.header?.studentInfo?.id,
            subject: report.header?.exerciseInfo?.subject,
            grade: report.results?.grade?.grade,
            language: REPORTING_CONFIG.defaultLanguage,
            size: this.estimateReportSize(report)
        };
    }

    /**
     * Vérifie si le format d'export est supporté
     * @param {string} format - Format à vérifier
     * @returns {boolean} - Supporté ou non
     */
    static isFormatSupported(format) {
        return REPORTING_CONFIG.defaultFormats.includes(format.toLowerCase());
    }

    /**
     * Obtient l'extension de fichier pour un format
     * @param {string} format - Format
     * @returns {string} - Extension
     */
    static getFileExtension(format) {
        const extensions = {
            'pdf': 'pdf',
            'docx': 'docx',
            'html': 'html',
            'json': 'json'
        };

        return extensions[format.toLowerCase()] || 'txt';
    }

    /**
     * Obtient le type MIME pour un format
     * @param {string} format - Format
     * @returns {string} - Type MIME
     */
    static getMimeType(format) {
        const mimeTypes = {
            'pdf': 'application/pdf',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'html': 'text/html',
            'json': 'application/json'
        };

        return mimeTypes[format.toLowerCase()] || 'text/plain';
    }
}
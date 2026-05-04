/**
 * Export Engine - Moteur d'export des rapports pédagogiques
 * Génère des exports PDF et DOCX des rapports pédagogiques
 */

export class ExportEngine {
    constructor() {
        this.jspdf = null;
        this.docx = null;
        this.initialized = false;
    }

    /**
     * Initialise les bibliothèques d'export
     * @returns {Promise<boolean>} - Succès de l'initialisation
     */
    async initialize() {
        if (this.initialized) return true;

        try {
            // Chargement dynamique des bibliothèques
            if (typeof window !== 'undefined') {
                // Côté client - chargement des scripts
                await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
                await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/docx/7.1.0/docx.min.js');

                this.jspdf = window.jspdf;
                this.docx = window.docx;
            } else {
                // Côté serveur - imports dynamiques
                const { jsPDF } = await import('jspdf');
                const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import('docx');

                this.jspdf = { jsPDF };
                this.docx = { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType };
            }

            this.initialized = true;
            return true;
        } catch (error) {
            console.error('Erreur lors de l\'initialisation des bibliothèques d\'export:', error);
            return false;
        }
    }

    /**
     * Charge un script dynamiquement
     * @param {string} src - URL du script
     * @returns {Promise<void>}
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Exporte un rapport en PDF
     * @param {Object} report - Rapport pédagogique
     * @param {string} filename - Nom du fichier (optionnel)
     * @returns {Promise<Blob>} - Blob du PDF généré
     */
    async exportToPDF(report, filename = null) {
        if (!await this.initialize()) {
            throw new Error('Impossible d\'initialiser les bibliothèques d\'export');
        }

        const { jsPDF } = this.jspdf;
        const doc = new jsPDF();

        // Configuration du document
        doc.setFont('helvetica');
        let yPosition = 20;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 20;
        const lineHeight = 7;

        // Fonction pour ajouter du texte avec gestion des sauts de page
        const addText = (text, fontSize = 12, isBold = false) => {
            if (isBold) doc.setFont('helvetica', 'bold');
            else doc.setFont('helvetica', 'normal');

            doc.setFontSize(fontSize);

            const lines = doc.splitTextToSize(text, 170);
            const textHeight = lines.length * lineHeight;

            if (yPosition + textHeight > pageHeight - margin) {
                doc.addPage();
                yPosition = margin;
            }

            doc.text(lines, margin, yPosition);
            yPosition += textHeight + 5;
        };

        // En-tête
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text('RAPPORT PÉDAGOGIQUE', margin, yPosition);
        yPosition += 15;

        const studentInfo = report.header.studentInfo;
        const exerciseInfo = report.header.exerciseInfo;

        // Informations élève
        addText(`Élève: ${studentInfo.name}`, 12, true);
        addText(`Classe: ${studentInfo.class}`);
        addText(`Matière: ${exerciseInfo.subject}`);
        addText(`Exercice: ${exerciseInfo.title}`);
        addText(`Date: ${exerciseInfo.date}`);
        yPosition += 10;

        // Résultat global
        addText('RÉSULTAT GLOBAL', 14, true);
        addText(`Note: ${report.results.grade}`, 16, true);
        addText(`Niveau: ${report.results.level}`);
        addText(`Statut: ${report.results.status}`);
        yPosition += 10;

        // Appréciation
        addText('APPRÉCIATION PÉDAGOGIQUE', 14, true);
        addText(report.appreciation);
        yPosition += 10;

        // Analyse des erreurs
        if (report.analysis.errors && report.analysis.errors.length > 0) {
            addText('ANALYSE DES ERREURS', 14, true);
            report.analysis.errors.forEach(error => {
                addText(`• ${error.type}: ${error.description}`);
            });
            yPosition += 10;
        }

        // Concepts à retravailler
        if (report.analysis.unmasteredConcepts && report.analysis.unmasteredConcepts.length > 0) {
            addText('CONCEPTS À RETRAVAILLER', 14, true);
            report.analysis.unmasteredConcepts.forEach(concept => {
                addText(`• ${concept}`);
            });
            yPosition += 10;
        }

        // Axes de progression
        if (report.progress.axes && report.progress.axes.length > 0) {
            addText('AXES DE PROGRESSION', 14, true);
            report.progress.axes.forEach(axis => {
                addText(`${axis.title}: ${axis.description}`, 12, true);
                axis.actions.forEach(action => {
                    addText(`  - ${action}`);
                });
            });
            yPosition += 10;
        }

        // Plan de remédiation
        if (report.remediation.schedule && report.remediation.schedule.length > 0) {
            addText('PLAN DE REMÉDIATION', 14, true);
            report.remediation.schedule.slice(0, 7).forEach(day => {
                addText(`J+${day.day}: ${day.activities.join(', ')}`);
            });
            yPosition += 10;
        }

        // Conclusion
        addText('CONCLUSION', 14, true);
        addText(`Niveau actuel: ${report.conclusion.currentLevel}`);
        addText(`Potentiel: ${report.conclusion.potential}`);
        addText(`Prochaine priorité: ${report.conclusion.nextPriority}`);

        // Génération du nom de fichier
        const defaultFilename = `rapport_${studentInfo.name.replace(/\s+/g, '_')}_${exerciseInfo.date.replace(/\//g, '-')}.pdf`;
        const finalFilename = filename || defaultFilename;

        // Retourner le blob pour téléchargement
        const pdfBlob = doc.output('blob');
        this.downloadBlob(pdfBlob, finalFilename);

        return pdfBlob;
    }

    /**
     * Exporte un rapport en DOCX
     * @param {Object} report - Rapport pédagogique
     * @param {string} filename - Nom du fichier (optionnel)
     * @returns {Promise<Blob>} - Blob du DOCX généré
     */
    async exportToDOCX(report, filename = null) {
        if (!await this.initialize()) {
            throw new Error('Impossible d\'initialiser les bibliothèques d\'export');
        }

        const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = this.docx;

        // Création du document
        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    // Titre principal
                    new Paragraph({
                        text: "RAPPORT PÉDAGOGIQUE",
                        heading: HeadingLevel.TITLE,
                        alignment: AlignmentType.CENTER
                    }),

                    // En-tête
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Élève: ", bold: true }),
                            new TextRun(report.header.student.name)
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Classe: ", bold: true }),
                            new TextRun(report.header.student.class)
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Matière: ", bold: true }),
                            new TextRun(report.header.subject)
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Exercice: ", bold: true }),
                            new TextRun(report.header.exercise.title)
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Date: ", bold: true }),
                    new TextRun(exerciseInfo.date)
                    }),

                    // Résultat global
                    new Paragraph({
                        text: "RÉSULTAT GLOBAL",
                        heading: HeadingLevel.HEADING_1
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Note: ", bold: true }),
                            new TextRun({ text: report.results.grade, bold: true, size: 32 })
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Niveau: ", bold: true }),
                            new TextRun(report.results.level)
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Statut: ", bold: true }),
                            new TextRun(report.results.status)
                        ]
                    }),

                    // Appréciation
                    new Paragraph({
                        text: "APPRÉCIATION PÉDAGOGIQUE",
                        heading: HeadingLevel.HEADING_1
                    }),
                    new Paragraph(report.appreciation),

                    // Analyse des erreurs
                    ...(report.analysis.errors && report.analysis.errors.length > 0 ? [
                        new Paragraph({
                            text: "ANALYSE DES ERREURS",
                            heading: HeadingLevel.HEADING_1
                        }),
                        ...report.analysis.errors.map(error =>
                            new Paragraph(`• ${error.type}: ${error.description}`)
                        )
                    ] : []),

                    // Concepts à retravailler
                    ...(report.analysis.unmasteredConcepts && report.analysis.unmasteredConcepts.length > 0 ? [
                        new Paragraph({
                            text: "CONCEPTS À RETRAVAILLER",
                            heading: HeadingLevel.HEADING_1
                        }),
                        ...report.analysis.unmasteredConcepts.map(concept =>
                            new Paragraph(`• ${concept}`)
                        )
                    ] : []),

                    // Axes de progression
                    ...(report.progress.axes && report.progress.axes.length > 0 ? [
                        new Paragraph({
                            text: "AXES DE PROGRESSION",
                            heading: HeadingLevel.HEADING_1
                        }),
                        ...report.progress.axes.flatMap(axis => [
                            new Paragraph({
                                children: [
                                    new TextRun({ text: axis.title + ": ", bold: true }),
                                    new TextRun(axis.description)
                                ]
                            }),
                            ...axis.actions.map(action =>
                                new Paragraph(`  - ${action}`)
                            )
                        ])
                    ] : []),

                    // Plan de remédiation
                    ...(report.remediation.schedule && report.remediation.schedule.length > 0 ? [
                        new Paragraph({
                            text: "PLAN DE REMÉDIATION",
                            heading: HeadingLevel.HEADING_1
                        }),
                        ...report.remediation.schedule.slice(0, 7).map(day =>
                            new Paragraph(`J+${day.day}: ${day.activities.join(', ')}`)
                        )
                    ] : []),

                    // Conclusion
                    new Paragraph({
                        text: "CONCLUSION",
                        heading: HeadingLevel.HEADING_1
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Niveau actuel: ", bold: true }),
                            new TextRun(report.conclusion.currentLevel)
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Potentiel: ", bold: true }),
                            new TextRun(report.conclusion.potential)
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Prochaine priorité: ", bold: true }),
                            new TextRun(report.conclusion.nextPriority)
                        ]
                    })
                ]
            }]
        });

        // Génération du document
        const buffer = await Packer.toBlob(doc);

        // Génération du nom de fichier
        const defaultFilename = `rapport_${report.header.student.name.replace(/\s+/g, '_')}_${report.header.exercise.date.replace(/\//g, '-')}.docx`;
        const finalFilename = filename || defaultFilename;

        this.downloadBlob(buffer, finalFilename);

        return buffer;
    }

    /**
     * Télécharge un blob
     * @param {Blob} blob - Blob à télécharger
     * @param {string} filename - Nom du fichier
     */
    downloadBlob(blob, filename) {
        if (typeof window !== 'undefined') {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }

    /**
     * Exporte un rapport dans plusieurs formats
     * @param {Object} report - Rapport pédagogique
     * @param {Array<string>} formats - Formats souhaités ['pdf', 'docx']
     * @param {Object} options - Options d'export
     * @returns {Promise<Object>} - Résultats des exports
     */
    async exportReport(report, formats = ['pdf'], options = {}) {
        const results = {};

        for (const format of formats) {
            try {
                switch (format.toLowerCase()) {
                    case 'pdf':
                        results.pdf = await this.exportToPDF(report, options.pdfFilename);
                        break;
                    case 'docx':
                        results.docx = await this.exportToDOCX(report, options.docxFilename);
                        break;
                    default:
                        console.warn(`Format d'export non supporté: ${format}`);
                }
            } catch (error) {
                console.error(`Erreur lors de l'export ${format}:`, error);
                results[format] = { error: error.message };
            }
        }

        return results;
    }

    /**
     * Vérifie si un format d'export est supporté
     * @param {string} format - Format à vérifier
     * @returns {boolean} - Support du format
     */
    isFormatSupported(format) {
        return ['pdf', 'docx'].includes(format.toLowerCase());
    }

    /**
     * Obtient la liste des formats supportés
     * @returns {Array<string>} - Formats supportés
     */
    getSupportedFormats() {
        return ['pdf', 'docx'];
    }

    /**
     * Génère un aperçu HTML du rapport (pour debug)
     * @param {Object} report - Rapport pédagogique
     * @returns {string} - HTML du rapport
     */
    generatePreviewHTML(report) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Aperçu - Rapport Pédagogique</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px solid #2c5aa0; padding-bottom: 20px; margin-bottom: 30px; }
        .section { margin: 25px 0; padding: 20px; border-left: 4px solid #2c5aa0; background: #f9f9f9; }
        .grade { font-size: 48px; font-weight: bold; color: #2c5aa0; text-align: center; margin: 20px 0; }
        .error { color: #d9534f; }
        .success { color: #5cb85c; }
        .warning { color: #f0ad4e; }
        .concept { background: #fff3cd; padding: 5px 10px; margin: 2px; display: inline-block; border-radius: 3px; }
        .axis { margin: 10px 0; padding: 10px; background: #e7f3ff; border-radius: 5px; }
        .remediation { background: #f0f9ff; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .conclusion { background: #fff2f0; padding: 20px; border-radius: 5px; border-left: 4px solid #ff6b6b; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>RAPPORT PÉDAGOGIQUE</h1>
            <div style="margin-top: 20px;">
                <strong>${report.header.student.name}</strong> | ${report.header.student.class}<br>
                ${report.header.subject} | ${report.header.exercise.title}<br>
                ${report.header.exercise.date}
            </div>
        </div>

        <div class="section">
            <h2>Résultat Global</h2>
            <div class="grade">${report.results.grade}</div>
            <p><strong>Niveau:</strong> ${report.results.level}</p>
            <p><strong>Statut:</strong> ${report.results.status}</p>
            <p><strong>Pourcentage:</strong> ${report.results.percentage}%</p>
        </div>

        <div class="section">
            <h2>Appréciation Pédagogique</h2>
            <p>${report.appreciation}</p>
        </div>

        ${report.analysis.errors && report.analysis.errors.length > 0 ? `
        <div class="section">
            <h2>Analyse des Erreurs</h2>
            ${report.analysis.errors.map(error => `<p class="error">• ${error.type}: ${error.description}</p>`).join('')}
        </div>
        ` : ''}

        ${report.analysis.unmasteredConcepts && report.analysis.unmasteredConcepts.length > 0 ? `
        <div class="section">
            <h2>Concepts à Retravailler</h2>
            ${report.analysis.unmasteredConcepts.map(concept => `<span class="concept">${concept}</span>`).join('')}
        </div>
        ` : ''}

        ${report.progress.axes && report.progress.axes.length > 0 ? `
        <div class="section">
            <h2>Axes de Progression</h2>
            ${report.progress.axes.map(axis => `
            <div class="axis">
                <h3>${axis.title} <span style="color: ${axis.priority === 'high' ? '#d9534f' : axis.priority === 'medium' ? '#f0ad4e' : '#5cb85c'}">(${axis.priority})</span></h3>
                <p>${axis.description}</p>
                <ul>
                    ${axis.actions.map(action => `<li>${action}</li>`).join('')}
                </ul>
            </div>
            `).join('')}
        </div>
        ` : ''}

        <div class="section">
            <h2>Plan de Remédiation</h2>
            <div class="remediation">
                <p><strong>Durée:</strong> ${report.remediation.duration} jours</p>
                <p><strong>Focus:</strong> ${report.remediation.focus}</p>
                <h4>Planning:</h4>
                ${report.remediation.schedule.slice(0, 7).map(day => `<p><strong>J+${day.day}:</strong> ${day.activities.join(', ')}</p>`).join('')}
            </div>
        </div>

        <div class="conclusion">
            <h2>Conclusion</h2>
            <p><strong>Niveau actuel:</strong> ${report.conclusion.currentLevel}</p>
            <p><strong>Potentiel:</strong> ${report.conclusion.potential}</p>
            <p><strong>Prochaine priorité:</strong> ${report.conclusion.nextPriority}</p>
            ${report.conclusion.recommendations && report.conclusion.recommendations.length > 0 ? `
            <h3>Recommandations:</h3>
            <ul>
                ${report.conclusion.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
            ` : ''}
        </div>
    </div>
</body>
</html>`;
    }
}
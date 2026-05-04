/**
 * PDF Exporter - Exportateur de rapports pédagogiques en PDF
 * Génère des rapports PDF professionnels et imprimables
 */

export class PDFExporter {
    constructor() {
        this.jsPDF = null;
        this.initialized = false;
    }

    /**
     * Initialise la bibliothèque jsPDF
     * @returns {Promise<boolean>} - Succès de l'initialisation
     */
    async initialize() {
        if (this.initialized) return true;

        try {
            if (typeof window !== 'undefined') {
                // Côté client - chargement dynamique
                if (!window.jspdf) {
                    await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
                }
                this.jsPDF = window.jspdf.jsPDF;
            } else {
                // Côté serveur - import dynamique
                const { jsPDF } = await import('jspdf');
                this.jsPDF = jsPDF;
            }

            this.initialized = true;
            return true;
        } catch (error) {
            console.error('Erreur lors de l\'initialisation de jsPDF:', error);
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
     * Exporte un rapport pédagogique en PDF
     * @param {Object} report - Rapport pédagogique complet
     * @param {Object} options - Options d'export
     * @returns {Promise<Object>} - Résultat de l'export
     */
    async exportToPDF(report, options = {}) {
        if (!await this.initialize()) {
            throw new Error('Impossible d\'initialiser l\'export PDF');
        }

        const {
            fileName = `rapport-pedagogique-${report.header.studentInfo.name.replace(/\s+/g, '-').toLowerCase()}.pdf`,
            includeHeader = true,
            includeFooter = true,
            logoUrl = null
        } = options;

        // Création du document PDF
        const doc = new this.jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        let yPosition = margin;

        // Couleurs et styles
        const primaryColor = [0, 123, 191]; // Bleu MindPrep
        const secondaryColor = [108, 117, 125]; // Gris
        const successColor = [40, 167, 69]; // Vert
        const warningColor = [255, 193, 7]; // Jaune
        const dangerColor = [220, 53, 69]; // Rouge

        // Fonction utilitaire pour ajouter du texte avec retour à la ligne
        const addText = (text, x, y, options = {}) => {
            const { fontSize = 11, fontStyle = 'normal', color = [0, 0, 0], maxWidth = pageWidth - 2 * margin } = options;

            doc.setFontSize(fontSize);
            doc.setFont('helvetica', fontStyle);
            doc.setTextColor(...color);

            const lines = doc.splitTextToSize(text, maxWidth);
            doc.text(lines, x, y);

            return y + (lines.length * fontSize * 0.4);
        };

        // Fonction pour vérifier et ajouter une nouvelle page si nécessaire
        const checkPageBreak = (requiredHeight) => {
            if (yPosition + requiredHeight > pageHeight - margin) {
                doc.addPage();
                yPosition = margin;

                // Ajouter l'en-tête sur la nouvelle page
                if (includeHeader) {
                    yPosition = this.addPDFHeader(doc, report, margin, yPosition, primaryColor);
                }
            }
        };

        // En-tête du document
        if (includeHeader) {
            yPosition = this.addPDFHeader(doc, report, margin, yPosition, primaryColor);
        }

        // Section Résultats
        yPosition = this.addPDFResultsSection(doc, report, margin, yPosition, primaryColor, successColor, warningColor, dangerColor, addText, checkPageBreak);

        // Appréciation pédagogique
        yPosition = this.addPDFAppreciationSection(doc, report, margin, yPosition, primaryColor, addText, checkPageBreak);

        // Analyse détaillée
        yPosition = this.addPDFAnalysisSection(doc, report, margin, yPosition, primaryColor, warningColor, dangerColor, addText, checkPageBreak);

        // Plan de progression
        yPosition = this.addPDFProgressSection(doc, report, margin, yPosition, primaryColor, successColor, addText, checkPageBreak);

        // Plan de remédiation
        yPosition = this.addPDFRemediationSection(doc, report, margin, yPosition, primaryColor, addText, checkPageBreak);

        // Conclusion
        yPosition = this.addPDFConclusionSection(doc, report, margin, yPosition, primaryColor, addText, checkPageBreak);

        // Pied de page
        if (includeFooter) {
            this.addPDFFooter(doc, margin, pageHeight, secondaryColor);
        }

        // Génération du PDF
        const pdfData = doc.output('datauristring');

        return {
            success: true,
            data: pdfData,
            fileName: fileName,
            mimeType: 'application/pdf'
        };
    }

    /**
     * Ajoute l'en-tête du PDF
     */
    addPDFHeader(doc, report, margin, yPosition, primaryColor) {
        // Logo et titre (si logo disponible)
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, doc.internal.pageSize.getWidth(), 25, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('MindPrep', margin, 17);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Rapport Pédagogique Détaillé', margin, 17, { align: 'right' });

        yPosition = 35;

        // Informations de l'élève et de l'exercice
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Informations générales', margin, yPosition);
        yPosition += 10;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');

        const studentInfo = report.header.studentInfo;
        const exerciseInfo = report.header.exerciseInfo;

        doc.text(`Élève: ${studentInfo.name}`, margin, yPosition);
        doc.text(`Classe: ${studentInfo.class}`, margin + 80, yPosition);
        yPosition += 8;

        doc.text(`Matière: ${exerciseInfo.subject}`, margin, yPosition);
        doc.text(`Date: ${new Date(exerciseInfo.date).toLocaleDateString('fr-FR')}`, margin + 80, yPosition);
        yPosition += 8;

        doc.text(`Type d'exercice: ${exerciseInfo.type}`, margin, yPosition);
        doc.text(`Durée estimée: ${exerciseInfo.estimatedDuration}`, margin + 80, yPosition);
        yPosition += 15;

        return yPosition;
    }

    /**
     * Ajoute la section résultats du PDF
     */
    addPDFResultsSection(doc, report, margin, yPosition, primaryColor, successColor, warningColor, dangerColor, addText, checkPageBreak) {
        checkPageBreak(60);

        // Titre de section
        doc.setFillColor(240, 240, 240);
        doc.rect(margin - 5, yPosition - 5, doc.internal.pageSize.getWidth() - 2 * margin + 10, 15, 'F');

        doc.setTextColor(...primaryColor);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('RÉSULTATS', margin, yPosition + 5);
        yPosition += 20;

        const results = report.results;
        const grade = results.grade;

        // Note principale
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');

        // Couleur selon la note
        let gradeColor = dangerColor;
        if (grade.score >= 16) gradeColor = successColor;
        else if (grade.score >= 12) gradeColor = warningColor;

        doc.setTextColor(...gradeColor);
        doc.text(`${grade.grade}/20`, margin, yPosition);
        yPosition += 15;

        // Détails de la notation
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');

        doc.text(`Score détaillé: ${grade.score}/20 (${grade.percentage}%)`, margin, yPosition);
        yPosition += 8;

        doc.text(`Niveau: ${grade.level}`, margin, yPosition);
        doc.text(`Statut: ${grade.status}`, margin + 80, yPosition);
        yPosition += 15;

        return yPosition;
    }

    /**
     * Ajoute la section appréciation du PDF
     */
    addPDFAppreciationSection(doc, report, margin, yPosition, primaryColor, addText, checkPageBreak) {
        checkPageBreak(40);

        // Titre de section
        doc.setTextColor(...primaryColor);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('APPRÉCIATION PÉDAGOGIQUE', margin, yPosition);
        yPosition += 10;

        // Appréciation
        yPosition = addText(report.appreciation, margin, yPosition, {
            fontSize: 11,
            maxWidth: doc.internal.pageSize.getWidth() - 2 * margin
        });
        yPosition += 10;

        return yPosition;
    }

    /**
     * Ajoute la section analyse du PDF
     */
    addPDFAnalysisSection(doc, report, margin, yPosition, primaryColor, warningColor, dangerColor, addText, checkPageBreak) {
        checkPageBreak(80);

        // Titre de section
        doc.setTextColor(...primaryColor);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('ANALYSE DÉTAILLÉE', margin, yPosition);
        yPosition += 10;

        const analysis = report.analysis;

        // Erreurs détectées
        if (analysis.errors && analysis.errors.length > 0) {
            doc.setTextColor(...dangerColor);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Erreurs détectées:', margin, yPosition);
            yPosition += 8;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);

            analysis.errors.forEach(error => {
                yPosition = addText(`• ${error.type}: ${error.description}`, margin + 5, yPosition, {
                    fontSize: 10,
                    maxWidth: doc.internal.pageSize.getWidth() - 2 * margin - 5
                });
            });
            yPosition += 5;
        }

        // Concepts non maîtrisés
        if (analysis.unmasteredConcepts && analysis.unmasteredConcepts.length > 0) {
            doc.setTextColor(...warningColor);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Concepts à retravailler:', margin, yPosition);
            yPosition += 8;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);

            analysis.unmasteredConcepts.forEach(concept => {
                yPosition = addText(`• ${concept}`, margin + 5, yPosition, {
                    fontSize: 10,
                    maxWidth: doc.internal.pageSize.getWidth() - 2 * margin - 5
                });
            });
            yPosition += 5;
        }

        yPosition += 10;
        return yPosition;
    }

    /**
     * Ajoute la section progression du PDF
     */
    addPDFProgressSection(doc, report, margin, yPosition, primaryColor, successColor, addText, checkPageBreak) {
        checkPageBreak(60);

        // Titre de section
        doc.setTextColor(...primaryColor);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('PLAN DE PROGRESSION', margin, yPosition);
        yPosition += 10;

        const progress = report.progress;

        if (progress.axes && progress.axes.length > 0) {
            progress.axes.forEach(axis => {
                doc.setTextColor(...successColor);
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text(`${axis.title} (${axis.priority})`, margin, yPosition);
                yPosition += 8;

                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(0, 0, 0);

                yPosition = addText(axis.description, margin + 5, yPosition, {
                    fontSize: 10,
                    maxWidth: doc.internal.pageSize.getWidth() - 2 * margin - 5
                });

                if (axis.actions && axis.actions.length > 0) {
                    yPosition += 3;
                    axis.actions.forEach(action => {
                        yPosition = addText(`✓ ${action}`, margin + 10, yPosition, {
                            fontSize: 9,
                            maxWidth: doc.internal.pageSize.getWidth() - 2 * margin - 10
                        });
                    });
                }
                yPosition += 8;
            });
        }

        yPosition += 10;
        return yPosition;
    }

    /**
     * Ajoute la section remédiation du PDF
     */
    addPDFRemediationSection(doc, report, margin, yPosition, primaryColor, addText, checkPageBreak) {
        checkPageBreak(60);

        // Titre de section
        doc.setTextColor(...primaryColor);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('PLAN DE REMÉDIATION', margin, yPosition);
        yPosition += 10;

        const remediation = report.remediation;

        if (remediation.schedule && remediation.schedule.length > 0) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(`Planning sur ${remediation.duration} jours:`, margin, yPosition);
            yPosition += 8;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');

            remediation.schedule.forEach(day => {
                yPosition = addText(`J+${day.day}: ${day.activities.join(', ')}`, margin + 5, yPosition, {
                    fontSize: 10,
                    maxWidth: doc.internal.pageSize.getWidth() - 2 * margin - 5
                });
            });
        }

        yPosition += 10;
        return yPosition;
    }

    /**
     * Ajoute la section conclusion du PDF
     */
    addPDFConclusionSection(doc, report, margin, yPosition, primaryColor, addText, checkPageBreak) {
        checkPageBreak(40);

        // Titre de section
        doc.setTextColor(...primaryColor);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('CONCLUSION', margin, yPosition);
        yPosition += 10;

        const conclusion = report.conclusion;

        if (conclusion) {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');

            yPosition = addText(`Niveau actuel: ${conclusion.currentLevel}`, margin, yPosition);
            yPosition += 8;

            yPosition = addText(`Potentiel: ${conclusion.potential}`, margin, yPosition);
            yPosition += 8;

            yPosition = addText(`Prochaine priorité: ${conclusion.nextPriority}`, margin, yPosition);
            yPosition += 8;
        }

        yPosition += 10;
        return yPosition;
    }

    /**
     * Ajoute le pied de page du PDF
     */
    addPDFFooter(doc, margin, pageHeight, secondaryColor) {
        const footerY = pageHeight - 15;

        doc.setFontSize(8);
        doc.setTextColor(...secondaryColor);
        doc.setFont('helvetica', 'normal');

        doc.text('MindPrep - Plateforme d\'analyse pédagogique intelligente', margin, footerY);
        doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, margin, footerY + 5, { align: 'right' });
    }

    /**
     * Génère un aperçu HTML du PDF
     * @param {Object} report - Rapport pédagogique
     * @returns {string} - HTML d'aperçu
     */
    generatePreviewHTML(report) {
        return `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #007acc, #005999); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
                <h1 style="margin: 0; font-size: 24px;">MindPrep</h1>
                <h2 style="margin: 10px 0 0 0; font-size: 18px; font-weight: normal;">Rapport Pédagogique Détaillé</h2>
            </div>

            <div style="border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px; padding: 20px;">
                <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                    <h3 style="margin-top: 0; color: #007acc;">Informations générales</h3>
                    <p><strong>Élève:</strong> ${report.header.studentInfo.name}</p>
                    <p><strong>Matière:</strong> ${report.header.exerciseInfo.subject}</p>
                    <p><strong>Note:</strong> <span style="font-size: 24px; font-weight: bold; color: ${report.results.grade.score >= 12 ? '#28a745' : '#dc3545'};">${report.results.grade.grade}/20</span></p>
                </div>

                <div style="margin-bottom: 20px;">
                    <h3 style="color: #007acc;">Appréciation pédagogique</h3>
                    <p>${report.appreciation}</p>
                </div>

                <div style="margin-bottom: 20px;">
                    <h3 style="color: #007acc;">Analyse détaillée</h3>
                    ${report.analysis.errors && report.analysis.errors.length > 0 ? `
                        <h4 style="color: #dc3545;">Erreurs détectées:</h4>
                        <ul>
                            ${report.analysis.errors.map(error => `<li>${error.type}: ${error.description}</li>`).join('')}
                        </ul>
                    ` : ''}
                    ${report.analysis.unmasteredConcepts && report.analysis.unmasteredConcepts.length > 0 ? `
                        <h4 style="color: #ffc107;">Concepts à retravailler:</h4>
                        <ul>
                            ${report.analysis.unmasteredConcepts.map(concept => `<li>${concept}</li>`).join('')}
                        </ul>
                    ` : ''}
                </div>

                <div style="background: #d4edda; padding: 15px; border-radius: 5px;">
                    <h3 style="margin-top: 0; color: #155724;">Plan de progression</h3>
                    <p><strong>Prochaines étapes:</strong> ${report.conclusion ? report.conclusion.nextPriority : 'Consolider les bases'}</p>
                </div>
            </div>
        </div>
        `;
    }
}
/**
 * DOCX Exporter - Exportateur de rapports pédagogiques en DOCX
 * Génère des rapports Word professionnels et éditables
 */

export class DOCXExporter {
    constructor() {
        this.docx = null;
        this.initialized = false;
    }

    /**
     * Initialise la bibliothèque docx
     * @returns {Promise<boolean>} - Succès de l'initialisation
     */
    async initialize() {
        if (this.initialized) return true;

        try {
            if (typeof window !== 'undefined') {
                // Côté client - chargement dynamique
                if (!window.docx) {
                    await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/docx/7.1.0/docx.min.js');
                }
                this.docx = window.docx;
            } else {
                // Côté serveur - import dynamique
                const docxModule = await import('docx');
                this.docx = docxModule;
            }

            this.initialized = true;
            return true;
        } catch (error) {
            console.error('Erreur lors de l\'initialisation de docx:', error);
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
     * Exporte un rapport pédagogique en DOCX
     * @param {Object} report - Rapport pédagogique complet
     * @param {Object} options - Options d'export
     * @returns {Promise<Object>} - Résultat de l'export
     */
    async exportToDOCX(report, options = {}) {
        if (!await this.initialize()) {
            throw new Error('Impossible d\'initialiser l\'export DOCX');
        }

        const {
            fileName = `rapport-pedagogique-${report.header.studentInfo.name.replace(/\s+/g, '-').toLowerCase()}.docx`,
            includeHeader = true,
            includeFooter = true
        } = options;

        const {
            Document,
            Packer,
            Paragraph,
            TextRun,
            HeadingLevel,
            AlignmentType,
            Table,
            TableCell,
            TableRow,
            WidthType,
            BorderStyle,
            convertInchesToTwip
        } = this.docx;

        this.convertInchesToTwip = convertInchesToTwip;

        // Création du document
        const doc = new Document({
            styles: {
                paragraphStyles: [
                    {
                        id: 'headerStyle',
                        name: 'Header Style',
                        basedOn: 'Normal',
                        next: 'Normal',
                        quickFormat: true,
                        run: {
                            size: 24,
                            bold: true,
                            color: 'FFFFFF'
                        }
                    },
                    {
                        id: 'titleStyle',
                        name: 'Title Style',
                        basedOn: 'Normal',
                        next: 'Normal',
                        quickFormat: true,
                        run: {
                            size: 28,
                            bold: true,
                            color: '007ACC'
                        }
                    },
                    {
                        id: 'sectionTitleStyle',
                        name: 'Section Title Style',
                        basedOn: 'Normal',
                        next: 'Normal',
                        quickFormat: true,
                        run: {
                            size: 22,
                            bold: true,
                            color: '007ACC'
                        }
                    },
                    {
                        id: 'gradeStyle',
                        name: 'Grade Style',
                        basedOn: 'Normal',
                        next: 'Normal',
                        quickFormat: true,
                        run: {
                            size: 36,
                            bold: true
                        }
                    }
                ]
            },
            sections: [{
                properties: {},
                children: this.buildDocumentContent(report, includeHeader, includeFooter)
            }]
        });

        // Génération du DOCX
        const buffer = await Packer.toBuffer(doc);
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });

        return {
            success: true,
            data: blob,
            fileName: fileName,
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        };
    }

    /**
     * Construit le contenu du document DOCX
     * @param {Object} report - Rapport pédagogique
     * @param {boolean} includeHeader - Inclure l'en-tête
     * @param {boolean} includeFooter - Inclure le pied de page
     * @returns {Array} - Contenu du document
     */
    buildDocumentContent(report, includeHeader, includeFooter) {
        const content = [];

        // En-tête du document
        if (includeHeader) {
            content.push(...this.buildHeaderSection(report));
        }

        // Section résultats
        content.push(...this.buildResultsSection(report));

        // Appréciation pédagogique
        content.push(...this.buildAppreciationSection(report));

        // Analyse détaillée
        content.push(...this.buildAnalysisSection(report));

        // Plan de progression
        content.push(...this.buildProgressSection(report));

        // Plan de remédiation
        content.push(...this.buildRemediationSection(report));

        // Conclusion
        content.push(...this.buildConclusionSection(report));

        // Pied de page
        if (includeFooter) {
            content.push(...this.buildFooterSection());
        }

        return content;
    }

    /**
     * Construit la section en-tête
     * @param {Object} report - Rapport pédagogique
     * @returns {Array} - Contenu de l'en-tête
     */
    buildHeaderSection(report) {
        const content = [];

        // Titre principal avec fond coloré
        content.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: 'MindPrep',
                        bold: true,
                        size: 32,
                        color: 'FFFFFF'
                    })
                ],
                shading: {
                    type: 'solid',
                    color: '007ACC'
                },
                spacing: {
                    after: 200
                }
            })
        );

        content.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: 'Rapport Pédagogique Détaillé',
                        size: 24,
                        color: 'FFFFFF'
                    })
                ],
                shading: {
                    type: 'solid',
                    color: '007ACC'
                },
                spacing: {
                    after: 400
                }
            })
        );

        // Informations générales
        content.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: 'Informations générales',
                        bold: true,
                        size: 22,
                        color: '007ACC'
                    })
                ],
                spacing: {
                    before: 200,
                    after: 200
                }
            })
        );

        const studentInfo = report.header.studentInfo;
        const exerciseInfo = report.header.exerciseInfo;

        // Tableau des informations
        content.push(
            new Table({
                width: {
                    size: 100,
                    type: WidthType.PERCENTAGE
                },
                borders: {
                    top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                    bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                    left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                    right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                    insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                    insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
                },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph(`Élève: ${studentInfo.name}`)]
                            }),
                            new TableCell({
                                children: [new Paragraph(`Classe: ${studentInfo.class}`)]
                            })
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph(`Matière: ${exerciseInfo.subject}`)]
                            }),
                            new TableCell({
                                children: [new Paragraph(`Date: ${new Date(exerciseInfo.date).toLocaleDateString('fr-FR')}`)]
                            })
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph(`Type d'exercice: ${exerciseInfo.type}`)]
                            }),
                            new TableCell({
                                children: [new Paragraph(`Durée estimée: ${exerciseInfo.estimatedDuration}`)]
                            })
                        ]
                    })
                ]
            })
        );

        content.push(new Paragraph({ children: [new TextRun('')] })); // Espace

        return content;
    }

    /**
     * Construit la section résultats
     * @param {Object} report - Rapport pédagogique
     * @returns {Array} - Contenu de la section résultats
     */
    buildResultsSection(report) {
        const content = [];

        // Titre de section
        content.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: 'RÉSULTATS',
                        bold: true,
                        size: 24,
                        color: '007ACC'
                    })
                ],
                spacing: {
                    before: 300,
                    after: 200
                }
            })
        );

        const results = report.results;
        const grade = results.grade;

        // Note principale
        let gradeColor = 'DC3545'; // Rouge par défaut
        if (grade.score >= 16) gradeColor = '28A745'; // Vert
        else if (grade.score >= 12) gradeColor = 'FFC107'; // Jaune

        content.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: `${grade.grade}/20`,
                        bold: true,
                        size: 44,
                        color: gradeColor
                    })
                ],
                alignment: AlignmentType.CENTER,
                spacing: {
                    before: 200,
                    after: 200
                }
            })
        );

        // Détails de la notation
        content.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: `Score détaillé: ${grade.score}/20 (${grade.percentage}%)`,
                        size: 22
                    })
                ]
            })
        );

        content.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: `Niveau: ${grade.level}`,
                        size: 22
                    })
                ]
            })
        );

        content.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: `Statut: ${grade.status}`,
                        size: 22
                    })
                ]
            })
        );

        return content;
    }

    /**
     * Construit la section appréciation
     * @param {Object} report - Rapport pédagogique
     * @returns {Array} - Contenu de la section appréciation
     */
    buildAppreciationSection(report) {
        const content = [];

        content.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: 'APPRÉCIATION PÉDAGOGIQUE',
                        bold: true,
                        size: 24,
                        color: '007ACC'
                    })
                ],
                spacing: {
                    before: 300,
                    after: 200
                }
            })
        );

        content.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: report.appreciation,
                        size: 22
                    })
                ],
                spacing: {
                    after: 200
                }
            })
        );

        return content;
    }

    /**
     * Construit la section analyse
     * @param {Object} report - Rapport pédagogique
     * @returns {Array} - Contenu de la section analyse
     */
    buildAnalysisSection(report) {
        const content = [];

        content.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: 'ANALYSE DÉTAILLÉE',
                        bold: true,
                        size: 24,
                        color: '007ACC'
                    })
                ],
                spacing: {
                    before: 300,
                    after: 200
                }
            })
        );

        const analysis = report.analysis;

        // Erreurs détectées
        if (analysis.errors && analysis.errors.length > 0) {
            content.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: 'Erreurs détectées:',
                            bold: true,
                            size: 22,
                            color: 'DC3545'
                        })
                    ],
                    spacing: {
                        before: 200,
                        after: 100
                    }
                })
            );

            analysis.errors.forEach(error => {
                content.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `• ${error.type}: ${error.description}`,
                                size: 20
                            })
                        ],
                        indent: {
                            left: this.convertInchesToTwip(0.25)
                        }
                    })
                );
            });
        }

        // Concepts non maîtrisés
        if (analysis.unmasteredConcepts && analysis.unmasteredConcepts.length > 0) {
            content.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: 'Concepts à retravailler:',
                            bold: true,
                            size: 22,
                            color: 'FFC107'
                        })
                    ],
                    spacing: {
                        before: 200,
                        after: 100
                    }
                })
            );

            analysis.unmasteredConcepts.forEach(concept => {
                content.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `• ${concept}`,
                                size: 20
                            })
                        ],
                        indent: {
                            left: this.convertInchesToTwip(0.25)
                        }
                    })
                );
            });
        }

        return content;
    }

    /**
     * Construit la section progression
     * @param {Object} report - Rapport pédagogique
     * @returns {Array} - Contenu de la section progression
     */
    buildProgressSection(report) {
        const content = [];

        content.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: 'PLAN DE PROGRESSION',
                        bold: true,
                        size: 24,
                        color: '007ACC'
                    })
                ],
                spacing: {
                    before: 300,
                    after: 200
                }
            })
        );

        const progress = report.progress;

        if (progress.axes && progress.axes.length > 0) {
            progress.axes.forEach(axis => {
                content.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `${axis.title} (${axis.priority})`,
                                bold: true,
                                size: 22,
                                color: '28A745'
                            })
                        ],
                        spacing: {
                            before: 200,
                            after: 100
                        }
                    })
                );

                content.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: axis.description,
                                size: 20
                            })
                        ]
                    })
                );

                if (axis.actions && axis.actions.length > 0) {
                    axis.actions.forEach(action => {
                        content.push(
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: `✓ ${action}`,
                                        size: 18
                                    })
                                ],
                                indent: {
                                    left: this.convertInchesToTwip(0.3)
                                }
                            })
                        );
                    });
                }
            });
        }

        return content;
    }

    /**
     * Construit la section remédiation
     * @param {Object} report - Rapport pédagogique
     * @returns {Array} - Contenu de la section remédiation
     */
    buildRemediationSection(report) {
        const content = [];

        content.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: 'PLAN DE REMÉDIATION',
                        bold: true,
                        size: 24,
                        color: '007ACC'
                    })
                ],
                spacing: {
                    before: 300,
                    after: 200
                }
            })
        );

        const remediation = report.remediation;

        if (remediation.schedule && remediation.schedule.length > 0) {
            content.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Planning sur ${remediation.duration} jours:`,
                            bold: true,
                            size: 22
                        })
                    ],
                    spacing: {
                        before: 200,
                        after: 100
                    }
                })
            );

            remediation.schedule.forEach(day => {
                content.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `J+${day.day}: ${day.activities.join(', ')}`,
                                size: 20
                            })
                        ],
                        indent: {
                            left: this.convertInchesToTwip(0.25)
                        }
                    })
                );
            });
        }

        return content;
    }

    /**
     * Construit la section conclusion
     * @param {Object} report - Rapport pédagogique
     * @returns {Array} - Contenu de la section conclusion
     */
    buildConclusionSection(report) {
        const content = [];

        content.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: 'CONCLUSION',
                        bold: true,
                        size: 24,
                        color: '007ACC'
                    })
                ],
                spacing: {
                    before: 300,
                    after: 200
                }
            })
        );

        const conclusion = report.conclusion;

        if (conclusion) {
            content.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Niveau actuel: ${conclusion.currentLevel}`,
                            size: 22
                        })
                    ]
                })
            );

            content.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Potentiel: ${conclusion.potential}`,
                            size: 22
                        })
                    ]
                })
            );

            content.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Prochaine priorité: ${conclusion.nextPriority}`,
                            size: 22
                        })
                    ]
                })
            );
        }

        return content;
    }

    /**
     * Construit la section pied de page
     * @returns {Array} - Contenu du pied de page
     */
    buildFooterSection() {
        const content = [];

        content.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: 'MindPrep - Plateforme d\'analyse pédagogique intelligente',
                        size: 18,
                        color: '6C757D'
                    })
                ],
                alignment: AlignmentType.CENTER,
                spacing: {
                    before: 400,
                    after: 100
                }
            })
        );

        content.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: `Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`,
                        size: 18,
                        color: '6C757D'
                    })
                ],
                alignment: AlignmentType.CENTER
            })
        );

        return content;
    }

    /**
     * Génère un aperçu HTML du DOCX
     * @param {Object} report - Rapport pédagogique
     * @returns {string} - HTML d'aperçu
     */
    generatePreviewHTML(report) {
        return `
        <div style="font-family: 'Times New Roman', serif; max-width: 800px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #007acc, #005999); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="margin: 0; font-size: 28px;">MindPrep</h1>
                <h2 style="margin: 10px 0 0 0; font-size: 20px; font-weight: normal;">Rapport Pédagogique Détaillé</h2>
            </div>

            <div style="border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px; padding: 20px;">
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Élève:</strong> ${report.header.studentInfo.name}</td>
                        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Classe:</strong> ${report.header.studentInfo.class}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Matière:</strong> ${report.header.exerciseInfo.subject}</td>
                        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Date:</strong> ${new Date(report.header.exerciseInfo.date).toLocaleDateString('fr-FR')}</td>
                    </tr>
                </table>

                <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 10px;">
                    <div style="font-size: 48px; font-weight: bold; color: ${report.results.grade.score >= 12 ? '#28a745' : '#dc3545'};">
                        ${report.results.grade.grade}/20
                    </div>
                    <div style="font-size: 18px; color: #666;">
                        Score: ${report.results.grade.score}/20 (${report.results.grade.percentage}%)
                    </div>
                </div>

                <div style="margin-bottom: 20px;">
                    <h3 style="color: #007acc; border-bottom: 2px solid #007acc; padding-bottom: 5px;">Appréciation pédagogique</h3>
                    <p style="font-size: 16px; line-height: 1.6;">${report.appreciation}</p>
                </div>

                <div style="margin-bottom: 20px;">
                    <h3 style="color: #007acc; border-bottom: 2px solid #007acc; padding-bottom: 5px;">Analyse détaillée</h3>
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

                <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
                    <h3 style="margin-top: 0; color: #155724;">Plan de progression</h3>
                    <p><strong>Prochaine priorité:</strong> ${report.conclusion ? report.conclusion.nextPriority : 'Consolider les bases'}</p>
                </div>

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px;">
                    MindPrep - Plateforme d'analyse pédagogique intelligente<br>
                    Généré le ${new Date().toLocaleDateString('fr-FR')}
                </div>
            </div>
        </div>
        `;
    }
}
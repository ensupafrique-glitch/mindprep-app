# Architecture MindPrep - Moteur d'Apprentissage Cognitif

## Vue d'ensemble

MindPrep est un moteur d'apprentissage structuré qui transforme les contenus pédagogiques en parcours d'apprentissage cognitif. L'architecture est conçue pour être modulaire, maintenable et extensible.

## Structure architecturale

```
mindprep/
├── index.html              # Interface utilisateur principale
├── styles.css              # Styles responsives
├── app.js                  # Orchestrateur UI (point d'entrée)
│
├── core/                   # Noyau métier modulaire
│   ├── pedagogy-engine/    # Moteur pédagogique principal
│   │   └── index.js        # Orchestrateur des analyseurs
│   │
│   ├── analyzers/          # Analyseurs spécialisés
│   │   ├── text-analyzer.js      # Extraction de concepts
│   │   ├── concept-analyzer.js   # Construction de schémas
│   │   ├── relation-analyzer.js  # Analyse des relations
│   │   ├── compression-analyzer.js # Compression intelligente
│   │   └── reconstruction-analyzer.js # Plan de reconstruction
│   │
│   ├── renderers/          # Rendu et affichage
│   │   ├── course-renderer.js    # Rendu des cours
│   │   └── ui-components.js      # Composants UI réutilisables
│   │
│   ├── models/             # Modèles de données
│   │   └── course-model.js # Structure des cours pédagogiques
│   │
│   ├── reporting/          # 🆕 Moteur de reporting pédagogique
│   │   ├── grading-engine.js     # Calcul des notes et niveaux
│   │   ├── feedback-engine.js    # Génération d'appréciations
│   │   ├── progress-engine.js    # Plans de progression
│   │   ├── report-engine.js      # Assemblage des rapports
│   │   └── export-engine.js      # Export PDF/DOCX
│   │
│   └── utils/              # Utilitaires partagés
│       ├── text-utils.js   # Traitement de texte
│       └── ai-config.js    # Configuration IA
│
├── api/                    # Intégrations externes
│   ├── openai.js           # Service OpenAI
│   └── prompts.js          # Prompts IA
│
└── data/                   # Données statiques
    └── examples.js         # Exemples pédagogiques
```

## Flux de données

1. **Entrée utilisateur** → `app.js` (orchestrateur UI)
2. **Traitement** → `PedagogyEngine.build()`
3. **Analyse séquentielle**:
   - `text-analyzer` → extraction de mots-clés
   - `concept-analyzer` → construction du schéma
   - `relation-analyzer` → identification des liens
   - `compression-analyzer` → synthèse intelligente
   - `reconstruction-analyzer` → plan de reconstruction
4. **Modélisation** → `CourseModel` (structure de données)
5. **Rendu** → `course-renderer` → interface utilisateur

## Module de Reporting Pédagogique 🆕

Le module `core/reporting/` transforme MindPrep en moteur d'évaluation et de génération de rapports pédagogiques complets.

### Flux de reporting

1. **Analyse de copie** → `PedagogyEngine.analyzeAndReport()`
2. **Notation automatique** → `GradingEngine.calculateGrade()`
3. **Feedback intelligent** → `FeedbackEngine.generateAppreciation()`
4. **Plan de progression** → `ProgressEngine.generateRemediationPlan()`
5. **Assemblage rapport** → `ReportEngine.generateReport()`
6. **Export formaté** → `ExportEngine.exportToPDF/DOCX()`

### Structure du rapport généré

```javascript
{
  header: {
    student: { name, class, id },
    subject: "Matière",
    exercise: { title, type, date, estimatedDuration }
  },
  results: {
    grade: "14/20",
    level: "Bon",
    status: "Solide",
    percentage: 70
  },
  appreciation: "Appréciation pédagogique détaillée",
  analysis: {
    errors: [{ type, description, severity }],
    unmasteredConcepts: ["concept1", "concept2"],
    strengths: ["point fort 1"]
  },
  progress: {
    axes: [{ title, description, priority, actions }],
    recommendedProgression: [{ timing, action, description }]
  },
  remediation: {
    duration: 7,
    focus: "consolidation",
    schedule: [{ day, date, activities, duration, type }]
  },
  conclusion: {
    currentLevel: "Bon",
    potential: "Très élevé",
    nextPriority: "Approfondissement conceptuel"
  }
}
```

### Composants du module

#### GradingEngine
- **Rôle**: Calcul automatique des notes et niveaux
- **Méthodes**: `calculateGrade()`, `calculateScore()`, `determineLevel()`
- **Logique**: Système de pénalités/bonus basé sur erreurs et forces

#### FeedbackEngine
- **Rôle**: Génération d'appréciations pédagogiques intelligentes
- **Méthodes**: `generateAppreciation()`, `generateSynthesis()`, `analyzeErrors()`
- **Templates**: Base de phrases adaptées par niveau et matière

#### ProgressEngine
- **Rôle**: Élaboration de plans de progression personnalisés
- **Méthodes**: `generateProgressAxes()`, `generateRemediationPlan()`, `generateNextSteps()`
- **Planning**: Génération de programmes sur 5-21 jours

#### ReportEngine
- **Rôle**: Orchestration et assemblage du rapport complet
- **Méthodes**: `generateReport()`, `exportReport()`
- **Formats**: JSON, HTML, texte

#### ExportEngine
- **Rôle**: Export des rapports en PDF et DOCX
- **Bibliothèques**: jsPDF (PDF), docx (DOCX)
- **Templates**: Mise en forme professionnelle scolaire

## Nouvelles fonctionnalités

### Analyse de copies d'élèves
- Détection automatique d'erreurs
- Identification de concepts non maîtrisés
- Évaluation des points forts
- Analyse méthodologique et logique

### Génération de rapports complets
- Notes et niveaux automatiques
- Appréciations pédagogiques personnalisées
- Plans de remédiation détaillés
- Axes de progression prioritaires

### Export professionnel
- PDF formaté pour impression
- DOCX modifiable pour enseignants
- Mise en page adaptée à l'usage scolaire

## Principes architecturaux

### 1. Séparation des responsabilités
- **UI**: Gestion des événements et affichage (`app.js`)
- **Métier**: Logique pédagogique (`core/`)
- **Données**: Modèles et structures (`models/`)
- **Utilitaires**: Fonctions transversales (`utils/`)

### 2. Modularité
Chaque analyseur est indépendant et peut être:
- Testé unitairement
- Remplacé par une version IA
- Étendu pour de nouveaux sujets

### 3. Extensibilité IA
- Configuration centralisée (`ai-config.js`)
- Interface standardisée (`AIService`)
- Prompts paramétrables (`prompts.js`)

### 4. Maintenabilité
- Imports explicites (ES modules)
- Classes pour les modèles complexes
- Fonctions pures pour les utilitaires

## Points d'extension

### Ajout d'un nouvel analyseur
1. Créer `core/analyzers/new-analyzer.js`
2. Exporter une fonction spécialisée
3. Intégrer dans `PedagogyEngine.build()`

### Intégration IA
1. Configurer `ai-config.js`
2. Étendre `AIService` si nécessaire
3. Activer dans `PedagogyEngine` avec `useAI: true`

### Nouveau type de contenu
1. Étendre `CourseModel`
2. Ajouter des analyseurs spécialisés
3. Mettre à jour les renderers

### 🆕 Extension du système de reporting
1. **Nouvel analyseur d'erreurs**: Ajouter dans `PedagogyEngine.detectErrors()`
2. **Template d'appréciation**: Étendre `FeedbackEngine.templates`
3. **Plan de remédiation**: Personnaliser dans `ProgressEngine.remediationTemplates`
4. **Format d'export**: Ajouter dans `ExportEngine.exportReport()`

### 🆕 Intégration OCR pour copies
1. Ajouter service OCR dans `api/ocr.js`
2. Étendre `analyzeStudentWork()` pour traiter les images
3. Intégrer dans l'interface copies

## Impact stratégique

Le module de reporting transforme MindPrep de **simple outil d'aide aux révisions** en **véritable moteur de diagnostic pédagogique et de reporting scolaire**, créant une valeur produit exceptionnelle pour l'usage éducatif professionnel.

## Qualité du code

- **Tests**: Chaque module peut être testé indépendamment
- **Types**: Utilisation de classes pour la type safety
- **Performance**: Analyseurs légers et asynchrones
- **Sécurité**: Validation des entrées utilisateur

## Évolution future

1. **Backend API**: Migration des analyseurs vers des microservices
2. **IA native**: Remplacement progressif des règles par du ML
3. **Multi-modal**: Support des images, vidéos, audio
4. **Personnalisation**: Adaptation aux profils d'apprenants
5. **Analytics**: Métriques d'efficacité pédagogique
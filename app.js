import { PedagogyEngine } from "./core/pedagogy-engine/index.js";
import { renderCourse } from "./core/renderers/course-renderer.js";
import { courseExamples } from "./data/examples.js";
import { AccessEngine, CheckoutEngine, PricingEngine, BillingUtils } from "./core/billing/index.js";
import { ReportEngine, PDFExporter, DOCXExporter, ReportingUtils } from "./core/reporting/index.js";

// Initialisation des moteurs de monétisation
const accessEngine = new AccessEngine();
const checkoutEngine = new CheckoutEngine();
const pricingEngine = new PricingEngine();

// Initialisation des moteurs de reporting
const reportEngine = new ReportEngine();
const pdfExporter = new PDFExporter();
const docxExporter = new DOCXExporter();

// État utilisateur actuel (simulation - en production viendrait de l'auth)
let currentUser = {
  id: 'demo_user',
  tier: 'free', // 'free', 'basic', 'premium', 'pro'
  credits: { full: 0 },
  subscription: null
};

// Stockage du dernier rapport généré
let lastGeneratedReport = null;

const titles = {
  dashboard: "Plan du jour",
  diagnostic: "Diagnostic",
  practice: "Mini-test",
  copies: "Correction de copie",
  courses: "La compréhension facilitée du Cours",
  review: "Corrections",
  progress: "Progression",
};

let topics = [
  { name: "Probabilités", score: 42, status: "Priorité haute" },
  { name: "Suites", score: 55, status: "À renforcer" },
  { name: "Dérivation", score: 58, status: "À stabiliser" },
  { name: "Fonctions", score: 68, status: "Correct" },
  { name: "Géométrie", score: 74, status: "Solide" },
  { name: "Statistiques", score: 82, status: "Très solide" },
];

const classProfiles = {
  Sixieme: {
    examContext: "College Maths",
    countdown: "Objectif bases solides",
    focus: "fractions, calcul mental et geometrie",
    level: "Sixieme",
    track: "math",
  },
  Cinquieme: {
    examContext: "College Maths",
    countdown: "Objectif progression",
    focus: "proportionnalite, nombres relatifs et triangles",
    level: "Cinquieme",
    track: "math",
  },
  Quatrieme: {
    examContext: "College Maths",
    countdown: "Objectif confiance",
    focus: "puissances, equations et theoreme de Pythagore",
    level: "Quatrieme",
    track: "math",
  },
  Troisieme: {
    examContext: "Brevet Maths",
    countdown: "Preparation Brevet",
    focus: "fonctions, probabilites et geometrie",
    level: "Troisieme",
    track: "math",
  },
  Seconde: {
    examContext: "Seconde Maths",
    countdown: "Objectif lycee",
    focus: "fonctions, vecteurs et statistiques",
    level: "Seconde",
    track: "math",
  },
  "Premiere generale": {
    examContext: "Premiere Maths",
    countdown: "Objectif specialite",
    focus: "derivation, suites et probabilites",
    level: "Premiere generale",
    track: "math",
  },
  "Premiere L": {
    examContext: "Premiere L",
    countdown: "Objectif bac francais",
    focus: "litterature, histoire-geographie et methodologie de dissertation",
    level: "Premiere L",
    track: "literary",
  },
  "Premiere technologique": {
    examContext: "Premiere Techno Maths",
    countdown: "Objectif controle continu",
    focus: "fonctions, statistiques et automatismes",
    level: "Premiere technologique",
    track: "math",
  },
  "Terminale generale": {
    examContext: "Bac Maths",
    countdown: "J-90 avant le Bac",
    focus: "probabilites, suites et derivation",
    level: "Terminale generale",
    track: "math",
  },
  "Terminale L": {
    examContext: "Bac L",
    countdown: "J-90 avant le Bac",
    focus: "philosophie, histoire, geographie et litterature",
    level: "Terminale L",
    track: "literary",
  },
  "Terminale technologique": {
    examContext: "Bac Techno Maths",
    countdown: "J-90 avant le Bac",
    focus: "fonctions, statistiques et suites",
    level: "Terminale technologique",
    track: "math",
  },
  "Concours ENA": {
    examContext: "Concours ENA",
    countdown: "Objectif admissibilite",
    focus: "culture generale, droit public, economie et note de synthese",
    level: "Concours ENA",
    track: "ena",
  },
  "Classes prepa": {
    examContext: "Classes prepa",
    countdown: "Objectif concours",
    focus: "dissertation, langues, culture generale et entrainement intensif",
    level: "Classes prepa",
    track: "prepa",
  },
  "Etudiant libre": {
    examContext: "Revision libre",
    countdown: "Objectif personnel",
    focus: "tes priorites du moment",
    level: "Etudiant libre",
    track: "literary",
  },
};

const mathDiagnosticQuestions = [
  {
    question: "Si P(A) = 0,4 et P(B sachant A) = 0,5, quelle est la valeur de P(A ∩ B) ?",
    answers: ["0,1", "0,2", "0,4", "0,9"],
    correct: 1,
  },
  {
    question: "Une suite arithmétique vérifie u0 = 3 et raison r = 4. Que vaut u5 ?",
    answers: ["15", "20", "23", "27"],
    correct: 2,
  },
  {
    question: "La dérivée de f(x) = x² + 3x est :",
    answers: ["2x + 3", "x + 3", "2x", "x² + 3"],
    correct: 0,
  },
  {
    question: "Pour résoudre f(x) ≥ 0, l’outil le plus utile est souvent :",
    answers: ["Un tableau de signes", "Un arbre pondéré", "Une moyenne", "Une intégrale"],
    correct: 0,
  },
  {
    question: "Dans un exercice type Bac, que faut-il faire après un résultat numérique ?",
    answers: ["Changer de méthode", "Justifier et interpréter", "Arrondir au hasard", "Sauter la conclusion"],
    correct: 1,
  },
];

const mathPracticeQuestions = [
  {
    title: "Probabilités conditionnelles",
    question: "Dans une classe, 60% des élèves font spécialité Maths. Parmi eux, 40% font aussi Physique. Quelle part de la classe fait les deux ?",
    answers: ["20%", "24%", "40%", "60%"],
    correct: 1,
    feedback: "Tu dois multiplier la probabilité de faire Maths par la probabilité de faire Physique sachant Maths: 0,60 × 0,40 = 0,24.",
    trap: "L’erreur fréquente consiste à lire 40% comme une part de toute la classe, alors que c’est une part du groupe Maths.",
  },
  {
    title: "Suites",
    question: "Une suite géométrique a pour premier terme 5 et pour raison 2. Quel est le quatrième terme si u1 = 5 ?",
    answers: ["20", "30", "40", "80"],
    correct: 2,
    feedback: "Avec u1 = 5, le quatrième terme est u4 = 5 × 2³ = 40.",
    trap: "Attention au rang de départ: si le premier terme est u1, il y a trois multiplications pour arriver à u4.",
  },
  {
    title: "Dérivation",
    question: "Si f(x) = 3x² - 2x + 1, alors f’(x) vaut :",
    answers: ["3x - 2", "6x - 2", "6x + 1", "x² - 2"],
    correct: 1,
    feedback: "La dérivée de 3x² est 6x, celle de -2x est -2, et la constante disparaît.",
    trap: "Ne garde pas la constante dans la dérivée.",
  },
];

const contentTracks = {
  math: {
    topics: [
      { name: "Probabilités", score: 42, status: "Priorité haute" },
      { name: "Suites", score: 55, status: "À renforcer" },
      { name: "Dérivation", score: 58, status: "À stabiliser" },
      { name: "Fonctions", score: 68, status: "Correct" },
      { name: "Géométrie", score: 74, status: "Solide" },
      { name: "Statistiques", score: 82, status: "Très solide" },
    ],
    diagnostic: mathDiagnosticQuestions,
    practice: mathPracticeQuestions,
    plan: ["Probabilités conditionnelles", "Suites arithmétiques", "Dérivation"],
    insights: [
      "Tu réussis mieux quand les questions sont courtes et ciblées.",
      "Les erreurs en probabilités viennent surtout de la lecture de l’énoncé.",
      "Ta progression est stable depuis 6 jours. Garde le rythme.",
    ],
  },
  literary: {
    topics: [
      { name: "Philosophie", score: 48, status: "Priorité haute" },
      { name: "Histoire", score: 57, status: "À renforcer" },
      { name: "Géographie", score: 61, status: "À stabiliser" },
      { name: "Littérature", score: 52, status: "À renforcer" },
      { name: "Langues", score: 70, status: "Correct" },
      { name: "Méthodologie", score: 44, status: "Priorité haute" },
    ],
    diagnostic: [
      {
        question: "Dans une dissertation de philosophie, quel élément doit apparaître dans l’introduction ?",
        answers: ["Une problématique", "Une citation isolée", "Une conclusion", "Une liste de dates"],
        correct: 0,
      },
      {
        question: "En histoire, une bonne composition repose d’abord sur :",
        answers: ["Un plan organisé", "Un résumé du cours", "Une opinion personnelle", "Un schéma sans explication"],
        correct: 0,
      },
      {
        question: "En géographie, une carte ou un croquis doit surtout montrer :",
        answers: ["Des couleurs nombreuses", "Une organisation de l’espace", "Des phrases longues", "Un récit chronologique"],
        correct: 1,
      },
      {
        question: "En littérature, analyser un texte consiste à :",
        answers: ["Raconter l’histoire", "Relier forme, sens et contexte", "Chercher seulement les figures", "Donner son avis"],
        correct: 1,
      },
      {
        question: "Une conclusion efficace doit :",
        answers: ["Répéter l’introduction", "Répondre clairement au problème", "Ajouter un nouveau sujet", "Allonger la copie"],
        correct: 1,
      },
    ],
    practice: [
      {
        title: "Philosophie",
        question: "Quelle question transforme le sujet “La liberté est-elle une illusion ?” en vraie problématique ?",
        answers: ["Qui a inventé la liberté ?", "Peut-on se croire libre tout en étant déterminé ?", "La liberté est-elle utile ?", "Faut-il définir illusion ?"],
        correct: 1,
        feedback: "La meilleure problématique fait apparaître une tension: sentiment de liberté contre déterminismes possibles.",
        trap: "Évite les questions trop descriptives qui ne créent pas de débat philosophique.",
      },
      {
        title: "Histoire",
        question: "Dans une composition, où placer les dates clés ?",
        answers: ["Uniquement en conclusion", "Dans les parties où elles servent l’argument", "Dans le titre", "Jamais"],
        correct: 1,
        feedback: "Les dates doivent soutenir une démonstration, pas remplacer l’analyse.",
        trap: "Une copie historique n’est pas une chronologie brute.",
      },
      {
        title: "Littérature",
        question: "Quel lien est le plus pertinent dans une analyse littéraire ?",
        answers: ["Procédé → effet → interprétation", "Résumé → opinion → morale", "Auteur → date → longueur", "Citation → paraphrase → fin"],
        correct: 0,
        feedback: "Une analyse solide part d’un procédé, explique son effet, puis l’interprète dans le texte.",
        trap: "La paraphrase donne l’impression de comprendre, mais elle n’analyse pas.",
      },
    ],
    plan: ["Philosophie: problématique", "Histoire-géographie: plan structuré", "Littérature: analyse de texte"],
    insights: [
      "Tes réponses gagnent en qualité quand tu annonces clairement la problématique.",
      "Les faiblesses viennent surtout de la méthode, pas du manque de connaissances.",
      "Travaille les transitions: elles rendent tes dissertations plus convaincantes.",
    ],
  },
  ena: {
    topics: [
      { name: "Culture générale", score: 46, status: "Priorité haute" },
      { name: "Droit public", score: 51, status: "À renforcer" },
      { name: "Économie", score: 58, status: "À stabiliser" },
      { name: "Institutions", score: 62, status: "Correct" },
      { name: "Note de synthèse", score: 43, status: "Priorité haute" },
      { name: "Oral", score: 55, status: "À renforcer" },
    ],
    diagnostic: [
      {
        question: "Dans une note de synthèse, l’objectif principal est de :",
        answers: ["Donner son opinion", "Structurer fidèlement un dossier", "Tout citer", "Faire une dissertation"],
        correct: 1,
      },
      {
        question: "Une copie de culture générale doit d’abord montrer :",
        answers: ["Une position argumentée", "Un catalogue d’auteurs", "Une opinion spontanée", "Un résumé d’actualité"],
        correct: 0,
      },
      {
        question: "En droit public, une réponse solide commence souvent par :",
        answers: ["La définition des notions", "Une anecdote", "Une statistique isolée", "Une conclusion"],
        correct: 0,
      },
    ],
    practice: [
      {
        title: "Note de synthèse",
        question: "Quelle action faut-il faire avant de rédiger une note de synthèse ?",
        answers: ["Choisir son opinion", "Classer les documents par idées", "Rédiger l’introduction finale", "Ignorer les annexes"],
        correct: 1,
        feedback: "La synthèse repose sur l’organisation des idées du dossier, pas sur une prise de position personnelle.",
        trap: "Ne transforme pas la note de synthèse en dissertation.",
      },
    ],
    plan: ["Note de synthèse: classement du dossier", "Droit public: définitions clés", "Culture générale: problématique"],
    insights: [
      "Ton enjeu principal est la structuration rapide des idées.",
      "Les réponses doivent être précises sans devenir encyclopédiques.",
      "L’entraînement court quotidien aide à automatiser la méthode.",
    ],
  },
  prepa: {
    topics: [
      { name: "Culture générale", score: 49, status: "Priorité haute" },
      { name: "Dissertation", score: 45, status: "Priorité haute" },
      { name: "Langues", score: 67, status: "Correct" },
      { name: "Histoire", score: 59, status: "À stabiliser" },
      { name: "Maths", score: 54, status: "À renforcer" },
      { name: "Colles", score: 51, status: "À renforcer" },
    ],
    diagnostic: [
      {
        question: "En dissertation de prépa, le plan doit surtout :",
        answers: ["Accumuler les exemples", "Faire progresser une tension", "Réciter le cours", "Être très court"],
        correct: 1,
      },
      {
        question: "Pour préparer une colle, l’objectif est de :",
        answers: ["Parler vite", "Construire une réponse claire et défendable", "Tout mémoriser", "Éviter les questions"],
        correct: 1,
      },
    ],
    practice: [
      {
        title: "Dissertation",
        question: "Quel enchaînement est le plus solide pour une partie de dissertation ?",
        answers: ["Idée → exemple → analyse", "Citation → citation → citation", "Opinion → résumé → fin", "Définition → hors-sujet"],
        correct: 0,
        feedback: "Une partie doit défendre une idée, l’incarner par un exemple, puis analyser ce que l’exemple prouve.",
        trap: "L’exemple seul ne remplace jamais l’argument.",
      },
    ],
    plan: ["Dissertation: problématisation", "Langues: thème et version", "Colles: réponse orale structurée"],
    insights: [
      "La priorité est la méthode sous contrainte de temps.",
      "Les colles demandent des réponses courtes, structurées et assumées.",
      "Le suivi par thème évite de réviser seulement ce qui rassure.",
    ],
  },
};

let activeDiagnosticQuestions = mathDiagnosticQuestions;
let activePracticeQuestions = mathPracticeQuestions;

let diagStep = 0;
let diagSelected = null;
let practiceStep = 0;
let practiceSelected = null;
let correctCount = 0;
let answeredCount = 0;
let points = 1240;

const pageTitle = document.querySelector("#page-title");
const toast = document.querySelector("#toast");
const authScreen = document.querySelector("#authScreen");
const appShell = document.querySelector("#appShell");
const authForm = document.querySelector("#authForm");
const loginTab = document.querySelector("#loginTab");
const registerTab = document.querySelector("#registerTab");
const nameField = document.querySelector("#nameField");
const levelField = document.querySelector("#levelField");
const authSubmit = document.querySelector("#authSubmit");
const authName = document.querySelector("#authName");
const authEmail = document.querySelector("#authEmail");
const authPassword = document.querySelector("#authPassword");
const authLevel = document.querySelector("#authLevel");
const googleAuth = document.querySelector("#googleAuth");
const logoutBtn = document.querySelector("#logoutBtn");
const userName = document.querySelector("#userName");
const userLevel = document.querySelector("#userLevel");
const userAvatar = document.querySelector("#userAvatar");
const authNotice = document.querySelector("#authNotice");
const examContext = document.querySelector("#examContext");
const examCountdown = document.querySelector("#examCountdown");
const copyFile = document.querySelector("#copyFile");
const copyPreview = document.querySelector("#copyPreview");
const copySubject = document.querySelector("#copySubject");
const copyPrompt = document.querySelector("#copyPrompt");
const analyzeCopy = document.querySelector("#analyzeCopy");
const copyResultTitle = document.querySelector("#copyResultTitle");
const copyGrade = document.querySelector("#copyGrade");
const copyReading = document.querySelector("#copyReading");
const copyFeedback = document.querySelector("#copyFeedback");
const supportPlan = document.querySelector("#supportPlan");
const courseSubject = document.querySelector("#courseSubject");
const courseTitle = document.querySelector("#courseTitle");
const courseNotes = document.querySelector("#courseNotes");
const generateCourse = document.querySelector("#generateCourse");
const loadCourseExample = document.querySelector("#loadCourseExample");
const courseOutputTitle = document.querySelector("#courseOutputTitle");
const criticalAlerts = document.querySelector("#criticalAlerts");
const courseOutput = document.querySelector("#courseOutput");

let authMode = "login";
const supabaseClient = createSupabaseClient();
let selectedCopyFile = null;

/**
 * Vérifie l'accès à la génération de rapports et gère la monétisation
 * @param {string} reportType - Type de rapport demandé
 * @returns {Object} - Résultat de vérification
 */
async function checkReportAccess(reportType = 'full') {
  const accessCheck = await accessEngine.checkFeatureAccess(currentUser.id, 'report.generate');

  if (!accessCheck.allowed) {
    // Vérifier si l'utilisateur a des crédits
    const credits = await accessEngine.getUserCredits(currentUser.id);
    if (credits[reportType] && credits[reportType] > 0) {
      return {
        allowed: true,
        source: 'credits',
        remainingCredits: credits[reportType]
      };
    }

    // Pas d'accès - proposer upgrade ou achat
    return {
      allowed: false,
      reason: accessCheck.reason,
      upgradeRequired: true,
      upgradeOptions: accessCheck.upgradeOptions,
      pricing: pricingEngine.getTierPricing('basic')
    };
  }

  // Accès autorisé via abonnement
  const usageCheck = await accessEngine.checkUsageLimits(currentUser.id, 'report.generate');
  return {
    allowed: true,
    source: 'subscription',
    remainingUsage: usageCheck.remainingUsage,
    limit: usageCheck.limit
  };
}

/**
 * Consomme l'accès au rapport (crédits ou usage)
 * @param {string} reportType - Type de rapport
 * @returns {Object} - Résultat de consommation
 */
async function consumeReportAccess(reportType = 'full') {
  const accessCheck = await checkReportAccess(reportType);

  if (!accessCheck.allowed) {
    return accessCheck; // Retourner l'erreur
  }

  if (accessCheck.source === 'credits') {
    const creditUsed = await accessEngine.useReportCredit(currentUser.id, reportType);
    if (!creditUsed) {
      return { success: false, error: 'Erreur lors de l\'utilisation du crédit' };
    }
  } else {
    // Enregistrer l'usage pour les limites d'abonnement
    await accessEngine.recordUsage(currentUser.id, 'report.generate');
  }

  return { success: true, source: accessCheck.source };
}

/**
 * Affiche le modal de monétisation
 * @param {Object} accessResult - Résultat de vérification d'accès
 */
function showMonetizationModal(accessResult) {
  const modal = document.createElement('div');
  modal.className = 'monetization-modal';
  modal.innerHTML = `
    <div class="modal-backdrop" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;">
      <div class="modal-content" style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;">
        <h3 style="color: #007acc; margin-top: 0;">🔓 Débloquer les rapports complets</h3>
        <p style="color: #666; margin-bottom: 20px;">Vous avez atteint la limite de rapports gratuits. Choisissez une option pour continuer :</p>

        <div class="pricing-options" style="display: grid; gap: 15px;">
          <!-- Option 1: Crédits à l'unité -->
          <div class="option" style="border: 2px solid #e0e0e0; border-radius: 8px; padding: 15px; cursor: pointer;" onclick="selectPricingOption('credits')">
            <h4 style="margin: 0; color: #333;">📄 Crédits de rapport</h4>
            <p style="margin: 5px 0; color: #666;">1 rapport complet = 2,500 CFA</p>
            <div class="quantity-selector" style="display: flex; align-items: center; gap: 10px; margin-top: 10px;">
              <button onclick="changeQuantity(-1)" style="padding: 5px 10px; border: 1px solid #ccc; background: #f9f9f9;">-</button>
              <span id="quantity">1</span>
              <button onclick="changeQuantity(1)" style="padding: 5px 10px; border: 1px solid #ccc; background: #f9f9f9;">+</button>
            </div>
            <div class="price-display" style="margin-top: 10px; font-weight: bold; color: #007acc;">
              Total: <span id="totalPrice">2,500</span> CFA
            </div>
          </div>

          <!-- Option 2: Abonnement Basic -->
          <div class="option" style="border: 2px solid #007acc; border-radius: 8px; padding: 15px; cursor: pointer;" onclick="selectPricingOption('basic')">
            <h4 style="margin: 0; color: #007acc;">⭐ Abonnement Basic</h4>
            <p style="margin: 5px 0; color: #666;">15 rapports/mois + exports PDF</p>
            <div style="font-weight: bold; color: #007acc; font-size: 18px;">7,500 CFA/mois</div>
            <div style="color: #666; font-size: 12px;">Économisez vs achat à l'unité</div>
          </div>

          <!-- Option 3: Abonnement Premium -->
          <div class="option premium" style="border: 2px solid #ffd700; border-radius: 8px; padding: 15px; cursor: pointer;" onclick="selectPricingOption('premium')">
            <h4 style="margin: 0; color: #b8860b;">💎 Abonnement Premium</h4>
            <p style="margin: 5px 0; color: #666;">Rapports illimités + analyses avancées + support prioritaire</p>
            <div style="font-weight: bold; color: #b8860b; font-size: 18px;">15,000 CFA/mois</div>
            <div style="color: #666; font-size: 12px;">Le plus populaire</div>
          </div>
        </div>

        <div class="modal-actions" style="display: flex; gap: 10px; margin-top: 20px;">
          <button onclick="closeMonetizationModal()" style="flex: 1; padding: 10px; border: 1px solid #ccc; background: #f9f9f9; border-radius: 5px;">Plus tard</button>
          <button id="proceedButton" onclick="proceedWithPayment()" style="flex: 1; padding: 10px; background: #007acc; color: white; border: none; border-radius: 5px;">Continuer</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Variables pour le modal
  let selectedOption = 'basic';
  let quantity = 1;
  const pricePerUnit = 2500;

  // Fonctions du modal
  window.selectPricingOption = function(option) {
    selectedOption = option;
    document.querySelectorAll('.option').forEach(opt => {
      opt.style.borderColor = opt.classList.contains('premium') ? '#ffd700' : '#e0e0e0';
    });
    event.currentTarget.style.borderColor = '#007acc';
  };

  window.changeQuantity = function(delta) {
    quantity = Math.max(1, quantity + delta);
    document.getElementById('quantity').textContent = quantity;
    document.getElementById('totalPrice').textContent = (quantity * pricePerUnit).toLocaleString();
  };

  window.closeMonetizationModal = function() {
    document.body.removeChild(modal);
  };

  window.proceedWithPayment = async function() {
    try {
      const proceedButton = document.getElementById('proceedButton');
      proceedButton.disabled = true;
      proceedButton.textContent = 'Traitement...';

      if (selectedOption === 'credits') {
        // Créer un checkout pour crédits
        const checkoutData = {
          userId: currentUser.id,
          items: [{
            type: 'report',
            reportType: 'full',
            quantity: quantity
          }],
          customerInfo: {
            name: 'Utilisateur Demo',
            email: 'demo@mindprep.sn',
            country: 'SN'
          },
          successUrl: window.location.href,
          cancelUrl: window.location.href
        };

        const checkout = await checkoutEngine.createCheckoutSession(checkoutData);
        if (checkout.success) {
          // Simuler paiement réussi pour la démo
          await accessEngine.addReportCredits(currentUser.id, quantity, 'full');
          closeMonetizationModal();
          showToast(`${quantity} crédit(s) ajouté(s) ! Vous pouvez maintenant générer votre rapport.`);
        }
      } else {
        // Upgrade d'abonnement
        await accessEngine.setUserSubscription(currentUser.id, {
          tier: selectedOption,
          billingCycle: 'monthly',
          status: 'active'
        });
        currentUser.tier = selectedOption;
        closeMonetizationModal();
        showToast(`Abonnement ${selectedOption} activé !`);
      }
    } catch (error) {
      console.error('Erreur paiement:', error);
      showToast('Erreur lors du paiement. Veuillez réessayer.');
    }
  };
}

/**
 * Exporte le dernier rapport généré en PDF
 */
async function exportReportToPDF() {
  if (!lastGeneratedReport) {
    showToast('Aucun rapport disponible pour l\'export');
    return;
  }

  try {
    showToast('Génération du PDF en cours...');

    const result = await pdfExporter.exportToPDF(lastGeneratedReport, {
      fileName: `rapport-pedagogique-${Date.now()}.pdf`,
      includeHeader: true,
      includeFooter: true
    });

    if (result.success) {
      // Télécharger le fichier
      const link = document.createElement('a');
      link.href = result.data;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('PDF généré et téléchargé avec succès !');
    } else {
      showToast('Erreur lors de la génération du PDF');
    }
  } catch (error) {
    console.error('Erreur export PDF:', error);
    showToast('Erreur lors de l\'export PDF');
  }
}

/**
 * Exporte le dernier rapport généré en DOCX
 */
async function exportReportToDOCX() {
  if (!lastGeneratedReport) {
    showToast('Aucun rapport disponible pour l\'export');
    return;
  }

  try {
    showToast('Génération du document Word en cours...');

    const result = await docxExporter.exportToDOCX(lastGeneratedReport, {
      fileName: `rapport-pedagogique-${Date.now()}.docx`,
      includeHeader: true,
      includeFooter: true
    });

    if (result.success) {
      // Télécharger le fichier
      const url = URL.createObjectURL(result.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('Document Word généré et téléchargé avec succès !');
    } else {
      showToast('Erreur lors de la génération du document Word');
    }
  } catch (error) {
    console.error('Erreur export DOCX:', error);
    showToast('Erreur lors de l\'export Word');
  }
}

window.exportReportToPDF = exportReportToPDF;
window.exportReportToDOCX = exportReportToDOCX;

/**
 * Affiche un aperçu du rapport avant export
 */
function showReportPreview() {
  if (!lastGeneratedReport) {
    showToast('Aucun rapport disponible');
    return;
  }

  const previewModal = document.createElement('div');
  previewModal.className = 'report-preview-modal';
  previewModal.innerHTML = `
    <div class="modal-backdrop" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000; display: flex; align-items: center; justify-content: center;">
      <div class="modal-content" style="background: white; width: 90%; max-width: 1000px; height: 90%; border-radius: 10px; overflow: hidden; display: flex; flex-direction: column;">
        <div class="modal-header" style="padding: 20px; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0; color: #007acc;">Aperçu du rapport</h3>
          <div class="preview-actions" style="display: flex; gap: 10px;">
            <button id="preview-export-pdf" style="padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer;">📄 PDF</button>
            <button id="preview-export-docx" style="padding: 8px 16px; background: #007acc; color: white; border: none; border-radius: 5px; cursor: pointer;">📝 Word</button>
            <button id="preview-close" style="padding: 8px 16px; border: 1px solid #ccc; background: #f9f9f9; border-radius: 5px; cursor: pointer;">Fermer</button>
          </div>
        </div>
        <div class="modal-body" style="flex: 1; overflow-y: auto; padding: 20px;">
          ${pdfExporter.generatePreviewHTML(lastGeneratedReport)}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(previewModal);

  const previewPdfButton = previewModal.querySelector('#preview-export-pdf');
  const previewDocxButton = previewModal.querySelector('#preview-export-docx');
  const previewCloseButton = previewModal.querySelector('#preview-close');

  previewPdfButton.addEventListener('click', () => {
    exportReportToPDF();
  });

  previewDocxButton.addEventListener('click', () => {
    exportReportToDOCX();
  });

  const closePreview = () => {
    if (previewModal.parentNode) {
      document.body.removeChild(previewModal);
    }
  };

  previewCloseButton.addEventListener('click', closePreview);
  previewModal.querySelector('.modal-backdrop').addEventListener('click', (event) => {
    if (event.target === previewModal.querySelector('.modal-backdrop')) {
      closePreview();
    }
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function createSupabaseClient() {
  const config = window.MINDPREP_SUPABASE || {};
  const sdk = window.supabase;
  const hasConfig =
    config.url &&
    config.anonKey &&
    !config.url.includes("YOUR_PROJECT_REF") &&
    !config.anonKey.includes("YOUR_SUPABASE_ANON_KEY");

  if (!hasConfig || !sdk?.createClient) {
    return null;
  }

  return sdk.createClient(config.url, config.anonKey);
}

function showAuthNotice(message) {
  authNotice.textContent = message;
  authNotice.classList.add("show");
}

function hideAuthNotice() {
  authNotice.textContent = "";
  authNotice.classList.remove("show");
}

function mapSupabaseUser(user) {
  const metadata = user?.user_metadata || {};
  const emailName = user?.email?.split("@")[0] || "Sarah";

  return {
    name: metadata.name || metadata.full_name || emailName,
    email: user?.email || "",
    level: metadata.level || "Terminale generale",
    provider: user?.app_metadata?.provider || "email",
  };
}

function normalizeLevel(level) {
  const aliases = {
    "Terminale S": "Terminale generale",
    "Terminale générale": "Terminale generale",
    "Terminale littéraire": "Terminale L",
    "Terminale Litteraire": "Terminale L",
    "Première générale": "Premiere generale",
    "Première technologique": "Premiere technologique",
    "Première L": "Premiere L",
    "Premiere litteraire": "Premiere L",
    "Sixième": "Sixieme",
    "Cinquième": "Cinquieme",
    "Quatrième": "Quatrieme",
    "Troisième": "Troisieme",
    "Étudiant libre": "Etudiant libre",
    "Classes prépa": "Classes prepa",
    "Classe prepa": "Classes prepa",
    ENA: "Concours ENA",
  };

  return aliases[level] || level || "Terminale generale";
}

function applyUser(user) {
  const displayName = user.name || "Sarah";
  const level = normalizeLevel(user.level);
  const profile = classProfiles[level] || classProfiles["Terminale generale"];
  const content = contentTracks[profile.track] || contentTracks.math;
  const firstName = displayName.split(" ")[0] || "Sarah";

  topics = content.topics.map((topic) => ({ ...topic }));
  activeDiagnosticQuestions = content.diagnostic;
  activePracticeQuestions = content.practice;
  diagStep = 0;
  practiceStep = 0;
  renderTopics();
  renderDiagnostic();
  renderPractice();
  renderFocusMap(content.topics);
  renderActionPlan(content.plan, profile.examContext);
  renderInsights(content.insights);

  userName.textContent = displayName;
  userLevel.textContent = profile.level;
  userAvatar.textContent = firstName.charAt(0).toUpperCase();
  examContext.textContent = profile.examContext;
  examCountdown.textContent = profile.countdown;

  const heroTitle = document.querySelector(".hero-copy h2");
  if (heroTitle) {
    heroTitle.textContent = `${firstName}, révise ce qui compte vraiment aujourd’hui.`;
  }

  const heroDescription = document.querySelector(".hero-copy p");
  if (heroDescription) {
    heroDescription.textContent = `MindPrep a détecté trois zones à renforcer. Ta prochaine session cible ${profile.focus}.`;
  }
}

function showApp(user) {
  applyUser(user);
  authScreen.classList.add("is-hidden");
  appShell.classList.remove("is-hidden");

  // Afficher le statut d'abonnement
  updateSubscriptionStatus();
}

/**
 * Met à jour l'affichage du statut d'abonnement
 */
async function updateSubscriptionStatus() {
  const statusContainer = document.getElementById('subscriptionStatus') || createSubscriptionStatusContainer();

  try {
    const tier = await accessEngine.getUserTier(currentUser.id);
    const tierData = pricingEngine.getTierPricing(tier);
    const credits = await accessEngine.getUserCredits(currentUser.id);
    const usage = await accessEngine.getCurrentUsage(currentUser.id, 'report.generate');

    const totalCredits = Object.values(credits).reduce((sum, count) => sum + count, 0);
    const remainingReports = Math.max(0, tierData.limits.reportsPerMonth - usage);

    statusContainer.innerHTML = `
      <div class="subscription-badge" style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 20px; font-size: 14px; font-weight: 500; ${
        tier === 'free' ? 'background: #f0f0f0; color: #666;' :
        tier === 'basic' ? 'background: #e3f2fd; color: #1976d2;' :
        tier === 'premium' ? 'background: #fff3e0; color: #f57c00;' :
        'background: #f3e5f5; color: #7b1fa2;'
      }">
        <span class="tier-icon">${
          tier === 'free' ? '🆓' :
          tier === 'basic' ? '⭐' :
          tier === 'premium' ? '💎' :
          '👑'
        }</span>
        <span class="tier-name">${tierData.name}</span>
        <span class="usage-info" style="font-weight: normal;">
          ${tier === 'free' ?
            `${remainingReports} rapports restants` :
            totalCredits > 0 ?
              `${totalCredits} crédit(s) disponible(s)` :
              'Rapports illimités'
          }
        </span>
        ${tier === 'free' ? '<span class="upgrade-hint" style="font-size: 12px; opacity: 0.8;">↗️ Upgrade</span>' : ''}
      </div>
    `;

    // Ajouter un événement de clic pour upgrade si free
    if (tier === 'free') {
      statusContainer.querySelector('.subscription-badge').addEventListener('click', () => {
        showMonetizationModal({
          allowed: false,
          upgradeRequired: true,
          upgradeOptions: pricingEngine.getTierPricing('basic')
        });
      });
      statusContainer.style.cursor = 'pointer';
    }

  } catch (error) {
    console.error('Erreur lors de la récupération du statut:', error);
    statusContainer.innerHTML = '<div style="color: #666; font-size: 14px;">Statut indisponible</div>';
  }
}

/**
 * Crée le conteneur pour le statut d'abonnement
 */
function createSubscriptionStatusContainer() {
  const container = document.createElement('div');
  container.id = 'subscriptionStatus';
  container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 100;';

  document.body.appendChild(container);
  return container;
}

function showAuth() {
  appShell.classList.add("is-hidden");
  authScreen.classList.remove("is-hidden");
}

function setAuthMode(mode) {
  authMode = mode;
  const isRegister = mode === "register";

  loginTab.classList.toggle("active", !isRegister);
  registerTab.classList.toggle("active", isRegister);
  nameField.classList.toggle("is-hidden", !isRegister);
  levelField.classList.toggle("is-hidden", !isRegister);
  authSubmit.textContent = isRegister ? "Créer mon compte" : "Se connecter";
  authPassword.autocomplete = isRegister ? "new-password" : "current-password";
}

function getSupabaseSetupError() {
  const config = window.MINDPREP_SUPABASE || {};

  if (!window.supabase?.createClient) {
    return "Le SDK Supabase n'a pas ete charge. Verifie ta connexion internet ou remplace le CDN par une installation locale.";
  }

  if (!config.url || !config.anonKey || config.url.includes("YOUR_PROJECT_REF") || config.anonKey.includes("YOUR_SUPABASE_ANON_KEY")) {
    return "Supabase n'est pas encore configure. Renseigne supabase-config.js avec l'URL du projet et la cle anon.";
  }

  return "";
}

function getRedirectUrl() {
  if (window.location.protocol === "file:") {
    return "";
  }

  return window.location.href.split("#")[0];
}

function getCredentialsFromForm() {
  const email = authEmail.value.trim().toLowerCase();
  const password = authPassword.value.trim();

  if (!email || !password) {
    showToast("Renseigne ton email et ton mot de passe.");
    return null;
  }

  if (password.length < 6) {
    showToast("Le mot de passe doit contenir au moins 6 caracteres.");
    return null;
  }

  const fallbackName = email.split("@")[0] || "Sarah";
  return {
    name: authMode === "register" ? authName.value.trim() || fallbackName : fallbackName,
    email,
    password,
    level: authMode === "register" ? authLevel.value : "Terminale generale",
  };
}

function setView(viewName) {
  document.querySelectorAll(".view").forEach((view) => {
    view.classList.toggle("active", view.id === viewName);
  });

  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.view === viewName);
  });

  pageTitle.textContent = titles[viewName] || "MindPrep";
}

function getScoreColor(score) {
  if (score < 50) return "var(--danger)";
  if (score < 65) return "var(--warn)";
  return "var(--brand)";
}

function renderTopics() {
  const topicList = document.querySelector("#topicList");
  const barList = document.querySelector("#barList");

  topicList.innerHTML = topics
    .map(
      (topic) => `
        <div class="topic-row">
          <header>
            <span>${topic.name}</span>
            <span style="color: ${getScoreColor(topic.score)}">${topic.score}%</span>
          </header>
          <div class="progress-track">
            <div class="progress-fill" style="width: ${topic.score}%; background: ${getScoreColor(topic.score)}"></div>
          </div>
          <small>${topic.status}</small>
        </div>
      `,
    )
    .join("");

  barList.innerHTML = topics
    .map(
      (topic) => `
        <div class="bar-row">
          <header>
            <span>${topic.name}</span>
            <span>${topic.score}%</span>
          </header>
          <div class="progress-track">
            <div class="progress-fill" style="width: ${topic.score}%; background: ${getScoreColor(topic.score)}"></div>
          </div>
        </div>
      `,
    )
    .join("");
}

function renderFocusMap(items) {
  const focusMap = document.querySelector(".focus-map");
  if (!focusMap) return;

  const styles = ["high", "mid", "low", "mid", "strong", "low"];
  focusMap.innerHTML = items
    .slice(0, 6)
    .map((item, index) => `<div class="focus-cell ${styles[index]}">${item.name}</div>`)
    .join("");
}

function renderActionPlan(plan, context) {
  const actionList = document.querySelector(".action-list");
  if (!actionList) return;

  actionList.innerHTML = plan
    .map(
      (item, index) => `
        <li>
          <strong>${item}</strong>
          <span>${index === 0 ? "Priorité immédiate" : index === 1 ? "Correction des points faibles" : `Entraînement ${context}`}</span>
        </li>
      `,
    )
    .join("");
}

function renderInsights(insights) {
  const insightList = document.querySelector(".insight-list");
  if (!insightList) return;

  insightList.innerHTML = insights.map((insight) => `<p>${insight}</p>`).join("");
}

const pedagogyEngine = {
  stopWords: new Set(["cours", "avec", "pour", "dans", "cette", "comme", "plus", "moins", "entre", "leurs", "notion", "chapitre", "exemple"]),

  extractKeywords(text, fallbackSubject) {
    const cleaned = text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
      .split(/\s+/)
      .filter((word) => word.length > 4);

    const counts = new Map();
    cleaned.forEach((word) => {
      if (!this.stopWords.has(word)) {
        counts.set(word, (counts.get(word) || 0) + 1);
      }
    });

    const keywords = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)
      .map(([word]) => word);

    if (keywords.length >= 4) return keywords;

    const defaults = {
      "Comptabilité de gestion": ["coût complet", "charges directes", "charges indirectes", "marge", "seuil de rentabilité"],
      Finance: ["investissement", "rentabilité", "risque", "financement", "cash-flow"],
      Fiscalité: ["base imposable", "taux", "déduction", "déclaration", "contrôle"],
      Audit: ["risque", "preuve", "contrôle interne", "anomalie", "opinion"],
      Philosophie: ["notion", "problématique", "thèse", "objection", "exemple"],
    };

    return defaults[fallbackSubject] || ["idée centrale", "concepts clés", "relations", "applications", "méthode"];
  },

  getSubjectProfile(subject) {
    const management = ["Comptabilité de gestion", "Finance", "Fiscalité", "Audit"];
    const humanities = ["Philosophie", "Histoire", "Géographie", "Littérature", "Culture générale"];

    return {
      isManagement: management.includes(subject),
      isHumanities: humanities.includes(subject),
    };
  },

  buildSchema(mainIdea, type) {
    return type.isManagement
      ? `${mainIdea}\n        ↓\n  Données / faits\n   ↙        ↘\nMesure     Analyse\n   \\        /\n   Décision\n        ↓\n Performance`
      : `${mainIdea}\n        ↓\n  Notions clés\n   ↙        ↘\nContexte   Problème\n   \\        /\n Argumentation\n        ↓\n Application`;
  },

  buildRelations(type) {
    return type.isManagement
      ? [
          "Résultat = Revenus - Coûts",
          "Risque augmente quand les charges fixes augmentent",
          "Décision = information fiable + contrainte + objectif",
        ]
      : [
          "Problématique = notion + tension + enjeu",
          "Argument = idée + exemple + analyse",
          "Maîtrise = compréhension + méthode + application",
        ];
  },

  buildCompression(model) {
    return [
      `Fiche courte: ${model.mainIdea} = ${model.keywords.slice(0, 5).join(", ")}`,
      `Synthèse clé: ${model.relations[0]}`,
      `Règle compacte: ${model.rules[0]}`,
      `Application essentielle: ${model.applications[0]}`,
      `Question de révision: comment relier ${model.keywords[0]} à ${model.keywords[1] || "un concept voisin"} ?`,
    ];
  },

  buildReconstruction(type) {
    return [
      "Redessiner le schéma logique de mémoire.",
      "Réexpliquer le cours à voix haute avec la méthode Feynman.",
      "Créer 3 questions: définition, relation, application.",
      "Refaire un exercice ou un mini-cas sans correction.",
      type.isHumanities ? "Faire un plan en 2 ou 3 axes avant d’écrire." : "Vérifier que chaque règle est appuyée par un exemple concret.",
    ];
  },

  buildRules(mainIdea, keywords) {
    return [
      `Toujours partir de l’objectif: pourquoi ${mainIdea} existe ?`,
      `Relier ${keywords[0]} à ${keywords[1] || "un concept voisin"}.`,
      "Transformer chaque définition en exemple concret.",
      "Après chaque exercice, noter l’erreur et la règle oubliée.",
      "Reconstruire le schéma sans regarder le cours.",
    ];
  },

  buildAlerts(keywords, type) {
    return [
      `Point critique: ${keywords[0]} doit être défini sans approximation.`,
      `Risque d’erreur: apprendre ${keywords[1] || "la notion"} sans comprendre ses relations.`,
      type.isHumanities ? "Alerte méthode: éviter le résumé, construire une démonstration." : "Alerte application: toujours interpréter le résultat obtenu.",
    ];
  },

  buildApplications(type) {
    return type.isManagement
      ? ["Calculer un indicateur", "Interpréter la conséquence", "Comparer deux décisions", "Identifier le risque principal"]
      : ["Construire une problématique", "Faire un plan en 2 ou 3 axes", "Analyser un exemple", "Rédiger une conclusion courte"];
  },

  build(subject, title, notes) {
    const keywords = this.extractKeywords(notes, subject);
    const mainIdea = title || keywords[0] || subject;
    const type = this.getSubjectProfile(subject);

    const model = {
      mainIdea,
      keywords,
      type,
      schema: this.buildSchema(mainIdea, type),
      relations: this.buildRelations(type),
      alerts: this.buildAlerts(keywords, type),
      rules: this.buildRules(mainIdea, keywords),
      applications: this.buildApplications(type),
    };

    model.compression = this.buildCompression(model);
    model.reconstruction = this.buildReconstruction(type);
    return model;
  },
};

// Initialize pedagogy engine
const pedagogyEngine = new PedagogyEngine({
  useAI: false, // Can be enabled with API key
  apiKey: null
});

function getCopyCorrection(subject, prompt) {
  const subjectKey = subject.toLowerCase();

  if (subjectKey.includes("philosophie")) {
    return {
      grade: "13/20",
      reading: "La copie présente une problématique identifiable et quelques références pertinentes. L’argumentation reste encore trop linéaire.",
      appreciation: "Bon point de départ. Il faut renforcer la tension du sujet, mieux définir les notions et éviter les exemples seulement illustratifs.",
      plan: [
        "Réécrire l’introduction avec définition des notions, paradoxe et problématique.",
        "Construire chaque partie avec une thèse, un exemple analysé et une limite.",
        "Faire 2 entraînements de problématisation cette semaine.",
      ],
    };
  }

  if (subjectKey.includes("histoire") || subjectKey.includes("géographie")) {
    return {
      grade: "12/20",
      reading: "La copie mobilise des connaissances utiles, mais le plan manque de hiérarchie et certaines transitions restent descriptives.",
      appreciation: "Ensemble sérieux. Pour gagner des points, il faut transformer les connaissances en démonstration structurée.",
      plan: [
        "Reprendre le plan en deux ou trois axes clairement argumentés.",
        "Associer chaque date, notion ou exemple à une idée précise.",
        "S’entraîner sur une introduction et une conclusion par jour pendant 4 jours.",
      ],
    };
  }

  if (subjectKey.includes("littérature")) {
    return {
      grade: "14/20",
      reading: "La copie comprend le texte et repère plusieurs procédés. L’analyse doit aller plus loin dans l’interprétation.",
      appreciation: "Bonne compréhension globale. Le prochain palier consiste à relier systématiquement procédé, effet produit et sens.",
      plan: [
        "Reprendre 3 citations et écrire pour chacune: procédé, effet, interprétation.",
        "Éviter la paraphrase dans les paragraphes d’analyse.",
        "Faire un commentaire guidé en 30 minutes sur un extrait court.",
      ],
    };
  }

  if (subjectKey.includes("droit") || subjectKey.includes("note")) {
    return {
      grade: "11/20",
      reading: "La copie montre une bonne compréhension du sujet, mais la méthode attendue du concours n’est pas encore assez stable.",
      appreciation: "Potentiel réel. Il faut gagner en précision, en structure et en gestion du temps.",
      plan: [
        "Identifier les notions juridiques ou administratives avant de rédiger.",
        "Construire un plan apparent avec titres informatifs.",
        "Faire un exercice court de synthèse documentaire tous les deux jours.",
      ],
    };
  }

  if (subjectKey.includes("culture")) {
    return {
      grade: "12/20",
      reading: "La copie propose des idées intéressantes, mais les références ne sont pas toujours reliées à l’argument principal.",
      appreciation: "Le fond est encourageant. La priorité est de mieux problématiser et d’éviter le catalogue de références.",
      plan: [
        "Formuler une problématique en une phrase avant chaque plan.",
        "Limiter chaque partie à une idée directrice forte.",
        "Créer une fiche de 10 références réutilisables avec leur enjeu.",
      ],
    };
  }

  return {
    grade: "13/20",
    reading: prompt
      ? `Sujet détecté: ${prompt}. La copie semble traiter les notions principales, avec quelques erreurs de méthode à corriger.`
      : "La copie semble traiter les notions principales, avec quelques erreurs de méthode à corriger.",
    appreciation: "Travail encourageant. Les bases sont présentes, mais il faut mieux justifier les étapes et soigner la rédaction.",
    plan: [
      "Reprendre les erreurs une par une et écrire la correction complète.",
      "Faire un exercice similaire sans aide dans les 24 heures.",
      "Créer une fiche méthode sur les points faibles détectés.",
    ],
  };
}

function renderCompleteReport(report) {
  // Stocker le rapport pour les exports
  lastGeneratedReport = report;

  copyResultTitle.textContent = "Rapport Pédagogique Complet";

  // Note principale
  copyGrade.textContent = report.results.grade;

  // Lecture/Analyse détaillée
  copyReading.innerHTML = `
    <strong>Analyse détaillée</strong>
    <div style="margin-top: 10px;">
      <p><strong>Niveau:</strong> ${report.results.level}</p>
      <p><strong>Statut:</strong> ${report.results.status}</p>
      ${report.analysis.errors && report.analysis.errors.length > 0 ? `
        <p><strong>Erreurs détectées:</strong></p>
        <ul>
          ${report.analysis.errors.map(error => `<li>${error.type}: ${error.description}</li>`).join('')}
        </ul>
      ` : ''}
      ${report.analysis.unmasteredConcepts && report.analysis.unmasteredConcepts.length > 0 ? `
        <p><strong>Concepts à retravailler:</strong></p>
        <ul>
          ${report.analysis.unmasteredConcepts.map(concept => `<li>${concept}</li>`).join('')}
        </ul>
      ` : ''}
    </div>
  `;

  // Appréciation pédagogique
  copyFeedback.innerHTML = `
    <strong>Appréciation pédagogique</strong>
    <span>${report.appreciation}</span>
  `;

  // Plan de remédiation détaillé
  supportPlan.innerHTML = `
    <h3>Plan de remédiation personnalisé</h3>
    ${report.remediation.schedule && report.remediation.schedule.length > 0 ? `
      <div style="margin-bottom: 20px;">
        <h4>Planning sur ${report.remediation.duration} jours</h4>
        <ul>
          ${report.remediation.schedule.map(day => `<li><strong>J+${day.day}:</strong> ${day.activities.join(', ')}</li>`).join('')}
        </ul>
      </div>
    ` : ''}
    ${report.progress.axes && report.progress.axes.length > 0 ? `
      <div style="margin-bottom: 20px;">
        <h4>Axes de progression prioritaires</h4>
        <ul>
          ${report.progress.axes.map(axis => `
            <li>
              <strong>${axis.title}</strong> (${axis.priority})
              <br><small>${axis.description}</small>
              ${axis.actions.length > 0 ? `<br><em>Actions: ${axis.actions.join(', ')}</em>` : ''}
            </li>
          `).join('')}
        </ul>
      </div>
    ` : ''}
    ${report.conclusion ? `
      <div style="margin-top: 20px; padding: 15px; background: #f0f8ff; border-radius: 5px;">
        <h4>Conclusion</h4>
        <p><strong>Niveau actuel:</strong> ${report.conclusion.currentLevel}</p>
        <p><strong>Potentiel:</strong> ${report.conclusion.potential}</p>
        <p><strong>Prochaine priorité:</strong> ${report.conclusion.nextPriority}</p>
      </div>
    ` : ''}
  `;

  // Ajouter des boutons d'export
  setTimeout(() => {
    addExportButtons(report);
  }, 100);
}

function addExportButtons(report) {
  // Supprimer les anciens boutons d'export s'ils existent
  const existingExport = document.querySelector('.export-buttons');
  if (existingExport) {
    existingExport.remove();
  }

  // Créer les boutons d'export
  const exportContainer = document.createElement('div');
  exportContainer.className = 'export-buttons';
  exportContainer.style.cssText = 'margin-top: 20px; padding: 15px; background: #f9f9f9; border-radius: 5px; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;';

  // Bouton aperçu
  const previewButton = document.createElement('button');
  previewButton.className = 'secondary-button';
  previewButton.textContent = '👁️ Aperçu';
  previewButton.style.cssText = 'padding: 10px 20px; border: 1px solid #007acc; background: white; color: #007acc; border-radius: 5px; cursor: pointer; font-size: 14px;';
  previewButton.onclick = () => showReportPreview();

  // Bouton PDF
  const pdfButton = document.createElement('button');
  pdfButton.className = 'primary-button';
  pdfButton.textContent = '📄 PDF';
  pdfButton.style.cssText = 'padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;';
  pdfButton.onclick = () => exportReportToPDF();

  // Bouton Word
  const docxButton = document.createElement('button');
  docxButton.className = 'primary-button';
  docxButton.textContent = '📝 Word';
  docxButton.style.cssText = 'padding: 10px 20px; background: #007acc; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;';
  docxButton.onclick = () => exportReportToDOCX();

  exportContainer.appendChild(previewButton);
  exportContainer.appendChild(pdfButton);
  exportContainer.appendChild(docxButton);

  // Ajouter après le plan d'accompagnement
  supportPlan.appendChild(exportContainer);
}

// Fonction de fallback pour l'ancienne logique
function getFallbackCorrection(subject, prompt) {
  return {
    report: {
      results: { grade: "13/20", level: "Moyen", status: "À renforcer" },
      appreciation: "Travail encourageant. Les bases sont présentes, mais il faut mieux justifier les étapes.",
      analysis: {
        errors: [{ type: "erreur de méthode", description: "Quelques imprécisions méthodologiques" }],
        unmasteredConcepts: []
      },
      remediation: {
        duration: 5,
        schedule: [
          { day: 1, activities: ["Reprendre les erreurs"] },
          { day: 2, activities: ["Faire un exercice similaire"] }
        ]
      },
      conclusion: {
        currentLevel: "Moyen",
        potential: "Bon potentiel de progression",
        nextPriority: "Consolider les bases"
      }
    }
  };
}

function renderDiagnostic() {
  const current = activeDiagnosticQuestions[diagStep];
  document.querySelector("#diagIndex").textContent = String(diagStep + 1);
  document.querySelector("#diagTotal").textContent = String(activeDiagnosticQuestions.length);
  document.querySelector("#diagQuestion").textContent = current.question;
  document.querySelector("#diagProgress").style.width = `${((diagStep + 1) / activeDiagnosticQuestions.length) * 100}%`;
  diagSelected = null;

  document.querySelector("#diagAnswers").innerHTML = current.answers
    .map(
      (answer, index) => `
        <button class="answer-option" type="button" data-diag-answer="${index}">
          ${answer}
        </button>
      `,
    )
    .join("");
}

function renderPractice() {
  const current = activePracticeQuestions[practiceStep];
  document.querySelector("#practiceTitle").textContent = current.title;
  document.querySelector("#practiceQuestion").textContent = current.question;
  practiceSelected = null;

  document.querySelector("#practiceAnswers").innerHTML = current.answers
    .map(
      (answer, index) => `
        <button class="answer-option" type="button" data-practice-answer="${index}">
          ${answer}
        </button>
      `,
    )
    .join("");
}

function addError(question, chosenAnswer) {
  const list = document.querySelector("#errorList");
  const item = document.createElement("div");
  item.className = "error-item";
  item.innerHTML = `
    <strong>${question.title}</strong>
    <span>Réponse choisie: ${chosenAnswer}. À revoir avec un exercice similaire.</span>
  `;
  list.prepend(item);
}

function updateFeedback(question, isCorrect) {
  document.querySelector("#feedbackTitle").textContent = isCorrect ? "Bonne réponse" : "Erreur utile repérée";
  document.querySelector("#feedbackText").textContent = question.feedback;
  document.querySelector("#correctionBox").innerHTML = `
    <strong>${isCorrect ? "À retenir" : "Piège fréquent"}</strong>
    <span>${question.trap}</span>
  `;
}

document.querySelectorAll("[data-view], [data-view-trigger]").forEach((button) => {
  button.addEventListener("click", () => {
    setView(button.dataset.view || button.dataset.viewTrigger);
  });
});

loginTab.addEventListener("click", () => setAuthMode("login"));
registerTab.addEventListener("click", () => setAuthMode("register"));

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideAuthNotice();

  if (!supabaseClient) {
    showAuthNotice(getSupabaseSetupError());
    return;
  }

  const credentials = getCredentialsFromForm();
  if (!credentials) return;

  authSubmit.disabled = true;
  authSubmit.textContent = authMode === "register" ? "Creation..." : "Connexion...";

  const response =
    authMode === "register"
      ? await supabaseClient.auth.signUp({
          email: credentials.email,
          password: credentials.password,
          options: {
            data: {
              name: credentials.name,
              level: credentials.level,
            },
          },
        })
      : await supabaseClient.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });

  authSubmit.disabled = false;
  setAuthMode(authMode);

  if (response.error) {
    showAuthNotice(`Erreur Supabase: ${response.error.message}`);
    return;
  }

  if (response.data.session?.user) {
    showApp(mapSupabaseUser(response.data.session.user));
    showToast(authMode === "register" ? "Compte cree. Ton diagnostic est pret." : "Connexion reussie.");
    return;
  }

  showAuthNotice("Compte cree. Verifie tes emails si la confirmation est activee dans Supabase.");
});

googleAuth.addEventListener("click", async () => {
  hideAuthNotice();

  if (!supabaseClient) {
    showAuthNotice(getSupabaseSetupError());
    return;
  }

  const redirectTo = getRedirectUrl();
  if (!redirectTo) {
    showAuthNotice("Google OAuth ne fonctionne pas depuis file://. Lance l'app avec un serveur local, par exemple http://localhost:3000/.");
    return;
  }

  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
  });

  if (error) {
    showAuthNotice(`Erreur Supabase: ${error.message}`);
  }
});

logoutBtn.addEventListener("click", async () => {
  if (supabaseClient) {
    await supabaseClient.auth.signOut();
  }

  authPassword.value = "";
  setAuthMode("login");
  showAuth();
  showToast("Session fermee.");
});

document.querySelector("#diagAnswers").addEventListener("click", (event) => {
  const button = event.target.closest("[data-diag-answer]");
  if (!button) return;

  diagSelected = Number(button.dataset.diagAnswer);
  document.querySelectorAll("[data-diag-answer]").forEach((item) => item.classList.remove("selected"));
  button.classList.add("selected");
});

document.querySelector("#nextDiag").addEventListener("click", () => {
  if (diagSelected === null) {
    showToast("Choisis une réponse pour calibrer ton diagnostic.");
    return;
  }

  if (diagStep < activeDiagnosticQuestions.length - 1) {
    diagStep += 1;
    renderDiagnostic();
    return;
  }

  topics[0].score = 45;
  topics[1].score = 58;
  renderTopics();
  showToast("Diagnostic terminé. Ton plan d’action est prêt.");
  setView("dashboard");
});

document.querySelector("#practiceAnswers").addEventListener("click", (event) => {
  const button = event.target.closest("[data-practice-answer]");
  if (!button) return;

  practiceSelected = Number(button.dataset.practiceAnswer);
  document.querySelectorAll("[data-practice-answer]").forEach((item) => item.classList.remove("selected"));
  button.classList.add("selected");
});

document.querySelector("#submitPractice").addEventListener("click", () => {
  if (practiceSelected === null) {
    showToast("Sélectionne une réponse avant de valider.");
    return;
  }

  const current = activePracticeQuestions[practiceStep];
  const isCorrect = practiceSelected === current.correct;
  answeredCount += 1;

  document.querySelectorAll("[data-practice-answer]").forEach((item) => {
    const index = Number(item.dataset.practiceAnswer);
    item.classList.toggle("correct", index === current.correct);
    item.classList.toggle("wrong", index === practiceSelected && !isCorrect);
  });

  if (isCorrect) {
    correctCount += 1;
    points += 35;
    showToast("Bonne réponse. +35 points.");
  } else {
    addError(current, current.answers[practiceSelected]);
    showToast("Erreur enregistrée. MindPrep t’explique le piège.");
  }

  updateFeedback(current, isCorrect);
  document.querySelector("#sessionScore").textContent = `${correctCount}/${answeredCount}`;
  document.querySelector("#points").textContent = String(points);

  window.setTimeout(() => {
    practiceStep = (practiceStep + 1) % activePracticeQuestions.length;
    renderPractice();
  }, 1200);
});

document.querySelector("#skipQuestion").addEventListener("click", () => {
  practiceStep = (practiceStep + 1) % activePracticeQuestions.length;
  renderPractice();
  showToast("Question passée. La suivante cible toujours tes priorités.");
});

copyFile.addEventListener("change", () => {
  const file = copyFile.files?.[0];
  selectedCopyFile = file || null;

  if (!file) {
    copyPreview.innerHTML = "<span>Aucune copie ajoutée</span>";
    return;
  }

  if (file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      copyPreview.innerHTML = `<img src="${reader.result}" alt="Aperçu de la copie ajoutée" />`;
    });
    reader.readAsDataURL(file);
    showToast("Photo ajoutée. Tu peux lancer la correction.");
    return;
  }

  copyPreview.innerHTML = `
    <div class="correction-box">
      <strong>${file.name}</strong>
      <span>PDF ajouté. La lecture OCR sera traitée par le module IA connecté au backend.</span>
    </div>
  `;
  showToast("Fichier ajouté. Tu peux lancer la correction.");
});

analyzeCopy.addEventListener("click", async () => {
  if (!selectedCopyFile) {
    showToast("Ajoute d'abord une photo ou un PDF de la copie.");
    return;
  }

  // Vérifier l'accès avant de procéder
  const accessCheck = await checkReportAccess('full');
  if (!accessCheck.allowed) {
    showMonetizationModal(accessCheck);
    return;
  }

  analyzeCopy.disabled = true;
  analyzeCopy.textContent = "Analyse en cours...";

  try {
    window.setTimeout(async () => {
      // Simulation du texte de la copie (en réalité, cela viendrait de l'OCR)
      const studentWork = copyPrompt.value.trim() || "Copie d'élève à analyser - contenu simulé pour la démonstration";

      // Informations sur l'élève
      const studentInfo = {
        name: "Élève Exemple",
        class: "Terminale",
        id: "ELEVE001"
      };

      // Informations sur l'exercice
      const exerciseInfo = {
        title: copyPrompt.value.trim() || "Exercice d'application",
        type: "Devoir surveillé",
        date: new Date().toLocaleDateString('fr-FR'),
        estimatedDuration: "45 minutes",
        subject: copySubject.value
      };

      // Analyse et génération du rapport complet
      const result = await pedagogyEngine.analyzeAndReport(studentWork, copySubject.value, exerciseInfo, studentInfo);

      // Consommer l'accès (crédits ou usage)
      await consumeReportAccess('full');

      // Rendu du rapport complet
      renderCompleteReport(result.report);

      analyzeCopy.disabled = false;
      analyzeCopy.textContent = "Lire et corriger la copie";
      showToast("Rapport pédagogique complet généré !");
    }, 700);
  } catch (error) {
    console.error('Erreur lors de l\'analyse:', error);
    // Fallback vers l'ancienne logique
    window.setTimeout(() => {
      const result = getFallbackCorrection(copySubject.value, copyPrompt.value.trim());
      renderCompleteReport(result.report);
      analyzeCopy.disabled = false;
      analyzeCopy.textContent = "Lire et corriger la copie";
      showToast("Rapport généré (mode dégradé).");
    }, 700);
  }
});

loadCourseExample.addEventListener("click", () => {
  const example = courseExamples.guided;
  courseSubject.value = example.subject;
  courseTitle.value = example.title;
  courseNotes.value = example.notes;
  showToast("Exemple guidé chargé. Tu peux générer le cours intelligent.");
});

generateCourse.addEventListener("click", () => {
  const subject = courseSubject.value;
  const title = courseTitle.value.trim();
  const notes = courseNotes.value.trim();

  if (!title && !notes) {
    showToast("Ajoute un titre ou colle un cours à transformer.");
    return;
  }

  generateCourse.disabled = true;
  generateCourse.textContent = "Construction du cours...";

  window.setTimeout(async () => {
    const model = await pedagogyEngine.build(subject, title, notes);
    renderCourse(model, subject, {
      courseOutputTitle,
      criticalAlerts,
      courseOutput,
    });
    generateCourse.disabled = false;
    generateCourse.textContent = "Créer le cours intelligent";
    showToast("Cours intelligent créé avec alertes et plan d'apprentissage.");
  }, 500);
});

document.querySelector("#notifyBtn").addEventListener("click", () => {
  showToast("Rappel intelligent activé pour ta prochaine session de 30 minutes.");
});

document.querySelector("#upgradeInline").addEventListener("click", () => {
  setView("progress");
  document.querySelector("#pricingPanel").scrollIntoView({ behavior: "smooth", block: "center" });
});

document.querySelector("#startTrial").addEventListener("click", () => {
  showToast("Essai Premium lancé dans la maquette. Stripe sera connecté côté backend.");
});

document.querySelector("#proPlan").addEventListener("click", () => {
  showToast("Plan Pro: analytics détaillées, rapports avancés et génération personnalisée.");
});

document.querySelector("#examMode").addEventListener("click", () => {
  showToast("Mode examen prêt: chronométré, sans feedback immédiat.");
});

renderTopics();
renderDiagnostic();
renderPractice();
setAuthMode("login");

async function initializeAuth() {
  if (!supabaseClient) {
    showAuth();
    showAuthNotice(getSupabaseSetupError());
    return;
  }

  const { data, error } = await supabaseClient.auth.getSession();

  if (error) {
    showAuth();
    showAuthNotice(`Erreur Supabase: ${error.message}`);
    return;
  }

  if (data.session?.user) {
    showApp(mapSupabaseUser(data.session.user));
  } else {
    showAuth();
  }

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      showApp(mapSupabaseUser(session.user));
    } else {
      showAuth();
    }
  });
}

initializeAuth();

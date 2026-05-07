/**
 * Billing Orchestrator — couche d'abstraction haut niveau.
 *
 * Rôle :
 *  - Créer une commande / session de paiement à partir d'un produit (plan ou pack crédits).
 *  - Router vers le bon adapter (PayDunya / Stripe / PayPal / Wave Business).
 *  - Recevoir une confirmation (webhook ou bouton « simuler ») et :
 *      • marquer la transaction comme `completed`,
 *      • débloquer les entitlements correspondants (Premium Étudiant, Premium Pro, crédits…),
 *      • alimenter le ledger de revenus pour l'admin.
 *
 * État volontairement en mémoire : compatible aperçu statique (Netlify, file://),
 * et identique au pattern déjà utilisé par PaymentEngine / CheckoutEngine. Aucun
 * appel à localStorage ou IndexedDB n'est introduit.
 */

import { buildDefaultRegistry } from "./providers/index.js";

const PLAN_CATALOG = {
  student: {
    label: "Premium Étudiant",
    type: "subscription",
    durationDays: 30,
    amount: { XOF: 1500, EUR: 2.3 },
    tier: "premium",
    features: [
      "Résumés et analyses illimités",
      "Assistant Sujets illimités (5 niveaux)",
      "Assistant Correction détaillée fond + forme",
      "Progression intelligente et adaptative",
      "Téléchargement PDF / Word",
      "Assistant Coach et conseils stratégiques"
    ]
  },
  teacher: {
    label: "Premium Professeur",
    type: "subscription",
    durationDays: 30,
    amount: { XOF: 5000, EUR: 7.6 },
    tier: "pro",
    features: [
      "Correction massive de copies",
      "Dashboard élèves et statistiques",
      "Génération de devoirs",
      "Suivi pédagogique individualisé",
      "Tous les avantages Premium Étudiant"
    ]
  }
};

const CREDITS_CATALOG = {
  starter: { label: "Pack Découverte", credits: 5, amount: { XOF: 250, EUR: 0.4 } },
  basic: { label: "Pack Étudiant", credits: 12, amount: { XOF: 500, EUR: 0.8 } },
  boost: { label: "Pack Boost examen", credits: 35, amount: { XOF: 1250, EUR: 1.9 } },
  pro: { label: "Pack Concours", credits: 80, amount: { XOF: 2500, EUR: 3.8 } }
};

/**
 * Quel adapter sert quel canal de paiement choisi dans l'UI.
 * Le canal vient de l'attribut data-payment dans index.html.
 */
const CHANNEL_ROUTING = {
  // PayDunya = passerelle principale Sénégal / Afrique de l'Ouest
  "wave": { providerId: "paydunya", channel: "wave-senegal", currency: "XOF" },
  "orange-money": { providerId: "paydunya", channel: "orange-money-senegal", currency: "XOF" },
  "free-money": { providerId: "paydunya", channel: "free-money-senegal", currency: "XOF" },
  "paydunya-card": { providerId: "paydunya", channel: "card", currency: "XOF" },
  // International
  "stripe": { providerId: "stripe", channel: "card-stripe", currency: "EUR" },
  "paypal": { providerId: "paypal", channel: "paypal-account", currency: "EUR" },
  // Préparation Wave Business (direct, sans PayDunya)
  "wave-business": { providerId: "wave-business", channel: "wave-direct", currency: "XOF" }
};

export class BillingOrchestrator {
  constructor(options = {}) {
    this.providers = options.providers || buildDefaultRegistry();
    this.transactions = new Map();   // reference -> transaction
    this.entitlements = new Map();   // userId -> { tier, premiumUntil, credits }
    this.listeners = new Set();
  }

  /** Inscription d'un listener pour les évènements de billing. */
  on(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event) {
    for (const fn of this.listeners) {
      try { fn(event); } catch (_) { /* listener errors must not break flow */ }
    }
  }

  /** Liste les providers connus avec leur état (live ou simulation). */
  describeProviders() {
    return Array.from(this.providers.values()).map((p) => ({
      id: p.id,
      name: p.name,
      isLive: p.isLive(),
      channels: p.channels()
    }));
  }

  /** Catalogue exposé pour l'UI / l'admin. */
  catalog() {
    return { plans: PLAN_CATALOG, credits: CREDITS_CATALOG };
  }

  /**
   * Crée une transaction et délègue au bon provider.
   * @param {Object} input
   * @param {"plan"|"credits"} input.kind
   * @param {string} input.productId - "student"|"teacher"|"starter"|...
   * @param {string} input.method    - clé CHANNEL_ROUTING (data-payment)
   * @param {string} [input.userId]
   * @param {string} [input.email]
   */
  async createPayment(input) {
    const { kind, productId, method, userId = "guest", email = null } = input;
    const route = CHANNEL_ROUTING[method];
    if (!route) {
      return { success: false, error: `Méthode de paiement inconnue : ${method}` };
    }
    const provider = this.providers.get(route.providerId);
    if (!provider) {
      return { success: false, error: `Provider non disponible : ${route.providerId}` };
    }

    const product = kind === "plan" ? PLAN_CATALOG[productId] : CREDITS_CATALOG[productId];
    if (!product) {
      return { success: false, error: `Produit inconnu : ${productId}` };
    }
    const amount = product.amount[route.currency] ?? product.amount.XOF;
    const reference = generateReference(kind, productId);
    const order = {
      reference,
      amount,
      currency: route.currency,
      channel: route.channel,
      description: `MindPrep — ${product.label}`,
      planLabel: product.label,
      plan: kind === "plan" ? productId : null,
      creditsPack: kind === "credits" ? productId : null,
      userId,
      email
    };

    const session = await provider.createSession(order);
    const transaction = {
      reference,
      providerId: provider.id,
      providerName: provider.name,
      method,
      channel: route.channel,
      kind,
      productId,
      productLabel: product.label,
      amount,
      currency: route.currency,
      status: session.status || "pending",
      simulated: !!session.simulated,
      createdAt: new Date().toISOString(),
      userId,
      email,
      session
    };
    this.transactions.set(reference, transaction);
    this.emit({ type: "session.created", transaction });
    return { success: true, transaction };
  }

  /**
   * Confirme un paiement à partir d'un payload (webhook réel ou bouton « simuler »).
   * Retourne la transaction mise à jour et, si succès, les entitlements obtenus.
   */
  async confirmPayment(reference, payload = { status: "completed" }) {
    const tx = this.transactions.get(reference);
    if (!tx) return { success: false, error: "Transaction introuvable" };
    if (tx.status === "completed") {
      return { success: true, transaction: tx, entitlements: this.entitlementsFor(tx.userId), alreadyConfirmed: true };
    }
    const provider = this.providers.get(tx.providerId);
    const verification = provider
      ? await provider.verifyWebhook({ ...payload, reference })
      : { valid: true, status: payload.status || "completed", reference };

    if (!verification.valid) {
      tx.status = "failed";
      tx.failureReason = "Webhook invalide";
      this.emit({ type: "payment.failed", transaction: tx });
      return { success: false, error: "Webhook invalide", transaction: tx };
    }
    if (["completed", "success", "paid"].includes(verification.status)) {
      tx.status = "completed";
      tx.completedAt = new Date().toISOString();
      const ent = this.applyEntitlement(tx);
      this.emit({ type: "payment.completed", transaction: tx, entitlements: ent });
      return { success: true, transaction: tx, entitlements: ent };
    }
    tx.status = verification.status;
    this.emit({ type: "payment.updated", transaction: tx });
    return { success: true, transaction: tx };
  }

  /** Construit l'entitlement à partir d'une transaction confirmée. */
  applyEntitlement(tx) {
    const current = this.entitlements.get(tx.userId) || { tier: "free", premiumUntil: null, credits: 0, history: [] };
    if (tx.kind === "plan") {
      const plan = PLAN_CATALOG[tx.productId];
      if (plan) {
        const baseDate = current.premiumUntil && new Date(current.premiumUntil) > new Date()
          ? new Date(current.premiumUntil)
          : new Date();
        baseDate.setDate(baseDate.getDate() + (plan.durationDays || 30));
        current.tier = plan.tier;
        current.premiumUntil = baseDate.toISOString();
      }
    } else if (tx.kind === "credits") {
      const pack = CREDITS_CATALOG[tx.productId];
      if (pack) current.credits = (current.credits || 0) + pack.credits;
    }
    current.history.push({
      reference: tx.reference,
      productId: tx.productId,
      productLabel: tx.productLabel,
      amount: tx.amount,
      currency: tx.currency,
      provider: tx.providerName,
      at: tx.completedAt
    });
    this.entitlements.set(tx.userId, current);
    return current;
  }

  entitlementsFor(userId) {
    return this.entitlements.get(userId) || { tier: "free", premiumUntil: null, credits: 0, history: [] };
  }

  /** Données pour l'admin : agrégats + transactions. */
  revenueSummary() {
    const txs = Array.from(this.transactions.values());
    const summary = {
      totals: { XOF: 0, EUR: 0 },
      counts: { pending: 0, completed: 0, failed: 0, other: 0 },
      byProvider: {},
      byProduct: {},
      transactions: txs.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
    };
    for (const tx of txs) {
      const bucket = summary.counts[tx.status] != null ? tx.status : "other";
      summary.counts[bucket] += 1;
      if (tx.status === "completed") {
        summary.totals[tx.currency] = (summary.totals[tx.currency] || 0) + tx.amount;
        summary.byProvider[tx.providerName] = (summary.byProvider[tx.providerName] || 0) + 1;
        summary.byProduct[tx.productLabel] = (summary.byProduct[tx.productLabel] || 0) + 1;
      }
    }
    return summary;
  }
}

function generateReference(kind, productId) {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `MP-${kind.toUpperCase()}-${productId.toUpperCase()}-${ts}-${rand}`;
}

export const PAYMENT_CHANNEL_ROUTING = CHANNEL_ROUTING;
export const PLANS = PLAN_CATALOG;
export const CREDITS_PACKS = CREDITS_CATALOG;

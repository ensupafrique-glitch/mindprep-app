/**
 * PayDunya Adapter — passerelle de paiement principale pour le Sénégal et l'Afrique de l'Ouest.
 *
 * Canaux supportés (alignés sur la doc PayDunya) :
 *  - card             → Carte bancaire (Visa / Mastercard) via PayDunya
 *  - wave-senegal     → Wave Sénégal
 *  - orange-money-senegal → Orange Money Sénégal
 *  - free-money-senegal   → Free Money Sénégal
 *
 * Variables d'environnement attendues (à fournir côté serveur, jamais en dur) :
 *  - PAYDUNYA_MASTER_KEY
 *  - PAYDUNYA_PRIVATE_KEY
 *  - PAYDUNYA_PUBLIC_KEY
 *  - PAYDUNYA_TOKEN
 *  - PAYDUNYA_MODE        ("test" ou "live", défaut "test")
 *  - PAYDUNYA_WEBHOOK_URL (URL HTTPS de notre handler de confirmation)
 *
 * Tant qu'au moins une de ces clés manque, l'adapter reste en mode simulation
 * (deterministic local) : aucun appel réseau n'est effectué.
 */

import { BasePaymentProvider, getEnv } from "./base.js";

const ENDPOINTS = {
  test: "https://app.paydunya.com/sandbox-api/v1/checkout-invoice/create",
  live: "https://app.paydunya.com/api/v1/checkout-invoice/create"
};

export class PayDunyaProvider extends BasePaymentProvider {
  constructor(config = {}) {
    super(config);
    this.id = "paydunya";
    this.name = "PayDunya";
    this.mode = getEnv("PAYDUNYA_MODE") || config.mode || "test";
    this.keys = {
      master: getEnv("PAYDUNYA_MASTER_KEY"),
      privateKey: getEnv("PAYDUNYA_PRIVATE_KEY"),
      publicKey: getEnv("PAYDUNYA_PUBLIC_KEY"),
      token: getEnv("PAYDUNYA_TOKEN")
    };
    this.webhookUrl = getEnv("PAYDUNYA_WEBHOOK_URL") || config.webhookUrl || null;
  }

  isLive() {
    return Boolean(this.keys.master && this.keys.privateKey && this.keys.publicKey && this.keys.token);
  }

  channels() {
    return [
      { id: "card", label: "Carte bancaire (PayDunya)", currency: "XOF", icon: "💳" },
      { id: "wave-senegal", label: "Wave Sénégal", currency: "XOF", icon: "🌊" },
      { id: "orange-money-senegal", label: "Orange Money Sénégal", currency: "XOF", icon: "🟠" },
      { id: "free-money-senegal", label: "Free Money Sénégal", currency: "XOF", icon: "💚" }
    ];
  }

  estimateFees(amount, currency = "XOF") {
    const pct = currency === "XOF" ? 0.02 : 0.029;
    const fees = Math.round(amount * pct);
    return { amount, currency, fees, total: amount + fees };
  }

  /**
   * Construit le payload PayDunya pour /checkout-invoice/create.
   * Exposé pour test et pour réutilisation côté serveur.
   */
  buildPayload(order) {
    const channel = order.channel || "card";
    return {
      invoice: {
        total_amount: order.amount,
        description: order.description || `MindPrep — ${order.planLabel || "achat"}`,
        items: order.items || []
      },
      store: { name: "MindPrep" },
      actions: {
        callback_url: this.webhookUrl || "",
        return_url: order.returnUrl || "",
        cancel_url: order.cancelUrl || ""
      },
      custom_data: {
        reference: order.reference,
        channel,
        plan: order.plan || null,
        creditsPack: order.creditsPack || null,
        userId: order.userId || null
      }
    };
  }

  async createSession(order) {
    const payload = this.buildPayload(order);
    if (!this.isLive()) {
      // Mode simulation — aucune requête réseau.
      return {
        provider: this.id,
        reference: order.reference,
        channel: order.channel,
        status: "pending",
        simulated: true,
        paymentUrl: `mindprep://simulate/paydunya/${encodeURIComponent(order.reference)}`,
        instructions: simulatedInstructions(order.channel),
        payload
      };
    }
    // Live mode — placeholder. L'appel réel doit se faire côté serveur, jamais
    // depuis le navigateur, pour ne pas exposer la clé maître.
    return {
      provider: this.id,
      reference: order.reference,
      channel: order.channel,
      status: "pending",
      simulated: false,
      paymentUrl: null,
      instructions: "Appel API PayDunya à effectuer côté serveur (endpoint configuré)",
      endpoint: ENDPOINTS[this.mode] || ENDPOINTS.test,
      payload
    };
  }

  async verifyWebhook(payload /* , headers = {} */) {
    // En production, PayDunya renvoie un hash à valider avec PAYDUNYA_MASTER_KEY.
    // Ici on valide la forme du payload simulé / la présence d'un statut connu.
    if (!payload || typeof payload !== "object") {
      return { valid: false, status: "invalid", reference: null };
    }
    const status = payload.status || (payload.invoice && payload.invoice.status);
    const reference = payload.custom_data?.reference || payload.reference || null;
    const known = ["completed", "success", "pending", "failed", "cancelled"];
    return {
      valid: known.includes(String(status).toLowerCase()),
      status: String(status || "unknown").toLowerCase(),
      reference
    };
  }
}

function simulatedInstructions(channel) {
  switch (channel) {
    case "wave-senegal":
      return "Démo : ouvre Wave, scanne le QR — ici, clique sur « Confirmer paiement (démo) ».";
    case "orange-money-senegal":
      return "Démo : compose #144#, choisis Paiement — ici, clique sur « Confirmer paiement (démo) ».";
    case "free-money-senegal":
      return "Démo : Free Money sur ton espace abonné — ici, clique sur « Confirmer paiement (démo) ».";
    case "card":
    default:
      return "Démo : carte bancaire via PayDunya — ici, clique sur « Confirmer paiement (démo) ».";
  }
}

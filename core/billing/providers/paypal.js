/**
 * PayPal Adapter — paiements internationaux (EUR / USD), comptes PayPal & cartes.
 *
 * Variables d'environnement attendues :
 *  - PAYPAL_CLIENT_ID
 *  - PAYPAL_CLIENT_SECRET
 *  - PAYPAL_MODE  ("sandbox" ou "live", défaut "sandbox")
 *  - PAYPAL_WEBHOOK_ID
 *
 * En l'absence de credentials, l'adapter reste en mode simulation.
 */

import { BasePaymentProvider, getEnv } from "./base.js";

export class PayPalProvider extends BasePaymentProvider {
  constructor(config = {}) {
    super(config);
    this.id = "paypal";
    this.name = "PayPal";
    this.clientId = getEnv("PAYPAL_CLIENT_ID");
    this.clientSecret = getEnv("PAYPAL_CLIENT_SECRET");
    this.mode = getEnv("PAYPAL_MODE") || "sandbox";
    this.webhookId = getEnv("PAYPAL_WEBHOOK_ID");
  }

  isLive() {
    return Boolean(this.clientId && this.clientSecret);
  }

  channels() {
    return [
      { id: "paypal-account", label: "PayPal / Carte bancaire", currency: "EUR", icon: "🅿️" }
    ];
  }

  estimateFees(amount, currency = "EUR") {
    const fees = Math.round((amount * 0.034 + 0.35) * 100) / 100;
    return { amount, currency, fees, total: Math.round((amount + fees) * 100) / 100 };
  }

  async createSession(order) {
    if (!this.isLive()) {
      return {
        provider: this.id,
        reference: order.reference,
        channel: "paypal-account",
        status: "pending",
        simulated: true,
        paymentUrl: `mindprep://simulate/paypal/${encodeURIComponent(order.reference)}`,
        instructions: "Démo : PayPal Checkout — clique sur « Confirmer paiement (démo) »."
      };
    }
    return {
      provider: this.id,
      reference: order.reference,
      channel: "paypal-account",
      status: "pending",
      simulated: false,
      paymentUrl: null,
      instructions: "Création d'order PayPal à effectuer côté serveur via SDK PayPal.",
      endpoint: this.mode === "live"
        ? "https://api-m.paypal.com/v2/checkout/orders"
        : "https://api-m.sandbox.paypal.com/v2/checkout/orders",
      payload: {
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: order.reference,
            amount: {
              currency_code: (order.currency || "EUR").toUpperCase(),
              value: String(order.amount)
            },
            description: order.description || "MindPrep"
          }
        ]
      }
    };
  }

  async verifyWebhook(payload /* , headers = {} */) {
    if (!payload) return { valid: false, status: "invalid", reference: null };
    const type = payload.event_type || payload.type;
    const resource = payload.resource || payload;
    const reference = resource.purchase_units?.[0]?.reference_id || payload.reference || null;
    const status = type === "PAYMENT.CAPTURE.COMPLETED" || resource.status === "COMPLETED"
      ? "completed"
      : (String(resource.status || "pending").toLowerCase());
    return { valid: true, status, reference };
  }
}

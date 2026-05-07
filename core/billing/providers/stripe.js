/**
 * Stripe Adapter — paiements internationaux (EUR / USD), Visa / Mastercard / Amex.
 *
 * Variables d'environnement attendues :
 *  - STRIPE_PUBLISHABLE_KEY (front, ok à exposer)
 *  - STRIPE_SECRET_KEY      (serveur uniquement, JAMAIS dans le navigateur)
 *  - STRIPE_WEBHOOK_SECRET  (serveur uniquement)
 *
 * En l'absence de clé secrète configurée côté serveur, l'adapter reste en mode
 * simulation : aucun appel API n'est effectué.
 */

import { BasePaymentProvider, getEnv } from "./base.js";

export class StripeProvider extends BasePaymentProvider {
  constructor(config = {}) {
    super(config);
    this.id = "stripe";
    this.name = "Stripe";
    this.publishableKey = getEnv("STRIPE_PUBLISHABLE_KEY");
    this.secretKey = getEnv("STRIPE_SECRET_KEY"); // serveur uniquement
    this.webhookSecret = getEnv("STRIPE_WEBHOOK_SECRET");
  }

  isLive() {
    return Boolean(this.secretKey && this.publishableKey);
  }

  channels() {
    return [
      { id: "card-stripe", label: "Carte bancaire (Stripe)", currency: "EUR", icon: "💳" }
    ];
  }

  estimateFees(amount, currency = "EUR") {
    const fees = Math.round((amount * 0.029 + 0.25) * 100) / 100;
    return { amount, currency, fees, total: Math.round((amount + fees) * 100) / 100 };
  }

  async createSession(order) {
    if (!this.isLive()) {
      return {
        provider: this.id,
        reference: order.reference,
        channel: "card-stripe",
        status: "pending",
        simulated: true,
        paymentUrl: `mindprep://simulate/stripe/${encodeURIComponent(order.reference)}`,
        instructions: "Démo : Stripe Checkout — clique sur « Confirmer paiement (démo) »."
      };
    }
    return {
      provider: this.id,
      reference: order.reference,
      channel: "card-stripe",
      status: "pending",
      simulated: false,
      paymentUrl: null,
      instructions: "Création de Checkout Session à effectuer côté serveur via SDK Stripe.",
      endpoint: "https://api.stripe.com/v1/checkout/sessions",
      payload: {
        mode: order.recurring ? "subscription" : "payment",
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: (order.currency || "eur").toLowerCase(),
              unit_amount: Math.round((order.amount || 0) * 100),
              product_data: { name: order.description || "MindPrep" }
            }
          }
        ],
        client_reference_id: order.reference,
        success_url: order.returnUrl || "",
        cancel_url: order.cancelUrl || ""
      }
    };
  }

  async verifyWebhook(payload /* , headers = {} */) {
    if (!payload) return { valid: false, status: "invalid", reference: null };
    const type = payload.type;
    const session = payload.data?.object || payload;
    const reference = session.client_reference_id || payload.reference || null;
    const status = type === "checkout.session.completed" || session.payment_status === "paid"
      ? "completed"
      : (session.status || "pending");
    return { valid: true, status, reference };
  }
}

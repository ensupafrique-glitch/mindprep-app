/**
 * Wave Business Adapter — préparation à l'intégration directe Wave (sans PayDunya).
 *
 * Objectif : à terme, encaisser les paiements Wave Sénégal directement via l'API
 * Wave Business pour réduire les frais et optimiser le règlement local.
 *
 * Variables d'environnement attendues (placeholders) :
 *  - WAVE_BUSINESS_API_KEY
 *  - WAVE_BUSINESS_MERCHANT_ID
 *  - WAVE_BUSINESS_WEBHOOK_SECRET
 *  - WAVE_BUSINESS_BASE_URL  (par défaut https://api.wave.com)
 *
 * Cet adapter est volontairement en mode "préparation" : les appels réels ne
 * seront branchés qu'une fois le compte Wave Business validé.
 */

import { BasePaymentProvider, getEnv } from "./base.js";

export class WaveBusinessProvider extends BasePaymentProvider {
  constructor(config = {}) {
    super(config);
    this.id = "wave-business";
    this.name = "Wave Business";
    this.apiKey = getEnv("WAVE_BUSINESS_API_KEY");
    this.merchantId = getEnv("WAVE_BUSINESS_MERCHANT_ID");
    this.webhookSecret = getEnv("WAVE_BUSINESS_WEBHOOK_SECRET");
    this.baseUrl = getEnv("WAVE_BUSINESS_BASE_URL") || "https://api.wave.com";
  }

  isLive() {
    return Boolean(this.apiKey && this.merchantId);
  }

  channels() {
    return [
      { id: "wave-direct", label: "Wave (direct, à venir)", currency: "XOF", icon: "🌊" }
    ];
  }

  estimateFees(amount, currency = "XOF") {
    const fees = Math.round(amount * 0.01);
    return { amount, currency, fees, total: amount + fees };
  }

  async createSession(order) {
    return {
      provider: this.id,
      reference: order.reference,
      channel: "wave-direct",
      status: "pending",
      simulated: true,
      paymentUrl: `mindprep://simulate/wave-business/${encodeURIComponent(order.reference)}`,
      instructions: this.isLive()
        ? "Wave Business configuré : finaliser l'intégration de l'endpoint /v1/checkout/sessions côté serveur."
        : "Préparation : Wave Business non encore branché. Garder PayDunya comme route Wave en attendant."
    };
  }

  async verifyWebhook(payload /* , headers = {} */) {
    if (!payload) return { valid: false, status: "invalid", reference: null };
    const reference = payload.client_reference || payload.reference || null;
    const status = payload.status || (payload.checkout_status === "completed" ? "completed" : "pending");
    return { valid: true, status: String(status).toLowerCase(), reference };
  }
}

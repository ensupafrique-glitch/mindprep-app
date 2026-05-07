/**
 * Base Payment Provider — contrat commun pour tous les adapters
 * (PayDunya, Stripe, PayPal, Wave Business…).
 *
 * Aucune clé API n'est codée en dur. Chaque adapter lit ses identifiants
 * via window.MINDPREP_CONFIG (front) ou process.env (back), et reste en
 * mode "simulation" (deterministic local) tant qu'aucune clé n'est fournie.
 *
 * Cette interface est volontairement minimale et stable, pour pouvoir
 * brancher de vrais SDK plus tard sans casser l'orchestrator.
 */

export function getEnv(key) {
  if (typeof process !== "undefined" && process.env && process.env[key] != null) {
    return process.env[key];
  }
  if (typeof window !== "undefined" && window.MINDPREP_CONFIG && window.MINDPREP_CONFIG[key] != null) {
    return window.MINDPREP_CONFIG[key];
  }
  return null;
}

export class BasePaymentProvider {
  constructor(config = {}) {
    this.id = "base";
    this.name = "Base provider";
    this.config = config;
  }

  /** Indique si l'adapter est branché à un vrai gateway (clés présentes). */
  isLive() {
    return false;
  }

  /** Liste des canaux/méthodes supportés par ce provider. */
  channels() {
    return [];
  }

  /**
   * Crée une session de paiement chez le provider.
   * En simulation : retourne une référence locale et une URL fictive.
   * En live : devra appeler l'API du provider et renvoyer son URL de redirection.
   */
  // eslint-disable-next-line no-unused-vars
  async createSession(order) {
    throw new Error("createSession() must be implemented by subclass");
  }

  /**
   * Vérifie / parse un payload webhook. Retourne {valid, status, reference}.
   * En simulation : valide un payload local pré-formé par l'orchestrator.
   */
  // eslint-disable-next-line no-unused-vars
  async verifyWebhook(payload, headers = {}) {
    return { valid: !!payload, status: payload?.status || "unknown", reference: payload?.reference || null };
  }

  /** Frais estimés pour information à l'utilisateur (purement indicatif). */
  estimateFees(amount, currency) {
    return { amount, currency, fees: 0, total: amount };
  }
}

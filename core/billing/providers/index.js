/**
 * Registry des providers de paiement disponibles.
 */

import { PayDunyaProvider } from "./paydunya.js";
import { StripeProvider } from "./stripe.js";
import { PayPalProvider } from "./paypal.js";
import { WaveBusinessProvider } from "./wave-business.js";

export { BasePaymentProvider, getEnv } from "./base.js";
export { PayDunyaProvider, StripeProvider, PayPalProvider, WaveBusinessProvider };

/**
 * Construit le registry par défaut des providers.
 * @returns {Map<string, import("./base.js").BasePaymentProvider>}
 */
export function buildDefaultRegistry() {
  const registry = new Map();
  const providers = [
    new PayDunyaProvider(),
    new StripeProvider(),
    new PayPalProvider(),
    new WaveBusinessProvider()
  ];
  for (const p of providers) registry.set(p.id, p);
  return registry;
}

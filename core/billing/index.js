/**
 * Billing Module - Module de monétisation MindPrep
 * Point d'entrée pour tous les moteurs de facturation
 */

export { PricingEngine } from './pricing-engine.js';
export { PaymentEngine } from './payment-engine.js';
export { CheckoutEngine } from './checkout-engine.js';
export { AccessEngine } from './access-engine.js';
export { InvoiceEngine } from './invoice-engine.js';

// Configuration globale du module
export const BILLING_CONFIG = {
    defaultCurrency: 'XOF',
    taxRate: 0.18, // TVA Sénégal
    supportedCountries: ['SN', 'CI', 'ML', 'GN', 'BF'],
    freeTierLimits: {
        reportsPerMonth: 3,
        storageGB: 1,
        apiCallsPerMonth: 0
    },
    trialPeriodDays: 14
};

// Utilitaires partagés
export class BillingUtils {
    /**
     * Formate un montant avec devise
     * @param {number} amount - Montant
     * @param {string} currency - Devise
     * @returns {string} - Montant formaté
     */
    static formatCurrency(amount, currency = BILLING_CONFIG.defaultCurrency) {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0
        }).format(amount);
    }

    /**
     * Calcule le prix avec remise
     * @param {number} basePrice - Prix de base
     * @param {number} discountPercentage - Pourcentage de remise
     * @returns {Object} - Prix calculé
     */
    static calculateDiscountedPrice(basePrice, discountPercentage) {
        const discountAmount = Math.round(basePrice * discountPercentage / 100);
        const discountedPrice = basePrice - discountAmount;

        return {
            original: basePrice,
            discounted: discountedPrice,
            discount: discountAmount,
            percentage: discountPercentage
        };
    }

    /**
     * Vérifie si un pays est supporté
     * @param {string} countryCode - Code pays
     * @returns {boolean} - Supporté ou non
     */
    static isCountrySupported(countryCode) {
        return BILLING_CONFIG.supportedCountries.includes(countryCode);
    }

    /**
     * Obtient les informations de devise par pays
     * @param {string} countryCode - Code pays
     * @returns {Object} - Informations devise
     */
    static getCurrencyByCountry(countryCode) {
        const currencyMap = {
            'SN': { code: 'XOF', symbol: 'CFA', name: 'Franc CFA' },
            'CI': { code: 'XOF', symbol: 'CFA', name: 'Franc CFA' },
            'ML': { code: 'XOF', symbol: 'CFA', name: 'Franc CFA' },
            'GN': { code: 'XOF', symbol: 'CFA', name: 'Franc CFA' },
            'BF': { code: 'XOF', symbol: 'CFA', name: 'Franc CFA' }
        };

        return currencyMap[countryCode] || currencyMap['SN'];
    }

    /**
     * Génère un ID unique
     * @param {string} prefix - Préfixe optionnel
     * @returns {string} - ID unique
     */
    static generateId(prefix = '') {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `${prefix}${timestamp}_${random}`;
    }

    /**
     * Valide une adresse email
     * @param {string} email - Email à valider
     * @returns {boolean} - Email valide
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Formate une date pour l'affichage
     * @param {string|Date} date - Date à formater
     * @returns {string} - Date formatée
     */
    static formatDate(date) {
        const d = new Date(date);
        return d.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Calcule le nombre de jours entre deux dates
     * @param {string|Date} startDate - Date de début
     * @param {string|Date} endDate - Date de fin
     * @returns {number} - Nombre de jours
     */
    static daysBetween(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
}
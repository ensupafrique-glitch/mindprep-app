/**
 * Checkout Engine - Moteur de processus de paiement
 * Gère l'expérience utilisateur du checkout et l'intégration avec les providers
 */

import { PricingEngine } from './pricing-engine.js';
import { PaymentEngine } from './payment-engine.js';

export class CheckoutEngine {
    constructor() {
        this.pricingEngine = new PricingEngine();
        this.paymentEngine = new PaymentEngine();
        this.checkoutSessions = new Map();
    }

    /**
     * Crée une session de checkout
     * @param {Object} checkoutData - Données du checkout
     * @returns {Object} - Session de checkout
     */
    async createCheckoutSession(checkoutData) {
        const {
            userId,
            items,
            customerInfo,
            successUrl,
            cancelUrl,
            metadata = {}
        } = checkoutData;

        // Validation des données
        const validation = this.validateCheckoutData(checkoutData);
        if (!validation.valid) {
            return {
                success: false,
                error: validation.error,
                code: 'VALIDATION_ERROR'
            };
        }

        // Calculer le total
        const calculation = this.calculateCheckoutTotal(items);

        // Générer un ID de session unique
        const sessionId = this.generateSessionId();

        // Créer la session
        const session = {
            id: sessionId,
            userId,
            items,
            customerInfo,
            total: calculation.total,
            currency: calculation.currency,
            status: 'pending',
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 heure
            successUrl,
            cancelUrl,
            metadata,
            paymentMethods: this.getAvailablePaymentMethods(customerInfo.country || 'SN')
        };

        // Stocker la session
        this.checkoutSessions.set(sessionId, session);

        return {
            success: true,
            sessionId,
            session: {
                id: sessionId,
                total: calculation.total,
                currency: calculation.currency,
                items: calculation.breakdown,
                paymentMethods: session.paymentMethods,
                expiresAt: session.expiresAt
            }
        };
    }

    /**
     * Valide les données de checkout
     * @param {Object} data - Données à valider
     * @returns {Object} - Résultat de validation
     */
    validateCheckoutData(data) {
        const { userId, items, customerInfo } = data;

        if (!userId) {
            return { valid: false, error: 'ID utilisateur requis' };
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return { valid: false, error: 'Au moins un article requis' };
        }

        if (!customerInfo || !customerInfo.email) {
            return { valid: false, error: 'Informations client requises' };
        }

        // Valider chaque item
        for (const item of items) {
            if (!item.type || !item.quantity) {
                return { valid: false, error: 'Données d\'article incomplètes' };
            }
        }

        return { valid: true };
    }

    /**
     * Calcule le total du checkout
     * @param {Array} items - Articles du panier
     * @returns {Object} - Calcul du total
     */
    calculateCheckoutTotal(items) {
        let total = 0;
        const currency = 'XOF';
        const breakdown = [];

        for (const item of items) {
            let itemTotal = 0;

            switch (item.type) {
                case 'report':
                    const reportPricing = this.pricingEngine.calculateBulkPrice(
                        item.quantity,
                        item.reportType || 'full'
                    );
                    itemTotal = reportPricing.totalWithDiscount;
                    breakdown.push({
                        type: 'report',
                        description: `${item.quantity} rapport(s) ${item.reportType || 'complet'}`,
                        quantity: item.quantity,
                        unitPrice: reportPricing.pricePerUnit,
                        total: itemTotal,
                        discount: reportPricing.discountAmount > 0 ? {
                            amount: reportPricing.discountAmount,
                            percentage: reportPricing.discountPercentage
                        } : null
                    });
                    break;

                case 'subscription':
                    const tierPricing = this.pricingEngine.getTierPricing(item.tier);
                    itemTotal = tierPricing.price;
                    if (item.billingCycle === 'annual') {
                        const annualPrice = itemTotal * 12;
                        const discount = this.pricingEngine.calculateDiscountedPrice(annualPrice, 'annual');
                        itemTotal = discount.discounted;
                        breakdown.push({
                            type: 'subscription',
                            description: `Abonnement ${tierPricing.name} annuel`,
                            quantity: 1,
                            unitPrice: itemTotal,
                            total: itemTotal,
                            discount: discount.discount > 0 ? {
                                amount: discount.discount,
                                percentage: discount.percentage,
                                description: discount.description
                            } : null
                        });
                    } else {
                        breakdown.push({
                            type: 'subscription',
                            description: `Abonnement ${tierPricing.name} mensuel`,
                            quantity: 1,
                            unitPrice: itemTotal,
                            total: itemTotal
                        });
                    }
                    break;

                case 'promo':
                    // Les codes promo sont traités séparément
                    continue;

                default:
                    return {
                        success: false,
                        error: `Type d'article non supporté: ${item.type}`
                    };
            }

            total += itemTotal;
        }

        return {
            total,
            currency,
            breakdown
        };
    }

    /**
     * Initie le paiement pour une session de checkout
     * @param {string} sessionId - ID de session
     * @param {string} paymentMethod - Méthode de paiement
     * @returns {Object} - Résultat de l'initiation
     */
    async initiatePayment(sessionId, paymentMethod) {
        const session = this.checkoutSessions.get(sessionId);

        if (!session) {
            return {
                success: false,
                error: 'Session de checkout introuvable',
                code: 'SESSION_NOT_FOUND'
            };
        }

        if (session.status !== 'pending') {
            return {
                success: false,
                error: 'Session expirée ou déjà traitée',
                code: 'INVALID_SESSION_STATUS'
            };
        }

        // Vérifier que la méthode de paiement est disponible
        if (!session.paymentMethods.find(pm => pm.id === paymentMethod)) {
            return {
                success: false,
                error: 'Méthode de paiement non disponible',
                code: 'PAYMENT_METHOD_UNAVAILABLE'
            };
        }

        // Calculer les frais de paiement
        const paymentCost = this.paymentEngine.calculateTotalCost(
            paymentMethod,
            session.total,
            session.currency
        );

        // Créer les données de paiement
        const paymentData = {
            provider: paymentMethod,
            amount: session.total,
            currency: session.currency,
            description: `Checkout MindPrep - Session ${sessionId}`,
            customerInfo: session.customerInfo,
            metadata: {
                sessionId,
                userId: session.userId,
                items: session.items
            }
        };

        // Initialiser le paiement
        const paymentResult = await this.paymentEngine.initializePayment(paymentData);

        if (paymentResult.success) {
            // Mettre à jour la session
            session.status = 'payment_pending';
            session.paymentId = paymentResult.transactionId;
            session.paymentMethod = paymentMethod;
            session.paymentUrl = paymentResult.paymentUrl;
            session.qrCode = paymentResult.qrCode;
            session.paymentInstructions = paymentResult.instructions;
            session.fees = paymentCost.fees;

            return {
                success: true,
                sessionId,
                paymentId: paymentResult.transactionId,
                paymentUrl: paymentResult.paymentUrl,
                qrCode: paymentResult.qrCode,
                instructions: paymentResult.instructions,
                totalWithFees: paymentCost.total,
                fees: paymentCost.fees,
                expiresAt: paymentResult.expiresAt
            };
        } else {
            return {
                success: false,
                error: paymentResult.error,
                code: paymentResult.code
            };
        }
    }

    /**
     * Traite le succès d'un paiement
     * @param {string} sessionId - ID de session
     * @param {string} paymentId - ID de paiement
     * @returns {Object} - Résultat du traitement
     */
    async processPaymentSuccess(sessionId, paymentId) {
        const session = this.checkoutSessions.get(sessionId);

        if (!session) {
            return {
                success: false,
                error: 'Session introuvable',
                code: 'SESSION_NOT_FOUND'
            };
        }

        // Vérifier le statut du paiement
        const paymentStatus = await this.paymentEngine.checkPaymentStatus(paymentId);

        if (!paymentStatus.success || paymentStatus.status !== 'completed') {
            return {
                success: false,
                error: 'Paiement non confirmé',
                code: 'PAYMENT_NOT_CONFIRMED'
            };
        }

        // Mettre à jour la session
        session.status = 'completed';
        session.completedAt = new Date().toISOString();
        session.paymentStatus = 'completed';

        // Traiter les articles achetés
        const processedItems = await this.processPurchasedItems(session);

        return {
            success: true,
            sessionId,
            items: processedItems,
            redirectUrl: session.successUrl,
            customerInfo: session.customerInfo
        };
    }

    /**
     * Traite l'échec d'un paiement
     * @param {string} sessionId - ID de session
     * @param {string} reason - Raison de l'échec
     * @returns {Object} - Résultat du traitement
     */
    async processPaymentFailure(sessionId, reason = 'Paiement annulé') {
        const session = this.checkoutSessions.get(sessionId);

        if (!session) {
            return {
                success: false,
                error: 'Session introuvable',
                code: 'SESSION_NOT_FOUND'
            };
        }

        // Mettre à jour la session
        session.status = 'failed';
        session.failedAt = new Date().toISOString();
        session.failureReason = reason;

        return {
            success: true,
            sessionId,
            redirectUrl: session.cancelUrl,
            reason: reason
        };
    }

    /**
     * Traite les articles achetés
     * @param {Object} session - Session de checkout
     * @returns {Array} - Articles traités
     */
    async processPurchasedItems(session) {
        const processedItems = [];

        for (const item of session.items) {
            switch (item.type) {
                case 'report':
                    processedItems.push({
                        type: 'report_credits',
                        quantity: item.quantity,
                        reportType: item.reportType || 'full',
                        description: `${item.quantity} crédit(s) de rapport ${item.reportType || 'complet'}`
                    });
                    break;

                case 'subscription':
                    processedItems.push({
                        type: 'subscription',
                        tier: item.tier,
                        billingCycle: item.billingCycle || 'monthly',
                        description: `Abonnement ${item.tier} ${item.billingCycle || 'mensuel'}`
                    });
                    break;
            }
        }

        return processedItems;
    }

    /**
     * Obtient les méthodes de paiement disponibles
     * @param {string} countryCode - Code pays
     * @returns {Array} - Méthodes de paiement
     */
    getAvailablePaymentMethods(countryCode = 'SN') {
        return this.paymentEngine.getAvailableProviders(countryCode);
    }

    /**
     * Génère un ID de session unique
     * @returns {string} - ID unique
     */
    generateSessionId() {
        return `CHK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Obtient le statut d'une session de checkout
     * @param {string} sessionId - ID de session
     * @returns {Object} - Statut de la session
     */
    getCheckoutStatus(sessionId) {
        const session = this.checkoutSessions.get(sessionId);

        if (!session) {
            return {
                success: false,
                error: 'Session introuvable',
                code: 'SESSION_NOT_FOUND'
            };
        }

        return {
            success: true,
            sessionId,
            status: session.status,
            total: session.total,
            currency: session.currency,
            createdAt: session.createdAt,
            expiresAt: session.expiresAt,
            paymentMethod: session.paymentMethod,
            paymentStatus: session.paymentStatus
        };
    }

    /**
     * Annule une session de checkout
     * @param {string} sessionId - ID de session
     * @returns {Object} - Résultat de l'annulation
     */
    cancelCheckoutSession(sessionId) {
        const session = this.checkoutSessions.get(sessionId);

        if (!session) {
            return {
                success: false,
                error: 'Session introuvable',
                code: 'SESSION_NOT_FOUND'
            };
        }

        if (session.status !== 'pending' && session.status !== 'payment_pending') {
            return {
                success: false,
                error: 'Session ne peut pas être annulée',
                code: 'CANNOT_CANCEL'
            };
        }

        session.status = 'cancelled';
        session.cancelledAt = new Date().toISOString();

        return {
            success: true,
            sessionId,
            status: 'cancelled'
        };
    }

    /**
     * Nettoie les sessions expirées
     */
    cleanupExpiredSessions() {
        const now = new Date();

        for (const [sessionId, session] of this.checkoutSessions.entries()) {
            const expiresAt = new Date(session.expiresAt);

            if (now > expiresAt && session.status === 'pending') {
                session.status = 'expired';
                session.expiredAt = now.toISOString();
            }
        }
    }

    /**
     * Crée un checkout rapide pour un rapport unique
     * @param {Object} data - Données du checkout rapide
     * @returns {Object} - Session de checkout rapide
     */
    async createQuickCheckout(data) {
        const { userId, reportType = 'full', quantity = 1, customerInfo } = data;

        const checkoutData = {
            userId,
            items: [{
                type: 'report',
                reportType,
                quantity
            }],
            customerInfo,
            successUrl: `${window.location.origin}/payment/success`,
            cancelUrl: `${window.location.origin}/payment/cancel`,
            metadata: {
                quickCheckout: true,
                source: 'report_generation'
            }
        };

        return await this.createCheckoutSession(checkoutData);
    }

    /**
     * Calcule les économies pour différentes options
     * @param {Object} options - Options à comparer
     * @returns {Object} - Comparaison des économies
     */
    calculateSavingsComparison(options) {
        const { quantity = 1, reportType = 'full' } = options;

        const payPerUse = this.pricingEngine.calculateBulkPrice(quantity, reportType);
        const subscriptionTiers = ['basic', 'premium', 'pro'];

        const comparisons = subscriptionTiers.map(tier => {
            const tierData = this.pricingEngine.getTierPricing(tier);
            const monthlySavings = payPerUse.totalWithDiscount - tierData.price;

            return {
                tier,
                name: tierData.name,
                monthlyPrice: tierData.price,
                payPerUseCost: payPerUse.totalWithDiscount,
                monthlySavings: Math.max(0, monthlySavings),
                breakEvenMonths: monthlySavings > 0 ?
                    Math.ceil(payPerUse.totalWithDiscount / monthlySavings) : null,
                recommended: this.shouldRecommendTier(tier, quantity, reportType)
            };
        });

        return {
            payPerUse: payPerUse,
            subscriptions: comparisons,
            recommendedTier: comparisons.find(c => c.recommended)?.tier || 'payPerUse'
        };
    }

    /**
     * Détermine si un tier d'abonnement est recommandé
     * @param {string} tier - Tier à évaluer
     * @param {number} quantity - Quantité de rapports
     * @param {string} reportType - Type de rapport
     * @returns {boolean} - Recommandation
     */
    shouldRecommendTier(tier, quantity, reportType) {
        const tierData = this.pricingEngine.getTierPricing(tier);

        // Recommander si l'usage mensuel dépasse les limites du free
        const monthlyUsage = quantity * 4; // Estimation sur un mois
        return monthlyUsage > tierData.limits.reportsPerMonth;
    }
}
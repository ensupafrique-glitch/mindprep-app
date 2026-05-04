/**
 * Access Engine - Moteur de contrôle d'accès
 * Gère les permissions et limitations selon les abonnements utilisateur
 */

import { PricingEngine } from './pricing-engine.js';

export class AccessEngine {
    constructor() {
        this.pricingEngine = new PricingEngine();
        this.userSubscriptions = new Map(); // En mémoire pour la démo
        this.userCredits = new Map(); // Crédits de rapports
        this.usageTracking = new Map(); // Suivi de l'usage mensuel
    }

    /**
     * Vérifie si un utilisateur peut accéder à une fonctionnalité
     * @param {string} userId - ID utilisateur
     * @param {string} feature - Fonctionnalité demandée
     * @param {Object} context - Contexte d'usage
     * @returns {Object} - Résultat de vérification
     */
    async checkFeatureAccess(userId, feature, context = {}) {
        const userTier = await this.getUserTier(userId);
        const tierData = this.pricingEngine.getTierPricing(userTier);

        // Vérifier l'accès selon le tier
        const accessResult = this.evaluateFeatureAccess(feature, tierData, context);

        if (!accessResult.allowed) {
            return {
                allowed: false,
                reason: accessResult.reason,
                upgradeRequired: accessResult.upgradeRequired,
                upgradeOptions: this.getUpgradeOptions(userTier, feature),
                limits: tierData.limits
            };
        }

        // Vérifier les limites d'usage
        const usageCheck = await this.checkUsageLimits(userId, feature, tierData);

        if (!usageCheck.allowed) {
            return {
                allowed: false,
                reason: usageCheck.reason,
                upgradeRequired: true,
                upgradeOptions: this.getUpgradeOptions(userTier, feature),
                limits: tierData.limits,
                currentUsage: usageCheck.currentUsage
            };
        }

        return {
            allowed: true,
            tier: userTier,
            limits: tierData.limits,
            remainingUsage: usageCheck.remainingUsage
        };
    }

    /**
     * Évalue l'accès à une fonctionnalité selon le tier
     * @param {string} feature - Fonctionnalité
     * @param {Object} tierData - Données du tier
     * @param {Object} context - Contexte
     * @returns {Object} - Résultat d'évaluation
     */
    evaluateFeatureAccess(feature, tierData, context) {
        const featureRules = {
            // Rapports pédagogiques
            'report.generate': {
                free: { allowed: true, limited: true },
                basic: { allowed: true, limited: true },
                premium: { allowed: true, limited: false },
                pro: { allowed: true, limited: false }
            },
            'report.export.pdf': {
                free: { allowed: false },
                basic: { allowed: true },
                premium: { allowed: true },
                pro: { allowed: true }
            },
            'report.export.docx': {
                free: { allowed: false },
                basic: { allowed: false },
                premium: { allowed: true },
                pro: { allowed: true }
            },
            'report.advanced.analysis': {
                free: { allowed: false },
                basic: { allowed: false },
                premium: { allowed: true },
                pro: { allowed: true }
            },
            'report.custom.template': {
                free: { allowed: false },
                basic: { allowed: false },
                premium: { allowed: false },
                pro: { allowed: true }
            },

            // Stockage et historique
            'storage.unlimited': {
                free: { allowed: false },
                basic: { allowed: false },
                premium: { allowed: true },
                pro: { allowed: true }
            },
            'history.extended': {
                free: { allowed: false },
                basic: { allowed: true },
                premium: { allowed: true },
                pro: { allowed: true }
            },

            // Support
            'support.priority': {
                free: { allowed: false },
                basic: { allowed: false },
                premium: { allowed: true },
                pro: { allowed: true }
            },
            'support.dedicated': {
                free: { allowed: false },
                basic: { allowed: false },
                premium: { allowed: false },
                pro: { allowed: true }
            },

            // API et intégrations
            'api.access': {
                free: { allowed: false },
                basic: { allowed: false },
                premium: { allowed: true },
                pro: { allowed: true }
            },
            'api.unlimited': {
                free: { allowed: false },
                basic: { allowed: false },
                premium: { allowed: false },
                pro: { allowed: true }
            },

            // Fonctionnalités avancées
            'ai.enhanced.feedback': {
                free: { allowed: false },
                basic: { allowed: false },
                premium: { allowed: true },
                pro: { allowed: true }
            },
            'analytics.detailed': {
                free: { allowed: false },
                basic: { allowed: false },
                premium: { allowed: true },
                pro: { allowed: true }
            },
            'collaboration.team': {
                free: { allowed: false },
                basic: { allowed: false },
                premium: { allowed: false },
                pro: { allowed: true }
            }
        };

        const rule = featureRules[feature];
        if (!rule) {
            return { allowed: false, reason: 'Fonctionnalité inconnue' };
        }

        const tierRule = rule[tierData.id];
        if (!tierRule || !tierRule.allowed) {
            return {
                allowed: false,
                reason: `Fonctionnalité non disponible pour le tier ${tierData.name}`,
                upgradeRequired: true
            };
        }

        return { allowed: true };
    }

    /**
     * Vérifie les limites d'usage
     * @param {string} userId - ID utilisateur
     * @param {string} feature - Fonctionnalité
     * @param {Object} tierData - Données du tier
     * @returns {Object} - Résultat de vérification
     */
    async checkUsageLimits(userId, feature, tierData) {
        const currentUsage = await this.getCurrentUsage(userId, feature);
        const limits = tierData.limits;

        // Déterminer la limite selon la fonctionnalité
        let limit;
        switch (feature) {
            case 'report.generate':
                limit = limits.reportsPerMonth;
                break;
            case 'api.access':
                limit = limits.apiCallsPerMonth;
                break;
            case 'storage.unlimited':
                limit = limits.storageGB;
                break;
            default:
                return { allowed: true }; // Pas de limite spécifique
        }

        if (currentUsage >= limit) {
            return {
                allowed: false,
                reason: `Limite mensuelle atteinte (${currentUsage}/${limit})`,
                currentUsage,
                limit
            };
        }

        return {
            allowed: true,
            currentUsage,
            remainingUsage: limit - currentUsage
        };
    }

    /**
     * Obtient l'usage actuel d'un utilisateur
     * @param {string} userId - ID utilisateur
     * @param {string} feature - Fonctionnalité
     * @returns {number} - Usage actuel
     */
    async getCurrentUsage(userId, feature) {
        const userUsage = this.usageTracking.get(userId) || {};
        const featureUsage = userUsage[feature] || {};

        // Calculer l'usage du mois en cours
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        return featureUsage[currentMonth] || 0;
    }

    /**
     * Enregistre l'usage d'une fonctionnalité
     * @param {string} userId - ID utilisateur
     * @param {string} feature - Fonctionnalité
     * @param {number} quantity - Quantité utilisée (défaut: 1)
     */
    async recordUsage(userId, feature, quantity = 1) {
        const userUsage = this.usageTracking.get(userId) || {};
        const featureUsage = userUsage[feature] || {};

        const currentMonth = new Date().toISOString().slice(0, 7);
        featureUsage[currentMonth] = (featureUsage[currentMonth] || 0) + quantity;

        userUsage[feature] = featureUsage;
        this.usageTracking.set(userId, userUsage);
    }

    /**
     * Obtient le tier d'un utilisateur
     * @param {string} userId - ID utilisateur
     * @returns {string} - Tier de l'utilisateur
     */
    async getUserTier(userId) {
        const subscription = this.userSubscriptions.get(userId);

        if (!subscription) {
            return 'free'; // Par défaut gratuit
        }

        if (subscription.status !== 'active') {
            return 'free';
        }

        // Vérifier si l'abonnement est expiré
        if (subscription.endDate && new Date(subscription.endDate) < new Date()) {
            subscription.status = 'expired';
            return 'free';
        }

        return subscription.tier;
    }

    /**
     * Définit l'abonnement d'un utilisateur
     * @param {string} userId - ID utilisateur
     * @param {Object} subscriptionData - Données d'abonnement
     */
    async setUserSubscription(userId, subscriptionData) {
        const { tier, billingCycle = 'monthly', startDate, endDate, status = 'active' } = subscriptionData;

        this.userSubscriptions.set(userId, {
            tier,
            billingCycle,
            startDate: startDate || new Date().toISOString(),
            endDate,
            status,
            createdAt: new Date().toISOString()
        });
    }

    /**
     * Ajoute des crédits de rapport à un utilisateur
     * @param {string} userId - ID utilisateur
     * @param {number} credits - Nombre de crédits
     * @param {string} type - Type de rapport (optionnel)
     */
    async addReportCredits(userId, credits, type = 'full') {
        const userCredits = this.userCredits.get(userId) || {};
        userCredits[type] = (userCredits[type] || 0) + credits;
        this.userCredits.set(userId, userCredits);
    }

    /**
     * Utilise un crédit de rapport
     * @param {string} userId - ID utilisateur
     * @param {string} type - Type de rapport
     * @returns {boolean} - Succès de l'utilisation
     */
    async useReportCredit(userId, type = 'full') {
        const userCredits = this.userCredits.get(userId) || {};
        const currentCredits = userCredits[type] || 0;

        if (currentCredits <= 0) {
            return false;
        }

        userCredits[type] = currentCredits - 1;
        this.userCredits.set(userId, userCredits);
        return true;
    }

    /**
     * Obtient les crédits disponibles d'un utilisateur
     * @param {string} userId - ID utilisateur
     * @returns {Object} - Crédits par type
     */
    async getUserCredits(userId) {
        return this.userCredits.get(userId) || {};
    }

    /**
     * Vérifie si un utilisateur peut générer un rapport
     * @param {string} userId - ID utilisateur
     * @param {string} reportType - Type de rapport
     * @returns {Object} - Résultat de vérification
     */
    async canGenerateReport(userId, reportType = 'full') {
        const tier = await this.getUserTier(userId);
        const tierData = this.pricingEngine.getTierPricing(tier);

        // Vérifier les crédits d'abord
        const credits = await this.getUserCredits(userId);
        if (credits[reportType] > 0) {
            return {
                allowed: true,
                source: 'credits',
                remainingCredits: credits[reportType]
            };
        }

        // Vérifier l'accès au tier
        const accessCheck = await this.checkFeatureAccess(userId, 'report.generate');

        if (!accessCheck.allowed) {
            return {
                allowed: false,
                reason: accessCheck.reason,
                upgradeRequired: accessCheck.upgradeRequired,
                upgradeOptions: accessCheck.upgradeOptions
            };
        }

        // Vérifier les limites d'usage
        const usageCheck = await this.checkUsageLimits(userId, 'report.generate', tierData);

        return {
            allowed: usageCheck.allowed,
            source: 'subscription',
            reason: usageCheck.allowed ? null : usageCheck.reason,
            currentUsage: usageCheck.currentUsage,
            limit: tierData.limits.reportsPerMonth,
            remainingUsage: usageCheck.remainingUsage
        };
    }

    /**
     * Consomme une génération de rapport
     * @param {string} userId - ID utilisateur
     * @param {string} reportType - Type de rapport
     * @returns {Object} - Résultat de consommation
     */
    async consumeReportGeneration(userId, reportType = 'full') {
        const canGenerate = await this.canGenerateReport(userId, reportType);

        if (!canGenerate.allowed) {
            return {
                success: false,
                reason: canGenerate.reason,
                upgradeRequired: canGenerate.upgradeRequired
            };
        }

        if (canGenerate.source === 'credits') {
            const creditUsed = await this.useReportCredit(userId, reportType);
            if (!creditUsed) {
                return {
                    success: false,
                    reason: 'Erreur lors de l\'utilisation du crédit'
                };
            }
        } else {
            // Enregistrer l'usage pour les limites d'abonnement
            await this.recordUsage(userId, 'report.generate');
        }

        return {
            success: true,
            source: canGenerate.source,
            remainingCredits: canGenerate.remainingCredits ? canGenerate.remainingCredits - 1 : null,
            remainingUsage: canGenerate.remainingUsage ? canGenerate.remainingUsage - 1 : null
        };
    }

    /**
     * Obtient les options de mise à niveau
     * @param {string} currentTier - Tier actuel
     * @param {string} feature - Fonctionnalité demandée
     * @returns {Array} - Options de mise à niveau
     */
    getUpgradeOptions(currentTier, feature) {
        const tiers = ['basic', 'premium', 'pro'];
        const currentIndex = tiers.indexOf(currentTier);

        if (currentIndex === -1) {
            return tiers.map(tier => this.pricingEngine.getTierPricing(tier));
        }

        const upgradeTiers = tiers.slice(currentIndex + 1);
        return upgradeTiers.map(tier => {
            const tierData = this.pricingEngine.getTierPricing(tier);
            return {
                ...tierData,
                recommended: this.isTierRecommendedForFeature(tier, feature)
            };
        });
    }

    /**
     * Détermine si un tier est recommandé pour une fonctionnalité
     * @param {string} tier - Tier
     * @param {string} feature - Fonctionnalité
     * @returns {boolean} - Recommandation
     */
    isTierRecommendedForFeature(tier, feature) {
        const recommendations = {
            'report.export.pdf': 'basic',
            'report.export.docx': 'premium',
            'report.advanced.analysis': 'premium',
            'report.custom.template': 'pro',
            'api.access': 'premium',
            'support.priority': 'premium',
            'collaboration.team': 'pro'
        };

        return recommendations[feature] === tier;
    }

    /**
     * Obtient le résumé d'accès d'un utilisateur
     * @param {string} userId - ID utilisateur
     * @returns {Object} - Résumé d'accès
     */
    async getUserAccessSummary(userId) {
        const tier = await this.getUserTier(userId);
        const tierData = this.pricingEngine.getTierPricing(tier);
        const credits = await this.getUserCredits(userId);

        // Calculer l'usage actuel pour les principales fonctionnalités
        const reportUsage = await this.getCurrentUsage(userId, 'report.generate');
        const apiUsage = await this.getCurrentUsage(userId, 'api.access');

        return {
            userId,
            tier: {
                id: tier,
                name: tierData.name,
                price: tierData.price
            },
            limits: tierData.limits,
            currentUsage: {
                reports: reportUsage,
                api: apiUsage
            },
            credits,
            features: {
                reportGeneration: reportUsage < tierData.limits.reportsPerMonth,
                pdfExport: tier !== 'free',
                docxExport: ['premium', 'pro'].includes(tier),
                advancedAnalysis: ['premium', 'pro'].includes(tier),
                apiAccess: ['premium', 'pro'].includes(tier),
                prioritySupport: ['premium', 'pro'].includes(tier)
            }
        };
    }

    /**
     * Réinitialise l'usage mensuel (pour les tests ou tâches planifiées)
     * @param {string} userId - ID utilisateur optionnel
     */
    resetMonthlyUsage(userId = null) {
        if (userId) {
            const userUsage = this.usageTracking.get(userId);
            if (userUsage) {
                // Garder seulement l'usage du mois actuel
                const currentMonth = new Date().toISOString().slice(0, 7);
                for (const feature in userUsage) {
                    const featureUsage = {};
                    if (userUsage[feature][currentMonth]) {
                        featureUsage[currentMonth] = userUsage[feature][currentMonth];
                    }
                    userUsage[feature] = featureUsage;
                }
                this.usageTracking.set(userId, userUsage);
            }
        } else {
            // Réinitialiser pour tous les utilisateurs (usage interne)
            for (const [uid, userUsage] of this.usageTracking.entries()) {
                this.resetMonthlyUsage(uid);
            }
        }
    }
}
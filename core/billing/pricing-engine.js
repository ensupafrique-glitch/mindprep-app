/**
 * Pricing Engine - Moteur de tarification et niveaux de service
 * Définit les tarifs, niveaux de service et règles de monétisation
 */

export class PricingEngine {
    constructor() {
        this.tiers = {
            free: {
                name: 'Gratuit',
                price: 0,
                currency: 'XOF',
                features: {
                    basicCorrection: true,
                    rawScore: true,
                    quickPreview: true,
                    fullReport: false,
                    detailedGrade: false,
                    appreciation: false,
                    diagnosis: false,
                    progressPlan: false,
                    remediationPlan: false,
                    pdfExport: false,
                    docxExport: false,
                    prioritySupport: false,
                    customTemplates: false
                },
                limits: {
                    reportsPerMonth: 3,
                    reportsPerDay: 1,
                    storageDays: 7
                }
            },
            basic: {
                name: 'Essentiel',
                price: 1250, // 1250 FCFA
                currency: 'XOF',
                stripePriceId: 'price_basic_monthly',
                features: {
                    basicCorrection: true,
                    rawScore: true,
                    quickPreview: true,
                    fullReport: true,
                    detailedGrade: true,
                    appreciation: true,
                    diagnosis: true,
                    progressPlan: false,
                    remediationPlan: false,
                    pdfExport: true,
                    docxExport: false,
                    prioritySupport: false,
                    customTemplates: false
                },
                limits: {
                    reportsPerMonth: 50,
                    reportsPerDay: 5,
                    storageDays: 90
                }
            },
            premium: {
                name: 'Premium',
                price: 2500, // 2500 FCFA
                currency: 'XOF',
                stripePriceId: 'price_premium_monthly',
                features: {
                    basicCorrection: true,
                    rawScore: true,
                    quickPreview: true,
                    fullReport: true,
                    detailedGrade: true,
                    appreciation: true,
                    diagnosis: true,
                    progressPlan: true,
                    remediationPlan: true,
                    pdfExport: true,
                    docxExport: true,
                    prioritySupport: true,
                    customTemplates: false
                },
                limits: {
                    reportsPerMonth: 200,
                    reportsPerDay: 20,
                    storageDays: 365
                }
            },
            pro: {
                name: 'Professionnel',
                price: 7500, // 7500 FCFA
                currency: 'XOF',
                stripePriceId: 'price_pro_monthly',
                features: {
                    basicCorrection: true,
                    rawScore: true,
                    quickPreview: true,
                    fullReport: true,
                    detailedGrade: true,
                    appreciation: true,
                    diagnosis: true,
                    progressPlan: true,
                    remediationPlan: true,
                    pdfExport: true,
                    docxExport: true,
                    prioritySupport: true,
                    customTemplates: true
                },
                limits: {
                    reportsPerMonth: -1, // illimité
                    reportsPerDay: -1, // illimité
                    storageDays: -1 // illimité
                }
            }
        };

        this.discounts = {
            student: { percentage: 50, description: 'Réduction étudiant' },
            teacher: { percentage: 30, description: 'Réduction enseignant' },
            bulk: { percentage: 20, description: 'Achat en volume (5+)' },
            annual: { percentage: 15, description: 'Paiement annuel' }
        };

        this.reportPricing = {
            single: {
                basic: 250, // 250 FCFA pour un rapport basique
                full: 750, // 750 FCFA pour un rapport complet
                premium: 1250 // 1250 FCFA pour un rapport premium
            },
            bulk: {
                '5': { discount: 10 },
                '10': { discount: 15 },
                '25': { discount: 20 },
                '50': { discount: 25 }
            }
        };
    }

    /**
     * Obtient les informations de tarification pour un niveau donné
     * @param {string} tier - Niveau (free, basic, premium, pro)
     * @returns {Object} - Informations de tarification
     */
    getTierPricing(tier) {
        return this.tiers[tier] || this.tiers.free;
    }

    /**
     * Vérifie si une fonctionnalité est disponible pour un niveau
     * @param {string} tier - Niveau de l'utilisateur
     * @param {string} feature - Fonctionnalité à vérifier
     * @returns {boolean} - Disponibilité de la fonctionnalité
     */
    hasFeature(tier, feature) {
        const tierData = this.getTierPricing(tier);
        return tierData.features[feature] || false;
    }

    /**
     * Calcule le prix avec remise
     * @param {number} basePrice - Prix de base
     * @param {string} discountType - Type de remise
     * @returns {Object} - Prix calculé avec remise
     */
    calculateDiscountedPrice(basePrice, discountType) {
        const discount = this.discounts[discountType];
        if (!discount) return { original: basePrice, discounted: basePrice, discount: 0 };

        const discountAmount = Math.round(basePrice * discount.percentage / 100);
        return {
            original: basePrice,
            discounted: basePrice - discountAmount,
            discount: discountAmount,
            percentage: discount.percentage,
            description: discount.description
        };
    }

    /**
     * Calcule le prix pour un achat groupé
     * @param {number} quantity - Quantité de rapports
     * @param {string} reportType - Type de rapport (basic, full, premium)
     * @returns {Object} - Prix calculé pour l'achat groupé
     */
    calculateBulkPrice(quantity, reportType = 'full') {
        const unitPrice = this.reportPricing.single[reportType];
        const bulkDiscount = this.getBulkDiscount(quantity);

        const totalWithoutDiscount = unitPrice * quantity;
        const discountAmount = Math.round(totalWithoutDiscount * bulkDiscount / 100);
        const totalWithDiscount = totalWithoutDiscount - discountAmount;

        return {
            quantity: quantity,
            unitPrice: unitPrice,
            totalWithoutDiscount: totalWithoutDiscount,
            discountPercentage: bulkDiscount,
            discountAmount: discountAmount,
            totalWithDiscount: totalWithDiscount,
            pricePerUnit: Math.round(totalWithDiscount / quantity)
        };
    }

    /**
     * Obtient la remise pour un achat groupé
     * @param {number} quantity - Quantité
     * @returns {number} - Pourcentage de remise
     */
    getBulkDiscount(quantity) {
        const bulkTiers = Object.keys(this.reportPricing.bulk)
            .map(q => parseInt(q))
            .sort((a, b) => b - a); // Tri décroissant

        for (const tier of bulkTiers) {
            if (quantity >= tier) {
                return this.reportPricing.bulk[tier].discount;
            }
        }
        return 0;
    }

    /**
     * Vérifie si l'utilisateur peut accéder à une fonctionnalité
     * @param {Object} user - Informations utilisateur
     * @param {string} feature - Fonctionnalité demandée
     * @returns {Object} - Résultat de vérification
     */
    canAccessFeature(user, feature) {
        const userTier = user.tier || 'free';
        const hasFeature = this.hasFeature(userTier, feature);

        if (hasFeature) {
            return {
                allowed: true,
                reason: 'feature_available'
            };
        }

        // Vérifier les limites d'usage pour le free tier
        if (userTier === 'free') {
            const limits = this.tiers.free.limits;
            const usage = user.usage || {};

            if (feature === 'fullReport' && usage.reportsThisMonth >= limits.reportsPerMonth) {
                return {
                    allowed: false,
                    reason: 'monthly_limit_reached',
                    upgradeRequired: true,
                    message: `Limite mensuelle atteinte (${limits.reportsPerMonth} rapports). Passez à un abonnement payant.`
                };
            }

            if (feature === 'fullReport' && usage.reportsToday >= limits.reportsPerDay) {
                return {
                    allowed: false,
                    reason: 'daily_limit_reached',
                    upgradeRequired: true,
                    message: `Limite journalière atteinte (${limits.reportsPerDay} rapports). Réessayez demain ou passez à un abonnement.`
                };
            }
        }

        return {
            allowed: false,
            reason: 'upgrade_required',
            upgradeRequired: true,
            message: `Cette fonctionnalité nécessite un abonnement ${this.getRequiredTier(feature)}.`,
            requiredTier: this.getRequiredTier(feature)
        };
    }

    /**
     * Détermine le niveau requis pour une fonctionnalité
     * @param {string} feature - Fonctionnalité
     * @returns {string} - Niveau requis
     */
    getRequiredTier(feature) {
        for (const [tierName, tierData] of Object.entries(this.tiers)) {
            if (tierData.features[feature]) {
                return tierName;
            }
        }
        return 'pro';
    }

    /**
     * Génère une proposition de mise à niveau
     * @param {Object} user - Utilisateur actuel
     * @param {string} feature - Fonctionnalité demandée
     * @returns {Object} - Proposition d'upgrade
     */
    generateUpgradeSuggestion(user, feature) {
        const requiredTier = this.getRequiredTier(feature);
        const currentTier = user.tier || 'free';

        if (this.getTierLevel(requiredTier) <= this.getTierLevel(currentTier)) {
            return null; // Pas besoin d'upgrade
        }

        const requiredTierData = this.tiers[requiredTier];
        const suggestion = {
            requiredTier: requiredTier,
            name: requiredTierData.name,
            price: requiredTierData.price,
            currency: requiredTierData.currency,
            features: Object.keys(requiredTierData.features).filter(f => requiredTierData.features[f]),
            savings: this.calculateSavings(currentTier, requiredTier)
        };

        return suggestion;
    }

    /**
     * Calcule les économies potentielles
     * @param {string} fromTier - Niveau actuel
     * @param {string} toTier - Niveau cible
     * @returns {Object} - Économies calculées
     */
    calculateSavings(fromTier, toTier) {
        const fromPrice = this.tiers[fromTier].price;
        const toPrice = this.tiers[toTier].price;

        if (fromPrice === 0) {
            return {
                monthly: toPrice,
                description: `Économisez ${toPrice} FCFA/mois avec l'abonnement`
            };
        }

        const savings = fromPrice - toPrice;
        return {
            monthly: Math.abs(savings),
            description: savings > 0 ?
                `Économisez ${savings} FCFA/mois` :
                `Investissement supplémentaire de ${Math.abs(savings)} FCFA/mois`
        };
    }

    /**
     * Obtient le niveau numérique d'un tier
     * @param {string} tier - Niveau
     * @returns {number} - Niveau numérique
     */
    getTierLevel(tier) {
        const levels = { free: 0, basic: 1, premium: 2, pro: 3 };
        return levels[tier] || 0;
    }

    /**
     * Valide un code promo
     * @param {string} code - Code promo
     * @returns {Object} - Résultat de validation
     */
    validatePromoCode(code) {
        // Simulation de validation de code promo
        const promoCodes = {
            'STUDENT2024': { type: 'student', valid: true },
            'TEACHER2024': { type: 'teacher', valid: true },
            'BULK10': { type: 'bulk', valid: true }
        };

        const promo = promoCodes[code.toUpperCase()];
        if (!promo) {
            return { valid: false, reason: 'code_not_found' };
        }

        if (!promo.valid) {
            return { valid: false, reason: 'code_expired' };
        }

        return {
            valid: true,
            type: promo.type,
            discount: this.discounts[promo.type]
        };
    }

    /**
     * Obtient tous les niveaux disponibles
     * @returns {Object} - Tous les niveaux
     */
    getAllTiers() {
        return this.tiers;
    }

    /**
     * Calcule le coût estimé pour un usage donné
     * @param {Object} usage - Usage estimé
     * @returns {Object} - Coût estimé
     */
    estimateCost(usage) {
        const { reportsPerMonth = 0, features = [] } = usage;

        let bestTier = 'free';
        let estimatedCost = 0;

        // Déterminer le meilleur tier
        for (const [tierName, tierData] of Object.entries(this.tiers)) {
            if (tierName === 'free') continue;

            const canHandleUsage = reportsPerMonth <= tierData.limits.reportsPerMonth ||
                                 tierData.limits.reportsPerMonth === -1;
            const hasFeatures = features.every(feature => tierData.features[feature]);

            if (canHandleUsage && hasFeatures) {
                bestTier = tierName;
                estimatedCost = tierData.price;
                break;
            }
        }

        // Si usage trop élevé, calculer coût à l'unité
        if (bestTier === 'free' && reportsPerMonth > this.tiers.free.limits.reportsPerMonth) {
            const paidReports = reportsPerMonth - this.tiers.free.limits.reportsPerMonth;
            estimatedCost = paidReports * this.reportPricing.single.full;
        }

        return {
            recommendedTier: bestTier,
            estimatedMonthlyCost: estimatedCost,
            currency: 'XOF',
            breakdown: {
                subscription: this.tiers[bestTier].price,
                payPerUse: bestTier === 'free' ? (reportsPerMonth - this.tiers.free.limits.reportsPerMonth) * this.reportPricing.single.full : 0
            }
        };
    }
}
/**
 * Payment Engine - Moteur de paiement multi-provider
 * Gère les paiements via Orange Money, Wave, Free Money, PayPal, Stripe
 */

// Browser-safe env reader. In Node, reads from process.env. In the browser,
// reads from window.MINDPREP_CONFIG (optional) so secrets stay server-side.
function getEnv(key) {
    if (typeof process !== 'undefined' && process.env && process.env[key] != null) {
        return process.env[key];
    }
    if (typeof window !== 'undefined' && window.MINDPREP_CONFIG && window.MINDPREP_CONFIG[key] != null) {
        return window.MINDPREP_CONFIG[key];
    }
    return null;
}

export class PaymentEngine {
    constructor() {
        this.providers = {
            orange_money: {
                name: 'Orange Money',
                countries: ['SN', 'CI', 'ML', 'GN', 'BF'],
                currencies: ['XOF', 'XAF'],
                fees: { percentage: 1.5, fixed: 100 },
                processingTime: '2-5 minutes',
                config: {
                    apiUrl: 'https://api.orange.com/orange-money',
                    clientId: getEnv('ORANGE_MONEY_CLIENT_ID'),
                    clientSecret: getEnv('ORANGE_MONEY_CLIENT_SECRET')
                }
            },
            wave: {
                name: 'Wave',
                countries: ['SN', 'CI', 'ML', 'BF'],
                currencies: ['XOF', 'XAF'],
                fees: { percentage: 1.2, fixed: 50 },
                processingTime: 'Instantané',
                config: {
                    apiUrl: 'https://api.wave.com/v1',
                    apiKey: getEnv('WAVE_API_KEY')
                }
            },
            free_money: {
                name: 'Free Money',
                countries: ['SN', 'GN', 'ML'],
                currencies: ['XOF'],
                fees: { percentage: 1.0, fixed: 0 },
                processingTime: '1-3 minutes',
                config: {
                    apiUrl: 'https://api.free.sn/money',
                    merchantId: getEnv('FREE_MONEY_MERCHANT_ID'),
                    apiKey: getEnv('FREE_MONEY_API_KEY')
                }
            },
            paypal: {
                name: 'PayPal',
                countries: ['WORLDWIDE'],
                currencies: ['USD', 'EUR', 'XOF', 'XAF'],
                fees: { percentage: 2.9, fixed: 0.30 },
                processingTime: 'Instantané',
                config: {
                    clientId: getEnv('PAYPAL_CLIENT_ID'),
                    clientSecret: getEnv('PAYPAL_CLIENT_SECRET'),
                    mode: getEnv('NODE_ENV') === 'production' ? 'live' : 'sandbox'
                }
            },
            stripe: {
                name: 'Stripe',
                countries: ['WORLDWIDE'],
                currencies: ['USD', 'EUR', 'XOF', 'XAF', 'GBP'],
                fees: { percentage: 2.9, fixed: 0.30 },
                processingTime: 'Instantané',
                config: {
                    publishableKey: getEnv('STRIPE_PUBLISHABLE_KEY'),
                    secretKey: getEnv('STRIPE_SECRET_KEY'),
                    webhookSecret: getEnv('STRIPE_WEBHOOK_SECRET')
                }
            }
        };

        this.paymentStatuses = {
            pending: 'En attente',
            processing: 'Traitement en cours',
            completed: 'Terminé',
            failed: 'Échec',
            cancelled: 'Annulé',
            refunded: 'Remboursé'
        };

        this.transactionStore = new Map(); // En mémoire pour la démo
    }

    /**
     * Initialise un paiement
     * @param {Object} paymentData - Données du paiement
     * @returns {Object} - Résultat de l'initialisation
     */
    async initializePayment(paymentData) {
        const {
            provider,
            amount,
            currency = 'XOF',
            description,
            customerInfo,
            metadata = {}
        } = paymentData;

        // Validation des données
        const validation = this.validatePaymentData(paymentData);
        if (!validation.valid) {
            return {
                success: false,
                error: validation.error,
                code: 'VALIDATION_ERROR'
            };
        }

        // Générer un ID de transaction unique
        const transactionId = this.generateTransactionId();

        // Calculer les frais
        const fees = this.calculateFees(provider, amount, currency);

        // Créer la transaction
        const transaction = {
            id: transactionId,
            provider,
            amount,
            currency,
            fees,
            total: amount + fees,
            description,
            customerInfo,
            metadata,
            status: 'pending',
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
        };

        // Stocker la transaction
        this.transactionStore.set(transactionId, transaction);

        try {
            // Initialiser le paiement selon le provider
            const result = await this.initializeProviderPayment(provider, transaction);

            if (result.success) {
                transaction.status = 'processing';
                transaction.providerReference = result.reference;
                transaction.paymentUrl = result.paymentUrl;
                transaction.qrCode = result.qrCode;

                return {
                    success: true,
                    transactionId,
                    paymentUrl: result.paymentUrl,
                    qrCode: result.qrCode,
                    instructions: this.getPaymentInstructions(provider),
                    expiresAt: transaction.expiresAt
                };
            } else {
                transaction.status = 'failed';
                transaction.error = result.error;
                return {
                    success: false,
                    error: result.error,
                    code: 'PROVIDER_ERROR'
                };
            }
        } catch (error) {
            transaction.status = 'failed';
            transaction.error = error.message;
            return {
                success: false,
                error: 'Erreur lors de l\'initialisation du paiement',
                code: 'INITIALIZATION_ERROR'
            };
        }
    }

    /**
     * Valide les données de paiement
     * @param {Object} data - Données à valider
     * @returns {Object} - Résultat de validation
     */
    validatePaymentData(data) {
        const { provider, amount, currency, customerInfo } = data;

        if (!provider || !this.providers[provider]) {
            return { valid: false, error: 'Provider de paiement non supporté' };
        }

        if (!amount || amount <= 0) {
            return { valid: false, error: 'Montant invalide' };
        }

        const providerData = this.providers[provider];
        if (!providerData.currencies.includes(currency)) {
            return { valid: false, error: `Devise ${currency} non supportée par ${providerData.name}` };
        }

        if (!customerInfo || !customerInfo.email) {
            return { valid: false, error: 'Informations client requises' };
        }

        return { valid: true };
    }

    /**
     * Calcule les frais de transaction
     * @param {string} provider - Provider de paiement
     * @param {number} amount - Montant
     * @param {string} currency - Devise
     * @returns {number} - Frais calculés
     */
    calculateFees(provider, amount, currency) {
        const providerData = this.providers[provider];
        const { percentage, fixed } = providerData.fees;

        const percentageFee = Math.round(amount * percentage / 100);
        return percentageFee + fixed;
    }

    /**
     * Initialise le paiement selon le provider
     * @param {string} provider - Provider
     * @param {Object} transaction - Transaction
     * @returns {Object} - Résultat de l'initialisation
     */
    async initializeProviderPayment(provider, transaction) {
        switch (provider) {
            case 'orange_money':
                return await this.initializeOrangeMoneyPayment(transaction);
            case 'wave':
                return await this.initializeWavePayment(transaction);
            case 'free_money':
                return await this.initializeFreeMoneyPayment(transaction);
            case 'paypal':
                return await this.initializePayPalPayment(transaction);
            case 'stripe':
                return await this.initializeStripePayment(transaction);
            default:
                return { success: false, error: 'Provider non supporté' };
        }
    }

    /**
     * Initialise un paiement Orange Money
     * @param {Object} transaction - Transaction
     * @returns {Object} - Résultat
     */
    async initializeOrangeMoneyPayment(transaction) {
        // Simulation d'appel API Orange Money
        const reference = `OM_${transaction.id}`;

        return {
            success: true,
            reference,
            paymentUrl: `https://pay.orange.sn/${reference}`,
            instructions: 'Composez #144# puis suivez les instructions'
        };
    }

    /**
     * Initialise un paiement Wave
     * @param {Object} transaction - Transaction
     * @returns {Object} - Résultat
     */
    async initializeWavePayment(transaction) {
        // Simulation d'appel API Wave
        const reference = `WAVE_${transaction.id}`;

        return {
            success: true,
            reference,
            qrCode: `data:image/png;base64,${btoa('QR_CODE_' + reference)}`,
            instructions: 'Scannez le QR code avec l\'app Wave'
        };
    }

    /**
     * Initialise un paiement Free Money
     * @param {Object} transaction - Transaction
     * @returns {Object} - Résultat
     */
    async initializeFreeMoneyPayment(transaction) {
        // Simulation d'appel API Free Money
        const reference = `FREE_${transaction.id}`;

        return {
            success: true,
            reference,
            paymentUrl: `https://free.sn/pay/${reference}`,
            instructions: 'Utilisez votre compte Free Money'
        };
    }

    /**
     * Initialise un paiement PayPal
     * @param {Object} transaction - Transaction
     * @returns {Object} - Résultat
     */
    async initializePayPalPayment(transaction) {
        // Simulation d'appel API PayPal
        const reference = `PP_${transaction.id}`;

        return {
            success: true,
            reference,
            paymentUrl: `https://paypal.com/pay/${reference}`,
            instructions: 'Connectez-vous à votre compte PayPal'
        };
    }

    /**
     * Initialise un paiement Stripe
     * @param {Object} transaction - Transaction
     * @returns {Object} - Résultat
     */
    async initializeStripePayment(transaction) {
        // Simulation d'appel API Stripe
        const reference = `STRIPE_${transaction.id}`;

        return {
            success: true,
            reference,
            paymentUrl: `https://checkout.stripe.com/${reference}`,
            instructions: 'Utilisez votre carte bancaire'
        };
    }

    /**
     * Vérifie le statut d'un paiement
     * @param {string} transactionId - ID de transaction
     * @returns {Object} - Statut du paiement
     */
    async checkPaymentStatus(transactionId) {
        const transaction = this.transactionStore.get(transactionId);

        if (!transaction) {
            return {
                success: false,
                error: 'Transaction non trouvée',
                code: 'TRANSACTION_NOT_FOUND'
            };
        }

        // Simulation de vérification de statut
        // En production, cela ferait un appel API au provider
        if (transaction.status === 'processing') {
            // Simuler un paiement réussi après un délai
            if (Date.now() - new Date(transaction.createdAt) > 10000) { // 10 secondes
                transaction.status = 'completed';
                transaction.completedAt = new Date().toISOString();
            }
        }

        return {
            success: true,
            transactionId,
            status: transaction.status,
            statusLabel: this.paymentStatuses[transaction.status],
            completedAt: transaction.completedAt,
            amount: transaction.amount,
            currency: transaction.currency
        };
    }

    /**
     * Confirme un paiement (webhook/callback)
     * @param {string} transactionId - ID de transaction
     * @param {Object} confirmationData - Données de confirmation
     * @returns {Object} - Résultat de confirmation
     */
    async confirmPayment(transactionId, confirmationData) {
        const transaction = this.transactionStore.get(transactionId);

        if (!transaction) {
            return {
                success: false,
                error: 'Transaction non trouvée',
                code: 'TRANSACTION_NOT_FOUND'
            };
        }

        if (transaction.status === 'completed') {
            return {
                success: false,
                error: 'Paiement déjà confirmé',
                code: 'ALREADY_CONFIRMED'
            };
        }

        // Vérifier les données de confirmation selon le provider
        const isValid = await this.validateConfirmation(transaction.provider, confirmationData);

        if (isValid) {
            transaction.status = 'completed';
            transaction.completedAt = new Date().toISOString();
            transaction.confirmationData = confirmationData;

            return {
                success: true,
                transactionId,
                status: 'completed',
                amount: transaction.amount,
                currency: transaction.currency,
                metadata: transaction.metadata
            };
        } else {
            transaction.status = 'failed';
            transaction.error = 'Confirmation invalide';

            return {
                success: false,
                error: 'Confirmation de paiement invalide',
                code: 'INVALID_CONFIRMATION'
            };
        }
    }

    /**
     * Valide les données de confirmation selon le provider
     * @param {string} provider - Provider
     * @param {Object} confirmationData - Données de confirmation
     * @returns {boolean} - Validité de la confirmation
     */
    async validateConfirmation(provider, confirmationData) {
        // Simulation de validation
        // En production, cela vérifierait les signatures, montants, etc.
        return confirmationData && confirmationData.status === 'success';
    }

    /**
     * Traite un remboursement
     * @param {string} transactionId - ID de transaction
     * @param {string} reason - Raison du remboursement
     * @returns {Object} - Résultat du remboursement
     */
    async processRefund(transactionId, reason = 'Demande client') {
        const transaction = this.transactionStore.get(transactionId);

        if (!transaction) {
            return {
                success: false,
                error: 'Transaction non trouvée',
                code: 'TRANSACTION_NOT_FOUND'
            };
        }

        if (transaction.status !== 'completed') {
            return {
                success: false,
                error: 'Seules les transactions complétées peuvent être remboursées',
                code: 'INVALID_STATUS'
            };
        }

        // Simuler le remboursement
        transaction.status = 'refunded';
        transaction.refundedAt = new Date().toISOString();
        transaction.refundReason = reason;

        return {
            success: true,
            transactionId,
            status: 'refunded',
            amount: transaction.amount,
            currency: transaction.currency,
            reason: reason
        };
    }

    /**
     * Génère un ID de transaction unique
     * @returns {string} - ID unique
     */
    generateTransactionId() {
        return `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Obtient les instructions de paiement pour un provider
     * @param {string} provider - Provider
     * @returns {string} - Instructions
     */
    getPaymentInstructions(provider) {
        const instructions = {
            orange_money: '1. Composez #144# sur votre téléphone\n2. Choisissez "Paiement"\n3. Entrez le montant\n4. Confirmez avec votre code secret',
            wave: '1. Ouvrez l\'app Wave\n2. Scannez le QR code\n3. Confirmez le paiement',
            free_money: '1. Connectez-vous à votre espace Free Money\n2. Choisissez "Paiement"\n3. Entrez les détails de la transaction',
            paypal: '1. Connectez-vous à votre compte PayPal\n2. Confirmez le paiement\n3. Le montant sera débité de votre compte',
            stripe: '1. Entrez les détails de votre carte\n2. Confirmez le paiement\n3. Le montant sera débité immédiatement'
        };

        return instructions[provider] || 'Suivez les instructions à l\'écran';
    }

    /**
     * Obtient les providers disponibles pour un pays
     * @param {string} countryCode - Code pays (ex: 'SN', 'CI')
     * @returns {Array} - Providers disponibles
     */
    getAvailableProviders(countryCode = 'SN') {
        return Object.entries(this.providers)
            .filter(([key, provider]) =>
                provider.countries.includes(countryCode) ||
                provider.countries.includes('WORLDWIDE')
            )
            .map(([key, provider]) => ({
                id: key,
                name: provider.name,
                fees: provider.fees,
                processingTime: provider.processingTime
            }));
    }

    /**
     * Calcule le coût total avec frais
     * @param {string} provider - Provider
     * @param {number} amount - Montant
     * @param {string} currency - Devise
     * @returns {Object} - Coûts détaillés
     */
    calculateTotalCost(provider, amount, currency = 'XOF') {
        const fees = this.calculateFees(provider, amount, currency);
        const total = amount + fees;

        return {
            amount,
            fees,
            total,
            currency,
            breakdown: {
                percentage: `${this.providers[provider].fees.percentage}%`,
                fixed: `${this.providers[provider].fees.fixed} ${currency}`
            }
        };
    }
}
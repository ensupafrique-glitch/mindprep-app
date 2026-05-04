/**
 * Invoice Engine - Moteur de facturation
 * Gère la génération, stockage et gestion des factures
 */

export class InvoiceEngine {
    constructor() {
        this.invoices = new Map(); // Stockage en mémoire pour la démo
        this.invoiceCounter = 1;
        this.companyInfo = {
            name: 'MindPrep SARL',
            address: 'Dakar, Sénégal',
            email: 'facturation@mindprep.sn',
            phone: '+221 33 123 45 67',
            taxId: 'SN123456789',
            logo: '/assets/logo-mindprep.png'
        };
    }

    /**
     * Génère une facture pour une transaction
     * @param {Object} transactionData - Données de transaction
     * @returns {Object} - Facture générée
     */
    async generateInvoice(transactionData) {
        const {
            transactionId,
            userId,
            customerInfo,
            items,
            total,
            currency = 'XOF',
            paymentMethod,
            metadata = {}
        } = transactionData;

        // Générer un numéro de facture unique
        const invoiceNumber = this.generateInvoiceNumber();

        // Calculer les taxes (TVA 18% au Sénégal)
        const taxRate = 0.18;
        const subtotal = total / (1 + taxRate);
        const taxAmount = total - subtotal;

        // Créer la facture
        const invoice = {
            id: invoiceNumber,
            transactionId,
            userId,
            customerInfo,
            items: this.formatInvoiceItems(items),
            subtotal: Math.round(subtotal),
            taxRate,
            taxAmount: Math.round(taxAmount),
            total: Math.round(total),
            currency,
            paymentMethod,
            status: 'paid',
            issuedAt: new Date().toISOString(),
            dueDate: new Date().toISOString(), // Payé immédiatement
            metadata,
            companyInfo: this.companyInfo
        };

        // Stocker la facture
        this.invoices.set(invoiceNumber, invoice);

        return {
            success: true,
            invoiceNumber,
            invoice
        };
    }

    /**
     * Formate les articles pour la facture
     * @param {Array} items - Articles bruts
     * @returns {Array} - Articles formatés
     */
    formatInvoiceItems(items) {
        return items.map((item, index) => {
            let description, unitPrice, quantity, total;

            switch (item.type) {
                case 'report':
                    description = `${item.quantity} Rapport(s) pédagogique(s) ${item.reportType || 'complet'}`;
                    unitPrice = item.unitPrice || 0;
                    quantity = item.quantity;
                    total = item.total || (unitPrice * quantity);
                    break;

                case 'subscription':
                    const billingText = item.billingCycle === 'annual' ? 'annuel' : 'mensuel';
                    description = `Abonnement ${item.tier} ${billingText}`;
                    unitPrice = item.unitPrice || 0;
                    quantity = 1;
                    total = item.total || unitPrice;
                    break;

                case 'credit':
                    description = `${item.quantity} Crédit(s) de rapport ${item.reportType || 'complet'}`;
                    unitPrice = item.unitPrice || 0;
                    quantity = item.quantity;
                    total = item.total || (unitPrice * quantity);
                    break;

                default:
                    description = item.description || 'Article divers';
                    unitPrice = item.unitPrice || 0;
                    quantity = item.quantity || 1;
                    total = item.total || (unitPrice * quantity);
            }

            return {
                id: index + 1,
                description,
                unitPrice: Math.round(unitPrice),
                quantity,
                total: Math.round(total)
            };
        });
    }

    /**
     * Génère un numéro de facture unique
     * @returns {string} - Numéro de facture
     */
    generateInvoiceNumber() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const counter = String(this.invoiceCounter).padStart(4, '0');

        this.invoiceCounter++;

        return `INV-${year}${month}-${counter}`;
    }

    /**
     * Obtient une facture par numéro
     * @param {string} invoiceNumber - Numéro de facture
     * @returns {Object} - Facture ou erreur
     */
    getInvoice(invoiceNumber) {
        const invoice = this.invoices.get(invoiceNumber);

        if (!invoice) {
            return {
                success: false,
                error: 'Facture introuvable',
                code: 'INVOICE_NOT_FOUND'
            };
        }

        return {
            success: true,
            invoice
        };
    }

    /**
     * Obtient les factures d'un utilisateur
     * @param {string} userId - ID utilisateur
     * @param {Object} filters - Filtres optionnels
     * @returns {Array} - Liste des factures
     */
    getUserInvoices(userId, filters = {}) {
        const userInvoices = [];

        for (const [invoiceNumber, invoice] of this.invoices.entries()) {
            if (invoice.userId === userId) {
                // Appliquer les filtres
                if (filters.status && invoice.status !== filters.status) continue;
                if (filters.dateFrom && new Date(invoice.issuedAt) < new Date(filters.dateFrom)) continue;
                if (filters.dateTo && new Date(invoice.issuedAt) > new Date(filters.dateTo)) continue;

                userInvoices.push(invoice);
            }
        }

        // Trier par date décroissante
        userInvoices.sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt));

        return userInvoices;
    }

    /**
     * Génère le HTML d'une facture
     * @param {string} invoiceNumber - Numéro de facture
     * @returns {string} - HTML de la facture
     */
    generateInvoiceHTML(invoiceNumber) {
        const result = this.getInvoice(invoiceNumber);

        if (!result.success) {
            throw new Error(result.error);
        }

        const invoice = result.invoice;

        return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Facture ${invoice.id}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            border-bottom: 2px solid #007acc;
            padding-bottom: 20px;
        }
        .company-info h1 {
            color: #007acc;
            margin: 0;
            font-size: 28px;
        }
        .company-details {
            color: #666;
            font-size: 14px;
            line-height: 1.4;
        }
        .invoice-info {
            text-align: right;
        }
        .invoice-number {
            font-size: 24px;
            font-weight: bold;
            color: #007acc;
            margin: 0;
        }
        .invoice-date {
            color: #666;
            margin: 5px 0;
        }
        .customer-info {
            margin-bottom: 30px;
        }
        .customer-info h3 {
            margin: 0 0 10px 0;
            color: #333;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        .info-section {
            background: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
        }
        .info-section h4 {
            margin: 0 0 8px 0;
            color: #007acc;
            font-size: 14px;
            text-transform: uppercase;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
        }
        .items-table th,
        .items-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        .items-table th {
            background-color: #f8f9fa;
            font-weight: 600;
            color: #333;
        }
        .items-table .description {
            width: 50%;
        }
        .items-table .amount {
            text-align: right;
        }
        .totals {
            display: flex;
            justify-content: flex-end;
            margin-top: 20px;
        }
        .totals-table {
            width: 300px;
        }
        .totals-table td {
            padding: 8px 12px;
        }
        .totals-table .total-row {
            font-weight: bold;
            font-size: 18px;
            border-top: 2px solid #007acc;
            background-color: #f8f9fa;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-paid {
            background-color: #d4edda;
            color: #155724;
        }
        .currency {
            font-family: 'Courier New', monospace;
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="header">
            <div class="company-info">
                <h1>${invoice.companyInfo.name}</h1>
                <div class="company-details">
                    ${invoice.companyInfo.address}<br>
                    Email: ${invoice.companyInfo.email}<br>
                    Tél: ${invoice.companyInfo.phone}<br>
                    N° TVA: ${invoice.companyInfo.taxId}
                </div>
            </div>
            <div class="invoice-info">
                <h2 class="invoice-number">Facture ${invoice.id}</h2>
                <div class="invoice-date">Émise le: ${this.formatDate(invoice.issuedAt)}</div>
                <div class="invoice-date">Échéance: ${this.formatDate(invoice.dueDate)}</div>
                <span class="status-badge status-paid">${invoice.status}</span>
            </div>
        </div>

        <div class="customer-info">
            <div class="info-grid">
                <div class="info-section">
                    <h4>Facturé à</h4>
                    <div>${invoice.customerInfo.name || 'Client'}</div>
                    <div>${invoice.customerInfo.email}</div>
                    ${invoice.customerInfo.phone ? `<div>${invoice.customerInfo.phone}</div>` : ''}
                    ${invoice.customerInfo.address ? `<div>${invoice.customerInfo.address}</div>` : ''}
                </div>
                <div class="info-section">
                    <h4>Détails du paiement</h4>
                    <div>Méthode: ${this.formatPaymentMethod(invoice.paymentMethod)}</div>
                    <div>Référence: ${invoice.transactionId}</div>
                    <div>Devise: ${invoice.currency}</div>
                </div>
            </div>
        </div>

        <table class="items-table">
            <thead>
                <tr>
                    <th class="description">Description</th>
                    <th>Quantité</th>
                    <th>Prix unitaire</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${invoice.items.map(item => `
                    <tr>
                        <td class="description">${item.description}</td>
                        <td>${item.quantity}</td>
                        <td class="amount currency">${this.formatCurrency(item.unitPrice, invoice.currency)}</td>
                        <td class="amount currency">${this.formatCurrency(item.total, invoice.currency)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="totals">
            <table class="totals-table">
                <tr>
                    <td>Sous-total:</td>
                    <td class="amount currency">${this.formatCurrency(invoice.subtotal, invoice.currency)}</td>
                </tr>
                <tr>
                    <td>TVA (${(invoice.taxRate * 100).toFixed(0)}%):</td>
                    <td class="amount currency">${this.formatCurrency(invoice.taxAmount, invoice.currency)}</td>
                </tr>
                <tr class="total-row">
                    <td>Total:</td>
                    <td class="amount currency">${this.formatCurrency(invoice.total, invoice.currency)}</td>
                </tr>
            </table>
        </div>

        <div class="footer">
            <p>Merci d'avoir choisi MindPrep pour vos analyses pédagogiques.</p>
            <p>Cette facture a été générée automatiquement le ${this.formatDate(new Date().toISOString())}</p>
        </div>
    </div>
</body>
</html>`;
    }

    /**
     * Génère un PDF d'une facture (simulation)
     * @param {string} invoiceNumber - Numéro de facture
     * @returns {Object} - Résultat de génération PDF
     */
    async generateInvoicePDF(invoiceNumber) {
        const html = this.generateInvoiceHTML(invoiceNumber);

        // Simulation de génération PDF
        // En production, utiliserait une bibliothèque comme Puppeteer ou jsPDF

        return {
            success: true,
            pdfData: `data:application/pdf;base64,${btoa(html)}`, // Simulation
            fileName: `facture-${invoiceNumber}.pdf`
        };
    }

    /**
     * Envoie une facture par email (simulation)
     * @param {string} invoiceNumber - Numéro de facture
     * @param {string} email - Email destinataire
     * @returns {Object} - Résultat d'envoi
     */
    async sendInvoiceByEmail(invoiceNumber, email) {
        const result = this.getInvoice(invoiceNumber);

        if (!result.success) {
            return result;
        }

        const invoice = result.invoice;

        // Simulation d'envoi d'email
        console.log(`Envoi de la facture ${invoiceNumber} à ${email}`);

        // En production, intégration avec un service d'email comme SendGrid, Mailgun, etc.

        return {
            success: true,
            message: `Facture ${invoiceNumber} envoyée à ${email}`,
            sentAt: new Date().toISOString()
        };
    }

    /**
     * Annule une facture
     * @param {string} invoiceNumber - Numéro de facture
     * @param {string} reason - Raison d'annulation
     * @returns {Object} - Résultat d'annulation
     */
    cancelInvoice(invoiceNumber, reason = 'Annulation demandée par le client') {
        const result = this.getInvoice(invoiceNumber);

        if (!result.success) {
            return result;
        }

        const invoice = result.invoice;

        if (invoice.status === 'cancelled') {
            return {
                success: false,
                error: 'Facture déjà annulée',
                code: 'ALREADY_CANCELLED'
            };
        }

        invoice.status = 'cancelled';
        invoice.cancelledAt = new Date().toISOString();
        invoice.cancelReason = reason;

        return {
            success: true,
            invoiceNumber,
            status: 'cancelled'
        };
    }

    /**
     * Obtient les statistiques de facturation
     * @param {Object} filters - Filtres optionnels
     * @returns {Object} - Statistiques
     */
    getBillingStats(filters = {}) {
        let totalRevenue = 0;
        let totalInvoices = 0;
        let totalCancelled = 0;
        const revenueByMonth = {};
        const revenueByPaymentMethod = {};

        for (const [invoiceNumber, invoice] of this.invoices.entries()) {
            // Appliquer les filtres
            if (filters.dateFrom && new Date(invoice.issuedAt) < new Date(filters.dateFrom)) continue;
            if (filters.dateTo && new Date(invoice.issuedAt) > new Date(filters.dateTo)) continue;
            if (filters.status && invoice.status !== filters.status) continue;

            totalInvoices++;

            if (invoice.status === 'paid') {
                totalRevenue += invoice.total;

                // Revenue par mois
                const month = invoice.issuedAt.slice(0, 7); // YYYY-MM
                revenueByMonth[month] = (revenueByMonth[month] || 0) + invoice.total;

                // Revenue par méthode de paiement
                const method = invoice.paymentMethod;
                revenueByPaymentMethod[method] = (revenueByPaymentMethod[method] || 0) + invoice.total;
            }

            if (invoice.status === 'cancelled') {
                totalCancelled++;
            }
        }

        return {
            totalRevenue,
            totalInvoices,
            totalCancelled,
            averageInvoiceValue: totalInvoices > 0 ? totalRevenue / totalInvoices : 0,
            revenueByMonth,
            revenueByPaymentMethod,
            currency: 'XOF'
        };
    }

    /**
     * Formate une date
     * @param {string} dateString - Date ISO
     * @returns {string} - Date formatée
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Formate un montant avec devise
     * @param {number} amount - Montant
     * @param {string} currency - Devise
     * @returns {string} - Montant formaté
     */
    formatCurrency(amount, currency = 'XOF') {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0
        }).format(amount);
    }

    /**
     * Formate le nom d'une méthode de paiement
     * @param {string} method - Méthode brute
     * @returns {string} - Nom formaté
     */
    formatPaymentMethod(method) {
        const methodNames = {
            orange_money: 'Orange Money',
            wave: 'Wave',
            free_money: 'Free Money',
            paypal: 'PayPal',
            stripe: 'Carte bancaire (Stripe)'
        };

        return methodNames[method] || method;
    }

    /**
     * Exporte les factures au format CSV
     * @param {Array} invoices - Liste des factures
     * @returns {string} - Contenu CSV
     */
    exportInvoicesToCSV(invoices) {
        const headers = [
            'Numéro de facture',
            'Date d\'émission',
            'Client',
            'Email',
            'Montant',
            'Devise',
            'Méthode de paiement',
            'Statut'
        ];

        const rows = invoices.map(invoice => [
            invoice.id,
            this.formatDate(invoice.issuedAt),
            invoice.customerInfo.name || 'Client',
            invoice.customerInfo.email,
            invoice.total,
            invoice.currency,
            this.formatPaymentMethod(invoice.paymentMethod),
            invoice.status
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');

        return csvContent;
    }
}
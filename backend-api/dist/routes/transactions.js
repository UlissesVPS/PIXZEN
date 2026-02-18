"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const database_1 = require("../services/database");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Input validation helpers
const VALID_ACCOUNT_TYPES = ['personal', 'business'];
const VALID_TRANSACTION_TYPES = ['income', 'expense'];
function sanitizeString(val) { return typeof val === 'string' ? val.trim().substring(0, 500) : ''; }
function isValidDate(d) { return d instanceof Date && !isNaN(d.getTime()); }
// All routes require authentication
router.use(auth_1.authMiddleware);
// GET / - list transactions
router.get('/', async (req, res) => {
    try {
        const { account_type, type, start_date, end_date } = req.query;
        const where = { user_id: req.userId };
        if (account_type && VALID_ACCOUNT_TYPES.includes(String(account_type))) {
            where.account_type = String(account_type);
        }
        if (type && VALID_TRANSACTION_TYPES.includes(String(type))) {
            where.type = String(type);
        }
        if (start_date || end_date) {
            where.date = {};
            if (start_date) {
                const sd = new Date(String(start_date));
                if (isValidDate(sd)) where.date.gte = sd;
            }
            if (end_date) {
                const ed = new Date(String(end_date));
                if (isValidDate(ed)) where.date.lte = ed;
            }
        }
        const transactions = await prisma_1.default.transaction.findMany({
            where,
            orderBy: { date: 'desc' },
            take: 500, // pagination limit
        });
        return res.json(transactions);
    }
    catch (error) {
        return res.status(500).json({ error: 'Erro ao buscar transacoes' });
    }
});
// POST / - create transaction
router.post('/', async (req, res) => {
    try {
        const { description, amount, type, category_id, date, account_type, payment_method, card_id, installments, current_installment, installment_group_id, } = req.body;
        if (!description || amount === undefined || !type || !category_id) {
            return res.status(400).json({
                error: 'Descricao, valor, tipo e categoria sao obrigatorios',
            });
        }
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount < 0 || numAmount > 99999999.99) {
            return res.status(400).json({ error: 'Valor invalido' });
        }
        if (!VALID_TRANSACTION_TYPES.includes(type)) {
            return res.status(400).json({ error: 'Tipo deve ser income ou expense' });
        }
        const transaction = await prisma_1.default.transaction.create({
            data: {
                user_id: req.userId,
                description,
                amount,
                type,
                category_id,
                date: date ? new Date(date) : new Date(),
                account_type: account_type || 'personal',
                source: 'web',
                payment_method: payment_method || null,
                card_id: card_id || null,
                installments: installments || null,
                current_installment: current_installment || null,
                installment_group_id: installment_group_id || null,
            },
        });
        return res.status(201).json(transaction);
    }
    catch (error) {
        return res.status(500).json({ error: 'Erro ao criar transacao' });
    }
});
// PUT /:id - update transaction
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const transaction = await prisma_1.default.transaction.findUnique({ where: { id } });
        if (!transaction) {
            return res.status(404).json({ error: 'Transacao nao encontrada' });
        }
        if (transaction.user_id !== req.userId) {
            return res.status(403).json({ error: 'Sem permissao para editar esta transacao' });
        }
        const { description, amount, type, category_id, date, account_type, payment_method, card_id } = req.body;
        const updated = await prisma_1.default.transaction.update({
            where: { id },
            data: {
                ...(description !== undefined && { description }),
                ...(amount !== undefined && { amount }),
                ...(type !== undefined && { type }),
                ...(category_id !== undefined && { category_id }),
                ...(date !== undefined && { date: new Date(date) }),
                ...(account_type !== undefined && { account_type }),
                ...(payment_method !== undefined && { payment_method }),
                ...(card_id !== undefined && { card_id }),
            },
        });
        return res.json(updated);
    }
    catch (error) {
        return res.status(500).json({ error: 'Erro ao atualizar transacao' });
    }
});
// DELETE /:id - delete transaction
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const transaction = await prisma_1.default.transaction.findUnique({ where: { id } });
        if (!transaction) {
            return res.status(404).json({ error: 'Transacao nao encontrada' });
        }
        if (transaction.user_id !== req.userId) {
            return res.status(403).json({ error: 'Sem permissao para deletar esta transacao' });
        }
        await prisma_1.default.transaction.delete({ where: { id } });
        return res.json({ message: 'Transacao deletada com sucesso' });
    }
    catch (error) {
        return res.status(500).json({ error: 'Erro ao deletar transacao' });
    }
});
// GET /summary - monthly summary
router.get('/summary', async (req, res) => {
    try {
        const account_type = req.query.account_type || 'personal';
        const summary = await database_1.databaseService.getMonthSummary(req.userId, account_type);
        return res.json(summary);
    }
    catch (error) {
        return res.status(500).json({ error: 'Erro ao buscar resumo mensal' });
    }
});
exports.default = router;
//# sourceMappingURL=transactions.js.map
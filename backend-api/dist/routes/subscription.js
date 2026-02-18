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
// All routes require authentication
router.use(auth_1.authMiddleware);
// GET /status - check trial/subscription status
router.get('/status', async (req, res) => {
    try {
        const trialStatus = await database_1.databaseService.checkTrialStatus(req.userId);
        const subscription = await prisma_1.default.assinante.findUnique({
            where: { user_id: req.userId },
            select: { plano: true, status: true, data_expiracao: true },
        });
        return res.json({
            ...trialStatus,
            plano: subscription?.plano || 'free',
            status: subscription?.status || 'inactive',
            data_expiracao: subscription?.data_expiracao || null,
        });
    }
    catch (error) {
        return res.status(500).json({ error: 'Erro ao verificar status da assinatura' });
    }
});
// PUT /activate - activate subscription (requires admin or payment token)
router.put('/activate', async (req, res) => {
    try {
        // Only admins can manually activate subscriptions (payment integration pending)
        if (!req.isAdmin) {
            return res.status(403).json({ error: 'Ativacao de assinatura requer pagamento. Integracao de pagamento em breve.' });
        }
        const { userId: targetUserId } = req.body;
        const userToActivate = targetUserId || req.userId;
        const assinante = await prisma_1.default.assinante.update({
            where: { user_id: userToActivate },
            data: { status: 'ativo', data_expiracao: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        });
        return res.json({
            message: 'Assinatura ativada com sucesso',
            assinante,
        });
    }
    catch (error) {
        return res.status(500).json({ error: 'Erro ao ativar assinatura' });
    }
});
exports.default = router;
//# sourceMappingURL=subscription.js.map
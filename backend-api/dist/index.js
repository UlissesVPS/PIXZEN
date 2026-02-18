"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const env_1 = require("./config/env");
const logger_1 = require("./utils/logger");
const uazapi_1 = __importDefault(require("./webhooks/uazapi"));
const auth_1 = __importDefault(require("./routes/auth"));
const transactions_1 = __importDefault(require("./routes/transactions"));
const profile_1 = __importDefault(require("./routes/profile"));
const subscription_1 = __importDefault(require("./routes/subscription"));
const whatsapp_1 = __importDefault(require("./routes/whatsapp"));
const admin_1 = __importDefault(require("./routes/admin"));
const credit_cards_1 = __importDefault(require("./routes/credit-cards"));
const bills_1 = __importDefault(require("./routes/bills"));
const receivables_1 = __importDefault(require("./routes/receivables"));
const reminders_1 = __importDefault(require("./routes/reminders"));
const goals_1 = __importDefault(require("./routes/goals"));
const budgets_1 = __importDefault(require("./routes/budgets"));
const auth_2 = require("./middleware/auth");
const rateLimit = require("express-rate-limit");
let helmet;
try { helmet = require("helmet"); } catch(e) { helmet = null; }

const scheduler_1 = require("./services/scheduler");
const app = (0, express_1.default)();
// Trust proxy (behind Nginx)
app.set('trust proxy', 1);
// Security: Helmet headers
if (helmet) {
    app.use(helmet({
        contentSecurityPolicy: false, // handled by nginx
        crossOriginEmbedderPolicy: false,
    }));
}
// Middlewares
app.use((0, cors_1.default)({
    origin: ['https://app.pixzen.site'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
// Security: Block requests without proper origin/referer for state-changing methods
app.use((req, res, next) => {
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        const origin = req.get('origin') || req.get('referer') || '';
        // Allow webhook callbacks (no origin) and whatsapp-api domain
        if (req.path.includes('/webhook') || req.path.includes('/link')) {
            return next();
        }
        if (origin && !origin.includes('app.pixzen.site') && !origin.includes('whatsapp-api.pixzen.site') && !origin.includes('localhost')) {
            logger_1.logger.warn('CSRF blocked: ' + req.method + ' ' + req.path + ' from ' + origin);
            return res.status(403).json({ error: 'Origem nao permitida' });
        }
    }
    next();
});
// Rate limiting
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: "Muitas requisicoes. Tente novamente em 15 minutos." },
    standardHeaders: true,
    legacyHeaders: false
});
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: "Muitas tentativas de login. Tente novamente em 15 minutos." },
    standardHeaders: true,
    legacyHeaders: false
});
app.use("/api/", generalLimiter);
app.use("/api/auth", authLimiter);

// Log de requisicoes
app.use((req, res, next) => {
    logger_1.logger.debug(`${req.method} ${req.path}`);
    next();
});
// Webhook routes (public - UazAPI callbacks)
app.use('/api', uazapi_1.default);
// Public routes
app.use('/api/auth', auth_1.default);
// Protected routes (require authentication)
app.use('/api/transactions', auth_2.authMiddleware, transactions_1.default);
app.use('/api/profile', auth_2.authMiddleware, profile_1.default);
app.use('/api/subscription', auth_2.authMiddleware, subscription_1.default);
app.use('/api/whatsapp', auth_2.authMiddleware, whatsapp_1.default);
app.use('/api/credit-cards', auth_2.authMiddleware, credit_cards_1.default);
app.use('/api/bills', auth_2.authMiddleware, bills_1.default);
app.use('/api/receivables', auth_2.authMiddleware, receivables_1.default);
app.use('/api/reminders', auth_2.authMiddleware, reminders_1.default);
app.use('/api/goals', auth_2.authMiddleware, goals_1.default);
app.use('/api/budgets', auth_2.authMiddleware, budgets_1.default);
// Admin routes (require authentication + admin role)
app.use('/api/admin', auth_2.authMiddleware, auth_2.adminMiddleware, admin_1.default);
// Static files
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Health check
app.get('/', (req, res) => {
    res.json({
        name: 'PixZen WhatsApp AI',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            webhook: '/api/webhook',
            health: '/api/health',
            status: '/api/status'
        }
    });
});
// 404
app.use((req, res) => {
    res.status(404).json({ error: 'Rota nao encontrada' });
});
// Error handler
app.use((err, req, res, next) => {
    logger_1.logger.error('Erro nao tratado', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
});
// Start server
app.listen(env_1.config.port, () => {
    logger_1.logger.info(`PixZen WhatsApp AI rodando na porta ${env_1.config.port}`);
    logger_1.logger.info(`Webhook URL: http://localhost:${env_1.config.port}/api/webhook`);
    logger_1.logger.info(`Ambiente: ${env_1.config.nodeEnv}`);
    // Initialize scheduled tasks (morning summaries, reminder alerts)
    (0, scheduler_1.initScheduler)();
});
exports.default = app;
//# sourceMappingURL=index.js.map